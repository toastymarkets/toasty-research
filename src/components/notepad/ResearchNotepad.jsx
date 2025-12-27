import { NotepadProvider, useNotepad } from '../../context/NotepadContext';
import NotepadEditor from './NotepadEditor';
import { FileText, Clock, Trash2, FilePlus } from 'lucide-react';

function NotepadContent() {
  const { isLoading, lastSaved, isSaving, createNewNote, clearDocument } = useNotepad();

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
      <div className="h-full flex items-center justify-center bg-[var(--color-card-bg)]">
        <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full" />
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
          <button
            onClick={() => {
              if (window.confirm('Create a new note? Current note will be saved to history.')) {
                createNewNote();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-[var(--color-text-muted)] hover:text-orange-500 transition-colors"
            title="New note"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear all notes? This cannot be undone.')) {
                clearDocument();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
            title="Clear notes"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <NotepadEditor />
      </div>
    </div>
  );
}

export default function ResearchNotepad({ storageKey }) {
  return (
    <NotepadProvider storageKey={storageKey}>
      <NotepadContent />
    </NotepadProvider>
  );
}
