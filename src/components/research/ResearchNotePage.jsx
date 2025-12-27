import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Edit2, Thermometer, Cloud, Snowflake, Wind, HelpCircle, Calendar, MapPin } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { getWorkspaceList } from '../../stores/workspaceStore';
import { extractResearchTopic, detectWeatherType } from '../../utils/researchLogUtils';
import { DataChipNode } from '../notepad/extensions/DataChipNode';
import '../../styles/notepad.css';

// Key patterns for localStorage
const CITY_NOTE_PREFIX = 'toasty_research_notes_v1_city_';
const WORKSPACE_NOTE_PREFIX = 'toasty_research_notes_v1_workspace_';
const DAILY_SUMMARY_KEY = 'toasty_research_notes_v1_daily_summary';

// Weather type icons and colors
const WEATHER_CONFIG = {
  Temperature: { icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  Rain: { icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Snow: { icon: Snowflake, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  Wind: { icon: Wind, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  General: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

function WeatherTypeBadge({ type }) {
  const config = WEATHER_CONFIG[type] || WEATHER_CONFIG.General;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
      <Icon size={14} />
      {type}
    </span>
  );
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function ReadOnlyEditor({ content }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      DataChipNode,
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'notepad-editor focus:outline-none',
      },
    },
  });

  if (!editor) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="notepad-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}

export default function ResearchNotePage() {
  const { noteType, slug } = useParams();
  const navigate = useNavigate();
  const [noteData, setNoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      let storageKey;
      let location;
      let dashboardPath;

      if (noteType === 'city') {
        storageKey = `${CITY_NOTE_PREFIX}${slug}`;
        const city = CITY_BY_SLUG[slug];
        if (!city) {
          setError('City not found');
          setIsLoading(false);
          return;
        }
        location = city.name;
        dashboardPath = `/city/${slug}`;
      } else if (noteType === 'workspace') {
        storageKey = `${WORKSPACE_NOTE_PREFIX}${slug}`;
        const workspaces = getWorkspaceList();
        const workspace = workspaces.find(w => w.id === slug);
        if (!workspace) {
          setError('Workspace not found');
          setIsLoading(false);
          return;
        }
        location = workspace.name;
        dashboardPath = `/workspace/${slug}`;
      } else if (noteType === 'daily-summary') {
        storageKey = DAILY_SUMMARY_KEY;
        location = 'Daily Summary';
        dashboardPath = '/';
      } else {
        setError('Invalid note type');
        setIsLoading(false);
        return;
      }

      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setError('Note not found');
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(saved);
      setNoteData({
        document: parsed.document,
        lastSaved: new Date(parsed.lastSaved),
        topic: extractResearchTopic(parsed.document),
        weatherType: detectWeatherType(parsed.document),
        location,
        dashboardPath,
        noteType,
      });
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load note:', e);
      setError('Failed to load note');
      setIsLoading(false);
    }
  }, [noteType, slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !noteData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Note not found'}</h1>
          <Link to="/research" className="text-orange-500 hover:underline">
            ← Back to Research Log
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/research')}
            className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold mb-3">{noteData.topic}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {noteData.location}
                {noteData.noteType === 'workspace' && (
                  <span className="text-xs text-[var(--color-text-muted)]">(Workspace)</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(noteData.lastSaved)}
              </span>
              <WeatherTypeBadge type={noteData.weatherType} />
            </div>
          </div>
        </div>

        <Link
          to={noteData.dashboardPath}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <Edit2 size={16} />
          <span className="hidden sm:inline">Edit in Dashboard</span>
          <span className="sm:hidden">Edit</span>
        </Link>
      </div>

      {/* Note Content */}
      <div className="card-elevated p-6 sm:p-8">
        <ReadOnlyEditor content={noteData.document} />
      </div>
    </div>
  );
}
