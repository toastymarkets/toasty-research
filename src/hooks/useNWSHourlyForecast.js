import { useState, useEffect, useCallback } from 'react';
import { CITY_COORDS } from './useMultiModelForecast';
import { CACHE_DURATIONS } from '../constants/cache';

const gridCache = {};

/**
 * Hook to fetch NWS hourly weather forecasts
 */
export function useNWSHourlyForecast(citySlug) {
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

    const cacheKey = `nws_hourly_v1_${citySlug}`;
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
          forecastHourlyUrl: pointsData.properties.forecastHourly,
          gridId: pointsData.properties.gridId,
          gridX: pointsData.properties.gridX,
          gridY: pointsData.properties.gridY,
        };
        gridCache[citySlug] = gridData;
      }

      const forecastResponse = await fetch(gridData.forecastHourlyUrl, {
        headers: { 'User-Agent': 'Toasty Research App' }
      });

      if (!forecastResponse.ok) {
        throw new Error(`NWS forecast API error: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();
      const periods = forecastData.properties.periods;
      const nwsUpdateTime = new Date(forecastData.properties.updateTime);

      const now = new Date();
      const cityTimezone = coords.timezone;
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: cityTimezone });
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: cityTimezone });

      const transformedForecast = periods.map(period => {
        const time = new Date(period.startTime);
        const dateStr = time.toLocaleDateString('en-CA', { timeZone: cityTimezone });
        const hour = parseInt(time.toLocaleTimeString('en-US', {
          timeZone: cityTimezone,
          hour: 'numeric',
          hour12: false
        }));

        return {
          time: time.toISOString(),
          hour,
          temperature: period.temperature,
          temperatureUnit: period.temperatureUnit,
          shortForecast: period.shortForecast,
          icon: period.icon,
          isDaytime: period.isDaytime,
          isToday: dateStr === todayStr,
          isTomorrow: dateStr === tomorrowStr,
          dateStr,
        };
      });

      const todayPeriods = transformedForecast.filter(p => p.isToday);
      const todayHigh = todayPeriods.length > 0 ? Math.max(...todayPeriods.map(p => p.temperature)) : null;
      const todayLow = todayPeriods.length > 0 ? Math.min(...todayPeriods.map(p => p.temperature)) : null;

      const tomorrowPeriods = transformedForecast.filter(p => p.isTomorrow);
      const tomorrowHigh = tomorrowPeriods.length > 0 ? Math.max(...tomorrowPeriods.map(p => p.temperature)) : null;
      const tomorrowLow = tomorrowPeriods.length > 0 ? Math.min(...tomorrowPeriods.map(p => p.temperature)) : null;

      let peakHour = null;
      if (todayPeriods.length > 0) {
        const peakPeriod = todayPeriods.reduce((max, p) => p.temperature > max.temperature ? p : max, todayPeriods[0]);
        const peakTime = new Date(peakPeriod.time);
        peakHour = {
          hour: peakPeriod.hour,
          temperature: peakPeriod.temperature,
          timeStr: peakTime.toLocaleTimeString('en-US', { timeZone: cityTimezone, hour: 'numeric', minute: '2-digit' }),
        };
      }

      const result = {
        periods: transformedForecast,
        todayHigh,
        todayLow,
        tomorrowHigh,
        tomorrowLow,
        peakHour,
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
      console.error('[NWSHourlyForecast] Fetch error:', err);
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
    loading,
    error,
    refetch: () => fetchForecast(true),
    updateTime,
  };
}

export default useNWSHourlyForecast;
