import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Thermometer,
  Cloud,
  Snowflake,
  Wind,
  HelpCircle,
  Trash2,
  Search,
} from 'lucide-react';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { MARKET_CITIES } from '../../config/cities';

/**
 * ResearchLogPageNew - Glass-styled research notes list
 */

// Weather type configs
const WEATHER_CONFIGS = {
  Temperature: { icon: Thermometer, color: 'text-apple-orange', bg: 'bg-apple-orange/20' },
  Rain: { icon: Cloud, color: 'text-apple-blue', bg: 'bg-apple-blue/20' },
  Snow: { icon: Snowflake, color: 'text-apple-purple', bg: 'bg-apple-purple/20' },
  Wind: { icon: Wind, color: 'text-apple-teal', bg: 'bg-apple-teal/20' },
  General: { icon: HelpCircle, color: 'text-white/60', bg: 'bg-white/10' },
};

function WeatherTypeBadge({ type }) {
  const config = WEATHER_CONFIGS[type] || WEATHER_CONFIGS.General;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon size={12} />
      {type}
    </span>
  );
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}

export default function ResearchLogPageNew() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('lastSaved');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, []);

  // Filter notes by search
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.topic.toLowerCase().includes(query) ||
      note.location.toLowerCase().includes(query) ||
      note.weatherType.toLowerCase().includes(query)
    );
  });

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'lastSaved') {
      comparison = a.lastSaved - b.lastSaved;
    } else if (sortField === 'topic') {
      comparison = a.topic.localeCompare(b.topic);
    } else if (sortField === 'location') {
      comparison = a.location.localeCompare(b.location);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleNoteClick = (note) => {
    if (note.isArchived) {
      navigate(`/research/${note.type}/${note.slug}?key=${encodeURIComponent(note.id)}`);
    } else {
      navigate(`/research/${note.type}/${note.slug}`);
    }
  };

  const handleDelete = (e, noteId) => {
    e.stopPropagation();
    if (deleteTarget === noteId) {
      // Confirm delete
      try {
        localStorage.removeItem(noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
      setDeleteTarget(null);
    } else {
      setDeleteTarget(noteId);
    }
  };

  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline" />
    );
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="glass-button-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Research Log</h1>
            <p className="text-sm text-glass-text-secondary">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glass-text-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="max-w-4xl mx-auto px-4">
        {sortedNotes.length === 0 ? (
          /* Empty State */
          <div className="glass p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-glass-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No matching notes' : 'No research notes yet'}
            </h2>
            <p className="text-glass-text-secondary mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start taking notes on any city dashboard'
              }
            </p>
            {!searchQuery && (
              <Link
                to={`/city/${MARKET_CITIES[0]?.slug || 'new-york'}`}
                className="glass-button-primary inline-flex"
              >
                Start Researching
              </Link>
            )}
          </div>
        ) : (
          <div className="glass overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-glass-border-subtle text-xs font-medium text-glass-text-muted uppercase tracking-wide">
              <button
                onClick={() => handleSort('topic')}
                className="col-span-5 text-left hover:text-white transition-colors"
              >
                Topic <SortIndicator field="topic" />
              </button>
              <button
                onClick={() => handleSort('location')}
                className="col-span-3 text-left hover:text-white transition-colors"
              >
                Location <SortIndicator field="location" />
              </button>
              <button
                onClick={() => handleSort('lastSaved')}
                className="col-span-2 text-left hover:text-white transition-colors"
              >
                Date <SortIndicator field="lastSaved" />
              </button>
              <div className="col-span-2 text-right">Type</div>
            </div>

            {/* Notes */}
            <div className="divide-y divide-glass-border-subtle">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  {/* Topic */}
                  <div className="col-span-5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-glass-text-muted flex-shrink-0" />
                    <span className="text-white font-medium truncate">{note.topic}</span>
                    {note.isArchived && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-glass-text-muted">
                        Archived
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="col-span-3 text-glass-text-secondary truncate">
                    {note.location}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-glass-text-muted text-sm">
                    {formatTimeAgo(note.lastSaved)}
                  </div>

                  {/* Type + Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <WeatherTypeBadge type={note.weatherType} />
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className={`
                        p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
                        ${deleteTarget === note.id
                          ? 'bg-apple-red/20 text-apple-red opacity-100'
                          : 'hover:bg-apple-red/20 text-glass-text-muted hover:text-apple-red'
                        }
                      `}
                      title={deleteTarget === note.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
