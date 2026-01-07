import { useState, useEffect, useCallback } from 'react';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to fetch and cache Toasty Summary for a city's forecast discussion
 * Uses the copilot API in summary mode
 */
export function useToastySummary({ citySlug, cityName, discussion, weather, markets }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate cache key based on city and AFD issuance time
  const getCacheKey = useCallback(() => {
    if (!discussion?.issuanceTime) return null;
    return `toasty_summary_${citySlug}_${discussion.issuanceTime}`;
  }, [citySlug, discussion?.issuanceTime]);

  // Check cache for existing summary
  const getCachedSummary = useCallback(() => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { summary: cachedSummary, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_TTL) {
        return cachedSummary;
      }
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
    } catch (e) {
      console.warn('Error reading summary cache:', e);
    }
    return null;
  }, [getCacheKey]);

  // Save summary to cache
  const cacheSummary = useCallback((summaryText) => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        summary: summaryText,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Error caching summary:', e);
    }
  }, [getCacheKey]);

  // Fetch summary from API
  const fetchSummary = useCallback(async () => {
    if (!discussion?.synopsis && !discussion?.nearTerm) {
      setError('No forecast discussion available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate Toasty Summary' }],
          context: {
            mode: 'summary',
            city: { name: cityName },
            afd: {
              office: discussion.office,
              issuanceTime: discussion.issuanceTime,
              synopsis: discussion.synopsis,
              nearTerm: discussion.nearTerm,
              shortTerm: discussion.shortTerm,
              longTerm: discussion.longTerm,
            },
            weather: weather ? {
              temp: weather.temperature?.value != null
                ? Math.round((weather.temperature.value * 9/5) + 32)
                : null,
              condition: weather.textDescription,
              humidity: weather.relativeHumidity?.value,
              windSpeed: weather.windSpeed?.value != null
                ? Math.round(weather.windSpeed.value * 0.621371) // km/h to mph
                : null,
              windDirection: weather.windDirection?.value != null
                ? getWindDirection(weather.windDirection.value)
                : null,
            } : null,
            markets: markets?.topBrackets ? {
              topBrackets: markets.topBrackets.slice(0, 3),
            } : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                fullText += data.content;
                setSummary(fullText);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Cache the final summary
      if (fullText) {
        cacheSummary(fullText);
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
      setError(e.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [discussion, cityName, weather, markets, cacheSummary]);

  // On mount or discussion change, check cache first
  useEffect(() => {
    if (!discussion) return;

    const cached = getCachedSummary();
    if (cached) {
      setSummary(cached);
      return;
    }

    // No cache, fetch fresh
    fetchSummary();
  }, [discussion?.issuanceTime, getCachedSummary, fetchSummary]);

  // Manual refresh function
  const refresh = useCallback(() => {
    const cacheKey = getCacheKey();
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    setSummary(null);
    fetchSummary();
  }, [getCacheKey, fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh,
  };
}

// Helper to convert wind degrees to cardinal direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export default useToastySummary;
