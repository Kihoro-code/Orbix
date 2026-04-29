const cache = new Map<string, { data: unknown; expiry: number }>();

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCache<T>(key: string, data: T, ttl = TWELVE_HOURS): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
