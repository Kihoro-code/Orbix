/**
 * LocalStorage cache with TTL support.
 * Implements stale-while-revalidate pattern for API responses.
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
  timestamp: number;
}

const CACHE_PREFIX = "orbix_";

export function setCachedData<T>(key: string, data: T, ttlMs: number): void {
  const item: CacheItem<T> = {
    data,
    expiry: Date.now() + ttlMs,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch {
    // Storage full — clear expired entries and retry
    clearExpiredCache();
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch {
      // Still full — give up silently
    }
  }
}

export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const item: CacheItem<T> = JSON.parse(raw);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

/** Get data even if expired (for stale-while-revalidate) */
export function getStaleCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const item: CacheItem<T> = JSON.parse(raw);
    return item.data;
  } catch {
    return null;
  }
}

export function clearExpiredCache(): void {
  const now = Date.now();
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key)!);
        if (item.expiry && now > item.expiry) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }
}

export function clearAllCache(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}
