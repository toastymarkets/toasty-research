import { FileText, ChevronLeft, Check, Loader2, FilePlus, Trash2, ChevronDown, Clock, X, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotepadProvider, useNotepad } from '../../context/NotepadContext';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import NotepadEditor from '../notepad/NotepadEditor';
import ConfirmPopover from '../ui/ConfirmPopover';
import { useState, useEffect, useCallback } from 'react';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DataChipNode } from '../notepad/extensions/DataChipNode';

/**
 * Header controls component with save indicator and action buttons
 */
function HeaderControls() {
  const { isSaving, lastSaved, createNewNote, clearDocument } = useNotepad();
  const [activePopover, setActivePopover] = useState(null);

  const formatLastSaved = (date) => {
    if (!date) return null;
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Saved';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Save indicator */}
      {isSaving ? (
        <span className="flex items-center gap-1.5 text-[11px] text-white/40 mr-1">
          <Loader2 className="w-3 h-3 animate-spin" />
        </span>
      ) : lastSaved ? (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400/80 mr-1">
          <Check className="w-3 h-3" />
          <span>{formatLastSaved(lastSaved)}</span>
        </span>
      ) : null}

      {/* New note button */}
      <div className="relative">
        <button
          onClick={() => setActivePopover(activePopover === 'new' ? null : 'new')}
          className={`
            p-1.5 rounded-lg transition-colors
            ${activePopover === 'new'
              ? 'bg-white/20 text-white'
              : 'hover:bg-white/10 text-white/50 hover:text-white'
            }
          `}
          title="New note"
        >
          <FilePlus className="w-4 h-4" />
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

      {/* Clear button */}
      <div className="relative">
        <button
          onClick={() => setActivePopover(activePopover === 'clear' ? null : 'clear')}
          className={`
            p-1.5 rounded-lg transition-colors
            ${activePopover === 'clear'
              ? 'bg-red-500/20 text-red-400'
              : 'hover:bg-white/10 text-white/50 hover:text-white'
            }
          `}
          title="Clear notes"
        >
          <Trash2 className="w-4 h-4" />
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
  );
}

/**
 * Notepad content wrapper that uses the context
 */
function NotepadContent() {
  return (
    <div className="h-full flex flex-col notepad-compact">
      <div className="flex-1 overflow-auto">
        <NotepadEditor />
      </div>
    </div>
  );
}

/**
 * Format relative time helper
 */
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Note Preview Modal - Shows saved note content in a popup
 */
function NotePreviewModal({ note, onClose }) {
  const [content, setContent] = useState(null);

  // Load note content from localStorage
  useEffect(() => {
    if (!note) return;
    try {
      const saved = localStorage.getItem(note.id);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent(parsed.document);
      }
    } catch (e) {
      console.error('Failed to load note:', e);
    }
  }, [note]);

  // Read-only TipTap editor for displaying content
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      DataChipNode,
    ],
    content: content,
    editable: false,
  }, [content]);

  // Update editor content when it changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!note) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-[70] flex items-center justify-center pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl pointer-events-auto animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">
                {note.topic}
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                {note.location} • {formatRelativeTime(note.lastSaved)}
                {note.isArchived && ' • archived'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Link
                to={`/city/${note.slug}`}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                title="Go to city"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 notepad-compact">
            {content ? (
              <div className="notepad-editor text-white/90">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/40">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Research Log - Full history view of all notes
 */
function ResearchLog() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week'
  const [selectedNote, setSelectedNote] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, [location.pathname]);

  // Filter notes based on selection
  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true;
    const now = new Date();
    const noteDate = new Date(note.lastSaved);
    if (filter === 'today') {
      return noteDate.toDateString() === now.toDateString();
    }
    if (filter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return noteDate >= weekAgo;
    }
    return true;
  });

  // Group notes by date
  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const dateKey = note.lastSaved.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(note);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Filter tabs */}
      <div className="px-3 py-2 flex gap-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'week', label: 'This Week' },
          { id: 'today', label: 'Today' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`
              px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors
              ${filter === id
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/40 text-sm">
            No notes found
          </div>
        ) : (
          Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date} className="mb-3">
              {/* Date header */}
              <div className="px-2 py-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wide">
                {date}
              </div>
              {/* Notes for this date */}
              <div className="space-y-0.5">
                {dateNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="w-full flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors group text-left"
                  >
                    <FileText className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white/80 group-hover:text-white line-clamp-1">
                        {note.topic}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40 mt-0.5">
                        <span>{note.location}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(note.lastSaved)}</span>
                        {note.isArchived && (
                          <>
                            <span>•</span>
                            <span className="text-white/30">archived</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/30 text-center">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} • {notes.length} total
      </div>

      {/* Note Preview Modal */}
      {selectedNote && (
        <NotePreviewModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}

/**
 * NotesSidebar - Right sidebar for research notes
 * Apple Weather style panel
 */
export default function NotesSidebar({ storageKey, cityName }) {
  const { isCollapsed, toggle, expand } = useNotesSidebar();
  const [activeView, setActiveView] = useState('notes'); // 'notes' | 'log'

  // Auto-switch to Notes tab when data is inserted from widgets
  useEffect(() => {
    const handleInsertion = () => {
      setActiveView('notes');
      // Also expand the sidebar if collapsed
      if (isCollapsed) {
        expand();
      }
    };

    window.addEventListener(NOTE_INSERTION_EVENT, handleInsertion);
    return () => window.removeEventListener(NOTE_INSERTION_EVENT, handleInsertion);
  }, [isCollapsed, expand]);

  return (
    <>
      {/* Collapse/Expand button - always visible */}
      <button
        onClick={toggle}
        className={`
          fixed top-5 z-40
          p-2 rounded-lg
          bg-black/30 backdrop-blur-xl border border-white/10
          hover:bg-white/10 transition-all duration-300
          ${isCollapsed ? 'right-4' : 'right-[21.5rem]'}
        `}
        title={isCollapsed ? 'Show notes' : 'Hide notes'}
      >
        {isCollapsed ? (
          <FileText className="w-5 h-5 text-white/70" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white/70" />
        )}
      </button>

      {/* Sidebar panel - Apple Weather style */}
      <aside
        className={`
          fixed right-3 top-3 bottom-3 w-80 z-30
          bg-black/30 backdrop-blur-2xl
          border border-white/10 rounded-2xl overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isCollapsed ? 'translate-x-[calc(100%+12px)]' : 'translate-x-0'}
        `}
      >
        <NotepadProvider storageKey={storageKey}>
          <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/50" />
                      <span className="text-[15px] font-semibold text-white">
                        Research Notes
                      </span>
                    </div>
                    {cityName && (
                      <p className="text-[11px] text-white/50 mt-0.5 ml-6">
                        {cityName}
                      </p>
                    )}
                  </div>
                  <HeaderControls />
                </div>
              </div>

              {/* View toggle tabs */}
              <div className="px-3 py-2 flex gap-1">
                <button
                  onClick={() => setActiveView('notes')}
                  className={`
                    flex-1 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors
                    ${activeView === 'notes'
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveView('log')}
                  className={`
                    flex-1 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5
                    ${activeView === 'log'
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }
                  `}
                >
                  <Clock className="w-3.5 h-3.5" />
                  History
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10 mx-3" />

              {/* Content - Notes editor and Research Log (both mounted, one hidden) */}
              <div className="flex-1 overflow-hidden min-h-0 relative">
                {/* Notes editor - always mounted to receive insertion events */}
                <div className={`h-full overflow-y-auto ${activeView === 'notes' ? '' : 'hidden'}`}>
                  <NotepadContent />
                </div>
                {/* Research Log */}
                <div className={`h-full ${activeView === 'log' ? '' : 'hidden'}`}>
                  <ResearchLog />
                </div>
              </div>
          </div>
        </NotepadProvider>
      </aside>
    </>
  );
}
