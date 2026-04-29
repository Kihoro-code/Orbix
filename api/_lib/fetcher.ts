import { getFromCache, setCache } from "./cache";

const BASE_URL = "https://lldev.thespacedevs.com/2.2.0";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export async function apiFetch<T>(endpoint: string, options?: {
  ttl?: number;
  signal?: AbortSignal;
}): Promise<T> {
  const { ttl = TWELVE_HOURS } = options ?? {};
  const cacheKey = endpoint.replace(/[^a-zA-Z0-9]/g, "_");

  const cached = getFromCache<T>(cacheKey);
  if (cached) return cached;

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  const data: T = await res.json();
  setCache(cacheKey, data, ttl);
  return data;
}
