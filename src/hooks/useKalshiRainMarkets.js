import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API - uses proxy to bypass CORS
 */
const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Rain market series tickers
 * NYC has both monthly accumulation and daily rain markets
 */
export const RAIN_SERIES = {
  // Monthly rain accumulation (Above X inches)
  nycMonthly: 'KXNYCRAINM',
  // Daily will it rain (Yes/No)
  nycDaily: 'KXRAINNYC',
};

/**
 * City metadata for rain markets
 * Currently only NYC has rain markets
 */
export const RAIN_CITIES = [
  { slug: 'new-york', name: 'New York', id: 'NYC', type: 'monthly', citySlug: 'new-york' },
  { slug: 'new-york-daily', name: 'NYC Daily', id: 'NYC-D', type: 'daily', citySlug: 'new-york' },
];

/**
 * Get current month's date suffix for Kalshi ticker (e.g., "25DEC" for Dec 2025)
 */
function getCurrentMonthSuffix() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[now.getMonth()];
  return `${year}${month}`;
}

/**
 * Get today's date in Kalshi ticker format (e.g., "25DEC29" for Dec 29, 2025)
 */
function getTodayTickerDate() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[now.getMonth()];
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Fetch markets for a series
 */
async function fetchMarkets(seriesTicker) {
  const url = `${KALSHI_PROXY}?path=${KALSHI_PATH}/markets&series_ticker=${seriesTicker}&limit=50`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.markets || [];
}

/**
 * Process monthly rain market data (accumulation brackets)
 */
function processMonthlyRainMarkets(markets) {
  if (!markets || markets.length === 0) return null;

  const currentMonth = getCurrentMonthSuffix();

  // Filter for current month's active markets
  const currentMarkets = markets.filter(m =>
    m.ticker.includes(`-${currentMonth}`) && m.status === 'active'
  );

  if (currentMarkets.length === 0) {
    const activeMarkets = markets.filter(m => m.status === 'active');
    if (activeMarkets.length === 0) return null;
    return processMarketList(activeMarkets, 'Rain in NYC this month?');
  }

  return processMarketList(currentMarkets, 'Rain in NYC this month?');
}

/**
 * Process daily rain market data (binary Yes/No)
 */
function processDailyRainMarkets(markets) {
  if (!markets || markets.length === 0) return null;

  const todayDate = getTodayTickerDate();

  // Filter for today's market
  const todayMarkets = markets.filter(m =>
    m.ticker.includes(`-${todayDate}`) && m.status === 'active'
  );

  if (todayMarkets.length === 0) {
    const activeMarkets = markets.filter(m => m.status === 'active');
    if (activeMarkets.length === 0) return null;
    // Use the most recent active market
    const sorted = activeMarkets.sort((a, b) =>
      new Date(b.close_time || 0) - new Date(a.close_time || 0)
    );
    return processDailyMarket(sorted[0]);
  }

  return processDailyMarket(todayMarkets[0]);
}

/**
 * Process a list of monthly markets into displayable format
 */
function processMarketList(markets, title) {
  // Sort by yes_bid price descending to get top brackets
  const sorted = [...markets].sort((a, b) => (b.yes_bid || 0) - (a.yes_bid || 0));

  // Calculate total volume
  const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);

  // Get close time from first market
  const closeTime = sorted[0]?.close_time ? new Date(sorted[0].close_time) : null;

  // Extract top 2 brackets
  const topBrackets = sorted.slice(0, 2).map(m => {
    let label = m.subtitle || m.yes_sub_title || 'Rain';
    // Condense label: "Above 4 inches" -> "≥4""
    label = label.replace(/Above\s+/i, '≥').replace(/\s+inches?/i, '"').replace(/\s+inch/i, '"');

    return {
      label,
      yesPrice: m.yes_bid || 0,
      ticker: m.ticker,
    };
  });

  return {
    topBrackets,
    totalVolume,
    closeTime,
    title,
  };
}

/**
 * Process a single daily rain market
 */
function processDailyMarket(market) {
  if (!market) return null;

  const yesPrice = market.yes_bid || 0;
  const closeTime = market.close_time ? new Date(market.close_time) : null;

  return {
    topBrackets: [{
      label: 'Will it rain?',
      yesPrice,
      ticker: market.ticker,
    }],
    totalVolume: market.volume || 0,
    closeTime,
    title: 'Will it rain in NYC today?',
  };
}

/**
 * Hook to fetch all rain markets
 */
export function useKalshiRainMarkets() {
  const [marketsData, setMarketsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAllRainMarkets = useCallback(async () => {
    const results = {};

    // Fetch monthly rain markets
    try {
      const monthlyMarkets = await fetchMarkets(RAIN_SERIES.nycMonthly);
      const processed = processMonthlyRainMarkets(monthlyMarkets);

      if (processed && processed.topBrackets.length > 0) {
        results['new-york'] = {
          ...processed,
          cityName: 'New York',
          citySlug: 'new-york',
          loading: false,
          error: null,
        };
      }
    } catch (err) {
      console.log('Monthly rain markets not found:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch daily rain markets
    try {
      const dailyMarkets = await fetchMarkets(RAIN_SERIES.nycDaily);
      const processed = processDailyRainMarkets(dailyMarkets);

      if (processed && processed.topBrackets.length > 0) {
        results['new-york-daily'] = {
          ...processed,
          cityName: 'NYC Daily',
          citySlug: 'new-york-daily',
          loading: false,
          error: null,
        };
      }
    } catch (err) {
      console.log('Daily rain markets not found:', err.message);
    }

    setMarketsData(results);
    setLoading(false);
    setLastFetch(new Date());
  }, []);

  useEffect(() => {
    fetchAllRainMarkets();
  }, [fetchAllRainMarkets]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllRainMarkets, 30000);
    return () => clearInterval(interval);
  }, [fetchAllRainMarkets]);

  // Convert to sorted array by volume
  const sortedMarkets = Object.values(marketsData)
    .filter(m => !m.error && m.topBrackets?.length > 0)
    .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
    .map(m => ({
      slug: m.citySlug,
      name: m.cityName,
      topBrackets: m.topBrackets,
      totalVolume: m.totalVolume,
      closeTime: m.closeTime,
    }));

  return {
    markets: sortedMarkets,
    marketsData,
    loading,
    error,
    lastFetch,
    refetch: fetchAllRainMarkets,
  };
}

export default useKalshiRainMarkets;
