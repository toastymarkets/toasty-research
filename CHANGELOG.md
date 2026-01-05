# Changelog

All notable changes to Toasty Weather Research Dashboard.

## [1.4.2] - 2026-01-04

### Added
- Rain Widget showing month-to-date precipitation with year-over-year comparison
- Bar chart comparing current year MTD vs previous year full month total
- Monthly climate normals modal (1991-2020 NOAA data)
- Historical record precipitation display for each city

### Fixed
- IEM CLI API parsing: filter results by target year/month before extracting data
  - API returns all historical records, not just requested date
  - Now correctly takes last day of month for full month total
  - Verified against [LA Almanac](https://www.laalmanac.com/weather/we09aa.php): January 2025 = 0.94"

### Data Sources
- Current MTD: NWS observations API (`precipitationLastHour`)
- Previous year: IEM CLI archive (`precip_month` field)
- Climate normals: Hardcoded NOAA 1991-2020 averages

## [1.4.1] - 2026-01-03

### Changed
- Dashboard toggle button now returns to note-taking sidebar instead of fully collapsing
- Toggle button repositioned to right side in dashboard mode to avoid overlap with navigation

### Fixed
- Dashboard panel width now aligns flush with city cards sidebar (no overlap or gap)
- Fixed dashboard collapse accidentally navigating to homepage
- Fixed unique key warning in NotesDashboardSidebar component

## [1.4.0] - 2026-01-03

### Added
- Research Notes Dashboard with full-page expandable view
- Multi-column newspaper-style grid layout for notes
- NotesDashboardSidebar with search, filter (All/Today/Week/Archived), and sort options
- NoteCardPreview component with read-only TipTap preview
- Auto-expand current note when opening dashboard
- Click-to-select note highlighting with auto-scroll

### Changed
- Sidebar toggle button now expands to dashboard view (three-state: collapsed/sidebar/dashboard)
- Note card text uses proportional sizing (text-xs) matching site design
- Expanded notes have max-height with vertical scroll to prevent infinite expansion

## [1.3.0] - 2026-01-03

### Added
- FrogFriend interactive pixel art mascot on city dashboards
- 8 frog emotes: idle, happy, sad, angry, surprised, sleeping, eating, confused
- Weather-reactive emotes (rain→sad, thunder→angry, snow→surprised, fog→confused, clear→happy)
- Sleep mode with floating zzz after 1 minute of inactivity
- Click interactions: hop, eat fly, wake from sleep
- Autonomous hopping behavior: frog hops to random positions every 6 seconds

### Changed
- Frog design rebuilt with proper raised eye bumps matching sprite reference
- Simplified happy emote to subtle smile (removed tongue)
- Reduced frog size to 36×29px for subtlety
- Frog flips direction based on movement

## [1.2.2] - 2026-01-03

### Changed
- Redesigned ResolutionWidget layout to fit within small widget constraints
- Hero high temperature with report timestamp and countdown to next CLI
- DSM view shows "High so far today" with live status indicator

### Fixed
- Removed unused formatLastUpdated function (dead code)
- Bottom section only renders when content exists (prevents empty border)

## [1.2.1] - 2025-01-03

### Added
- README with project overview and quick start guide
- Developer workflow skills: `/build-check`, `/perf-audit`, `/widget-new`
- NWS Discussion keyword highlighting with hover definitions
- RAG knowledge base for AI copilot

### Changed
- Route-level lazy loading for all page components
- Dynamic import for html2canvas (bundle optimization)
- Main bundle reduced from 920 KB to 218 KB (76% reduction)

### Fixed
- Chicago AFD parsing with alternative section format (.KEY MESSAGES/.DISCUSSION)

## [1.2.0] - 2024-12-31

### Added
- Dynamic weather backgrounds on homepage market cards
- Expanded rain and snow market sections
- Comprehensive design guidelines documentation

### Changed
- Homepage layout optimization with improved market sections
- Cleaner navigation and header structure

### Fixed
- Infinite loop in useDSM hook
- Homepage navigation and UX issues

## [1.1.0] - 2024-12-28

### Added
- REPORTS widget with CLI/DSM toggle and settlement data
- Chart screenshot to notes feature
- Screenshot button on observation charts

### Changed
- Phase 6 code cleanup and optimization

## [1.0.0] - 2024-12-15

### Added
- Initial release
- City dashboards with customizable widget grid
- Live Station Data widget with METAR observations
- Live Market Brackets widget with Kalshi integration
- NWS Hourly Forecast widget
- Forecast Discussion widget
- Nearby Stations Map widget
- Research notepad with TipTap editor
- Glassmorphism UI design system
- Dynamic weather backgrounds
- Multi-city support (New York, Chicago, Los Angeles, Miami, Denver)
