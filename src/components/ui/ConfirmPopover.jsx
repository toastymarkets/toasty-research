import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, FilePlus, HelpCircle } from 'lucide-react';

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
 * ConfirmPopover - A themed confirmation popover that appears near the trigger element
 *
 * @param {string} title - The confirmation title (e.g., "Delete note?")
 * @param {string} message - Optional secondary message
 * @param {string} confirmLabel - Label for confirm button (default: "Confirm")
 * @param {string} cancelLabel - Label for cancel button (default: "Cancel")
 * @param {string} variant - Preset variant: "delete", "warning", "create", or "default"
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {string} position - Position relative to trigger: "bottom-right", "bottom-left", "top-right", "top-left"
 */
export default function ConfirmPopover({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  position = 'bottom-right',
}) {
  const popoverRef = useRef(null);
  const preset = ACTION_PRESETS[variant] || ACTION_PRESETS.default;
  const Icon = preset.icon;

  // Position classes
  const positionClasses = {
    'bottom-right': 'right-0 top-full mt-2',
    'bottom-left': 'left-0 top-full mt-2',
    'top-right': 'right-0 bottom-full mb-2',
    'top-left': 'left-0 bottom-full mb-2',
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Check if click was on the parent's trigger button
        const parent = popoverRef.current.parentElement;
        if (parent && !parent.contains(e.target)) {
          onCancel();
        } else if (!e.target.closest('button')) {
          onCancel();
        }
      }
    };

    // Small delay to prevent immediate close from the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div
      ref={popoverRef}
      className={`absolute ${positionClasses[position]} z-50 w-64 p-4 rounded-xl shadow-lg
                  border border-[var(--color-border)] bg-[var(--color-card-bg)]`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${preset.iconBg}`}>
          <Icon size={16} className={preset.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--color-text-primary)]">{title}</p>
          {message && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
              {message}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)]
                     hover:bg-[var(--color-card-elevated)] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg text-white transition-colors ${preset.confirmBg}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
