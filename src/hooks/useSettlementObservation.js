import { useState, useEffect, useCallback, useRef } from 'react';
import { CITY_BY_SLUG } from '../config/cities';

/**
 * Hook to track settlement station observations with trend analysis
 *
 * Returns current temperature at the official settlement station
 * plus trend direction (rising/falling/steady) based on recent observations.
 *
 * Critical for traders: This is THE temperature that determines settlement.
 */
export function useSettlementObservation(citySlug) {
  const [observation, setObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trend, setTrend] = useState(null); // 'rising' | 'falling' | 'steady'
  const observationHistory = useRef([]);

  const city = CITY_BY_SLUG[citySlug];
  const stationId = city?.stationId;
  const stationName = getStationName(stationId);

  const fetchObservation = useCallback(async () => {
    if (!stationId) {
      setError('No station configured for this city');
      setLoading(false);
      return;
    }

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

      // Convert to Fahrenheit
      const tempC = props.temperature?.value;
      const tempF = tempC != null ? Math.round((tempC * 9/5) + 32) : null;

      const timestamp = new Date(props.timestamp);
      const isStale = Date.now() - timestamp.getTime() > 20 * 60 * 1000; // >20 min old

      const obs = {
        temperature: tempF,
        temperatureC: tempC != null ? Math.round(tempC) : null,
        humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null,
        conditions: props.textDescription || 'N/A',
        timestamp,
        isStale,
        stationId,
        stationName,
      };

      setObservation(obs);
      setError(null);

      // Track history for trend calculation
      if (tempF != null) {
        observationHistory.current.push({ temp: tempF, time: timestamp });
        // Keep last 6 observations (~30 min of data)
        if (observationHistory.current.length > 6) {
          observationHistory.current.shift();
        }
        calculateTrend();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stationId, stationName]);

  // Calculate trend from observation history
  const calculateTrend = () => {
    const history = observationHistory.current;
    if (history.length < 3) {
      setTrend(null);
      return;
    }

    const recent = history.slice(-3);
    const oldest = recent[0].temp;
    const newest = recent[recent.length - 1].temp;
    const diff = newest - oldest;

    if (diff >= 2) {
      setTrend('rising');
    } else if (diff <= -2) {
      setTrend('falling');
    } else {
      setTrend('steady');
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!citySlug) return;

    observationHistory.current = [];
    setLoading(true);
    fetchObservation();

    // Poll every 5 minutes (METAR refresh rate)
    const interval = setInterval(fetchObservation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [citySlug, fetchObservation]);

  return {
    observation,
    temperature: observation?.temperature,
    temperatureC: observation?.temperatureC,
    humidity: observation?.humidity,
    conditions: observation?.conditions,
    timestamp: observation?.timestamp,
    isStale: observation?.isStale || false,
    trend,
    stationId,
    stationName,
    loading,
    error,
    refetch: fetchObservation,
  };
}

/**
 * Get human-readable station name
 */
function getStationName(stationId) {
  const STATION_NAMES = {
    'KLAX': 'LAX Airport',
    'KNYC': 'Central Park',
    'KMDW': 'Midway Airport',
    'KMIA': 'Miami Airport',
    'KDEN': 'Denver Airport',
    'KAUS': 'Austin Airport',
    'KPHL': 'PHL Airport',
    'KHOU': 'Hobby Airport',
    'KSEA': 'Sea-Tac Airport',
    'KSFO': 'SFO Airport',
    'KBOS': 'Logan Airport',
    'KDCA': 'Reagan Airport',
    'KDFW': 'DFW Airport',
    'KDTW': 'Detroit Metro',
    'KSLC': 'SLC Airport',
    'KMSY': 'MSY Airport',
  };
  return STATION_NAMES[stationId] || stationId;
}

export default useSettlementObservation;
