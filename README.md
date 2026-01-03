# Toasty Weather Research Dashboard

A real-time weather research dashboard for prediction market traders. Aggregates NWS forecasts, live station data, and Kalshi market prices to help make informed decisions on weather-based prediction markets.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)

## Features

### Live Weather Data
- **Station Observations** - Real-time METAR data from NWS weather stations
- **Hourly Forecasts** - NWS hourly temperature, precipitation, and wind forecasts
- **Forecast Discussions** - NWS Area Forecast Discussions with keyword highlighting
- **Nearby Stations Map** - Interactive map showing surrounding weather stations

### Prediction Markets
- **Live Market Brackets** - Kalshi temperature and precipitation market prices
- **Settlement Data** - Historical CLI/DSM data for market settlement verification
- **Multi-City Support** - Track markets for New York, Chicago, Los Angeles, Miami, Denver

### Research Tools
- **Rich Text Notepad** - TipTap-powered notes with data chip insertion
- **Chart Screenshots** - Capture and embed charts directly into notes
- **Keyword Definitions** - Hover over meteorological terms for NWS-sourced definitions

### Dashboard
- **Customizable Widgets** - Drag-and-drop widget layout with 12-column grid
- **Glassmorphism UI** - Dark theme with Apple Weather-inspired design
- **Dynamic Backgrounds** - Time-based weather gradients with animated overlays

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS with glassmorphism design system
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Rich Text**: TipTap
- **Deployment**: Vercel (serverless API proxying)

## Data Sources

| Source | Data |
|--------|------|
| [NWS API](https://api.weather.gov) | Observations, forecasts, alerts, discussions |
| [Kalshi](https://kalshi.com) | Prediction market prices (via API proxy) |
| [IEM](https://mesonet.agron.iastate.edu) | Historical CLI/DSM settlement data |

## Project Structure

```
src/
├── components/
│   ├── dashboard/     # Widget layout & management
│   ├── weather/       # Weather display components
│   ├── widgets/       # Individual widget components
│   ├── home/          # Homepage & market cards
│   └── notepad/       # Rich text editor
├── hooks/             # Custom React hooks
├── context/           # React Context providers
├── config/            # Widget registry, city definitions
└── data/              # Static data (NWS definitions)
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Technical documentation for AI assistants
- [Design Guidelines](./docs/DESIGN_GUIDELINES.md) - UI/UX patterns and styling

## License

Private project - All rights reserved.
