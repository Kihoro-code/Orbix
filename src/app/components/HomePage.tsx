import { Suspense } from "react";
import { Link } from "react-router";
import { Rocket, MapPin, ChevronRight, Satellite, Clock } from "lucide-react";
import { Starfield } from "./Starfield";
import { OrbitGlobe } from "./OrbitGlobe";
import {
  useCountdown, CountdownRow, CountdownInline,
  APIStatusChip, APIAgencyBadge, OrbitTag,
  LiveBadge, Navbar, PageShell, StatPill, SectionLabel, DS,
  apiStatusDotColor, LaunchCardSkeleton, LoadingState, ErrorState,
} from "./shared";
import { useUpcomingLaunches } from "../../services/hooks";
import { getMissionName, getRocketName, getAgencyName, getAgencyAbbrev, getOrbitAbbrev, getLaunchImage } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

function LaunchCard({ launch }: { launch: APILaunch }) {
  const missionName = getMissionName(launch);
  const rocketName = getRocketName(launch);
  const agencyName = getAgencyName(launch);
  const orbit = getOrbitAbbrev(launch);
  const image = getLaunchImage(launch);
  const target = new Date(launch.net);

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
            <Rocket className="w-3 h-3" />
            <span>{rocketName}</span>
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

function SidebarItem({ launch }: { launch: APILaunch }) {
  const missionName = getMissionName(launch);
  const agencyName = getAgencyName(launch);
  const target = new Date(launch.net);

  return (
    <Link to={`/launch/${launch.id}`} className="no-underline">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: apiStatusDotColor(launch.status) }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: DS.textHeading }}>{missionName}</p>
          <p className="text-[10px]" style={{ color: DS.textMuted }}>{agencyName}</p>
        </div>
        <CountdownInline target={target} className="text-[10px] shrink-0" />
      </div>
    </Link>
  );
}

export function HomePage() {
  const { data, loading, error, refetch } = useUpcomingLaunches({ limit: 20 });
  const allResults = data?.results ?? [];

  // Filter to only show launches that haven't happened yet
  const now = Date.now();
  const launches = allResults.filter(l => new Date(l.net).getTime() > now);
  const featuredLaunch = launches[0];
  const target = featuredLaunch ? new Date(featuredLaunch.net) : new Date();

  // Count stats
  const totalUpcoming = launches.length;
  const next24h = launches.filter(l => {
    const diff = new Date(l.net).getTime() - now;
    return diff > 0 && diff < 86400000;
  }).length;
  const agencies = new Set(launches.map(l => l.launch_service_provider.name));

  if (loading && !data) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <LoadingState message="Fetching upcoming launches..." />
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

  if (!featuredLaunch) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <LoadingState message="No upcoming launches found" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Starfield />
      <Navbar />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6">
        {/* HERO */}
        <section className="py-12 md:py-20">
          <Link to={`/launch/${featuredLaunch.id}`} className="no-underline block">
            <div
              className="relative rounded-2xl overflow-hidden border transition-all duration-700"
              style={{ borderColor: DS.border, background: DS.cardGradient }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${DS.secondary}20`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = DS.border)}
            >
              <div className="absolute inset-0">
                <img src={getLaunchImage(featuredLaunch)} alt="Launch" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 0%, ${DS.bg} 70%)` }} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center py-12 md:py-20 px-6">
                <div className="flex items-center gap-2 mb-6">
                  {featuredLaunch.webcast_live && <LiveBadge />}
                  <span className="text-xs" style={{ color: DS.textMuted }}>Next Launch</span>
                </div>
                <h1 className="text-2xl md:text-4xl mb-1 tracking-wide" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
                  {getMissionName(featuredLaunch)}
                </h1>
                <p className="text-sm mb-1" style={{ fontFamily: DS.fontHeading, color: DS.secondary }}>{getRocketName(featuredLaunch)}</p>
                <div className="flex items-center gap-1.5 text-xs mb-8" style={{ color: DS.textBody }}>
                  <MapPin className="w-3 h-3" />
                  <span>{featuredLaunch.pad.location.name}</span>
                </div>
                <div className="mb-8">
                  <CountdownRow target={target} />
                </div>
                <div className="flex items-center gap-4">
                  <APIStatusChip status={featuredLaunch.status} />
                  <span className="text-xs" style={{ color: DS.textMuted }}>{getAgencyName(featuredLaunch)}</span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* STATS BAR */}
        <section className="flex flex-wrap gap-4 mb-12 justify-center">
          <StatPill icon={<Rocket className="w-4 h-4" style={{ color: DS.secondary }} />} value={String(totalUpcoming)} label="Upcoming Launches" />
          <StatPill icon={<Clock className="w-4 h-4" style={{ color: DS.primary }} />} value={String(next24h)} label="Next 24 Hours" />
          <StatPill icon={<Satellite className="w-4 h-4" style={{ color: DS.success }} />} value={String(agencies.size)} label="Active Agencies" />
        </section>

        {/* 3D ORBITAL TRACKER */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <SectionLabel>ORBITAL TRACKER</SectionLabel>
            <span className="text-xs" style={{ color: DS.textMuted }}>Live satellite trajectories</span>
          </div>
          <Suspense fallback={
            <div className="w-full h-[600px] md:h-[700px] rounded-2xl border flex items-center justify-center" style={{ borderColor: DS.border, background: DS.cardGradient }}>
              <p className="text-sm" style={{ fontFamily: DS.fontHeading, color: DS.textMuted, letterSpacing: "0.1em" }}>Loading 3D Globe...</p>
            </div>
          }>
            <OrbitGlobe launches={launches} />
          </Suspense>
        </section>

        {/* MAIN CONTENT */}
        <section className="flex gap-6 pb-20">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>UPCOMING LAUNCHES</SectionLabel>
              <span className="text-xs" style={{ color: DS.textMuted }}>{totalUpcoming} missions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {launches.slice(0, 6).map((l) => (
                <LaunchCard key={l.id} launch={l} />
              ))}
            </div>
          </div>

          <aside className="hidden xl:block w-72 shrink-0">
            <div
              className="rounded-xl border p-4 sticky top-24"
              style={{ borderColor: DS.border, background: `${DS.surface}80`, backdropFilter: "blur(10px)" }}
            >
              <h3 className="text-xs tracking-[0.2em] mb-4" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>LAUNCHING SOON</h3>
              <div className="space-y-3">
                {launches.slice(0, 5).map((l) => (
                  <SidebarItem key={l.id} launch={l} />
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </PageShell>
  );
}
