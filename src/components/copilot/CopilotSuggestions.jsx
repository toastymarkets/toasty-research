import { Sparkles } from 'lucide-react';
import { getSuggestedPrompts } from '../../utils/copilotHelpers';

/**
 * CopilotSuggestions - Quick prompt chips for the AI copilot
 * Shows contextual suggestions based on current dashboard data
 */
export default function CopilotSuggestions({ context, onSelect, disabled }) {
  const suggestions = getSuggestedPrompts(context);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="copilot-suggestions">
      <div className="copilot-suggestions-header">
        <Sparkles className="w-3 h-3" />
        <span>Ask AI</span>
      </div>
      <div className="copilot-suggestions-chips">
        {suggestions.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className="copilot-chip"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
