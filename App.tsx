import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TaxProjection, MonthlyStats, ViewState, TransactionStatus, TransactionType } from './types';
import { MOCK_TRANSACTIONS, TAX_RATE, CURRENT_YEAR } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import { LayoutDashboard, Receipt, Bell, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

function App() {
  const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'action'}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- Logic to compute Projection based on current Transactions ---
  const projection: TaxProjection = useMemo(() => {
    const income = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const taxable = Math.max(0, income - expenses);
    
    return {
        year: CURRENT_YEAR,
        totalIncome: income,
        totalExpenses: expenses,
        taxableIncome: taxable,
        estimatedTax: taxable * TAX_RATE,
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
        const d = new Date(t.date);
        const m = format(d, 'MMM');
        if (stats[m]) {
            if (t.type === TransactionType.INCOME) stats[m].income += t.amount;
            else stats[m].expenses += t.amount;
        }
    });

    return Object.values(stats);
  }, [transactions]);


  // --- Simulation of New Data Arriving (e.g. from n8n) ---
  useEffect(() => {
    const timer = setTimeout(() => {
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            clientName: 'New Client Alert',
            description: 'Incoming transfer detected via AADE',
            amount: 1500,
            vatAmount: 360,
            grossAmount: 1860,
            type: TransactionType.INCOME,
            status: TransactionStatus.OFFICIAL
        };

        setNotifications(prev => [
            ...prev, 
            { id: Date.now().toString(), message: `New Official Income: €${newTx.amount} from ${newTx.clientName}`, type: 'info' }
        ]);
        
        // Add to list
        setTransactions(prev => [newTx, ...prev]);
    }, 5000); // Simulate event after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Update handler
  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

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