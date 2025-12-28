import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useNotepad } from '../../context/NotepadContext';
import { useDataChip } from '../../context/DataChipContext';
import { DataChipNode } from './extensions/DataChipNode';
import { SlashCommands } from './extensions/SlashCommands';
import { useEffect } from 'react';
import '../../styles/notepad.css';

export default function NotepadEditor() {
  const { document, saveDocument } = useNotepad();
  const { editorRef } = useDataChip();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      DataChipNode,
      SlashCommands,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return 'Type / for commands, or just start writing...';
        },
      }),
    ],
    content: document,
    editorProps: {
      attributes: {
        class: 'notepad-editor focus:outline-none min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      saveDocument(json);
    },
  });

  // Connect editor to DataChipContext ref for external insertions
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
    return () => {
      if (editorRef) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);

  // Update editor content when document changes externally (e.g., after clear)
  useEffect(() => {
    if (editor && document) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(document);

      // Only update if content is different and editor is not focused
      if (currentContent !== newContent && !editor.isFocused) {
        editor.commands.setContent(document);
      }
    }
  }, [document, editor]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="notepad-wrapper h-full">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
