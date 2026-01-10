import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, ExternalLink, Plus } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import { useDataChip } from '../../context/DataChipContext';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
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
  const { brackets, closeTime, loading, error, seriesTicker, refetch } = useKalshiMarkets(citySlug, dayOffset);
  const { insertDataChip, isAvailable: canInsertChip } = useDataChip();

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
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, '1d', 10, brackets.length > 0);

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

  return (
    <GlassWidget
      title="MARKET BRACKETS"
      icon={TrendingUp}
      size="large"
      tier="primary"
      className="h-full"
      headerRight={
        <div className="inline-flex bg-white/10 rounded-md p-0.5">
          <button
            onClick={() => setDayOffset(0)}
            className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all ${
              dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Tdy
          </button>
          <button
            onClick={() => setDayOffset(1)}
            className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all ${
              dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Tmw
          </button>
        </div>
      }
    >
      {/* Compact Leading Bracket Header */}
      {leadingBracket && (
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">
              {condenseLabel(leadingBracket.label)}
            </span>
            <span className="text-xl font-black text-white tabular-nums">
              {leadingBracket.yesPrice}%
            </span>
            {priceChanges[leadingBracket.ticker] !== undefined && priceChanges[leadingBracket.ticker] !== 0 && (
              <span className={`text-[10px] font-semibold flex items-center ${
                priceChanges[leadingBracket.ticker] > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {priceChanges[leadingBracket.ticker] > 0 ? '↑' : '↓'}
                {Math.abs(priceChanges[leadingBracket.ticker]).toFixed(0)}
              </span>
            )}
          </div>
          {timeRemaining && timeRemaining !== 'Closed' && (
            <span className="text-[10px] text-white/40">{timeRemaining}</span>
          )}
        </div>
      )}

      {/* Multi-bracket Chart - grows to fill available space */}
      {!chartLoading && chartData.length > 0 && (
        <div className="flex-1 min-h-[80px] mb-2 rounded-lg bg-white/5 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 8 }}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
              {sortedBrackets.map((bracket) => {
                const color = bracketColors[bracket.label] || getTemperatureColor(bracket.label);
                const isLeader = bracket.ticker === leadingBracket?.ticker;
                return (
                  <Line
                    key={bracket.ticker}
                    type="monotone"
                    dataKey={bracket.label}
                    stroke={color}
                    strokeWidth={isLeader ? 2.5 : 1.5}
                    strokeOpacity={isLeader ? 1 : 0.6}
                    dot={false}
                    activeDot={{ r: 3, fill: color }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Compact Probability Bars */}
      <div className="space-y-0.5 flex-shrink-0">
        {sortedBrackets.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-white/40 text-[11px]">
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
                className={`group relative flex items-center gap-1.5 py-1 px-1.5 rounded-md transition-all
                           ${isLeader ? 'bg-blue-500/15 ring-1 ring-blue-400/30' : 'hover:bg-white/5'}`}
              >
                {/* Probability bar background */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-md opacity-25"
                  style={{
                    width: `${bracket.yesPrice}%`,
                    backgroundColor: barColor,
                  }}
                />

                {/* Quick Add Button */}
                {canInsertChip && (
                  <button
                    onClick={(e) => handleBracketInsert(bracket, e)}
                    className="relative opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full
                               bg-white/20 flex items-center justify-center transition-all
                               hover:bg-white/30 flex-shrink-0 z-10"
                    title="Add to notes"
                  >
                    <Plus size={9} strokeWidth={3} className="text-white/90" />
                  </button>
                )}

                {/* Temperature Label */}
                <span className={`relative text-[11px] font-semibold flex-1 ${isLeader ? 'text-white' : 'text-white/70'}`}>
                  {condenseLabel(bracket.label)}
                </span>

                {/* Price Change */}
                {priceChange !== undefined && priceChange !== 0 && (
                  <span className={`relative text-[9px] font-medium ${
                    priceChange > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {priceChange > 0 ? '↑' : '↓'}{Math.abs(priceChange).toFixed(0)}
                  </span>
                )}

                {/* Percentage */}
                <span className={`relative text-[12px] font-bold tabular-nums ${isLeader ? 'text-white' : 'text-white/80'}`}>
                  {bracket.yesPrice}%
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 flex-shrink-0 border-t border-white/10">
        <a
          href={getKalshiUrl(citySlug, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium text-white/40 hover:text-white/60 transition-colors"
        >
          Kalshi
          <ExternalLink className="w-2.5 h-2.5" />
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
