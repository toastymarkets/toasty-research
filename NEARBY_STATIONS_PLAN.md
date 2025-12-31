# Nearby Stations Widget Redesign Plan

## Overview
Redesign the existing `NearbyStationsMap` widget to match the glassmorphic Apple Weather-inspired UI. The widget will be a large widget (span=2) placed below the Kalshi Market Brackets widget.

---

## Current State
- **Location:** `src/components/widgets/NearbyStationsMap.jsx`
- **Issues:**
  - Uses old styling (gray/white cards, non-glass design)
  - Different map tile layer (OpenStreetMap light theme)
  - Collapsible accordion pattern (not used elsewhere)
  - Not integrated into main dashboard
  - Station cards use light mode colors

---

## Target Design

### Widget Container
- Use `GlassWidget` component with `size="large"`
- Title: "NEARBY STATIONS" with `MapPin` icon
- Clickable to open expanded modal (like WeatherMap)

### Map Section
- **Dark map tiles** (CartoDB dark_all like WeatherMap precipitation)
- **Glowing markers:**
  - Primary station: Green glow (`#10B981`)
  - Nearby stations: Blue glow (`#3B82F6`)
- **No scroll wheel zoom** (consistent with other maps)
- **Fit bounds** to show all stations
- **Height:** ~200px in widget, full modal on expand

### Station Cards Grid
- **Glass-styled cards** (bg-white/10, backdrop-blur)
- **2x3 grid** below the map showing 6 stations
- **Card content:**
  - Station ID badge (colored dot + ID)
  - Large temperature display
  - Mini stats row: Dew | Humidity | Wind
  - Click to highlight on map + open popup
- **Hover effect:** Ring highlight, subtle scale

### Data Display
- Temperature in large white text
- Secondary stats in white/70 opacity
- "Primary" badge for main station
- Distance from main station
- Time since last update

### Interactions
- Click station card → fly to marker + open popup
- Click expand button → open full modal
- Hover cards → highlight effect
- **Quick-add button** → insert station data to notes

### Quick-Add to Notes Feature
- Use `useDataChip()` hook from `DataChipContext`
- Show `+` button on card hover (like MarketBrackets)
- Insert station observation as data chip
- Chip data format:
  ```js
  {
    value: "72°F",           // Temperature
    secondary: "KJFK",       // Station ID
    label: "Station Obs",    // Chip label
    source: "NWS KJFK",      // Data source
    timestamp: "2:45 PM",    // Time of insert
    type: "weather"          // Chip type for styling
  }
  ```
- Optional: Insert full row (Temp | Dew | Humidity | Wind)

---

## Implementation Steps

### Step 1: Create New Component
Create `src/components/weather/NearbyStations.jsx`:
- Import `GlassWidget` for container
- Import Leaflet for map
- Copy data fetching logic from existing widget

### Step 2: Style the Map
- Use CartoDB dark tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Create glowing marker icons using `L.divIcon` with CSS
- Match WeatherMap control positioning

### Step 3: Build Station Cards
- Glass card styling: `bg-white/10 backdrop-blur-sm rounded-xl`
- 2-column grid layout
- Large temp, small stats layout
- Hover/selected state with ring

### Step 3.5: Add Quick-Add to Notes
- Import `useDataChip` from `DataChipContext`
- Add `+` button that appears on card hover
- Insert station data as chip: temp, station ID, source
- Use `group` class for hover visibility

### Step 4: Add to Dashboard
Edit `src/components/dashboard/CityDashboardNew.jsx`:
- Import new `NearbyStations` component
- Add after MarketBrackets with `span={2}`

### Step 5: Create Expanded Modal (Optional)
- Similar to `MapWidgetPopup`
- Larger map view
- Full station list with more details
- Search/filter capabilities

### Step 6: Export & Register
- Add to `src/components/weather/index.js`
- Update `WidgetRegistry.js` if needed

---

## Component Structure

```jsx
import { useDataChip } from '../../context/DataChipContext';
import { Plus } from 'lucide-react';

// Inside component:
const { insertDataChip, isAvailable: canInsertChip } = useDataChip();

<GlassWidget title="NEARBY STATIONS" icon={MapPin} size="large">
  {/* Map Container */}
  <div className="h-[200px] rounded-lg overflow-hidden mb-3">
    <MapContainer>
      {/* Dark tiles + glowing markers */}
    </MapContainer>
  </div>

  {/* Station Cards Grid */}
  <div className="grid grid-cols-2 gap-2">
    {stations.slice(0, 6).map(station => (
      <StationCard key={station.id} {...} />
    ))}
  </div>

  {/* Footer */}
  <div className="flex justify-between pt-2 border-t border-white/10">
    <span className="text-white/40 text-[10px]">
      {stations.length} stations
    </span>
    <button>View all →</button>
  </div>
</GlassWidget>
```

---

## Station Card Component

```jsx
<div
  className={`
    group relative p-3 rounded-xl text-left transition-all cursor-pointer
    bg-white/10 backdrop-blur-sm
    hover:bg-white/15 hover:scale-[1.02]
    ${isSelected ? 'ring-2 ring-blue-400' : ''}
    ${isPrimary ? 'ring-1 ring-emerald-400/50' : ''}
  `}
  onClick={() => handleStationClick(station)}
>
  {/* Quick Add Button - appears on hover */}
  {canInsertChip && (
    <button
      onClick={(e) => handleQuickAdd(station, obs, e)}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                 w-5 h-5 rounded-full bg-white/25 border border-white/20
                 flex items-center justify-center transition-all z-10
                 hover:scale-110 hover:bg-white/35"
      title="Add to notes"
    >
      <Plus size={12} strokeWidth={3} className="text-white/90" />
    </button>
  )}

  {/* Header: ID + Temp */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-emerald-400' : 'bg-blue-400'}`} />
      <span className="text-xs font-medium text-white/80">{station.id}</span>
      {isPrimary && (
        <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
          Primary
        </span>
      )}
    </div>
    <span className="text-xl font-bold text-white tabular-nums">{temp}°</span>
  </div>

  {/* Stats Row */}
  <div className="grid grid-cols-3 gap-2 text-[10px]">
    <div className="flex justify-between">
      <span className="text-white/40">Dew</span>
      <span className="text-white/70 tabular-nums">{dew}°</span>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Hum</span>
      <span className="text-white/70 tabular-nums">{hum}%</span>
    </div>
    <div className="flex justify-between">
      <span className="text-white/40">Wind</span>
      <span className="text-white/70 tabular-nums">{wind}</span>
    </div>
  </div>
</div>
```

### Quick Add Handler

```jsx
const handleQuickAdd = (station, obs, e) => {
  e.stopPropagation(); // Prevent card click

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  insertDataChip({
    value: `${obs.temperature}°F`,
    secondary: station.id,
    label: 'Station Obs',
    source: `NWS ${station.id}`,
    timestamp,
    type: 'weather',
  });
};
```

---

## Glowing Marker CSS

```javascript
const createGlowingIcon = (color, isMain = false) => {
  const size = isMain ? 16 : 12;
  const glow = isMain ? '0 0 12px 4px' : '0 0 8px 2px';

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      box-shadow: ${glow} ${color}80;
      border: 2px solid white;
    "></div>`,
    className: 'glowing-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};
```

---

## Dashboard Placement

```jsx
<WidgetGrid>
  {/* Market Brackets */}
  <WidgetGrid.Item span={2}>
    <MarketBrackets ... />
  </WidgetGrid.Item>

  {/* Weather Map / Satellite */}
  <WidgetGrid.Item span={2}>
    <WeatherMap ... />
  </WidgetGrid.Item>

  {/* NEW: Nearby Stations */}
  <WidgetGrid.Item span={2}>
    <NearbyStations
      citySlug={citySlug}
      cityName={city.name}
      stationId={city.stationId}
      lat={city.lat}
      lon={city.lon}
    />
  </WidgetGrid.Item>

  {/* Rest of widgets... */}
</WidgetGrid>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/weather/NearbyStations.jsx` | **Create** - New redesigned component |
| `src/components/weather/index.js` | **Modify** - Export new component |
| `src/components/dashboard/CityDashboardNew.jsx` | **Modify** - Add widget to grid |
| `src/components/widgets/NearbyStationsMap.jsx` | Keep for now (widget registry uses it) |

---

## Future Enhancements
- [ ] Expanded modal with full station list
- [ ] Station comparison view
- [ ] Historical data for each station
- [ ] Quick-add station data to notes
- [ ] Temperature difference from primary station
