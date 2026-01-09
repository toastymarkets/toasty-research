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
    'above normal', 'below normal', 'near normal', 'above average', 'above-average temperature',
    'record high', 'record low', 'record-breaking', 'records',
    'freeze', 'frost', 'heat wave', 'cold snap', 'thermal trough',
    'warmer', 'cooler', 'warm', 'cold', 'dew point', 'dewpoint',
    'inversion', 'temperature inversion', 'radiational cooling',
  ],
  // Pressure/fronts
  synoptic: [
    'cold front', 'warm front', 'occluded front', 'stationary front',
    'frontal boundary', 'frontal passage',
    'low pressure', 'high pressure', 'trough', 'troughing', 'ridge', 'surface ridge', 'upper level',
    'surface low', 'surface high', 'shortwave', 'short wave', 'longwave',
    'cutoff low', 'closed low', 'upper low', 'blocking pattern', 'zonal flow',
    'return flow', 'upper level disturbance', 'Pacific front',
    'jet stream', 'polar vortex', 'pressure gradient', 'isobar',
    'positively tilted', 'negatively tilted', 'weak flow', 'nnw flow', 'nw flow',
    'ne flow', 'sw flow', 'se flow', 'westerly flow', 'easterly flow',
    'storm system', 'storm systems', 'synoptic waves', 'dynamic system',
    'kinematic forcing', 'moisture laden warm conveyer', 'warm conveyer',
    'secondary low', 'polar front', 'backdoor cold front',
    'upper-level support', 'reduced upper-level support',
  ],
  // Precipitation
  precipitation: [
    'rain chances', 'rain', 'snow', 'sleet', 'freezing rain', 'freezing', 'wintry mix', 'thunderstorm',
    'shower', 'showers', 'light shower', 'light showers', 'drizzle', 'downpour', 'heavy rain', 'light rain',
    'soaking rain', 'sprinkles', 'flurries', 'isolated shower', 'measurable snow',
    'accumulation', 'precip', 'precipitation', 'moisture', 'copious amounts',
    'convection', 'instability', 'cape', 'lifted index',
    'dry', 'low clouds', 'fog', 'dense fog', 'mist', 'virga',
    'stratus', 'cumulus', 'cirrus', 'cloud cover', 'overcast',
    'partly cloudy', 'partly to mostly cloudy', 'mostly cloudy', 'sunny skies', 'clear skies',
  ],
  // Wind
  wind: [
    'wind advisory', 'high wind', 'gust', 'gusts', 'gusty', 'gusty winds', 'gusty southerly winds',
    'gusty south winds', 'breezy', 'windy',
    'santa ana', 'chinook', 'offshore flow', 'onshore flow',
    'wind shift', 'veering', 'backing', 'jet', 'low level jet', 'mountain wave',
  ],
  // Confidence/uncertainty
  confidence: [
    'uncertainty', 'confidence', 'unlikely',
    'forecast', 'outlook', 'trend', 'timing',
    'models agree', 'model spread', 'ensemble', 'ensemble solutions',
    'model guidance', 'solution', 'model solution',
    'improving model agreement', 'uncertainty remains high',
  ],
  // Hazards - fire, severe weather, dangerous conditions
  hazards: [
    'fire weather', 'fire concerns', 'fuel moisture', 'red flag warning',
    'wind chill', 'heat index', 'severe', 'tornado', 'hail',
    'flash flood', 'flood', 'ice storm', 'blizzard',
    'advisory', 'warning', 'watch', 'freezing fog',
    'elevated fire weather', 'dense fog advisory',
  ],
  // Aviation / Technical terms
  aviation: [
    'VFR', 'MVFR', 'IFR', 'LIFR', 'ceiling', 'visibility', 'VSBY',
    'CWA', 'EPS', 'QPF',
  ],
  // Locations - city-specific geographic references
  locations: [
    // NY/OKX area
    'long island', 'hudson valley', 'manhattan', 'brooklyn', 'queens',
    'bronx', 'staten island', 'moriches inlet', 'jersey shore',
    'connecticut', 'new jersey',
    // Chicago/LOT area
    'lake michigan', 'lakefront', 'lake effect', 'lake enhanced',
    'wisconsin', 'indiana', 'i-88', 'i-90', 'i-80', 'northern il', 'moline',
    'southern plains',
    // LA/LOX area
    'point conception', 'pt conception', 'santa barbara', 'sba', 'ventura', 'los angeles county',
    'la county', 'los angeles basin', 'san fernando valley', 'antelope valley',
    'catalina', 'channel islands', 'san gabriel', 'central coast',
    'orange county', 'san diego', 'inland empire', 'high desert', 'slo', 'san luis obispo',
    'i-5 corridor', 'mountain passes',
    // Denver/BOU area
    'front range', 'palmer divide', 'i-25', 'i-70', 'boulder',
    'fort collins', 'denver metro', 'continental divide',
    'northern mountains', 'central mountains', 'southern mountains',
    'lower foothills', 'elevated terrain',
    // Austin/EWX area
    'hill country', 'edwards plateau', 'rio grande', 'south central texas',
    'balcones', 'i-35', 'i-10', 'san antonio', 'guadalupe',
    // Miami/MFL area
    'everglades', 'florida keys', 'keys', 'gulf stream', 'biscayne',
    'palm beach', 'broward', 'miami-dade', 'lake okeechobee',
    // General geographic terms
    'coastal waters', 'inland areas', 'mountains', 'valleys', 'foothills',
    'metro', 'interior', 'coastal', 'offshore', 'gulf coast', 'east coast',
    'atlantic', 'pacific',
  ],
};

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
  rainfallAmount: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50',
  degreeRange: 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50',
  locations: 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/50',
};

function formatRelativeTime(isoString) {
  if (!isoString) return '';

  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

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
  const colorClass = CATEGORY_COLORS[category] || 'bg-white/20 text-white/80';

  function handleClick(e) {
    e.stopPropagation();
    insertDiscussionToNotes(text, `NWS ${officeName}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`${colorClass} px-1 py-0.5 rounded cursor-pointer transition-colors text-inherit font-inherit group relative`}
      title={`Add "${text}" to notes`}
    >
      {text}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-black/80 text-white rounded whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Click to add to notes
      </span>
    </button>
  );
}

// Regex patterns for special weather data formats
const TEMP_RANGE_RE = /^(highs?|lows?|temperatures?)\s+/i;
const RAINFALL_RE = /\d+\.?\d*\s*(-|to)\s*\d+\.?\d*\s*(inch(es)?|"|in)/i;
const DEGREE_RANGE_RE = /\d{1,3}\s*(-|to)\s*\d{1,3}\s*degrees?/i;

/**
 * Determine the category of a matched text segment
 */
function getCategoryForMatch(matchedText) {
  if (TEMP_RANGE_RE.test(matchedText)) return 'tempRange';
  if (RAINFALL_RE.test(matchedText)) return 'rainfallAmount';
  if (DEGREE_RANGE_RE.test(matchedText)) return 'degreeRange';
  return KEYWORD_MAP.get(matchedText.toLowerCase());
}

// Build combined regex pattern once (keywords sorted by length desc to match longer phrases first)
const HIGHLIGHT_PATTERN = (() => {
  const allKeywords = Array.from(KEYWORD_MAP.keys()).sort((a, b) => b.length - a.length);
  const keywordPattern = `\\b(${allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`;
  const tempRangePattern = `\\b(highs?|lows?|temperatures?)\\s+(in the\\s+|of\\s+)?(lower\\s+|mid\\s+|upper\\s+)?(\\d{1,2}0s)(\\s+to\\s+(the\\s+)?(lower\\s+|mid\\s+|upper\\s+)?\\d{1,2}0s)?\\b`;
  const rainfallPattern = `\\b\\d+\\.?\\d*\\s*(-|to)\\s*\\d+\\.?\\d*\\s*(inch(es)?|"|in)\\s*(of\\s+)?(rain(fall)?|precip(itation)?|liquid|snow|accumulation)?\\b`;
  const degreePattern = `\\b\\d{1,3}\\s*(-|to)\\s*\\d{1,3}\\s*degrees?\\b`;
  return new RegExp(`(${tempRangePattern})|(${rainfallPattern})|(${degreePattern})|(${keywordPattern})`, 'gi');
})();

/**
 * Parse text and highlight meteorological keywords, temperature ranges, rainfall amounts, and degree ranges
 */
function parseAndHighlight(text, officeName) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;

  // Reset regex state for fresh matching
  HIGHLIGHT_PATTERN.lastIndex = 0;

  let match;
  while ((match = HIGHLIGHT_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];
    parts.push(
      <HighlightedKeyword
        key={`${match.index}-${matchedText}`}
        text={matchedText}
        category={getCategoryForMatch(matchedText)}
        officeName={officeName}
      />
    );

    lastIndex = HIGHLIGHT_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Clean NWS text by joining hard-wrapped lines while preserving paragraphs
 */
function cleanTextForCopy(text) {
  if (!text) return '';
  return text
    .replace(/\n(?!\n)/g, ' ')
    .replace(/  +/g, ' ')
    .trim();
}

export default function ForecastDiscussion({ cityId }) {
  const [copied, setCopied] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState(null);
  const contentRef = useRef(null);
  const { discussion, loading, error } = useNWSForecastDiscussion(cityId);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
      setSelectionPopup(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = contentRef.current?.getBoundingClientRect();

    if (containerRect) {
      setSelectionPopup({
        text: selectedText,
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 10,
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside() {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection?.toString().trim()) {
          setSelectionPopup(null);
        }
      }, 100);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleAddSelectionToNotes() {
    if (!selectionPopup?.text) return;

    insertDiscussionToNotes(
      cleanTextForCopy(selectionPopup.text),
      `NWS ${discussion?.officeName || 'Discussion'}`
    );
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
  }

  async function handleCopy() {
    const rawText = discussion?.parsed?.rawText;
    if (!rawText) return;

    try {
      await navigator.clipboard.writeText(cleanTextForCopy(rawText));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }

  function handleTextCopy(e) {
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      e.preventDefault();
      navigator.clipboard.writeText(cleanTextForCopy(selectedText));
    }
  }

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
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
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
