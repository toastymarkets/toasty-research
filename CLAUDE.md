# CLAUDE.md - Toasty Weather Research Dashboard

## Project Overview

Toasty is a React-based weather research dashboard for prediction market traders. It aggregates real-time weather data, NWS forecasts, and Kalshi prediction market data to help traders make informed decisions on weather-based prediction markets.

## Tech Stack

- **Framework**: React 19 with Vite 7
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS 3.4 with PostCSS
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Layout**: React Grid Layout (12-column grid system)
- **Rich Text**: TipTap
- **Deployment**: Vercel (serverless functions for API proxying)

## Commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── dashboard/     # City dashboard layout & widget management
│   ├── weather/       # Weather display components
│   ├── widgets/       # Individual widget components
│   ├── home/          # Homepage & market cards
│   ├── research/      # Research log & notes
│   ├── copilot/       # AI copilot UI
│   ├── notepad/       # Rich text note editor
│   ├── layout/        # Sidebar, layout containers
│   └── ui/            # Generic UI components
├── hooks/             # Custom React hooks (useNWSWeather, useAllKalshiMarkets, etc.)
├── context/           # React Context providers (Theme, Dashboard, Kalshi, etc.)
├── config/
│   ├── WidgetRegistry.js  # Central widget catalog
│   ├── cities.js          # City definitions & metadata
│   └── dataSchedule.js    # NWS data release times
├── stores/            # localStorage persistence (workspaceStore)
├── data/              # Static data (weatherKnowledge.js - NWS definitions)
├── utils/             # Helper functions
└── styles/            # Custom CSS

api/                   # Vercel serverless functions
├── kalshi.js          # Kalshi API proxy (CORS bypass)
└── copilot.js         # Claude AI integration
```

## Key Patterns

### Widget System
- Centralized registry in `src/config/WidgetRegistry.js`
- Widgets: Live Station Data, Live Market Brackets, Nearby Stations Map, Forecast Models, NWS Discussion, NWS Hourly Forecast, Daily Summary, Reports
- 12-column CSS Grid with localStorage persistence

### State Management
- React Context API (no Redux)
- Key contexts: ThemeProvider, KalshiMarketsProvider, DashboardContext, CopilotContext

### Data Fetching
- Kalshi API proxied via `/api/kalshi` (Vercel function)
- Direct fetch to NWS API endpoints
- IEM API for historical/settlement data
- 30-second refresh intervals with rate limiting

### Naming Conventions
- Components: PascalCase (`LiveStationData.jsx`)
- Hooks: camelCase with `use` prefix (`useNWSWeather.js`)
- Contexts: PascalCase with `Context` suffix (`DashboardContext.jsx`)

## External APIs

- **NWS**: Weather observations, forecasts, alerts
- **Kalshi**: Prediction market data (requires proxy)
- **IEM**: Historical CLI/DSM settlement data
- **NewsData.io**: Weather news (requires `VITE_NEWSDATA_API_KEY`)

## Key Data Timing (UTC)

- **CLI**: Official settlement data, once daily (5am-10am UTC)
- **DSM**: Interim "high so far" data, 1-4x daily
- **METAR**: Hourly observations at :51-:56 past each hour

## Adding a New Widget

1. Create component in `src/components/widgets/`
2. Add entry to `src/config/WidgetRegistry.js`
3. Implement required props (citySlug, cityName, etc.)
4. Widget becomes available in AddWidgetPanel

## NWS Discussion Widget

The NWS Discussion widget fetches Area Forecast Discussions (AFD) from NWS offices and provides:

### Keyword Highlighting
Meteorological terms are automatically highlighted with color-coded categories:
- **Temperature** (orange): warm air advection, freeze, cooling trend
- **Synoptic** (blue): high pressure, cold front, trough, ridge
- **Precipitation** (cyan): convection, cape, instability
- **Wind** (teal): offshore flow, gust, santa ana
- **Confidence** (purple): uncertainty, likely, models agree

Hover over keywords to see NWS-sourced definitions. Click to add to research notes.

### AFD Parsing
The widget handles multiple NWS office formats:
- Standard format: `.SYNOPSIS...` / `.NEAR TERM...` / `.LONG TERM...`
- Alternative format: `.KEY MESSAGES...` / `.DISCUSSION...` (used by some offices like Chicago)
- Section terminators: `&&` and paragraph breaks with new sections

Cache key: `nws_afd_v2_${citySlug}` (localStorage with 30-min expiration)

## Design System

See **[docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md)** for comprehensive design documentation.

### Quick Reference
- **Theme**: Dark monochromatic glassmorphism (Apple Weather / macOS Tahoe inspired)
- **Primary accent**: Blue (`#007AFF` / `blue-400`)
- **Glass surfaces**: `rgba(0, 0, 0, 0.3)` with `backdrop-filter: blur(20px)`
- **Text**: White with opacity variants (`text-white`, `text-white/75`, `text-white/50`)
- **Interactive elements**: Blue highlights, hover states
- **Weather backgrounds**: Time-based gradients with animated overlays

## Playwright MCP Guidelines

To minimize context usage when using the Playwright browser tools:

1. **Skip automatic snapshots** - Use `browser_navigate` without immediately taking a snapshot unless interaction with specific elements is needed
2. **Prefer screenshots over snapshots** - Screenshots are smaller than full accessibility trees; use snapshots only when you need element refs for clicking/typing
3. **Close browser when done** - Close the browser after verification instead of leaving it open
4. **Ask before visual checks** - Ask if a screenshot is wanted rather than automatically taking one
5. **Save to file when possible** - Use the `filename` param to save screenshots to disk instead of returning them inline
