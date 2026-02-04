import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Transaction } from '../types';

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  transaction,
  onConfirm,
  onCancel,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Διαγραφή Συναλλαγής</h3>
                <p className="text-sm text-slate-500">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Πελάτης:</span>
              <span className="font-medium text-slate-800">{transaction.clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Περιγραφή:</span>
              <span className="font-medium text-slate-800">{transaction.description || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Ποσό:</span>
              <span className="font-medium text-slate-800">€{transaction.grossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Ημερομηνία:</span>
              <span className="font-medium text-slate-800">{transaction.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Τύπος:</span>
              <span className={`font-medium ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {transaction.type === 'INCOME' ? 'Έσοδο' : 'Έξοδο'}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-sm text-amber-800">
              <strong>Προσοχή:</strong> Η συναλλαγή θα διαγραφεί οριστικά από το Google Sheet και δεν θα μπορεί να ανακτηθεί.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Ακύρωση
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium shadow-lg shadow-rose-600/30"
          >
            Διαγραφή
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
