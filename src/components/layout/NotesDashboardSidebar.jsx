import { Search, ChevronDown, MapPin, Calendar, Archive, FileText } from 'lucide-react';
import { formatTimeAgo } from '../../utils/timeFormatters.js';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Notes' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'topic', label: 'Topic' },
  { value: 'location', label: 'Location' },
];

export default function NotesDashboardSidebar({
  notes,
  selectedNoteKey,
  onSelectNote,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col bg-black/20">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white mb-3">Notes Library</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="
              w-full pl-9 pr-3 py-2
              bg-white/5 border border-white/10 rounded-lg
              text-sm text-white placeholder:text-white/40
              focus:outline-none focus:border-white/20 focus:bg-white/10
              transition-colors
            "
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-2 flex gap-1 border-b border-white/10 overflow-x-auto">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
              ${filter === option.value
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Sort control */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/10">
        <span className="text-[11px] text-white/40">Sort by</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="
              appearance-none pr-6 pl-2 py-1
              bg-transparent text-xs text-white/70
              border-none focus:outline-none cursor-pointer
            "
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-white/40">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs text-center">No notes match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notes.map((note) => {
              const noteKey = note.storageKey || note.id;
              return (
              <button
                key={noteKey}
                onClick={() => onSelectNote(noteKey)}
                className={`
                  w-full px-4 py-3 text-left transition-colors
                  ${selectedNoteKey === noteKey
                    ? 'bg-blue-500/20 border-l-2 border-blue-400'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                  }
                `}
              >
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white truncate flex-1">
                    {note.topic || 'Untitled'}
                  </h3>
                  {note.isArchived && (
                    <Archive className="w-3 h-3 text-white/30 flex-shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                  {note.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />
                      {note.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatTimeAgo(note.lastSaved)}
                  </span>
                </div>

                {/* Weather type badge */}
                {note.weatherType && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
                    {note.weatherType}
                  </span>
                )}
              </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 text-[10px] text-white/30 text-center">
        {notes.length} note{notes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
