import { Rocket, MapPin, Calendar, Ruler, Zap, Layers, Package } from "lucide-react";
import type { APILaunch } from "../../services/types";
import {
  DS, APIStatusChip, APIAgencyBadge, OrbitTag, CountdownInline,
} from "./shared";
import {
  getMissionName, getRocketName, getAgencyName, getOrbitAbbrev,
  getLaunchImage, formatLaunchDate, formatLaunchTime, LAUNCH_FALLBACK_IMAGE,
} from "../../services/formatters";
import { RocketDiagram } from "./RocketDiagram";

function SpecRow({ icon, label, a, b }: {
  icon: React.ReactNode;
  label: string;
  a: string;
  b: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
      <div className="flex items-center gap-1.5 shrink-0 w-28" style={{ color: DS.textMuted }}>
        {icon}
        <span className="text-[10px] tracking-wider" style={{ fontFamily: DS.fontHeading }}>{label}</span>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <span className="text-sm text-center" style={{ color: DS.textHeading }}>{a}</span>
        <span className="text-sm text-center" style={{ color: DS.textHeading }}>{b}</span>
      </div>
    </div>
  );
}

export function CompareModal({
  launches,
  onClose,
}: {
  launches: [APILaunch, APILaunch];
  onClose: () => void;
}) {
  const [a, b] = launches;
  const rocketA = a.rocket.configuration;
  const rocketB = b.rocket.configuration;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-2xl border max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: DS.surface, borderColor: DS.border }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: DS.surface, borderColor: DS.border }}>
          <h2 className="text-sm tracking-[0.2em]" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
            LAUNCH COMPARISON
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: DS.border, color: DS.textMuted }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DS.border; }}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Hero images + names */}
          <div className="grid grid-cols-2 gap-6">
            {[a, b].map((launch, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="h-32 rounded-xl overflow-hidden border" style={{ borderColor: DS.border }}>
                  <img
                    src={getLaunchImage(launch)} onError={(e) => { (e.target as HTMLImageElement).src = LAUNCH_FALLBACK_IMAGE; }}
                    alt={getRocketName(launch)}
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <h3 className="text-lg" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
                  {getMissionName(launch)}
                </h3>
                <div className="flex items-center justify-center gap-3">
                  <APIStatusChip status={launch.status} />
                  <APIAgencyBadge agency={launch.launch_service_provider} />
                </div>
              </div>
            ))}
          </div>

          {/* Spec comparison table */}
          <div
            className="rounded-xl border p-4 space-y-1"
            style={{ borderColor: DS.border, background: DS.cardGradient }}
          >
            <h4 className="text-xs tracking-[0.15em] mb-3" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
              SPECIFICATIONS
            </h4>

            <SpecRow
              icon={<Rocket className="w-3 h-3" />}
              label="ROCKET"
              a={getRocketName(a)}
              b={getRocketName(b)}
            />
            <SpecRow
              icon={<Calendar className="w-3 h-3" />}
              label="DATE"
              a={`${formatLaunchDate(a.net)} ${formatLaunchTime(a.net)}`}
              b={`${formatLaunchDate(b.net)} ${formatLaunchTime(b.net)}`}
            />
            <SpecRow
              icon={<MapPin className="w-3 h-3" />}
              label="SITE"
              a={a.pad.location.name}
              b={b.pad.location.name}
            />
            <SpecRow
              icon={<Ruler className="w-3 h-3" />}
              label="HEIGHT"
              a={rocketA.length != null ? `${rocketA.length}m` : "N/A"}
              b={rocketB.length != null ? `${rocketB.length}m` : "N/A"}
            />
            <SpecRow
              icon={<Zap className="w-3 h-3" />}
              label="THRUST"
              a={rocketA.to_thrust != null ? `${rocketA.to_thrust.toLocaleString()}kN` : "N/A"}
              b={rocketB.to_thrust != null ? `${rocketB.to_thrust.toLocaleString()}kN` : "N/A"}
            />
            <SpecRow
              icon={<Layers className="w-3 h-3" />}
              label="STAGES"
              a={String(rocketA.max_stage ?? "N/A")}
              b={String(rocketB.max_stage ?? "N/A")}
            />
            <SpecRow
              icon={<Package className="w-3 h-3" />}
              label="LEO"
              a={rocketA.leo_capacity != null ? `${rocketA.leo_capacity.toLocaleString()}kg` : "N/A"}
              b={rocketB.leo_capacity != null ? `${rocketB.leo_capacity.toLocaleString()}kg` : "N/A"}
            />

            <div className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
              <div className="flex items-center gap-1.5 shrink-0 w-28" style={{ color: DS.textMuted }}>
                <OrbitTag orbit={getOrbitAbbrev(a)} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <span className="text-xs text-center" style={{ color: DS.textBody }}>{a?.mission?.type ?? "N/A"}</span>
                <span className="text-xs text-center" style={{ color: DS.textBody }}>{b?.mission?.type ?? "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Rocket visual comparison */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.cardGradient }}
          >
            <h4 className="text-xs tracking-[0.15em] mb-3" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
              SCALE COMPARISON
            </h4>
            <RocketDiagram launches={[a, b]} />
          </div>
        </div>
      </div>
    </div>
  );
}
