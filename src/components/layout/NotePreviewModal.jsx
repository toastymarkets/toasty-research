import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { X, ExternalLink } from 'lucide-react';
import { DataChipNode } from '../notepad/extensions/DataChipNode.js';
import { formatRelativeTime } from '../../utils/timeFormatters.js';

/**
 * NotePreviewModal - Shows saved note content in a popup
 * Extracted to enable lazy loading of TipTap dependencies
 */
export default function NotePreviewModal({ note, onClose }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!note) return;

    try {
      const saved = localStorage.getItem(note.id);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContent(parsed.document);
      }
    } catch (e) {
      console.error('Failed to load note:', e);
    }
  }, [note]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        DataChipNode,
      ],
      content: content,
      editable: false,
    },
    [content]
  );

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!note) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-4 z-[70] flex items-center justify-center pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl pointer-events-auto animate-scale-in">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">
                {note.topic}
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                {note.location} - {formatRelativeTime(note.lastSaved)}
                {note.isArchived && ' - archived'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <Link
                to={`/city/${note.slug}`}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                title="Go to city"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 notepad-compact">
            {content ? (
              <div className="notepad-editor text-white/90">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/40">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
