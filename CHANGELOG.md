# Changelog

All notable changes to Toasty Weather Research Dashboard.

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
