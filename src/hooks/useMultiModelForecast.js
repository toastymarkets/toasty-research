import { useState, useEffect, useCallback } from 'react';
import { CACHE_DURATIONS } from '../constants/cache';
import { getErrorMessage } from '../constants/errors';

// City coordinates - using exact NWS station locations
const CITY_COORDS = {
  'new-york': { lat: 40.78333, lon: -73.96667, name: 'New York', station: 'KNYC (Central Park)', timezone: 'America/New_York' },
  'nyc': { lat: 40.78333, lon: -73.96667, name: 'New York', station: 'KNYC (Central Park)', timezone: 'America/New_York' },
  'los-angeles': { lat: 33.9425, lon: -118.40806, name: 'Los Angeles', station: 'KLAX (LAX Airport)', timezone: 'America/Los_Angeles' },
  'la': { lat: 33.9425, lon: -118.40806, name: 'Los Angeles', station: 'KLAX (LAX Airport)', timezone: 'America/Los_Angeles' },
  'chicago': { lat: 41.78417, lon: -87.75528, name: 'Chicago', station: 'KMDW (Midway Airport)', timezone: 'America/Chicago' },
  'chi': { lat: 41.78417, lon: -87.75528, name: 'Chicago', station: 'KMDW (Midway Airport)', timezone: 'America/Chicago' },
  'miami': { lat: 25.79056, lon: -80.31639, name: 'Miami', station: 'KMIA (Miami Airport)', timezone: 'America/New_York' },
  'denver': { lat: 39.84722, lon: -104.65694, name: 'Denver', station: 'KDEN (Denver Airport)', timezone: 'America/Denver' },
  'austin': { lat: 30.18306, lon: -97.68, name: 'Austin', station: 'KAUS (Austin Airport)', timezone: 'America/Chicago' },
  'philadelphia': { lat: 39.87222, lon: -75.23889, name: 'Philadelphia', station: 'KPHL (PHL Airport)', timezone: 'America/New_York' },
  'houston': { lat: 29.64028, lon: -95.27889, name: 'Houston', station: 'KHOU (Hobby Airport)', timezone: 'America/Chicago' },
  'seattle': { lat: 47.46861, lon: -122.30889, name: 'Seattle', station: 'KSEA (Sea-Tac Airport)', timezone: 'America/Los_Angeles' },
  'san-francisco': { lat: 37.61961, lon: -122.36558, name: 'San Francisco', station: 'KSFO (SFO Airport)', timezone: 'America/Los_Angeles' },
  'boston': { lat: 42.36056, lon: -71.00972, name: 'Boston', station: 'KBOS (Logan Airport)', timezone: 'America/New_York' },
  'washington-dc': { lat: 38.85222, lon: -77.03417, name: 'Washington DC', station: 'KDCA (Reagan Airport)', timezone: 'America/New_York' },
  'dallas': { lat: 32.89833, lon: -97.01944, name: 'Dallas', station: 'KDFW (DFW Airport)', timezone: 'America/Chicago' },
  'detroit': { lat: 42.21417, lon: -83.35333, name: 'Detroit', station: 'KDTW (Detroit Metro)', timezone: 'America/Detroit' },
  'salt-lake-city': { lat: 40.77069, lon: -111.96503, name: 'Salt Lake City', station: 'KSLC (SLC Airport)', timezone: 'America/Denver' },
};

// Weather models available from Open-Meteo
// Metadata based on research: docs/WEATHER_MODELS_RESEARCH.md
const MODELS = [
  {
    id: 'gfs_seamless',
    name: 'GFS',
    fullName: 'Global Forecast System',
    provider: 'NOAA',
    resolution: '13km',
    forecastRange: '16 days',
    updateFreq: '6h',
    color: '#3B82F6',
    accuracy: 3,
    bestFor: 'Extended forecasts (3-16 days), free and widely available',
    knownBias: 'Tends 1-2°F cold during clear afternoons. Progressive bias with storms (too fast/weak).',
    description: 'Primary US global model',
    priority: 1,
  },
  {
    id: 'ncep_nbm_conus',
    name: 'NBM',
    fullName: 'National Blend of Models',
    provider: 'NOAA',
    resolution: '3km',
    forecastRange: '10 days',
    updateFreq: '1h',
    color: '#10B981',
    accuracy: 5,
    bestFor: 'Most accurate overall - statistically calibrated blend of 31+ models',
    knownBias: 'Bias-corrected by design. Trust NBM when it differs from raw models.',
    description: 'Calibrated multi-model blend',
    priority: 2,
  },
  {
    id: 'ecmwf_ifs025',
    name: 'ECMWF',
    fullName: 'European Centre for Medium-Range Weather Forecasts',
    provider: 'ECMWF',
    resolution: '9km',
    forecastRange: '15 days',
    updateFreq: '6h',
    color: '#8B5CF6',
    accuracy: 5,
    bestFor: 'Medium-range (3-10 days). Considered the global gold standard.',
    knownBias: 'Tends 1-2°F cold during day, warm at night. Over-amplifies developing storms.',
    description: 'European model (Gold Standard)',
    priority: 3,
  },
  {
    id: 'icon_seamless',
    name: 'ICON',
    fullName: 'Icosahedral Nonhydrostatic Model',
    provider: 'DWD (Germany)',
    resolution: '11km',
    forecastRange: '7.5 days',
    updateFreq: '6h',
    color: '#EC4899',
    accuracy: 4,
    bestFor: 'European forecasts. Excellent high-resolution regional detail.',
    knownBias: 'Generally reliable. Can struggle with US-specific patterns.',
    description: 'German Weather Service',
    priority: 4,
  },
  {
    id: 'gem_seamless',
    name: 'GEM',
    fullName: 'Global Environmental Multiscale Model',
    provider: 'CMC (Canada)',
    resolution: '15km',
    forecastRange: '10 days',
    updateFreq: '6h',
    color: '#F59E0B',
    accuracy: 3,
    bestFor: 'North American forecasts. Good for Canadian/northern US weather.',
    knownBias: 'Can be too aggressive with precipitation in some scenarios.',
    description: 'Canadian Meteorological Centre',
    priority: 5,
  },
  {
    id: 'jma_seamless',
    name: 'JMA',
    fullName: 'Japan Meteorological Agency Global Model',
    provider: 'JMA (Japan)',
    resolution: '20km',
    forecastRange: '11 days',
    updateFreq: '6h',
    color: '#06B6D4',
    accuracy: 3,
    bestFor: 'Pacific and Asian weather patterns. Independent global perspective.',
    knownBias: 'Less tuned for North American patterns. Useful as outlier check.',
    description: 'Japan Meteorological Agency',
    priority: 6,
  },
];

/**
 * Hook to fetch multi-model weather forecasts from Open-Meteo
 */
export function useMultiModelForecast(citySlug) {
  const [forecasts, setForecasts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchForecasts = useCallback(async (force = false) => {
    const coords = CITY_COORDS[citySlug?.toLowerCase()];
    if (!coords) {
      setError(`Unknown city: ${citySlug}`);
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `multimodel_v3_${citySlug}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATIONS.FORECAST_MODELS) {
            setForecasts(data);
            setLastUpdated(new Date(timestamp));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Cache read failed, continue to fetch
      }
    }

    setLoading(true);
    setError(null);

    try {
      const modelIds = MODELS.map(m => m.id).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7&models=${modelIds}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Generate synthetic hourly curve based on daily high/low
      const generateHourlyCurve = (high, low) => {
        const hours = [];
        for (let hour = 0; hour < 24; hour++) {
          const peakHour = 14;
          const minHour = 6;
          let normalizedHour = (hour - minHour) / 24;
          if (normalizedHour < 0) normalizedHour += 1;
          const cyclePos = (normalizedHour - 0.33) * 2 * Math.PI;
          const factor = (1 - Math.cos(cyclePos)) / 2;
          const temp = Math.round(low + (high - low) * factor);
          hours.push({ hour, temp });
        }
        return hours;
      };

      const findPeakHour = (hourlyData) => {
        if (!hourlyData || hourlyData.length === 0) return 14;
        let maxTemp = -Infinity;
        let peakHour = 14;
        hourlyData.forEach(h => {
          if (h.temp > maxTemp) {
            maxTemp = h.temp;
            peakHour = h.hour;
          }
        });
        return peakHour;
      };

      const modelForecasts = MODELS.map(model => {
        const maxKey = `temperature_2m_max_${model.id}`;
        const minKey = `temperature_2m_min_${model.id}`;
        const hasData = data.daily && data.daily[maxKey];

        if (!hasData) return null;

        return {
          ...model,
          daily: data.daily.time.map((date, i) => {
            const high = Math.round(data.daily[maxKey][i]);
            const low = Math.round(data.daily[minKey]?.[i] ?? 0);
            const hourly = generateHourlyCurve(high, low);
            const peakHour = findPeakHour(hourly);
            return { date, high, low, hourly, peakHour };
          }),
        };
      }).filter(Boolean);

      const todayHighs = modelForecasts.map(m => m.daily[0]?.high).filter(h => h != null);
      const consensus = {
        min: Math.min(...todayHighs),
        max: Math.max(...todayHighs),
        avg: Math.round(todayHighs.reduce((a, b) => a + b, 0) / todayHighs.length),
        spread: Math.max(...todayHighs) - Math.min(...todayHighs),
      };

      const result = {
        city: coords.name,
        station: coords.station,
        timezone: coords.timezone,
        models: modelForecasts,
        consensus,
        dates: data.daily?.time || [],
        fetchedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch (e) {
        // localStorage may fail in private browsing - continue without caching
      }

      setForecasts(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[MultiModel] Fetch error:', err);
      setError(getErrorMessage(err, 'forecast'));
    } finally {
      setLoading(false);
    }
  }, [citySlug]);

  useEffect(() => {
    if (citySlug) {
      fetchForecasts();
    }
  }, [citySlug, fetchForecasts]);

  return {
    forecasts,
    loading,
    error,
    refetch: () => fetchForecasts(true),
    lastUpdated,
  };
}

export { MODELS, CITY_COORDS };
