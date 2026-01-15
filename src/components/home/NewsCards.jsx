import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';

const CACHE_KEY = 'toasty_homepage_news_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Format relative time for news items
 */
function formatNewsTime(date) {
  if (!date) return '';

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

/**
 * NewsCards - Weather news articles displayed as cards
 */
export default function NewsCards() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);

      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
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
        // Fetch general US weather news
        const url = `https://newsdata.io/api/1/latest?` +
          `apikey=${apiKey}&` +
          `q=weather forecast&` +
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

        const parsedNews = (data.results || [])
          .slice(0, 4)
          .map((item) => ({
            id: item.article_id || item.link,
            title: item.title,
            description: item.description,
            source: item.source_name || item.source_id,
            url: item.link,
            imageUrl: item.image_url,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          }));

        // Cache results
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: parsedNews, timestamp: Date.now() })
        );

        setNews(parsedNews);
      } catch (err) {
        console.error('Error fetching weather news:', err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Don't render section if no API key or no news
  if (!loading && news.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-10">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-white/40" />
        <h2 className="text-sm font-medium text-white/60">Weather News</h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-widget p-3 animate-pulse">
              <div className="aspect-[16/9] rounded-lg bg-white/5 mb-2" />
              <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-2 bg-white/5 rounded w-full mb-1" />
              <div className="h-2 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {news.map((article, index) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                glass-widget glass-interactive p-3 glass-animate-in
                glass-delay-${(index % 5) + 1} group
              `}
            >
              {/* Thumbnail */}
              {article.imageUrl && (
                <div className="aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-white/5">
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col min-h-[80px]">
                <h3 className="text-xs font-medium text-white line-clamp-2 mb-1 group-hover:text-blue-300 transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-[10px] text-white/50 line-clamp-2 mb-2 flex-grow">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="text-[9px] text-white/40 truncate max-w-[60%]">
                    {article.source}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-white/40">
                      {formatNewsTime(article.publishedAt)}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/30" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
