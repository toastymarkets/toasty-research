import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { fetchKalshiWithCache, isInBackoff } from '../utils/kalshiCache';

/**
 * Kalshi API configuration
 */
const KALSHI_PATH = 'trade-api/v2/markets';
const REFRESH_INTERVAL = 60000; // 60 seconds (reduced from 30s to avoid rate limiting)

/**
 * Map city slugs to Kalshi series tickers (highest temperature)
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
 * Map city slugs to Kalshi series tickers (lowest temperature)
 */
const CITY_SERIES_LOW = {
  'new-york': 'KXLOWNY',
  'chicago': 'KXLOWCHI',
  'los-angeles': 'KXLOWLAX',
  'miami': 'KXLOWMIA',
  'denver': 'KXLOWDEN',
  'austin': 'KXLOWAUS',
  'philadelphia': 'KXLOWPHIL',
};

/**
 * Get today's date in Kalshi ticker format (e.g., "25DEC19" for Dec 19, 2025)
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
 * Parse Kalshi market data into bracket format
 */
function parseMarketToBracket(market) {
  const label = market.no_sub_title || '';
  const yesPrice = market.yes_bid || 0;
  const noPrice = 100 - yesPrice;
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
 * Fetch markets for a single series using cache utility
 */
async function fetchSeriesMarkets(seriesTicker) {
  // Use cached fetch with deduplication and rate limiting
  const data = await fetchKalshiWithCache(KALSHI_PATH, {
    series_ticker: seriesTicker,
    limit: 50,
  });

  const allMarkets = data.markets || [];

  // Filter to only today's markets
  const todayDate = getTodayTickerDate();
  const todayMarkets = allMarkets.filter(m => m.ticker.includes(`-${todayDate}-`));

  return todayMarkets;
}

/**
 * Process markets for a city
 */
function processCityMarkets(markets) {
  if (!markets || markets.length === 0) {
    return {
      brackets: [],
      topBrackets: [],
      totalVolume: 0,
      closeTime: null,
      error: 'No open markets',
    };
  }

  const parsedBrackets = markets
    .map(parseMarketToBracket)
    .sort((a, b) => b.yesPrice - a.yesPrice);

  const total = parsedBrackets.reduce((sum, b) => sum + b.volume, 0);
  const firstCloseTime = markets[0]?.close_time;

  return {
    brackets: parsedBrackets,
    topBrackets: parsedBrackets.slice(0, 2),
    totalVolume: total,
    closeTime: firstCloseTime ? new Date(firstCloseTime) : null,
    error: null,
  };
}

/**
 * Context for sharing market data across components
 */
const KalshiMarketsContext = createContext(null);

/**
 * Provider component that fetches all markets once and shares data
 */
export function KalshiMarketsProvider({ children }) {
  const [marketsData, setMarketsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAllMarkets = useCallback(async () => {
    const cityEntries = Object.entries(CITY_SERIES);
    const results = {};

    // Fetch each city sequentially with a small delay to avoid rate limiting
    for (let i = 0; i < cityEntries.length; i++) {
      const [citySlug, seriesTicker] = cityEntries[i];

      try {
        const markets = await fetchSeriesMarkets(seriesTicker);
        results[citySlug] = {
          ...processCityMarkets(markets),
          loading: false,
          seriesTicker,
        };
      } catch (err) {
        results[citySlug] = {
          brackets: [],
          topBrackets: [],
          totalVolume: 0,
          closeTime: null,
          error: err.message,
          loading: false,
          seriesTicker,
        };
      }

      // Small delay between requests to avoid rate limiting
      if (i < cityEntries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setMarketsData(results);
    setLoading(false);
    setLastFetch(new Date());
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllMarkets();
  }, [fetchAllMarkets]);

  // Refresh at configured interval (60s to reduce rate limiting)
  useEffect(() => {
    const interval = setInterval(fetchAllMarkets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAllMarkets]);

  return (
    <KalshiMarketsContext.Provider value={{ marketsData, loading, lastFetch, refetch: fetchAllMarkets }}>
      {children}
    </KalshiMarketsContext.Provider>
  );
}

/**
 * Hook to get market data for a specific city from the shared context
 */
export function useKalshiMarketsFromContext(citySlug) {
  const context = useContext(KalshiMarketsContext);

  if (!context) {
    // Fallback if not wrapped in provider - shouldn't happen in normal usage
    return {
      brackets: [],
      topBrackets: [],
      totalVolume: 0,
      closeTime: null,
      loading: true,
      error: 'No provider',
      seriesTicker: CITY_SERIES[citySlug],
    };
  }

  const { marketsData, loading: globalLoading } = context;
  const cityData = marketsData[citySlug];

  if (!cityData) {
    return {
      brackets: [],
      topBrackets: [],
      totalVolume: 0,
      closeTime: null,
      loading: globalLoading,
      error: null,
      seriesTicker: CITY_SERIES[citySlug],
    };
  }

  return {
    ...cityData,
    loading: globalLoading && !cityData,
  };
}

/**
 * Hook to fetch low temperature markets for all cities
 * Returns data in same format as the high temp context
 */
export function useLowTempMarkets() {
  const [marketsData, setMarketsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAllMarkets = useCallback(async () => {
    const cityEntries = Object.entries(CITY_SERIES_LOW);
    const results = {};

    for (let i = 0; i < cityEntries.length; i++) {
      const [citySlug, seriesTicker] = cityEntries[i];

      try {
        const markets = await fetchSeriesMarkets(seriesTicker);
        results[citySlug] = {
          ...processCityMarkets(markets),
          loading: false,
          seriesTicker,
        };
      } catch {
        results[citySlug] = {
          brackets: [],
          topBrackets: [],
          totalVolume: 0,
          closeTime: null,
          error: 'No markets available',
          loading: false,
          seriesTicker,
        };
      }

      if (i < cityEntries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setMarketsData(results);
    setLoading(false);
    setLastFetch(new Date());
  }, []);

  useEffect(() => {
    fetchAllMarkets();
  }, [fetchAllMarkets]);

  useEffect(() => {
    const interval = setInterval(fetchAllMarkets, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAllMarkets]);

  return { marketsData, loading, lastFetch, refetch: fetchAllMarkets };
}

export { CITY_SERIES, CITY_SERIES_LOW, KalshiMarketsContext };
