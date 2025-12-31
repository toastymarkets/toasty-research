import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ToastContext = createContext(null);

/**
 * Toast types with their styling
 */
const TOAST_TYPES = {
  error: {
    bg: 'bg-red-500/90',
    icon: '⚠️',
  },
  warning: {
    bg: 'bg-amber-500/90',
    icon: '⚡',
  },
  success: {
    bg: 'bg-green-500/90',
    icon: '✓',
  },
  info: {
    bg: 'bg-blue-500/90',
    icon: 'ℹ',
  },
};

/**
 * ToastProvider - Provides toast notification functionality
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Convenience methods
  const showError = useCallback((message, duration) =>
    addToast(message, 'error', duration), [addToast]);

  const showWarning = useCallback((message, duration) =>
    addToast(message, 'warning', duration), [addToast]);

  const showSuccess = useCallback((message, duration) =>
    addToast(message, 'success', duration), [addToast]);

  const showInfo = useCallback((message, duration) =>
    addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{
      addToast,
      removeToast,
      showError,
      showWarning,
      showSuccess,
      showInfo
    }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Individual Toast component
 */
function Toast({ toast, onDismiss }) {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <div
      className={`
        ${config.bg} text-white px-4 py-3 rounded-xl shadow-lg
        flex items-center gap-3 min-w-[280px] max-w-[90vw]
        pointer-events-auto cursor-pointer
        animate-in slide-in-from-bottom-4 fade-in duration-300
        backdrop-blur-sm
      `}
      onClick={onDismiss}
      role="alert"
    >
      <span className="text-lg flex-shrink-0">{config.icon}</span>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-white/70 hover:text-white text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['error', 'warning', 'success', 'info']),
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
