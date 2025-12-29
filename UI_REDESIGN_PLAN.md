# Toasty Research UI Redesign Plan
## Apple Weather App (macOS Tahoe) Inspired Design

---

## Overview

Transform Toasty Research into a native Apple-feeling weather research application using Apple's **Liquid Glass** design language from macOS Tahoe 26.2 / iOS 26. The goal is to create a cohesive, elegant experience that feels like it belongs in the Apple ecosystem while maintaining all existing functionality plus the notepad widget.

---

## Phase 1: Design System Foundation

### 1.1 Liquid Glass CSS Framework

Create a new design system file (`src/styles/liquid-glass.css`) with:

**Core Glass Properties:**
```css
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Glass Variants:**
- `.glass-card` - Standard card containers
- `.glass-elevated` - Floating elements (modals, popovers)
- `.glass-sidebar` - Navigation sidebar
- `.glass-widget` - Dashboard widgets
- `.glass-toolbar` - Action bars and headers

### 1.2 Color System Overhaul

**Remove:** Current orange accent (#F18F01) and warm beige backgrounds

**Add Apple Weather Palette:**
```css
:root {
  /* Dynamic backgrounds - gradient based on time/weather */
  --bg-gradient-day: linear-gradient(180deg, #4A90D9 0%, #87CEEB 50%, #B8D4E8 100%);
  --bg-gradient-night: linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
  --bg-gradient-sunset: linear-gradient(180deg, #FF6B6B 0%, #FFA07A 30%, #4A90D9 100%);

  /* Glass tints */
  --glass-white: rgba(255, 255, 255, 0.15);
  --glass-white-hover: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.2);

  /* Text on glass */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);

  /* Accent colors (subtle, Apple-style) */
  --accent-blue: #007AFF;
  --accent-green: #34C759;
  --accent-yellow: #FFCC00;
  --accent-red: #FF3B30;
}
```

### 1.3 Typography System

**Adopt SF Pro-inspired stack:**
```css
--font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
               'Helvetica Neue', Arial, sans-serif;
--font-rounded: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', 'Menlo', 'Monaco', monospace;
```

**Type Scale (Apple Weather-inspired):**
- Location name: 34px, semibold
- Temperature (hero): 96px, thin
- Widget titles: 13px, semibold, uppercase tracking
- Body text: 17px, regular
- Secondary: 15px, regular
- Caption: 13px, regular

### 1.4 Spacing & Layout Tokens

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 20px;
--radius-xl: 28px;

--widget-gap: 12px;
```

---

## Phase 2: Application Shell Redesign

### 2.1 Dynamic Background System

**New Component:** `src/components/layout/DynamicBackground.jsx`

- Full-viewport gradient background that changes based on:
  - Time of day (sunrise, day, sunset, night)
  - Current weather conditions (clear, cloudy, rainy, snowy)
  - Selected city's local time
- Smooth CSS transitions between states
- Optional animated elements (subtle cloud movement, stars at night)

### 2.2 Sidebar Redesign

**Transform current sidebar into Apple-style navigation:**

- **Collapsed by default** on desktop (icon-only, ~60px)
- **Liquid Glass material** with blur effect
- **Location list** with:
  - Current location (auto-detected) at top
  - Favorite cities below
  - Each showing: City name, current temp, condition icon
  - Mini weather condition indicator
- **Search bar** at top with glass styling
- **Add location** (+) button
- **Settings** gear icon at bottom
- Remove "Markets" terminology - just show cities

### 2.3 Header/Toolbar Removal

- **Remove** traditional header bar
- Location name and controls **overlay on content** (Apple Weather style)
- Back navigation via **gesture or subtle back arrow**
- Settings accessible from sidebar

---

## Phase 3: Home Page Transformation

### 3.1 New Home Layout

**Replace current grid layout with Apple Weather-inspired design:**

```
┌─────────────────────────────────────────────────────────┐
│  [Dynamic Weather Background - Full Viewport]           │
│                                                         │
│     San Francisco                                       │
│         72°                                             │
│       Mostly Sunny                                      │
│      H:78° L:61°                                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hourly Forecast (scrollable)                     │   │
│  │ Now  1PM  2PM  3PM  4PM  5PM  6PM  7PM  ...     │   │
│  │ ☀️   ☀️   ⛅   ⛅   🌤️   🌤️   🌙   🌙         │   │
│  │ 72°  74°  75°  73°  71°  68°  65°  63°          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 10-DAY FORECAST  │  │ PRECIPITATION MAP│            │
│  │ ─────────────────│  │                  │            │
│  │ Today    ☀️ 78/61│  │   [Map View]     │            │
│  │ Tue      ⛅ 75/58│  │                  │            │
│  │ Wed      🌧️ 68/54│  │                  │            │
│  │ ...              │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ UV INDEX         │  │ WIND             │            │
│  │ 6 High           │  │ 12 mph NW        │            │
│  │ [Arc gauge]      │  │ [Compass visual] │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ RESEARCH NOTES   │  │ AIR QUALITY      │            │
│  │ ─────────────────│  │ 42 - Good        │            │
│  │ [TipTap Editor]  │  │ [Color bar]      │            │
│  │                  │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Hero Weather Display

**New Component:** `src/components/weather/HeroWeather.jsx`

- Large temperature display (96px, SF Pro thin)
- City name above
- Condition text below temp
- High/Low for today
- All text with subtle drop shadow for readability on gradient

### 3.3 Remove Current Elements

- Remove CityCard grid (replaced by sidebar + single city view)
- Remove WorkspaceCard grid (workspaces become saved layouts)
- Remove "Today's Markets" section
- Remove market bracket displays from home

---

## Phase 4: Widget System Redesign

### 4.1 Widget Container Component

**New Component:** `src/components/widgets/GlassWidget.jsx`

```jsx
// All widgets wrapped in consistent glass container
<div className="glass-widget">
  <header className="widget-header">
    <Icon />
    <span className="widget-title">{title}</span>
  </header>
  <div className="widget-content">
    {children}
  </div>
</div>
```

**Widget Header Style:**
- Small icon (SF Symbols style)
- Title: 13px, semibold, uppercase, letter-spacing: 0.5px
- Color: rgba(255,255,255,0.6)

### 4.2 Standard Widget Sizes

Following Apple's widget size system:
- **Small:** 160x160px - Single metric (UV, Humidity, Pressure)
- **Medium:** 340x160px - Hourly forecast, wind details
- **Large:** 340x340px - 10-day forecast, map, notes

### 4.3 Widget Redesigns

#### Hourly Forecast Widget
- Horizontal scroll
- Each hour: Time, condition icon, temp
- Temperature trend line connecting temps
- "NOW" indicator for current hour
- Glass container with subtle inner glow

#### 10-Day Forecast Widget
- List layout (not grid)
- Each day: Day name, condition icon, rain %, high/low temps
- High/low shown as gradient bar
- Today highlighted
- Scrollable if needed

#### Precipitation Map Widget
- Interactive map with glass frame
- Layer toggles: Precipitation, Temperature, Air Quality
- Time scrubber for forecast animation
- Zoom controls (glass buttons)
- Based on existing Leaflet implementation

#### UV Index Widget (Small)
- Circular arc gauge (0-11+ scale)
- Color gradient (green to purple)
- Current value large in center
- Label: "Low", "Moderate", "High", "Very High", "Extreme"

#### Wind Widget (Small)
- Compass rose visualization
- Wind direction arrow
- Speed in center
- Gusts noted below

#### Air Quality Widget (Small)
- AQI number large
- Color-coded (green/yellow/orange/red/purple)
- Descriptor text
- Primary pollutant noted

#### Sunrise/Sunset Widget (Medium)
- Arc showing sun path
- Current sun position on arc
- Sunrise/sunset times at ends
- Daylight duration

#### Humidity Widget (Small)
- Percentage large
- Dew point below
- Simple visual indicator

#### Pressure Widget (Small)
- Current pressure (inHg or mb)
- Trend arrow (rising/falling/steady)
- Simple gauge or trend line

#### Research Notes Widget (Large) - NEW DESIGN
- Glass container matching other widgets
- Header: "RESEARCH NOTES" with pencil icon
- TipTap editor inside
- Slash command menu styled with glass
- Floating toolbar for formatting
- Auto-save indicator (subtle)
- Full-screen expand option

### 4.4 Widget Grid Layout

- CSS Grid with auto-fit
- Widgets snap to standard sizes
- Drag-to-reorder (optional, phase 2)
- Responsive: Stack on mobile, grid on desktop

---

## Phase 5: City Dashboard Redesign

### 5.1 Single City View

When selecting a city from sidebar:

1. **Background changes** to reflect city's weather/time
2. **Hero section** shows city's current conditions
3. **Widget grid** shows detailed weather data
4. **Smooth transition** from home view

### 5.2 Multi-City View (Workspace Replacement)

- Horizontal scroll of city cards (like iOS Weather)
- Each card shows:
  - City name
  - Current temp
  - Condition
  - High/Low
- Tap to expand to full view
- Swipe to navigate between cities

---

## Phase 6: Component Migrations

### 6.1 Files to Create

```
src/
├── styles/
│   ├── liquid-glass.css        # Glass design system
│   ├── weather-gradients.css   # Background gradients
│   └── typography.css          # SF Pro-inspired type
├── components/
│   ├── layout/
│   │   ├── DynamicBackground.jsx
│   │   ├── GlassSidebar.jsx
│   │   └── AppShell.jsx
│   ├── weather/
│   │   ├── HeroWeather.jsx
│   │   ├── HourlyForecast.jsx
│   │   ├── TenDayForecast.jsx
│   │   ├── WeatherMap.jsx
│   │   ├── UVIndex.jsx
│   │   ├── WindCompass.jsx
│   │   ├── AirQuality.jsx
│   │   ├── SunriseSunset.jsx
│   │   ├── Humidity.jsx
│   │   └── Pressure.jsx
│   ├── widgets/
│   │   ├── GlassWidget.jsx     # Base wrapper
│   │   └── WidgetGrid.jsx      # Layout manager
│   └── notepad/
│       └── ResearchNotesWidget.jsx  # Redesigned notepad
```

### 6.2 Files to Modify

- `src/App.jsx` - New app shell structure
- `src/index.css` - Import new design system
- `tailwind.config.js` - Update theme tokens
- `src/components/layout/Sidebar.jsx` - Complete redesign
- `src/components/home/HomePage.jsx` - Complete redesign
- `src/components/dashboard/CityDashboard.jsx` - Merge into main view
- `src/components/notepad/*` - Restyle for glass design

### 6.3 Files to Remove/Deprecate

- `src/components/home/CityCard.jsx` - Replaced by sidebar
- `src/components/home/WorkspaceCard.jsx` - Replaced by multi-city view
- `src/components/home/CreateWorkspaceModal.jsx` - Simplified
- `src/components/dashboard/WorkspaceDashboard.jsx` - Merged

---

## Phase 7: Interactions & Animations

### 7.1 Transitions

- **Page transitions:** Crossfade with scale (0.98 → 1.0)
- **Widget hover:** Subtle lift + brightness increase
- **Sidebar expand:** Smooth width transition (60px → 280px)
- **Background gradient:** 2s ease transition between states

### 7.2 Micro-interactions

- **Temperature updates:** Number tick animation
- **Condition icon:** Subtle bounce on change
- **Map layer toggle:** Crossfade between layers
- **Widget loading:** Shimmer placeholder

### 7.3 Gestures (Future Enhancement)

- Swipe between cities
- Pull to refresh
- Long press for widget options

---

## Phase 8: Data Integration

### 8.1 NWS API Usage

Keep existing hooks, add new ones:
- `useCurrentConditions(lat, lon)` - Current weather
- `useHourlyForecast(lat, lon)` - 24-hour forecast
- `useDailyForecast(lat, lon)` - 7-10 day forecast
- `useWeatherAlerts(lat, lon)` - Severe weather
- `useSunriseSunset(lat, lon)` - Solar data

### 8.2 Subtle Kalshi Integration

- Keep market data but display minimally within weather context
- Add "Market Insight" widget (Small) showing:
  - Top temperature bracket probability
  - Subtle indicator on forecast widgets (e.g., "Markets: 78°F 65%")
- Keep `useKalshiMarkets` hooks active
- No prominent market displays - data enhances weather, doesn't dominate

### 8.3 City Management

- Store favorite cities in localStorage
- Auto-detect current location (with permission)
- Quick-add cities via search

---

## Phase 9: Mobile Responsiveness

### 9.1 Mobile Layout (< 768px)

- Full-screen weather view
- Bottom sheet for widgets (swipe up)
- Tab bar navigation: Home, Map, Search, Notes
- Horizontal scroll for hourly forecast
- Stacked widgets in single column

### 9.2 Tablet Layout (768px - 1024px)

- 2-column widget grid
- Sidebar as overlay (hamburger trigger)
- Hero section at top

### 9.3 Desktop Layout (> 1024px)

- Persistent sidebar (collapsible)
- 3-4 column widget grid
- Hero section with adjacent hourly forecast

---

## Phase 10: Implementation Order

### Sprint 1: Foundation
1. Create `liquid-glass.css` design system
2. Create `DynamicBackground.jsx` component
3. Update `tailwind.config.js` with new tokens
4. Create `GlassWidget.jsx` base component

### Sprint 2: Shell & Navigation
5. Redesign `Sidebar.jsx` → `GlassSidebar.jsx`
6. Create `AppShell.jsx` with new layout
7. Update `App.jsx` routing structure

### Sprint 3: Weather Widgets
8. Create `HeroWeather.jsx`
9. Create `HourlyForecast.jsx`
10. Create `TenDayForecast.jsx`
11. Create small widgets (UV, Wind, AirQuality, etc.)

### Sprint 4: Home & Dashboard
12. Redesign `HomePage.jsx`
13. Create `WidgetGrid.jsx` layout
14. Merge city dashboard into main view

### Sprint 5: Notepad & Polish
15. Redesign `ResearchNotepad.jsx` with glass styling
16. Update TipTap editor styles
17. Add animations and transitions
18. Mobile responsive testing

### Sprint 6: Cleanup
19. Remove deprecated components
20. Remove Kalshi integration from UI
21. Performance optimization
22. Browser testing

---

## Success Criteria

- [ ] App feels like native macOS Tahoe application
- [ ] Liquid Glass effect renders correctly in Chrome, Safari, Firefox
- [ ] Dynamic backgrounds change based on time/weather
- [ ] All weather data displays correctly from NWS
- [ ] Notepad widget integrated seamlessly
- [ ] Responsive across mobile, tablet, desktop
- [ ] Smooth 60fps animations
- [ ] Accessibility: Sufficient contrast ratios maintained
- [ ] Performance: < 3s initial load, < 100ms interactions

---

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `backdrop-filter` not supported in older browsers | Provide solid fallback background |
| Low contrast on glass surfaces | Add subtle dark overlay behind text |
| Performance with blur effects | Use `will-change`, limit blur area |
| Dynamic gradients heavy on GPU | Use CSS transitions, not JS animations |
| Complex widget grid on mobile | Simplify to single column stack |

---

## Resources & References

- [Apple Liquid Glass Design Announcement](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [CSS-Tricks: Getting Clarity on Apple's Liquid Glass](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Apple Weather App Support](https://support.apple.com/guide/weather-mac/view-weather-conditions-apdw93f0ea3e/mac)
- [macOS Tahoe Features - MacRumors](https://www.macrumors.com/roundup/macos-26/)
- [Liquid Glass CSS Generator](https://liquidglassgen.com/)
