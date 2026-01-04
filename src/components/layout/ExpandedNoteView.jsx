import { useState, useEffect } from 'react';
import { MapPin, Calendar, Cloud, Archive, FileText } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DataChipNode } from '../notepad/extensions/DataChipNode';

/**
 * ExpandedNoteView - Shows a single note in newspaper-style multi-column layout
 * The content flows across columns like a newspaper article
 */
export default function ExpandedNoteView({ note, storageKey }) {
  const [content, setContent] = useState(null);

  // Use provided storageKey or derive from note
  const noteStorageKey = storageKey || note?.storageKey || note?.id;

  // Load note content from localStorage
  useEffect(() => {
    // Reset content when key changes
    setContent(null);

    if (!noteStorageKey) return;

    try {
      const saved = localStorage.getItem(noteStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent(parsed.document);
      } else {
        console.warn('No data found for key:', noteStorageKey);
      }
    } catch (e) {
      console.error('Failed to load note:', noteStorageKey, e);
    }
  }, [noteStorageKey]);

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

  if (!note && !storageKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <FileText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No note selected</p>
        <p className="text-xs mt-1">Select a note from the sidebar</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    <div className="h-full flex flex-col">
      {/* Article Header */}
      {note && (
        <div className="pb-4 mb-4 border-b border-white/10">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {note.topic || 'Untitled Note'}
          </h1>

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-4 text-sm text-white/50">
            {note.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {note.location}
              </span>
            )}
            {note.lastSaved && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(note.lastSaved)}
              </span>
            )}
            {note.weatherType && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getWeatherTypeColor(note.weatherType)}`}>
                <Cloud className="w-3.5 h-3.5" />
                {note.weatherType}
              </span>
            )}
            {note.isArchived && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/50 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                Archived
              </span>
            )}
          </div>
        </div>
      )}

      {/* Newspaper-style content - flows across columns */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="
            columns-1 md:columns-2 lg:columns-3
            gap-8
            text-sm leading-relaxed
            [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:break-after-avoid
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:break-after-avoid
            [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-white/80 [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:break-after-avoid
            [&_p]:text-sm [&_p]:text-white/70 [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:text-sm [&_ul]:text-white/70 [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
            [&_ol]:text-sm [&_ol]:text-white/70 [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal
            [&_li]:mb-1.5
            [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-xs [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:mb-3 [&_pre]:break-inside-avoid
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:mb-3
            [&_strong]:text-white [&_strong]:font-semibold
            [&_em]:italic
            [&_a]:text-blue-400 [&_a]:underline
          "
          style={{
            columnFill: 'auto',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
