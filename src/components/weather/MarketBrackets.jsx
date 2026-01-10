import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, ExternalLink, ChevronRight, Plus, Maximize2, ChevronDown, TrendingDown } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import { useDataChip } from '../../context/DataChipContext';
import { useKalshiCandlesticks } from '../../hooks/useKalshiCandlesticks';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';
import MultiBracketChart from './MultiBracketChart';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

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

  // Fetch price history for the leading bracket (for sparkline chart)
  const {
    data: chartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, '1h', 3, brackets.length > 0);

  // Calculate price changes from chart data
  const priceChanges = useMemo(() => {
    if (!chartData || chartData.length < 2) return {};

    const changes = {};
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    brackets.forEach(bracket => {
      const startPrice = firstPoint[bracket.label];
      const endPrice = lastPoint[bracket.label];
      if (startPrice && endPrice) {
        changes[bracket.ticker] = endPrice - startPrice;
      }
    });

    return changes;
  }, [chartData, brackets]);

  if (!hasSeries) {
    return (
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large" tier="primary">
        <div className="flex items-center justify-center h-full text-glass-text-muted text-sm">
          No Kalshi market available for this city
        </div>
      </GlassWidget>
    );
  }

  if (isLoading) {
    return (
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large" tier="primary">
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
      <GlassWidget title="MARKET BRACKETS" icon={TrendingUp} size="large" tier="primary">
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

  // Get color based on temperature (cold to hot gradient)
  const getTemperatureColor = (label) => {
    const temp = parseInt(label.match(/\d+/)?.[0] || 60);
    if (temp <= 40) return '#3B82F6'; // blue - cold
    if (temp <= 55) return '#06B6D4'; // cyan - cool
    if (temp <= 70) return '#10B981'; // green - mild
    if (temp <= 85) return '#F59E0B'; // amber - warm
    return '#EF4444'; // red - hot
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
      title="MARKET BRACKETS"
      icon={TrendingUp}
      size="large"
      tier="primary"
      className="h-full cursor-pointer flex flex-col"
      onClick={handleWidgetClick}
      headerRight={
        <div className="flex items-center gap-2">
          {/* Day Toggle in header */}
          <div className="inline-flex bg-white/10 rounded-md p-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); setDayOffset(0); }}
              className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all ${
                dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Tdy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDayOffset(1); }}
              className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all ${
                dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Tmw
            </button>
          </div>
          {onToggleExpand && (
            <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
          )}
        </div>
      }
    >
      {/* Hero: Leading Bracket */}
      {leadingBracket && (
        <div className="bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent
                        rounded-xl p-3 mb-3 border border-blue-400/20 flex-shrink-0">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">
                {condenseLabel(leadingBracket.label)}
              </span>
              <span className="text-2xl font-black text-white tabular-nums">
                {leadingBracket.yesPrice}%
              </span>
            </div>
            {priceChanges[leadingBracket.ticker] !== undefined && priceChanges[leadingBracket.ticker] !== 0 && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                priceChanges[leadingBracket.ticker] > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {priceChanges[leadingBracket.ticker] > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(priceChanges[leadingBracket.ticker]).toFixed(0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
            <span>Leading bracket</span>
            {timeRemaining && timeRemaining !== 'Closed' && (
              <>
                <span>•</span>
                <span>Closes {timeRemaining}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Probability Distribution Bars - Fills remaining space */}
      <div className="flex-1 flex flex-col gap-1 min-h-0">
        {sortedBrackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-[11px]">
            No markets for {dayLabel}
          </div>
        ) : (
          sortedBrackets.map((bracket, i) => {
            const isLeader = bracket.ticker === leadingBracket?.ticker;
            const barColor = getTemperatureColor(bracket.label);
            const priceChange = priceChanges[bracket.ticker];

            return (
              <div
                key={bracket.ticker || i}
                className={`group flex items-center gap-2 px-2 rounded-lg transition-all cursor-pointer
                           ${isLeader ? 'bg-white/10 ring-1 ring-blue-400/30' : 'hover:bg-white/5'}`}
                style={{ flex: '1 1 0', minHeight: '36px' }}
              >
                {/* Temperature Label */}
                <span className={`w-14 text-xs font-semibold flex-shrink-0 ${isLeader ? 'text-white' : 'text-white/70'}`}>
                  {condenseLabel(bracket.label)}
                </span>

                {/* Bar Container */}
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                  {/* Animated Probability Bar */}
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(bracket.yesPrice, 2)}%`,
                      background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
                      boxShadow: isLeader ? `0 0 12px ${barColor}50` : 'none'
                    }}
                  />
                </div>

                {/* Price Change */}
                {priceChange !== undefined && priceChange !== 0 && (
                  <span className={`text-[9px] font-medium w-6 text-right flex-shrink-0 ${
                    priceChange > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {priceChange > 0 ? '↑' : '↓'}{Math.abs(priceChange).toFixed(0)}
                  </span>
                )}

                {/* Percentage */}
                <span className={`w-10 text-right text-sm font-bold tabular-nums flex-shrink-0
                                 ${isLeader ? 'text-white' : 'text-white/70'}`}>
                  {bracket.yesPrice}%
                </span>

                {/* Quick Add (hover) */}
                {canInsertChip && (
                  <button
                    onClick={(e) => handleBracketInsert(bracket, e)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full
                               bg-white/20 flex items-center justify-center transition-all
                               hover:bg-white/30 flex-shrink-0"
                    title="Add to notes"
                  >
                    <Plus size={10} strokeWidth={3} className="text-white/90" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer - Compact */}
      <div className="pt-2 flex items-center justify-between border-t border-white/10 mt-2 flex-shrink-0">
        <a
          href={getKalshiUrl(citySlug, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-medium text-white/40 hover:text-white/60 transition-colors"
        >
          Kalshi
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <div className="flex items-center gap-1.5">
          {timeRemaining && timeRemaining !== 'Closed' && (
            <span className="text-[10px] text-white/40">{timeRemaining}</span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
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

  // Individual bracket expansion state
  const [expandedBracket, setExpandedBracket] = useState(null);

  // Multi-bracket chart state and data
  const [chartPeriod, setChartPeriod] = useState('1d');
  const {
    data: chartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, chartPeriod, 6, true);

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

      {/* Multi-bracket overview chart */}
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

      {/* Brackets list - full width, scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {sortedBrackets.map((bracket, i) => {
              const isLeader = bracket.ticker === leadingBracket?.ticker;
              const probColor = getProbColor(bracket.yesPrice);
              const isExpanded = expandedBracket === bracket.ticker;

              return (
                <BracketRowWithChart
                  key={bracket.ticker || i}
                  bracket={bracket}
                  seriesTicker={seriesTicker}
                  isLeader={isLeader}
                  probColor={probColor}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedBracket(isExpanded ? null : bracket.ticker)}
                  canInsertChip={canInsertChip}
                  insertDataChip={insertDataChip}
                  condenseLabel={condenseLabel}
                  handleBracketInsert={handleBracketInsert}
                />
              );
            })}
          </div>
        </div>
      </div>
  );
}

/**
 * BracketRowWithChart - Individual bracket row with expandable price chart
 */
function BracketRowWithChart({
  bracket,
  seriesTicker,
  isLeader,
  probColor,
  isExpanded,
  onToggle,
  canInsertChip,
  handleBracketInsert,
  condenseLabel,
}) {
  const [period, setPeriod] = useState('1h');
  const [chartReady, setChartReady] = useState(false);

  // Delay chart rendering to ensure container has dimensions
  useEffect(() => {
    if (isExpanded && !chartReady) {
      const timer = setTimeout(() => setChartReady(true), 50);
      return () => clearTimeout(timer);
    }
    if (!isExpanded) {
      setChartReady(false);
    }
  }, [isExpanded, chartReady]);

  // Fetch candlesticks when expanded
  const { candles, loading: candlesLoading } = useKalshiCandlesticks(
    seriesTicker,
    bracket.ticker,
    period,
    isExpanded
  );

  // Prepare chart data
  const chartData = candles
    .filter(c => c && typeof c.timestamp === 'number' && c.timestamp > 0)
    .map((c) => {
      const price = typeof c.yesPrice === 'number' ? c.yesPrice :
                    typeof c.close === 'number' ? c.close : 0;
      const timeObj = c.time instanceof Date ? c.time : new Date(c.timestamp * 1000);

      return {
        time: c.timestamp,
        timeLabel: timeObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        price: price,
      };
    })
    .filter(d => d.price > 0);

  // Calculate price range
  const prices = chartData.map((d) => d.price).filter((p) => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.max(0, Math.min(...prices) - 5) : 0;
  const maxPrice = prices.length > 0 ? Math.min(100, Math.max(...prices) + 5) : 100;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-black/80 backdrop-blur-sm px-2 py-1.5 rounded-lg text-xs border border-white/10">
        <div className="text-white/60 mb-0.5">{data.timeLabel}</div>
        <div className="text-white font-medium">{data.price}¢</div>
      </div>
    );
  };

  return (
    <div className={`border border-white/5 rounded-lg ${isExpanded ? 'bg-white/5' : ''}`}>
      {/* Main Row - Clickable (using div to allow nested button) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className={`group relative w-full flex items-center justify-between py-2 px-2 rounded-lg transition-all cursor-pointer ${
          isLeader ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
      >
        {/* Probability bar background */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-lg opacity-30"
          style={{ width: `${bracket.yesPrice}%`, backgroundColor: probColor }}
        />

        {/* Chevron */}
        <ChevronDown
          className={`relative w-4 h-4 text-white/40 transition-transform flex-shrink-0 mr-2 ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />

        {/* Quick Add Button */}
        {canInsertChip && (
          <button
            onClick={(e) => { e.stopPropagation(); handleBracketInsert(bracket, e); }}
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

      {/* Expanded Content - Chart */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {/* Period Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/50">Price History</span>
            <div className="flex bg-white/10 rounded-lg p-0.5">
              {['1h', '6h', '12h'].map((p) => (
                <button
                  key={p}
                  onClick={(e) => { e.stopPropagation(); setPeriod(p); }}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                    period === p
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[150px]">
            {candlesLoading || !chartReady ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/40 text-xs">
                No price history available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(ts) => {
                      const date = new Date(ts * 1000);
                      return date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    domain={[minPrice, maxPrice]}
                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    tickFormatter={(v) => `${v}¢`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={bracket.yesPrice}
                    stroke="rgba(255,255,255,0.2)"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#fff', stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

BracketRowWithChart.propTypes = {
  bracket: PropTypes.object.isRequired,
  seriesTicker: PropTypes.string.isRequired,
  isLeader: PropTypes.bool,
  probColor: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  canInsertChip: PropTypes.bool,
  handleBracketInsert: PropTypes.func.isRequired,
  condenseLabel: PropTypes.func.isRequired,
};

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
