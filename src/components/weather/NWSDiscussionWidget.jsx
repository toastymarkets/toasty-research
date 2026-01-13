import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FileText, X, ChevronRight, ChevronLeft, Plus, Copy, Check,
  ExternalLink, BookOpen, Maximize2, Newspaper, AlertCircle, Sparkles, RefreshCw,
} from 'lucide-react';

import { useNWSBulletins, formatBulletinTime } from '../../hooks/useNWSBulletins.js';
import { useToastySummary } from '../../hooks/useToastySummary.js';
import { useMultiModelForecast } from '../../hooks/useMultiModelForecast.js';
import GlassWidget from './GlassWidget.jsx';
import { NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents.js';
import { getGlossaryForOffice, termAppearsInText } from '../../data/cityGlossaries.js';
import { useTextSelection } from './useTextSelection.js';

import {
  CATEGORY_COLORS,
  KEYWORD_DEFINITIONS,
  KEYWORD_MAP,
  GLOSSARY_CATEGORY_COLORS,
  GLOSSARY_CATEGORY_LABELS,
} from './nwsDiscussionConstants.js';

import {
  formatTime,
  formatRelativeTime,
  parseDiscussion,
  extractSynopsisExcerpt,
  extractKeywords,
  categorizeMatch,
  buildHighlightPattern,
} from './nwsDiscussionUtils.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Insert discussion text into notes as a blockquote
 */
function insertDiscussionToNotes(text, source = 'NWS Discussion') {
  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'discussion',
      content: {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text }],
            }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'italic' }], text: `— ${source}` },
            ],
          },
        ],
      },
      rawData: { text, source },
    },
  });
  window.dispatchEvent(event);
}

/**
 * Parse text and highlight meteorological keywords
 */
function parseAndHighlight(text, office) {
  if (!text) return null;

  const pattern = buildHighlightPattern();
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];
    const category = categorizeMatch(matchedText);

    parts.push(
      <HighlightedKeyword
        key={`${match.index}-${matchedText}`}
        text={matchedText}
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

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * HighlightedKeyword - Clickable keyword with definition popup
 */
function HighlightedKeyword({ text, category, office }) {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const colorClass = CATEGORY_COLORS[category] || 'bg-white/20 text-white/80';
  const definition = KEYWORD_DEFINITIONS[text.toLowerCase()];

  useEffect(() => {
    if (!showPopup) return;

    function handleClickOutside(e) {
      const clickedOutside =
        popupRef.current && !popupRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target);
      if (clickedOutside) {
        setShowPopup(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  function handleKeywordClick(e) {
    e.stopPropagation();
    if (definition) {
      setShowPopup(!showPopup);
    } else {
      insertDiscussionToNotes(text, `NWS ${office}`);
    }
  }

  function handleAddToNotes(e) {
    e.stopPropagation();
    insertDiscussionToNotes(text, `NWS ${office}`);
    setShowPopup(false);
  }

  return (
    <span className="relative inline">
      <button
        ref={buttonRef}
        onClick={handleKeywordClick}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer transition-colors`}
      >
        {text}
      </button>
      {showPopup && definition && (
        <span
          ref={popupRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 text-[11px] bg-black/95 text-white rounded-lg shadow-xl z-50 leading-relaxed border border-white/10"
        >
          <span className="font-semibold text-white block mb-1.5 capitalize">{text}</span>
          <span className="text-white/80 block mb-3">{definition}</span>
          <button
            onClick={handleAddToNotes}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add to notes
          </button>
        </span>
      )}
    </span>
  );
}

/**
 * SelectionPopupButton - "Add to notes" button that appears on text selection
 */
function SelectionPopupButton({ selectionPopup, onAdd }) {
  if (!selectionPopup) return null;

  return (
    <button
      onClick={onAdd}
      className="absolute z-[100] flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg transition-colors"
      style={{
        left: `${selectionPopup.x}px`,
        top: `${selectionPopup.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Plus className="w-3 h-3" />
      Add to notes
    </button>
  );
}

/**
 * ToastySummaryContent - AI-generated forecast summary
 */
function ToastySummaryContent({ summary, loading, error, onRefresh }) {
  const [activeDay, setActiveDay] = useState('today');

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
        <p className="text-white/50 text-sm">Generating summary...</p>
      </div>
    );
  }

  if (error && !summary) {
    const isDevError = error.includes('vercel dev');
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <AlertCircle className="w-6 h-6 text-amber-400" />
        <p className="text-white/60 text-sm text-center max-w-xs">{error}</p>
        {isDevError ? (
          <p className="text-white/40 text-xs text-center">
            Use the Synopsis tab for raw NWS content
          </p>
        ) : (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        )}
      </div>
    );
  }

  // Get the content to display based on active tab
  const displayContent = summary
    ? (activeDay === 'today' ? summary.today : summary.tomorrow) || summary.raw
    : null;

  const hasTomorrow = summary?.tomorrow && summary.tomorrow.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-[18px] h-[18px] text-violet-400" />
          <span className="text-sm font-medium text-white tracking-tight">AI Forecast Summary</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 rounded-lg transition-all duration-200 border border-white/5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span className="tracking-wide">Refresh</span>
        </button>
      </div>

      {/* Day selector tabs */}
      {hasTomorrow && (
        <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveDay('today')}
            className={`flex-1 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-200 ${
              activeDay === 'today'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveDay('tomorrow')}
            className={`flex-1 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-200 ${
              activeDay === 'tomorrow'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            Tomorrow
          </button>
        </div>
      )}

      <div className="text-[13px] text-white/85 leading-[1.8] tracking-wide font-light whitespace-pre-wrap">
        {displayContent ? (
          displayContent.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.includes('**')) {
              return (
                <div key={i} className="font-semibold text-white mt-4 first:mt-0 text-sm tracking-tight">
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            }
            if (line.startsWith('•') || line.startsWith('-')) {
              return (
                <div key={i} className="flex gap-2.5 ml-1 mt-1">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{line.replace(/^[•-]\s*/, '')}</span>
                </div>
              );
            }
            if (line.trim()) {
              return <div key={i} className="mt-1.5 first:mt-0">{line}</div>;
            }
            return <div key={i} className="h-1.5" />;
          })
        ) : (
          <p className="text-white/40 italic text-center py-4">No summary available</p>
        )}
      </div>

      <div className="pt-4 mt-2 border-t border-white/5">
        <p className="text-[10px] text-white/35 font-light leading-relaxed tracking-wide">
          Generated by AI from NWS forecast discussion. Verify key data points.
        </p>
      </div>
    </div>
  );
}

/**
 * GlossaryContent - City-specific glossary of meteorological terms
 */
function GlossaryContent({ office, fullText }) {
  const glossary = getGlossaryForOffice(office);

  if (!glossary) {
    return (
      <div className="text-white/50 text-sm text-center py-8">
        No glossary available for this forecast office.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(glossary).map(([category, terms]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-white/50" />
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {GLOSSARY_CATEGORY_LABELS[category] || category}
            </h4>
          </div>

          <div className="space-y-3">
            {Object.entries(terms)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([term, definition]) => {
                const appearsInDiscussion = termAppearsInText(term, fullText || '');
                return (
                  <div
                    key={term}
                    className={`p-3 rounded-lg border ${
                      appearsInDiscussion
                        ? 'bg-white/5 border-white/20'
                        : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-sm font-medium capitalize ${appearsInDiscussion ? 'text-white' : 'text-white/70'}`}>
                        {term}
                      </span>
                      {appearsInDiscussion && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 whitespace-nowrap">
                          in discussion
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{definition}</p>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * BulletinContent - Displays NWS Public Information Statement
 */
function BulletinContent({ bulletin, loading, office }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Newspaper className="w-8 h-8 text-white/20 mb-2" />
        <p className="text-sm text-white/50">No recent reports available</p>
        <p className="text-xs text-white/30 mt-1">
          Public Information Statements are issued for notable weather events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bulletin.headlines && bulletin.headlines.length > 0 && (
        <div className="space-y-2">
          {bulletin.headlines.map((headline, idx) => (
            <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300 font-medium leading-snug">{headline}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {bulletin.body && (
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {parseAndHighlight(bulletin.body, office)}
          </div>
        </div>
      )}

      {bulletin.timestamp && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-[10px] text-white/40">Issued: {bulletin.timestamp}</p>
        </div>
      )}
    </div>
  );
}

BulletinContent.propTypes = {
  bulletin: PropTypes.shape({
    headlines: PropTypes.arrayOf(PropTypes.string),
    body: PropTypes.string,
    timestamp: PropTypes.string,
  }),
  loading: PropTypes.bool,
  office: PropTypes.string,
};

/**
 * SectionTabs - Section navigation tabs
 */
function SectionTabs({ sections, activeSection, onSelect, compact = false }) {
  return (
    <div className={`flex gap-1 overflow-x-auto pb-1 ${compact ? '-mx-1 px-1' : ''}`}>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className={`
            ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}
            rounded-full font-medium whitespace-nowrap transition-all flex items-center gap-1
            ${activeSection === section.id
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
            }
            ${section.isSummary ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30' : ''}
          `}
        >
          {section.icon && <section.icon className="w-3 h-3" />}
          {section.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Modal Component
// ============================================================================

/**
 * DiscussionModal - Full forecast discussion modal
 */
function DiscussionModal({ discussion, onClose }) {
  const [activeSection, setActiveSection] = useState('summary');
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);
  const { selectionPopup, handleMouseUp, clearSelection } = useTextSelection(contentRef);

  const fullDiscussionText = [
    discussion.synopsis,
    discussion.nearTerm,
    discussion.shortTerm,
    discussion.longTerm,
    discussion.aviation,
    discussion.marine,
  ].filter(Boolean).join(' ');

  const hasGlossary = !!getGlossaryForOffice(discussion.office);

  const sections = [
    { id: 'synopsis', label: 'Syn', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long', content: discussion.longTerm },
    { id: 'aviation', label: 'Avn', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
    ...(hasGlossary ? [{ id: 'glossary', label: 'Gloss', isGlossary: true }] : []),
  ].filter(s => s.content || s.isGlossary);

  function handleAddSelectionToNotes() {
    if (selectionPopup?.text) {
      insertDiscussionToNotes(selectionPopup.text, `NWS ${discussion.office}`);
      clearSelection();
    }
  }

  async function handleCopyAll() {
    const activeContent = sections.find(s => s.id === activeSection)?.content;
    if (activeContent) {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Forecast Discussion</h2>
                <p className="text-sm text-white/60">
                  NWS {discussion.office} • {formatTime(discussion.issuanceTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://forecast.weather.gov/product.php?site=${discussion.office}&issuedby=${discussion.office}&product=AFD`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="View on NWS"
                >
                  <ExternalLink className="w-4 h-4 text-white/70" />
                </a>
                <button
                  onClick={handleCopyAll}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copy section"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/70" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            <div className="mt-3">
              <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
            </div>
          </div>

          <div ref={contentRef} className="relative overflow-y-auto max-h-[55vh] p-4" onMouseUp={handleMouseUp}>
            <SelectionPopupButton selectionPopup={selectionPopup} onAdd={handleAddSelectionToNotes} />

            {sections.map((section) => (
              <div key={section.id} className={activeSection === section.id ? 'block' : 'hidden'}>
                <h3 className="text-sm font-medium text-white/80 mb-2">{section.label}</h3>
                {section.isGlossary ? (
                  <GlossaryContent office={discussion.office} fullText={fullDiscussionText} />
                ) : (
                  <div className="text-sm text-white/70 leading-relaxed">
                    {parseAndHighlight(section.content, discussion.office)}
                  </div>
                )}
              </div>
            ))}
          </div>

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

// ============================================================================
// Expanded Inline Component
// ============================================================================

/**
 * ExpandedDiscussionInline - Full discussion rendered inline (not modal)
 */
function ExpandedDiscussionInline({
  discussion,
  bulletin,
  bulletinsLoading,
  onCollapse,
  citySlug,
  cityName,
  weather,
  markets,
  summary,
  summaryLoading,
  summaryError,
  refreshSummary,
}) {
  const [activeTab, setActiveTab] = useState('discussion');
  const [activeSection, setActiveSection] = useState('summary');
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);
  const { selectionPopup, handleMouseUp, clearSelection } = useTextSelection(contentRef);

  const fullDiscussionText = [
    discussion.synopsis,
    discussion.nearTerm,
    discussion.shortTerm,
    discussion.longTerm,
    discussion.aviation,
    discussion.marine,
  ].filter(Boolean).join(' ');

  const hasGlossary = !!getGlossaryForOffice(discussion.office);

  const sections = [
    { id: 'summary', label: 'AI', isSummary: true, icon: Sparkles },
    { id: 'synopsis', label: 'Syn', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long', content: discussion.longTerm },
    { id: 'aviation', label: 'Avn', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
    ...(hasGlossary ? [{ id: 'glossary', label: 'Gloss', isGlossary: true }] : []),
  ].filter(s => s.content || s.isGlossary || s.isSummary);

  function handleAddSelectionToNotes() {
    if (selectionPopup?.text) {
      insertDiscussionToNotes(selectionPopup.text, `NWS ${discussion.office}`);
      clearSelection();
    }
  }

  async function handleCopyAll() {
    if (activeSection === 'summary' && summary) {
      await navigator.clipboard.writeText(summary);
    } else {
      const activeContent = sections.find(s => s.id === activeSection)?.content;
      if (activeContent) {
        await navigator.clipboard.writeText(activeContent);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentTabIcon = activeTab === 'discussion' ? FileText : Newspaper;
  const CurrentIcon = currentTabIcon;

  return (
    <div className="glass-widget h-full flex flex-col rounded-2xl overflow-hidden animate-[glass-scale-in_300ms_cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl">
      {/* Refined Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <CurrentIcon className="w-[18px] h-[18px] text-white/60" />
              <h2 className="text-base font-semibold text-white tracking-tight leading-tight">
                {activeTab === 'discussion' ? 'Forecast Discussion' : 'NWS Reports'}
              </h2>
            </div>
            <p className="text-[11px] text-white/45 font-light tracking-wide">
              NWS {discussion.office} · {activeTab === 'discussion'
                ? formatTime(discussion.issuanceTime)
                : bulletin
                  ? formatBulletinTime(bulletin.issuanceTime)
                  : ''
              }
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <a
              href={`https://forecast.weather.gov/product.php?site=${discussion.office}&issuedby=${discussion.office}&product=${activeTab === 'discussion' ? 'AFD' : 'PNS'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-white/10"
              title="View on NWS"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/60" />
            </a>
            {activeTab === 'discussion' && (
              <button
                onClick={handleCopyAll}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-white/10"
                title="Copy section"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
              </button>
            )}
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-white/10"
                title="Collapse"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
              </button>
            )}
          </div>
        </div>

        {/* Refined Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-200 ${
              activeTab === 'discussion'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="tracking-wide">Discussion</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-200 relative ${
              activeTab === 'reports'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span className="tracking-wide">Reports</span>
            {bulletin && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-black/50" />
            )}
          </button>
        </div>

        {/* Section Pills */}
        {activeTab === 'discussion' && (
          <div className="mt-3 -mx-1">
            <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} compact />
          </div>
        )}
      </div>

      {/* Content Area with Better Padding */}
      <div
        ref={contentRef}
        className="relative flex-1 overflow-y-auto px-5 py-4"
        onMouseUp={activeTab === 'discussion' ? handleMouseUp : undefined}
      >
        {activeTab === 'discussion' && (
          <>
            <SelectionPopupButton selectionPopup={selectionPopup} onAdd={handleAddSelectionToNotes} />

            {sections.map((section) => (
              <div key={section.id} className={activeSection === section.id ? 'block' : 'hidden'}>
                {section.isSummary ? (
                  <ToastySummaryContent
                    summary={summary}
                    loading={summaryLoading}
                    error={summaryError}
                    onRefresh={refreshSummary}
                  />
                ) : section.isGlossary ? (
                  <GlossaryContent office={discussion.office} fullText={fullDiscussionText} />
                ) : (
                  <div className="text-[13px] text-white/80 leading-[1.75] tracking-wide font-light">
                    {parseAndHighlight(section.content, discussion.office)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'reports' && (
          <BulletinContent bulletin={bulletin} loading={bulletinsLoading} office={discussion.office} />
        )}
      </div>

      {/* Refined Footer */}
      <div className="px-5 py-2.5 bg-gradient-to-t from-white/[0.02] to-transparent border-t border-white/5 flex-shrink-0">
        <p className="text-[10px] text-white/35 text-center font-light leading-relaxed tracking-wide">
          {activeTab === 'discussion'
            ? 'Click highlighted terms or select text to add to notes'
            : 'Public Information Statements contain record weather data and climate summaries'
          }
        </p>
      </div>
    </div>
  );
}

ExpandedDiscussionInline.propTypes = {
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
  bulletin: PropTypes.shape({
    id: PropTypes.string,
    issuanceTime: PropTypes.string,
    headlines: PropTypes.arrayOf(PropTypes.string),
    body: PropTypes.string,
    office: PropTypes.string,
    timestamp: PropTypes.string,
  }),
  bulletinsLoading: PropTypes.bool,
  onCollapse: PropTypes.func,
  citySlug: PropTypes.string,
  cityName: PropTypes.string,
  weather: PropTypes.object,
  markets: PropTypes.object,
  summary: PropTypes.string,
  summaryLoading: PropTypes.bool,
  summaryError: PropTypes.string,
  refreshSummary: PropTypes.func,
};

// ============================================================================
// Main Widget Component
// ============================================================================

/**
 * NWSDiscussionWidget - Shows NWS Area Forecast Discussion
 * Supports two modes:
 * - Compact: Small card that opens modal on click (default)
 * - Expanded: Inline expanded view that fills the grid area
 */
export default function NWSDiscussionWidget({
  lat,
  lon,
  citySlug,
  cityName,
  forecastOffice,
  weather = null,
  markets = null,
  loading: externalLoading = false,
  isExpanded = false,
  onToggleExpand = null,
}) {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { latestBulletin, hasFreshBulletin, loading: bulletinsLoading } = useNWSBulletins(
    forecastOffice || discussion?.office,
    true
  );

  // Get model forecast data for AI summary grounding
  const { forecasts: modelForecasts } = useMultiModelForecast(citySlug);

  // Preload AI summary (even in compact view) to prevent flickering when expanding
  const { summary, loading: summaryLoading, error: summaryError, refresh: refreshSummary } = useToastySummary({
    citySlug,
    cityName,
    discussion,
    weather,
    markets,
    models: modelForecasts,
  });

  const fetchDiscussion = useCallback(async () => {
    if (!lat || !lon) return;

    const cacheKey = `nws_afd_v2_${citySlug}`;

    // Check cache (30 min)
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
    } catch {
      // Ignore cache errors
    }

    setLoading(true);

    try {
      const pointsRes = await fetch(
        `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );
      if (!pointsRes.ok) throw new Error('Failed to get grid point');

      const pointsData = await pointsRes.json();
      const cwa = pointsData.properties?.cwa;
      if (!cwa) throw new Error('No forecast office found');

      const afdListRes = await fetch(
        `https://api.weather.gov/products/types/AFD/locations/${cwa}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );
      if (!afdListRes.ok) throw new Error('Failed to get AFD list');

      const afdList = await afdListRes.json();
      const latestAfd = afdList['@graph']?.[0];
      if (!latestAfd) throw new Error('No AFD available');

      const afdRes = await fetch(latestAfd['@id'], {
        headers: { 'User-Agent': 'Toasty Research App' },
      });
      if (!afdRes.ok) throw new Error('Failed to get AFD content');

      const afdData = await afdRes.json();
      const result = parseDiscussion(afdData.productText || '', {
        office: cwa,
        issuanceTime: latestAfd.issuanceTime,
        officeName: afdData.issuingOffice,
      });

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {
        // Ignore storage errors
      }

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

  // Loading state
  if (loading || externalLoading) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size={isExpanded ? 'large' : 'small'}>
        <div className={`flex items-center justify-center h-full animate-pulse ${isExpanded ? 'min-h-[300px]' : ''}`}>
          <div className="w-full h-12 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  // Error state
  if (error || !discussion) {
    return (
      <GlassWidget title="DISCUSSION" icon={FileText} size={isExpanded ? 'large' : 'small'}>
        <div className={`flex items-center justify-center h-full text-white/40 text-xs ${isExpanded ? 'min-h-[300px]' : ''}`}>
          Unable to load discussion
        </div>
      </GlassWidget>
    );
  }

  const keywords = extractKeywords(
    `${discussion.synopsis || ''} ${discussion.nearTerm || ''} ${discussion.shortTerm || ''}`
  );
  const synopsisExcerpt = extractSynopsisExcerpt(discussion.synopsis);

  function handleClick() {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  }

  // Expanded inline view
  if (isExpanded) {
    return (
      <ExpandedDiscussionInline
        discussion={discussion}
        bulletin={latestBulletin}
        bulletinsLoading={bulletinsLoading}
        onCollapse={onToggleExpand}
        citySlug={citySlug}
        cityName={cityName}
        weather={weather}
        markets={markets}
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
        refreshSummary={refreshSummary}
      />
    );
  }

  // Compact widget view
  // Extract short summary (first sentence or ~150 chars) from AI summary (today only)
  const getShortSummary = () => {
    if (!summary) return null;

    // Use today's summary for compact view
    const todaySummary = summary.today || summary.raw || '';
    if (!todaySummary) return null;

    // Get first sentence or first 150 characters
    const firstSentence = todaySummary.split(/[.!?]\s/)[0];
    if (firstSentence.length > 0 && firstSentence.length <= 150) {
      return firstSentence + '.';
    }

    // Otherwise truncate at 150 chars
    if (todaySummary.length > 150) {
      return todaySummary.substring(0, 147) + '...';
    }

    return todaySummary;
  };

  const shortSummary = getShortSummary();

  return (
    <>
      <GlassWidget
        title="DISCUSSION"
        icon={FileText}
        size="small"
        onClick={handleClick}
        className="cursor-pointer"
        headerRight={
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full hover:bg-blue-500/30 transition-colors whitespace-nowrap">
              More
              <ChevronRight className="w-3 h-3" />
            </span>
            {onToggleExpand && (
              <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
            )}
          </div>
        }
      >
        <div className="flex flex-col h-full gap-3 overflow-hidden">
          {/* AI Summary (if available) */}
          {shortSummary && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    AI Forecast Summary
                  </h3>
                </div>
              </div>
              <p className="text-[13px] leading-[1.65] text-white/90 font-light tracking-wide line-clamp-4">
                {shortSummary}
              </p>
            </div>
          )}

          {/* Loading state for AI summary */}
          {summaryLoading && !shortSummary && (
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                <span className="text-xs text-violet-300/70 font-light italic">Generating forecast...</span>
              </div>
            </div>
          )}

          {/* Fallback to synopsis if no AI summary */}
          {!shortSummary && !summaryLoading && synopsisExcerpt && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Synopsis
                  </h3>
                </div>
              </div>
              <p className="text-[13px] leading-[1.65] text-white/85 font-light tracking-wide line-clamp-4">
                {synopsisExcerpt}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!shortSummary && !summaryLoading && !synopsisExcerpt && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-white/40 font-light italic">
                Tap to view forecast discussion
              </p>
            </div>
          )}

          {/* Footer metadata */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-white/50 tracking-wide">
                NWS {discussion.office}
              </span>
              {keywords.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <div className="flex gap-1">
                    {keywords.slice(0, 2).map((kw, i) => {
                      const baseColors = CATEGORY_COLORS[kw.category]?.replace('hover:bg-', '') || 'bg-white/20 text-white/80';
                      return (
                        <span key={i} className={`${baseColors} px-1.5 py-0.5 rounded text-[9px] font-medium opacity-60`}>
                          {kw.text}
                        </span>
                      );
                    })}
                    {keywords.length > 2 && (
                      <span className="text-[9px] text-white/30 px-1">+{keywords.length - 2}</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <span className="text-[10px] text-white/35 font-light tracking-wide">
              {formatRelativeTime(discussion.issuanceTime)}
            </span>
          </div>
        </div>
      </GlassWidget>

      {isModalOpen && !onToggleExpand && (
        <DiscussionModal discussion={discussion} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

NWSDiscussionWidget.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string,
  forecastOffice: PropTypes.string,
  weather: PropTypes.object,
  markets: PropTypes.object,
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};
