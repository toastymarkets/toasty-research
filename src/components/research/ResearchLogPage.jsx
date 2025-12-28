import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, ChevronUp, ChevronDown, Thermometer, Cloud, Snowflake, Wind, HelpCircle, Trash2 } from 'lucide-react';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { MARKET_CITIES } from '../../config/cities';
import ConfirmPopover from '../ui/ConfirmPopover';

// Weather type icons and colors
const WEATHER_ICONS = {
  Temperature: { icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  Rain: { icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Snow: { icon: Snowflake, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  Wind: { icon: Wind, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  General: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

function WeatherTypeBadge({ type }) {
  const config = WEATHER_ICONS[type] || WEATHER_ICONS.General;
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

export default function ResearchLogPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [sortField, setSortField] = useState('lastSaved');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null); // note id being deleted

  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'lastSaved') {
      comparison = a.lastSaved - b.lastSaved;
    } else if (sortField === 'topic') {
      comparison = a.topic.localeCompare(b.topic);
    } else if (sortField === 'location') {
      comparison = a.location.localeCompare(b.location);
    } else if (sortField === 'weatherType') {
      comparison = a.weatherType.localeCompare(b.weatherType);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleRowClick = (note) => {
    // For archived notes, pass the full storage key as a query param
    if (note.isArchived) {
      navigate(`/research/${note.type}/${note.slug}?key=${encodeURIComponent(note.id)}`);
    } else {
      navigate(`/research/${note.type}/${note.slug}`);
    }
  };

  const handleDeleteClick = (e, noteId) => {
    e.stopPropagation(); // Prevent row click navigation
    setDeleteTarget(noteId);
  };

  const confirmDelete = (noteId) => {
    try {
      localStorage.removeItem(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold">Research Log</h1>
          <p className="text-[var(--color-text-secondary)]">
            All your research notes in one place
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        /* Empty State */
        <div className="card-elevated p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-card-elevated)] mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-xl font-heading font-semibold mb-2">No research notes yet</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Start taking notes on any city dashboard to build your research log
          </p>
          <Link
            to={`/city/${MARKET_CITIES[0]?.slug || 'new-york'}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Start Researching
          </Link>
        </div>
      ) : (
        /* Database Table */
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th
                  onClick={() => handleSort('topic')}
                  className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Research Topic
                  <SortIcon field="topic" />
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Location
                  <SortIcon field="location" />
                </th>
                <th
                  onClick={() => handleSort('lastSaved')}
                  className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Research Date
                  <SortIcon field="lastSaved" />
                </th>
                <th
                  onClick={() => handleSort('weatherType')}
                  className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Weather Type
                  <SortIcon field="weatherType" />
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedNotes.map((note) => (
                <tr
                  key={note.id}
                  onClick={() => handleRowClick(note)}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-card-elevated)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.topic}</span>
                      {note.isArchived && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500">
                          Archived
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-text-secondary)]">
                        {note.location}
                      </span>
                      {note.type === 'workspace' && (
                        <span className="text-xs text-[var(--color-text-muted)]">(Workspace)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                    {formatDate(note.lastSaved)}
                  </td>
                  <td className="px-4 py-4">
                    <WeatherTypeBadge type={note.weatherType} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        onClick={(e) => handleDeleteClick(e, note.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleteTarget === note.id
                            ? 'text-red-500 bg-red-500/10'
                            : 'text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10'
                        }`}
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                      {deleteTarget === note.id && (
                        <ConfirmPopover
                          title="Delete note?"
                          message={note.topic}
                          confirmLabel="Delete"
                          variant="delete"
                          position="bottom-right"
                          onConfirm={() => confirmDelete(note.id)}
                          onCancel={cancelDelete}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
