import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-emerald-600" size={20} />;
      case 'error':
        return <AlertCircle className="text-rose-600" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-600" size={20} />;
      case 'info':
        return <Info className="text-blue-600" size={20} />;
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        min-w-[300px] max-w-md
        border-2 rounded-xl shadow-lg
        p-4 pr-12
        animate-in slide-in-from-top-4 duration-300
        relative
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastNotification;
