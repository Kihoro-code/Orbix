/**
 * Launch-specific API calls for Launch Library 2.
 * Provides typed functions for all launch data needs.
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
}

/** Fetch upcoming launches (Home Dashboard + Explore) */
export async function getUpcomingLaunches(
  filters: LaunchFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<APILaunch>> {
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
  const params = new URLSearchParams({
    format: "json",
    mode: "detailed",
    limit: String(filters.limit ?? 20),
    offset: String(filters.offset ?? 0),
    ordering: "-net",
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.agency) params.set("lsp__name", filters.agency);

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
  return fetchAPI<PaginatedResponse<APIAgency>>(
    `/agencies/?format=json&featured=true&limit=30`,
    { signal, ttl: 30 * 60 * 1000 }, // Cache agencies for 30 min
  );
}
