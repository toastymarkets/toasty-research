import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Handler for AI prompts - set by NotepadEditor
let aiSubmitHandler = null;

export const setAISubmitHandler = (handler) => {
  aiSubmitHandler = handler;
};

/**
 * AIPromptExtension - Captures /ai prompts directly in the editor
 *
 * Usage: Type "/ai your question here" and press Enter
 * The prompt is extracted and sent to the AI, response streams back
 */
export const AIPromptExtension = Extension.create({
  name: 'aiPrompt',

  addKeyboardShortcuts() {
    return {
      // Cmd/Ctrl + Enter to submit AI prompt from current line
      'Mod-Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Get the current line text
        const lineStart = $from.start();
        const lineEnd = $from.end();
        const lineText = state.doc.textBetween(lineStart, lineEnd, ' ');

        // Check if line starts with /ai
        const aiMatch = lineText.match(/^\/ai\s+(.+)/i);
        if (aiMatch && aiMatch[1]?.trim()) {
          const prompt = aiMatch[1].trim();

          // Delete the /ai line
          editor.chain()
            .focus()
            .setTextSelection({ from: lineStart, to: lineEnd })
            .deleteSelection()
            .run();

          // Submit to AI
          if (aiSubmitHandler) {
            aiSubmitHandler(prompt, editor);
          }

          return true;
        }

        return false;
      },

      // Enter key - check if current line is /ai prompt
      'Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Get current paragraph/line
        const node = $from.parent;
        const lineText = node.textContent;

        // Check if line starts with /ai and has content
        const aiMatch = lineText.match(/^\/ai\s+(.+)/i);
        if (aiMatch && aiMatch[1]?.trim()) {
          const prompt = aiMatch[1].trim();

          // Get the range of this paragraph
          const pos = $from.before();
          const nodeSize = node.nodeSize;

          // Delete the paragraph containing the /ai command
          editor.chain()
            .focus()
            .deleteRange({ from: pos, to: pos + nodeSize })
            .run();

          // Submit to AI
          if (aiSubmitHandler) {
            aiSubmitHandler(prompt, editor);
          }

          return true;
        }

        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('aiPromptHighlight'),
        props: {
          // Add visual styling to /ai lines (optional enhancement)
          decorations: (state) => {
            // Could add decorations here to highlight /ai lines
            return null;
          },
        },
      }),
    ];
  },
});

export default AIPromptExtension;
