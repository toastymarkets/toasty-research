import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API base URL
 * Uses proxy to bypass CORS in both dev and production
 */
const KALSHI_API = '/api/kalshi/trade-api/v2';

/**
 * Map city slugs to Kalshi series tickers
 */
const CITY_SERIES = {
  'new-york': 'KXHIGHNY',
  'chicago': 'KXHIGHCHI',
  'los-angeles': 'KXHIGHLAX',
  'miami': 'KXHIGHMIA',
  'denver': 'KXHIGHDEN',
  'austin': 'KXHIGHAUS',
  'philadelphia': 'KXHIGHPHIL',
};

/**
 * Get date in Kalshi ticker format (e.g., "25DEC19" for Dec 19, 2025)
 * @param {number} dayOffset - 0 for today, 1 for tomorrow, etc.
 */
function getTickerDate(dayOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear().toString().slice(-2); // "25"
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Fetch markets for a specific series from Kalshi API
 * Filters to return markets for a specific day based on ticker date
 * @param {string} seriesTicker - The series ticker (e.g., "KXHIGHNY")
 * @param {number} dayOffset - 0 for today, 1 for tomorrow
 */
async function fetchSeriesMarkets(seriesTicker, dayOffset = 0) {
  const url = `${KALSHI_API}/markets?series_ticker=${seriesTicker}&limit=50`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const allMarkets = data.markets || [];

  // Filter to markets for the specified day based on ticker date pattern
  // Ticker format: KXHIGHNY-25DEC19-B58.5 where 25DEC19 is the date
  const targetDate = getTickerDate(dayOffset);
  const filteredMarkets = allMarkets.filter(m => m.ticker.includes(`-${targetDate}-`));

  return filteredMarkets;
}

/**
 * Parse Kalshi market data into bracket format
 */
function parseMarketToBracket(market) {
  // Label comes from no_sub_title (e.g., "38° to 39°")
  const label = market.no_sub_title || '';

  // Yes price is the bid in cents (= percentage)
  const yesPrice = market.yes_bid || 0;
  const noPrice = 100 - yesPrice;

  // Volume in contracts
  const volume = market.volume || 0;

  return {
    ticker: market.ticker,
    label,
    yesPrice,
    noPrice,
    volume,
    liquidity: market.liquidity || 0,
    closeTime: market.close_time,
  };
}

/**
 * Hook to fetch real Kalshi market data for a city
 * @param {string} citySlug - The city slug (e.g., "new-york")
 * @param {number} dayOffset - 0 for today, 1 for tomorrow (default: 0)
 */
export function useKalshiMarkets(citySlug, dayOffset = 0) {
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [closeTime, setCloseTime] = useState(null);

  const seriesTicker = CITY_SERIES[citySlug];

  const fetchData = useCallback(async () => {
    if (!seriesTicker) {
      setError('No market for this city');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const markets = await fetchSeriesMarkets(seriesTicker, dayOffset);

      if (markets.length === 0) {
        setError('No open markets');
        setBrackets([]);
        setTotalVolume(0);
        setCloseTime(null);
        setLoading(false);
        return;
      }

      // Parse and sort by yes price (highest first)
      const parsedBrackets = markets
        .map(parseMarketToBracket)
        .sort((a, b) => b.yesPrice - a.yesPrice);

      // Calculate total volume across all brackets
      const total = parsedBrackets.reduce((sum, b) => sum + b.volume, 0);

      // Get close time from first market
      const firstCloseTime = markets[0]?.close_time;

      setBrackets(parsedBrackets);
      setTotalVolume(total);
      setCloseTime(firstCloseTime ? new Date(firstCloseTime) : null);
      setError(null);
    } catch (err) {
      setError(err.message);
      setBrackets([]);
    } finally {
      setLoading(false);
    }
  }, [seriesTicker, dayOffset]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Top 2 brackets for card display
  const topBrackets = brackets.slice(0, 2);

  return {
    brackets,
    topBrackets,
    totalVolume,
    closeTime,
    loading,
    error,
    refetch: fetchData,
    seriesTicker,
  };
}

export { CITY_SERIES };
export default useKalshiMarkets;
