import { FileText, ChevronLeft, Check, Loader2, FilePlus, Trash2, ChevronDown, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DataChipProvider } from '../../context/DataChipContext';
import { NotepadProvider, useNotepad } from '../../context/NotepadContext';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import NotepadEditor from '../notepad/NotepadEditor';
import ConfirmPopover from '../ui/ConfirmPopover';
import { useState, useEffect } from 'react';
import { getAllResearchNotes } from '../../utils/researchLogUtils';

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
 * Notes history section - shows recent research notes
 */
function NotesHistory({ currentStorageKey }) {
  const [notes, setNotes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Load notes on mount and when location changes
  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, [location.pathname]);

  // Filter out the current note from history
  const historyNotes = notes.filter(note => note.id !== currentStorageKey);

  if (historyNotes.length === 0) return null;

  // Format relative time
  const formatTime = (date) => {
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

  return (
    <div className="border-t border-white/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
            History
          </span>
          <span className="text-[10px] text-white/30">
            ({historyNotes.length})
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/30 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Notes list */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-0.5 max-h-48 overflow-y-auto">
          {historyNotes.slice(0, 10).map(note => (
            <Link
              key={note.id}
              to={`/city/${note.slug}`}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white/70 truncate group-hover:text-white">
                  {note.topic}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <span>{note.location}</span>
                  <span>•</span>
                  <span>{formatTime(note.lastSaved)}</span>
                </div>
              </div>
            </Link>
          ))}
          {historyNotes.length > 10 && (
            <Link
              to="/research"
              className="block text-center text-[11px] text-blue-400 py-1.5 hover:underline"
            >
              View all {historyNotes.length} notes
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * NotesSidebar - Right sidebar for research notes
 * Apple Weather style panel
 */
export default function NotesSidebar({ storageKey, cityName }) {
  const { isCollapsed, toggle } = useNotesSidebar();

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
        <DataChipProvider>
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

              {/* Divider */}
              <div className="h-px bg-white/10 mx-3" />

              {/* Notepad content */}
              <div className="flex-1 overflow-hidden min-h-0">
                <div className="h-full overflow-y-auto">
                  <NotepadContent />
                </div>
              </div>

              {/* History section */}
              <NotesHistory currentStorageKey={storageKey} />
            </div>
          </NotepadProvider>
        </DataChipProvider>
      </aside>
    </>
  );
}
