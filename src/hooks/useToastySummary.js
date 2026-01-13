import { useState, useEffect, useCallback } from 'react';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to fetch and cache Toasty Summary for a city's forecast discussion
 * Uses the copilot API in summary mode
 */
export function useToastySummary({ citySlug, cityName, discussion, weather, markets, models }) {
  const [summary, setSummary] = useState(null); // Will contain { today, tomorrow }
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
      // Check if we're in development without Vercel dev server
      const isDev = import.meta.env.DEV;

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
            // Model forecast data for grounding temperature predictions
            models: models?.length > 0 ? models.map(m => ({
              name: m.name || m.model,
              high: m.high ?? m.temperature,
            })).filter(m => m.high != null) : null,
          },
        }),
      });

      if (!response.ok) {
        // Check if we got HTML back (means API route doesn't exist)
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          throw new Error('API not available. Run "vercel dev" for local development.');
        }
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
                // Show raw text while streaming, will parse at the end
                setSummary({ raw: fullText, today: null, tomorrow: null });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Re-throw API errors, only ignore parse errors for incomplete chunks
              if (e instanceof SyntaxError) {
                // JSON parse error from incomplete chunk - ignore
                continue;
              }
              throw e; // Re-throw actual errors from the API
            }
          }
        }
      }

      // Parse and cache the final summary
      if (fullText) {
        const parsed = parseTwoDaySummary(fullText);
        setSummary(parsed);
        cacheSummary(parsed);
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
      // Provide helpful error message
      if (e.message?.includes('API not available')) {
        setError('AI Summary requires "vercel dev" in local development');
      } else if (e.message?.includes('Failed to fetch')) {
        setError('AI Summary unavailable - check network connection');
      } else {
        setError(e.message || 'Failed to generate summary');
      }
    } finally {
      setLoading(false);
    }
  }, [discussion, cityName, weather, markets, models, cacheSummary]);

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

// Helper to parse two-day summary into separate sections
function parseTwoDaySummary(fullText) {
  if (!fullText) return { today: null, tomorrow: null, raw: fullText };

  // Split by section markers
  const todayMatch = fullText.match(/---TODAY---([\s\S]*?)(?:---TOMORROW---|$)/);
  const tomorrowMatch = fullText.match(/---TOMORROW---([\s\S]*?)$/);

  const today = todayMatch ? todayMatch[1].trim() : null;
  const tomorrow = tomorrowMatch ? tomorrowMatch[1].trim() : null;

  // If no sections found, put everything in today for backwards compatibility
  if (!today && !tomorrow) {
    return { today: fullText.trim(), tomorrow: null, raw: fullText };
  }

  return { today, tomorrow, raw: fullText };
}

export default useToastySummary;
