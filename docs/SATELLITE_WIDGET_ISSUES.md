# Satellite Widget - Issues & Research

**Component**: `src/components/weather/WeatherMap.jsx` (integrated)
**Status**: ✅ Integrated & Enhanced
**Last Updated**: 2026-01-06

---

## Current State (2026-01-06)

The satellite functionality is now **fully integrated** in `WeatherMap.jsx` (not the orphaned `SatelliteWidget.jsx`).

### ✅ Resolved Issues
1. **Animation Direction**: WeatherMap uses custom frame-by-frame animation with `generateFrameUrl()` that plays in **correct chronological order** (oldest → newest). NOT the pre-generated GIFs mentioned below.
2. **Regional Sector Support**: WeatherMap supports Local, East US, and Pacific sectors with automatic GOES-18/19 selection based on coordinates.
3. **Inline Expansion**: Added 2026-01-06 - map expands from 2x2 to 3x3 grid area for detailed viewing.

### Remaining from Original List
- ❌ SatelliteWidget.jsx still not registered (orphaned component)
- ✅ WeatherMap has proper sizing (2x2 default, 3x3 expanded)
- ⚠️ Missing external GOES website link (nice-to-have)

---

## Historical Issues (Reference Only)

The issues below were documented for the **orphaned** `SatelliteWidget.jsx`. Many don't apply to `WeatherMap.jsx`:

## Executive Summary

The SatelliteWidget is a standalone component that displays NOAA GOES satellite imagery with multiple products (Air Mass, GeoColor, Water Vapor, Infrared). While the core functionality is implemented, the widget has several critical issues preventing production deployment:

1. Not registered in the widget system
2. ~~GIF animations play in reverse chronological order~~ **RESOLVED** - WeatherMap uses custom animation
3. ~~No size constraints causing layout squishing~~ **RESOLVED** - WeatherMap has proper grid sizing
4. Missing external link to GOES website
5. ~~No regional sector support (CONUS only)~~ **RESOLVED** - WeatherMap supports multiple sectors
6. No error handling for failed image loads

---

## Critical Issues

### 1. Widget Not Registered (Severity: HIGH)
**Location**: `src/config/WidgetRegistry.js`
**Issue**: SatelliteWidget is not included in WIDGET_REGISTRY
**Impact**: Widget cannot be added to dashboards through the UI
**Status**: Orphaned component with no integration path

**Required Fix**:
```javascript
'satellite-imagery': {
  id: 'satellite-imagery',
  name: 'Satellite Imagery',
  description: 'GOES satellite imagery with multiple products',
  icon: 'Satellite',
  component: SatelliteWidget,
  category: 'weather',
  requiredProps: ['citySlug', 'cityName'],
  defaultW: 8,    // 2/3 width - large widget
  defaultH: 7,
  minW: 6,        // Don't allow below half width
  minH: 6,
  maxW: 12,       // Can go full width
}
```

---

### 2. GIF Animation Reversed (Severity: HIGH)
**Location**: `SatelliteWidget.jsx:8-24` (SATELLITE_PRODUCTS.animated URLs)
**Issue**: Animated GIF loops play in reverse chronological order
**Impact**: Confusing for users tracking storm progression and movement

**Current URLs**:
```javascript
animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-AirMass-625x375.gif'
```

**Investigation Needed**:
- Check if NOAA CDN provides forward-playing GIFs
- Investigate alternative animation approaches
- Consider implementing custom frame-by-frame animation using `satellite.js` utilities (like WeatherMap component does)

**Potential Solutions**:
1. Find alternative GIF URLs from NOAA CDN
2. Build custom animation using `generateFrameUrl()` and `preloadImage()` from `src/utils/satellite.js`
3. Add CSS transform to reverse the GIF (not ideal)

---

### 3. Widget Sizing Issues (Severity: HIGH)
**Location**: WidgetRegistry entry (missing)
**Issue**: No min/max width constraints defined
**Impact**: Widget becomes illegible when squeezed into narrow columns

**Current State**:
- No size constraints
- Satellite images need adequate space to be readable
- Users can resize to unusable dimensions

**Required Constraints**:
```javascript
defaultW: 8,    // 2/3 width (8/12 columns) - 1066px at standard resolution
defaultH: 7,    // ~560px tall
minW: 6,        // Half width minimum (6/12 = 800px)
minH: 6,        // Maintain aspect ratio
maxW: 12,       // Full width allowed
```

**Rationale**: This is a large widget showing detailed imagery. Images are 625x375px minimum and need surrounding UI (tabs, toggles, footer).

---

### 4. Missing GOES Website Link (Severity: MEDIUM)
**Location**: SatelliteWidget.jsx (needs footer addition)
**Issue**: No hyperlink to source GOES satellite website
**Impact**: Users cannot access full-resolution imagery, additional products, or learn more about satellite data

**Required Addition**:
Add external link in widget footer:
```jsx
<a
  href="https://www.star.nesdis.noaa.gov/GOES/"
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
>
  View on NOAA GOES <ExternalLink size={12} />
</a>
```

**Placement Options**:
1. Footer row with timestamp/refresh (preferred)
2. Header next to title
3. Dedicated info icon with dropdown

---

### 5. No Regional Sector Support (Severity: MEDIUM)
**Location**: `SatelliteWidget.jsx:4-25` (hardcoded CONUS)
**Issue**: Widget only shows CONUS (continental US) imagery, doesn't use city location for regional sectors
**Impact**: Users in specific regions can't see higher-resolution local imagery

**Current Implementation**:
```javascript
const SATELLITE_PRODUCTS = {
  airmass: {
    name: 'Air Mass',
    still: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/AirMass/latest.jpg',
    animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-AirMass-625x375.gif',
  },
  // ... all hardcoded to GOES19/CONUS
};
```

**Existing Infrastructure** (`src/utils/satellite.js`):
- `getGOESConfig(lon, lat)` - Determines correct satellite (GOES18 vs GOES19) and sector based on location
- `getAvailableSectors(lon, lat)` - Returns available regional sectors
- `generateFrameUrl(satellite, sector, band, imageSize, minutesAgo)` - Builds URLs for specific sectors

**Reference Implementation**: `src/components/weather/WeatherMap.jsx` properly uses these utilities

**Required Changes**:
1. Accept `citySlug` and `cityName` as props
2. Look up city coordinates from cities.js config
3. Use `getGOESConfig()` to determine satellite and sector
4. Build URLs dynamically instead of hardcoding

---

### 6. No Error Handling (Severity: MEDIUM)
**Location**: `SatelliteWidget.jsx:130-137` (image rendering)
**Issue**: No error state if images fail to load
**Impact**: Silent failures leave users with blank space and no explanation

**Current Implementation**:
```jsx
<img
  src={imageUrl}
  alt={`${SATELLITE_PRODUCTS[activeTab].name} satellite imagery`}
  className="w-full h-auto"
  loading="lazy"
/>
```

**Missing**:
- `onError` handler
- Error state in component state
- Error UI with retry button
- Fallback message

**Required Addition**:
```jsx
const [imageError, setImageError] = useState(false);

const handleImageError = () => {
  setImageError(true);
};

const handleRetry = () => {
  setImageError(false);
  updateImageUrl();
};

// In render:
{imageError ? (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="text-orange-500 mb-2" size={32} />
    <p className="text-white/75 mb-3">Failed to load satellite image</p>
    <button onClick={handleRetry} className="btn-primary">
      Retry
    </button>
  </div>
) : (
  <img
    src={imageUrl}
    alt="..."
    onError={handleImageError}
    className="w-full h-auto"
  />
)}
```

---

## Medium Priority Issues

### 7. Design System Inconsistency (Severity: MEDIUM)
**Location**: Lines 92, 102, 119, 149
**Issue**: Uses `orange-500` accent color instead of project standard `blue-400`

**Project Design System** (per `docs/DESIGN_GUIDELINES.md`):
- Primary accent: Blue (`#007AFF` / `blue-400`)
- Orange: Reserved for temperature-related data only
- Interactive elements: Should use blue highlights

**Current Usage**:
```jsx
className="bg-orange-500 text-white"  // Still/Animated toggle
className="bg-orange-500 text-white"  // Active tab
className="hover:text-orange-500"     // Refresh button
```

**Required Changes**:
Replace all `orange-500` with `blue-400`:
```jsx
className="bg-blue-400 text-white"
className="hover:text-blue-400"
className="hover:border-blue-400/50"
```

---

### 8. Missing Loading State (Severity: LOW)
**Issue**: No skeleton or spinner while images load
**Impact**: Blank space during initial load and tab switches

**Required Addition**:
```jsx
const [isLoading, setIsLoading] = useState(true);

<img
  onLoad={() => setIsLoading(false)}
  onError={handleImageError}
  className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}
/>

{isLoading && <div className="skeleton h-64 w-full" />}
```

---

### 9. Accessibility Issues (Severity: LOW)
**Issues**:
- Missing ARIA labels on tab buttons (lines 113-126)
- Refresh button lacks disabled cursor styling
- No keyboard navigation support for product tabs

**Required Additions**:
```jsx
<button
  role="tab"
  aria-selected={activeTab === key}
  aria-label={`Show ${product.name} imagery`}
  // ...
>
```

---

### 10. Missing PropTypes (Severity: LOW)
**Issue**: No runtime prop validation
**Required Addition**:
```jsx
import PropTypes from 'prop-types';

SatelliteWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
};
```

---

## Research Required

### NOAA GOES Satellite Products
Need to research and document:
1. **Air Mass RGB** - What does it show? How to interpret colors?
2. **GeoColor** - True color vs enhanced color? Day/night differences?
3. **Water Vapor** - Which atmospheric level? What to look for?
4. **Infrared** - Temperature interpretation, cloud top heights?

**Research Sources**:
- https://www.goes.noaa.gov/
- https://www.star.nesdis.noaa.gov/GOES/
- Product interpretation guides for each band
- Educational resources for meteorological interpretation

### Animation Direction Investigation
- Why are GIFs reversed?
- Are there alternative URLs with correct chronology?
- What's the standard NOAA CDN structure?
- Should we build custom animation instead?

---

## Implementation Checklist

### Phase 1: Critical Fixes
- [ ] Add widget to WidgetRegistry with proper size constraints
- [ ] Investigate and fix GIF animation direction
- [ ] Add GOES website external link
- [ ] Implement error handling with retry

### Phase 2: Regional Support
- [ ] Accept citySlug/cityName props
- [ ] Integrate with satellite.js utilities
- [ ] Use getGOESConfig for satellite/sector selection
- [ ] Build dynamic URLs instead of hardcoding

### Phase 3: Polish
- [ ] Fix color scheme to use blue-400
- [ ] Add loading skeletons
- [ ] Add ARIA labels and keyboard navigation
- [ ] Add PropTypes validation
- [ ] Add tooltips with product explanations

### Phase 4: Documentation
- [ ] Research NOAA GOES products and interpretation
- [ ] Add inline help text or info icons
- [ ] Document satellite product meanings for users
- [ ] Create user guide for the widget

---

## Notes

### Existing Infrastructure
The project already has robust satellite utilities in `src/utils/satellite.js`:
- `getGOESConfig(lon, lat)` - Satellite and sector selection
- `getAvailableSectors(lon, lat)` - Regional sector options
- `generateFrameUrl()` - Build specific frame URLs
- `preloadImage()` - Preload for smooth animation

The **WeatherMap** component (`src/components/weather/WeatherMap.jsx`) successfully uses these utilities. SatelliteWidget should follow the same pattern.

### Design Precedent
Other large widgets (Live Market Brackets, Forecast Models) use:
- `defaultW: 4-6` (1/3 to 1/2 width)
- `minW: 3-4` (minimum 1/4 width)
- Satellite widget needs more space due to imagery detail

### Testing Requirements
Once fixes are implemented:
1. Visual test in narrow column (minW enforcement)
2. Visual test at full width (maxW = 12)
3. Test all 4 satellite products
4. Test still vs animated modes
5. Test manual refresh
6. Test error state (disconnect network)
7. Test animation direction (forward chronology)
8. Test external GOES link
9. Test on multiple cities (regional sectors)

---

## Related Files
- `src/components/widgets/SatelliteWidget.jsx` - Main component
- `src/utils/satellite.js` - Satellite URL utilities
- `src/config/WidgetRegistry.js` - Widget registration
- `src/config/cities.js` - City coordinates for sector selection
- `src/components/weather/WeatherMap.jsx` - Reference implementation
- `docs/DESIGN_GUIDELINES.md` - Design system documentation
