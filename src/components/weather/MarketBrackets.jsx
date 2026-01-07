import { useState, useEffect, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, ExternalLink, ChevronRight, Plus, Maximize2 } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import { useDataChip } from '../../context/DataChipContext';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';
import MultiBracketChart from './MultiBracketChart';

// Lazy load the heavy modal component
const MarketBracketsModal = lazy(() => import('./MarketBracketsModal'));

/**
 * Generate Kalshi market URL for a city
 * Example: https://kalshi.com/markets/kxhighlax/highest-temperature-in-los-angeles
 */
const getKalshiUrl = (citySlug, cityName) => {
  const seriesTicker = CITY_SERIES[citySlug];
  if (!seriesTicker) return null;

  const tickerLower = seriesTicker.toLowerCase();
  const citySlugForUrl = `highest-temperature-in-${cityName.toLowerCase().replace(/\s+/g, '-')}`;

  return `https://kalshi.com/markets/${tickerLower}/${citySlugForUrl}`;
};

/**
 * MarketBrackets - Kalshi temperature market widget
 * Displays real-time market brackets with prices and changes
 * Supports inline expansion on desktop, modal on mobile
 * @param {string} variant - 'horizontal' (wide) or 'vertical' (tall/narrow)
 */
export default function MarketBrackets({
  citySlug,
  cityName,
  loading: externalLoading = false,
  variant = 'horizontal',
  isExpanded = false,
  onToggleExpand
}) {
  const isVertical = variant === 'vertical';
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { brackets, closeTime, loading, error, seriesTicker, refetch } = useKalshiMarkets(citySlug, dayOffset);
  const { insertDataChip, isAvailable: canInsertChip } = useDataChip();

  // Simple mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const dayLabel = dayOffset === 0 ? 'today' : 'tomorrow';
  const hasSeries = CITY_SERIES[citySlug];

  // Condense label: "39° to 40°" -> "39-40°"
  const condenseLabel = (label) => {
    return label
      .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
      .replace(/(\d+)°\s*or above/i, '≥$1°')
      .replace(/(\d+)°\s*or below/i, '≤$1°');
  };

  // Handle inserting bracket data as a chip into notes
  const handleBracketInsert = (bracket, e) => {
    e.stopPropagation(); // Prevent modal from opening

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    insertDataChip({
      value: condenseLabel(bracket.label),
      secondary: `${bracket.yesPrice}%`,
      label: 'Market Odds',
      source: `Kalshi ${seriesTicker}`,
      timestamp,
      type: 'market',
    });
  };

  // Timer for market close
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!closeTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = closeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Closed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [closeTime]);

  const isLoading = loading || externalLoading;

  if (!hasSeries) {
    return (
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large">
        <div className="flex items-center justify-center h-full text-glass-text-muted text-sm">
          No Kalshi market available for this city
        </div>
      </GlassWidget>
    );
  }

  if (isLoading) {
    return (
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large">
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="w-20 h-4 bg-white/10 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-12 h-4 bg-white/10 rounded" />
                <div className="w-16 h-7 bg-white/10 rounded-lg" />
                <div className="w-16 h-7 bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </GlassWidget>
    );
  }

  if (error) {
    return (
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large">
        <ErrorState
          message={error}
          onRetry={() => refetch(true)}
          compact
        />
      </GlassWidget>
    );
  }

  // Extract temperature from label for sorting
  const getTempValue = (label) => {
    const match = label.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Sort brackets by temperature (lowest to highest)
  const sortedBrackets = [...brackets].sort((a, b) => getTempValue(a.label) - getTempValue(b.label));

  // Find the leading bracket (highest probability)
  const leadingBracket = brackets.reduce((max, b) => b.yesPrice > (max?.yesPrice || 0) ? b : max, null);

  // Get color based on probability - dark navy blue gradient
  const getProbColor = (prob) => {
    if (prob >= 80) return '#60A5FA'; // Brightest navy - very likely
    if (prob >= 50) return '#3B82F6'; // Medium navy - likely
    if (prob >= 20) return '#2563EB'; // Dark navy - possible
    return '#1D4ED8'; // Deepest navy - unlikely
  };

  // Title changes based on variant
  const widgetTitle = isVertical
    ? 'MARKET BRACKETS'
    : `Highest temperature in ${cityName} ${dayLabel}?`;

  // Handle widget click - expand inline on desktop, modal on mobile
  const handleWidgetClick = () => {
    if (isMobile) {
      setIsModalOpen(true);
    } else if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true); // Fallback if no toggle provided
    }
  };

  // Render inline expanded view on desktop
  if (isExpanded && !isMobile && brackets.length > 0) {
    return (
      <ExpandedBracketsInline
        brackets={brackets}
        cityName={cityName}
        seriesTicker={seriesTicker}
        closeTime={closeTime}
        dayOffset={dayOffset}
        onDayChange={setDayOffset}
        onCollapse={onToggleExpand}
        canInsertChip={canInsertChip}
        insertDataChip={insertDataChip}
        condenseLabel={condenseLabel}
        getKalshiUrl={() => getKalshiUrl(citySlug, cityName)}
      />
    );
  }

  return (
    <>
    <GlassWidget
      title={widgetTitle}
      icon={TrendingUp}
      size="large"
      className="h-full cursor-pointer"
      onClick={handleWidgetClick}
      headerRight={onToggleExpand && (
        <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
      )}
    >

      {/* Day Toggle */}
      <div className={isVertical ? 'pb-1' : 'pb-2'}>
        <div className="inline-flex bg-white/10 rounded-lg p-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setDayOffset(0); }}
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
              dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Tdy
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDayOffset(1); }}
            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
              dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Tmw
          </button>
        </div>
      </div>

      {/* Brackets List */}
      <div className="pb-2 overflow-y-auto flex-1">
        {sortedBrackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-[11px]">
            No markets for {dayLabel}
          </div>
        ) : (
          <div className="space-y-0.5">
            {sortedBrackets.map((bracket, i) => {
              const isLeader = bracket.ticker === leadingBracket?.ticker;
              const probColor = getProbColor(bracket.yesPrice);

              return (
                <div
                  key={bracket.ticker || i}
                  className={`group relative flex items-center justify-between py-1.5 px-1 rounded-lg transition-all ${
                    isLeader ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Probability bar background */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg opacity-30"
                    style={{
                      width: `${bracket.yesPrice}%`,
                      backgroundColor: probColor,
                    }}
                  />

                  {/* Quick Add Button */}
                  {canInsertChip && (
                    <button
                      onClick={(e) => handleBracketInsert(bracket, e)}
                      className="relative opacity-0 group-hover:opacity-100 mr-1.5
                                 w-4 h-4 rounded-full bg-white/25 border border-white/20
                                 flex items-center justify-center transition-all z-10
                                 hover:scale-110 hover:bg-white/35 flex-shrink-0
                                 backdrop-blur-sm shadow-sm"
                      title="Add to notes"
                    >
                      <Plus size={10} strokeWidth={3} className="text-white/90" />
                    </button>
                  )}

                  {/* Content */}
                  <span className={`relative text-[12px] font-bold flex-1 ${isLeader ? 'text-white' : 'text-white/70'}`}>
                    {condenseLabel(bracket.label)}
                  </span>

                  <span className="relative text-[13px] font-bold tabular-nums text-white">
                    {bracket.yesPrice}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Kalshi link and timer */}
      <div className="pt-1 pb-2 flex items-center justify-between border-t border-white/10 mt-1">
        <a
          href={getKalshiUrl(citySlug, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-medium text-white/40 uppercase tracking-wide hover:text-white/60 transition-colors"
        >
          Kalshi Odds
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <div className="flex items-center gap-2">
          {timeRemaining && timeRemaining !== 'Closed' && (
            <span className="text-[9px] text-white/40">Closes {timeRemaining}</span>
          )}
          <ChevronRight className="w-4 h-4 text-white/30" />
        </div>
      </div>
    </GlassWidget>

    {/* Detail Modal - Lazy loaded */}
    {isModalOpen && (
      <Suspense fallback={null}>
        <MarketBracketsModal
          brackets={brackets}
          cityName={cityName}
          seriesTicker={seriesTicker}
          closeTime={closeTime}
          dayOffset={dayOffset}
          onDayChange={setDayOffset}
          onClose={() => setIsModalOpen(false)}
        />
      </Suspense>
    )}
    </>
  );
}

MarketBrackets.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['horizontal', 'vertical']),
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedBracketsInline - Inline expanded view for desktop
 */
function ExpandedBracketsInline({
  brackets,
  cityName,
  seriesTicker,
  closeTime,
  dayOffset,
  onDayChange,
  onCollapse,
  canInsertChip,
  insertDataChip,
  condenseLabel,
  getKalshiUrl,
}) {
  // Timer for market close
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Chart period state
  const [chartPeriod, setChartPeriod] = useState('1d');

  // Fetch multi-bracket price history for the chart
  const {
    data: chartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, chartPeriod, 4, true);

  useEffect(() => {
    if (!closeTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = closeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Closed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [closeTime]);

  // Extract temperature from label for sorting
  const getTempValue = (label) => {
    const match = label.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Sort brackets by temperature
  const sortedBrackets = [...brackets].sort((a, b) => getTempValue(a.label) - getTempValue(b.label));

  // Find the leading bracket
  const leadingBracket = brackets.reduce((max, b) => b.yesPrice > (max?.yesPrice || 0) ? b : max, null);

  // Get color based on probability
  const getProbColor = (prob) => {
    if (prob >= 80) return '#60A5FA';
    if (prob >= 50) return '#3B82F6';
    if (prob >= 20) return '#2563EB';
    return '#1D4ED8';
  };

  // Handle inserting bracket data as a chip into notes
  const handleBracketInsert = (bracket, e) => {
    e.stopPropagation();
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    insertDataChip({
      value: condenseLabel(bracket.label),
      secondary: `${bracket.yesPrice}%`,
      label: 'Market Odds',
      source: `Kalshi ${seriesTicker}`,
      timestamp,
      type: 'market',
    });
  };

  const dayLabel = dayOffset === 0 ? 'Today' : 'Tomorrow';

  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold text-white">Market Brackets</span>
            <span className="text-xs text-white/40">{cityName}</span>
          </div>
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            title="Collapse"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Day toggle + Timer row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-0.5 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onDayChange(0)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onDayChange(1)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Tomorrow
            </button>
          </div>
          {timeRemaining && timeRemaining !== 'Closed' && (
            <span className="text-[10px] text-white/40">Closes {timeRemaining}</span>
          )}
        </div>
      </div>

      {/* Multi-Bracket Price Chart */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
        <MultiBracketChart
          data={chartData}
          legendData={legendData}
          bracketColors={bracketColors}
          period={chartPeriod}
          onPeriodChange={setChartPeriod}
          loading={chartLoading}
          cityName={cityName}
        />
      </div>

      {/* Content: Two-column layout - brackets list + stats */}
      <div className="flex-1 flex overflow-hidden">
        {/* Brackets list - scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {sortedBrackets.map((bracket, i) => {
              const isLeader = bracket.ticker === leadingBracket?.ticker;
              const probColor = getProbColor(bracket.yesPrice);

              return (
                <div
                  key={bracket.ticker || i}
                  className={`group relative flex items-center justify-between py-2 px-2 rounded-lg transition-all ${
                    isLeader ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Probability bar background */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg opacity-30"
                    style={{ width: `${bracket.yesPrice}%`, backgroundColor: probColor }}
                  />

                  {/* Quick Add Button */}
                  {canInsertChip && (
                    <button
                      onClick={(e) => handleBracketInsert(bracket, e)}
                      className="relative opacity-0 group-hover:opacity-100 mr-2
                                 w-5 h-5 rounded-full bg-white/25 border border-white/20
                                 flex items-center justify-center transition-all z-10
                                 hover:scale-110 hover:bg-white/35 flex-shrink-0"
                      title="Add to notes"
                    >
                      <Plus size={12} strokeWidth={3} className="text-white/90" />
                    </button>
                  )}

                  <span className={`relative text-sm font-medium flex-1 ${isLeader ? 'text-white' : 'text-white/70'}`}>
                    {condenseLabel(bracket.label)}
                  </span>

                  <span className="relative text-sm font-bold tabular-nums text-white">
                    {bracket.yesPrice}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="w-36 flex-shrink-0 border-l border-white/10 p-3 flex flex-col">
          <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Leading</p>
          {leadingBracket && (
            <div className="bg-white/10 rounded-lg p-2 mb-3">
              <div className="text-lg font-bold text-white">{condenseLabel(leadingBracket.label)}</div>
              <div className="text-xl font-bold text-blue-400">{leadingBracket.yesPrice}%</div>
            </div>
          )}

          <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Brackets</p>
          <div className="text-sm text-white/60">
            {sortedBrackets.length} ranges
          </div>

          <div className="mt-auto pt-3">
            <a
              href={getKalshiUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
            >
              Open in Kalshi
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

ExpandedBracketsInline.propTypes = {
  brackets: PropTypes.array.isRequired,
  cityName: PropTypes.string.isRequired,
  seriesTicker: PropTypes.string,
  closeTime: PropTypes.instanceOf(Date),
  dayOffset: PropTypes.number.isRequired,
  onDayChange: PropTypes.func.isRequired,
  onCollapse: PropTypes.func.isRequired,
  canInsertChip: PropTypes.bool,
  insertDataChip: PropTypes.func,
  condenseLabel: PropTypes.func.isRequired,
  getKalshiUrl: PropTypes.func.isRequired,
};
