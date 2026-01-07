# Satellite Widget Inline Expansion Plan
**Branch**: `feature/satellite-widget-enhancement`
**Target**: Add inline expansion to satellite map widget

---

## Problem Statement

The satellite map widget currently only supports modal popup for expanded view. This creates context switching that breaks the trader's workflow - they lose visibility of other widgets while viewing satellite imagery.

### Current State
- ✅ Custom frame-by-frame animation (18 frames, 3 hours of history)
- ✅ Animation plays in correct chronological order (oldest → newest)
- ✅ Band selection (AirMass, GeoColor, Sandwich)
- ✅ Sector selection (Local, East US, Pacific)
- ❌ No inline expansion (only modal popup)
- ❌ Small 2x2 grid area limits detail visibility

---

## Solution: Inline Expansion (Vertical)

Follow the established pattern from Discussion, Models, and Brackets widgets.

**UPDATED 2026-01-06**: Changed from horizontal (3x3) to **vertical (2x3)** expansion to prevent squishing other widgets.

### Grid Layout Changes

**Default Layout (4-column)**:
```
models       brackets     map         map
discussion   brackets     map         map
nearby       nearby       alerts      smallstack
pressure     visibility   forecast    rounding
```

**Expanded Layout (4-column)** - Map expands vertically to 2x3:
```
models       brackets     map         map
discussion   brackets     map         map
nearby       nearby       map         map
pressure     visibility   forecast    rounding
```

**Key Changes**:
- Map grows from 2x2 to **2x3** (same width, more height)
- **Columns stay at 4** (no squishing of brackets or models!)
- `alerts` and `smallstack` are hidden (their row is taken by map row 3)
- Min-height increases from 268px to 400px when expanded

**Why vertical instead of horizontal?**
- Original 3x3 expansion created 5 columns, squishing brackets from 202px to 160px (21% smaller)
- Vertical expansion keeps the 4-column layout, preserving all widget widths
- Brackets and other widgets remain fully visible and usable

---

## Implementation Steps

### 1. CSS: Add `map-expanded` class to `liquid-glass.css`

Location: After `.widget-grid-v2.brackets-expanded` (~line 1014)

**IMPLEMENTED (2026-01-06)** - Using vertical expansion:

```css
/* Map widget expanded - 4 columns, map grows vertically (2x3) */
.widget-grid-v2.map-expanded {
  grid-template-areas:
    "models       brackets     map         map"
    "discussion   brackets     map         map"
    "nearby       nearby       map         map"
    "pressure     visibility   forecast    rounding";
}

.widget-grid-v2.map-expanded [style*="grid-area: map"] {
  min-height: 400px;
}

/* Hide alerts and smallstack when map expanded (map takes their row) */
.widget-grid-v2.map-expanded [style*="grid-area: alerts"],
.widget-grid-v2.map-expanded [style*="grid-area: smallstack"] {
  display: none;
}
```

### 2. WeatherMap.jsx: Add expansion props

**New props**:
```javascript
function WeatherMap({ cityName, citySlug, isExpanded, onToggleExpand })
```

**Add expand button** next to existing controls (satellite selector):

```javascript
{onToggleExpand && (
  <button
    onClick={onToggleExpand}
    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
    title={isExpanded ? "Collapse" : "Expand"}
  >
    {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
  </button>
)}
```

**Enhanced expanded view features**:
- Larger image size when expanded (1250px vs 625px)
- Show timestamp/frame counter
- Full band selector visible (not just icon)

### 3. CityDashboardNew.jsx: Wire up expansion state

**Add to expandedWidgets state**:
```javascript
const [expandedWidgets, setExpandedWidgets] = useState({
  discussion: false,
  models: false,
  brackets: false,
  map: false,  // ADD THIS
});
```

**Add toggle handler**:
```javascript
const toggleMapExpand = () => {
  setExpandedWidgets(prev => ({ ...prev, map: !prev.map }));
};
```

**Update grid className**:
```javascript
className={`widget-grid-v2 ${expandedWidgets.discussion ? 'discussion-expanded' : ''} ${expandedWidgets.models ? 'models-expanded' : ''} ${expandedWidgets.brackets ? 'brackets-expanded' : ''} ${expandedWidgets.map ? 'map-expanded' : ''}`}
```

**Pass props to WeatherMap**:
```javascript
<WeatherMap
  cityName={cityName}
  citySlug={citySlug}
  isExpanded={expandedWidgets.map}
  onToggleExpand={toggleMapExpand}
/>
```

---

## Enhanced Features (Expanded View)

When expanded, show additional information:

1. **Larger satellite image** - Switch from 625px to 1250px resolution
2. **Frame counter** - "Frame 12/18" indicator
3. **Timestamp** - Show approximate time of current frame
4. **Play/Pause** - Allow pausing animation for detailed inspection
5. **Full band selector** - Radio buttons instead of dropdown
6. **GOES website link** - Direct link to full NOAA viewer

---

## Animation Direction (Confirmed Correct)

The existing animation implementation is correct:

```javascript
// Frames generated from newest (i=0) to oldest (i=17)
for (let i = 0; i < 18; i++) {
  urls.push(generateFrameUrl(..., i * 10)); // 0, 10, 20... 170 minutes ago
}

// Array stored: [now, 10min ago, 20min ago, ..., 170min ago]
// Start at index = length-1 (oldest frame)
frameIndexRef.current = validUrls.length - 1;

// Cycle forward: oldest → newest (correct chronological order)
frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
```

**No fix needed** - animation plays from oldest to newest as expected.

---

## Risk Mitigation

### Layout Conflicts
- Only one widget expanded at a time? OR allow multiple?
- Current approach: Allow multiple (matches existing pattern)
- Hiding `alerts` and `smallstack` acceptable for expanded satellite view

### Image Loading
- 1250px images are ~4x larger than 625px
- Preload in background to avoid flash
- Show loading indicator during size transition

### Mobile Behavior
- Inline expansion doesn't work on mobile (too narrow)
- Fallback to modal on mobile (existing behavior)

---

## Success Criteria

✅ **Functionality**
- Click expand icon → map grows to 3x3
- Click collapse icon → map returns to 2x2
- Animation continues during expansion
- Band/sector selection works in both states

✅ **UX**
- No layout shift or jank
- Smooth transition
- Clear expand/collapse affordance
- Other widgets remain visible

✅ **Performance**
- Image size upgrade doesn't block UI
- Frame rate maintained (120ms interval)

---

## Files to Modify

1. `src/styles/liquid-glass.css` - Add `map-expanded` CSS class
2. `src/components/weather/WeatherMap.jsx` - Add expansion props and UI
3. `src/components/dashboard/CityDashboardNew.jsx` - Wire up state

---

**Status**: Ready to implement
