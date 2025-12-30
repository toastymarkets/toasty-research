import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FileText, X, ChevronRight } from 'lucide-react';
import GlassWidget from './GlassWidget';

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
 * DiscussionModal - Full forecast discussion
 */
function DiscussionModal({ discussion, onClose }) {
  const [activeSection, setActiveSection] = useState('synopsis');

  const sections = [
    { id: 'synopsis', label: 'Synopsis', content: discussion.synopsis },
    { id: 'nearTerm', label: 'Near Term', content: discussion.nearTerm },
    { id: 'shortTerm', label: 'Short Term', content: discussion.shortTerm },
    { id: 'longTerm', label: 'Long Term', content: discussion.longTerm },
    { id: 'aviation', label: 'Aviation', content: discussion.aviation },
    { id: 'marine', label: 'Marine', content: discussion.marine },
  ].filter(s => s.content);

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
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
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
          <div className="overflow-y-auto max-h-[55vh] p-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {section.label}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Area Forecast Discussion from National Weather Service
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
