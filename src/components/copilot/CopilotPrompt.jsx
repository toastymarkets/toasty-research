import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import './copilot.css';

/**
 * CopilotPrompt - Inline prompt input that appears in the editor
 */
export default function CopilotPrompt({
  onSubmit,
  onCancel,
  isStreaming,
  isThinking,
  position
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input when mounted
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming || isThinking) return;
    onSubmit(input.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="copilot-prompt-container"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      <div className="copilot-prompt-inner">
        <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the copilot..."
          disabled={isStreaming || isThinking}
          className="copilot-prompt-input"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || isThinking}
            className="copilot-prompt-btn copilot-prompt-submit"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="copilot-prompt-btn copilot-prompt-cancel"
            aria-label="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="copilot-prompt-hint">
        Press Enter to send, Esc to cancel
      </div>
    </div>
  );
}
