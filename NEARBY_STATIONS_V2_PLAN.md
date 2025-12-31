# Nearby Stations & Dashboard Layout Fixes

## Issues Identified

### 1. Station Cells Formatting (Messy/Hard to Read)
- Current 3-column grid is cramped
- Station IDs not aligned well with temperatures
- "Pri" label is redundant (green dot already indicates primary)

### 2. Map Behavior
- Currently zooms to station when clicked (FlyToStation component)
- This causes popup to get cut off
- Map should stay stationary, just show popup

### 3. Dashboard Stacked Widgets
- WIND widget is tall (has compass graphic)
- HUMIDITY widget is small (just percentage)
- FORECAST and MODELS also have different natural heights
- Widgets either stretch too much or leave gaps

---

## Changes

### Change 1: Clean Up Station Cells

**Before:**
```
● KNYC  [Pri]  32°  ○ KLGA      32°  ○ KTEB      30°
```

**After (cleaner 2-column layout):**
```
┌──────────────────┐ ┌──────────────────┐
│ ● KNYC      32°  │ │ ○ KLGA      32°  │
├──────────────────┤ ├──────────────────┤
│ ○ KTEB      30°  │ │ ○ KEWR      34°  │
├──────────────────┤ ├──────────────────┤
│ ○ KJFK      32°  │ │ ○ KCDW      28°  │
└──────────────────┘ └──────────────────┘
```

Changes:
- Switch from 3-column to 2-column grid
- Remove "Pri" label (green dot is sufficient)
- Add subtle divider lines between rows
- Better spacing and alignment
- Larger touch targets

### Change 2: Remove Map Zoom on Click

Remove the `FlyToStation` component entirely. When clicking a station:
- Map stays at current zoom/position
- Popup opens at station's marker location
- No animation, immediate popup display

### Change 3: Fix Dashboard Stacked Widgets

Current issue: Wrapping widgets in `flex flex-col` works, but the widgets have different natural heights.

**Solution: Use CSS Grid with `auto-rows`**

Instead of:
```jsx
<div className="flex flex-col gap-2">
  <NWSForecastWidget />
  <ModelsWidget />
</div>
```

Use a nested grid that equalizes row heights:
```jsx
<div className="grid grid-rows-2 gap-2 h-full">
  <NWSForecastWidget />
  <ModelsWidget />
</div>
```

This ensures:
- Both widgets get equal height (50% each)
- They fill the available space
- No stretching beyond what's needed

---

## Implementation Steps

1. **NearbyStations.jsx - Station cells cleanup**
   - Remove "Pri" badge from StationCell
   - Change grid from 3-col to 2-col
   - Add subtle border between rows
   - Better text alignment

2. **NearbyStations.jsx - Remove zoom behavior**
   - Delete FlyToStation component
   - Remove FlyToStation from MapContainer
   - Keep selectedStation state (for highlight)
   - Popup opens without zoom

3. **CityDashboardNew.jsx - Fix stacked widget layout**
   - Change `flex flex-col gap-2` to `grid grid-rows-2 gap-2 h-full`
   - Apply to both stacked columns (FORECAST+MODELS and WIND+HUMIDITY)
   - Ensure widgets fill their grid cell properly

---

## Visual Result

**Nearby Stations - Before:**
```
● KNYC Pri 32° ○ KLGA 32° ○ KTEB 30°  (cramped)
● KEWR    34° ○ KJFK 32° ○ KCDW 28°
```

**Nearby Stations - After:**
```
● KNYC          32°  │  ○ KLGA          32°
─────────────────────┼─────────────────────
○ KTEB          30°  │  ○ KEWR          34°
─────────────────────┼─────────────────────
○ KJFK          32°  │  ○ KCDW          28°
```

**Dashboard Row - After:**
```
┌─────────────────────┬────────────┬────────────┐
│  NEARBY STATIONS    │ FORECAST   │   WIND     │
│  [    MAP    ]      │ (equal     │  (equal    │
│                     │  height)   │   height)  │
│  ● KNYC  32° ...    ├────────────┼────────────┤
│                     │ MODELS     │ HUMIDITY   │
│                     │ (equal     │  (equal    │
│                     │  height)   │   height)  │
└─────────────────────┴────────────┴────────────┘
```
