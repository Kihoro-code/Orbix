/**
 * Launch-specific API calls for Launch Library 2.
 * Provides typed functions for all launch data needs.
 * In Vercel production, list endpoints are proxied through /api/ routes
 * for server-side caching. Individual launch detail goes direct with localStorage cache.
 */

import { fetchAPI } from "./api";
import type { APILaunch, APIAgency, PaginatedResponse } from "./types";

export interface LaunchFilters {
  search?: string;
  agency?: string;
  rocketName?: string;
  status?: number;
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

function isVercelProd(): boolean {
  return typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
}

/** Fetch upcoming launches (Home Dashboard + Explore) */
export async function getUpcomingLaunches(
  filters: LaunchFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<APILaunch>> {
  if (isVercelProd()) {
    const params = new URLSearchParams({
      limit: String(filters.limit ?? 20),
      offset: String(filters.offset ?? 0),
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.agency) params.set("agency", filters.agency);
    if (filters.rocketName) params.set("rocketName", filters.rocketName);
    if (filters.status) params.set("status", String(filters.status));

    const res = await fetch(`/api/launches?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  const params = new URLSearchParams({
    format: "json",
    mode: "detailed",
    limit: String(filters.limit ?? 20),
    offset: String(filters.offset ?? 0),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.agency) params.set("lsp__name", filters.agency);
  if (filters.rocketName) params.set("rocket__configuration__name", filters.rocketName);
  if (filters.status) params.set("status", String(filters.status));

  return fetchAPI<PaginatedResponse<APILaunch>>(
    `/launch/upcoming/?${params.toString()}`,
    { signal },
  );
}

/** Fetch past/previous launches (for Explore "Completed" filter) */
export async function getPastLaunches(
  filters: LaunchFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<APILaunch>> {
  if (isVercelProd()) {
    const params = new URLSearchParams({
      limit: String(filters.limit ?? 20),
      offset: String(filters.offset ?? 0),
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.agency) params.set("agency", filters.agency);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);

    const res = await fetch(`/api/past-launches?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  const params = new URLSearchParams({
    format: "json",
    mode: "detailed",
    limit: String(filters.limit ?? 20),
    offset: String(filters.offset ?? 0),
    ordering: "-net",
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.agency) params.set("lsp__name", filters.agency);
  if (filters.dateFrom) params.set("net__gte", filters.dateFrom);
  if (filters.dateTo) params.set("net__lte", filters.dateTo);

  return fetchAPI<PaginatedResponse<APILaunch>>(
    `/launch/previous/?${params.toString()}`,
    { signal },
  );
}

/** Fetch a single launch by ID (Launch Detail Page) */
export async function getLaunchById(
  launchId: string,
  signal?: AbortSignal,
): Promise<APILaunch> {
  return fetchAPI<APILaunch>(
    `/launch/${launchId}/?format=json&mode=detailed`,
    { signal },
  );
}

/** Fetch featured agencies (for filter dropdowns) */
export async function getAgencies(
  signal?: AbortSignal,
): Promise<PaginatedResponse<APIAgency>> {
  if (isVercelProd()) {
    const res = await fetch("/api/agencies", { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  return fetchAPI<PaginatedResponse<APIAgency>>(
    `/agencies/?format=json&featured=true&limit=30`,
    { signal, ttl: 30 * 60 * 1000 },
  );
}
