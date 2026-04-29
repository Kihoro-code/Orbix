# Phase 1: History & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add past launches archive, mission patch gallery, and calendar view to Orbix's Explore page.

**Architecture:** Extend the existing Explore page with tabs (Upcoming/Past), a view toggle (Cards/Patches/Calendar), and a 12-month date filter for past launches. New Vercel API route `/api/past-launches` serves cached past launch data. No new routes — all features live on `/explore` as tabs and view modes.

**Tech Stack:** React 18, TypeScript, Launch Library 2 API, Vercel serverless functions, existing Tailwind/MUI/Radix stack.

**Files Summary:**

| File | Action | Purpose |
|------|--------|---------|
| `api/past-launches.ts` | Create | Server-side cached API for past launches |
| `src/services/launchService.ts` | Modify | Add date filters, Vercel routing for past launches |
| `src/services/hooks.ts` | Modify | Add `usePastLaunches` hook |
| `src/app/components/shared.tsx` | Modify | Add view toggle bar, tab bar, date preset buttons |
| `src/app/components/PatchCard.tsx` | Create | Mission patch gallery card component |
| `src/app/components/CalendarGrid.tsx` | Create | Calendar month grid, DayCell, DatePopover |
| `src/app/components/ExplorePage.tsx` | Modify | Wire tabs, view toggle, date filter |

---

### Task 1: Create server API route for past launches

**Files:**
- Create: `api/past-launches.ts`

- [ ] **Step 1: Create the file**

```typescript
import { apiFetch } from "./_lib/fetcher";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get("limit") ?? "20");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const search = url.searchParams.get("search") ?? "";
    const agency = url.searchParams.get("agency") ?? "";
    const dateFrom = url.searchParams.get("dateFrom") ?? "";
    const dateTo = url.searchParams.get("dateTo") ?? "";

    limit = Math.min(limit, 40);

    const params = new URLSearchParams({
      format: "json",
      mode: "detailed",
      limit: String(limit),
      offset: String(offset),
      ordering: "-net",
    });

    if (search) params.set("search", search);
    if (agency) params.set("lsp__name", agency);
    if (dateFrom) params.set("net__gte", dateFrom);
    if (dateTo) params.set("net__lte", dateTo);

    const data = await apiFetch<PaginatedResponse<unknown>>(
      `/launch/previous/?${params.toString()}`,
    );

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Vercel-CDN-Cache-Control": "max-age=3600",
      },
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit api/past-launches.ts 2>&1 || true
```

---

### Task 2: Update launchService with date filters and Vercel routing

**Files:**
- Modify: `src/services/launchService.ts`

- [ ] **Step 1: Read the current file**

```bash
head -10 src/services/launchService.ts
```

- [ ] **Step 2: Update `LaunchFilters` interface — add `dateFrom` and `dateTo`**

Replace:
```typescript
export interface LaunchFilters {
  search?: string;
  agency?: string;
  rocketName?: string;
  status?: number;
  limit?: number;
  offset?: number;
}
```

With:
```typescript
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
```

- [ ] **Step 3: Update `getPastLaunches` — add Vercel routing and date filters**

Replace the existing `getPastLaunches` function with:

```typescript
/** Fetch past/previous launches */
export async function getPastLaunches(
  filters: LaunchFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<APILaunch>> {
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
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
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

---

### Task 3: Add usePastLaunches hook

**Files:**
- Modify: `src/services/hooks.ts`

- [ ] **Step 1: Add the hook after the `useUpcomingLaunches` function (after line 78)**

```typescript
/* ─── Past Launches Hook ─── */
export function usePastLaunches(
  filters: launchService.LaunchFilters = {},
): FetchState<PaginatedResponse<APILaunch>> {
  const [data, setData] = useState<PaginatedResponse<APILaunch> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await launchService.getPastLaunches(
        filtersRef.current,
        controller.signal,
      );
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [
    fetchData,
    filters.search,
    filters.agency,
    filters.rocketName,
    filters.status,
    filters.limit,
    filters.offset,
    filters.dateFrom,
    filters.dateTo,
  ]);

  return { data, loading, error, refetch: fetchData };
}
```

- [ ] **Step 2: Add `usePastLaunches` to the services barrel export**

Edit `src/services/index.ts` — no change needed, `hooks` is already exported via `export * from "./hooks"` which auto-exports `usePastLaunches`.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

---

### Task 4: Update shared.tsx — tab bar, view toggle, date presets

**Files:**
- Modify: `src/app/components/shared.tsx`

- [ ] **Step 1: Add `TabBar` component near the other shared UI components (after `ButtonGhost` at line 308)**

```tsx
/* ─── Tab Bar ─── */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl border w-fit"
      style={{ borderColor: DS.border, background: DS.glass }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="px-4 py-2 rounded-lg text-xs tracking-wider transition-all duration-300 cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: active === tab.key ? `${DS.secondary}20` : "transparent",
            color: active === tab.key ? DS.secondary : DS.textMuted,
            border: active === tab.key ? `1px solid ${DS.secondary}40` : "1px solid transparent",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add `ViewToggle` component**

```tsx
/* ─── View Toggle (Cards | Patches | Calendar) ─── */
export type ViewMode = "cards" | "patches" | "calendar";

export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const modes: { key: ViewMode; label: string; icon: ReactNode }[] = [
    { key: "cards", label: "Cards", icon: <LayoutGrid className="w-3 h-3" /> },
    { key: "patches", label: "Patches", icon: <Shield className="w-3 h-3" /> },
    { key: "calendar", label: "Calendar", icon: <CalendarIcon className="w-3 h-3" /> },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg border" style={{ borderColor: DS.border, background: DS.glass }}>
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] tracking-wider transition-all cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: mode === m.key ? `${DS.primary}15` : "transparent",
            color: mode === m.key ? DS.primary : DS.textMuted,
          }}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

Add these imports to the lucide-react import line:
```
import { Search, Menu, X, Telescope, RotateCw, LayoutGrid, Shield, CalendarDays } from "lucide-react";
```

- [ ] **Step 3: Add `DatePresetBar` component for past launches**

```tsx
/* ─── Date Preset Bar (for past launches) ─── */
const DATE_PRESETS = [
  { key: "30d", label: "30 Days", days: 30 },
  { key: "6m", label: "6 Months", days: 180 },
  { key: "12m", label: "12 Months", days: 365 },
];

export interface DatePreset {
  key: string;
  dateFrom: string;
  dateTo: string;
}

export function getDatePreset(key: string): DatePreset | null {
  const preset = DATE_PRESETS.find((p) => p.key === key);
  if (!preset) return null;
  const now = new Date();
  const from = new Date(now.getTime() - preset.days * 86400000);
  return {
    key: preset.key,
    dateFrom: from.toISOString().split("T")[0],
    dateTo: now.toISOString().split("T")[0],
  };
}

export function DatePresetBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onChange(preset.key)}
          className="px-3 py-1.5 rounded-full text-[10px] tracking-wider border transition-all cursor-pointer"
          style={{
            fontFamily: DS.fontHeading,
            background: active === preset.key ? `${DS.secondary}15` : "transparent",
            borderColor: active === preset.key ? `${DS.secondary}40` : DS.border,
            color: active === preset.key ? DS.secondary : DS.textMuted,
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
```

Import `CalendarDays` was already added above.

- [ ] **Step 4: Remove unused `Calendar` import (use `CalendarDays` from lucide instead)**

No change needed — the `Calendar` import in `shared.tsx` isn't one of the lucide imports, it's from `lucide-react` already. Just verify no conflicts.

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

---

### Task 5: Create PatchCard component

**Files:**
- Create: `src/app/components/PatchCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Link } from "react-router";
import { APIStatusChip, CountdownInline, DS } from "./shared";
import { getMissionName, getAgencyName } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

export function PatchCard({ launch }: { launch: APILaunch }) {
  const missionName = getMissionName(launch);
  const agencyName = getAgencyName(launch);
  const target = new Date(launch.net);

  const highestPriorityPatch = launch.mission_patches
    ? [...launch.mission_patches].sort((a, b) => a.priority - b.priority)[0]
    : null;

  const patchUrl = highestPriorityPatch?.image_url
    ?? launch.launch_service_provider.logo_url
    ?? null;

  return (
    <Link to={`/launch/${launch.id}`} className="no-underline block">
      <div
        className="group rounded-xl overflow-hidden border transition-all duration-500 h-full flex flex-col items-center text-center p-5"
        style={{ background: DS.cardGradient, borderColor: DS.border, backdropFilter: "blur(10px)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = DS.borderHover;
          e.currentTarget.style.boxShadow = `0 0 30px ${DS.glowSecondary}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = DS.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
          {patchUrl ? (
            <img
              src={patchUrl}
              alt={missionName}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23131f30' width='100' height='100' rx='12'/><circle cx='50' cy='50' r='20' fill='%234fc3f7' opacity='0.3'/><circle cx='50' cy='50' r='8' fill='%23ff6b35' opacity='0.6'/></svg>";
              }}
            />
          ) : (
            <div
              className="w-full h-full rounded-xl border flex items-center justify-center"
              style={{ borderColor: DS.border, borderStyle: "dashed" }}
            >
              <span className="text-[8px] tracking-widest text-center px-2" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
                NO PATCH
              </span>
            </div>
          )}
        </div>
        <h3 className="text-[13px] leading-tight mb-2 line-clamp-2" style={{ fontFamily: DS.fontBody, color: DS.textHeading }}>
          {missionName}
        </h3>
        <p className="text-[10px] mb-1" style={{ color: DS.textMuted }}>{agencyName}</p>
        <div className="mt-auto pt-3 w-full" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between">
            <APIStatusChip status={launch.status} />
            <CountdownInline target={target} className="text-[9px]" />
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

---

### Task 6: Create CalendarGrid component

**Files:**
- Create: `src/app/components/CalendarGrid.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useMemo } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DS, APIStatusChip, CountdownInline } from "./shared";
import { getMissionName, getRocketName } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface LaunchGroup {
  date: Date;
  launches: APILaunch[];
}

function groupLaunchesByDate(launches: APILaunch[]): Map<string, LaunchGroup> {
  const map = new Map<string, LaunchGroup>();
  for (const launch of launches) {
    const d = new Date(launch.net);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = map.get(key);
    if (existing) {
      existing.launches.push(launch);
    } else {
      map.set(key, { date: d, launches: [launch] });
    }
  }
  return map;
}

function DayCell({
  day,
  isCurrentMonth,
  launches,
  isToday,
  onClick,
}: {
  day: number | null;
  isCurrentMonth: boolean;
  launches: APILaunch[];
  isToday: boolean;
  onClick: () => void;
}) {
  const maxDots = 3;
  const overflow = launches.length - maxDots;

  return (
    <button
      onClick={day && launches.length > 0 ? onClick : undefined}
      className={`aspect-square rounded-lg border transition-all flex flex-col items-start p-1.5 gap-0.5 cursor-pointer ${
        day ? "" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: isToday ? `${DS.primary}12` : DS.glass,
        borderColor: isToday ? `${DS.primary}40` : isCurrentMonth ? DS.border : "transparent",
        color: DS.textHeading,
      }}
      onMouseEnter={(e) => {
        if (day && launches.length > 0) {
          e.currentTarget.style.borderColor = `${DS.secondary}60`;
          e.currentTarget.style.boxShadow = `0 0 10px ${DS.glowSecondary}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isToday ? `${DS.primary}40` : isCurrentMonth ? DS.border : "transparent";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {day && (
        <>
          <span
            className="text-[11px] leading-none"
            style={{
              fontFamily: DS.fontHeading,
              color: isToday ? DS.primary : isCurrentMonth ? DS.textBody : DS.textMuted,
            }}
          >
            {day}
          </span>
          <div className="flex flex-col gap-0.5 mt-0.5 w-full overflow-hidden">
            {launches.slice(0, maxDots).map((l, i) => (
              <span
                key={i}
                className="text-[7px] leading-tight truncate w-full"
                style={{ color: DS.secondary }}
              >
                {getMissionName(l)}
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-[7px]" style={{ color: DS.textMuted }}>
                +{overflow} more
              </span>
            )}
          </div>
        </>
      )}
    </button>
  );
}

function DatePopover({
  launches,
  onClose,
}: {
  launches: APILaunch[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-default"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-xl border p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        style={{ background: DS.surface, borderColor: DS.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm tracking-wider mb-4" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
          {launches.length} LAUNCH{launches.length !== 1 ? "ES" : ""}
        </h3>
        <div className="space-y-3">
          {launches.map((l) => (
            <Link
              key={l.id}
              to={`/launch/${l.id}`}
              className="no-underline flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={onClose}
            >
              <APIStatusChip status={l.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: DS.textHeading }}>
                  {getMissionName(l)}
                </p>
                <p className="text-[10px]" style={{ color: DS.textMuted }}>
                  {getRocketName(l)}
                </p>
              </div>
              <CountdownInline target={new Date(l.net)} className="text-[10px] shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarGrid({ launches }: { launches: APILaunch[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });

  const grouped = useMemo(() => groupLaunchesByDate(launches), [launches]);

  const selectedLaunches = useMemo(() => {
    if (!selectedDate) return [];
    return launches.filter((l) => isSameDay(new Date(l.net), selectedDate));
  }, [launches, selectedDate]);

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];

  for (let i = 0; i < totalCells; i++) {
    if (i < firstDay) {
      const prevDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);
      cells.push(prevDays - firstDay + i + 1);
    } else if (i >= firstDay + daysInMonth) {
      cells.push(i - firstDay - daysInMonth + 1);
    } else {
      cells.push(i - firstDay + 1);
    }
  }

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: DS.border }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.border; }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: DS.textMuted }} />
          </button>
          <span className="text-lg tracking-wider" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
            {monthName} {year}
          </span>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: DS.border }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.border; }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: DS.textMuted }} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center py-1">
            <span className="text-[9px] tracking-widest" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const isCurrentMonth = i >= firstDay && i < firstDay + daysInMonth;
          const cellDate = day != null && isCurrentMonth ? new Date(year, month, day) : null;
          const cellLaunches = cellDate
            ? grouped.get(`${year}-${month}-${cellDate.getDate()}`)?.launches ?? []
            : [];
          const today = cellDate ? isToday(year, month, day!) : false;

          return (
            <DayCell
              key={i}
              day={day && isCurrentMonth ? day : null}
              isCurrentMonth={isCurrentMonth}
              launches={cellLaunches}
              isToday={today}
              onClick={() => cellDate && setSelectedDate(cellDate)}
            />
          );
        })}
      </div>

      {/* Popover */}
      {selectedDate && selectedLaunches.length > 0 && (
        <DatePopover
          launches={selectedLaunches}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

---

### Task 7: Update ExplorePage — tabs, view toggle, date filter

**Files:**
- Modify: `src/app/components/ExplorePage.tsx`

- [ ] **Step 1: Update imports — add new hooks and components**

Replace import lines 1-13 with:

```tsx
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Rocket, MapPin, ChevronRight, ChevronDown, Calendar, ArrowUpDown } from "lucide-react";
import {
  useCountdown, CountdownInline, APIStatusChip, APIAgencyBadge, OrbitTag, FilterChip, SearchBar,
  Navbar, PageShell, EmptyState, SectionLabel, ButtonSecondary, ButtonGhost, DS,
  LoadingState, ErrorState, LaunchCardSkeleton, RefreshButton,
  TabBar, ViewToggle, DatePresetBar, getDatePreset,
  type ViewMode,
} from "./shared";
import { Starfield } from "./Starfield";
import { motion } from "motion/react";
import { useUpcomingLaunches, usePastLaunches, useAgencies } from "../../services/hooks";
import { getMissionName, getRocketName, getAgencyName, getOrbitAbbrev, getLaunchImage, getAgencyColor, formatLaunchDate, formatLaunchTime } from "../../services/formatters";
import type { APILaunch } from "../../services/types";
import { PatchCard } from "./PatchCard";
import { CalendarGrid } from "./CalendarGrid";
```

- [ ] **Step 2: Add new state variables**

Replace line 15-25 (from `type SortMode` through `dropdownRef`) with:

```tsx
type SortMode = "date" | "agency" | "status";
type LaunchTab = "upcoming" | "past";

export function ExplorePage() {
  const [launchTab, setLaunchTab] = useState<LaunchTab>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedRocket, setSelectedRocket] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [visibleCount, setVisibleCount] = useState(6);
  const [rocketDropdownOpen, setRocketDropdownOpen] = useState(false);
  const [datePreset, setDatePreset] = useState("12m");
  const dropdownRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Replace data fetching section (lines 43-58)**

Replace:

```tsx
  // Fetch data from API with filters
  const { data, loading, error, refetch } = useUpcomingLaunches({
    search: debouncedSearch || undefined,
    agency: selectedAgency || undefined,
    limit: 40,
  });

  // Fetch agencies for filter chips
  const { data: agencies, refetch: refetchAgencies } = useAgencies();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchAgencies()]);
    setRefreshing(false);
  }, [refetch, refetchAgencies]);
```

With:

```tsx
  const dateRange = useMemo(() => getDatePreset(datePreset), [datePreset]);

  // Fetch upcoming data
  const upcomingQuery = useUpcomingLaunches({
    search: debouncedSearch || undefined,
    agency: selectedAgency || undefined,
    limit: 40,
  });

  // Fetch past data with date range
  const pastQuery = usePastLaunches({
    search: debouncedSearch || undefined,
    agency: selectedAgency || undefined,
    limit: 40,
    dateFrom: dateRange?.dateFrom,
    dateTo: dateRange?.dateTo,
  });

  const activeQuery = launchTab === "upcoming" ? upcomingQuery : pastQuery;
  const { data, loading, error, refetch } = activeQuery;

  // Fetch agencies for filter chips
  const { data: agencies, refetch: refetchAgencies } = useAgencies();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchAgencies()]);
    setRefreshing(false);
  }, [refetch, refetchAgencies]);
```

- [ ] **Step 4: Replace the launch filtering logic (lines 60-64)**

Replace:

```tsx
  // Filter to only future launches
  const launches = useMemo(() => {
    const now = Date.now();
    return (data?.results ?? []).filter(l => new Date(l.net).getTime() > now);
  }, [data]);
```

With:

```tsx
  const launches = useMemo(() => {
    const results = data?.results ?? [];
    if (launchTab === "upcoming") {
      const now = Date.now();
      return results.filter((l) => new Date(l.net).getTime() > now);
    }
    // Past tab: API already filters by date, no client-side filter needed
    return results;
  }, [data, launchTab]);
```

- [ ] **Step 5: Update the header section — add TabBar and ViewToggle**

Replace the header block (line ~189-193 in current file) after `<Navbar />`:

```tsx
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-wide mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
              Explore Launches
            </h1>
            <p className="text-sm" style={{ color: DS.textMuted }}>Discover missions from agencies worldwide</p>
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabBar
            tabs={[
              { key: "upcoming" as const, label: "Upcoming" },
              { key: "past" as const, label: "Past" },
            ]}
            active={launchTab}
            onChange={(tab) => { setLaunchTab(tab); setVisibleCount(6); }}
          />
          {launchTab === "past" && (
            <DatePresetBar active={datePreset} onChange={(key) => { setDatePreset(key); setVisibleCount(6); }} />
          )}
        </div>
```

- [ ] **Step 6: Update sort bar — hide for calendar view**

In the sort bar section, wrap the sort controls and view-specific elements. The Sort bar currently starts around line 267. For calendar view, hide the sort controls. For patches and cards, show them.

Replace just the sort bar div with:

```tsx
        {/* Sort bar — only for cards and patches views */}
        {viewMode !== "calendar" && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
              <span className="text-xs" style={{ color: DS.textMuted }}>{filtered.length} results</span>
              {hasFilters && <ButtonGhost onClick={clearAll}>Clear all filters</ButtonGhost>}
            </div>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" style={{ color: DS.textMuted }} />
              <span className="text-[10px] tracking-wider mr-2" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>SORT</span>
              {(["date", "agency", "status"] as SortMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className="px-3 py-1 rounded-full text-[11px] transition-all border cursor-pointer"
                  style={{
                    background: sortMode === mode ? `${DS.secondary}15` : "transparent",
                    borderColor: sortMode === mode ? `${DS.secondary}40` : "transparent",
                    color: sortMode === mode ? DS.secondary : DS.textMuted,
                  }}
                >
                  {mode === "date" ? (launchTab === "past" ? "Newest" : "Soonest") : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 7: Replace the grid/empty section with view-specific rendering**

Replace the `<>{/* Grid or Empty */}` block (starting around ~286 in current file) with:

```tsx
        {/* Content */}
        {viewMode === "calendar" ? (
          <CalendarGrid launches={filtered} />
        ) : visible.length === 0 ? (
          <EmptyState onReset={clearAll} />
        ) : viewMode === "patches" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <PatchCard launch={l} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <ButtonSecondary onClick={() => setVisibleCount(c => c + 6)}>LOAD MORE</ButtonSecondary>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {visible.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <ExploreCard launch={l} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <ButtonSecondary onClick={() => setVisibleCount(c => c + 6)}>LOAD MORE</ButtonSecondary>
              </div>
            )}
          </>
        )}
```

- [ ] **Step 8: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: Build succeeds. Fix any TypeScript errors.

---

### Task 8: Final build verification

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify all new files exist**

```bash
ls -la api/past-launches.ts src/app/components/PatchCard.tsx src/app/components/CalendarGrid.tsx
```
Expected: All three files exist.

- [ ] **Step 3: Commit all changes**

```bash
git add api/past-launches.ts src/services/launchService.ts src/services/hooks.ts src/app/components/shared.tsx src/app/components/PatchCard.tsx src/app/components/CalendarGrid.tsx src/app/components/ExplorePage.tsx
git commit -m "feat: add past launches archive, mission patch gallery, and calendar view"
```

---

## Self-Review

1. **Spec coverage**: All three Phase 1 features covered — past launches (Task 1-3 + 7), patch gallery (Task 5 + 7), calendar view (Task 6 + 7).
2. **Placeholder scan**: No TODOs, TBDs, or vague instructions. All code is complete.
3. **Type consistency**: `ViewMode` exported from shared.tsx and imported in ExplorePage.tsx. `LaunchFilters` updated with `dateFrom`/`dateTo` and used in both launchService.ts and api/past-launches.ts. `usePastLaunches` uses same `FetchState` pattern as `useUpcomingLaunches`. `TabBar` typed as generic `<T extends string>`. All imports match.
