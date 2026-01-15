import { useState, useEffect, forwardRef } from 'react';
import { MapPin, Calendar, Cloud, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DataChipNode } from '../notepad/extensions/DataChipNode';

const NoteCardPreview = forwardRef(function NoteCardPreview({ note, isSelected, defaultExpanded = false }, ref) {
  const [content, setContent] = useState(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load note content from localStorage
  // Note: getAllResearchNotes returns 'id' as the storage key
  const storageKey = note?.storageKey || note?.id;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent(parsed.document);
      }
    } catch (e) {
      console.error('Failed to load note:', e);
    }
  }, [storageKey]);

  // Read-only TipTap editor
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

  // Update editor when content changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!note) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Weather type color mapping
  const getWeatherTypeColor = (type) => {
    const colors = {
      temperature: 'bg-orange-500/20 text-orange-300',
      precipitation: 'bg-blue-500/20 text-blue-300',
      wind: 'bg-teal-500/20 text-teal-300',
      severe: 'bg-red-500/20 text-red-300',
      snow: 'bg-cyan-500/20 text-cyan-300',
    };
    return colors[type?.toLowerCase()] || 'bg-white/10 text-white/70';
  };

  return (
    <div
      ref={ref}
      className={`
        break-inside-avoid mb-4
        bg-black/30 backdrop-blur-xl
        rounded-xl overflow-hidden
        transition-all duration-200
        glass-border-premium
        ${isSelected ? 'active' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Topic/Title */}
            <h3 className="text-sm font-medium text-white truncate">
              {note.topic || 'Untitled Note'}
            </h3>

            {/* Metadata row */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/50">
              {note.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {note.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(note.lastSaved)}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {note.weatherType && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${getWeatherTypeColor(note.weatherType)}`}>
                <Cloud className="w-3 h-3" />
                {note.weatherType}
              </span>
            )}
            {note.isArchived && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/50 flex items-center gap-1">
                <Archive className="w-3 h-3" />
                Archived
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className={`relative ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-48 overflow-hidden'}`}>
        <div className="px-3 py-2 text-xs max-w-none
          [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap
          [&_h1]:text-xs [&_h1]:font-semibold [&_h1]:text-white [&_h1]:my-1
          [&_h2]:text-xs [&_h2]:font-medium [&_h2]:text-white/90 [&_h2]:my-1
          [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-white/80 [&_h3]:my-1
          [&_p]:text-xs [&_p]:text-white/70 [&_p]:my-1 [&_p]:leading-relaxed
          [&_ul]:text-xs [&_ul]:text-white/70 [&_ul]:my-1 [&_ul]:pl-4
          [&_ol]:text-xs [&_ol]:text-white/70 [&_ol]:my-1 [&_ol]:pl-4
          [&_li]:text-xs [&_li]:my-0.5
          [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-[10px] [&_pre]:bg-black/20 [&_pre]:p-2 [&_pre]:rounded
        ">
          <EditorContent editor={editor} />
        </div>

        {/* Gradient fade when collapsed */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/collapse button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full px-4 py-2 text-[11px] text-white/50 hover:text-white/70 hover:bg-white/5 flex items-center justify-center gap-1 transition-colors border-t border-white/5"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            Read more
          </>
        )}
      </button>
    </div>
  );
});

export default NoteCardPreview;
