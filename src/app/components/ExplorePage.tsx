import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Rocket, MapPin, ChevronRight, ChevronDown, Calendar, ArrowUpDown } from "lucide-react";
import {
  useCountdown, CountdownInline, APIStatusChip, APIAgencyBadge, OrbitTag, FilterChip, SearchBar,
  Navbar, PageShell, EmptyState, SectionLabel, ButtonSecondary, ButtonGhost, DS,
  LoadingState, ErrorState, LaunchCardSkeleton,
} from "./shared";
import { Starfield } from "./Starfield";
import { motion } from "motion/react";
import { useUpcomingLaunches, useAgencies } from "../../services/hooks";
import { getMissionName, getRocketName, getAgencyName, getOrbitAbbrev, getLaunchImage, getAgencyColor, formatLaunchDate, formatLaunchTime } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

type SortMode = "date" | "agency" | "status";

export function ExplorePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedRocket, setSelectedRocket] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [visibleCount, setVisibleCount] = useState(6);
  const [rocketDropdownOpen, setRocketDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setRocketDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch data from API with filters
  const { data, loading, error, refetch } = useUpcomingLaunches({
    search: debouncedSearch || undefined,
    agency: selectedAgency || undefined,
    limit: 40,
  });

  // Fetch agencies for filter chips
  const { data: agencies } = useAgencies();

  // Filter to only future launches
  const launches = useMemo(() => {
    const now = Date.now();
    return (data?.results ?? []).filter(l => new Date(l.net).getTime() > now);
  }, [data]);

  // Client-side filtering for rocket family (API doesn't support exact rocket config filter well)
  const filtered = useMemo(() => {
    let result = [...launches];

    if (selectedRocket) {
      result = result.filter(l =>
        l.rocket.configuration.full_name.toLowerCase().includes(selectedRocket.toLowerCase()) ||
        l.rocket.configuration.family.toLowerCase().includes(selectedRocket.toLowerCase())
      );
    }

    // Client-side sort
    switch (sortMode) {
      case "date":
        result.sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime());
        break;
      case "agency":
        result.sort((a, b) => a.launch_service_provider.name.localeCompare(b.launch_service_provider.name));
        break;
      case "status": {
        const order: Record<number, number> = { 1: 0, 6: 0, 8: 1, 2: 2, 5: 3, 3: 4, 4: 5, 7: 5 };
        result.sort((a, b) => (order[a.status.id] ?? 9) - (order[b.status.id] ?? 9));
        break;
      }
    }

    return result;
  }, [launches, selectedRocket, sortMode]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Get unique rocket families from current results for dropdown
  const rocketFamilies = useMemo(() => {
    const families = new Set<string>();
    launches.forEach(l => {
      const family = l.rocket.configuration.family || l.rocket.configuration.name;
      if (family) families.add(family);
    });
    return Array.from(families).sort();
  }, [launches]);

  // Top agencies for filter chips
  const topAgencies = useMemo(() => {
    if (agencies && agencies.length > 0) {
      return agencies
        .filter(a => a.featured)
        .sort((a, b) => (b.total_launch_count ?? 0) - (a.total_launch_count ?? 0))
        .slice(0, 10);
    }
    // Fallback
    return [
      { name: "SpaceX", id: 121 },
      { name: "National Aeronautics and Space Administration", id: 44 },
      { name: "United Launch Alliance", id: 115 },
      { name: "European Space Agency", id: 27 },
      { name: "Indian Space Research Organization", id: 31 },
      { name: "Rocket Lab", id: 147 },
      { name: "China Aerospace Science and Technology Corporation", id: 88 },
    ];
  }, [agencies]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (!search.trim() || !searchFocused) return [];
    const q = search.toLowerCase();
    const results: { type: string; text: string }[] = [];
    const seen = new Set<string>();
    for (const l of launches) {
      const mission = getMissionName(l);
      const rocket = getRocketName(l);
      const agency = getAgencyName(l);
      if (mission.toLowerCase().includes(q) && !seen.has(mission)) { results.push({ type: "Mission", text: mission }); seen.add(mission); }
      if (rocket.toLowerCase().includes(q) && !seen.has(rocket)) { results.push({ type: "Rocket", text: rocket }); seen.add(rocket); }
      if (agency.toLowerCase().includes(q) && !seen.has(agency)) { results.push({ type: "Agency", text: agency }); seen.add(agency); }
      if (results.length >= 5) break;
    }
    return results;
  }, [search, searchFocused, launches]);

  const clearAll = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedAgency("");
    setSelectedRocket("");
    setVisibleCount(6);
  };
  const hasFilters = search || selectedAgency || selectedRocket;

  if (loading && !data) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 pt-10 pb-20">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl tracking-wide mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>Explore Launches</h1>
            <p className="text-sm" style={{ color: DS.textMuted }}>Discover missions from agencies worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <LaunchCardSkeleton key={i} />)}
          </div>
        </div>
      </PageShell>
    );
  }

  if (error && !data) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <ErrorState message={error} onRetry={refetch} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Starfield />
      <Navbar />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 pt-10 pb-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl tracking-wide mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>Explore Launches</h1>
          <p className="text-sm" style={{ color: DS.textMuted }}>Discover missions from agencies worldwide</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-2xl">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setVisibleCount(6); }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            focused={searchFocused}
            onClear={() => { setSearch(""); setDebouncedSearch(""); }}
          />
          {searchSuggestions.length > 0 && searchFocused && (
            <div className="absolute top-full mt-2 left-0 right-0 rounded-xl border overflow-hidden z-20" style={{ borderColor: `${DS.textHeading}15`, background: `${DS.surface}F2`, backdropFilter: "blur(20px)" }}>
              {searchSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                  onMouseDown={() => { setSearch(s.text); setSearchFocused(false); }}
                >
                  <span className="text-[9px] tracking-widest w-14 shrink-0 uppercase" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>{s.type}</span>
                  <span className="text-sm" style={{ color: DS.textHeading }}>{s.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="space-y-4 mb-6">
          <FilterRow label="Agency">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {topAgencies.map(a => (
                <FilterChip
                  key={a.id}
                  label={a.name.length > 20 ? a.name.split(" ").map(w => w[0]).join("") : a.name}
                  active={selectedAgency === a.name}
                  onClick={() => { setSelectedAgency(prev => prev === a.name ? "" : a.name); setVisibleCount(6); }}
                  dot={getAgencyColor(a.name)}
                />
              ))}
            </div>
          </FilterRow>
          <FilterRow label="Rocket">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setRocketDropdownOpen(!rocketDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all duration-300 border cursor-pointer"
                style={{
                  background: selectedRocket ? `${DS.secondary}15` : DS.glass,
                  borderColor: selectedRocket ? `${DS.secondary}80` : DS.border,
                  color: selectedRocket ? DS.secondary : DS.textBody,
                }}
              >
                <Rocket className="w-3 h-3" />
                {selectedRocket || "All Rockets"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {rocketDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-52 rounded-xl border overflow-hidden z-20 max-h-60 overflow-y-auto" style={{ borderColor: `${DS.textHeading}15`, background: `${DS.surface}F2`, backdropFilter: "blur(20px)" }}>
                  <button className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors" style={{ color: DS.textBody }}
                    onClick={() => { setSelectedRocket(""); setRocketDropdownOpen(false); setVisibleCount(6); }}>All Rockets</button>
                  {rocketFamilies.map(r => (
                    <button key={r} className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors"
                      style={{ color: selectedRocket === r ? DS.secondary : DS.textBody }}
                      onClick={() => { setSelectedRocket(r); setRocketDropdownOpen(false); setVisibleCount(6); }}>{r}</button>
                  ))}
                </div>
              )}
            </div>
          </FilterRow>
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
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
                {mode === "date" ? "Soonest" : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid or Empty */}
        {visible.length === 0 ? (
          <EmptyState onReset={clearAll} />
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
      </div>
    </PageShell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-widest uppercase shrink-0 w-16" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>{label}</span>
      {children}
    </div>
  );
}

function ExploreCard({ launch }: { launch: APILaunch }) {
  const missionName = getMissionName(launch);
  const rocketName = getRocketName(launch);
  const orbit = getOrbitAbbrev(launch);
  const image = getLaunchImage(launch);
  const target = new Date(launch.net);
  const dateStr = formatLaunchDate(launch.net);
  const timeStr = formatLaunchTime(launch.net);

  return (
    <Link to={`/launch/${launch.id}`} className="no-underline block">
      <div
        className="group rounded-xl overflow-hidden border transition-all duration-500 h-full"
        style={{ background: DS.cardGradient, borderColor: DS.border, backdropFilter: "blur(10px)" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = DS.borderHover; e.currentTarget.style.boxShadow = `0 0 30px ${DS.glowSecondary}`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div className="relative h-40 overflow-hidden">
          <img src={image} alt={rocketName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${DS.bg}, transparent)` }} />
          <div className="absolute top-3 right-3"><APIStatusChip status={launch.status} /></div>
          <div className="absolute bottom-3 left-3"><OrbitTag orbit={orbit} /></div>
        </div>
        <div className="p-4 space-y-3">
          <h3 className="text-[15px] truncate" style={{ fontFamily: DS.fontBody, color: DS.textHeading }}>{missionName}</h3>
          <APIAgencyBadge agency={launch.launch_service_provider} />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: DS.textMuted }}>
            <Rocket className="w-3 h-3" /><span>{rocketName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: DS.textMuted }}>
            <Calendar className="w-3 h-3" /><span>{dateStr} • {timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: DS.textMuted }}>
            <MapPin className="w-3 h-3" /><span className="truncate">{launch.pad.location.name}</span>
          </div>
          <div className="pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${DS.border}` }}>
            <CountdownInline target={target} />
            <ChevronRight className="w-4 h-4 group-hover:text-[#4fc3f7] transition-colors" style={{ color: DS.textMuted }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
