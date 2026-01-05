import { useState, useEffect, useCallback } from 'react';
import { CITY_COORDS } from './useMultiModelForecast';
import { CACHE_DURATIONS } from '../constants/cache';

const gridCache = {};

/**
 * Hook to fetch NWS Quantitative Precipitation Forecast (QPF)
 * Uses the gridpoints endpoint which includes precipitation probability and amounts
 *
 * @param {string} citySlug - City slug (e.g., 'los-angeles')
 * @returns {{
 *   forecast: object|null,
 *   mtdForecast: number,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: function,
 *   updateTime: Date|null
 * }}
 */
export function useNWSPrecipitationForecast(citySlug) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateTime, setUpdateTime] = useState(null);

  const fetchForecast = useCallback(async (force = false) => {
    const coords = CITY_COORDS[citySlug?.toLowerCase()];
    if (!coords) {
      setError(`Unknown city: ${citySlug}`);
      setLoading(false);
      return;
    }

    const cacheKey = `nws_qpf_v1_${citySlug}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATIONS.FORECAST_HOURLY) {
            setForecast(data);
            setUpdateTime(new Date(data.updateTime));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // localStorage may fail in private browsing - continue without cache
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Get grid coordinates if not cached
      let gridData = gridCache[citySlug];
      if (!gridData) {
        const pointsUrl = `https://api.weather.gov/points/${coords.lat},${coords.lon}`;
        const pointsResponse = await fetch(pointsUrl, {
          headers: { 'User-Agent': 'Toasty Research App' }
        });

        if (!pointsResponse.ok) {
          throw new Error(`NWS points API error: ${pointsResponse.status}`);
        }

        const pointsData = await pointsResponse.json();
        gridData = {
          gridId: pointsData.properties.gridId,
          gridX: pointsData.properties.gridX,
          gridY: pointsData.properties.gridY,
        };
        gridCache[citySlug] = gridData;
      }

      // Fetch raw gridpoint data (includes QPF)
      const gridpointsUrl = `https://api.weather.gov/gridpoints/${gridData.gridId}/${gridData.gridX},${gridData.gridY}`;
      const gridpointsResponse = await fetch(gridpointsUrl, {
        headers: { 'User-Agent': 'Toasty Research App' }
      });

      if (!gridpointsResponse.ok) {
        throw new Error(`NWS gridpoints API error: ${gridpointsResponse.status}`);
      }

      const gridpointsData = await gridpointsResponse.json();
      const props = gridpointsData.properties;
      const nwsUpdateTime = new Date(props.updateTime);

      // Extract quantitative precipitation forecast
      const qpfData = props.quantitativePrecipitation?.values || [];
      const probPrecipData = props.probabilityOfPrecipitation?.values || [];

      // Convert QPF values from mm to inches and organize by time
      const cityTimezone = coords.timezone;
      const now = new Date();

      // Get start and end of current month in city's timezone
      const monthStart = new Date(now.toLocaleDateString('en-CA', { timeZone: cityTimezone }) + 'T00:00:00');
      const currentMonth = now.toLocaleDateString('en-US', { timeZone: cityTimezone, month: 'numeric' });
      const currentYear = now.toLocaleDateString('en-US', { timeZone: cityTimezone, year: 'numeric' });

      // Process QPF data
      const precipPeriods = qpfData.map(item => {
        const validTime = parseISODuration(item.validTime);
        const valueInMm = item.value || 0;
        const valueInInches = valueInMm / 25.4; // mm to inches

        return {
          startTime: validTime.start,
          endTime: validTime.end,
          durationHours: validTime.durationHours,
          precipMm: valueInMm,
          precipInches: Math.round(valueInInches * 1000) / 1000, // 3 decimal places
        };
      });

      // Calculate remaining month forecast (from now until end of month)
      // Filter periods that fall within the current month and after now
      let monthRemainingForecast = 0;
      precipPeriods.forEach(period => {
        const periodStart = new Date(period.startTime);
        const periodMonth = periodStart.toLocaleDateString('en-US', { timeZone: cityTimezone, month: 'numeric' });
        const periodYear = periodStart.toLocaleDateString('en-US', { timeZone: cityTimezone, year: 'numeric' });

        // Only include periods in current month and in the future
        if (periodMonth === currentMonth && periodYear === currentYear && periodStart >= now) {
          monthRemainingForecast += period.precipInches;
        }
      });

      // Also get today's forecast specifically
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: cityTimezone });
      let todayForecast = 0;
      precipPeriods.forEach(period => {
        const periodStart = new Date(period.startTime);
        const periodDateStr = periodStart.toLocaleDateString('en-CA', { timeZone: cityTimezone });

        if (periodDateStr === todayStr && periodStart >= now) {
          todayForecast += period.precipInches;
        }
      });

      // Process probability of precipitation
      const probPeriods = probPrecipData.map(item => {
        const validTime = parseISODuration(item.validTime);
        return {
          startTime: validTime.start,
          endTime: validTime.end,
          probability: item.value || 0,
        };
      });

      const result = {
        precipPeriods,
        probPeriods,
        monthRemainingForecast: Math.round(monthRemainingForecast * 100) / 100,
        todayForecast: Math.round(todayForecast * 100) / 100,
        updateTime: nwsUpdateTime.toISOString(),
        city: coords.name,
        timezone: cityTimezone,
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch (e) {
        // localStorage may fail in private browsing - continue without caching
      }

      setForecast(result);
      setUpdateTime(nwsUpdateTime);
      setError(null);
    } catch (err) {
      console.error('[NWSPrecipForecast] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug]);

  useEffect(() => {
    if (citySlug) {
      fetchForecast();
    }
  }, [citySlug, fetchForecast]);

  return {
    forecast,
    mtdForecast: forecast?.monthRemainingForecast ?? null,
    todayForecast: forecast?.todayForecast ?? null,
    loading,
    error,
    refetch: () => fetchForecast(true),
    updateTime,
  };
}

/**
 * Parse ISO 8601 duration format used by NWS
 * Format: "2025-01-04T06:00:00+00:00/PT6H" (start time / duration)
 */
function parseISODuration(validTime) {
  const [startStr, durationStr] = validTime.split('/');
  const start = new Date(startStr);

  // Parse duration (e.g., "PT6H" = 6 hours, "PT1H" = 1 hour)
  let durationHours = 1; // default
  if (durationStr) {
    const hourMatch = durationStr.match(/PT(\d+)H/);
    if (hourMatch) {
      durationHours = parseInt(hourMatch[1], 10);
    }
  }

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    durationHours,
  };
}

export default useNWSPrecipitationForecast;
