import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import CopilotThinking from './CopilotThinking';
import './copilot.css';

/**
 * CopilotInput - Input bar for the AI copilot
 * Sits at the bottom of the Notes tab
 */
export default function CopilotInput({ context, suggestedPrompts = [] }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const {
    sendMessage,
    cancelGeneration,
    isStreaming,
    isThinking,
    error,
  } = useCopilot();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || isThinking) return;
    sendMessage(input.trim(), context);
    setInput('');
  };

  const handleSuggestionClick = (prompt) => {
    if (isStreaming || isThinking) return;
    sendMessage(prompt, context);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="copilot-input-container">
      {/* Thinking indicator */}
      {isThinking && <CopilotThinking />}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="copilot-streaming">
          <div className="copilot-streaming-dot" />
          <span>Writing to notepad...</span>
          <button
            onClick={cancelGeneration}
            className="copilot-cancel-btn"
            aria-label="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && !isThinking && !isStreaming && (
        <div className="copilot-error">
          {error}
        </div>
      )}

      {/* Suggested prompts */}
      {!isThinking && !isStreaming && suggestedPrompts.length > 0 && (
        <div className="copilot-suggestions">
          {suggestedPrompts.slice(0, 2).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(prompt)}
              className="copilot-suggestion-chip"
            >
              <Sparkles className="w-3 h-3" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="copilot-input-form">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the copilot..."
          disabled={isStreaming || isThinking}
          className="copilot-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || isThinking}
          className="copilot-send-btn"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
