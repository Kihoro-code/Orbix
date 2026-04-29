import { useMemo } from "react";
import { Link } from "react-router";
import { Rocket, MapPin, Satellite, Radio } from "lucide-react";
import {
  CountdownRow, CountdownInline, APIStatusChip, APIAgencyBadge, OrbitTag,
  LiveBadge, Navbar, PageShell, GlassCard, SectionLabel, StatPill, DS,
  LoadingState, ErrorState,
} from "./shared";
import { Starfield } from "./Starfield";
import { useUpcomingLaunches } from "../../services/hooks";
import {
  getMissionName, getRocketName, getAgencyName, getOrbitAbbrev, getLaunchImage,
} from "../../services/formatters";
import type { APILaunch } from "../../services/types";

function LiveLaunchCard({ launch }: { launch: APILaunch }) {
  const missionName = getMissionName(launch);
  const rocketName = getRocketName(launch);
  const agencyName = getAgencyName(launch);
  const orbit = getOrbitAbbrev(launch);
  const image = getLaunchImage(launch);
  const target = new Date(launch.net);

  return (
    <Link to={`/launch/${launch.id}`} className="no-underline block">
      <div
        className="rounded-xl overflow-hidden border transition-all duration-500"
        style={{ borderColor: launch.status.id === 6 ? `${DS.secondary}60` : DS.border, background: DS.cardGradient }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.borderHover; e.currentTarget.style.boxShadow = `0 0 30px ${DS.glowSecondary}`; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = launch.status.id === 6 ? `${DS.secondary}60` : DS.border; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div className="relative h-48 overflow-hidden">
          <img src={image} alt={rocketName} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${DS.bg} 0%, transparent 50%)` }} />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <APIStatusChip status={launch.status} />
            {launch.status.id === 6 && <LiveBadge />}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-xl mb-1" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>{missionName}</h2>
            <div className="flex items-center gap-3 text-xs" style={{ color: DS.textBody }}>
              <span>{rocketName}</span>
              <span>•</span>
              <span>{agencyName}</span>
              {orbit !== "N/A" && <><span>•</span><OrbitTag orbit={orbit} /></>}
            </div>
          </div>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: DS.textMuted }}>
            <MapPin className="w-3 h-3" />
            <span>{launch.pad.location.name}</span>
          </div>
          <CountdownInline target={target} />
        </div>
      </div>
    </Link>
  );
}

export function LivePage() {
  const { data, loading, error, refetch } = useUpcomingLaunches({ limit: 40 }, 60 * 1000);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);

  const { inFlight, today, tomorrow, upcoming } = useMemo(() => {
    const results = (data?.results ?? []).filter((l) => new Date(l.net).getTime() > now.getTime() - 3600000);
    return {
      inFlight: results.filter((l) => l.status.id === 6),
      today: results.filter((l) => {
        const t = new Date(l.net);
        return t >= todayStart && t < todayEnd && l.status.id !== 6;
      }),
      tomorrow: results.filter((l) => {
        const t = new Date(l.net);
        return t >= todayEnd && t < tomorrowEnd;
      }),
      upcoming: results.filter((l) => {
        const t = new Date(l.net);
        return t >= tomorrowEnd;
      }),
    };
  }, [data, now, todayStart, todayEnd, tomorrowEnd]);

  if (loading && !data) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <LoadingState message="Loading live feed..." />
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
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl tracking-wide mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>Live</h1>
          <p className="text-sm" style={{ color: DS.textMuted }}>Real-time launch tracking and today's missions</p>
        </div>

        {/* Stats */}
        <section className="flex flex-wrap gap-4 mb-10">
          <StatPill icon={<Radio className="w-4 h-4" style={{ color: DS.secondary }} />} value={String(inFlight.length)} label="In Flight" />
          <StatPill icon={<Rocket className="w-4 h-4" style={{ color: DS.primary }} />} value={String(today.length)} label="Today" />
          <StatPill icon={<Satellite className="w-4 h-4" style={{ color: DS.success }} />} value={String(tomorrow.length)} label="Tomorrow" />
        </section>

        {/* In Flight */}
        {inFlight.length > 0 && (
          <section className="mb-12">
            <SectionLabel>IN FLIGHT</SectionLabel>
            <p className="text-xs mt-2 mb-6" style={{ color: DS.textMuted }}>Live missions currently in progress</p>
            <div className="space-y-6">
              {inFlight.map((l) => <LiveLaunchCard key={l.id} launch={l} />)}
            </div>
          </section>
        )}

        {/* Today */}
        <section className="mb-12">
          <SectionLabel>TODAY</SectionLabel>
          <p className="text-xs mt-2 mb-6" style={{ color: DS.textMuted }}>
            {today.length === 0 ? "No launches scheduled for today" : "Missions launching in the next 24 hours"}
          </p>
          {today.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {today.map((l) => <LiveLaunchCard key={l.id} launch={l} />)}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border" style={{ borderColor: DS.border }}>
              <p className="text-sm" style={{ color: DS.textMuted }}>No launches today — check back tomorrow</p>
            </div>
          )}
        </section>

        {/* Tomorrow */}
        {tomorrow.length > 0 && (
          <section className="mb-12">
            <SectionLabel>TOMORROW</SectionLabel>
            <p className="text-xs mt-2 mb-6" style={{ color: DS.textMuted }}>Missions launching tomorrow</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tomorrow.map((l) => <LiveLaunchCard key={l.id} launch={l} />)}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
