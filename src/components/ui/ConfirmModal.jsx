import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, FilePlus, HelpCircle, X } from 'lucide-react';

// Icon and color presets for common actions
const ACTION_PRESETS = {
  delete: {
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    confirmBg: 'bg-amber-500 hover:bg-amber-600',
  },
  create: {
    icon: FilePlus,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    confirmBg: 'bg-orange-500 hover:bg-orange-600',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    confirmBg: 'bg-blue-500 hover:bg-blue-600',
  },
};

/**
 * ConfirmModal - A themed confirmation modal centered on screen
 *
 * @param {string} title - The confirmation title (e.g., "Delete Workspace?")
 * @param {string} message - Secondary message with more details
 * @param {string} confirmLabel - Label for confirm button (default: "Confirm")
 * @param {string} cancelLabel - Label for cancel button (default: "Cancel")
 * @param {string} variant - Preset variant: "delete", "warning", "create", or "default"
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {boolean} showCloseButton - Whether to show X button in corner (default: false)
 */
export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  showCloseButton = false,
}) {
  const modalRef = useRef(null);
  const preset = ACTION_PRESETS[variant] || ACTION_PRESETS.default;
  const Icon = preset.icon;

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 relative"
      >
        {showCloseButton && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-elevated)] transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl ${preset.iconBg}`}>
            <Icon size={24} className={preset.iconColor} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
            {message && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-elevated)] rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors ${preset.confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
