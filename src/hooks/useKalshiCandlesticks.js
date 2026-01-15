import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API proxy endpoint
 */
const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Period intervals for candlestick data
 * Kalshi only supports: 1 (1 min), 60 (1 hour), 1440 (1 day)
 */
export const PERIODS = {
  '1h': 1,      // 1-minute candles for 1 hour view
  '6h': 60,     // 1-hour candles for 6 hour view
  '12h': 60,    // 1-hour candles for 12 hour view
};

/**
 * Fetch candlestick data from Kalshi API
 * @param {string} seriesTicker - Series ticker (e.g., "KXHIGHNY")
 * @param {string} ticker - Full market ticker (e.g., "KXHIGHNY-25DEC29-B45")
 * @param {number} periodInterval - Interval: 1 (1 min), 60 (1 hour), or 1440 (1 day)
 * @param {number} hoursBack - How many hours of data to fetch
 */
async function fetchCandlesticks(seriesTicker, ticker, periodInterval = 1, hoursBack = 1) {
  const now = new Date();
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

  // Build URL with proper encoding
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
 * Hook to fetch Kalshi candlestick data for price history charts
 * @param {string} seriesTicker - Series ticker (e.g., "KXHIGHNY")
 * @param {string} ticker - Full market ticker
 * @param {string} period - Period key: '1h', '6h', or '12h'
 * @param {boolean} enabled - Whether to fetch data
 */
export function useKalshiCandlesticks(seriesTicker, ticker, period = '1h', enabled = true) {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const periodInterval = PERIODS[period] || 1;

  const fetchData = useCallback(async () => {
    if (!seriesTicker || !ticker || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    // Determine hours back based on period
    let hoursBack = 1;
    if (period === '6h') hoursBack = 6;
    if (period === '12h') hoursBack = 12;

    try {
      const rawCandles = await fetchCandlesticks(seriesTicker, ticker, periodInterval, hoursBack);

      // Ensure we have an array
      if (!Array.isArray(rawCandles)) {
        setCandles([]);
        return;
      }

      // Transform candlestick data for chart
      // Kalshi API returns: { end_period_ts, yes_bid: {open,high,low,close}, yes_ask: {...}, price: {...}, volume }
      const transformed = rawCandles.map(c => {
        // Get timestamp
        const ts = c.end_period_ts || c.ts || 0;

        // Extract price from nested OHLC objects
        // Priority: yes_bid.close (current bid price) > price.close > price.mean
        let yesPrice = 0;

        // Try yes_bid first (this is the YES buy price)
        if (c.yes_bid && typeof c.yes_bid === 'object') {
          yesPrice = c.yes_bid.close || c.yes_bid.mean || c.yes_bid.open || 0;
        }

        // Fallback to price object (trade price)
        if (yesPrice === 0 && c.price && typeof c.price === 'object') {
          yesPrice = c.price.close || c.price.mean || c.price.open || 0;
        }

        // Get OHLC from yes_bid or price
        const ohlcSource = c.yes_bid || c.price || {};
        const open = typeof ohlcSource.open === 'number' ? ohlcSource.open : 0;
        const high = typeof ohlcSource.high === 'number' ? ohlcSource.high : 0;
        const low = typeof ohlcSource.low === 'number' ? ohlcSource.low : 0;
        const close = typeof ohlcSource.close === 'number' ? ohlcSource.close : yesPrice;

        return {
          time: new Date(ts * 1000),
          timestamp: ts,
          open,
          high,
          low,
          close,
          yesPrice: yesPrice || close,
          volume: typeof c.volume === 'number' ? c.volume : 0,
        };
      });

      // Sort by time ascending and filter out invalid entries
      transformed.sort((a, b) => a.timestamp - b.timestamp);

      // Filter to only valid candles with timestamps and prices
      const validCandles = transformed.filter(c =>
        c.timestamp > 0 && c.yesPrice > 0 && !isNaN(c.timestamp)
      );

      setCandles(validCandles);
    } catch (err) {
      setError(err.message);
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, [seriesTicker, ticker, periodInterval, period, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    candles,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useKalshiCandlesticks;
