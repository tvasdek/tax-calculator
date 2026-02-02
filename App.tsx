import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TaxProjection, MonthlyStats, ViewState, TransactionStatus, TransactionType } from './types';
import { CURRENT_YEAR } from './constants';
import { getStoredTransactions } from './services/dataService';
import {
  Notification,
  loadNotifications,
  addNotification,
  markAllAsRead,
  clearAllNotifications,
  createNotificationFromTransaction,
  requestNotificationPermission,
  manualRefresh,
} from './services/notificationService';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import { LayoutDashboard, Receipt, Bell, CheckCircle2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

// Greek O.E. Tax Constants for 2026
const TAX_RATE = 0.20;
const TELOS_EPITIDEUMATOS = 800;
const ADVANCE_PAYMENT_RATE = 0.80;

function App() {
  const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Use ref to prevent double-loading in StrictMode
  const hasLoadedRef = useRef(false);
  const hourlyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load transactions on mount and set up hourly auto-refresh
  useEffect(() => {
    // Prevent double-loading in React StrictMode
    if (hasLoadedRef.current) {
      console.log('⏭️ Skipping duplicate load (React StrictMode)');
      return;
    }
    hasLoadedRef.current = true;

    const loadTransactions = async () => {
      try {
        console.log('🚀 Loading all transactions (income + expenses) from n8n...');
        const data = await getStoredTransactions('oe-user');
        console.log('✅ Loaded transactions:', data.length);
        console.log('📊 Income:', data.filter(t => t.type === TransactionType.INCOME).length);
        console.log('📊 Expenses:', data.filter(t => t.type === TransactionType.EXPENSE).length);
        setTransactions(data);
        
        // Load saved notifications
        const savedNotifications = loadNotifications();
        setNotifications(savedNotifications);
        
        // Request notification permission on first load
        requestNotificationPermission();
      } catch (error) {
        console.error('❌ Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load immediately on mount
    loadTransactions();

    // Set up automatic refresh every hour (3600000 ms)
    hourlyIntervalRef.current = setInterval(() => {
      console.log('⏰ Hourly auto-refresh triggered');
      handleManualRefresh();
    }, 3600000); // 1 hour = 60 * 60 * 1000 ms

    // Cleanup interval on unmount
    return () => {
      if (hourlyIntervalRef.current) {
        clearInterval(hourlyIntervalRef.current);
        hourlyIntervalRef.current = null;
        console.log('🧹 Cleaned up auto-refresh interval');
      }
    };
  }, []); // Empty array = setup once only

  // Manual refresh handler
  const handleManualRefresh = async () => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('No webhook URL configured');
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (refreshing) {
      console.log('⏸️ Refresh already in progress, skipping');
      return;
    }

    setRefreshing(true);
    try {
      const { transactions: newTransactions, newCount, newTransactions: brandNew } = await manualRefresh(
        transactions,
        webhookUrl
      );

      console.log(`📊 Refresh result: ${newCount} new of ${newTransactions.length} total`);

      // Update transactions
      setTransactions(newTransactions);

      // Create notifications for new transactions
      if (newCount > 0 && brandNew.length > 0) {
        console.log(`🎉 Creating notifications for ${brandNew.length} new transactions`);
        
        brandNew.forEach(tx => {
          const notification = createNotificationFromTransaction(tx);
          const updated = addNotification(notification);
          setNotifications(updated);
        });
      } else {
        console.log('✅ No new transactions found');
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Tax Projection
  const projection: TaxProjection = useMemo(() => {
    const income = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.grossAmount, 0);
    
    const expenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.grossAmount, 0);
    
    const taxableIncome = Math.max(0, income - expenses);
    const currentYearTax = taxableIncome * TAX_RATE;
    const advancePayment = currentYearTax * ADVANCE_PAYMENT_RATE;
    const totalTax = currentYearTax + advancePayment + TELOS_EPITIDEUMATOS;
    
    return {
        year: CURRENT_YEAR,
        totalIncome: income,
        totalExpenses: expenses,
        taxableIncome: taxableIncome,
        estimatedTax: totalTax,
        currentYearTax: currentYearTax,
        advancePayment: advancePayment,
        telosEpitideumatos: TELOS_EPITIDEUMATOS,
        incomeCount: transactions.filter(t => t.type === TransactionType.INCOME).length,
        expenseCount: transactions.filter(t => t.type === TransactionType.EXPENSE).length
    };
  }, [transactions]);

  const monthlyStats: MonthlyStats[] = useMemo(() => {
    const stats: Record<string, MonthlyStats> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(m => {
        stats[m] = { month: m, income: 0, expenses: 0 };
    });

    transactions.forEach(t => {
        try {
            let dateObj: Date;
            
            if (/^\d{4}-\d{2}-\d{2}/.test(t.date)) {
                dateObj = new Date(t.date + 'T00:00:00');
            } else {
                dateObj = new Date(t.date);
            }
            
            if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date:', t.date);
                return;
            }
            
            const m = format(dateObj, 'MMM');
            if (stats[m]) {
                if (t.type === TransactionType.INCOME) stats[m].income += t.grossAmount;
                else stats[m].expenses += t.grossAmount;
            }
        } catch (e) {
            console.warn('Failed to format date:', t.date, e);
        }
    });

    return Object.values(stats);
  }, [transactions]);

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleClearNotifications = () => {
    const cleared = clearAllNotifications();
    setNotifications(cleared);
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Φόρτωση δεδομένων από n8n...</p>
          <p className="text-slate-400 text-sm mt-2">Ανάγνωση εσόδων και εξόδων από Google Sheets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col fixed md:relative bottom-0 md:h-screen z-50 order-2 md:order-1">
        <div className="p-6 hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                TaxPulse OE
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time Tax Calculator</p>
        </div>

        <nav className="flex-1 px-4 py-2 md:py-6 space-y-1 md:space-y-2 flex md:flex-col justify-around md:justify-start">
            <button 
                onClick={() => setViewState('DASHBOARD')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${viewState === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <LayoutDashboard size={20} />
                <span className="font-medium">Dashboard</span>
            </button>
             <button 
                onClick={() => setViewState('TRANSACTIONS')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${viewState === 'TRANSACTIONS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Receipt size={20} />
                <span className="font-medium">Transactions</span>
                {transactions.filter(t => t.status === TransactionStatus.MANUAL_REVIEW).length > 0 && (
                    <span className="bg-amber-500 text-xs font-bold px-2 py-0.5 rounded-full ml-auto text-slate-900">
                        {transactions.filter(t => t.status === TransactionStatus.MANUAL_REVIEW).length}
                    </span>
                )}
            </button>
        </nav>

        <div className="p-4 mt-auto hidden md:block">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase">System Status</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between"><span>AADE Sync:</span> <span className="text-emerald-400">Online</span></div>
                    <div className="flex justify-between"><span>Email Bot:</span> <span className="text-emerald-400">Active</span></div>
                    <div className="flex justify-between"><span>Auto-refresh:</span> <span className="text-emerald-400">Hourly</span></div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden order-1 md:order-2">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
             <div className="md:hidden font-bold text-slate-800">TaxPulse OE</div>
             
             <div className="flex items-center gap-4 ml-auto">
                {/* Manual Refresh Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className={`p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative ${
                    refreshing ? 'cursor-not-allowed' : ''
                  }`}
                  title="Ανανέωση Συναλλαγών"
                >
                  <RefreshCw 
                    size={20} 
                    className={refreshing ? 'animate-spin text-indigo-600' : ''}
                  />
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                        title="Ειδοποιήσεις"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full text-white text-xs font-bold flex items-center justify-center px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 bg-slate-50 border-b border-slate-100 font-medium text-sm text-slate-600 flex items-center justify-between">
                                <span>Ειδοποιήσεις</span>
                                {unreadCount > 0 && (
                                    <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                                        {unreadCount} νέα
                                    </span>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Δεν υπάρχουν ειδοποιήσεις</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                                                !n.read ? 'bg-indigo-50/30' : ''
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {n.transaction?.type === TransactionType.INCOME ? (
                                                        <span className="text-emerald-500 text-lg">💰</span>
                                                    ) : (
                                                        <span className="text-rose-500 text-lg">💳</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                                                        {n.message}
                                                    </p>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(n.timestamp).toLocaleString('el-GR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 bg-slate-50 border-t border-slate-100 flex gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllRead}
                                            className="flex-1 py-2 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded transition-colors"
                                        >
                                            Σήμανση όλων ως αναγνωσμένα
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleClearNotifications}
                                        className="flex-1 py-2 text-xs text-slate-500 font-medium hover:bg-slate-100 rounded transition-colors"
                                    >
                                        Καθαρισμός όλων
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                    OE
                </div>
             </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
            <div className="max-w-6xl mx-auto h-full">
                {viewState === 'DASHBOARD' && (
                    <div className="animate-in fade-in duration-500">
                        <Dashboard projection={projection} monthlyStats={monthlyStats} />
                    </div>
                )}
                {viewState === 'TRANSACTIONS' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TransactionList transactions={transactions} onUpdateTransaction={handleUpdateTransaction} />
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
