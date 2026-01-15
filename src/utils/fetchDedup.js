/**
 * Request deduplication and caching utility
 * Prevents duplicate in-flight requests and provides short-term caching
 */

// Map of pending requests (URL -> Promise)
const pendingRequests = new Map();

// Map of cached responses (URL -> { data, timestamp })
const responseCache = new Map();

// Default cache TTL: 2 minutes (for NWS data that updates every 5 min)
const DEFAULT_CACHE_TTL = 2 * 60 * 1000;

/**
 * Fetch with deduplication and caching
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} cacheTTL - Cache time-to-live in milliseconds (default: 2 min)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function fetchWithDedup(url, options = {}, cacheTTL = DEFAULT_CACHE_TTL) {
  // Check cache first
  const cached = responseCache.get(url);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return cached.data;
  }

  // Check if request is already in flight
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  // Create new request
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      // Cache the response
      responseCache.set(url, { data, timestamp: Date.now() });

      return data;
    } finally {
      // Clean up pending request
      pendingRequests.delete(url);
    }
  })();

  // Store pending request
  pendingRequests.set(url, fetchPromise);

  return fetchPromise;
}

/**
 * Clear cached response for a URL
 * @param {string} url - URL to clear from cache
 */
export function clearCache(url) {
  responseCache.delete(url);
}

/**
 * Clear all cached responses
 */
export function clearAllCache() {
  responseCache.clear();
}

/**
 * Get cache statistics
 * @returns {{ pending: number, cached: number }}
 */
export function getCacheStats() {
  return {
    pending: pendingRequests.size,
    cached: responseCache.size,
  };
}

export default fetchWithDedup;
