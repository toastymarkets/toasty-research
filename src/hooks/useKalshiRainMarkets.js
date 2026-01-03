import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API - uses proxy to bypass CORS
 */
const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Rain market series tickers
 * Monthly = accumulation markets (Above X inches)
 * Daily = will it rain today (Yes/No)
 */
export const RAIN_SERIES = {
  // Monthly rain accumulation markets
  monthly: {
    'new-york': 'KXRAINNYCM',
    'chicago': 'KXRAINCHIM',
    'los-angeles': 'KXRAINLAXM',
    'miami': 'KXRAINMIAM',
    'houston': 'KXRAINHOUM',
    'seattle': 'KXRAINSEAM',
    'san-francisco': 'KXRAINSFOM',
    'austin': 'KXRAINAUSM',
    'dallas': 'KXRAINDALM',
    'denver': 'KXRAINDENM',
  },
  // Daily will it rain markets
  daily: {
    'new-york': 'KXRAINNYC',
    'seattle': 'KXRAINSEA',
    'houston': 'KXRAINHOU',
    'new-orleans': 'KXRAINNO',
  },
};

/**
 * City metadata for rain markets
 */
export const RAIN_CITIES = [
  // Monthly markets
  { slug: 'new-york-monthly', name: 'New York', id: 'NYC', type: 'monthly', citySlug: 'new-york' },
  { slug: 'chicago-monthly', name: 'Chicago', id: 'CHI', type: 'monthly', citySlug: 'chicago' },
  { slug: 'los-angeles-monthly', name: 'Los Angeles', id: 'LAX', type: 'monthly', citySlug: 'los-angeles' },
  { slug: 'miami-monthly', name: 'Miami', id: 'MIA', type: 'monthly', citySlug: 'miami' },
  { slug: 'houston-monthly', name: 'Houston', id: 'HOU', type: 'monthly', citySlug: 'houston' },
  { slug: 'seattle-monthly', name: 'Seattle', id: 'SEA', type: 'monthly', citySlug: 'seattle' },
  { slug: 'san-francisco-monthly', name: 'San Francisco', id: 'SFO', type: 'monthly', citySlug: 'san-francisco' },
  { slug: 'austin-monthly', name: 'Austin', id: 'AUS', type: 'monthly', citySlug: 'austin' },
  { slug: 'dallas-monthly', name: 'Dallas', id: 'DAL', type: 'monthly', citySlug: 'dallas' },
  { slug: 'denver-monthly', name: 'Denver', id: 'DEN', type: 'monthly', citySlug: 'denver' },
  // Daily markets
  { slug: 'new-york-daily', name: 'NYC Daily', id: 'NYC-D', type: 'daily', citySlug: 'new-york' },
  { slug: 'seattle-daily', name: 'Seattle Daily', id: 'SEA-D', type: 'daily', citySlug: 'seattle' },
  { slug: 'houston-daily', name: 'Houston Daily', id: 'HOU-D', type: 'daily', citySlug: 'houston' },
  { slug: 'new-orleans-daily', name: 'New Orleans Daily', id: 'NO-D', type: 'daily', citySlug: 'new-orleans' },
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
 * Get display name for a city slug
 */
function getCityDisplayName(citySlug) {
  const names = {
    'new-york': 'NYC',
    'chicago': 'Chicago',
    'los-angeles': 'LA',
    'miami': 'Miami',
    'houston': 'Houston',
    'seattle': 'Seattle',
    'san-francisco': 'SF',
    'austin': 'Austin',
    'dallas': 'Dallas',
    'denver': 'Denver',
    'new-orleans': 'New Orleans',
  };
  return names[citySlug] || citySlug;
}

/**
 * Process monthly rain market data (accumulation brackets)
 */
function processMonthlyRainMarkets(markets, citySlug = 'new-york') {
  if (!markets || markets.length === 0) return null;

  const currentMonth = getCurrentMonthSuffix();
  const cityName = getCityDisplayName(citySlug);

  // Filter for current month's active markets
  const currentMarkets = markets.filter(m =>
    m.ticker.includes(`-${currentMonth}`) && m.status === 'active'
  );

  if (currentMarkets.length === 0) {
    const activeMarkets = markets.filter(m => m.status === 'active');
    if (activeMarkets.length === 0) return null;
    return processMarketList(activeMarkets, `Rain in ${cityName} this month`);
  }

  return processMarketList(currentMarkets, `Rain in ${cityName} this month`);
}

/**
 * Process daily rain market data (binary Yes/No)
 */
function processDailyRainMarkets(markets, citySlug = 'new-york') {
  if (!markets || markets.length === 0) return null;

  const todayDate = getTodayTickerDate();
  const cityName = getCityDisplayName(citySlug);

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
    return processDailyMarket(sorted[0], cityName);
  }

  return processDailyMarket(todayMarkets[0], cityName);
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
function processDailyMarket(market, cityName = 'NYC') {
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
    title: `Will it rain in ${cityName} today?`,
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

    // Fetch all monthly rain markets
    for (const [citySlug, ticker] of Object.entries(RAIN_SERIES.monthly)) {
      try {
        const markets = await fetchMarkets(ticker);
        const processed = processMonthlyRainMarkets(markets, citySlug);

        if (processed && processed.topBrackets.length > 0) {
          const cityConfig = RAIN_CITIES.find(c => c.citySlug === citySlug && c.type === 'monthly');
          results[`${citySlug}-monthly`] = {
            ...processed,
            cityName: cityConfig?.name || citySlug,
            citySlug: citySlug,
            marketSlug: `${citySlug}-monthly`,
            type: 'monthly',
            loading: false,
            error: null,
          };
        }
      } catch (err) {
        console.log(`Monthly rain market for ${citySlug} not found:`, err.message);
      }
      // Delay to avoid rate limiting (staggered with other market hooks)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Fetch all daily rain markets
    for (const [citySlug, ticker] of Object.entries(RAIN_SERIES.daily)) {
      try {
        const markets = await fetchMarkets(ticker);
        const processed = processDailyRainMarkets(markets, citySlug);

        if (processed && processed.topBrackets.length > 0) {
          const cityConfig = RAIN_CITIES.find(c => c.citySlug === citySlug && c.type === 'daily');
          results[`${citySlug}-daily`] = {
            ...processed,
            cityName: cityConfig?.name || `${citySlug} Daily`,
            citySlug: citySlug,
            marketSlug: `${citySlug}-daily`,
            type: 'daily',
            loading: false,
            error: null,
          };
        }
      } catch (err) {
        console.log(`Daily rain market for ${citySlug} not found:`, err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setMarketsData(results);
    setLoading(false);
    setLastFetch(new Date());
  }, []);

  useEffect(() => {
    // Delay initial fetch to stagger with temperature markets (which start immediately)
    const timeout = setTimeout(fetchAllRainMarkets, 2000);
    return () => clearTimeout(timeout);
  }, [fetchAllRainMarkets]);

  // Refresh every 30 seconds (offset from temperature markets)
  useEffect(() => {
    // Start interval after initial delay + a small offset
    const startInterval = setTimeout(() => {
      const interval = setInterval(fetchAllRainMarkets, 30000);
      return () => clearInterval(interval);
    }, 2500);
    return () => clearTimeout(startInterval);
  }, [fetchAllRainMarkets]);

  // Convert to sorted array by volume
  const sortedMarkets = Object.values(marketsData)
    .filter(m => !m.error && m.topBrackets?.length > 0)
    .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
    .map(m => ({
      slug: m.marketSlug,        // Unique market identifier (e.g., 'new-york-monthly')
      citySlug: m.citySlug,      // City slug for navigation (e.g., 'new-york')
      name: m.cityName,
      type: m.type,
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
