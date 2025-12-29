import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import GlassWidget from './GlassWidget';

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
 */
export default function MarketBrackets({
  citySlug,
  cityName,
  loading: externalLoading = false
}) {
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const { brackets, closeTime, loading, error } = useKalshiMarkets(citySlug, dayOffset);

  const dayLabel = dayOffset === 0 ? 'today' : 'tomorrow';
  const hasSeries = CITY_SERIES[citySlug];

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

  // Condense label: "39° to 40°" -> "39-40°"
  const condenseLabel = (label) => {
    return label
      .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
      .replace(/(\d+)°\s*or above/i, '≥$1°')
      .replace(/(\d+)°\s*or below/i, '≤$1°');
  };

  return (
    <GlassWidget
      title={null}
      size="large"
      className="h-full"
    >
      {/* Header */}
      <div className="px-2.5 pt-2 pb-1">
        <h3 className="text-[14px] font-semibold text-white leading-snug">
          Highest temp in {cityName} {dayLabel}?
        </h3>
      </div>

      {/* Day Toggle */}
      <div className="px-2.5 pb-2">
        <div className="inline-flex bg-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setDayOffset(0)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
              dayOffset === 0 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDayOffset(1)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
              dayOffset === 1 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Brackets List */}
      <div className="px-2 pb-2 overflow-y-auto flex-1">
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
                  className={`relative flex items-center justify-between py-1.5 px-2 rounded-lg transition-all ${
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

                  {/* Content */}
                  <span className={`relative text-[12px] font-bold ${isLeader ? 'text-white' : 'text-white/70'}`}>
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
      <div className="px-2.5 pt-1 pb-2 flex items-center justify-between border-t border-white/10 mt-1">
        <a
          href={getKalshiUrl(citySlug, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-medium text-white/40 uppercase tracking-wide hover:text-white/60 transition-colors"
        >
          Kalshi Odds
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        {timeRemaining && timeRemaining !== 'Closed' && (
          <span className="text-[9px] text-white/40">Closes {timeRemaining}</span>
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
