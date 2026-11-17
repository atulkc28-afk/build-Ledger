import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-[#E6E9EF] rounded-xl shadow-lg p-3.5 flex items-start gap-3"
        >
          {toast.tone === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
          )}
          {toast.tone === 'error' && (
            <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
          )}
          {toast.tone === 'info' && (
            <Info className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#172B4D]">{toast.title}</div>
            {toast.description && (
              <div className="mt-0.5 text-xs text-[#707987] truncate">{toast.description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-[#707987] hover:text-[#172B4D] p-0.5 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
