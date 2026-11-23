import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 text-rose-900 border-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    info: {
      bg: 'bg-sky-50 text-sky-900 border-sky-200',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    },
  }[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 transform translate-y-0 ${config.bg}`}
      role="alert"
    >
      {config.icon}
      <p className="text-sm font-medium leading-relaxed pr-2">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-auto p-1 rounded-md hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
