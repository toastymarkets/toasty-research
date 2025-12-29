import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowLeft,
  Edit2,
  Thermometer,
  Cloud,
  Snowflake,
  Wind,
  HelpCircle,
  Calendar,
  MapPin,
  Archive,
} from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { getWorkspaceList } from '../../stores/workspaceStore';
import { extractResearchTopic, detectWeatherType } from '../../utils/researchLogUtils';
import { DataChipNode } from '../notepad/extensions/DataChipNode';
import '../../styles/notepad.css';

// Key patterns for localStorage
const CITY_NOTE_PREFIX = 'toasty_research_notes_v1_city_';
const WORKSPACE_NOTE_PREFIX = 'toasty_research_notes_v1_workspace_';
const DAILY_SUMMARY_KEY = 'toasty_research_notes_v1_daily_summary';

// Weather type configs - glass styled
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
        <div className="animate-spin h-5 w-5 border-2 border-apple-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="notepad-wrapper compact">
      <EditorContent editor={editor} />
    </div>
  );
}

export default function ResearchNotePage() {
  const { noteType, slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [noteData, setNoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for archived note key in query params
  const archivedKey = searchParams.get('key');

  useEffect(() => {
    try {
      let storageKey;
      let location;
      let dashboardPath;
      let isArchived = false;

      if (noteType === 'city') {
        storageKey = archivedKey || `${CITY_NOTE_PREFIX}${slug}`;
        isArchived = !!archivedKey;
        const city = CITY_BY_SLUG[slug];
        if (!city) {
          setError('City not found');
          setIsLoading(false);
          return;
        }
        location = city.name;
        dashboardPath = `/city/${slug}`;
      } else if (noteType === 'workspace') {
        storageKey = archivedKey || `${WORKSPACE_NOTE_PREFIX}${slug}`;
        isArchived = !!archivedKey;
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
        storageKey = archivedKey || DAILY_SUMMARY_KEY;
        isArchived = !!archivedKey;
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
        isArchived,
      });
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load note:', e);
      setError('Failed to load note');
      setIsLoading(false);
    }
  }, [noteType, slug, archivedKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-apple-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !noteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">{error || 'Note not found'}</h1>
          <Link to="/research" className="text-apple-blue hover:underline">
            ← Back to Research Log
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/research')}
              className="glass-button-icon mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white mb-3">{noteData.topic}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-glass-text-secondary text-sm">
                  <MapPin size={14} />
                  {noteData.location}
                  {noteData.noteType === 'workspace' && (
                    <span className="text-xs text-glass-text-muted">(Workspace)</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-glass-text-secondary text-sm">
                  <Calendar size={14} />
                  {formatDate(noteData.lastSaved)}
                </span>
                <WeatherTypeBadge type={noteData.weatherType} />
                {noteData.isArchived && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-glass-text-muted">
                    <Archive size={12} />
                    Archived
                  </span>
                )}
              </div>
            </div>
          </div>

          {noteData.isArchived ? (
            <Link
              to={noteData.dashboardPath}
              className="glass-button flex items-center gap-2"
            >
              <Edit2 size={16} />
              <span className="hidden sm:inline">View Current</span>
            </Link>
          ) : (
            <Link
              to={noteData.dashboardPath}
              className="glass-button-primary flex items-center gap-2"
            >
              <Edit2 size={16} />
              <span className="hidden sm:inline">Edit in Dashboard</span>
            </Link>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="glass p-6 sm:p-8">
          <ReadOnlyEditor content={noteData.document} />
        </div>
      </div>
    </div>
  );
}
