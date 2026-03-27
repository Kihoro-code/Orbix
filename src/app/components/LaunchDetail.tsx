import { useParams, Link } from "react-router";
import { MapPin, Ruler, Zap, Layers, Package, Cloud, Clock, ChevronRight, ArrowLeft, Rocket, ExternalLink } from "lucide-react";
import {
  useCountdown, CountdownRow, CountdownInline,
  APIStatusChip, APIAgencyBadge, OrbitTag,
  LiveBadge, Navbar, PageShell, GlassCard, QuickFact, DS, ButtonSecondary,
  LoadingState, ErrorState,
} from "./shared";
import { Starfield } from "./Starfield";
import { useLaunchDetail, useUpcomingLaunches } from "../../services/hooks";
import {
  getMissionName, getRocketName, getAgencyName, getOrbitAbbrev, getOrbitName,
  getLaunchImage, getWeatherStatus, formatWindowTime, formatTimelineTime,
  formatLength, formatThrust, formatMass, formatCapacity,
} from "../../services/formatters";
import type { APILaunch } from "../../services/types";

export function LaunchDetail() {
  const { id } = useParams();
  const { data: launch, loading, error, refetch } = useLaunchDetail(id);
  // Fetch related launches
  const { data: upcomingData } = useUpcomingLaunches({ limit: 10 });

  if (loading && !launch) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <LoadingState message="Loading mission data..." />
      </PageShell>
    );
  }

  if (error && !launch) {
    return (
      <PageShell>
        <Starfield />
        <Navbar />
        <ErrorState message={error} onRetry={refetch} />
      </PageShell>
    );
  }

  if (!launch) {
    return (
      <PageShell>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-xl mb-4" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>Mission Not Found</p>
          <Link to="/" className="text-sm hover:underline no-underline" style={{ color: DS.secondary }}>Return to Orbix</Link>
        </div>
      </PageShell>
    );
  }

  const missionName = getMissionName(launch);
  const rocketName = getRocketName(launch);
  const agencyName = getAgencyName(launch);
  const orbit = getOrbitAbbrev(launch);
  const orbitName = getOrbitName(launch);
  const image = getLaunchImage(launch);
  const target = new Date(launch.net);
  const rocketConfig = launch.rocket.configuration;

  // Build related launches from API data
  const allLaunches = upcomingData?.results ?? [];
  const relatedLaunches = allLaunches.filter(l =>
    l.id !== launch.id && (
      l.launch_service_provider.id === launch.launch_service_provider.id ||
      l.rocket.configuration.family === launch.rocket.configuration.family
    )
  );
  const allRelated = relatedLaunches.length > 0
    ? relatedLaunches.slice(0, 6)
    : allLaunches.filter(l => l.id !== launch.id).slice(0, 4);

  // Timeline events from API
  const timeline = launch.timeline?.map(event => ({
    time: formatTimelineTime(event.relative_time),
    event: event.type.abbrev,
    description: event.type.description,
  })) ?? [];

  // Mission objectives from description
  const description = launch.mission?.description ?? "No mission description available.";

  return (
    <PageShell>
      <Starfield />
      <Navbar />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs pt-6 pb-4" style={{ color: DS.textMuted }}>
          <Link to="/" className="hover:text-[#4fc3f7] transition-colors no-underline" style={{ color: DS.textMuted }}>Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/explore" className="hover:text-[#4fc3f7] transition-colors no-underline" style={{ color: DS.textMuted }}>Explore</Link>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: DS.textBody }}>{missionName}</span>
        </div>

        {/* Hero Banner */}
        <section className="relative rounded-2xl overflow-hidden border mb-10" style={{ borderColor: DS.border }}>
          <div className="absolute inset-0">
            <img src={image} alt={rocketName} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${DS.bg} 0%, rgba(10,10,15,0.6) 40%, rgba(10,10,15,0.3) 100%)` }} />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center py-14 md:py-24 px-6">
            <div className="flex items-center gap-3 mb-4">
              <APIStatusChip status={launch.status} />
              {launch.webcast_live && <LiveBadge />}
            </div>
            <h1 className="text-3xl md:text-5xl mb-2 tracking-wide" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
              {missionName}
            </h1>
            <div className="flex items-center gap-3 mb-2">
              <APIAgencyBadge agency={launch.launch_service_provider} size="md" />
              <span style={{ color: DS.textMuted }}>•</span>
              <span className="text-sm" style={{ fontFamily: DS.fontHeading, color: DS.secondary }}>{rocketName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs mb-8" style={{ color: DS.textBody }}>
              <MapPin className="w-3 h-3" />
              <span>{launch.pad.name}, {launch.pad.location.name}</span>
            </div>
            <CountdownRow target={target} size="md" />
          </div>
        </section>

        {/* Two-column content */}
        <section className="flex flex-col lg:flex-row gap-8 mb-16">
          {/* Left Column */}
          <div className="lg:w-[60%] space-y-8">
            <GlassCard title="MISSION OVERVIEW">
              <p className="text-sm leading-relaxed mb-6" style={{ color: DS.textBody }}>{description}</p>
              <div className="flex items-center gap-2 mb-4">
                <OrbitTag orbit={orbit} />
                <span className="text-xs" style={{ color: DS.textMuted }}>{orbitName}</span>
              </div>
              {launch.mission?.type && (
                <div className="mb-4">
                  <h4 className="text-xs tracking-[0.2em] mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>MISSION TYPE</h4>
                  <p className="text-sm" style={{ color: DS.textBody }}>{launch.mission.type}</p>
                </div>
              )}
              {launch.program && launch.program.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs tracking-[0.2em] mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>PROGRAM</h4>
                  {launch.program.map(p => (
                    <p key={p.id} className="text-sm" style={{ color: DS.textBody }}>{p.name} — {p.description?.substring(0, 200)}{(p.description?.length ?? 0) > 200 ? "..." : ""}</p>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Timeline */}
            {timeline.length > 0 && (
              <GlassCard title="MISSION TIMELINE">
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] rounded-full" style={{ background: `linear-gradient(to bottom, ${DS.secondary}, ${DS.secondary}15)` }} />
                  <div className="space-y-6">
                    {timeline.map((item, i) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div
                          className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: DS.secondary, background: DS.surface, boxShadow: `0 0 10px ${DS.glowSecondary}` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DS.secondary }} />
                        </div>
                        <div>
                          <span className="text-[11px] tracking-wider" style={{ fontFamily: DS.fontHeading, color: DS.primary }}>{item.time}</span>
                          <p className="text-sm font-medium mt-0.5" style={{ color: DS.textHeading }}>{item.event}</p>
                          <p className="text-xs mt-0.5" style={{ color: DS.textMuted }}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Live Updates */}
            {launch.updates && launch.updates.length > 0 && (
              <GlassCard title="LIVE UPDATES">
                <div className="space-y-4">
                  {launch.updates.slice(0, 5).map(update => (
                    <div key={update.id} className="border-l-2 pl-4 py-1" style={{ borderColor: `${DS.secondary}40` }}>
                      <p className="text-sm" style={{ color: DS.textBody }}>{update.comment}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: DS.textMuted }}>{update.created_by}</span>
                        <span className="text-[10px]" style={{ color: DS.textMuted }}>•</span>
                        <span className="text-[10px]" style={{ color: DS.textMuted }}>
                          {new Date(update.created_on).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {update.info_url && (
                          <a href={update.info_url} target="_blank" rel="noopener noreferrer" className="no-underline">
                            <ExternalLink className="w-3 h-3" style={{ color: DS.secondary }} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:w-[40%] space-y-8">
            <GlassCard title="QUICK FACTS">
              <div className="space-y-4">
                <QuickFact icon={<MapPin className="w-4 h-4" />} label="Launch Site" value={`${launch.pad.name}, ${launch.pad.location.name}`} />
                <QuickFact icon={<Clock className="w-4 h-4" />} label="Window Open" value={formatWindowTime(launch.window_start)} />
                <QuickFact icon={<Clock className="w-4 h-4" />} label="Window Close" value={formatWindowTime(launch.window_end)} />
                <div className="pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <QuickFact icon={<Cloud className="w-4 h-4" />} label="Weather" value={getWeatherStatus(launch)} />
                </div>
                {launch.holdreason && (
                  <div className="pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <QuickFact icon={<Clock className="w-4 h-4" />} label="Hold Reason" value={launch.holdreason} />
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard title="ROCKET SPECIFICATIONS">
              <div className="mb-4">
                <span className="text-sm" style={{ fontFamily: DS.fontHeading, color: DS.secondary }}>{rocketName}</span>
                {rocketConfig.description && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: DS.textMuted }}>
                    {rocketConfig.description.substring(0, 200)}{rocketConfig.description.length > 200 ? "..." : ""}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SpecCard icon={<Ruler className="w-5 h-5" />} label="Height" value={formatLength(rocketConfig.length)} />
                <SpecCard icon={<Zap className="w-5 h-5" />} label="Thrust" value={formatThrust(rocketConfig.to_thrust)} />
                <SpecCard icon={<Layers className="w-5 h-5" />} label="Stages" value={String(rocketConfig.max_stage ?? "N/A")} />
                <SpecCard icon={<Package className="w-5 h-5" />} label="LEO Capacity" value={formatCapacity(rocketConfig.leo_capacity)} />
              </div>
              {rocketConfig.max_stage && (
                <div className="mt-6 flex items-end justify-center gap-1 h-32 pt-6" style={{ borderTop: `1px solid ${DS.border}` }}>
                  {Array.from({ length: rocketConfig.max_stage }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className="rounded-t-lg border"
                        style={{
                          width: `${28 - i * 6}px`,
                          height: `${50 + (rocketConfig.max_stage! - 1 - i) * 30}px`,
                          background: `linear-gradient(to top, ${DS.secondary}20, ${DS.secondary}08)`,
                          borderColor: `${DS.secondary}20`,
                          boxShadow: `0 0 10px ${DS.secondary}10`,
                        }}
                      />
                      <span className="text-[8px] mt-1" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>S{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Booster info */}
            {launch.rocket.launcher_stage && launch.rocket.launcher_stage.length > 0 && (
              <GlassCard title="BOOSTER INFO">
                {launch.rocket.launcher_stage.map((stage, i) => (
                  <div key={i} className="space-y-2">
                    {stage.launcher && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: DS.textMuted }}>Serial</span>
                          <span className="text-sm" style={{ color: DS.textHeading }}>{stage.launcher.serial_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: DS.textMuted }}>Flight #</span>
                          <span className="text-sm" style={{ color: DS.textHeading }}>{stage.launcher.flights}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: DS.textMuted }}>Landings</span>
                          <span className="text-sm" style={{ color: DS.textHeading }}>{stage.launcher.successful_landings}/{stage.launcher.attempted_landings}</span>
                        </div>
                      </>
                    )}
                    {stage.landing && (
                      <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: DS.textMuted }}>Landing</span>
                          <span className="text-sm" style={{ color: stage.landing.success ? DS.success : DS.error }}>
                            {stage.landing.success ? "Success" : stage.landing.attempt ? "Failed" : "Not attempted"}
                          </span>
                        </div>
                        {stage.landing.location && (
                          <div className="flex justify-between mt-1">
                            <span className="text-xs" style={{ color: DS.textMuted }}>Location</span>
                            <span className="text-xs" style={{ color: DS.textBody }}>{stage.landing.location.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Video links */}
            {launch.vidURLs && launch.vidURLs.length > 0 && (
              <GlassCard title="WATCH">
                <div className="space-y-3">
                  {launch.vidURLs.slice(0, 3).map((vid, i) => (
                    <a
                      key={i}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors no-underline"
                    >
                      {vid.feature_image && (
                        <img src={vid.feature_image} alt={vid.title} className="w-16 h-10 rounded object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: DS.textHeading }}>{vid.title}</p>
                        <p className="text-[10px]" style={{ color: DS.textMuted }}>{vid.source} • {vid.type?.name}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 shrink-0" style={{ color: DS.secondary }} />
                    </a>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Related Launches */}
        {allRelated.length > 0 && (
          <section className="pb-20">
            <h2 className="text-xs tracking-[0.2em] mb-6" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>RELATED LAUNCHES</h2>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: `${DS.secondary}50 transparent` }}>
              {allRelated.map(l => (
                <RelatedCard key={l.id} launch={l} />
              ))}
            </div>
          </section>
        )}

        <div className="pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs transition-colors no-underline" style={{ color: DS.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = DS.secondary)}
            onMouseLeave={e => (e.currentTarget.style.color = DS.textMuted)}
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to all launches</span>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 flex flex-col items-center text-center gap-2" style={{ borderColor: DS.border, background: `${DS.bg}80` }}>
      <div style={{ color: DS.secondary }}>{icon}</div>
      <span className="text-[9px] tracking-wider uppercase" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>{label}</span>
      <span className="text-sm" style={{ color: DS.textHeading }}>{value}</span>
    </div>
  );
}

function RelatedCard({ launch }: { launch: APILaunch }) {
  const target = new Date(launch.net);
  return (
    <Link to={`/launch/${launch.id}`} className="no-underline shrink-0 w-64 group">
      <div
        className="rounded-xl overflow-hidden border transition-all duration-500"
        style={{ borderColor: DS.border, background: DS.cardGradient }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = DS.borderHover; e.currentTarget.style.boxShadow = `0 0 20px ${DS.glowSecondary}`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div className="relative h-28 overflow-hidden">
          <img src={getLaunchImage(launch)} alt={getRocketName(launch)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${DS.bg}, transparent)` }} />
          <div className="absolute top-2 right-2"><APIStatusChip status={launch.status} /></div>
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-sm truncate" style={{ color: DS.textHeading }}>{getMissionName(launch)}</p>
          <div className="flex items-center gap-1.5">
            <Rocket className="w-3 h-3" style={{ color: DS.textMuted }} />
            <span className="text-xs truncate" style={{ color: DS.textMuted }}>{getRocketName(launch)}</span>
          </div>
          <CountdownInline target={target} className="text-[10px] block" />
        </div>
      </div>
    </Link>
  );
}
