import './copilot.css';

/**
 * CopilotThinking - Orange glow thinking animation
 * Shows bouncing dots while AI is processing
 */
export default function CopilotThinking() {
  return (
    <div className="copilot-thinking">
      <div className="copilot-thinking-glow" />
      <div className="copilot-thinking-content">
        <div className="copilot-thinking-dots">
          <span className="copilot-dot" style={{ animationDelay: '0ms' }} />
          <span className="copilot-dot" style={{ animationDelay: '150ms' }} />
          <span className="copilot-dot" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="copilot-thinking-text">Thinking...</span>
      </div>
    </div>
  );
}
