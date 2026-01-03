import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { FileText, X, ChevronRight, Plus, Copy, Check } from 'lucide-react';
import GlassWidget from './GlassWidget';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';

// Meteorological keywords to highlight, grouped by category
const WEATHER_KEYWORDS = {
  temperature: [
    'warm air advection', 'cold air advection', 'warming trend', 'cooling trend',
    'above normal', 'below normal', 'near normal', 'record high', 'record low',
    'freeze', 'frost', 'heat wave', 'cold snap', 'thermal trough',
  ],
  synoptic: [
    'cold front', 'warm front', 'occluded front', 'stationary front',
    'low pressure', 'high pressure', 'trough', 'ridge', 'upper level',
    'surface low', 'surface high', 'shortwave', 'longwave',
    'cutoff low', 'closed low', 'blocking pattern', 'zonal flow',
  ],
  precipitation: [
    'rain', 'snow', 'sleet', 'freezing rain', 'wintry mix', 'thunderstorm',
    'shower', 'drizzle', 'downpour', 'heavy rain', 'light rain',
    'accumulation', 'precip', 'precipitation', 'moisture',
    'convection', 'instability', 'cape', 'lifted index',
  ],
  wind: [
    'wind advisory', 'high wind', 'gust', 'breezy', 'windy',
    'santa ana', 'chinook', 'offshore flow', 'onshore flow',
    'wind shift', 'veering', 'backing',
  ],
  confidence: [
    'uncertainty', 'confidence', 'likely', 'unlikely', 'possible',
    'expected', 'forecast', 'outlook', 'trend', 'timing',
    'models agree', 'model spread', 'ensemble', 'deterministic',
  ],
};

// Flatten keywords for lookup
const KEYWORD_MAP = new Map();
Object.entries(WEATHER_KEYWORDS).forEach(([category, keywords]) => {
  keywords.forEach(keyword => KEYWORD_MAP.set(keyword.toLowerCase(), category));
});

// Category colors
const CATEGORY_COLORS = {
  temperature: 'bg-orange-500/30 text-orange-300 hover:bg-orange-500/50',
  synoptic: 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/50',
  precipitation: 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50',
  wind: 'bg-teal-500/30 text-teal-300 hover:bg-teal-500/50',
  confidence: 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/50',
};

/**
 * Insert discussion text into notes
 */
function insertDiscussionToNotes(text, source = 'NWS Discussion') {
  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'discussion',
      content: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'dataChip',
            attrs: { value: text, label: '', type: 'forecast', source, timestamp: new Date().toISOString() }
          }]
        }]
      },
      rawData: { text, source },
    }
  });
  window.dispatchEvent(event);
}

/**
 * NWSDiscussionWidget - Shows NWS Area Forecast Discussion
 * Compact view with full discussion modal on click
 */
export default function NWSDiscussionWidget({
  lat,
  lon,
  citySlug,
  loading: externalLoading = false,
}) {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    if (!lat || !lon) return;

    const cacheKey = `nws_afd_v1_${citySlug}`;

    // Check cache (30 min for discussions)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setDiscussion(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) { /* ignore */ }

    setLoading(true);

    try {
      // Get grid point to find forecast office
      const pointsRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!pointsRes.ok) throw new Error('Failed to get grid point');

      const pointsData = await pointsRes.json();
      const cwa = pointsData.properties?.cwa;

      if (!cwa) throw new Error('No forecast office found');

      // Get latest AFD
      const afdListRes = await fetch(
        `https://api.weather.gov/products/types/AFD/locations/${cwa}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!afdListRes.ok) throw new Error('Failed to get AFD list');

      const afdList = await afdListRes.json();
      const latestAfd = afdList['@graph']?.[0];

      if (!latestAfd) throw new Error('No AFD available');

      // Get full AFD content
      const afdRes = await fetch(latestAfd['@id'], {
        headers: { 'User-Agent': 'Toasty Research App' }
      });

      if (!afdRes.ok) throw new Error('Failed to get AFD content');

      const afdData = await afdRes.json();
      const productText = afdData.productText || '';

      // Parse the discussion
      const result = parseDiscussion(productText, {
        office: cwa,
        issuanceTime: latestAfd.issuanceTime,
        officeName: afdData.issuingOffice,
      });

      // Cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore */ }

      setDiscussion(result);
      setError(null);
    } catch (err) {
      console.error('[NWSDiscussion] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug, lat, lon]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  if (loading || externalLoading) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size="small">
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="w-full h-12 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (error || !discussion) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size="small">
        <div className="flex items-center justify-center h-full text-white/40 text-xs">
          Unable to load discussion
        </div>
      </GlassWidget>
    );
  }

  return (
    <>
      <GlassWidget
        title="DISCUSSION"
        icon={FileText}
        size="small"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0">
            {/* Synopsis preview */}
            <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
              {discussion.synopsis || 'Forecast discussion available'}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-white/40">
                NWS {discussion.office}
              </span>
              <span className="text-[10px] text-white/40">•</span>
              <span className="text-[10px] text-white/40">
                {formatTime(discussion.issuanceTime)}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 ml-2" />
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {isModalOpen && (
        <DiscussionModal
          discussion={discussion}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

NWSDiscussionWidget.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  citySlug: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};

/**
 * Parse AFD text into sections
 */
function parseDiscussion(text, meta) {
  const sections = {};

  // Extract synopsis
  const synopsisMatch = text.match(/\.SYNOPSIS\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (synopsisMatch) {
    sections.synopsis = cleanText(synopsisMatch[1]);
  }

  // Extract near term
  const nearTermMatch = text.match(/\.NEAR TERM[^.]*\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (nearTermMatch) {
    sections.nearTerm = cleanText(nearTermMatch[1]);
  }

  // Extract short term
  const shortTermMatch = text.match(/\.SHORT TERM[^.]*\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (shortTermMatch) {
    sections.shortTerm = cleanText(shortTermMatch[1]);
  }

  // Extract long term
  const longTermMatch = text.match(/\.LONG TERM[^.]*\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (longTermMatch) {
    sections.longTerm = cleanText(longTermMatch[1]);
  }

  // Extract aviation
  const aviationMatch = text.match(/\.AVIATION[^.]*\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (aviationMatch) {
    sections.aviation = cleanText(aviationMatch[1]);
  }

  // Extract marine
  const marineMatch = text.match(/\.MARINE[^.]*\.\.\.?\s*([\s\S]*?)(?=\n\n&&|\n\n\.[A-Z])/i);
  if (marineMatch) {
    sections.marine = cleanText(marineMatch[1]);
  }

  return {
    ...meta,
    ...sections,
    fullText: text,
  };
}

/**
 * Clean up text formatting
 */
function cleanText(text) {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format issuance time
 */
function formatTime(isoTime) {
  if (!isoTime) return '';
  const date = new Date(isoTime);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  });
}

/**
 * HighlightedKeyword - Clickable keyword that can be added to notes
 */
function HighlightedKeyword({ text, category, office }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colorClass = CATEGORY_COLORS[category] || 'bg-white/20 text-white/80';

  const handleClick = (e) => {
    e.stopPropagation();
    insertDiscussionToNotes(text, `NWS ${office}`);
    setShowTooltip(false);
  };

  return (
    <span className="relative inline">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer transition-colors`}
        title={`Add "${text}" to notes`}
      >
        {text}
      </button>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-black/90 text-white rounded whitespace-nowrap z-50 pointer-events-none">
          Click to add to notes
        </span>
      )}
    </span>
  );
}

/**
 * Parse text and highlight meteorological keywords
 */
function parseAndHighlight(text, office) {
  if (!text) return null;

  const allKeywords = Array.from(KEYWORD_MAP.keys()).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const keyword = match[0];
    const category = KEYWORD_MAP.get(keyword.toLowerCase());
    parts.push(
      <HighlightedKeyword
        key={`${match.index}-${keyword}`}
        text={keyword}
        category={category}
        office={office}
      />
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * DiscussionModal - Full forecast discussion with keyword highlighting
 */
function DiscussionModal({ discussion, onClose }) {
  const [activeSection, setActiveSection] = useState('synopsis');
  const [selectionPopup, setSelectionPopup] = useState(null);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const sections = [
    { id: 'synopsis', label: 'Synopsis', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near Term', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short Term', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long Term', content: discussion.longTerm },
    { id: 'aviation', label: 'Aviation', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
  ].filter(s => s.content);

  // Handle text selection
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

  // Handle adding selection to notes
  const handleAddSelectionToNotes = () => {
    if (selectionPopup?.text) {
      insertDiscussionToNotes(selectionPopup.text, `NWS ${discussion.office}`);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Handle copy all
  const handleCopyAll = async () => {
    const activeContent = sections.find(s => s.id === activeSection)?.content;
    if (activeContent) {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hide popup on click outside
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Forecast Discussion</h2>
                <p className="text-sm text-white/60">
                  NWS {discussion.office} • {formatTime(discussion.issuanceTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy section"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/70" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${activeSection === section.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="relative overflow-y-auto max-h-[55vh] p-4"
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

            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {section.label}
                </h3>
                <div className="text-sm text-white/70 leading-relaxed">
                  {parseAndHighlight(section.content, discussion.office)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Click highlighted terms or select text to add to notes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

DiscussionModal.propTypes = {
  discussion: PropTypes.shape({
    office: PropTypes.string,
    issuanceTime: PropTypes.string,
    synopsis: PropTypes.string,
    nearTerm: PropTypes.string,
    shortTerm: PropTypes.string,
    longTerm: PropTypes.string,
    aviation: PropTypes.string,
    marine: PropTypes.string,
    fullText: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
