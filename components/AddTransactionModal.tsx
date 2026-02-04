import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { TransactionType, TransactionStatus } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: NewTransactionData) => void;
}

export interface NewTransactionData {
  date: string; // YYYY-MM-DD
  clientName: string;
  description: string;
  grossAmount: number;
  vatAmount: number;
  type: TransactionType;
  afm?: string;
  status: TransactionStatus;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<NewTransactionData>({
    date: new Date().toISOString().split('T')[0], // Today's date
    clientName: '',
    description: '',
    grossAmount: 0,
    vatAmount: 0,
    type: TransactionType.EXPENSE,
    afm: '',
    status: TransactionStatus.MANUAL_REVIEW,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Η ημερομηνία είναι υποχρεωτική';
    }
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Το όνομα πελάτη είναι υποχρεωτικό';
    }
    if (formData.grossAmount <= 0) {
      newErrors.grossAmount = 'Το ποσό πρέπει να είναι μεγαλύτερο από 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAdd(formData);
      onClose();
    }
  };

  const handleGrossAmountChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      grossAmount: value,
      // Auto-calculate net (grossAmount - VAT)
      vatAmount: prev.vatAmount,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Plus className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Νέα Συναλλαγή</h3>
              <p className="text-sm text-slate-500">Προσθήκη χειροκίνητης καταχώρησης</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Τύπος Συναλλαγής *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.INCOME }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === TransactionType.INCOME
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">💰</div>
                <div className="font-medium">Έσοδο</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.EXPENSE }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === TransactionType.EXPENSE
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">💳</div>
                <div className="font-medium">Έξοδο</div>
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ημερομηνία * (ΗΗ/ΜΜ/ΕΕΕΕ)
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.date ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
            {formData.date && (
              <p className="mt-1 text-xs text-slate-500">
                Επιλεγμένη: {formData.date.split('-').reverse().join('/')}
              </p>
            )}
            {errors.date && <p className="mt-1 text-sm text-rose-600">{errors.date}</p>}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Πελάτης / Προμηθευτής *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="π.χ. Microsoft, Google, κλπ."
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.clientName ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
            {errors.clientName && <p className="mt-1 text-sm text-rose-600">{errors.clientName}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Περιγραφή
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Προαιρετική περιγραφή της συναλλαγής..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Συνολικό Ποσό (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.grossAmount || ''}
                onChange={(e) => handleGrossAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.grossAmount ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.grossAmount && <p className="mt-1 text-sm text-rose-600">{errors.grossAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ΦΠΑ (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.vatAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vatAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* AFM (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ΑΦΜ (Προαιρετικό)
            </label>
            <input
              type="text"
              value={formData.afm}
              onChange={(e) => setFormData(prev => ({ ...prev, afm: e.target.value }))}
              placeholder="π.χ. 123456789"
              maxLength={9}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Κατάσταση
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: TransactionStatus.MANUAL_REVIEW }))}
                className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.status === TransactionStatus.MANUAL_REVIEW
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚠️ Χειροκίνητη
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: TransactionStatus.OFFICIAL }))}
                className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  formData.status === TransactionStatus.OFFICIAL
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                ✓ Επίσημη
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/30"
            >
              Προσθήκη Συναλλαγής
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
