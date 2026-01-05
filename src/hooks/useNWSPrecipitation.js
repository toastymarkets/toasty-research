import { useState, useEffect, useCallback } from 'react';
import { CITY_BY_SLUG } from '../config/cities';

const CACHE_KEY_PREFIX = 'nws_precip_mtd_v1_';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Hook to fetch month-to-date precipitation from NWS observations
 *
 * Uses the precipitationLastHour field from METAR observations
 * which reports hourly precipitation at ~:53 each hour.
 */
export function useNWSPrecipitation(citySlug) {
  const [mtdTotal, setMtdTotal] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const city = CITY_BY_SLUG[citySlug];
  const stationId = city?.stationId;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const fetchData = useCallback(async (skipCache = false) => {
    if (!stationId) {
      setError('No station configured');
      setLoading(false);
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${citySlug}_${year}_${month}`;

    // Check cache
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION_MS) {
            setMtdTotal(data.mtdTotal);
            setDailyData(data.dailyData);
            setLastUpdated(new Date(timestamp));
            setLoading(false);
            return;
          }
        }
      } catch (e) { /* ignore */ }
    }

    setLoading(true);
    setError(null);

    try {
      // Build date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(); // Now

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Fetch all observations for the month
      const url = `https://api.weather.gov/stations/${stationId}/observations?start=${startISO}&end=${endISO}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Toasty Research (toasty-research.app)',
          'Accept': 'application/geo+json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const features = data.features || [];

      // Extract hourly precipitation values
      // precipitationLastHour is reported in millimeters
      const hourlyPrecip = [];
      const seenHours = new Set();

      // Features come newest first, so reverse to process oldest first
      const sortedFeatures = [...features].reverse();

      for (const f of sortedFeatures) {
        const props = f.properties;
        const timestamp = new Date(props.timestamp);

        // Create hour key to avoid duplicates
        const hourKey = `${timestamp.getUTCFullYear()}-${timestamp.getUTCMonth()}-${timestamp.getUTCDate()}-${timestamp.getUTCHours()}`;

        // Check for precipitationLastHour value
        const precip = props.precipitationLastHour;
        if (precip && typeof precip === 'object' && precip.value !== null && precip.value !== undefined) {
          // Only count each hour once (use the first observation with data for that hour)
          if (!seenHours.has(hourKey)) {
            seenHours.add(hourKey);
            const mmValue = precip.value;
            const inchValue = mmValue / 25.4; // Convert mm to inches

            hourlyPrecip.push({
              timestamp,
              hourKey,
              mm: mmValue,
              inches: inchValue,
            });
          }
        }
      }

      // Calculate MTD total in inches
      const totalInches = hourlyPrecip.reduce((sum, h) => sum + h.inches, 0);
      const roundedTotal = Math.round(totalInches * 100) / 100;

      // Group by day for daily totals
      const byDay = {};
      for (const h of hourlyPrecip) {
        const dayKey = h.timestamp.toISOString().split('T')[0];
        if (!byDay[dayKey]) {
          byDay[dayKey] = { date: dayKey, inches: 0 };
        }
        byDay[dayKey].inches += h.inches;
      }

      const dailyTotals = Object.values(byDay).map(d => ({
        ...d,
        inches: Math.round(d.inches * 100) / 100,
      }));

      // Cache results
      const cacheData = { mtdTotal: roundedTotal, dailyData: dailyTotals };
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: cacheData,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore */ }

      setMtdTotal(roundedTotal);
      setDailyData(dailyTotals);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[NWSPrecipitation] Fetch error:', err);
      setError(err.message);
      setMtdTotal(0);
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  }, [stationId, citySlug, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    mtdTotal,
    dailyData,
    monthName,
    year,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchData(true),
    stationId,
  };
}

export default useNWSPrecipitation;
