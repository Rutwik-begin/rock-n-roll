import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type || 'info'}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            {(toast.type === 'info' || !toast.type) && <Info size={18} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            className="toast-close"
            onClick={() => onDismiss && onDismiss(toast.id)}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
