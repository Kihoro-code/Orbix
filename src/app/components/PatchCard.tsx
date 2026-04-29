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
                (e.target as HTMLImageElement).style.display = "none";
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
