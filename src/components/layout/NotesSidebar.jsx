import { FileText, ChevronLeft, ChevronRight, Check, Loader2, FilePlus, Trash2, ChevronDown, Clock, X, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NotepadProvider, useNotepad } from '../../context/NotepadContext';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import { CopilotProvider } from '../../context/CopilotContext';
import NotepadEditor from '../notepad/NotepadEditor';
import ConfirmPopover from '../ui/ConfirmPopover';
import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DataChipNode } from '../notepad/extensions/DataChipNode';
import { gatherCopilotContext } from '../../utils/copilotHelpers';
import NotesDashboardSidebar from './NotesDashboardSidebar';
import ExpandedNoteView from './ExpandedNoteView';

// Context to pass copilot data to NotepadEditor
const CopilotDataContext = createContext(null);
export const useCopilotData = () => useContext(CopilotDataContext);

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
  const copilotContext = useCopilotData();
  return (
    <div className="h-full flex flex-col notepad-compact">
      <div className="flex-1 overflow-auto">
        <NotepadEditor context={copilotContext} />
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
export default function NotesSidebar({ storageKey, cityName, city, weather, markets, observations }) {
  const { isCollapsed, isDashboard, toggle, expand, collapse, openDashboard, closeDashboard, selectedNoteKey, selectNote } = useNotesSidebar();
  const [activeView, setActiveView] = useState('notes'); // 'notes' | 'log'

  // Dashboard state
  const [dashboardNotes, setDashboardNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes when dashboard opens
  useEffect(() => {
    if (isDashboard) {
      const allNotes = getAllResearchNotes();
      setDashboardNotes(allNotes);
    }
  }, [isDashboard]);

  // Filter and sort notes for dashboard
  const filteredNotes = useMemo(() => {
    if (!isDashboard) return [];
    let result = [...dashboardNotes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.topic?.toLowerCase().includes(query) ||
        note.location?.toLowerCase().includes(query) ||
        note.weatherType?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    switch (filter) {
      case 'today':
        result = result.filter(note => new Date(note.lastSaved) >= startOfToday);
        break;
      case 'week':
        result = result.filter(note => new Date(note.lastSaved) >= startOfWeek);
        break;
      case 'archived':
        result = result.filter(note => note.isArchived);
        break;
      default:
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'topic':
          return (a.topic || '').localeCompare(b.topic || '');
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        case 'date':
        default:
          return new Date(b.lastSaved) - new Date(a.lastSaved);
      }
    });

    return result;
  }, [isDashboard, dashboardNotes, filter, sortBy, searchQuery]);

  // Gather context for copilot (used by /ai slash command)
  const copilotContext = gatherCopilotContext({ city, weather, markets, observations });

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

  // Handle button click based on current state
  const handleToggleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCollapsed) {
      expand(); // Show sidebar
    } else if (isDashboard) {
      closeDashboard(); // Back to sidebar/note-taking mode
    } else {
      openDashboard(); // Expand to dashboard
    }
  };

  // Get button position based on state
  const getButtonPosition = () => {
    if (isCollapsed) return 'right-4';
    // Keep button on the right side even in dashboard mode to avoid overlap with left sidebar
    if (isDashboard) return 'right-[calc(100vw-20.5rem+0.75rem)]'; // Just inside dashboard panel
    return 'right-[21.5rem]'; // Next to sidebar
  };

  // Get button title based on state
  const getButtonTitle = () => {
    if (isCollapsed) return 'Show notes';
    if (isDashboard) return 'Back to notes';
    return 'Expand to dashboard';
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={handleToggleClick}
        className={`
          fixed top-5 z-[85]
          p-2 rounded-lg
          bg-black/30 backdrop-blur-xl border border-white/10
          hover:bg-white/10 transition-all duration-300
          ${getButtonPosition()}
        `}
        title={getButtonTitle()}
      >
        {isCollapsed ? (
          <FileText className="w-5 h-5 text-white/70" />
        ) : isDashboard ? (
          <ChevronRight className="w-5 h-5 text-white/70" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white/70" />
        )}
      </button>

      {/* Sidebar panel - Apple Weather style */}
      <aside
        className={`
          fixed right-3 top-3 bottom-3 z-30
          bg-black/30 backdrop-blur-2xl
          border border-white/10 rounded-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-80 translate-x-[calc(100%+12px)]' : ''}
          ${!isCollapsed && !isDashboard ? 'w-80 translate-x-0' : ''}
          ${isDashboard ? 'w-[calc(100vw-20.5rem)] translate-x-0' : ''}
        `}
      >
        <NotepadProvider storageKey={storageKey}>
          <CopilotProvider>
          <CopilotDataContext.Provider value={copilotContext}>
          {isDashboard ? (
            /* Dashboard expanded view */
            <div className="h-full flex">
              {/* Left sidebar with notes table */}
              <NotesDashboardSidebar
                notes={filteredNotes}
                selectedNoteKey={selectedNoteKey}
                onSelectNote={selectNote}
                filter={filter}
                onFilterChange={setFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              {/* Right content - expanded note view */}
              <div className="flex-1 flex flex-col min-w-0 border-l border-white/10 p-6">
                <ExpandedNoteView
                  note={selectedNoteKey
                    ? filteredNotes.find(n => (n.storageKey || n.id) === selectedNoteKey)
                    : filteredNotes.find(n => (n.storageKey || n.id) === storageKey)
                  }
                  storageKey={selectedNoteKey || storageKey}
                />
              </div>
            </div>
          ) : (
            /* Normal sidebar view */
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
          )}
          </CopilotDataContext.Provider>
          </CopilotProvider>
        </NotepadProvider>
      </aside>
    </>
  );
}
