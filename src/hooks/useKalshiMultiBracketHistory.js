import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API proxy endpoint
 */
const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Period configuration for candlestick data
 * Kalshi supports: 1 (1 min), 60 (1 hour), 1440 (1 day)
 */
export const MULTI_PERIODS = {
  '1h': { interval: 1, hours: 1 },      // 1-minute candles for 1 hour
  '6h': { interval: 60, hours: 6 },     // 1-hour candles for 6 hours
  '1d': { interval: 60, hours: 24 },    // 1-hour candles for 1 day
  '1w': { interval: 1440, hours: 168 }, // 1-day candles for 1 week
  'all': { interval: 1440, hours: 720 },// 1-day candles for 30 days
};

/**
 * Fetch candlesticks for a single ticker
 */
async function fetchCandlesticks(seriesTicker, ticker, periodInterval, hoursBack) {
  const now = new Date();
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: `${KALSHI_PATH}/series/${seriesTicker}/markets/${ticker}/candlesticks`,
    start_ts: Math.floor(startTime.getTime() / 1000).toString(),
    end_ts: Math.floor(now.getTime() / 1000).toString(),
    period_interval: periodInterval.toString(),
  });

  const url = `${KALSHI_PROXY}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.candlesticks || [];
}

/**
 * Transform raw candlestick data to chart format
 */
function transformCandles(rawCandles, bracketLabel) {
  return rawCandles
    .map(c => {
      const ts = c.end_period_ts || c.ts || 0;

      // Extract price from yes_bid or price object
      let yesPrice = 0;
      if (c.yes_bid && typeof c.yes_bid === 'object') {
        yesPrice = c.yes_bid.close || c.yes_bid.mean || c.yes_bid.open || 0;
      }
      if (yesPrice === 0 && c.price && typeof c.price === 'object') {
        yesPrice = c.price.close || c.price.mean || c.price.open || 0;
      }

      return {
        timestamp: ts,
        price: yesPrice,
        label: bracketLabel,
      };
    })
    .filter(c => c.timestamp > 0 && c.price > 0);
}

/**
 * Hook to fetch Kalshi candlestick data for multiple brackets simultaneously
 * Returns merged data suitable for a multi-line chart
 *
 * @param {string} seriesTicker - Series ticker (e.g., "KXHIGHNY")
 * @param {Array} brackets - Array of bracket objects with {ticker, label, yesPrice}
 * @param {string} period - Period key: '1h', '6h', '1d', '1w', 'all'
 * @param {number} maxBrackets - Maximum brackets to fetch (default: 4)
 * @param {boolean} enabled - Whether to fetch data
 */
export function useKalshiMultiBracketHistory(
  seriesTicker,
  brackets = [],
  period = '1d',
  maxBrackets = 4,
  enabled = true
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bracketColors, setBracketColors] = useState({});

  // Color palette for chart lines (monochromatic blues + accent)
  const colors = ['#60A5FA', '#3B82F6', '#F59E0B', '#8B5CF6'];

  const fetchData = useCallback(async () => {
    if (!seriesTicker || !brackets.length || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    const periodConfig = MULTI_PERIODS[period] || MULTI_PERIODS['1d'];

    // Get top N brackets by probability
    const topBrackets = [...brackets]
      .sort((a, b) => b.yesPrice - a.yesPrice)
      .slice(0, maxBrackets);

    // Assign colors to brackets
    const colorMap = {};
    topBrackets.forEach((b, idx) => {
      colorMap[b.label] = colors[idx % colors.length];
    });
    setBracketColors(colorMap);

    try {
      // Fetch candlesticks sequentially with delay to avoid rate limiting
      const results = [];
      for (let i = 0; i < topBrackets.length; i++) {
        const bracket = topBrackets[i];

        // Add delay between requests (except first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        try {
          const candles = await fetchCandlesticks(
            seriesTicker,
            bracket.ticker,
            periodConfig.interval,
            periodConfig.hours
          );
          results.push({
            bracket,
            candles: transformCandles(candles, bracket.label),
          });
        } catch (err) {
          console.warn(`[MultiBracket] Failed to fetch ${bracket.label}:`, err);
          results.push({ bracket, candles: [] });
        }
      }

      // Merge all candlestick data by timestamp
      const timestampMap = new Map();

      results.forEach(({ bracket, candles }) => {
        candles.forEach(c => {
          if (!timestampMap.has(c.timestamp)) {
            timestampMap.set(c.timestamp, { timestamp: c.timestamp });
          }
          const entry = timestampMap.get(c.timestamp);
          entry[bracket.label] = c.price;
        });
      });

      // Convert to array and sort by timestamp
      const mergedData = Array.from(timestampMap.values())
        .sort((a, b) => a.timestamp - b.timestamp);

      // Add time labels
      const formattedData = mergedData.map(d => ({
        ...d,
        time: new Date(d.timestamp * 1000),
        timeLabel: formatTimeLabel(d.timestamp, period),
      }));

      setData(formattedData);
    } catch (err) {
      console.error('[MultiBracket] Error:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [seriesTicker, brackets, period, maxBrackets, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get bracket info for legend
  const legendData = brackets
    .sort((a, b) => b.yesPrice - a.yesPrice)
    .slice(0, maxBrackets)
    .map(b => ({
      label: b.label,
      color: bracketColors[b.label] || '#fff',
      currentPrice: b.yesPrice,
    }));

  return {
    data,
    legendData,
    bracketColors,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Format timestamp for display based on period
 */
function formatTimeLabel(timestamp, period) {
  const date = new Date(timestamp * 1000);

  if (period === '1h' || period === '6h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (period === '1d') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
  }

  // For 1w and all, show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default useKalshiMultiBracketHistory;
