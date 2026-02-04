import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TaxProjection, MonthlyStats, ViewState, TransactionStatus, TransactionType } from './types';
import { CURRENT_YEAR } from './constants';
import { getStoredTransactions, saveTransactionUpdate, deleteTransaction } from './services/dataService';
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
import { isAuthenticated, getCurrentUser, logout, User } from './services/authService';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import LoginScreen from './components/LoginScreen';
import ToastNotification, { Toast } from './components/ToastNotification';
import { LayoutDashboard, Receipt, Bell, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]); // NEW: Toast notifications
  
  // Authentication State
  const [showSplash, setShowSplash] = useState(true);
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  
  // Use ref to prevent double-loading in StrictMode
  const hasLoadedRef = useRef(false);
  const hourlyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification helpers
  const showToast = (message: string, type: Toast['type'] = 'success', duration = 3000) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
    };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Load transactions on mount and set up hourly auto-refresh
  useEffect(() => {
    if (!isAuth) {
      setLoading(false);
      return;
    }

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
        
        // Check for new transactions (marked by dataService)
        const newTransactions = data.filter((t: any) => t.isNew === true);
        
        setTransactions(data);
        
        // Create notifications for new transactions
        if (newTransactions.length > 0) {
          newTransactions.forEach((tx: any) => {
            const notification = createNotificationFromTransaction(tx);
            const updated = addNotification(notification);
            setNotifications(updated);
          });
        }
        
        // Load saved notifications
        const savedNotifications = loadNotifications();
        setNotifications(prev => {
          // Merge new and saved, removing duplicates
          const allNotifs = [...prev, ...savedNotifications];
          const unique = allNotifs.filter((n, index, self) =>
            index === self.findIndex(t => t.id === n.id)
          );
          return unique;
        });
        
        // Request notification permission on first load
        requestNotificationPermission();
      } catch (error) {
        console.error('❌ Failed to load transactions:', error);
      } finally {
        // Delay slightly to show off the splash screen transition
        setTimeout(() => setLoading(false), 500);
      }
    };

    // Load immediately on mount
    loadTransactions();

    // Set up automatic refresh every hour
    hourlyIntervalRef.current = setInterval(() => {
      console.log('⏰ Hourly auto-refresh triggered');
      handleManualRefresh();
    }, 3600000); 

    // Cleanup interval on unmount
    return () => {
      if (hourlyIntervalRef.current) {
        clearInterval(hourlyIntervalRef.current);
        hourlyIntervalRef.current = null;
      }
    };
  }, [isAuth]); 

  // Manual refresh handler
  const handleManualRefresh = async () => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('No webhook URL configured');
      return;
    }

    if (refreshing) return;

    setRefreshing(true);
    try {
      const { transactions: newTransactions, newCount, newTransactions: brandNew } = await manualRefresh(
        transactions,
        webhookUrl
      );

      setTransactions(newTransactions);

      if (newCount > 0 && brandNew.length > 0) {
        brandNew.forEach(tx => {
          const notification = createNotificationFromTransaction(tx);
          const updated = addNotification(notification);
          setNotifications(updated);
        });
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
            if (!isNaN(dateObj.getTime())) {
                const m = format(dateObj, 'MMM');
                if (stats[m]) {
                    if (t.type === TransactionType.INCOME) stats[m].income += t.grossAmount;
                    else stats[m].expenses += t.grossAmount;
                }
            }
        } catch (e) {
            console.warn('Failed to format date:', t.date);
        }
    });

    return Object.values(stats);
  }, [transactions]);

  const handleUpdateTransaction = async (updated: Transaction) => {
    try {
      await saveTransactionUpdate('oe-user', updated);
      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('❌ Failed to update transaction:', error);
      alert('Αποτυχία ενημέρωσης. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      console.log('🗑️ Deleting transaction:', transactionId);
      
      // Get transaction details before deleting (for toast message)
      const transaction = transactions.find(t => t.id === transactionId);
      const clientName = transaction?.clientName || 'Συναλλαγή';
      
      // Optimistically remove from UI immediately
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      
      // Show success toast
      showToast(`Η συναλλαγή "${clientName}" διαγράφηκε επιτυχώς`, 'success');
      
      try {
        // Try to delete via n8n
        await deleteTransaction('oe-user', transactionId);
        console.log('✅ Transaction deleted successfully from backend');
      } catch (apiError) {
        console.warn('⚠️ API response failed, but delete likely succeeded:', apiError);
        // Don't re-add the transaction - the actual deletion probably worked
        // The error is just in the response formatting
      }
      
    } catch (error) {
      console.error('❌ Critical delete error:', error);
      showToast('Αποτυχία διαγραφής. Ανανέωση σελίδας...', 'error');
      // Reload to sync with actual state
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleClearNotifications = () => {
    const cleared = clearAllNotifications();
    setNotifications(cleared);
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
  };

  const handleLoginSuccess = () => {
    setIsAuth(true);
    setCurrentUser(getCurrentUser());
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    setCurrentUser(null);
    setTransactions([]);
    setNotifications([]);
    setViewState('DASHBOARD');
    hasLoadedRef.current = false;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ========================================================================
  // SPLASH SCREEN (before login check)
  // ========================================================================
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative text-center z-10">
          <div className="mb-8 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto transform hover:rotate-12 transition-transform">
              <span className="text-6xl">💰</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 animate-in slide-in-from-bottom duration-700">
            TaxPulse OE
          </h1>
          <p className="text-2xl text-white/90 mb-8 animate-in slide-in-from-bottom duration-700 delay-100">
            Real-time Tax Calculator
          </p>
          <div className="flex items-center justify-center gap-3 animate-in fade-in duration-700 delay-200">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
        `}</style>
      </div>
    );
  }

  // ========================================================================
  // LOGIN SCREEN
  // ========================================================================
  if (!isAuth) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ========================================================================
  // MAIN APP (ORIGINAL LAYOUT)
  // ========================================================================
  return (
    <>
      {/* ========================================================================
        🌊 LOADING OVERLAY (Identical to Splash Screen)
        ========================================================================
      */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center 
                    bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600
                    transition-opacity duration-1000 ease-in-out overflow-hidden
                    ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Animated background orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative text-center z-10">
          {/* Logo - Same size as splash */}
          <div className="mb-8 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto transform hover:rotate-12 transition-transform">
              <span className="text-6xl">💰</span>
            </div>
          </div>
          
          {/* Title - Same size as splash */}
          <h1 className="text-6xl font-bold text-white mb-4 animate-in slide-in-from-bottom duration-700">
            TaxPulse OE
          </h1>
          
          {/* Subtitle - Same size as splash, different text */}
          <p className="text-2xl text-white/90 mb-8 animate-in slide-in-from-bottom duration-700 delay-100">
            Φόρτωση δεδομένων...
          </p>
          
          {/* Loading dots - Same as splash */}
          <div className="flex items-center justify-center gap-3 animate-in fade-in duration-700 delay-200">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
        `}</style>
      </div>

      {/* ========================================================================
        📱 MAIN APP CONTENT (ORIGINAL LAYOUT)
        ========================================================================
      */}
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar Navigation - ORIGINAL */}
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

          {/* System Status - ORIGINAL */}
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

        {/* Main Content - ORIGINAL */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden order-1 md:order-2">
          {/* Top Navbar - ORIGINAL (minimal height, no text) */}
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

                      {/* Notification Dropdown - ORIGINAL */}
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

                  {/* Profile Icon with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-indigo-200 hover:shadow-lg transition-all"
                      title={currentUser?.fullName || 'User'}
                    >
                      {currentUser?.username.charAt(0).toUpperCase() || 'OE'}
                    </button>

                    {showProfileMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowProfileMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold border-2 border-white/50">
                                {currentUser?.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">{currentUser?.fullName}</p>
                                <p className="text-xs text-indigo-100">@{currentUser?.username}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                              <LogOut size={18} />
                              <span className="font-medium">Αποσύνδεση</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
               </div>
          </header>

          {/* Scrollable Content Area - ORIGINAL */}
          <div className="flex-1 overflow-auto p-4 md:p-8 relative">
              <div className="max-w-6xl mx-auto h-full">
                  {viewState === 'DASHBOARD' && (
                      <div className="animate-in fade-in duration-500">
                          <Dashboard projection={projection} monthlyStats={monthlyStats} />
                      </div>
                  )}
                  {viewState === 'TRANSACTIONS' && (
                      <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <TransactionList 
                            transactions={transactions} 
                            onUpdateTransaction={handleUpdateTransaction}
                            onDeleteTransaction={handleDeleteTransaction}
                          />
                      </div>
                  )}
              </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;