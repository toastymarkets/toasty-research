import { useState, useCallback, useRef, useEffect } from 'react';
import { Clock, ExternalLink, Copy, Check, Plus } from 'lucide-react';
import { useNWSForecastDiscussion } from '../../hooks/useNWSWeather';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';

// Meteorological keywords to highlight, grouped by category
// See docs/FORECAST_KEYWORDS.md for full documentation
const WEATHER_KEYWORDS = {
  // Temperature patterns
  temperature: [
    'warm air advection', 'cold air advection', 'warming trend', 'cooling trend',
    'above normal', 'below normal', 'near normal', 'record high', 'record low',
    'freeze', 'frost', 'heat wave', 'cold snap', 'thermal trough',
    'warmer', 'cooler', 'warm', 'cold',
  ],
  // Pressure/fronts
  synoptic: [
    'cold front', 'warm front', 'occluded front', 'stationary front',
    'frontal boundary', 'frontal passage',
    'low pressure', 'high pressure', 'trough', 'ridge', 'upper level',
    'surface low', 'surface high', 'shortwave', 'short wave', 'longwave',
    'cutoff low', 'closed low', 'blocking pattern', 'zonal flow',
    'return flow', 'upper level disturbance', 'Pacific front',
  ],
  // Precipitation
  precipitation: [
    'rain chances', 'rain', 'snow', 'sleet', 'freezing rain', 'wintry mix', 'thunderstorm',
    'shower', 'drizzle', 'downpour', 'heavy rain', 'light rain',
    'accumulation', 'precip', 'precipitation', 'moisture',
    'convection', 'instability', 'cape', 'lifted index',
    'dry', 'low clouds',
  ],
  // Wind
  wind: [
    'wind advisory', 'high wind', 'gust', 'breezy', 'windy',
    'santa ana', 'chinook', 'offshore flow', 'onshore flow',
    'wind shift', 'veering', 'backing',
  ],
  // Confidence/uncertainty
  confidence: [
    'uncertainty', 'confidence', 'likely', 'unlikely', 'possible',
    'expected', 'forecast', 'outlook', 'trend', 'timing',
    'models agree', 'model spread', 'ensemble', 'ensemble solutions', 'deterministic',
  ],
  // Hazards - fire, severe weather, dangerous conditions
  hazards: [
    'fire weather', 'fire concerns', 'fuel moisture', 'red flag warning',
    'wind chill', 'heat index', 'severe', 'tornado', 'hail',
    'flash flood', 'flood', 'ice storm', 'blizzard',
  ],
  // Aviation terms
  aviation: [
    'VFR', 'MVFR', 'IFR', 'LIFR', 'ceiling',
  ],
};

// Temperature range patterns - matches "highs in the 70s", "lows in the upper 40s", etc.
const TEMP_RANGE_PATTERN = /\b(highs?|lows?|temperatures?)\s+(in the\s+)?(lower\s+|mid\s+|upper\s+)?(\d{1,2}0s|\d{1,3}(\s*to\s*\d{1,3})?)\b/gi;

// Flatten keywords with their categories for lookup
const KEYWORD_MAP = new Map();
Object.entries(WEATHER_KEYWORDS).forEach(([category, keywords]) => {
  keywords.forEach(keyword => {
    KEYWORD_MAP.set(keyword.toLowerCase(), category);
  });
});

// Category colors matching the glassmorphism design
const CATEGORY_COLORS = {
  temperature: 'bg-orange-500/30 text-orange-300 hover:bg-orange-500/50',
  synoptic: 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/50',
  precipitation: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50',
  wind: 'bg-teal-500/30 text-teal-300 hover:bg-teal-500/50',
  confidence: 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/50',
  hazards: 'bg-red-500/30 text-red-300 hover:bg-red-500/50',
  aviation: 'bg-gray-500/30 text-gray-300 hover:bg-gray-500/50',
  tempRange: 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50',
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

/**
 * Insert discussion text into notes via global event
 */
function insertDiscussionToNotes(text, source = 'NWS Discussion') {
  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'discussion',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'dataChip',
                attrs: {
                  value: text,
                  label: '',
                  type: 'forecast',
                  source,
                  timestamp: new Date().toISOString(),
                }
              }
            ]
          }
        ]
      },
      rawData: { text, source },
    }
  });
  window.dispatchEvent(event);
}

/**
 * HighlightedKeyword - Clickable keyword with add-to-notes functionality
 */
function HighlightedKeyword({ text, category, officeName }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colorClass = CATEGORY_COLORS[category] || 'bg-white/20 text-white/80';

  const handleAddToNotes = (e) => {
    e.stopPropagation();
    insertDiscussionToNotes(text, `NWS ${officeName}`);
    setShowTooltip(false);
  };

  return (
    <span className="relative inline">
      <button
        onClick={handleAddToNotes}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer transition-colors text-inherit font-inherit`}
        title={`Add "${text}" to notes`}
      >
        {text}
      </button>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-black/80 text-white rounded whitespace-nowrap z-50 pointer-events-none">
          Click to add to notes
        </span>
      )}
    </span>
  );
}

/**
 * Parse text and highlight meteorological keywords and temperature ranges
 */
function parseAndHighlight(text, officeName) {
  if (!text) return null;

  // Build regex pattern from all keywords (sorted by length desc to match longer phrases first)
  const allKeywords = Array.from(KEYWORD_MAP.keys()).sort((a, b) => b.length - a.length);
  const keywordPattern = `\\b(${allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`;

  // Temperature range pattern - matches various formats:
  // "highs in the 70s", "lows in the upper 40s", "highs in the 70s to the lower 80s"
  // "temperatures in the mid 60s", "highs of 75 to 80"
  const tempRangePattern = `\\b(highs?|lows?|temperatures?)\\s+(in the\\s+|of\\s+)?(lower\\s+|mid\\s+|upper\\s+)?(\\d{1,2}0s)(\\s+to\\s+(the\\s+)?(lower\\s+|mid\\s+|upper\\s+)?\\d{1,2}0s)?\\b`;

  // Combined pattern - temp ranges first (they're longer), then keywords
  const combinedPattern = new RegExp(`(${tempRangePattern})|(${keywordPattern})`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];

    // Determine if it's a temp range or keyword
    const isTempRange = /^(highs?|lows?|temperatures?)\s+/i.test(matchedText);
    const category = isTempRange ? 'tempRange' : KEYWORD_MAP.get(matchedText.toLowerCase());

    parts.push(
      <HighlightedKeyword
        key={`${match.index}-${matchedText}`}
        text={matchedText}
        category={category}
        officeName={officeName}
      />
    );

    lastIndex = combinedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function ForecastDiscussion({ cityId }) {
  const [copied, setCopied] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState(null);
  const contentRef = useRef(null);
  const { discussion, loading, error } = useNWSForecastDiscussion(cityId);

  // Clean NWS text by joining hard-wrapped lines while preserving paragraphs
  const cleanTextForCopy = (text) => {
    if (!text) return '';
    return text
      .replace(/\n(?!\n)/g, ' ')  // Single newline → space (join wrapped lines)
      .replace(/  +/g, ' ')        // Collapse multiple spaces
      .trim();
  };

  // Handle text selection for add-to-notes popup
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSelectionPopup({
          text: selection.toString().trim(),
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top - 10,
        });
      }
    } else {
      setSelectionPopup(null);
    }
  }, []);

  // Hide popup when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectionPopup(null);
        }
      }, 100);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle adding selected text to notes
  const handleAddSelectionToNotes = () => {
    if (selectionPopup?.text) {
      const cleanedText = cleanTextForCopy(selectionPopup.text);
      insertDiscussionToNotes(cleanedText, `NWS ${discussion?.officeName || 'Discussion'}`);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Handle copy button click
  const handleCopy = async () => {
    if (discussion?.parsed?.rawText) {
      try {
        const cleanedText = cleanTextForCopy(discussion.parsed.rawText);
        await navigator.clipboard.writeText(cleanedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  // Intercept manual text selection copy (Ctrl/Cmd+C)
  const handleTextCopy = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      e.preventDefault();
      const cleanedText = cleanTextForCopy(selection.toString());
      navigator.clipboard.writeText(cleanedText);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 text-white/50 p-4">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-sm">Loading forecast discussion...</span>
        </div>
      </div>
    );
  }

  if (error || !discussion) return null;

  const { parsed, issuanceTime, officeName } = discussion;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            NWS Discussion
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">
            {officeName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(issuanceTime)}</span>
          </div>
        </div>
      </div>

      {/* Content with highlighted keywords */}
      <div
        ref={contentRef}
        className="relative flex-1 min-h-0 overflow-y-auto p-4"
        onMouseUp={handleMouseUp}
      >
        {/* Selection popup */}
        {selectionPopup && (
          <button
            onClick={handleAddSelectionToNotes}
            className="absolute z-50 flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg transition-colors"
            style={{
              left: `${selectionPopup.x}px`,
              top: `${selectionPopup.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <Plus className="w-3 h-3" />
            Add to notes
          </button>
        )}

        {parsed?.rawText && (
          <div
            className="text-xs text-white/70 whitespace-pre-wrap font-mono select-text leading-relaxed"
            onCopy={handleTextCopy}
          >
            {parseAndHighlight(parsed.rawText, officeName)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 pt-3 border-t border-white/10 shrink-0">
        <a
          href={`https://forecast.weather.gov/product.php?site=${officeName}&issuedby=${officeName}&product=AFD`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          View full discussion on NWS
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
