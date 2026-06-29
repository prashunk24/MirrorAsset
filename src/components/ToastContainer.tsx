import React from 'react';
import { useStellar } from '../context/StellarContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStellar();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex gap-3 transform transition-all duration-300 translate-y-0 opacity-100 scale-100 glass-panel ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
              : toast.type === 'error'
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
              : 'border-blue-500/30 bg-blue-950/20 text-blue-300'
          }`}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
          </div>
          <div className="flex-grow">
            <h4 className="font-semibold text-sm text-gray-100">{toast.title}</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{toast.description}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 h-5 w-5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
