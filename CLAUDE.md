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

## Design System

- Glass morphism UI with backdrop blur
- Apple Weather inspired aesthetic
- Dark/light mode via CSS variables
- Apple accent color palette (blue, green, yellow, orange, red, purple, pink, teal)
