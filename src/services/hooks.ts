/**
 * React hooks for fetching launch data from Launch Library 2 API.
 * Handles loading, error states, polling, and cleanup.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import * as launchService from "./launchService";
import type { APILaunch, APIAgency, PaginatedResponse } from "./types";

/** Default polling interval: 5 minutes */
const POLL_INTERVAL = 5 * 60 * 1000;

/* ─── Generic fetch state ─── */
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/* ─── Upcoming Launches Hook ─── */
export function useUpcomingLaunches(
  filters: launchService.LaunchFilters = {},
  pollInterval = POLL_INTERVAL,
): FetchState<PaginatedResponse<APILaunch>> {
  const [data, setData] = useState<PaginatedResponse<APILaunch> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchData = useCallback(async (isPolling = false) => {
    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!isPolling) setLoading(true);
    setError(null);

    try {
      const result = await launchService.getUpcomingLaunches(
        filtersRef.current,
        controller.signal,
      );
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up polling
    const interval = setInterval(() => fetchData(true), pollInterval);

    return () => {
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [
    fetchData,
    pollInterval,
    filters.search,
    filters.agency,
    filters.rocketName,
    filters.status,
    filters.limit,
    filters.offset,
  ]);

  return { data, loading, error, refetch: () => fetchData() };
}

/* ─── Single Launch Detail Hook ─── */
export function useLaunchDetail(
  launchId: string | undefined,
): FetchState<APILaunch> {
  const [data, setData] = useState<APILaunch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!launchId) {
      setError("No launch ID provided");
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await launchService.getLaunchById(launchId, controller.signal);
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [launchId]);

  useEffect(() => {
    fetchData();
    // Poll every 2 minutes for detail page (more frequent for live tracking)
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => {
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/* ─── Agencies Hook ─── */
export function useAgencies(): FetchState<APIAgency[]> {
  const [data, setData] = useState<APIAgency[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await launchService.getAgencies();
      setData(result.results);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
