import React from 'react';
import { TaxProjection, MonthlyStats } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  projection: TaxProjection;
  monthlyStats: MonthlyStats[];
}

const Dashboard: React.FC<DashboardProps> = ({ projection, monthlyStats }) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate net profit for the indicator
  const netProfit = projection.totalIncome - projection.totalExpenses;
  const isProfitable = netProfit > 0;

  // Check if we have any data in monthly stats
  const hasData = monthlyStats.some(m => m.income > 0 || m.expenses > 0);
  
  // Debug log
  console.log('📊 Dashboard monthlyStats:', monthlyStats);
  console.log('📊 Has data:', hasData);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">
          ΠΡΟΒΛΕΨΗ ΦΟΡΟΥ ({projection.year})
        </h2>
        <p className="text-slate-500 mt-1">
          Πηγή: AADE & Manual Reviews.
        </p>
      </div>

      {/* Tax Summary Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold opacity-90">Εκτιμώμενος Φόρος</h3>
          <DollarSign className="opacity-75" size={24} />
        </div>
        <div className="text-5xl font-bold mb-6">
          {formatCurrency(projection.estimatedTax)}
        </div>
        
        {/* Tax Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
          <div>
            <p className="text-sm opacity-75 mb-1">Φόρος (20%)</p>
            <p className="text-xl font-semibold">
              {formatCurrency(projection.currentYearTax || (projection.taxableIncome * 0.20))}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Προκαταβολή (80%)</p>
            <p className="text-xl font-semibold">
              {formatCurrency(projection.advancePayment || (projection.taxableIncome * 0.20 * 0.80))}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Τέλος Επιτηδεύματος</p>
            <p className="text-xl font-semibold">
              {formatCurrency(projection.telosEpitideumatos || 800)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">ΕΣΟΔΑ</span>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {formatCurrency(projection.totalIncome)}
          </p>
          <p className="text-sm text-slate-500">
            {projection.incomeCount} έσοδα
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">ΔΑΠΑΝΕΣ</span>
            <Receipt className="text-rose-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {formatCurrency(projection.totalExpenses)}
          </p>
          <p className="text-sm text-slate-500">
            {projection.expenseCount} έξοδα
          </p>
        </div>

        {/* Net Profit */}
        <div className={`rounded-2xl p-6 shadow-lg border ${
          isProfitable 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">ΚΑΘΑΡΑ ΚΕΡΔΗ</span>
            {isProfitable ? (
              <TrendingUp className="text-emerald-600" size={20} />
            ) : (
              <TrendingDown className="text-rose-600" size={20} />
            )}
          </div>
          <p className={`text-3xl font-bold mb-1 ${
            isProfitable ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {formatCurrency(netProfit)}
          </p>
          <p className="text-sm text-slate-600">
            Έσοδα - Δαπάνες
          </p>
        </div>
      </div>

      {/* Monthly Cash Flow Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Γράφημα εσόδων - εξόδων</h3>
            <p className="text-sm text-slate-500 mt-1">μηνιαία σύγκριση</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Έσοδα</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-slate-600">Έξοδα</span>
            </div>
          </div>
        </div>

        {/* Check if we have data */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="income" 
                name="Έσοδα" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                name="Έξοδα" 
                fill="#ef4444" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Δεν υπάρχουν δεδομένα</p>
            <p className="text-sm mt-2">Οι συναλλαγές θα εμφανιστούν εδώ όταν φορτωθούν</p>
            <p className="text-xs mt-4 text-slate-500">
              Debug: {monthlyStats.length} months, Income count: {projection.incomeCount}, Expense count: {projection.expenseCount}
            </p>
          </div>
        )}
      </div>

      {/* Tax Formula Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-indigo-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-indigo-900 mb-2">
              Τύπος Υπολογισμού Φόρου για Ο.Ε.
            </h4>
            <p className="text-sm text-indigo-800 leading-relaxed">
              (Έσοδα - Έξοδα) × 20% + Προκαταβολή Επόμενου Έτους (80%) + Τέλος Επιτηδεύματος (€800)
            </p>
            <div className="mt-3 p-3 bg-white rounded-lg text-xs text-slate-600 space-y-1">
              <div>• <strong>Φορολογητέο Εισόδημα:</strong> {formatCurrency(projection.taxableIncome)}</div>
              <div>• <strong>Συντελεστής Φόρου:</strong> 20%</div>
              <div>• <strong>Συντελεστής Προκαταβολής:</strong> 80% (2026)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
