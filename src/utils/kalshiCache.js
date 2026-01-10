/**
 * Kalshi API Cache & Rate Limiting Utility
 *
 * Provides:
 * - Request deduplication: Same request within 5s returns cached promise
 * - Response caching: Successful responses cached for 30s
 * - Exponential backoff on 429: 10s → 20s → 40s → max 60s
 * - Staggered initial fetches to avoid burst
 */

const CACHE_TTL = 30 * 1000; // 30 seconds for response cache
const DEDUP_WINDOW = 5 * 1000; // 5 seconds for request deduplication
const MAX_BACKOFF = 60 * 1000; // Maximum 60 second backoff
const INITIAL_BACKOFF = 10 * 1000; // Start with 10 second backoff

// In-memory caches
const responseCache = new Map(); // Cache successful responses
const pendingRequests = new Map(); // Deduplicate concurrent requests
let backoffState = {
  until: 0, // Timestamp when backoff ends
  delay: INITIAL_BACKOFF, // Current backoff delay
};

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
  for (const [key, entry] of pendingRequests.entries()) {
    if (now - entry.timestamp > DEDUP_WINDOW) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * Check if we're currently in backoff period
 */
export function isInBackoff() {
  return Date.now() < backoffState.until;
}

/**
 * Get remaining backoff time in ms
 */
export function getBackoffRemaining() {
  const remaining = backoffState.until - Date.now();
  return Math.max(0, remaining);
}

/**
 * Trigger exponential backoff after a 429 response
 */
function triggerBackoff() {
  backoffState.until = Date.now() + backoffState.delay;
  // Double the delay for next time, up to max
  backoffState.delay = Math.min(backoffState.delay * 2, MAX_BACKOFF);
  console.warn(`[KalshiCache] Rate limited. Backing off for ${backoffState.delay / 1000}s`);
}

/**
 * Reset backoff after successful request
 */
function resetBackoff() {
  if (backoffState.delay > INITIAL_BACKOFF) {
    backoffState.delay = INITIAL_BACKOFF;
  }
}

/**
 * Generate cache key from URL and params
 */
function getCacheKey(path, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${path}?${sortedParams}`;
}

/**
 * Fetch from Kalshi API with caching and rate limiting
 *
 * @param {string} path - API path (e.g., 'trade-api/v2/markets')
 * @param {Object} params - Query parameters
 * @param {Object} options - Additional options
 * @param {boolean} options.skipCache - Skip cache and force fresh fetch
 * @returns {Promise<Object>} - API response
 */
export async function fetchKalshiWithCache(path, params = {}, options = {}) {
  const cacheKey = getCacheKey(path, params);

  // Clean up periodically
  if (Math.random() < 0.1) cleanupCache();

  // Check response cache first (unless skipCache)
  if (!options.skipCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  // Check if we're in backoff
  if (isInBackoff()) {
    const remaining = getBackoffRemaining();
    throw new Error(`Rate limited. Retry in ${Math.ceil(remaining / 1000)}s`);
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(cacheKey);
  if (pending && Date.now() - pending.timestamp < DEDUP_WINDOW) {
    return pending.promise;
  }

  // Build URL
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/kalshi?path=${encodeURIComponent(path)}${queryString ? `&${queryString}` : ''}`;

  // Create fetch promise
  const fetchPromise = fetch(url)
    .then(async (response) => {
      // Handle 429 rate limiting
      if (response.status === 429) {
        triggerBackoff();
        throw new Error('Rate limited by Kalshi API');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache successful response
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      // Reset backoff on success
      resetBackoff();

      return data;
    })
    .finally(() => {
      // Remove from pending after resolution
      pendingRequests.delete(cacheKey);
    });

  // Store pending request for deduplication
  pendingRequests.set(cacheKey, {
    promise: fetchPromise,
    timestamp: Date.now(),
  });

  return fetchPromise;
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearKalshiCache() {
  responseCache.clear();
  pendingRequests.clear();
  backoffState = {
    until: 0,
    delay: INITIAL_BACKOFF,
  };
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    cachedResponses: responseCache.size,
    pendingRequests: pendingRequests.size,
    isInBackoff: isInBackoff(),
    backoffRemaining: getBackoffRemaining(),
  };
}

export default {
  fetchKalshiWithCache,
  clearKalshiCache,
  getCacheStats,
  isInBackoff,
  getBackoffRemaining,
};
