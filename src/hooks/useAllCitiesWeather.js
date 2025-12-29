import { useState, useEffect, useCallback } from 'react';
import { CITIES } from '../config/cities';

/**
 * Hook to fetch current weather for all cities
 * Caches results in localStorage and fetches in batches to avoid rate limiting
 */
export function useAllCitiesWeather() {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeatherForStation = async (stationId) => {
    try {
      const response = await fetch(
        `https://api.weather.gov/stations/${stationId}/observations/latest`,
        {
          headers: {
            'User-Agent': 'Toasty Research (toasty-research.app)',
            'Accept': 'application/geo+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const props = data.properties;

      if (!props) return null;

      // Convert temperature from Celsius to Fahrenheit
      const tempC = props.temperature?.value;
      const tempF = tempC != null ? Math.round((tempC * 9/5) + 32) : null;

      return {
        temp: tempF,
        condition: props.textDescription || 'Unknown',
        humidity: props.relativeHumidity?.value != null
          ? Math.round(props.relativeHumidity.value)
          : null,
        windSpeed: props.windSpeed?.value != null
          ? Math.round(props.windSpeed.value / 1.60934) // km/h to mph
          : null,
        timestamp: props.timestamp,
      };
    } catch (err) {
      console.error(`[AllCitiesWeather] Error fetching ${stationId}:`, err);
      return null;
    }
  };

  const fetchAllWeather = useCallback(async (force = false) => {
    // Check cache first
    const cacheKey = 'all_cities_weather_v1';
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache for 5 minutes
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setWeatherData(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) { /* ignore cache errors */ }
    }

    setLoading(true);
    setError(null);

    try {
      const results = {};

      // Fetch in batches of 5 to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < CITIES.length; i += batchSize) {
        const batch = CITIES.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (city) => {
            const weather = await fetchWeatherForStation(city.stationId);
            return { slug: city.slug, weather };
          })
        );

        batchResults.forEach(({ slug, weather }) => {
          if (weather) {
            results[slug] = weather;
          }
        });

        // Small delay between batches to be nice to the API
        if (i + batchSize < CITIES.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Cache results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: results,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore cache errors */ }

      setWeatherData(results);
      setError(null);
    } catch (err) {
      console.error('[AllCitiesWeather] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWeather();
  }, [fetchAllWeather]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchAllWeather(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllWeather]);

  // Helper to get weather for a specific city
  const getWeatherForCity = (citySlug) => {
    return weatherData[citySlug] || null;
  };

  return {
    weatherData,
    loading,
    error,
    getWeatherForCity,
    refetch: () => fetchAllWeather(true),
  };
}

export default useAllCitiesWeather;
