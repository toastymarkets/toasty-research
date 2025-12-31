import { createContext, useContext, useState, useCallback, useRef } from 'react';

const CopilotContext = createContext(null);

/**
 * CopilotProvider - Manages AI copilot conversation state
 */
export function CopilotProvider({ children }) {
  // Conversation messages
  const [messages, setMessages] = useState([]);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Error state
  const [error, setError] = useState(null);

  // Abort controller for cancellation
  const abortControllerRef = useRef(null);

  // Editor ref for direct insertion
  const editorRef = useRef(null);

  // Add a user message
  const addUserMessage = useCallback((content) => {
    const message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  // Add an assistant message
  const addAssistantMessage = useCallback((content) => {
    const message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content,
        };
      }
      return newMessages;
    });
  }, []);

  // Send a message to the copilot
  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    setIsThinking(true);
    setStreamingContent('');

    // Add user message
    addUserMessage(content);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Start streaming
      setIsThinking(false);
      setIsStreaming(true);

      // Add empty assistant message to update
      addAssistantMessage('');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

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
                fullContent += data.content;
                setStreamingContent(fullContent);
                updateLastAssistantMessage(fullContent);
              } else if (data.type === 'done') {
                // Streaming complete
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Insert into notepad if editor is available
      if (editorRef.current && fullContent) {
        insertIntoNotepad(fullContent);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled
      } else {
        setError(err.message);
        console.error('Copilot error:', err);
      }
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, addUserMessage, addAssistantMessage, updateLastAssistantMessage]);

  // Cancel ongoing generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  // Insert content into notepad
  const insertIntoNotepad = useCallback((content) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // Move to end and insert
    editor.chain()
      .focus('end')
      .insertContent([
        { type: 'paragraph' },
        { type: 'horizontalRule' },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Copilot: ' },
          ],
        },
      ])
      .insertContent(content)
      .insertContent([{ type: 'paragraph' }])
      .run();
  }, []);

  // Set editor ref (called from NotepadEditor)
  const setEditor = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const value = {
    // State
    messages,
    isStreaming,
    isThinking,
    streamingContent,
    error,

    // Actions
    sendMessage,
    cancelGeneration,
    clearConversation,
    setEditor,
    insertIntoNotepad,
  };

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}

/**
 * Hook to access copilot context
 * Returns null if used outside CopilotProvider (for optional integration)
 */
export function useCopilot() {
  const context = useContext(CopilotContext);
  return context;
}

export default CopilotContext;
