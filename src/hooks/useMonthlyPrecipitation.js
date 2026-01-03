import { useState, useEffect, useCallback } from 'react';

/**
 * Map city slugs to IEM network and station IDs
 * Reused from useDSM.js
 */
const CITY_IEM_CONFIG = {
  // Note: NYC (Central Park) doesn't have real-time data in IEM, use JFK instead
  'new-york': { network: 'NY_ASOS', station: 'JFK', name: 'JFK Airport' },
  'chicago': { network: 'IL_ASOS', station: 'MDW', name: 'Midway' },
  'los-angeles': { network: 'CA_ASOS', station: 'LAX', name: 'LAX Airport' },
  'miami': { network: 'FL_ASOS', station: 'MIA', name: 'Miami Intl' },
  'denver': { network: 'CO_ASOS', station: 'DEN', name: 'Denver Intl' },
  'austin': { network: 'TX_ASOS', station: 'AUS', name: 'Austin Airport' },
  'philadelphia': { network: 'PA_ASOS', station: 'PHL', name: 'Philadelphia Intl' },
  'houston': { network: 'TX_ASOS', station: 'HOU', name: 'Hobby Airport' },
  'seattle': { network: 'WA_ASOS', station: 'SEA', name: 'Seattle-Tacoma' },
  'san-francisco': { network: 'CA_ASOS', station: 'SFO', name: 'SFO Airport' },
  'boston': { network: 'MA_ASOS', station: 'BOS', name: 'Logan Airport' },
  'washington-dc': { network: 'VA_ASOS', station: 'DCA', name: 'Reagan National' },
  'dallas': { network: 'TX_ASOS', station: 'DFW', name: 'DFW Airport' },
  'detroit': { network: 'MI_ASOS', station: 'DTW', name: 'Detroit Metro' },
  'salt-lake-city': { network: 'UT_ASOS', station: 'SLC', name: 'Salt Lake City' },
  'atlanta': { network: 'GA_ASOS', station: 'ATL', name: 'Hartsfield-Jackson' },
  'charlotte': { network: 'NC_ASOS', station: 'CLT', name: 'Charlotte Douglas' },
  'jacksonville': { network: 'FL_ASOS', station: 'JAX', name: 'Jacksonville Intl' },
  'las-vegas': { network: 'NV_ASOS', station: 'LAS', name: 'McCarran Intl' },
  'minneapolis': { network: 'MN_ASOS', station: 'MSP', name: 'Minneapolis-St. Paul' },
  'nashville': { network: 'TN_ASOS', station: 'BNA', name: 'Nashville Intl' },
  'oklahoma-city': { network: 'OK_ASOS', station: 'OKC', name: 'Will Rogers' },
  'phoenix': { network: 'AZ_ASOS', station: 'PHX', name: 'Sky Harbor' },
  'san-antonio': { network: 'TX_ASOS', station: 'SAT', name: 'San Antonio Intl' },
  'tampa': { network: 'FL_ASOS', station: 'TPA', name: 'Tampa Intl' },
};

const CACHE_KEY_PREFIX = 'toasty_monthly_precip_';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get cache key for a city and month
 */
function getCacheKey(citySlug, year, month) {
  return `${CACHE_KEY_PREFIX}${citySlug}_${year}_${month}`;
}

/**
 * Check if cached data is still valid
 */
function getCachedData(cacheKey) {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Save data to cache
 */
function setCachedData(cacheKey, data) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook to fetch monthly precipitation data from IEM
 *
 * Fetches daily data for the current month and calculates running totals
 * for rain and snow accumulation.
 *
 * @param {string} citySlug - City slug (e.g., 'new-york')
 * @returns {{ dailyData, totals, monthName, year, loading, error, refetch, stationName }}
 */
export function useMonthlyPrecipitation(citySlug) {
  const [dailyData, setDailyData] = useState([]);
  const [totals, setTotals] = useState({ precipitation: 0, snowfall: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = CITY_IEM_CONFIG[citySlug];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const fetchData = useCallback(async (skipCache = false) => {
    if (!config) {
      setError('No IEM config for this city');
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(citySlug, year, month);

    // Check cache first
    if (!skipCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setDailyData(cached.dailyData);
        setTotals(cached.totals);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Build date range for the month
      const startDate = new Date(year, month - 1, 1);
      const today = new Date();
      const endDate = new Date(Math.min(today.getTime(), new Date(year, month, 0).getTime()));

      // Fetch data for the date range
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const url = `https://mesonet.agron.iastate.edu/api/1/daily.json?network=${config.network}&station=${config.station}&sdate=${startStr}&edate=${endStr}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const allRecords = json.data || [];

      // Filter records to only include those from the requested month/year
      // Parse date string directly to avoid timezone issues (YYYY-MM-DD format)
      const records = allRecords.filter((record) => {
        if (!record.date) return false;
        const [recordYear, recordMonth] = record.date.split('-').map(Number);
        return recordYear === year && recordMonth === month;
      });

      if (records.length === 0) {
        setError('No data available for this month');
        setDailyData([]);
        setTotals({ precipitation: 0, snowfall: 0 });
      } else {
        // Process daily data with running totals
        let runningPrecip = 0;
        let runningSnow = 0;

        const processed = records.map((record) => {
          const precip = record.precip != null && record.precip >= 0 ? record.precip : 0;
          const snow = record.snow != null && record.snow >= 0 ? record.snow : 0;

          runningPrecip += precip;
          runningSnow += snow;

          // Parse day from date string to avoid timezone issues
          const day = parseInt(record.date.split('-')[2], 10);

          return {
            date: record.date,
            day,
            precip,
            snow,
            snowDepth: record.snowd || 0,
            runningPrecip: Math.round(runningPrecip * 100) / 100,
            runningSnow: Math.round(runningSnow * 100) / 100,
          };
        });

        const calculatedTotals = {
          precipitation: Math.round(runningPrecip * 100) / 100,
          snowfall: Math.round(runningSnow * 100) / 100,
        };

        setDailyData(processed);
        setTotals(calculatedTotals);

        // Cache the results
        setCachedData(cacheKey, {
          dailyData: processed,
          totals: calculatedTotals,
        });
      }
    } catch (err) {
      console.error('[MonthlyPrecip] Error fetching data:', err);
      setError(err.message);
      setDailyData([]);
      setTotals({ precipitation: 0, snowfall: 0 });
    } finally {
      setLoading(false);
    }
  }, [config, citySlug, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dailyData,
    totals,
    monthName,
    year,
    loading,
    error,
    refetch: () => fetchData(true),
    stationName: config?.name,
    station: config?.station,
  };
}

export default useMonthlyPrecipitation;
