import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Calendar, RefreshCw, ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import GlassWidget from './GlassWidget';

/**
 * MarketBrackets - Kalshi temperature market widget
 * Displays real-time market brackets with prices and changes
 */
export default function MarketBrackets({
  citySlug,
  cityName,
  loading: externalLoading = false
}) {
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const [selectedBracket, setSelectedBracket] = useState(null);
  const { brackets, totalVolume, closeTime, loading, error, refetch, seriesTicker } = useKalshiMarkets(citySlug, dayOffset);

  // Track previous prices for change indicators
  const prevPricesRef = useRef({});
  const [priceChanges, setPriceChanges] = useState({});

  const dayLabel = dayOffset === 0 ? 'today' : 'tomorrow';
  const hasSeries = CITY_SERIES[citySlug];

  // Calculate price changes when brackets update
  useEffect(() => {
    if (!brackets || brackets.length === 0) return;

    const newChanges = {};
    brackets.forEach(bracket => {
      const prevPrice = prevPricesRef.current[bracket.ticker];
      if (prevPrice !== undefined && prevPrice !== bracket.yesPrice) {
        newChanges[bracket.ticker] = bracket.yesPrice - prevPrice;
      }
    });

    if (Object.keys(newChanges).length > 0) {
      setPriceChanges(prev => ({ ...prev, ...newChanges }));
    }

    // Update previous prices
    const newPrevPrices = {};
    brackets.forEach(bracket => {
      newPrevPrices[bracket.ticker] = bracket.yesPrice;
    });
    prevPricesRef.current = newPrevPrices;
  }, [brackets]);

  // Format volume
  const formatVolume = (vol) => {
    if (!vol) return '0';
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${Math.round(vol / 1000)}K`;
    return vol.toLocaleString();
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
        <div className="flex items-center justify-center h-full text-red-400 text-sm">
          {error}
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget
      title={null}
      size="large"
      className="h-full"
    >
      {/* Custom Header */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-glass-text-muted">Climate and Weather</span>
            <span className="text-[10px] text-glass-text-muted">·</span>
            <span className="text-[10px] text-glass-text-muted">Daily temperature</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-glass-text-muted tabular-nums">
              {formatVolume(totalVolume)}
            </span>
            <Calendar className="w-3.5 h-3.5 text-glass-text-muted" />
            <button
              onClick={refetch}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-glass-text-muted" />
            </button>
          </div>
        </div>

        {/* Question */}
        <h3 className="text-[15px] font-semibold text-white leading-tight">
          Highest temperature in {cityName} {dayLabel}?
        </h3>
      </div>

      {/* Day Toggle */}
      <div className="px-3 py-2 flex items-center gap-2">
        <div className="flex bg-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setDayOffset(0)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              dayOffset === 0
                ? 'bg-white/20 text-white'
                : 'text-glass-text-secondary hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDayOffset(1)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              dayOffset === 1
                ? 'bg-white/20 text-white'
                : 'text-glass-text-secondary hover:text-white'
            }`}
          >
            Tomorrow
          </button>
        </div>
        {timeRemaining && (
          <span className="text-[10px] text-glass-text-muted">
            Closes in {timeRemaining}
          </span>
        )}
      </div>

      {/* Column Headers */}
      <div className="px-3 py-1 flex items-center justify-between text-[10px] text-glass-text-muted uppercase tracking-wide">
        <span></span>
        <div className="flex items-center gap-12">
          <span>Chance</span>
          <SlidersHorizontal className="w-3 h-3" />
        </div>
      </div>

      {/* Brackets List */}
      <div className="px-2 pb-2 overflow-y-auto flex-1 space-y-1">
        {brackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-glass-text-muted text-sm">
            No open markets for {dayLabel}
          </div>
        ) : (
          brackets.map((bracket, i) => {
            const change = priceChanges[bracket.ticker] || 0;
            const isSelected = selectedBracket === bracket.ticker;

            return (
              <div
                key={bracket.ticker || i}
                className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                {/* Label */}
                <span className="text-[13px] font-medium text-white min-w-[90px]">
                  {bracket.label}
                </span>

                <div className="flex items-center gap-3">
                  {/* Chance with change indicator */}
                  <div className="flex items-center gap-1 min-w-[70px] justify-end">
                    <span className="text-[15px] font-bold text-white tabular-nums">
                      {bracket.yesPrice}%
                    </span>
                    {change !== 0 && (
                      <span className={`flex items-center text-[11px] font-medium ${
                        change > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {change > 0 ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {Math.abs(change)}
                      </span>
                    )}
                  </div>

                  {/* Yes/No Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedBracket(isSelected ? null : bracket.ticker)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                      }`}
                    >
                      Yes {bracket.yesPrice}¢
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 transition-colors"
                    >
                      No {bracket.noPrice > 0 ? `${bracket.noPrice}¢` : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassWidget>
  );
}

MarketBrackets.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};
