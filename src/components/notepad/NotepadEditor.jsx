import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useNotepad } from '../../context/NotepadContext';
import { useDataChip } from '../../context/DataChipContext';
import { useCopilot } from '../../context/CopilotContext';
import { DataChipNode } from './extensions/DataChipNode';
import SlashCommands from './extensions/SlashCommands';
import { AIPromptExtension, setAISubmitHandler } from './extensions/AIPromptExtension';
import CopilotSuggestions from '../copilot/CopilotSuggestions';
import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToNoteInsertions } from '../../utils/noteInsertionEvents';
import '../../styles/notepad.css';
import '../copilot/copilot.css';

export default function NotepadEditor({ context }) {
  const { document, saveDocument } = useNotepad();
  const { registerEditor } = useDataChip();
  const copilot = useCopilot();

  // AI state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const abortControllerRef = useRef(null);
  const contextRef = useRef(context);

  // Keep context ref updated
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

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
      AIPromptExtension,
      Image.configure({
        inline: false,
        allowBase64: true, // Required for screenshot data URLs
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return 'Type /ai followed by your question, then Enter...';
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

  // Handle AI prompt submission (called by AIPromptExtension)
  const handleAISubmit = useCallback(async (prompt, editorInstance) => {
    const ed = editorInstance || editor;
    if (!ed || !prompt.trim()) return;

    setIsThinking(true);

    // Insert the prompt as a styled line
    ed.chain()
      .focus()
      .insertContent([
        { type: 'paragraph', content: [
          { type: 'text', marks: [{ type: 'bold' }], text: '✨ ' },
          { type: 'text', marks: [{ type: 'italic' }], text: prompt },
        ]},
      ])
      .run();

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: contextRef.current || {},
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setIsThinking(false);
      setIsStreaming(true);

      // Add new paragraph for response
      ed.chain().focus().insertContent([{ type: 'paragraph' }]).run();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text' && data.content) {
                // Insert the new content
                ed.chain()
                  .focus()
                  .insertContent(data.content)
                  .run();
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
            }
          }
        }
      }

      // Add paragraph after response
      ed.chain().focus().insertContent([{ type: 'paragraph' }]).run();

    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled
        ed.chain()
          .focus()
          .insertContent([
            { type: 'paragraph', content: [
              { type: 'text', marks: [{ type: 'italic' }], text: '(cancelled)' },
            ]},
          ])
          .run();
      } else {
        console.error('Copilot error:', err);
        ed.chain()
          .focus()
          .insertContent([
            { type: 'paragraph', content: [
              { type: 'text', text: `Error: ${err.message}` },
            ]},
          ])
          .run();
      }
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [editor]);

  // Cancel AI generation
  const handleAICancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  // Set up AI submit handler for the AIPromptExtension
  useEffect(() => {
    setAISubmitHandler(handleAISubmit);

    return () => {
      setAISubmitHandler(null);
    };
  }, [handleAISubmit]);

  // Connect editor to DataChipContext for external insertions
  useEffect(() => {
    if (editor) {
      registerEditor(editor);
    }
    return () => {
      registerEditor(null);
    };
  }, [editor, registerEditor]);

  // Connect editor to CopilotContext for AI insertions
  useEffect(() => {
    if (copilot?.setEditor && editor) {
      copilot.setEditor(editor);
    }
    return () => {
      if (copilot?.setEditor) {
        copilot.setEditor(null);
      }
    };
  }, [editor, copilot]);

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

  // Subscribe to global note insertion events (from widgets outside the notepad context)
  useEffect(() => {
    if (!editor) return;

    const unsubscribe = subscribeToNoteInsertions((detail) => {
      if (detail.content) {
        // Move to end of document and insert the content
        editor.chain()
          .focus('end')
          .insertContent(detail.content.content) // Insert the content array from the doc
          .run();
      }
    });

    return unsubscribe;
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="notepad-wrapper h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Streaming/Thinking indicator */}
      {(isThinking || isStreaming) && (
        <div className="px-3 pb-2">
          <div className="copilot-streaming-indicator">
            <span className="dot" />
            <span>{isThinking ? 'Thinking...' : 'Writing...'}</span>
            <button
              onClick={handleAICancel}
              className="ml-auto text-white/50 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick prompt suggestions */}
      {!isThinking && !isStreaming && (
        <CopilotSuggestions
          context={context}
          onSelect={handleAISubmit}
          disabled={isThinking || isStreaming}
        />
      )}
    </div>
  );
}
