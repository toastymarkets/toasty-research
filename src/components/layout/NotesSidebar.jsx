import { useState, useEffect, useMemo, createContext, useContext, useCallback, lazy, Suspense } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  FilePlus,
  Trash2,
  ChevronDown,
  Clock,
} from 'lucide-react';

import { NotepadProvider, useNotepad } from '../../context/NotepadContext.jsx';
import { useNotesSidebar } from '../../context/NotesSidebarContext.jsx';
import { CopilotProvider } from '../../context/CopilotContext.jsx';
import ConfirmPopover from '../ui/ConfirmPopover.jsx';
import NotesDashboardSidebar from './NotesDashboardSidebar.jsx';
import ExpandedNoteView from './ExpandedNoteView.jsx';
import { getAllResearchNotes } from '../../utils/researchLogUtils.js';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents.js';
import { gatherCopilotContext } from '../../utils/copilotHelpers.js';
import { formatRelativeTime, formatSaveTime } from '../../utils/timeFormatters.js';

// Lazy load TipTap-dependent components to reduce initial bundle size (~100KB savings)
const NotepadEditor = lazy(() => import('../notepad/NotepadEditor.jsx'));
const NotePreviewModal = lazy(() => import('./NotePreviewModal.jsx'));

// Loading fallback for lazy-loaded editor
function EditorLoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

// Hook to detect mobile vs desktop
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 1023px)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handler = (e) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

// Context to pass copilot data to NotepadEditor (not exported to maintain HMR compatibility)
const CopilotDataContext = createContext(null);
const useCopilotData = () => useContext(CopilotDataContext);

// ============================================================================
// Header Controls
// ============================================================================

/**
 * ActionButton - Reusable button with confirmation popover
 */
function ActionButton({
  icon: Icon,
  title,
  popoverTitle,
  popoverMessage,
  confirmLabel,
  variant,
  onConfirm,
  isActive,
  activeClassName,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const baseClassName = `p-1.5 rounded-lg transition-colors ${className || ''}`;
  const stateClassName = isActive
    ? activeClassName
    : 'hover:bg-white/10 text-white/50 hover:text-white';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseClassName} ${stateClassName}`}
        title={title}
      >
        <Icon className="w-4 h-4" />
      </button>
      {isOpen && (
        <ConfirmPopover
          title={popoverTitle}
          message={popoverMessage}
          confirmLabel={confirmLabel}
          variant={variant}
          position="bottom-right"
          onConfirm={() => {
            onConfirm();
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * SaveIndicator - Shows saving status with spinner or checkmark
 */
function SaveIndicator({ isSaving, lastSaved }) {
  if (isSaving) {
    return (
      <span className="research-notes-save-indicator saving">
        <Loader2 className="w-3 h-3 animate-spin" />
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="research-notes-save-indicator">
        <Check className="w-3 h-3" />
        <span>{formatSaveTime(lastSaved)}</span>
      </span>
    );
  }

  return null;
}

/**
 * HeaderControls - Save indicator and action buttons for the notepad header
 */
function HeaderControls() {
  const { isSaving, lastSaved, createNewNote, clearDocument } = useNotepad();

  return (
    <div className="flex items-center gap-1">
      <SaveIndicator isSaving={isSaving} lastSaved={lastSaved} />

      <ActionButton
        icon={FilePlus}
        title="New note"
        popoverTitle="Create new note?"
        popoverMessage="Current note will be saved to history"
        confirmLabel="Create"
        variant="create"
        onConfirm={createNewNote}
        activeClassName="bg-white/20 text-white"
      />

      <ActionButton
        icon={Trash2}
        title="Clear notes"
        popoverTitle="Clear all notes?"
        popoverMessage="This cannot be undone"
        confirmLabel="Clear"
        variant="delete"
        onConfirm={clearDocument}
        activeClassName="bg-red-500/20 text-red-400"
      />
    </div>
  );
}

// ============================================================================
// Research Log (History View)
// ============================================================================

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'week', label: 'This Week' },
  { id: 'today', label: 'Today' },
];

/**
 * Filter notes by time period
 */
function filterNotesByPeriod(notes, filter) {
  if (filter === 'all') return notes;

  const now = new Date();

  return notes.filter((note) => {
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
}

/**
 * Group notes by date for display
 */
function groupNotesByDate(notes) {
  return notes.reduce((groups, note) => {
    const dateKey = note.lastSaved.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(note);
    return groups;
  }, {});
}

/**
 * NoteListItem - Single note in the research log
 */
function NoteListItem({ note, onClick }) {
  return (
    <button
      onClick={onClick}
      className="research-notes-history-item w-full text-left"
    >
      <div className="research-notes-history-icon">
        <FileText className="w-4 h-4" />
      </div>
      <div className="research-notes-history-content">
        <div className="research-notes-history-title">
          {note.topic}
        </div>
        <div className="research-notes-history-meta">
          {note.location} · {formatRelativeTime(note.lastSaved)}
          {note.isArchived && ' · archived'}
        </div>
      </div>
    </button>
  );
}

/**
 * ResearchLog - Full history view of all notes
 */
function ResearchLog() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, []);

  const filteredNotes = filterNotesByPeriod(notes, filter);
  const groupedNotes = groupNotesByDate(filteredNotes);

  return (
    <div className="h-full flex flex-col">
      <div className="research-notes-filter-pills">
        {FILTER_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`research-notes-filter-pill ${filter === id ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-2">
        {filteredNotes.length === 0 ? (
          <div className="research-notes-empty">
            <FileText className="research-notes-empty-icon" />
            <p className="research-notes-empty-text">No notes found</p>
          </div>
        ) : (
          Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date} className="research-notes-history-group">
              <div className="research-notes-history-date">
                {date}
              </div>
              <div className="space-y-0.5">
                {dateNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    onClick={() => setSelectedNote(note)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/30 text-center">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} · {notes.length} total
      </div>

      {selectedNote && (
        <Suspense fallback={null}>
          <NotePreviewModal
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

// ============================================================================
// Sidebar Content Components
// ============================================================================

/**
 * NotepadContent - Wrapper that provides copilot context to the editor
 */
function NotepadContent() {
  const copilotContext = useCopilotData();

  return (
    <div className="h-full flex flex-col notepad-compact">
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<EditorLoadingFallback />}>
          <NotepadEditor context={copilotContext} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * ViewToggleTabs - Switch between Notes and History views
 */
function ViewToggleTabs({ activeView, onViewChange }) {
  return (
    <div className="research-notes-tabs">
      <button
        onClick={() => onViewChange('notes')}
        className={`research-notes-tab ${activeView === 'notes' ? 'active' : ''}`}
      >
        Notes
      </button>
      <button
        onClick={() => onViewChange('log')}
        className={`research-notes-tab ${activeView === 'log' ? 'active' : ''}`}
      >
        <Clock className="w-3.5 h-3.5" />
        History
      </button>
    </div>
  );
}

/**
 * SidebarHeader - Title and controls for the sidebar
 */
function SidebarHeader({ cityName }) {
  return (
    <div className="research-notes-header p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/50" />
            <span className="research-notes-title text-[15px]">
              Research Notes
            </span>
          </div>
          {cityName && (
            <p className="research-notes-city mt-0.5 ml-6">{cityName}</p>
          )}
        </div>
        <HeaderControls />
      </div>
    </div>
  );
}

/**
 * SidebarContent - Main content area with Notes/History tabs
 */
function SidebarContent({ cityName }) {
  const { isCollapsed, expand } = useNotesSidebar();
  const [activeView, setActiveView] = useState('notes');

  useEffect(() => {
    function handleInsertion() {
      setActiveView('notes');
      if (isCollapsed) {
        expand();
      }
    }

    window.addEventListener(NOTE_INSERTION_EVENT, handleInsertion);
    return () => window.removeEventListener(NOTE_INSERTION_EVENT, handleInsertion);
  }, [isCollapsed, expand]);

  return (
    <div className="h-full flex flex-col">
      <SidebarHeader cityName={cityName} />
      <ViewToggleTabs activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 overflow-hidden min-h-0 relative research-notes-content">
        <div className={`h-full overflow-y-auto ${activeView === 'notes' ? '' : 'hidden'}`}>
          <NotepadContent />
        </div>
        <div className={`h-full ${activeView === 'log' ? '' : 'hidden'}`}>
          <ResearchLog />
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardContent - Full-width dashboard with notes table and expanded view
 */
function DashboardContent({ storageKey, filteredNotes }) {
  const { selectedNoteKey, selectNote } = useNotesSidebar();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  const currentNote = selectedNoteKey
    ? filteredNotes.find((n) => (n.storageKey || n.id) === selectedNoteKey)
    : filteredNotes.find((n) => (n.storageKey || n.id) === storageKey);

  return (
    <div className="h-full flex">
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

      <div className="flex-1 flex flex-col min-w-0 border-l border-white/10 p-6">
        <ExpandedNoteView
          note={currentNote}
          storageKey={selectedNoteKey || storageKey}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Toggle Button
// ============================================================================

/**
 * Get button position class based on sidebar state
 */
function getButtonPosition(isCollapsed, isDashboard) {
  if (isCollapsed) return 'right-4';
  if (isDashboard) return 'right-[calc(100vw-20.5rem+0.75rem)]';
  return 'right-[21.5rem]';
}

/**
 * Get button title based on sidebar state
 */
function getButtonTitle(isCollapsed, isDashboard) {
  if (isCollapsed) return 'Show notes';
  if (isDashboard) return 'Back to notes';
  return 'Expand to dashboard';
}

/**
 * Get button icon based on sidebar state
 */
function ToggleIcon({ isCollapsed, isDashboard }) {
  if (isCollapsed) return <FileText className="w-5 h-5 text-white/70" />;
  if (isDashboard) return <ChevronRight className="w-5 h-5 text-white/70" />;
  return <ChevronLeft className="w-5 h-5 text-white/70" />;
}

/**
 * SidebarToggleButton - Desktop toggle button for sidebar/dashboard
 */
function SidebarToggleButton() {
  const { isCollapsed, isDashboard, expand, openDashboard, closeDashboard } =
    useNotesSidebar();

  function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();

    if (isCollapsed) {
      expand();
    } else if (isDashboard) {
      closeDashboard();
    } else {
      openDashboard();
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`
        hidden lg:block
        fixed top-5 z-[85]
        p-2 rounded-lg
        bg-black/30 backdrop-blur-xl glass-border-premium
        hover:bg-white/10 transition-all duration-300
        ${getButtonPosition(isCollapsed, isDashboard)}
      `}
      title={getButtonTitle(isCollapsed, isDashboard)}
    >
      <ToggleIcon isCollapsed={isCollapsed} isDashboard={isDashboard} />
    </button>
  );
}

// ============================================================================
// Mobile Drawer
// ============================================================================

/**
 * MobileDrawer - Bottom sheet notes drawer for mobile devices
 */
function MobileDrawer({ storageKey, cityName, copilotContext }) {
  const { isMobileOpen, closeMobile } = useNotesSidebar();

  return (
    <div
      className={`
        lg:hidden fixed inset-x-0 bottom-0 z-[100]
        transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ height: '50vh' }}
    >
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 -z-10"
          onClick={closeMobile}
        />
      )}

      <div className="h-full bg-black/80 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/50" />
            <span className="text-[15px] font-semibold text-white">
              Research Notes
            </span>
            {cityName && (
              <span className="text-[11px] text-white/40">- {cityName}</span>
            )}
          </div>
          <button
            onClick={closeMobile}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <NotepadProvider storageKey={storageKey}>
          <CopilotProvider>
            <CopilotDataContext.Provider value={copilotContext}>
              <div className="flex-1 overflow-hidden min-h-0">
                <div className="h-full overflow-y-auto notepad-compact">
                  <NotepadContent />
                </div>
              </div>
            </CopilotDataContext.Provider>
          </CopilotProvider>
        </NotepadProvider>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * NotesSidebar - Right sidebar for research notes with Apple Weather style
 *
 * Supports three view modes:
 * - collapsed: Hidden sidebar
 * - sidebar: Narrow panel with notes editor and history
 * - dashboard: Full-width view with notes table and expanded editor
 */
export default function NotesSidebar({
  storageKey,
  cityName,
  city,
  weather,
  markets,
  observations,
}) {
  const { isCollapsed, isDashboard, selectedNoteKey } = useNotesSidebar();
  const isMobile = useIsMobile();
  const [dashboardNotes, setDashboardNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Gather context for copilot AI features
  const copilotContext = gatherCopilotContext({ city, weather, markets, observations });

  // Load notes when dashboard opens
  useEffect(() => {
    if (isDashboard) {
      setDashboardNotes(getAllResearchNotes());
    }
  }, [isDashboard]);

  // Filter and sort notes for dashboard
  const filteredNotes = useMemo(() => {
    if (!isDashboard) return [];

    let result = [...dashboardNotes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
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
        result = result.filter((note) => new Date(note.lastSaved) >= startOfToday);
        break;
      case 'week':
        result = result.filter((note) => new Date(note.lastSaved) >= startOfWeek);
        break;
      case 'archived':
        result = result.filter((note) => note.isArchived);
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

  // Compute sidebar width class
  const sidebarWidthClass = isDashboard
    ? 'w-[calc(100vw-20.5rem)]'
    : 'w-80';

  const sidebarTransformClass = isCollapsed
    ? 'translate-x-[calc(100%+12px)]'
    : 'translate-x-0';

  return (
    <>
      <SidebarToggleButton />

      <aside
        className={`
          research-notes-sidebar
          hidden lg:block
          fixed right-3 top-3 bottom-3 z-30
          bg-black/30 backdrop-blur-2xl
          glass-border-premium rounded-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${sidebarWidthClass}
          ${sidebarTransformClass}
        `}
      >
        <NotepadProvider storageKey={storageKey}>
          <CopilotProvider>
            <CopilotDataContext.Provider value={copilotContext}>
              {isDashboard ? (
                <DashboardContent
                  storageKey={storageKey}
                  filteredNotes={filteredNotes}
                />
              ) : (
                <SidebarContent cityName={cityName} />
              )}
            </CopilotDataContext.Provider>
          </CopilotProvider>
        </NotepadProvider>
      </aside>

      {/* Only render MobileDrawer on mobile to avoid duplicate editor registration */}
      {isMobile && (
        <MobileDrawer
          storageKey={storageKey}
          cityName={cityName}
          copilotContext={copilotContext}
        />
      )}
    </>
  );
}
