"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  show: (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>((message, opts) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
    const duration = opts?.duration ?? 5000;
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-slate-900 text-white text-sm rounded-xl pl-4 pr-2 py-2.5 shadow-[var(--shadow-pop)] animate-[toastIn_0.15s_ease-out]"
          >
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
                className="font-semibold text-indigo-300 hover:text-indigo-200 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
