/**
 * Data formatting utilities.
 * Transforms API data into display-ready strings and UI config.
 */

import type { APILaunch, APIStatus, APITimelineEvent } from "./types";

/* ─── Status mapping ─── */

export type AppStatus = "GO" | "TBD" | "HOLD" | "COMPLETED" | "IN_FLIGHT" | "SUCCESS" | "FAILURE";

export interface StatusConfig {
  label: string;
  color: string;
  pulse: boolean;
}

const STATUS_MAP: Record<number, { appStatus: AppStatus; config: StatusConfig }> = {
  1: { appStatus: "GO",        config: { label: "GO",        color: "#00e676", pulse: false } },
  2: { appStatus: "TBD",       config: { label: "TBD",       color: "#ffc107", pulse: false } },
  3: { appStatus: "COMPLETED", config: { label: "SUCCESS",   color: "#00e676", pulse: false } },
  4: { appStatus: "FAILURE",   config: { label: "FAILURE",   color: "#ff1744", pulse: false } },
  5: { appStatus: "HOLD",      config: { label: "HOLD",      color: "#ff1744", pulse: false } },
  6: { appStatus: "IN_FLIGHT", config: { label: "IN FLIGHT", color: "#4fc3f7", pulse: true } },
  7: { appStatus: "FAILURE",   config: { label: "PARTIAL",   color: "#ff6b35", pulse: false } },
  8: { appStatus: "TBD",       config: { label: "TBC",       color: "#ffc107", pulse: false } },
};

export function mapAPIStatus(status: APIStatus): AppStatus {
  return STATUS_MAP[status.id]?.appStatus ?? "TBD";
}

export function getStatusConfig(status: APIStatus): StatusConfig {
  return STATUS_MAP[status.id]?.config ?? { label: status.abbrev, color: "#546e7a", pulse: false };
}

/* ─── Agency abbreviation ─── */

const AGENCY_ABBREVS: Record<string, string> = {
  "SpaceX": "SPX",
  "National Aeronautics and Space Administration": "NASA",
  "United Launch Alliance": "ULA",
  "European Space Agency": "ESA",
  "Indian Space Research Organization": "ISRO",
  "China Aerospace Science and Technology Corporation": "CASC",
  "China National Space Administration": "CNSA",
  "Rocket Lab": "RLAB",
  "Roscosmos": "RSKM",
  "Russian Federal Space Agency (ROSCOSMOS)": "RSKM",
  "Japan Aerospace Exploration Agency": "JAXA",
  "Arianespace": "ASE",
};

const AGENCY_LOGOS: Record<string, string> = {
  "National Aeronautics and Space Administration": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/120px-NASA_logo.svg.png",
  "SpaceX": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/SpaceX_logo_black.svg/120px-SpaceX_logo_black.svg.png",
  "European Space Agency": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/ESA_logo.svg/120px-ESA_logo.svg.png",
  "United Launch Alliance": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/United_Launch_Alliance_logo.svg/120px-United_Launch_Alliance_logo.svg.png",
  "Indian Space Research Organization": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Indian_Space_Research_Organisation_Logo.svg/120px-Indian_Space_Research_Organisation_Logo.svg.png",
  "Roscosmos": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Roscosmos_logo_en.svg/120px-Roscosmos_logo_en.svg.png",
  "Russian Federal Space Agency (ROSCOSMOS)": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Roscosmos_logo_en.svg/120px-Roscosmos_logo_en.svg.png",
  "Japan Aerospace Exploration Agency": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Jaxa_logo.svg/120px-Jaxa_logo.svg.png",
  "Rocket Lab": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Rocket_Lab_logo.svg/120px-Rocket_Lab_logo.svg.png",
  "Arianespace": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Arianespace_logo.svg/120px-Arianespace_logo.svg.png",
  "China Aerospace Science and Technology Corporation": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/CASC_logo.svg/120px-CASC_logo.svg.png",
  "China National Space Administration": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/China_National_Space_Administration_logo.svg/120px-China_National_Space_Administration_logo.svg.png",
};

export function getAgencyLogoUrl(agency: { name: string; logo_url?: string | null }): string | null {
  return AGENCY_LOGOS[agency.name] ?? agency.logo_url ?? null;
}

export function getAgencyAbbrev(name: string): string {
  return AGENCY_ABBREVS[name] ?? name.substring(0, 4).toUpperCase();
}

/* ─── Agency colors ─── */

const AGENCY_COLORS: Record<string, string> = {
  "SpaceX": "#a8a8a8",
  "National Aeronautics and Space Administration": "#0b3d91",
  "United Launch Alliance": "#005288",
  "European Space Agency": "#003399",
  "Indian Space Research Organization": "#ff6f00",
  "China Aerospace Science and Technology Corporation": "#de2910",
  "Rocket Lab": "#e0e0e0",
  "Roscosmos": "#cc2229",
  "Russian Federal Space Agency (ROSCOSMOS)": "#cc2229",
  "Japan Aerospace Exploration Agency": "#003366",
  "Arianespace": "#003da5",
};

export function getAgencyColor(name: string): string {
  return AGENCY_COLORS[name] ?? "#4fc3f7";
}

/* ─── Date formatting ─── */

export function formatLaunchDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLaunchTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatWindowTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

/* ─── Timeline formatting ─── */

/**
 * Parse ISO 8601 duration into human-readable time relative to T-0.
 * Input format: "PT2M26S", "-PT38M", "PT1H1M54S", "P0D"
 */
export function formatTimelineTime(isoDuration: string): string {
  const isNegative = isoDuration.startsWith("-");
  const clean = isoDuration.replace(/^-/, "");

  const match = clean.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const [, d, h, m, s] = match;
  const days = parseInt(d || "0");
  const hours = parseInt(h || "0") + days * 24;
  const minutes = parseInt(m || "0");
  const seconds = parseInt(s || "0");

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds === 0) return "T-00:00:00";

  const prefix = isNegative ? "T-" : "T+";
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${prefix}${hh}:${mm}:${ss}`;
}

export function formatTimelineEvent(event: APITimelineEvent): {
  time: string;
  event: string;
  description: string;
} {
  return {
    time: formatTimelineTime(event.relative_time),
    event: event.type.abbrev,
    description: event.type.description,
  };
}

/* ─── Number formatting ─── */

export function formatMass(kg: number | null | undefined): string {
  if (kg == null) return "N/A";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg} kg`;
}

export function formatThrust(kn: number | null | undefined): string {
  if (kn == null) return "N/A";
  return `${kn.toLocaleString()} kN`;
}

export function formatLength(m: number | null | undefined): string {
  if (m == null) return "N/A";
  return `${m} m`;
}

export function formatCapacity(kg: number | null | undefined): string {
  if (kg == null) return "N/A";
  return `${kg.toLocaleString()} kg`;
}

/* ─── Launch data normalization ─── */

/** Extract a display-friendly name from the full launch name (e.g. "Falcon 9 | Starlink" → "Starlink") */
export function getMissionName(launch: APILaunch): string {
  return launch.mission?.name ?? launch.name.split("|").pop()?.trim() ?? launch.name;
}

export function getRocketName(launch: APILaunch): string {
  return launch.rocket.configuration.full_name || launch.rocket.configuration.name;
}

export function getAgencyName(launch: APILaunch): string {
  return launch.launch_service_provider.name;
}

export function getOrbitAbbrev(launch: APILaunch): string {
  return launch.mission?.orbit?.abbrev ?? "N/A";
}

export function getOrbitName(launch: APILaunch): string {
  return launch.mission?.orbit?.name ?? "Unknown Orbit";
}

export const LAUNCH_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1534515891283-88b2cf4d6b56?w=800";

export function getLaunchImage(launch: APILaunch): string {
  return (
    launch.image ??
    launch.launch_service_provider.image_url ??
    launch.rocket.configuration.image_url ??
    LAUNCH_FALLBACK_IMAGE
  );
}

export function getWeatherStatus(launch: APILaunch): string {
  if (launch.weather_concerns) return launch.weather_concerns;
  if (launch.probability != null) return `${launch.probability}% favorable`;
  return "Data unavailable";
}
