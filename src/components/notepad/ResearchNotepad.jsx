import { useState } from 'react';
import PropTypes from 'prop-types';
import { NotepadProvider, useNotepad } from '../../context/NotepadContext';
import NotepadEditor from './NotepadEditor';
import ConfirmPopover from '../ui/ConfirmPopover';
import { FileText, Clock, Trash2, FilePlus } from 'lucide-react';

function NotepadContent({ compact = false }) {
  const { isLoading, lastSaved, isSaving, createNewNote, clearDocument } = useNotepad();
  const [activePopover, setActivePopover] = useState(null); // 'new' | 'clear' | null

  const formatLastSaved = (date) => {
    if (!date) return 'Not saved';
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${compact ? 'bg-transparent' : 'bg-[var(--color-card-bg)]'}`}>
        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Compact mode for glass widgets - no header, minimal styling
  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto notepad-compact">
          <NotepadEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[var(--color-orange-main)]" />
          <span className="font-semibold text-[var(--color-text-primary)]">Research Notes</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Clock size={12} />
            {isSaving ? 'Saving...' : formatLastSaved(lastSaved)}
          </span>
          <div className="relative">
            <button
              onClick={() => setActivePopover(activePopover === 'new' ? null : 'new')}
              className={`p-1.5 rounded-lg transition-colors ${
                activePopover === 'new'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'
                  : 'hover:bg-orange-100 dark:hover:bg-orange-900/30 text-[var(--color-text-muted)] hover:text-orange-500'
              }`}
              title="New note"
            >
              <FilePlus size={14} />
            </button>
            {activePopover === 'new' && (
              <ConfirmPopover
                title="Create new note?"
                message="Current note will be saved to history"
                confirmLabel="Create"
                variant="create"
                position="bottom-right"
                onConfirm={() => {
                  createNewNote();
                  setActivePopover(null);
                }}
                onCancel={() => setActivePopover(null)}
              />
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setActivePopover(activePopover === 'clear' ? null : 'clear')}
              className={`p-1.5 rounded-lg transition-colors ${
                activePopover === 'clear'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--color-text-muted)] hover:text-red-500'
              }`}
              title="Clear notes"
            >
              <Trash2 size={14} />
            </button>
            {activePopover === 'clear' && (
              <ConfirmPopover
                title="Clear all notes?"
                message="This cannot be undone"
                confirmLabel="Clear"
                variant="delete"
                position="bottom-right"
                onConfirm={() => {
                  clearDocument();
                  setActivePopover(null);
                }}
                onCancel={() => setActivePopover(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <NotepadEditor />
      </div>
    </div>
  );
}

NotepadContent.propTypes = {
  compact: PropTypes.bool,
};

export default function ResearchNotepad({ storageKey, compact = false }) {
  return (
    <NotepadProvider storageKey={storageKey}>
      <NotepadContent compact={compact} />
    </NotepadProvider>
  );
}

ResearchNotepad.propTypes = {
  storageKey: PropTypes.string.isRequired,
  compact: PropTypes.bool,
};
