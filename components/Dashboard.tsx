import React, { useState } from 'react';
import { TaxProjection, MonthlyStats } from '../types';
import ThreeDBarChart from './ThreeDBarChart';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Eye, EyeOff } from 'lucide-react';

interface DashboardProps {
  projection: TaxProjection;
  monthlyStats: MonthlyStats[];
}

const Dashboard: React.FC<DashboardProps> = ({ projection, monthlyStats }) => {
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);

  return (
    <div className="space-y-6">
      
      {/* 3D Projection Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp size={120} />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end relative z-10">
                <div>
                    <h2 className="text-slate-500 font-medium text-sm tracking-wide uppercase mb-1">Προβλεψη Φορου ({projection.year})</h2>
                    <div className="text-5xl sm:text-7xl font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                          €{projection.estimatedTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                    </div>
                    <p className="mt-2 text-slate-500 text-sm max-w-md">
                        Πηγή: AADE & Manual Reviews.
                        <br/>20% + Προκαταβολή + Τέλος Επιτηδεύματος.
                    </p>
                </div>

                <div className="mt-6 md:mt-0 flex gap-6">
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Φορολογητεα Κερδη</div>
                        <div className="text-xl font-bold text-slate-700">€{projection.taxableIncome.toLocaleString()}</div>
                    </div>
                     <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Εγγραφες</div>
                        <div className="text-xl font-bold text-slate-700">{projection.incomeCount + projection.expenseCount}</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Graph Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md"><Wallet size={18}/></span>
                Ταμειακές Ροές (3D)
            </h3>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <button 
                    onClick={() => setShowIncome(!showIncome)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showIncome ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 text-slate-400'}`}
                >
                    {showIncome ? <Eye size={14}/> : <EyeOff size={14}/>}
                    Έσοδα
                </button>
                 <button 
                    onClick={() => setShowExpenses(!showExpenses)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showExpenses ? 'bg-rose-100 text-rose-800 ring-2 ring-rose-500/20' : 'bg-slate-50 text-slate-400'}`}
                >
                     {showExpenses ? <Eye size={14}/> : <EyeOff size={14}/>}
                    Έξοδα
                </button>
            </div>
        </div>

        <ThreeDBarChart data={monthlyStats} showIncome={showIncome} showExpenses={showExpenses} />

        <div className="grid grid-cols-2 gap-4 mt-6">
            <div className={`p-4 rounded-xl border transition-all duration-500 ${showIncome ? 'bg-emerald-50/50 border-emerald-100' : 'opacity-50 bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-medium text-sm">
                    <ArrowUpRight size={16} /> Σύνολο Εσόδων
                </div>
                <div className="text-2xl font-bold text-slate-800">€{projection.totalIncome.toLocaleString()}</div>
            </div>
            <div className={`p-4 rounded-xl border transition-all duration-500 ${showExpenses ? 'bg-rose-50/50 border-rose-100' : 'opacity-50 bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-2 text-rose-700 font-medium text-sm">
                    <ArrowDownRight size={16} /> Σύνολο Εξόδων
                </div>
                <div className="text-2xl font-bold text-slate-800">€{projection.totalExpenses.toLocaleString()}</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;