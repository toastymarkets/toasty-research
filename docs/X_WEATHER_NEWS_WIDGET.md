# X Weather News Widget: Implementation Plan

## Overview

A new widget that surfaces location-specific weather news from X (Twitter) using the xAI Grok API. The widget displays NWS reports, infographics, and commentary from meteorologists relevant to the selected city.

**Primary Use Case:** Get real-time weather intelligence from X - NWS alerts, meteorologist analysis, radar/satellite imagery shares, and storm reports that aren't available through official APIs.

---

## Data Source: xAI Grok API

### Why Grok API?

The xAI API provides an `x_search` tool that enables direct searching of X posts, users, and threads. This is unique among AI APIs because:

1. **Real-time X data access** - Unlike other AI models limited to training data
2. **Server-side execution** - No need to manage X API keys or rate limits
3. **Filtering capabilities** - Can filter by specific handles (NWS accounts, meteorologists)
4. **Rich content extraction** - Returns post text, images, engagement metrics

### API Details

| Property | Value |
|----------|-------|
| Endpoint | `https://api.x.ai/v1/chat/completions` |
| Model | `grok-4-1-fast` (recommended for tool calling) |
| Tool | `x_search` |
| Auth | Bearer token (`XAI_API_KEY`) |
| Pricing | $3/M input tokens, $15/M output tokens |
| Context | 2M tokens |

### API Request Structure

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${XAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4-1-fast',
    messages: [
      {
        role: 'system',
        content: 'Search X for weather news. Return structured JSON with posts.'
      },
      {
        role: 'user',
        content: `Find recent weather posts about ${cityName} from NWS and meteorologists`
      }
    ],
    tools: [
      {
        type: 'x_search',
        x_search: {
          allowed_x_handles: ['NWS', 'NWSNewYorkNY', ...]  // City-specific
        }
      }
    ]
  })
});
```

### Alternative: Live Search API (Simpler)

For simpler implementation, use the Live Search endpoint which includes X by default:

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${XAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4-1-fast',
    messages: [
      { role: 'user', content: `${cityName} weather news NWS meteorologist` }
    ],
    search: {
      mode: 'auto',  // or 'on' to force
      sources: ['x', 'news']  // Include X and news sources
    }
  })
});
```

> **Note:** Live Search API deprecated January 12, 2026. Migrate to Agent Tools API.

---

## X Handles by City

### NWS Forecast Offices

| City | NWS Handle | Office |
|------|------------|--------|
| New York | `@NWSNewYorkNY` | OKX |
| Chicago | `@NWSChicago` | LOT |
| Los Angeles | `@NWSLosAngeles` | LOX |
| Miami | `@NWSMiami` | MFL |
| Austin | `@NWSSanAntonio` | EWX |
| Denver | `@NWSBoulder` | BOU |
| Phoenix | `@NWSPhoenix` | PSR |

### Additional Handles to Track

```javascript
const WEATHER_HANDLES = {
  national: [
    'NWS',           // National Weather Service main
    'ABOROUSSEAU',   // NWS emergency response
    'NWSAlerts',     // Automated alerts
  ],
  'new-york': [
    'NWSNewYorkNY',
    'NotifyNYC',     // NYC emergency management
    'nyaboroug',     // NYC meteorologist (example)
  ],
  'chicago': [
    'NWSChicago',
    'ChicagoNWSChat',
    'TomSkilling',   // WGN meteorologist
  ],
  'los-angeles': [
    'NWSLosAngeles',
    'ABOROUSSEAU',
    'NWSSanDiego',
  ],
  // ... etc
};
```

---

## Architecture

### File Structure

```
src/
├── hooks/
│   └── useXWeatherNews.js       # Data fetching hook
├── components/
│   └── widgets/
│       └── XWeatherNews.jsx     # Widget component
├── config/
│   └── xHandles.js              # NWS/meteorologist handles by city
api/
└── xai.js                       # Vercel proxy function (CORS)
```

### Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  XWeatherNews   │────▶│ useXWeather  │────▶│  /api/xai   │
│    Widget       │     │    News      │     │   (proxy)   │
└─────────────────┘     └──────────────┘     └─────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────┐
                                            │  xAI API    │
                                            │  x_search   │
                                            └─────────────┘
```

---

## Implementation

### Phase 1: API Proxy

**File:** `api/xai.js`

```javascript
// Vercel serverless function to proxy xAI API requests
// Avoids CORS and keeps API key server-side

export default async function handler(req, res) {
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    return res.status(500).json({ error: 'XAI_API_KEY not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('xAI API error:', error);
    return res.status(500).json({ error: 'Failed to fetch from xAI' });
  }
}
```

**Complexity:** Low

---

### Phase 2: X Handles Configuration

**File:** `src/config/xHandles.js`

```javascript
// NWS and meteorologist X handles by city

export const NWS_HANDLES = {
  national: ['NWS', 'NWSAlerts'],
  'new-york': ['NWSNewYorkNY'],
  'chicago': ['NWSChicago'],
  'los-angeles': ['NWSLosAngeles'],
  'miami': ['NWSMiami'],
  'austin': ['NWSSanAntonio'],
  'denver': ['NWSBoulder'],
  'phoenix': ['NWSPhoenix'],
};

export const METEOROLOGIST_HANDLES = {
  'new-york': [],    // Add local TV mets
  'chicago': ['TomSkilling'],
  'los-angeles': [],
  // ... etc
};

export function getHandlesForCity(citySlug) {
  return [
    ...NWS_HANDLES.national,
    ...(NWS_HANDLES[citySlug] || []),
    ...(METEOROLOGIST_HANDLES[citySlug] || []),
  ];
}
```

**Complexity:** Low

---

### Phase 3: Data Hook

**File:** `src/hooks/useXWeatherNews.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getHandlesForCity } from '../config/xHandles';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const PROXY_URL = '/api/xai';

/**
 * Fetch weather-related posts from X for a city
 * Uses xAI Grok API with x_search tool
 */
export function useXWeatherNews(citySlug, cityName, enabled = true) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPosts = useCallback(async () => {
    if (!enabled || !cityName) {
      setPosts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache
      const cacheKey = `x_weather_${citySlug}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setPosts(data);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
          return;
        }
      }

      const handles = getHandlesForCity(citySlug);

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'grok-4-1-fast',
          messages: [
            {
              role: 'system',
              content: `You are a weather news aggregator. Search X for recent weather posts about ${cityName}.
                        Focus on: NWS alerts, meteorologist analysis, radar/satellite images, storm reports.
                        Return JSON array: [{ text, author, handle, timestamp, hasImage, imageUrl?, url }]
                        Limit to 5 most relevant recent posts.`
            },
            {
              role: 'user',
              content: `Find weather posts about ${cityName} from the last 24 hours`
            }
          ],
          tools: [
            {
              type: 'x_search',
              x_search: {
                allowed_x_handles: handles
              }
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse response - Grok returns structured content
      const content = data.choices?.[0]?.message?.content;
      let parsed = [];

      if (content) {
        try {
          const json = JSON.parse(content);
          parsed = Array.isArray(json) ? json : json.posts || [];
        } catch {
          console.warn('Failed to parse Grok response as JSON');
        }
      }

      // Normalize post structure
      const normalized = parsed.slice(0, 5).map((post, i) => ({
        id: post.id || `${citySlug}-${i}-${Date.now()}`,
        text: post.text || post.content || '',
        author: post.author || post.name || 'Unknown',
        handle: post.handle || post.username || '',
        timestamp: post.timestamp ? new Date(post.timestamp) : null,
        hasImage: Boolean(post.hasImage || post.imageUrl),
        imageUrl: post.imageUrl || null,
        url: post.url || null,
        isNWS: (post.handle || '').toLowerCase().includes('nws'),
      }));

      // Cache results
      localStorage.setItem(cacheKey, JSON.stringify({
        data: normalized,
        timestamp: Date.now(),
      }));

      setPosts(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching X weather news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug, cityName, enabled]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    lastUpdated,
    refetch: fetchPosts
  };
}

// Format relative time
export function formatPostTime(date) {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

**Complexity:** Medium

---

### Phase 4: Widget Component

**File:** `src/components/widgets/XWeatherNews.jsx`

```javascript
import { useState, useCallback } from 'react';
import {
  Twitter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Shield,  // For NWS verified badge
  Image as ImageIcon
} from 'lucide-react';
import { useXWeatherNews, formatPostTime } from '../../hooks/useXWeatherNews';
import SelectableData from './SelectableData';

export default function XWeatherNews({
  citySlug,
  cityName,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { posts, loading, error, lastUpdated, refetch } = useXWeatherNews(
    citySlug,
    cityName
  );

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left"
        >
          <Twitter className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            X Weather
          </h3>
          {isExpanded ? (
            <ChevronUp size={14} className="text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatPostTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[var(--color-card-elevated)]
                       text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                       transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Loading state */}
          {loading && posts.length === 0 && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[var(--color-card-elevated)] rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-6 text-red-400 text-sm">
              <p>Failed to load posts</p>
              <button
                onClick={refetch}
                className="mt-2 text-sky-400 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              <Twitter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No weather posts found</p>
            </div>
          )}

          {/* Posts list */}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} cityName={cityName} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, cityName }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-xl bg-[var(--color-card-elevated)]
                 hover:bg-[var(--color-card-elevated)]/80 transition-colors
                 border border-transparent hover:border-sky-500/20"
    >
      <div className="flex gap-3">
        {/* Image thumbnail */}
        {post.hasImage && post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => e.target.style.display = 'none'}
          />
        ) : post.hasImage ? (
          <div className="w-16 h-16 rounded-lg bg-[var(--color-card-bg)]
                          flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">
              {post.author}
            </span>
            {post.isNWS && (
              <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            )}
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              @{post.handle}
            </span>
          </div>

          {/* Post text */}
          <SelectableData
            value={post.text}
            label={`X post from @${post.handle}`}
            source={`X - ${cityName}`}
            type="news"
          >
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {post.text}
            </p>
          </SelectableData>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatPostTime(post.timestamp)}
            </span>
            <ExternalLink size={12} className="text-[var(--color-text-muted)]" />
          </div>
        </div>
      </div>
    </a>
  );
}
```

**Complexity:** Medium

---

### Phase 5: Widget Registration

**File:** `src/config/WidgetRegistry.js` (add to existing)

```javascript
import XWeatherNews from '../components/widgets/XWeatherNews';

// Add to WIDGET_REGISTRY
'x-weather-news': {
  id: 'x-weather-news',
  name: 'X Weather',
  description: 'Weather news and NWS posts from X',
  icon: 'Twitter',
  component: XWeatherNews,
  category: 'weather',
  requiredProps: ['citySlug', 'cityName'],
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 4,
},
```

**File:** `src/config/gridConstraints.js` (add to existing)

```javascript
// Add to WIDGET_CONSTRAINTS
'x-weather-news': {
  id: 'x-weather-news',
  collapsed: { cols: 2, rows: 1 },
  expanded: { cols: 4, rows: 2 },
  min: { cols: 2, rows: 1 },
  priority: 2,
  canHide: true,
},
```

**Complexity:** Low

---

## Visual Design

### Layout (Compact)

```
┌─────────────────────────────────────┐
│ 𝕏 X Weather                    ↻ 5m │
├─────────────────────────────────────┤
│ ┌─────┐ NWS New York 🛡️            │
│ │ IMG │ @NWSNewYorkNY               │
│ └─────┘ Winter Storm Warning in     │
│         effect until 6 PM...   2h ↗ │
├─────────────────────────────────────┤
│ ┌─────┐ Tom Skilling               │
│ │ IMG │ @TomSkilling                │
│ └─────┘ Lake effect snow bands...   │
│                                4h ↗ │
├─────────────────────────────────────┤
│         ... more posts              │
└─────────────────────────────────────┘
```

### Color Scheme

| Element | Color | Tailwind |
|---------|-------|----------|
| X icon | Sky blue | `text-sky-400` |
| NWS badge | Sky blue | `text-sky-400` |
| Author name | Primary text | `text-[var(--color-text-primary)]` |
| Handle | Muted | `text-[var(--color-text-muted)]` |
| Post text | Secondary | `text-[var(--color-text-secondary)]` |
| Card hover | Sky border | `hover:border-sky-500/20` |

---

## Environment Variables

```bash
# .env.local (local development)
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxx

# Vercel (production)
# Add XAI_API_KEY in Vercel dashboard → Settings → Environment Variables
```

---

## Cost Estimation

| Scenario | Input Tokens | Output Tokens | Cost |
|----------|--------------|---------------|------|
| 1 request | ~500 | ~800 | ~$0.014 |
| Per user/day (10 refreshes) | 5,000 | 8,000 | ~$0.14 |
| 100 users/day | 500,000 | 800,000 | ~$14 |

With 15-minute caching, actual costs will be significantly lower.

---

## Testing Checklist

- [ ] Widget appears in Add Widget panel
- [ ] Loading skeleton displays while fetching
- [ ] Posts render with author, handle, text, timestamp
- [ ] NWS posts show verified badge
- [ ] Images display as thumbnails
- [ ] External links open in new tab
- [ ] Refresh button works
- [ ] Expand/collapse toggle works
- [ ] SelectableData allows insertion to notes
- [ ] Cache prevents excessive API calls
- [ ] Error state displays retry button
- [ ] Works for all cities (NYC, Chicago, LA, etc.)

---

## Future Enhancements

1. **Trending topics** - Show weather-related trending hashtags for the city
2. **Post filtering** - Filter by type (alerts, forecasts, imagery)
3. **Engagement metrics** - Show likes/retweets for popular posts
4. **Auto-refresh** - Background refresh every 15 minutes
5. **Expanded view** - Full post thread in modal
6. **Save posts** - Bookmark important weather posts
7. **Multi-city feed** - Show posts from multiple cities at once

---

## References

- [xAI API Documentation](https://docs.x.ai/docs/overview)
- [xAI Agent Tools API](https://x.ai/news/grok-4-1-fast)
- [xAI Live Search](https://docs.x.ai/docs/guides/live-search)
- [NWS Social Media Directory](https://www.weather.gov/socialmedia)
