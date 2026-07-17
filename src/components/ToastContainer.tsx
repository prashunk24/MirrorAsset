import React from 'react';
import { useStellar } from '../context/StellarContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStellar();

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-accent-green';
      case 'error': return 'border-l-accent-red';
      default: return 'border-l-blue-500';
    }
  };

  const getBackgroundStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-accent-green/5 border-accent-green/20';
      case 'error': return 'bg-accent-red/5 border-accent-red/20';
      default: return 'bg-blue-500/5 border-blue-500/20';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border border-l-4 flex gap-3 backdrop-blur-xl transform transition-all duration-300 ease-out animate-slide-in-right ${getBorderColor(toast.type)} ${getBackgroundStyle(toast.type)}`}
          role="alert"
          style={{
            animation: 'slideInRight 0.3s ease-out forwards',
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-accent-green" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-accent-red" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-sm text-text-primary">{toast.title}</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{toast.description}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-all duration-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
