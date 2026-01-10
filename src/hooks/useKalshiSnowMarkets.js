import { useState, useEffect, useCallback } from 'react';
import { fetchKalshiWithCache } from '../utils/kalshiCache';

/**
 * Kalshi API configuration
 */
const KALSHI_PATH = 'trade-api/v2/markets';
const REFRESH_INTERVAL = 60000; // 60 seconds

/**
 * Map city slugs to Kalshi snow series tickers
 * Monthly snow accumulation markets: KX{CITY}SNOWM
 */
export const SNOW_CITY_SERIES = {
  'new-york': 'KXNYCSNOWM',
  'chicago': 'KXCHISNOWM',
  'salt-lake-city': 'KXSLCSNOWM',
  'boston': 'KXBOSSNOWM',
  'seattle': 'KXSEASNOWM',
  'philadelphia': 'KXPHLSNOWM',
  'washington-dc': 'KXDCSNOWM',
  'detroit': 'KXDETSNOWM',
  'dallas': 'KXDALSNOWM',
  'miami': 'KXMIASNOWM',
  'san-francisco': 'KXSFOSNOWM',
  'los-angeles': 'KXLAXSNOWM',
  'austin': 'KXAUSSNOWM',
  'houston': 'KXHOUSNOWM',
};

/**
 * City metadata for snow markets
 */
export const SNOW_CITIES = [
  { slug: 'new-york', name: 'New York', id: 'NYC' },
  { slug: 'chicago', name: 'Chicago', id: 'CHI' },
  { slug: 'salt-lake-city', name: 'Salt Lake City', id: 'SLC' },
  { slug: 'boston', name: 'Boston', id: 'BOS' },
  { slug: 'seattle', name: 'Seattle', id: 'SEA' },
  { slug: 'philadelphia', name: 'Philadelphia', id: 'PHL' },
  { slug: 'washington-dc', name: 'Washington DC', id: 'DC' },
  { slug: 'detroit', name: 'Detroit', id: 'DET' },
  { slug: 'dallas', name: 'Dallas', id: 'DAL' },
  { slug: 'miami', name: 'Miami', id: 'MIA' },
  { slug: 'san-francisco', name: 'San Francisco', id: 'SFO' },
  { slug: 'los-angeles', name: 'Los Angeles', id: 'LAX' },
  { slug: 'austin', name: 'Austin', id: 'AUS' },
  { slug: 'houston', name: 'Houston', id: 'HOU' },
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
 * Fetch markets for a snow series using cache utility
 */
async function fetchSnowMarkets(seriesTicker) {
  const data = await fetchKalshiWithCache(KALSHI_PATH, {
    series_ticker: seriesTicker,
    limit: 50,
  });
  return data.markets || [];
}

/**
 * Process snow market data
 * Snow markets have multiple brackets for different accumulation levels
 */
function processSnowMarkets(markets, cityName) {
  if (!markets || markets.length === 0) return null;

  const currentMonth = getCurrentMonthSuffix();

  // Filter for current month's markets
  const currentMarkets = markets.filter(m =>
    m.ticker.includes(`-${currentMonth}`) && m.status === 'active'
  );

  if (currentMarkets.length === 0) {
    // Fall back to any active markets
    const activeMarkets = markets.filter(m => m.status === 'active');
    if (activeMarkets.length === 0) return null;
    return processMarketList(activeMarkets, cityName);
  }

  return processMarketList(currentMarkets, cityName);
}

/**
 * Process a list of markets into displayable format
 */
function processMarketList(markets, cityName) {
  // Sort by yes_bid price descending to get top brackets
  const sorted = [...markets].sort((a, b) => (b.yes_bid || 0) - (a.yes_bid || 0));

  // Calculate total volume
  const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);

  // Get close time from first market
  const closeTime = sorted[0]?.close_time ? new Date(sorted[0].close_time) : null;

  // Extract top 2 brackets
  const topBrackets = sorted.slice(0, 2).map(m => {
    // Parse the subtitle to get the threshold (e.g., "Above 10.0 inches")
    let label = m.subtitle || m.yes_sub_title || 'Snow';
    // Condense label
    label = label.replace(/Above\s+/i, '≥').replace(/\s+inches?/i, '"');

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
    title: `Snow in ${cityName} this month?`,
  };
}

/**
 * Hook to fetch all snow markets
 */
export function useKalshiSnowMarkets() {
  const [marketsData, setMarketsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAllSnowMarkets = useCallback(async () => {
    const results = {};

    for (const city of SNOW_CITIES) {
      const seriesTicker = SNOW_CITY_SERIES[city.slug];
      if (!seriesTicker) continue;

      try {
        const markets = await fetchSnowMarkets(seriesTicker);
        const processed = processSnowMarkets(markets, city.name);

        if (processed && processed.topBrackets.length > 0) {
          results[city.slug] = {
            ...processed,
            cityName: city.name,
            citySlug: city.slug,
            loading: false,
            error: null,
          };
        } else {
          results[city.slug] = {
            cityName: city.name,
            citySlug: city.slug,
            topBrackets: [],
            totalVolume: 0,
            closeTime: null,
            loading: false,
            error: 'No active markets',
          };
        }
      } catch (err) {
        results[city.slug] = {
          cityName: city.name,
          citySlug: city.slug,
          topBrackets: [],
          totalVolume: 0,
          closeTime: null,
          loading: false,
          error: err.message,
        };
      }

      // Delay to avoid rate limiting (staggered with other market hooks)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setMarketsData(results);
    setLoading(false);
    setLastFetch(new Date());
  }, []);

  useEffect(() => {
    // Delay initial fetch to stagger with temperature (0s) and rain (2s) markets
    const timeout = setTimeout(fetchAllSnowMarkets, 4000);
    return () => clearTimeout(timeout);
  }, [fetchAllSnowMarkets]);

  // Refresh at configured interval (60s to reduce rate limiting)
  useEffect(() => {
    const startInterval = setTimeout(() => {
      const interval = setInterval(fetchAllSnowMarkets, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }, 4500);
    return () => clearTimeout(startInterval);
  }, [fetchAllSnowMarkets]);

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
    refetch: fetchAllSnowMarkets,
  };
}

export default useKalshiSnowMarkets;
