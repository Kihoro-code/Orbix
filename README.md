# 🚀 Orbix — Live Rocket Launch Tracker

A real-time rocket launch tracker with a 3D orbital globe, live countdowns, and detailed mission data — powered by the [Launch Library 2 API](https://thespacedevs.com/llapi).

## ✨ Features

### 🏠 Home Dashboard
- **Live Hero Countdown** — Countdown timer to the next upcoming launch with mission name, rocket, and launch site
- **Real-Time Stats** — Total upcoming launches, launches in the next 24 hours, and active agencies
- **Launch Card Grid** — Browse upcoming missions with images, status badges, orbit tags, and mini countdowns
- **Launching Soon Sidebar** — Quick-glance list of imminent launches

### 🌍 3D Orbital Tracker
- **Interactive Earth Globe** — Photorealistic 3D Earth rendered with NASA Blue Marble textures using Three.js
- **Satellite Orbit Visualization** — Animated satellite dots orbiting at correct altitudes (LEO, MEO, GTO, GEO)
- **Click-to-Inspect** — Click any satellite to see mission name, agency, rocket, launch date/time, and orbit type
- **Drag & Zoom** — Full orbit controls to rotate, pan, and zoom the globe

### 🔍 Explore Page
- **Search** — Find missions by name, rocket, or agency with debounced autocomplete suggestions
- **Agency Filters** — Filter by top space agencies (SpaceX, NASA, ISRO, ESA, CNSA, etc.)
- **Rocket Family Dropdown** — Filter by rocket family (Falcon 9, Soyuz, Long March, etc.)
- **Sort Options** — Sort by soonest, agency, or mission status

### 📋 Launch Detail Page
- **Mission Overview** — Description, orbit type, mission type, and program info
- **Quick Facts** — Launch site, window open/close times, weather conditions
- **Rocket Specifications** — Height, diameter, max stages, LEO/GTO capacity, and stage visualization
- **Mission Timeline** — Sequence of events from T-minus to orbital insertion
- **Updates Feed** — Latest status updates and comments from the API
- **Related Launches** — Other missions from the same agency

### 🎨 Design
- **Dark Cinematic Theme** — Deep space color palette with neon accents and glassmorphism
- **Animated Starfield** — Procedural star background across all pages
- **Smooth Transitions** — Framer Motion animations on page transitions and card interactions
- **Responsive Layout** — Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS |
| 3D | Three.js, React Three Fiber, Drei |
| Animations | Framer Motion |
| Icons | Lucide React |
| Build | Vite |
| API | [Launch Library 2](https://ll.thespacedevs.com/2.2.0/) (TheSpaceDevs) |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173`.

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── HomePage.tsx        # Dashboard with hero, stats, grid
│   │   ├── ExplorePage.tsx     # Search, filter, sort launches
│   │   ├── LaunchDetail.tsx    # Full mission detail view
│   │   ├── OrbitGlobe.tsx      # 3D Earth + satellite orbits
│   │   ├── Starfield.tsx       # Animated star background
│   │   └── shared.tsx          # Design system, navbar, reusable components
│   └── routes.ts               # React Router config
├── services/
│   ├── api.ts                  # Fetch wrapper with cache + rate-limit handling
│   ├── cache.ts                # localStorage cache with TTL
│   ├── hooks.ts                # React hooks (useUpcomingLaunches, etc.)
│   ├── launchService.ts        # Typed API calls
│   ├── formatters.ts           # Data → display transformers
│   └── types.ts                # Full TypeScript types for LL2 API
└── styles/
    ├── theme.css               # Design tokens
    ├── fonts.css               # Typography
    └── index.css               # Global styles
```

## 📡 API & Caching

- Uses the **Development endpoint** (`lldev.thespacedevs.com`) — no rate limits
- **Cache-first strategy** with 5-minute TTL in `localStorage`
- **Stale-while-revalidate** fallback for seamless UX during network issues
- **Auto-polling** every 5 minutes on the Home page, every 2 minutes on Detail

## 📄 License

MIT