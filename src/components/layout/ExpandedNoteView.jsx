import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Cloud,
  Archive,
  FileText,
  Check,
  Loader2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { DataChipNode } from '../notepad/extensions/DataChipNode.js';
import { formatSaveTime } from '../../utils/timeFormatters.js';

/**
 * EditorToolbar - Formatting toolbar for the note editor
 */
function EditorToolbar({ editor }) {
  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded transition-colors
        ${isActive
          ? 'bg-white/20 text-white'
          : 'text-white/50 hover:text-white hover:bg-white/10'
        }
      `}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-5 bg-white/10 mx-1" />
  );

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 mb-3 bg-white/5 rounded-lg glass-border-premium">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (⌘B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (⌘I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * ExpandedNoteView - Shows a single note in editable multi-column layout
 * The content flows across columns like a newspaper article
 */
export default function ExpandedNoteView({ note, storageKey }) {
  const [content, setContent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Use provided storageKey or derive from note
  const noteStorageKey = storageKey || note?.storageKey || note?.id;

  // Debounced save function
  const saveDocument = useCallback((newDoc) => {
    if (!noteStorageKey) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    // Debounce the actual save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Get existing data to preserve createdDate
        const existing = localStorage.getItem(noteStorageKey);
        let createdDate = new Date().toISOString();

        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            createdDate = parsed.createdDate || createdDate;
          } catch (e) {
            // Use new date if parsing fails
          }
        }

        const saveData = {
          document: newDoc,
          createdDate: createdDate,
          lastSaved: new Date().toISOString(),
          version: 1,
        };
        localStorage.setItem(noteStorageKey, JSON.stringify(saveData));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save note:', e);
      }
      setIsSaving(false);
    }, 500);
  }, [noteStorageKey]);

  // Load note content from localStorage
  useEffect(() => {
    // Reset content when key changes
    setContent(null);
    setLastSaved(null);

    if (!noteStorageKey) return;

    try {
      const saved = localStorage.getItem(noteStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent(parsed.document);
        if (parsed.lastSaved) {
          setLastSaved(new Date(parsed.lastSaved));
        }
      } else {
        console.warn('No data found for key:', noteStorageKey);
      }
    } catch (e) {
      console.error('Failed to load note:', noteStorageKey, e);
    }
  }, [noteStorageKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Editable TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      DataChipNode,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: content,
    editable: true,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      saveDocument(json);
    },
  }, [content]);

  // Update editor when content changes (from loading a different note)
  useEffect(() => {
    if (editor && content) {
      // Only update if not focused to avoid disrupting user edits
      if (!editor.isFocused) {
        editor.commands.setContent(content);
      }
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
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

            {/* Save indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                  <Check className="w-3.5 h-3.5" />
                  <span>{formatSaveTime(lastSaved)}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Formatting toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editable content area */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="
            text-sm leading-relaxed
            [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]
            [&_.ProseMirror.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror.is-editor-empty:first-child::before]:text-white/30
            [&_.ProseMirror.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror.is-editor-empty:first-child::before]:h-0
            [&_.ProseMirror.is-editor-empty:first-child::before]:pointer-events-none
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-4
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mb-2 [&_h2]:mt-3
            [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-white/80 [&_h3]:mb-2 [&_h3]:mt-3
            [&_p]:text-sm [&_p]:text-white/70 [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:text-sm [&_ul]:text-white/70 [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
            [&_ol]:text-sm [&_ol]:text-white/70 [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal
            [&_li]:mb-1.5
            [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-xs [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:mb-3
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:mb-3
            [&_strong]:text-white [&_strong]:font-semibold
            [&_em]:italic
            [&_a]:text-blue-400 [&_a]:underline
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3
          "
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
