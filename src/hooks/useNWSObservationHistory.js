import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../constants/errors';

/**
 * Hook to fetch NWS observation history for a station
 * Returns temperature, humidity, dewpoint data over the past 24-48 hours
 */
export function useNWSObservationHistory(stationId, hoursBack = 48) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchObservations = useCallback(async (force = false) => {
    if (!stationId) {
      setLoading(false);
      return;
    }

    // Check cache first (v2 = fixed wind speed conversion + added visibility/windChill)
    // v3 = added rawMessage field for METAR filtering
    const cacheKey = `nws_obs_history_v3_${stationId}_${hoursBack}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache for 5 minutes
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            // Re-hydrate Date objects from cached strings
            const rehydrated = data.map(obs => ({
              ...obs,
              timestamp: new Date(obs.timestamp),
            }));
            setObservations(rehydrated);
            // Set lastUpdated from most recent observation
            if (rehydrated.length > 0) {
              setLastUpdated(rehydrated[rehydrated.length - 1].timestamp);
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) { /* ignore cache errors */ }
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate start time for observations
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hoursBack * 60 * 60 * 1000);

      const url = `https://api.weather.gov/stations/${stationId}/observations?start=${startTime.toISOString()}&end=${endTime.toISOString()}`;

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

      // Transform observations - NWS returns newest first
      const transformed = features
        .map(f => {
          const props = f.properties;
          const timestamp = new Date(props.timestamp);

          // Convert Celsius to Fahrenheit helper
          const celsiusToFahrenheit = (c) => c != null ? (c * 9/5) + 32 : null;

          // Temperature values
          const tempC = props.temperature?.value;
          const tempF = celsiusToFahrenheit(tempC);

          const dewpointC = props.dewpoint?.value;
          const dewpointF = celsiusToFahrenheit(dewpointC);

          const windChillC = props.windChill?.value;
          const windChillF = celsiusToFahrenheit(windChillC);

          const heatIndexC = props.heatIndex?.value;
          const heatIndexF = celsiusToFahrenheit(heatIndexC);

          const humidity = props.relativeHumidity?.value;

          // Wind speed: km/h to mph (divide by 1.60934)
          const windSpeedKmh = props.windSpeed?.value;
          const windSpeedMph = windSpeedKmh != null ? windSpeedKmh / 1.60934 : null;

          // Visibility: meters (keep in meters, modal will convert to miles)
          const visibilityM = props.visibility?.value;

          // Pressure: Pascals (keep in Pa, modal will convert to inHg)
          const pressurePa = props.barometricPressure?.value;

          return {
            timestamp,
            time: timestamp.toISOString(),
            temperature: tempF != null ? Math.round(tempF * 10) / 10 : null,
            dewpoint: dewpointF != null ? Math.round(dewpointF * 10) / 10 : null,
            humidity: humidity != null ? Math.round(humidity) : null,
            windSpeed: windSpeedMph != null ? Math.round(windSpeedMph) : null,
            windDirection: props.windDirection?.value,
            windChill: windChillF != null ? Math.round(windChillF) : null,
            heatIndex: heatIndexF != null ? Math.round(heatIndexF) : null,
            visibility: visibilityM, // Keep in meters
            pressure: pressurePa, // Keep in Pascals
            description: props.textDescription,
            rawMessage: props.rawMessage || '', // METAR/SPECI string (empty for 5-min ASOS)
          };
        })
        .filter(obs => obs.temperature != null) // Only keep observations with valid temperature
        .reverse(); // Reverse to get oldest first for charting

      // Cache the results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: transformed,
          timestamp: Date.now()
        }));
      } catch (e) { /* ignore cache errors */ }

      setObservations(transformed);
      // Set lastUpdated from most recent observation
      if (transformed.length > 0) {
        setLastUpdated(transformed[transformed.length - 1].timestamp);
      }
      setError(null);
    } catch (err) {
      console.error('[NWSObservationHistory] Fetch error:', err);
      setError(getErrorMessage(err, 'weather'));
    } finally {
      setLoading(false);
    }
  }, [stationId, hoursBack]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchObservations(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchObservations]);

  return {
    observations,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchObservations(true),
  };
}

export default useNWSObservationHistory;
