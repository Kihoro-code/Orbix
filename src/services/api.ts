/**
 * Base API wrapper for Launch Library 2 (v2.2.0)
 * Handles fetching, caching, and error recovery.
 */

import { getCachedData, getStaleCachedData, setCachedData } from "./cache";

// Dev endpoint — no rate limits (production: ll.thespacedevs.com has 15 req/hr limit)
const BASE_URL = "https://lldev.thespacedevs.com/2.2.0";

/** Default cache TTL: 5 minutes */
const DEFAULT_TTL = 5 * 60 * 1000;

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface FetchOptions {
  /** Force fresh fetch, ignoring cache */
  forceRefresh?: boolean;
  /** Custom TTL in milliseconds */
  ttl?: number;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Fetch from the Launch Library 2 API with caching.
 * Implements stale-while-revalidate: returns cached data on network error.
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { forceRefresh = false, ttl = DEFAULT_TTL, signal } = options;

  // Generate cache key from the full endpoint path
  const cacheKey = endpoint.replace(/[^a-zA-Z0-9]/g, "_");

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      // Rate limited
      if (response.status === 429) {
        const stale = getStaleCachedData<T>(cacheKey);
        if (stale) return stale;
        throw new APIError(429, "Rate limited by Launch Library 2 API. Please wait a few minutes.");
      }
      throw new APIError(response.status, `API Error: ${response.status} ${response.statusText}`);
    }

    const data: T = await response.json();
    setCachedData(cacheKey, data, ttl);
    return data;
  } catch (error) {
    // On network error, fall back to stale cache
    if (error instanceof APIError) throw error;

    // AbortError — don't fallback, just rethrow
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    const stale = getStaleCachedData<T>(cacheKey);
    if (stale) return stale;

    throw new APIError(0, `Network error: ${(error as Error).message}`);
  }
}
