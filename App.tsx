import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TaxProjection, MonthlyStats, ViewState, TransactionStatus, TransactionType } from './types';
import { CURRENT_YEAR } from './constants';
import { getStoredTransactions } from './services/dataService';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import { LayoutDashboard, Receipt, Bell, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

// Greek O.E. Tax Constants for 2026
const TAX_RATE = 0.20; // 20% tax rate for O.E.
const TELOS_EPITIDEUMATOS = 800; // €800 fixed annual fee
const ADVANCE_PAYMENT_RATE = 0.80; // 80% advance payment for next year (updated for 2026)

function App() {
  const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'action'}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load transactions (both expenses AND income) from n8n
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        console.log('🚀 Loading all transactions (income + expenses) from n8n...');
        const data = await getStoredTransactions('oe-user');
        console.log('✅ Loaded transactions:', data.length);
        console.log('📊 Income:', data.filter(t => t.type === TransactionType.INCOME).length);
        console.log('📊 Expenses:', data.filter(t => t.type === TransactionType.EXPENSE).length);
        setTransactions(data);
      } catch (error) {
        console.error('❌ Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // --- Tax Projection with Greek O.E. Formula (2026 rates) ---
  // Formula: (Income - Expenses) × 20% + Advance Payment (80%) + €800 Telos Epitideumatos
  const projection: TaxProjection = useMemo(() => {
    const income = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.grossAmount, 0);
    
    const expenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.grossAmount, 0);
    
    const taxableIncome = Math.max(0, income - expenses);
    
    // Calculate tax components
    const currentYearTax = taxableIncome * TAX_RATE; // 20% tax
    const advancePayment = currentYearTax * ADVANCE_PAYMENT_RATE; // 80% advance
    const totalTax = currentYearTax + advancePayment + TELOS_EPITIDEUMATOS;
    
    return {
        year: CURRENT_YEAR,
        totalIncome: income,
        totalExpenses: expenses,
        taxableIncome: taxableIncome,
        estimatedTax: totalTax, // Total tax liability
        currentYearTax: currentYearTax, // Current year 20% tax
        advancePayment: advancePayment, // 80% advance for next year
        telosEpitideumatos: TELOS_EPITIDEUMATOS, // €800 fixed fee
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
            // Parse the date (should already be in YYYY-MM-DD format from normalizeDate)
            let dateObj: Date;
            
            // If date is in YYYY-MM-DD format, parse it correctly
            if (/^\d{4}-\d{2}-\d{2}/.test(t.date)) {
                dateObj = new Date(t.date + 'T00:00:00'); // Add time to avoid timezone issues
            } else {
                dateObj = new Date(t.date);
            }
            
            // Check if date is valid
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

  // Update handler
  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // Show loading state
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
                    <div className="flex justify-between"><span>Last Update:</span> <span>Just now</span></div>
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
                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 bg-slate-50 border-b border-slate-100 font-medium text-sm text-slate-600">
                                Notifications
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-indigo-50/50 transition-colors flex gap-3">
                                            <div className="mt-1 text-indigo-500"><Plus size={14}/></div>
                                            <div>
                                                <p className="text-sm text-slate-700">{n.message}</p>
                                                <span className="text-xs text-slate-400">Just now</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={() => setNotifications([])}
                                    className="w-full py-2 text-xs text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
                                >
                                    Mark all as read
                                </button>
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
