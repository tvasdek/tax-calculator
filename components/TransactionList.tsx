import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
}

const ITEMS_PER_PAGE = 10; // Reduced from 20 to fit one screen

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onUpdateTransaction 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Track when user last visited to highlight new transactions
  const [lastVisitTime, setLastVisitTime] = useState<number>(() => {
    const stored = localStorage.getItem('taxpulse_last_visit');
    return stored ? parseInt(stored) : Date.now();
  });

  // Update last visit time on mount
  useEffect(() => {
    const now = Date.now();
    localStorage.setItem('taxpulse_last_visit', now.toString());
    
    // Keep the previous visit time for 5 seconds to show highlights
    const timer = setTimeout(() => {
      setLastVisitTime(now);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      try {
        const date = new Date(t.date + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          const monthYear = date.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });
          months.add(monthYear);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    return Array.from(months).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by month
      if (selectedMonth !== 'all') {
        try {
          const date = new Date(t.date + 'T00:00:00');
          const monthYear = date.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });
          if (monthYear !== selectedMonth) return false;
        } catch (e) {
          return false;
        }
      }

      // Filter by type
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Filter by status
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

      return true;
    });
  }, [transactions, selectedMonth, selectedType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedType, selectedStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('el-GR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Check if transaction is new (marked by dataService)
  const isNewTransaction = (transaction: any) => {
    return transaction.isNew === true;
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const styles = {
      [TransactionStatus.OFFICIAL]: 'bg-blue-100 text-blue-700 border-blue-200',
      [TransactionStatus.MANUAL_REVIEW]: 'bg-amber-100 text-amber-700 border-amber-200',
    };

    const labels = {
      [TransactionStatus.OFFICIAL]: '⚡ Επίσημο',
      [TransactionStatus.MANUAL_REVIEW]: '⚠ Έλεγχος',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type: TransactionType) => {
    if (type === TransactionType.INCOME) {
      return (
        <span className="inline-flex items-center text-emerald-600 text-sm font-medium">
          ↑ Έσοδα
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-rose-600 text-sm font-medium">
        ↑ Έξοδα
        </span>
    );
  };

  const handleEdit = (transaction: Transaction) => {
    if (transaction.status === TransactionStatus.MANUAL_REVIEW) {
      setEditingTransaction(transaction);
    }
  };

  const handleSave = () => {
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const handleCancel = () => {
    setEditingTransaction(null);
  };

  return (
    <>
      {/* Custom CSS for frame animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), 
                        0 0 20px rgba(99, 102, 241, 0.1),
                        inset 0 0 0 1px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25), 
                        0 0 30px rgba(99, 102, 241, 0.2),
                        inset 0 0 0 1px rgba(99, 102, 241, 0.4);
          }
        }
        .frame-highlight {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="h-full flex flex-col p-4 md:p-8 bg-slate-50">
      {/* Header with Title and Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">📋 Μητρώο Συναλλαγών</h2>
          <p className="text-slate-500 mt-1">
            Διαχείριση και επισκόπηση όλων των συναλλαγών
          </p>
        </div>
        
        {/* Actions - You can add refresh button here if needed */}
        <div className="flex items-center gap-2">
          {/* Placeholder for actions like refresh, export, etc. */}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Όλοι οι μήνες</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Όλα τα είδη</option>
            <option value={TransactionType.INCOME}>Έσοδα</option>
            <option value={TransactionType.EXPENSE}>Έξοδα</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value={TransactionStatus.OFFICIAL}>Επίσημο</option>
            <option value={TransactionStatus.MANUAL_REVIEW}>Έλεγχος</option>
          </select>

          <div className="ml-auto text-sm text-slate-500">
            {filteredTransactions.length} συναλλαγές
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col mb-4">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ΗΜΕΡΟΜΗΝΙΑ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ΠΕΛΑΤΗΣ / ΠΕΡΙΓΡΑΦΗ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ΚΑΤΑΣΤΑΣΗ
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ΠΟΣΟ (NET)
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ΕΝΕΡΓΕΙΑ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-slate-400">
                      <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">Δεν βρέθηκαν συναλλαγές</p>
                      <p className="text-sm mt-1">Δοκιμάστε να αλλάξετε τα φίλτρα</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => {
                  const isNew = isNewTransaction(transaction);
                  
                  return (
                    <tr 
                      key={transaction.id}
                      className={`transition-all ${
                        isNew 
                          ? 'bg-indigo-50/80 border-2 border-indigo-400 frame-highlight' 
                          : 'border-b border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-500 text-white animate-pulse">
                              ΝΕΟ
                            </span>
                          )}
                          <div className="text-sm font-medium text-slate-900">
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTypeBadge(transaction.type)}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {transaction.clientName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {transaction.description}
                            </div>
                            {transaction.mark && (
                              <div className="text-xs text-slate-400 mt-1 font-mono">
                                MARK: {transaction.mark}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-semibold ${
                          transaction.type === TransactionType.INCOME 
                            ? 'text-emerald-600' 
                            : 'text-rose-600'
                        }`}>
                          {transaction.type === TransactionType.INCOME ? '+' : '-'}
                          {formatCurrency(transaction.grossAmount)}
                        </div>
                        {transaction.vatAmount > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            ΦΠΑ: {formatCurrency(transaction.vatAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {transaction.status === TransactionStatus.MANUAL_REVIEW ? (
                          <button 
                            className="text-rose-600 hover:text-rose-800 text-lg"
                            onClick={() => handleEdit(transaction)}
                            title="Επεξεργασία"
                          >
                            ✏️
                          </button>
                        ) : (
                          <span className="text-slate-300 text-lg" title="Επίσημο - Δεν μπορεί να επεξεργαστεί">
                            ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Fixed for mobile */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-slate-600">
                Σελίδα {currentPage} από {totalPages} 
                <span className="mx-2">•</span>
                {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} από {filteredTransactions.length}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg border transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 hover:bg-white text-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                ✏️ Επεξεργασία
              </h3>
              <button 
                onClick={handleCancel}
                className="hover:bg-indigo-700 rounded-lg p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ημερομηνία
                </label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    date: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ποσό (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransaction.grossAmount}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    grossAmount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Πελάτης / Προμηθευτής
                </label>
                <input
                  type="text"
                  value={editingTransaction.clientName}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    clientName: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Περιγραφή
                </label>
                <textarea
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Mark as Official Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="markOfficial"
                  checked={editingTransaction.status === TransactionStatus.OFFICIAL}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    status: e.target.checked ? TransactionStatus.OFFICIAL : TransactionStatus.MANUAL_REVIEW
                  })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="markOfficial" className="text-sm text-slate-600">
                  Σήμανση ως Επίσημο
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TransactionList;
