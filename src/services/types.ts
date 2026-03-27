/**
 * Launch Library 2 API response types (v2.2.0)
 * Maps the JSON structure to TypeScript interfaces
 */

/* ─── Pagination Wrapper ─── */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ─── Status ─── */
export interface APIStatus {
  id: number;
  name: string;
  abbrev: string;
  description: string;
}

/* ─── Agency / Launch Service Provider ─── */
export interface APIAgency {
  id: number;
  url: string;
  name: string;
  featured?: boolean;
  type: string;
  country_code?: string;
  abbrev?: string;
  description?: string;
  administrator?: string;
  founding_year?: string;
  launchers?: string;
  spacecraft?: string;
  total_launch_count?: number;
  successful_launches?: number;
  failed_launches?: number;
  pending_launches?: number;
  info_url?: string;
  wiki_url?: string;
  logo_url?: string;
  image_url?: string;
  nation_url?: string;
}

/* ─── Rocket Configuration ─── */
export interface APIRocketConfig {
  id: number;
  url: string;
  name: string;
  active?: boolean;
  reusable?: boolean;
  description?: string;
  family: string;
  full_name: string;
  variant: string;
  alias?: string;
  min_stage?: number;
  max_stage?: number;
  length?: number | null;
  diameter?: number | null;
  maiden_flight?: string;
  launch_cost?: string | null;
  launch_mass?: number | null;
  leo_capacity?: number | null;
  gto_capacity?: number | null;
  to_thrust?: number | null;
  apogee?: number | null;
  image_url?: string;
  info_url?: string;
  wiki_url?: string;
  total_launch_count?: number;
  successful_launches?: number;
  failed_launches?: number;
}

/* ─── Launcher (Booster) ─── */
export interface APILauncher {
  id: number;
  url: string;
  details?: string;
  flight_proven: boolean;
  serial_number: string;
  status: string;
  image_url?: string;
  successful_landings?: number;
  attempted_landings?: number;
  flights?: number;
  last_launch_date?: string;
  first_launch_date?: string;
}

/* ─── Landing Info ─── */
export interface APILanding {
  id: number;
  attempt: boolean;
  success: boolean | null;
  description: string;
  downrange_distance?: number | null;
  location?: {
    id: number;
    name: string;
    abbrev: string;
    description?: string;
    successful_landings?: number;
  };
  type?: {
    id: number;
    name: string;
    abbrev: string;
    description?: string;
  };
}

/* ─── Launcher Stage ─── */
export interface APILauncherStage {
  id: number;
  type: string;
  reused: boolean;
  launcher_flight_number?: number;
  launcher?: APILauncher;
  landing?: APILanding;
  previous_flight_date?: string;
  turn_around_time_days?: number;
}

/* ─── Rocket ─── */
export interface APIRocket {
  id: number;
  configuration: APIRocketConfig;
  launcher_stage?: APILauncherStage[];
  spacecraft_stage?: unknown;
}

/* ─── Orbit ─── */
export interface APIOrbit {
  id: number;
  name: string;
  abbrev: string;
}

/* ─── Mission ─── */
export interface APIMission {
  id: number;
  name: string;
  description: string;
  launch_designator?: string | null;
  type: string;
  orbit: APIOrbit | null;
  agencies?: APIAgency[];
  info_urls?: string[];
  vid_urls?: string[];
}

/* ─── Launch Pad ─── */
export interface APIPad {
  id: number;
  url: string;
  agency_id?: number | null;
  name: string;
  description?: string;
  info_url?: string | null;
  wiki_url?: string | null;
  map_url?: string | null;
  latitude: string;
  longitude: string;
  location: {
    id: number;
    url: string;
    name: string;
    country_code: string;
    description?: string;
    map_image?: string;
    timezone_name?: string;
    total_launch_count?: number;
    total_landing_count?: number;
  };
  country_code: string;
  map_image?: string;
  total_launch_count?: number;
  orbital_launch_attempt_count?: number;
}

/* ─── Mission Patch ─── */
export interface APIMissionPatch {
  id: number;
  name: string;
  priority: number;
  image_url: string;
  agency?: { id: number; url: string; name: string; type: string };
}

/* ─── Timeline Event ─── */
export interface APITimelineEvent {
  type: {
    id: number;
    abbrev: string;
    description: string;
  };
  relative_time: string;
}

/* ─── Update ─── */
export interface APIUpdate {
  id: number;
  profile_image?: string;
  comment: string;
  info_url?: string;
  created_by: string;
  created_on: string;
}

/* ─── Video URL ─── */
export interface APIVidURL {
  priority: number;
  source: string;
  publisher?: string;
  title: string;
  description?: string;
  feature_image?: string;
  url: string;
  type?: { id: number; name: string };
  language?: { id: number; name: string; code: string };
  start_time?: string;
  end_time?: string;
}

/* ─── Info URL ─── */
export interface APIInfoURL {
  priority: number;
  source: string;
  title: string;
  description?: string;
  feature_image?: string;
  url: string;
  type?: { id: number; name: string };
  language?: { id: number; name: string; code: string };
}

/* ─── Program ─── */
export interface APIProgram {
  id: number;
  url: string;
  name: string;
  description?: string;
  agencies?: { id: number; url: string; name: string; type: string }[];
  image_url?: string;
  start_date?: string;
  end_date?: string | null;
  info_url?: string;
  wiki_url?: string;
  mission_patches?: APIMissionPatch[];
  type?: { id: number; name: string };
}

/* ─── Launch (Main Object) ─── */
export interface APILaunch {
  id: string;
  url: string;
  slug: string;
  name: string;
  status: APIStatus;
  last_updated: string;
  net: string;
  net_precision?: { id: number; name: string; abbrev: string; description: string };
  window_end: string;
  window_start: string;
  probability: number | null;
  weather_concerns: string | null;
  holdreason: string;
  failreason: string;
  hashtag: string | null;
  launch_service_provider: APIAgency;
  rocket: APIRocket;
  mission: APIMission | null;
  pad: APIPad;
  webcast_live: boolean;
  image: string | null;
  infographic: string | null;
  program: APIProgram[];
  // Detailed mode extras
  flightclub_url?: string;
  updates?: APIUpdate[];
  timeline?: APITimelineEvent[];
  vidURLs?: APIVidURL[];
  infoURLs?: APIInfoURL[];
  mission_patches?: APIMissionPatch[];
  pad_turnaround?: string;
  // Stats
  orbital_launch_attempt_count?: number;
  location_launch_attempt_count?: number;
  pad_launch_attempt_count?: number;
  agency_launch_attempt_count?: number;
  orbital_launch_attempt_count_year?: number;
  type?: string;
}
