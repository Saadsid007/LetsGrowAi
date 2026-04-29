/**
 * Simple In-Memory TTL Cache
 * Used for high-frequency dashboard endpoints.
 */

const cacheStore = new Map();

/**
 * Get item from cache
 * @param {string} key 
 * @returns {any|null} Data if fresh, null if missing or expired
 */
export function getCache(key) {
  const item = cacheStore.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

/**
 * Set item in cache
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlMs Time to live in milliseconds (default 5 minutes)
 */
export function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

/**
 * Clear specific key from cache
 */
export function clearCache(key) {
  cacheStore.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  cacheStore.clear();
}
