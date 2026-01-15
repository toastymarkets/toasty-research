import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { CITY_BY_SLUG, CITY_BY_ID } from '../config/cities';
import { getErrorMessage } from '../constants/errors';
import { fetchWithDedup } from '../utils/fetchDedup';

// NWS API headers
const NWS_HEADERS = {
  'User-Agent': 'Toasty Research (toasty-research.app)',
  'Accept': 'application/geo+json',
};

// Cache TTL: 2 minutes (NWS updates every ~5 min)
const OBSERVATION_CACHE_TTL = 2 * 60 * 1000;

/**
 * Fetch current observations from NWS station with deduplication
 */
const fetchStationObservation = async (stationId) => {
  try {
    const url = `https://api.weather.gov/stations/${stationId}/observations/latest`;
    const data = await fetchWithDedup(url, { headers: NWS_HEADERS }, OBSERVATION_CACHE_TTL);
    return data.properties || null;
  } catch (error) {
    logger.error(`[NWS] Error fetching ${stationId}:`, error);
    return null;
  }
};

/**
 * Hook to get current weather for a station
 */
export const useNWSWeather = (stationId) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationId) {
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const observation = await fetchStationObservation(stationId);

        if (observation) {
          setWeather({
            temperature: observation.temperature,
            humidity: observation.relativeHumidity,
            windSpeed: observation.windSpeed,
            windDirection: observation.windDirection,
            textDescription: observation.textDescription,
            timestamp: observation.timestamp,
            icon: observation.icon,
          });
        } else {
          setError(getErrorMessage(null, 'weather'));
        }
      } catch (err) {
        setError(getErrorMessage(err, 'weather'));
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stationId]);

  const refetch = () => {
    if (stationId) {
      setLoading(true);
      setError(null);
      fetchStationObservation(stationId).then(observation => {
        if (observation) {
          setWeather({
            temperature: observation.temperature,
            humidity: observation.relativeHumidity,
            windSpeed: observation.windSpeed,
            windDirection: observation.windDirection,
            textDescription: observation.textDescription,
            timestamp: observation.timestamp,
            icon: observation.icon,
          });
        } else {
          setError(getErrorMessage(null, 'weather'));
        }
        setLoading(false);
      }).catch(err => {
        setError(getErrorMessage(err, 'weather'));
        setLoading(false);
      });
    }
  };

  return { weather, loading, error, refetch };
};

/**
 * Parse AFD text to extract key sections
 */
const parseAFDText = (productText) => {
  if (!productText) return null;

  const sections = { synopsis: null, shortTerm: null, longTerm: null };

  const synopsisMatch = productText.match(/\.SYNOPSIS\.{3}([\s\S]*?)(?=\n\.[A-Z]|\n&&|$)/i);
  if (synopsisMatch) {
    sections.synopsis = synopsisMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }

  const shortTermMatch = productText.match(/\.SHORT TERM\.{3}([\s\S]*?)(?=\n\.[A-Z]|\n&&|$)/i) ||
                         productText.match(/\.TODAY\.{3}([\s\S]*?)(?=\n\.[A-Z]|\n&&|$)/i);
  if (shortTermMatch) {
    sections.shortTerm = shortTermMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }

  return { sections, rawText: productText };
};

const extractAFDSummary = (parsedAFD, maxLength = 500) => {
  if (!parsedAFD) return null;
  let summary = parsedAFD.sections.synopsis || parsedAFD.sections.shortTerm || '';
  summary = summary.replace(/\s+/g, ' ').replace(/\.{2,}/g, '.').trim();
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
  return summary;
};

/**
 * Hook to get forecast discussion for a city
 */
export const useNWSForecastDiscussion = (cityId) => {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityId) {
      setLoading(false);
      return;
    }

    const cityConfig = CITY_BY_ID[cityId];
    if (!cityConfig || !cityConfig.forecastOffice) {
      setError(`Unknown city or no forecast office: ${cityId}`);
      setLoading(false);
      return;
    }

    const fetchDiscussion = async () => {
      setLoading(true);
      setError(null);

      try {
        const listUrl = `https://api.weather.gov/products/types/AFD/locations/${cityConfig.forecastOffice}`;
        const jsonHeaders = { ...NWS_HEADERS, 'Accept': 'application/json' };

        const data = await fetchWithDedup(listUrl, { headers: jsonHeaders }, 5 * 60 * 1000);
        const products = data['@graph'] || [];

        if (products.length === 0) {
          setError('No forecast discussion available');
          setLoading(false);
          return;
        }

        const latestProductRef = products[0];
        const productId = latestProductRef['@id'] || latestProductRef.id;

        const productData = await fetchWithDedup(productId, { headers: jsonHeaders }, 5 * 60 * 1000);
        const parsed = parseAFDText(productData.productText);
        const summary = extractAFDSummary(parsed);

        setDiscussion({
          id: productData.id,
          issuanceTime: productData.issuanceTime,
          issuingOffice: cityConfig.forecastOffice,
          productText: productData.productText,
          parsed,
          summary,
          cityName: cityConfig.name,
          officeName: cityConfig.forecastOffice,
        });
      } catch (err) {
        setError(getErrorMessage(err, 'forecast'));
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();

    const interval = setInterval(fetchDiscussion, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cityId]);

  return { discussion, loading, error, refetch: () => { setLoading(true); } };
};

export default useNWSWeather;
