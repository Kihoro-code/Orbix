# Orbix Feature Expansion Design

**Date**: 2026-04-30
**Status**: Approved

---

## Understanding Summary

- **What**: 8 new features across 3 phases for Orbix — past launches archive, patch gallery, calendar view, launch/rocket comparison, live countdown hub, livestream embed, and favorites/watchlist
- **Why**: Orbix only shows upcoming launches; users want history, discovery tools, live tracking, and personalization
- **Who**: Space enthusiasts who want both live tracking and historical exploration
- **Key constraints**: All data from Launch Library 2 API, Vercel-hosted, no auth, no custom backend, no new dependencies
- **Non-goals**: User accounts, push notifications, real-time websocket tracking, map features, custom database

---

## Assumptions

| Area | Assumption |
|------|-----------|
| Past launches API | Uses existing `/launch/previous/` endpoint with same caching pattern |
| Calendar | Simple month-grid component, no drag-and-drop, local only |
| Favorites | localStorage, max ~50 launches, no sync |
| Browser notifications | `Notification.requestPermission()` API, no service worker |
| Rocket diagrams | Canvas/SVG rectangles, no 3D/WebGL |

---

## Decision Log

| Decision | Alternatives | Why |
|----------|-------------|-----|
| Tabs on Explore (upcoming/past) | Separate route | Simpler UX, keeps filter logic in one component tree |
| View toggle (cards/patches/calendar) | Separate pages | Instant switching, same data layer, less navigation |
| Compare as modal overlay | New route | Keeps user in context |
| Canvas/SVG rocket diagrams | CSS divs, Three.js | Simplest rendering, no dependencies |
| localStorage for favorites | IndexedDB | Simpler, sufficient for ~50 IDs |
| `/live` as dedicated route | Section on Home | Distinct mental model, auto-refresh isolated |
| 60s auto-refresh for Live | 30s, no auto-refresh | Frequent enough for live, not excessive API calls |

---

## Phase 1: History & Discovery

### 1. Past Launches Archive

- Tab on Explore page switching between Upcoming and Past
- `getPastLaunches()` already exists in `launchService.ts` — extend with date range filter
- New Vercel API route: `/api/past-launches` with 12h caching
- Same card layout but sorted newest-first, success/failure status labels

### 2. Mission Patch Gallery

- View toggle on Explore/Past: Cards | Patches | Calendar
- PatchCard component: square card with `mission_patches[0].image_url`, mission name, agency
- Fallback to agency logo or placeholder when no patch exists

### 3. Calendar View

- View toggle option: Calendar
- CalendarGrid component: month/year navigation, 7-column grid
- DayCell shows up to 3 launch dots with abbreviated mission names
- DatePopover flyout with full launch list for a clicked day

---

## Phase 2: Comparison & Visualization

### 4. Launch Comparison Tool

- Checkbox on each Explore/Past card for selection
- Floating dock bar at bottom when 1+ selected, max 2: "Compare (N/2)"
- Modal overlay with side-by-side columns: mission, rocket, agency, date, spec cards

### 5. Rocket Comparison Visual

- Canvas/SVG scaled silhouettes of rockets side by side
- Uses `length`, `diameter`, `max_stage` from rocket configuration
- Grouped by agency color
- Standalone section on Launch Detail page and in Comparison modal

---

## Phase 3: Live & Personal

### 6. Live Countdown Hub

- New route: `/live`
- Top section: all status=6 (In Flight) launches with prominent live badge
- Below: today's launches (net date matches today), tomorrow's optional
- Auto-refresh every 60 seconds using the existing `/api/launches` route

### 7. Launch Livestream Embed

- On Launch Detail page: if `vidURLs` has YouTube/Vimeo entries, embed iframe
- Highest-priority video near hero section
- "Watch Live" badge when `webcast_live === true`

### 8. Favorites / Watchlist

- Star icon on every launch card (Explore, Past, Detail, Live)
- localStorage storage: `{ id: string, savedAt: number }[]`
- "My Launches" tab on Explore page filtering to favorites
- Navbar star icon link
- Graceful fallback for removed/deleted launches

---

## Files Changed (per phase)

### Phase 1
| File | Change |
|------|--------|
| `api/past-launches.ts` | New API route for past launches |
| `src/app/components/ExplorePage.tsx` | Add tabs (upcoming/past), view toggle, date filter |
| `src/app/components/PatchCard.tsx` | New component for patch gallery view |
| `src/app/components/CalendarGrid.tsx` | New calendar view component |
| `src/app/components/shared.tsx` | Add new shared components (DatePopover, etc.) |
| `src/services/launchService.ts` | Update `getPastLaunches` for Vercel routing |

### Phase 2
| File | Change |
|------|--------|
| `src/app/components/CompareModal.tsx` | New comparison modal |
| `src/app/components/RocketDiagram.tsx` | New rocket scale diagram (canvas/SVG) |
| `src/app/components/shared.tsx` | Add compare checkbox to cards |
| `src/app/components/LaunchDetail.tsx` | Add RocketDiagram section |

### Phase 3
| File | Change |
|------|--------|
| `src/app/components/LivePage.tsx` | New live countdown hub page |
| `src/app/routes.ts` | Add `/live` route |
| `src/app/components/LaunchDetail.tsx` | Add livestream embed |
| `src/app/components/shared.tsx` | Add favorite star icon, Navbar link |
| `src/services/favorites.ts` | New service: localStorage favorites CRUD |
| `src/app/components/ExplorePage.tsx` | Add "My Launches" filter tab |

---

## Self-Review

- **Placeholders**: None
- **Consistency**: All features extend existing architecture, no contradictions
- **Scope**: 8 features across 3 phases, each independently deliverable
- **Ambiguity**: Calendar date range defaults to 12-month preset; patch fallback explicitly defined; favorites max 50 with graceful removal
