import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, ExternalLink, Plus, Thermometer } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import { useDataChip } from '../../context/DataChipContext';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import { useSettlementObservation } from '../../hooks/useSettlementObservation';
import { useMultiModelForecast } from '../../hooks/useMultiModelForecast';
import { calculateAllEdges, getModelConsensus } from '../../utils/edgeCalculator';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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
 * @param {string} variant - 'horizontal' (wide) or 'vertical' (tall/narrow)
 */
export default function MarketBrackets({
  citySlug,
  cityName,
  loading: externalLoading = false,
  variant = 'horizontal',
}) {
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const [hoveredBracket, setHoveredBracket] = useState(null); // For chart-row interaction
  const { brackets, closeTime, loading, error, seriesTicker, refetch } = useKalshiMarkets(citySlug, dayOffset);
  const { insertDataChip, isEditorReady } = useDataChip();

  // Settlement station observation - THE temperature that determines settlement
  const {
    temperature: settlementTemp,
    trend: settlementTrend,
    isStale: settlementStale,
    stationId,
    stationName,
  } = useSettlementObservation(citySlug);

  // Model forecasts for edge calculation
  const { forecasts: modelForecasts } = useMultiModelForecast(citySlug);

  // Calculate model consensus and edges
  const modelConsensus = useMemo(() => {
    if (!modelForecasts?.models) return null;
    return getModelConsensus(modelForecasts.models);
  }, [modelForecasts]);

  const bracketEdges = useMemo(() => {
    if (!modelForecasts?.models || !brackets?.length) return {};
    return calculateAllEdges(modelForecasts.models, brackets);
  }, [modelForecasts, brackets]);

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

  // Find the leading bracket (highest probability) - calculated early for chart/volatility
  const leadingBracket = useMemo(() => {
    return brackets.reduce((max, b) => b.yesPrice > (max?.yesPrice || 0) ? b : max, null);
  }, [brackets]);

  // Fetch price history for the leading bracket (for sparkline chart)
  const {
    data: rawChartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, '1d', 10, brackets.length > 0);

  // Cache chart data to prevent flickering during refresh
  const [cachedChartData, setCachedChartData] = useState([]);
  useEffect(() => {
    if (rawChartData && rawChartData.length > 0) {
      setCachedChartData(rawChartData);
    }
  }, [rawChartData]);

  // Use cached data if current data is empty (during refresh)
  const chartData = rawChartData?.length > 0 ? rawChartData : cachedChartData;

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

  // Calculate dynamic Y-axis domain based on actual data range
  const chartDomain = useMemo(() => {
    if (!chartData || chartData.length === 0 || brackets.length === 0) {
      return [0, 100];
    }

    let minVal = Infinity;
    let maxVal = -Infinity;

    chartData.forEach(point => {
      brackets.forEach(bracket => {
        const val = point[bracket.label];
        if (typeof val === 'number') {
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      });
    });

    if (minVal === Infinity || maxVal === -Infinity) {
      return [0, 100];
    }

    // Add padding (15% on each side) for visual breathing room
    const range = maxVal - minVal;
    const padding = Math.max(range * 0.15, 5); // At least 5% padding

    // Round to nice numbers for cleaner axis
    const paddedMin = Math.max(0, Math.floor((minVal - padding) / 5) * 5);
    const paddedMax = Math.min(100, Math.ceil((maxVal + padding) / 5) * 5);

    return [paddedMin, paddedMax];
  }, [chartData, brackets]);

  // Calculate market volatility indicator (standard deviation of leading bracket)
  const volatility = useMemo(() => {
    if (!chartData || chartData.length < 3 || !leadingBracket) return null;

    const prices = chartData
      .map(p => p[leadingBracket.label])
      .filter(v => typeof v === 'number');

    if (prices.length < 3) return null;

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Classify volatility
    if (stdDev < 2) return { level: 'low', label: 'Stable', color: 'text-emerald-400' };
    if (stdDev < 5) return { level: 'medium', label: 'Active', color: 'text-amber-400' };
    return { level: 'high', label: 'Volatile', color: 'text-red-400' };
  }, [chartData, leadingBracket]);

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

  // Get color based on temperature (cold to hot gradient)
  const getTemperatureColor = (label) => {
    const temp = parseInt(label.match(/\d+/)?.[0] || 60);
    if (temp <= 40) return '#3B82F6'; // blue - cold
    if (temp <= 55) return '#06B6D4'; // cyan - cool
    if (temp <= 70) return '#10B981'; // green - mild
    if (temp <= 85) return '#F59E0B'; // amber - warm
    return '#EF4444'; // red - hot
  };

  return (
    <GlassWidget
      title="MARKET BRACKETS"
      icon={TrendingUp}
      size="large"
      tier="primary"
      className="h-full"
      headerRight={
        <div className="flex items-center gap-3">
          {/* Settlement Station Observation Badge */}
          {settlementTemp != null && dayOffset === 0 && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              settlementStale ? 'bg-amber-500/20' : 'bg-cyan-500/20'
            }`} title={`Current temp at ${stationId} (${stationName})`}>
              <Thermometer className={`w-3 h-3 ${settlementStale ? 'text-amber-400' : 'text-cyan-400'}`} />
              <span className={`text-sm font-bold tabular-nums ${settlementStale ? 'text-amber-400' : 'text-cyan-400'}`}>
                {settlementTemp}°
              </span>
              {settlementTrend === 'rising' && <TrendingUp className="w-3 h-3 text-orange-400" />}
              {settlementTrend === 'falling' && <TrendingDown className="w-3 h-3 text-blue-400" />}
            </div>
          )}

          {/* Day Toggle */}
          <div className="inline-flex bg-white/10 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setDayOffset(0)}
              className={`px-2.5 py-1 font-medium rounded transition-all ${
                dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDayOffset(1)}
              className={`px-2.5 py-1 font-medium rounded transition-all ${
                dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Tomorrow
            </button>
          </div>
        </div>
      }
    >
      {/* Inline Ticker Header */}
      <div className="mb-3 flex-shrink-0">
        {/* Market Question */}
        <h3 className="text-lg font-bold text-white mb-2">
          Highest Temperature in {cityName} {dayOffset === 0 ? 'Today' : 'Tomorrow'}
        </h3>

        {/* Ticker Row */}
        {leadingBracket && (
          <div className="flex items-center gap-3">
            {/* Bracket */}
            <span className="text-base font-semibold text-white tabular-nums">
              {condenseLabel(leadingBracket.label)}
            </span>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                style={{ width: `${leadingBracket.yesPrice}%` }}
              />
            </div>

            {/* Probability */}
            <span className="text-base font-bold text-white tabular-nums">
              {leadingBracket.yesPrice}%
            </span>

            {/* Change */}
            {priceChanges[leadingBracket.ticker] !== undefined && priceChanges[leadingBracket.ticker] !== 0 && (
              <span className={`text-sm font-semibold tabular-nums ${
                priceChanges[leadingBracket.ticker] > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {priceChanges[leadingBracket.ticker] > 0 ? '+' : ''}{priceChanges[leadingBracket.ticker].toFixed(0)}
              </span>
            )}

            {/* Time */}
            {timeRemaining && timeRemaining !== 'Closed' && (
              <span className="text-xs text-white/40">
                {timeRemaining}
              </span>
            )}
          </div>
        )}

        {/* Model vs Market Comparison */}
        {modelConsensus && leadingBracket && dayOffset === 0 && (
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="text-white/40">Models:</span>
            <span className="text-white/70 font-medium">{modelConsensus.mean}° avg</span>
            <span className="text-white/30">({modelConsensus.min}°-{modelConsensus.max}°)</span>
            {(() => {
              const leadingEdge = bracketEdges[leadingBracket.ticker];
              if (!leadingEdge || Math.abs(leadingEdge.edge) < 5) return null;
              const isOverpriced = leadingEdge.signal === 'overpriced';
              return (
                <span className={`px-1.5 py-0.5 rounded ${
                  isOverpriced ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isOverpriced ? 'Market warm vs models' : 'Market cold vs models'}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Multi-bracket Chart - grows to fill available space */}
      {(chartData.length > 0 || chartLoading) && (
        <div
          className={`flex-1 min-h-[100px] mb-2 rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.07] overflow-hidden border border-white/5 relative transition-opacity duration-300 ${chartLoading && chartData.length === 0 ? 'opacity-50' : ''}`}
          onMouseLeave={() => setHoveredBracket(null)}
        >
          {/* Subtle loading indicator overlay */}
          {chartLoading && (
            <div className="absolute top-2 right-2 z-10">
              <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -5, bottom: 8 }}>
              {/* Grid lines for readability */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                domain={chartDomain}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={24}
                tickCount={3}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;

                  const time = new Date(label);
                  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                  // Sort by value descending to show highest probability first
                  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

                  return (
                    <div className="bg-black/95 border border-white/15 rounded-lg px-3 py-2 shadow-xl">
                      <div className="text-[10px] text-white/50 mb-1.5 border-b border-white/10 pb-1.5">
                        {timeStr}
                      </div>
                      <div className="space-y-1">
                        {sortedPayload.map((entry) => {
                          const color = entry.color || bracketColors[entry.name] || getTemperatureColor(entry.name);
                          return (
                            <div key={entry.name} className="flex items-center justify-between gap-4 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-white/70">{condenseLabel(entry.name)}</span>
                              </div>
                              <span className="font-bold tabular-nums" style={{ color }}>
                                {entry.value}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {sortedBrackets.map((bracket) => {
                const color = bracketColors[bracket.label] || getTemperatureColor(bracket.label);
                const isLeader = bracket.ticker === leadingBracket?.ticker;
                const isHovered = hoveredBracket === bracket.ticker;
                const isOtherHovered = hoveredBracket && hoveredBracket !== bracket.ticker;

                return (
                  <Line
                    key={bracket.ticker}
                    type="monotone"
                    dataKey={bracket.label}
                    stroke={color}
                    strokeWidth={isHovered ? 3 : isLeader ? 2.5 : 1.5}
                    strokeOpacity={isOtherHovered ? 0.15 : isHovered ? 1 : isLeader ? 1 : 0.5}
                    dot={false}
                    activeDot={{
                      r: isHovered ? 5 : 3,
                      fill: color,
                      stroke: 'rgba(255,255,255,0.3)',
                      strokeWidth: 2,
                    }}
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 6px ${color})` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Probability Bars with Chart Interaction */}
      <div className="space-y-1 flex-shrink-0">
        {sortedBrackets.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-white/40 text-[11px]">
            No markets for {dayLabel}
          </div>
        ) : (
          sortedBrackets.map((bracket, i) => {
            const isLeader = bracket.ticker === leadingBracket?.ticker;
            const barColor = bracketColors[bracket.label] || getTemperatureColor(bracket.label);
            const priceChange = priceChanges[bracket.ticker];
            const isHovered = hoveredBracket === bracket.ticker;

            return (
              <div
                key={bracket.ticker || i}
                className={`group relative flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all cursor-pointer
                           ${isLeader
                             ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/5 ring-1 ring-blue-400/30'
                             : isHovered
                               ? 'bg-white/10'
                               : 'hover:bg-white/5'
                           }
                           ${isHovered ? 'ring-1 ring-white/20 scale-[1.01]' : ''}`}
                onMouseEnter={() => setHoveredBracket(bracket.ticker)}
                onMouseLeave={() => setHoveredBracket(null)}
              >
                {/* Probability bar background */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-lg transition-opacity duration-200"
                  style={{
                    width: `${Math.max(bracket.yesPrice, 3)}%`,
                    backgroundColor: barColor,
                    opacity: isHovered ? 0.35 : 0.2,
                  }}
                />

                {/* Color indicator dot - matches chart line */}
                <div
                  className="relative w-2 h-2 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    backgroundColor: barColor,
                    boxShadow: isHovered ? `0 0 8px ${barColor}` : 'none',
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                  }}
                />

                {/* Temperature Label */}
                <span className={`relative text-[11px] font-semibold flex-1 transition-colors ${
                  isLeader ? 'text-white' : isHovered ? 'text-white' : 'text-white/70'
                }`}>
                  {condenseLabel(bracket.label)}
                </span>

                {/* Quick Add Button */}
                {isEditorReady && (
                  <button
                    onClick={(e) => handleBracketInsert(bracket, e)}
                    className="relative opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full
                               bg-white/15 flex items-center justify-center transition-all
                               hover:bg-white/25 hover:scale-110 flex-shrink-0 z-10"
                    title="Add to notes"
                  >
                    <Plus size={10} strokeWidth={3} className="text-white/90" />
                  </button>
                )}

                {/* Edge Indicator */}
                {dayOffset === 0 && bracketEdges[bracket.ticker] && Math.abs(bracketEdges[bracket.ticker].edge) >= 10 && (
                  <span className={`relative text-[9px] font-medium px-1 py-0.5 rounded ${
                    bracketEdges[bracket.ticker].signal === 'underpriced'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`} title={`Model: ${bracketEdges[bracket.ticker].modelProb}% vs Market: ${bracket.yesPrice}%`}>
                    {bracketEdges[bracket.ticker].magnitude === 'large'
                      ? (bracketEdges[bracket.ticker].signal === 'underpriced' ? '🔻🔻' : '🔺🔺')
                      : (bracketEdges[bracket.ticker].signal === 'underpriced' ? '🔻' : '🔺')}
                  </span>
                )}

                {/* Price Change Badge */}
                {priceChange !== undefined && priceChange !== 0 && (
                  <span className={`relative text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    priceChange > 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(0)}
                  </span>
                )}

                {/* Percentage */}
                <span className={`relative text-[13px] font-bold tabular-nums min-w-[36px] text-right ${
                  isLeader ? 'text-white' : isHovered ? 'text-white' : 'text-white/80'
                }`}>
                  {bracket.yesPrice}%
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 mt-1 flex-shrink-0 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          <span>Settlement: {stationId}</span>
          {closeTime && (
            <span className="text-white/30">
              Closes {closeTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          )}
        </div>
        <a
          href={getKalshiUrl(citySlug, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
        >
          Kalshi
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </GlassWidget>
  );
}

MarketBrackets.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['horizontal', 'vertical']),
};
