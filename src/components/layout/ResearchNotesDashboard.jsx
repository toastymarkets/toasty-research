import { useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import NotesDashboardSidebar from './NotesDashboardSidebar';
import NotesGridView from './NotesGridView';

export default function ResearchNotesDashboard() {
  const { isDashboard, closeDashboard, selectedNoteKey, selectNote } = useNotesSidebar();
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'week' | 'archived'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'topic' | 'location'
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes when dashboard opens
  useEffect(() => {
    if (isDashboard) {
      const allNotes = getAllResearchNotes();
      setNotes(allNotes);
    }
  }, [isDashboard]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isDashboard) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDashboard, closeDashboard]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

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
        // 'all' - no filtering
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
  }, [notes, filter, sortBy, searchQuery]);

  if (!isDashboard) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm"
        onClick={closeDashboard}
      />

      {/* Dashboard overlay */}
      <div className="fixed inset-0 z-[80] flex p-4 md:p-6 lg:p-8 pointer-events-none">
        <div
          className="
            w-full h-full flex
            bg-black/40 backdrop-blur-2xl
            glass-border-premium rounded-2xl
            overflow-hidden pointer-events-auto
            animate-[glass-scale-in_200ms_ease-out]
          "
        >
          {/* Left sidebar with table */}
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

          {/* Right content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h1 className="text-xl font-semibold text-white">Research Notes</h1>
                <p className="text-sm text-white/50 mt-0.5">
                  {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
                  {filter !== 'all' && ` (${filter})`}
                </p>
              </div>
              <button
                onClick={closeDashboard}
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Close dashboard (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <NotesGridView
                notes={filteredNotes}
                selectedNoteKey={selectedNoteKey}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
