import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
      {toasts.map(toast => {
        let bg = 'bg-slate-900 text-white';
        let icon = <Info size={18} className="text-blue-400" />;

        if (toast.type === 'success') {
          bg = 'bg-emerald-900 text-emerald-50 border border-emerald-700';
          icon = <CheckCircle2 size={18} className="text-emerald-400" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-900 text-amber-50 border border-amber-700';
          icon = <AlertCircle size={18} className="text-amber-400" />;
        } else if (toast.type === 'danger') {
          bg = 'bg-rose-900 text-rose-50 border border-rose-700';
          icon = <AlertCircle size={18} className="text-rose-400" />;
        }

        return (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-fadeIn ${bg}`}
          >
            {icon}
            <span className="flex-1">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
