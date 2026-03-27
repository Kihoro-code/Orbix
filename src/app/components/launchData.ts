export type Status = "GO" | "TBD" | "HOLD" | "COMPLETED" | "IN_FLIGHT";

export interface Launch {
  id: number;
  mission: string;
  rocket: string;
  agency: string;
  agencyShort: string;
  launchDate: Date;
  location: string;
  orbit: string;
  status: Status;
  image: string;
  description: string;
  objectives: string[];
  payload: string;
  rocketSpecs: { height: string; thrust: string; stages: number; payloadCapacity: string };
  timeline: { time: string; event: string; completed: boolean }[];
  windowOpen: string;
  windowClose: string;
  weather: string;
}

const ROCKET_IMAGES = [
  "https://images.unsplash.com/photo-1720214661177-2c975f7824b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTcGFjZVglMjBGYWxjb24lMjByb2NrZXR8ZW58MXx8fHwxNzc0NTk5ODI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1729061424551-2f930f5374b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBdGxhcyUyMFYlMjByb2NrZXQlMjBsYXVuY2h8ZW58MXx8fHwxNzc0NTk5ODI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1762290899574-7a628ca71587?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2NrZXQlMjBsYXVuY2glMjBwYWQlMjBkYXlsaWdodHxlbnwxfHx8fDE3NzQ1OTk4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1614729375290-b2a429db839b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFjZSUyMHNodXR0bGUlMjBsYXVuY2glMjBOQVNBfGVufDF8fHx8MTc3NDU5OTgzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1614642240262-a452c2c11724?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTb3l1eiUyMHJvY2tldCUyMGxhdW5jaHxlbnwxfHx8fDE3NzQ1OTk4NDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1534515891283-88b2cf4d6b56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2NrZXQlMjBsYXVuY2glMjBuaWdodCUyMHNreXxlbnwxfHx8fDE3NzQ1NDgyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1648281315089-7e54e0c6149c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJU1JPJTIwSW5kaWFuJTIwcm9ja2V0JTIwbGF1bmNofGVufDF8fHx8MTc3NDYwMDI1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1647527243488-06caf0a598d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGluZXNlJTIwc3BhY2UlMjByb2NrZXQlMjBMb25nJTIwTWFyY2h8ZW58MXx8fHwxNzc0NjAwMjUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1666479519224-5e547305a362?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxFbGVjdHJvbiUyMHJvY2tldCUyMGxhdW5jaCUyME5ldyUyMFplYWxhbmR8ZW58MXx8fHwxNzc0NjAwMjUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
];

export const HERO_IMG = "https://images.unsplash.com/photo-1534515891283-88b2cf4d6b56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2NrZXQlMjBsYXVuY2glMjBuaWdodCUyMHNreXxlbnwxfHx8fDE3NzQ1NDgyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const launches: Launch[] = [
  {
    id: 1, mission: "Starlink Group 12-5", rocket: "Falcon 9 Block 5", agency: "SpaceX", agencyShort: "SPX",
    launchDate: new Date("2026-03-28T14:30:00Z"), location: "KSC LC-39A, Florida", orbit: "LEO", status: "GO", image: ROCKET_IMAGES[0],
    description: "SpaceX's Falcon 9 will deliver another batch of 23 Starlink V2 Mini satellites to low Earth orbit, continuing to expand the global broadband constellation. This is the 12th flight for the first stage booster B1078, which previously supported Crew-9 and multiple Starlink missions.",
    objectives: ["Deploy 23 Starlink V2 Mini satellites to 550km shell", "Recover first stage booster on droneship 'Just Read the Instructions'", "Test upgraded laser inter-satellite links", "Achieve nominal orbit insertion within 62 minutes"],
    payload: "23x Starlink V2 Mini satellites (~17,400 kg total mass)",
    rocketSpecs: { height: "70 m", thrust: "7,607 kN", stages: 2, payloadCapacity: "22,800 kg to LEO" },
    timeline: [
      { time: "T-00:38:00", event: "SpaceX Launch Director verifies GO for propellant load", completed: false },
      { time: "T-00:00:00", event: "Liftoff", completed: false },
      { time: "T+00:02:33", event: "First stage MECO & stage separation", completed: false },
      { time: "T+00:08:22", event: "First stage landing on ASDS", completed: false },
      { time: "T+01:02:00", event: "Starlink satellite deployment", completed: false },
    ],
    windowOpen: "14:30 UTC", windowClose: "18:30 UTC", weather: "70% favorable — partly cloudy",
  },
  {
    id: 2, mission: "NROL-167", rocket: "Vulcan Centaur", agency: "United Launch Alliance", agencyShort: "ULA",
    launchDate: new Date("2026-03-29T08:15:00Z"), location: "SLC-41, Cape Canaveral", orbit: "GTO", status: "GO", image: ROCKET_IMAGES[1],
    description: "United Launch Alliance's Vulcan Centaur will launch a classified payload for the National Reconnaissance Office. This represents ULA's third Vulcan flight and demonstrates the vehicle's capability for national security missions.",
    objectives: ["Deliver classified NRO payload to geosynchronous transfer orbit", "Demonstrate Vulcan Centaur RL-10C-X upper stage restart capability", "Validate BE-4 engine performance on third flight", "Support national defense space architecture"],
    payload: "Classified NRO payload (estimated 6,000+ kg)",
    rocketSpecs: { height: "62 m", thrust: "11,060 kN", stages: 2, payloadCapacity: "27,200 kg to LEO" },
    timeline: [
      { time: "T-00:15:00", event: "Terminal countdown initiated", completed: false },
      { time: "T-00:00:00", event: "Liftoff", completed: false },
      { time: "T+00:04:12", event: "Booster jettison & Centaur ignition", completed: false },
      { time: "T+00:12:30", event: "Centaur MECO-1 & coast phase", completed: false },
      { time: "T+00:45:00", event: "Payload separation (classified)", completed: false },
    ],
    windowOpen: "08:15 UTC", windowClose: "10:15 UTC", weather: "85% favorable — clear skies",
  },
  {
    id: 3, mission: "Artemis III", rocket: "SLS Block 1", agency: "NASA", agencyShort: "NASA",
    launchDate: new Date("2026-04-02T16:00:00Z"), location: "KSC LC-39B, Florida", orbit: "TLI", status: "TBD", image: ROCKET_IMAGES[2],
    description: "NASA's Artemis III mission aims to land the first astronauts on the Moon's south pole since Apollo 17 in 1972. The Orion spacecraft will carry a crew of four on a multi-week mission, including a historic lunar surface stay using SpaceX's Starship HLS.",
    objectives: ["Land first humans on the lunar south pole", "Collect geological samples from permanently shadowed craters", "Deploy the first elements of the Artemis Base Camp", "Test Starship Human Landing System in operational conditions", "Conduct moonwalks totaling 26+ hours of surface EVA"],
    payload: "Orion MPCV with 4 crew members (~26,500 kg)",
    rocketSpecs: { height: "98 m", thrust: "39,144 kN", stages: 2, payloadCapacity: "27,000 kg to TLI" },
    timeline: [
      { time: "T-00:10:00", event: "Terminal countdown sequence initiated", completed: false },
      { time: "T-00:00:00", event: "RS-25 ignition & SRB ignition — Liftoff", completed: false },
      { time: "T+00:02:12", event: "SRB separation", completed: false },
      { time: "T+00:08:05", event: "Core stage MECO & ICPS separation", completed: false },
      { time: "T+00:50:00", event: "Trans-Lunar Injection burn", completed: false },
    ],
    windowOpen: "16:00 UTC", windowClose: "18:00 UTC", weather: "TBD — review at L-2 days",
  },
  {
    id: 4, mission: "OneWeb #19", rocket: "Soyuz 2.1b", agency: "Roscosmos", agencyShort: "RSKM",
    launchDate: new Date("2026-04-05T22:45:00Z"), location: "Baikonur, Kazakhstan", orbit: "LEO", status: "GO", image: ROCKET_IMAGES[4],
    description: "A Soyuz 2.1b/Fregat-M will deploy 36 OneWeb broadband satellites to low Earth orbit from the Baikonur Cosmodrome. This launch continues the build-out of OneWeb's global satellite internet constellation.",
    objectives: ["Deploy 36 OneWeb satellites to 1,200km orbit", "Fregat upper stage performs multiple burns for precise orbit insertion", "Achieve full constellation coverage milestone", "Support global broadband service expansion"],
    payload: "36x OneWeb Gen-1 satellites (~5,580 kg total)",
    rocketSpecs: { height: "46.3 m", thrust: "4,460 kN", stages: 3, payloadCapacity: "8,200 kg to LEO" },
    timeline: [
      { time: "T-00:06:00", event: "Countdown key to launch position", completed: false },
      { time: "T-00:00:00", event: "Liftoff from Baikonur", completed: false },
      { time: "T+00:01:58", event: "Strap-on booster separation", completed: false },
      { time: "T+00:09:22", event: "Fregat-M ignition", completed: false },
      { time: "T+03:45:00", event: "Final satellite batch deployment", completed: false },
    ],
    windowOpen: "22:45 UTC", windowClose: "23:15 UTC", weather: "90% favorable — clear",
  },
  {
    id: 5, mission: "Mars Sample Return", rocket: "Falcon Heavy", agency: "SpaceX", agencyShort: "SPX",
    launchDate: new Date("2026-04-10T11:00:00Z"), location: "KSC LC-39A, Florida", orbit: "TMI", status: "HOLD", image: ROCKET_IMAGES[3],
    description: "NASA's Mars Sample Return Earth Return Orbiter will be launched aboard a SpaceX Falcon Heavy on a trajectory to Mars. The mission will rendezvous with cached sample tubes left by the Perseverance rover and return them to Earth for analysis.",
    objectives: ["Insert Earth Return Orbiter into Mars transfer orbit", "Demonstrate autonomous Mars orbit capture", "Rendezvous with Mars Ascent Vehicle in Martian orbit", "Return pristine geological samples to Earth by 2033"],
    payload: "Earth Return Orbiter (~4,200 kg dry mass)",
    rocketSpecs: { height: "70 m", thrust: "22,819 kN", stages: 2, payloadCapacity: "63,800 kg to LEO" },
    timeline: [
      { time: "T-00:45:00", event: "Launch director GO for propellant load", completed: false },
      { time: "T-00:00:00", event: "Triple-core ignition — Liftoff", completed: false },
      { time: "T+00:02:30", event: "Side booster separation & boostback", completed: false },
      { time: "T+00:03:45", event: "Center core MECO & stage separation", completed: false },
      { time: "T+00:34:00", event: "Trans-Mars injection burn", completed: false },
    ],
    windowOpen: "11:00 UTC", windowClose: "13:30 UTC", weather: "HOLD — upper level wind shear review",
  },
  {
    id: 6, mission: "GPS III SV08", rocket: "Falcon 9 Block 5", agency: "SpaceX", agencyShort: "SPX",
    launchDate: new Date("2026-04-12T19:30:00Z"), location: "SLC-40, Cape Canaveral", orbit: "MEO", status: "GO", image: ROCKET_IMAGES[5],
    description: "SpaceX Falcon 9 will deliver the eighth GPS III satellite for the U.S. Space Force. GPS III SV08 features enhanced anti-jamming capabilities and improved accuracy for military and civilian positioning services worldwide.",
    objectives: ["Deploy GPS III SV08 to medium Earth orbit at 20,200 km", "Achieve precise orbital insertion for constellation slot", "Verify enhanced M-code anti-jamming signal", "Recover first stage booster on ASDS"],
    payload: "GPS III SV08 satellite (~4,311 kg)",
    rocketSpecs: { height: "70 m", thrust: "7,607 kN", stages: 2, payloadCapacity: "8,300 kg to GTO" },
    timeline: [
      { time: "T-00:38:00", event: "SpaceX Launch Director verifies GO", completed: false },
      { time: "T-00:00:00", event: "Liftoff", completed: false },
      { time: "T+00:02:33", event: "MECO & stage separation", completed: false },
      { time: "T+00:27:00", event: "Second engine cutoff (SECO-1)", completed: false },
      { time: "T+01:49:00", event: "GPS III satellite deployment", completed: false },
    ],
    windowOpen: "19:30 UTC", windowClose: "21:00 UTC", weather: "80% favorable — scattered clouds",
  },
  {
    id: 7, mission: "Chandrayaan-4", rocket: "LVM3", agency: "ISRO", agencyShort: "ISRO",
    launchDate: new Date("2026-04-18T04:15:00Z"), location: "SDSC SHAR, Sriharikota", orbit: "TLI", status: "GO", image: ROCKET_IMAGES[6],
    description: "ISRO's Chandrayaan-4 mission will attempt a lunar sample return, collecting regolith from the Moon's surface and returning it to Earth for scientific analysis.",
    objectives: ["Achieve soft landing on the lunar surface", "Collect and store lunar regolith samples", "Perform autonomous ascent from the lunar surface", "Return samples to Earth via re-entry capsule"],
    payload: "Chandrayaan-4 Lander + Ascent Module (~3,900 kg)",
    rocketSpecs: { height: "43.4 m", thrust: "5,150 kN", stages: 3, payloadCapacity: "8,000 kg to LEO" },
    timeline: [
      { time: "T-00:06:00", event: "Automatic launch sequence initiated", completed: false },
      { time: "T-00:00:00", event: "Liftoff from Second Launch Pad", completed: false },
      { time: "T+00:02:15", event: "S200 strap-on separation", completed: false },
      { time: "T+00:05:20", event: "Payload fairing jettison", completed: false },
      { time: "T+00:16:30", event: "Spacecraft injection into Earth parking orbit", completed: false },
    ],
    windowOpen: "04:15 UTC", windowClose: "04:45 UTC", weather: "85% favorable — clear skies",
  },
  {
    id: 8, mission: "Tianzhou-8", rocket: "Long March 7", agency: "CNSA", agencyShort: "CNSA",
    launchDate: new Date("2026-04-22T10:00:00Z"), location: "Wenchang, Hainan Island", orbit: "LEO", status: "GO", image: ROCKET_IMAGES[7],
    description: "China's Long March 7 will launch the Tianzhou-8 cargo spacecraft to resupply the Tiangong space station with food, equipment, and propellant for the resident crew.",
    objectives: ["Deliver 6,500 kg of supplies to Tiangong", "Automated rendezvous and docking with station", "Boost station orbit altitude", "Dispose of waste via controlled deorbit"],
    payload: "Tianzhou-8 cargo spacecraft (~13,500 kg)",
    rocketSpecs: { height: "53.1 m", thrust: "7,200 kN", stages: 2, payloadCapacity: "13,500 kg to LEO" },
    timeline: [
      { time: "T-00:30:00", event: "Propellant loading complete", completed: false },
      { time: "T-00:00:00", event: "Liftoff from Wenchang", completed: false },
      { time: "T+00:02:50", event: "Booster separation", completed: false },
      { time: "T+00:09:40", event: "Spacecraft separation & solar array deploy", completed: false },
      { time: "T+06:30:00", event: "Docking with Tiangong station", completed: false },
    ],
    windowOpen: "10:00 UTC", windowClose: "10:30 UTC", weather: "75% favorable — tropical humidity",
  },
  {
    id: 9, mission: "NZSA-Kinéis 5", rocket: "Electron", agency: "Rocket Lab", agencyShort: "RLAB",
    launchDate: new Date("2026-04-25T21:00:00Z"), location: "LC-1, Mahia Peninsula, NZ", orbit: "SSO", status: "TBD", image: ROCKET_IMAGES[8],
    description: "Rocket Lab's Electron rocket will deploy a batch of Kinéis IoT connectivity satellites to sun-synchronous orbit from their Mahia Peninsula launch site in New Zealand.",
    objectives: ["Deploy 5 Kinéis IoT nanosatellites to 630km SSO", "Demonstrate rapid launch cadence capability", "Attempt first stage mid-air helicopter capture", "Support global IoT connectivity constellation"],
    payload: "5x Kinéis IoT satellites (~125 kg total)",
    rocketSpecs: { height: "18 m", thrust: "225 kN", stages: 2, payloadCapacity: "300 kg to SSO" },
    timeline: [
      { time: "T-00:18:00", event: "Enter terminal count", completed: false },
      { time: "T-00:00:00", event: "Liftoff", completed: false },
      { time: "T+00:02:30", event: "MECO & stage separation", completed: false },
      { time: "T+00:06:30", event: "Kick stage ignition for orbit circularization", completed: false },
      { time: "T+00:56:00", event: "Satellite deployment sequence", completed: false },
    ],
    windowOpen: "21:00 UTC", windowClose: "23:00 UTC", weather: "TBD — weather review at L-1",
  },
  {
    id: 10, mission: "Europa Clipper Relay", rocket: "Falcon 9 Block 5", agency: "NASA", agencyShort: "NASA",
    launchDate: new Date("2026-05-01T15:45:00Z"), location: "SLC-40, Cape Canaveral", orbit: "HEO", status: "GO", image: ROCKET_IMAGES[0],
    description: "A communications relay satellite will be launched to support deep-space data transmission from the Europa Clipper mission currently en route to Jupiter's moon Europa.",
    objectives: ["Deploy relay satellite to highly elliptical orbit", "Establish deep-space communication link", "Test Ka-band high-throughput data relay", "Support Europa Clipper science data downlink"],
    payload: "Europa Comm Relay (~2,800 kg)",
    rocketSpecs: { height: "70 m", thrust: "7,607 kN", stages: 2, payloadCapacity: "22,800 kg to LEO" },
    timeline: [
      { time: "T-00:38:00", event: "Launch director GO for propellant load", completed: false },
      { time: "T-00:00:00", event: "Liftoff", completed: false },
      { time: "T+00:02:33", event: "MECO & stage separation", completed: false },
      { time: "T+00:08:20", event: "First stage landing on ASDS", completed: false },
      { time: "T+00:33:00", event: "Relay satellite deployment", completed: false },
    ],
    windowOpen: "15:45 UTC", windowClose: "17:15 UTC", weather: "90% favorable — clear",
  },
  {
    id: 11, mission: "Vega-C VV26", rocket: "Vega-C", agency: "ESA", agencyShort: "ESA",
    launchDate: new Date("2026-05-08T01:30:00Z"), location: "CSG ELV, Kourou, French Guiana", orbit: "SSO", status: "TBD", image: ROCKET_IMAGES[2],
    description: "ESA's Vega-C rocket returns to flight with a rideshare mission carrying multiple European Earth observation satellites to sun-synchronous orbit from the Guiana Space Centre.",
    objectives: ["Deploy primary Earth observation satellite", "Release 6 rideshare cubesats", "Validate Vega-C P120C motor performance post-return-to-flight", "Demonstrate SSMS dispenser for multi-manifest missions"],
    payload: "Sentinel-2C + 6 cubesats (~2,200 kg total)",
    rocketSpecs: { height: "35 m", thrust: "4,500 kN", stages: 4, payloadCapacity: "2,300 kg to SSO" },
    timeline: [
      { time: "T-00:04:00", event: "Synchronized sequence start", completed: false },
      { time: "T-00:00:00", event: "P120C ignition — Liftoff", completed: false },
      { time: "T+00:01:55", event: "P120C burnout & Zefiro-40 ignition", completed: false },
      { time: "T+00:07:00", event: "AVUM+ upper stage ignition", completed: false },
      { time: "T+00:42:00", event: "Primary satellite separation", completed: false },
    ],
    windowOpen: "01:30 UTC", windowClose: "03:00 UTC", weather: "80% favorable — light cloud cover",
  },
  {
    id: 12, mission: "Progress MS-30", rocket: "Soyuz 2.1a", agency: "Roscosmos", agencyShort: "RSKM",
    launchDate: new Date("2026-05-14T09:20:00Z"), location: "Baikonur, Kazakhstan", orbit: "LEO", status: "GO", image: ROCKET_IMAGES[4],
    description: "Roscosmos will launch a Progress cargo spacecraft to resupply the International Space Station with food, fuel, and equipment for the resident Expedition crew.",
    objectives: ["Deliver 2,500 kg of supplies to ISS", "Automated docking with ISS Poisk module", "Reboost ISS orbit altitude", "Dispose of station waste via controlled re-entry"],
    payload: "Progress MS-30 (~7,200 kg at launch)",
    rocketSpecs: { height: "46.3 m", thrust: "4,460 kN", stages: 3, payloadCapacity: "7,400 kg to ISS orbit" },
    timeline: [
      { time: "T-00:06:00", event: "Launch key to flight position", completed: false },
      { time: "T-00:00:00", event: "Liftoff from Baikonur", completed: false },
      { time: "T+00:01:58", event: "Strap-on separation", completed: false },
      { time: "T+00:08:48", event: "Spacecraft separation & antenna deploy", completed: false },
      { time: "T+03:15:00", event: "ISS docking", completed: false },
    ],
    windowOpen: "09:20 UTC", windowClose: "09:20 UTC", weather: "95% favorable — clear steppe skies",
  },
];

export const AGENCIES = ["SpaceX", "NASA", "ULA", "Roscosmos", "ISRO", "CNSA", "Rocket Lab", "ESA"] as const;
export const ROCKET_FAMILIES = ["Falcon 9", "Falcon Heavy", "Vulcan Centaur", "SLS", "Soyuz", "LVM3", "Long March", "Electron", "Vega-C"] as const;

export const AGENCY_COLORS: Record<string, string> = {
  SpaceX: "#a8a8a8",
  NASA: "#0b3d91",
  "United Launch Alliance": "#005288",
  ULA: "#005288",
  Roscosmos: "#cc2229",
  ISRO: "#ff6f00",
  CNSA: "#de2910",
  "Rocket Lab": "#e0e0e0",
  ESA: "#003399",
};

export const STATUS_LABELS: Record<Status, string> = {
  GO: "GO",
  TBD: "TBD",
  HOLD: "HOLD",
  COMPLETED: "COMPLETED",
  IN_FLIGHT: "IN FLIGHT",
};

export const STATUS_DOT_COLORS: Record<Status, string> = {
  GO: "#00e676",
  TBD: "#ffc107",
  HOLD: "#ff1744",
  COMPLETED: "#78909c",
  IN_FLIGHT: "#4fc3f7",
};

export function getLaunchById(id: number): Launch | undefined {
  return launches.find(l => l.id === id);
}