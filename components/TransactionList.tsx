import React, { useState } from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { Edit2, CheckCircle, Lock, AlertCircle, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { analyzeDeductibility } from '../services/geminiService';

interface TransactionListProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onUpdateTransaction }) => {
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredTransactions = transactions.filter(t => 
    filterType === 'ALL' || t.type === filterType
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm(t);
    setAiAdvice(null);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdateTransaction(editForm as Transaction);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleAnalyze = async () => {
    if (!editForm.description || !editForm.amount) return;
    setIsAnalyzing(true);
    const advice = await analyzeDeductibility(editForm as Transaction);
    setAiAdvice(advice);
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800">Μητρώο Συναλλαγών</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Όλα
          </button>
          <button 
            onClick={() => setFilterType(TransactionType.INCOME)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filterType === TransactionType.INCOME ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Έσοδα
          </button>
          <button 
            onClick={() => setFilterType(TransactionType.EXPENSE)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filterType === TransactionType.EXPENSE ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Έξοδα
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="px-6 py-3">Ημερομηνία</th>
              <th className="px-6 py-3">Πελάτης / Περιγραφή</th>
              <th className="px-6 py-3">Κατάσταση</th>
              <th className="px-6 py-3 text-right">Ποσό (Net)</th>
              <th className="px-6 py-3 text-center">Ενέργεια</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                  {format(new Date(t.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{t.clientName}</div>
                  <div className="text-slate-500 text-xs truncate max-w-[200px]">{t.description}</div>
                  {t.mark && <div className="text-[10px] text-slate-400 mt-1">MARK: {t.mark}</div>}
                </td>
                <td className="px-6 py-4">
                  {t.status === TransactionStatus.OFFICIAL ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Lock size={10} /> Επίσημο
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                      <AlertCircle size={10} /> Έλεγχος
                    </span>
                  )}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}€{t.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  {t.status === TransactionStatus.MANUAL_REVIEW && (
                    <button 
                      onClick={() => handleEditClick(t)}
                      className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Edit Transaction"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {t.status === TransactionStatus.OFFICIAL && (
                    <span className="text-slate-300 flex justify-center"><CheckCircle size={16}/></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Edit2 size={18} /> Επεξεργασία
              </h3>
              <button onClick={() => setEditingId(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ημερομηνία</label>
                  <input 
                    type="date" 
                    value={editForm.date?.split('T')[0]} 
                    onChange={e => setEditForm({...editForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ποσό (€)</label>
                  <input 
                    type="number" 
                    value={editForm.amount} 
                    onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Πελάτης / Προμηθευτής</label>
                <input 
                  type="text" 
                  value={editForm.clientName} 
                  onChange={e => setEditForm({...editForm, clientName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Περιγραφή</label>
                <textarea 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Bot size={14} className="text-indigo-600"/> AI Tax Assistant
                  </span>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Thinking...' : 'Έλεγχος Έκπτωσης Δαπάνης'}
                  </button>
                </div>
                {aiAdvice ? (
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100 shadow-sm">
                    "{aiAdvice}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Κάντε κλικ για να ελέγξετε αν η δαπάνη εκπίπτει φορολογικά.</p>
                )}
              </div>

              <div className="pt-4 flex justify-between items-center">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editForm.status === TransactionStatus.OFFICIAL}
                      onChange={e => setEditForm({...editForm, status: e.target.checked ? TransactionStatus.OFFICIAL : TransactionStatus.MANUAL_REVIEW})}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Σήμανση ως Επίσημο</span>
                 </label>
                 
                 <button 
                  onClick={handleSave}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-medium"
                 >
                   Αποθήκευση
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;