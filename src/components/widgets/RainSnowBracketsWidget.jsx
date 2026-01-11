import { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { CloudRain, Snowflake, ExternalLink, Plus } from 'lucide-react';
import GlassWidget from '../weather/GlassWidget';
import { useDataChip } from '../../context/DataChipContext';
import { RAIN_SERIES } from '../../hooks/useKalshiRainMarkets';
import { SNOW_CITY_SERIES } from '../../hooks/useKalshiSnowMarkets';

const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Get current month's date suffix for Kalshi ticker (e.g., "26JAN" for Jan 2026)
 */
function getCurrentMonthSuffix() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[now.getMonth()];
  return `${year}${month}`;
}

/**
 * Fetch markets for a series ticker
 */
async function fetchMarkets(seriesTicker) {
  const url = `${KALSHI_PROXY}?path=${KALSHI_PATH}/markets&series_ticker=${seriesTicker}&limit=50`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.markets || [];
}

/**
 * Process markets into displayable brackets
 */
function processMarkets(markets) {
  if (!markets || markets.length === 0) return null;

  const currentMonth = getCurrentMonthSuffix();

  // Filter for current month's active markets
  let activeMarkets = markets.filter(m =>
    m.ticker.includes(`-${currentMonth}`) && m.status === 'active'
  );

  // Fall back to any active markets
  if (activeMarkets.length === 0) {
    activeMarkets = markets.filter(m => m.status === 'active');
  }

  if (activeMarkets.length === 0) return null;

  // Sort by yes_bid price descending
  const sorted = [...activeMarkets].sort((a, b) => (b.yes_bid || 0) - (a.yes_bid || 0));

  // Get close time
  const closeTime = sorted[0]?.close_time ? new Date(sorted[0].close_time) : null;

  // Extract top 3 brackets
  const brackets = sorted.slice(0, 3).map(m => {
    let label = m.subtitle || m.yes_sub_title || '';
    // Condense: "Above 4 inches" -> "≥4""
    label = label
      .replace(/Above\s+/i, '≥')
      .replace(/Below\s+/i, '<')
      .replace(/\s+inches?/i, '"')
      .replace(/\s+inch/i, '"');

    return {
      label,
      yesPrice: m.yes_bid || 0,
      ticker: m.ticker,
    };
  });

  return { brackets, closeTime };
}

/**
 * Get Kalshi market URL
 */
function getKalshiUrl(seriesTicker, type, cityName) {
  if (!seriesTicker) return null;
  const tickerLower = seriesTicker.toLowerCase();
  const citySlugForUrl = cityName.toLowerCase().replace(/\s+/g, '-');
  return `https://kalshi.com/markets/${tickerLower}/${type}-accumulation-in-${citySlugForUrl}`;
}

/**
 * RainSnowBracketsWidget - Compact widget showing Kalshi rain/snow market odds
 */
const RainSnowBracketsWidget = memo(function RainSnowBracketsWidget({
  citySlug,
  cityName,
}) {
  const [activeTab, setActiveTab] = useState('rain');
  const [rainData, setRainData] = useState(null);
  const [snowData, setSnowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { insertDataChip, isEditorReady } = useDataChip();

  const rainTicker = RAIN_SERIES.monthly?.[citySlug];
  const snowTicker = SNOW_CITY_SERIES?.[citySlug];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch rain markets if available
      if (rainTicker) {
        try {
          const markets = await fetchMarkets(rainTicker);
          const processed = processMarkets(markets);
          setRainData(processed);
        } catch {
          setRainData(null);
        }
      }

      // Fetch snow markets if available
      if (snowTicker) {
        try {
          const markets = await fetchMarkets(snowTicker);
          const processed = processMarkets(markets);
          setSnowData(processed);
        } catch {
          setSnowData(null);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rainTicker, snowTicker]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Timer for market close
  const [timeRemaining, setTimeRemaining] = useState(null);
  const activeData = activeTab === 'rain' ? rainData : snowData;

  useEffect(() => {
    if (!activeData?.closeTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = activeData.closeTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining('Closed');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [activeData?.closeTime]);

  // Handle inserting bracket data as a chip
  const handleBracketInsert = (bracket, e) => {
    e.stopPropagation();
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    insertDataChip({
      value: bracket.label,
      secondary: `${bracket.yesPrice}%`,
      label: `${activeTab === 'rain' ? 'Rain' : 'Snow'} Market`,
      source: `Kalshi ${activeTab === 'rain' ? rainTicker : snowTicker}`,
      timestamp,
      type: 'market',
    });
  };

  // Get color based on probability
  const getProbColor = (prob) => {
    if (prob >= 80) return activeTab === 'rain' ? '#22D3EE' : '#A5B4FC';
    if (prob >= 50) return activeTab === 'rain' ? '#06B6D4' : '#818CF8';
    if (prob >= 20) return activeTab === 'rain' ? '#0891B2' : '#6366F1';
    return activeTab === 'rain' ? '#0E7490' : '#4F46E5';
  };

  const hasRain = rainTicker && rainData?.brackets?.length > 0;
  const hasSnow = snowTicker && snowData?.brackets?.length > 0;
  const hasAnyMarket = hasRain || hasSnow;

  // Auto-select available tab
  useEffect(() => {
    if (!hasRain && hasSnow) setActiveTab('snow');
    else if (hasRain && !hasSnow) setActiveTab('rain');
  }, [hasRain, hasSnow]);

  const Icon = activeTab === 'rain' ? CloudRain : Snowflake;
  const title = activeTab === 'rain' ? 'RAIN ODDS' : 'SNOW ODDS';
  const activeTicker = activeTab === 'rain' ? rainTicker : snowTicker;

  if (loading) {
    return (
      <GlassWidget title="PRECIP ODDS" icon={CloudRain} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-4 bg-white/10 rounded mb-2" />
          <div className="w-12 h-4 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (!hasAnyMarket) {
    return (
      <GlassWidget title="PRECIP ODDS" icon={CloudRain} size="small">
        <div className="flex items-center justify-center h-full text-white/40 text-[11px]">
          No markets available
        </div>
      </GlassWidget>
    );
  }

  const brackets = activeData?.brackets || [];

  return (
    <GlassWidget title={title} icon={Icon} size="small">
      {/* Rain/Snow Toggle */}
      {hasRain && hasSnow && (
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setActiveTab('rain')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              activeTab === 'rain'
                ? 'bg-cyan-500/30 text-cyan-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            Rain
          </button>
          <button
            onClick={() => setActiveTab('snow')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              activeTab === 'snow'
                ? 'bg-indigo-500/30 text-indigo-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <Snowflake className="w-3 h-3" />
            Snow
          </button>
        </div>
      )}

      {/* Brackets */}
      <div className="flex-1 space-y-1">
        {brackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-[10px]">
            No active markets
          </div>
        ) : (
          brackets.map((bracket, i) => {
            const probColor = getProbColor(bracket.yesPrice);
            const isTop = i === 0;

            return (
              <div
                key={bracket.ticker || i}
                className={`group relative flex items-center justify-between py-1 px-1.5 rounded-md transition-all ${
                  isTop ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                {/* Probability bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-md opacity-25"
                  style={{
                    width: `${bracket.yesPrice}%`,
                    backgroundColor: probColor,
                  }}
                />

                {/* Add to notes button */}
                {isEditorReady && (
                  <button
                    onClick={(e) => handleBracketInsert(bracket, e)}
                    className="relative opacity-0 group-hover:opacity-100 mr-1
                               w-3.5 h-3.5 rounded-full bg-white/25 border border-white/20
                               flex items-center justify-center transition-all z-10
                               hover:scale-110 hover:bg-white/35 flex-shrink-0"
                    title="Add to notes"
                  >
                    <Plus size={8} strokeWidth={3} className="text-white/90" />
                  </button>
                )}

                <span className={`relative text-[11px] font-medium flex-1 ${isTop ? 'text-white' : 'text-white/70'}`}>
                  {bracket.label || 'Any'}
                </span>
                <span className="relative text-[11px] font-bold tabular-nums text-white">
                  {bracket.yesPrice}%
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-1 flex items-center justify-between border-t border-white/10 mt-1">
        <a
          href={getKalshiUrl(activeTicker, activeTab, cityName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-white/40 hover:text-white/60 transition-colors"
        >
          Kalshi
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        {timeRemaining && timeRemaining !== 'Closed' && (
          <span className="text-[9px] text-white/40">{timeRemaining}</span>
        )}
      </div>
    </GlassWidget>
  );
});

RainSnowBracketsWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
};

export default RainSnowBracketsWidget;
