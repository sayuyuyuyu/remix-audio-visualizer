import { useEffect, useState } from 'react';
import { cn } from '../../../utils/cn';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: (id: string) => void;
}

export function Toast({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入場アニメーション
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  const variants = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️'
    }
  };

  const variant = variants[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 min-w-80 max-w-md',
        'transform transition-all duration-300 ease-out',
        'flex items-center gap-3 p-4 rounded-xl border shadow-lg',
        variant.bg,
        variant.text,
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
    >
      <span className="text-lg flex-shrink-0">{variant.icon}</span>
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
      >
        <span className="text-sm">✕</span>
      </button>
    </div>
  );
}

// トースト管理のホック
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (
    message: string,
    type: ToastProps['type'] = 'info',
    duration = 5000
  ) => {
    const id = crypto.randomUUID();
    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
      onClose: removeToast
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration)
  };
}

// トーストコンテナー
export function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );
}
