/**
 * Lightweight in-memory cache with stale-while-revalidate semantics.
 *
 * Used as a client-side caching layer on top of the API fetch layer.
 * Data is served from cache instantly while a background revalidation
 * fetches fresh data. This eliminates blank loading states on every
 * navigation while still surfacing fresh data when available.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Default stale window in milliseconds (30 seconds). */
const DEFAULT_MAX_AGE = 30_000;

/**
 * Read a cached value. Returns `{ value, stale }`:
 *  - `value` is the cached data (may be stale).
 *  - `stale` is true when the entry is older than `maxAge`.
 * Returns `null` when there is no cached entry at all.
 */
export function getCache<T>(key: string, maxAge = DEFAULT_MAX_AGE): { value: T; stale: boolean } | null {
  const entry = store.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  return { value: entry.data as T, stale: age > maxAge };
}

/** Store a value in the cache with the current timestamp. */
export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

/** Remove a cached entry (e.g. on logout or manual invalidation). */
export function invalidateCache(key?: string): void {
  if (key === undefined) {
    store.clear();
  } else {
    store.delete(key);
  }
}

/** Build a cache key from a path + optional query params. */
export function cacheKey(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}