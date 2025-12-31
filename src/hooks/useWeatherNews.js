import { useState, useEffect } from 'react';

const CACHE_KEY = 'toasty_weather_news_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to fetch weather-related news for a city using NewsData.io API
 * Only fetches when enabled (typically when no alerts)
 */
export function useWeatherNews(cityName, enabled = true) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !cityName) {
      setNews([]);
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `${CACHE_KEY}_${cityName.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setNews(data);
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      const apiKey = import.meta.env.VITE_NEWSDATA_API_KEY;

      if (!apiKey) {
        console.warn('NewsData.io API key not configured');
        setNews([]);
        setLoading(false);
        return;
      }

      try {
        // Search for weather-related news specific to the city
        // Use category filter + city name for better relevance
        const query = encodeURIComponent(`${cityName} weather`);
        const url = `https://newsdata.io/api/1/latest?` +
          `apikey=${apiKey}&` +
          `q=${query}&` +
          `country=us&` +
          `language=en&` +
          `category=top,environment`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`News API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to fetch news');
        }

        // Parse and normalize news items
        const parsedNews = (data.results || [])
          .slice(0, 5) // Limit to 5 items
          .map((item) => ({
            id: item.article_id || item.link,
            title: item.title,
            description: item.description,
            source: item.source_name || item.source_id,
            url: item.link,
            imageUrl: item.image_url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          }));

        // Cache the results
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: parsedNews,
            timestamp: Date.now(),
          })
        );

        setNews(parsedNews);
      } catch (err) {
        console.error('Error fetching weather news:', err);
        setError(err.message);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [cityName, enabled]);

  return { news, loading, error };
}

/**
 * Format relative time for news items
 */
export function formatNewsTime(date) {
  if (!date) return '';

  // Handle both Date objects and date strings (from cache)
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
