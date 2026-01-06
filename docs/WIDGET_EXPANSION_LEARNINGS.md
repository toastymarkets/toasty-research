# Widget Expansion Pattern Learnings

This document captures the patterns, techniques, and learnings from implementing inline widget expansion. Use this as a reference when implementing expansion for other widgets.

## Overview

**Problem:** Modal/overlay patterns create visual disconnection from the dashboard context.

**Solution:** Inline expansion where widgets expand within the grid, displacing other widgets rather than overlaying them.

**Key Insight:** Multiple widgets can expand simultaneously on desktop/tablet, with modal fallback on mobile.

---

## Multi-Expansion State Management

### State Structure

```jsx
// In CityDashboardNew.jsx
const [expandedWidgets, setExpandedWidgets] = useState({
  discussion: false,
  models: false,
  brackets: false,
  rounding: false,
  resolution: false,
  wind: false,
  rain: false,
  map: false,
  forecast: false,
  alerts: false,
});

// Toggle expansion for a specific widget
const toggleExpansion = (widgetId) => {
  setExpandedWidgets(prev => ({
    ...prev,
    [widgetId]: !prev[widgetId]
  }));
};
```

**Key Points:**
- Use an object with boolean values for each widget
- Multiple widgets can be `true` simultaneously
- Pass `expandedWidgets` object to `WidgetGridV2` for CSS class generation

### Passing Props to Widgets

```jsx
<WidgetGridV2.Area
  area="models"
  isExpanded={expandedWidgets.models}
>
  <ModelsWidget
    citySlug={citySlug}
    isExpanded={expandedWidgets.models}
    onToggleExpand={() => toggleExpansion('models')}
  />
</WidgetGridV2.Area>
```

---

## Grid Position Preservation (Critical Fix)

### The Problem
Widgets were flowing to the bottom of the grid when expanded instead of expanding in place.

### The Cause
```jsx
// BROKEN: Removing gridArea caused widget to lose position
style={{ gridArea: isExpanded ? undefined : area }}
```

### The Solution
```jsx
// FIXED: Always keep gridArea, use CSS classes for expansion
function WidgetGridArea({ area, children, isExpanded }) {
  const expansionClass = isExpanded ? `widget-area-${area}-expanded` : '';

  return (
    <div
      className={`widget-expansion-transition ${expansionClass}`}
      style={{ gridArea: area }}  // ALWAYS keep the grid area
    >
      {children}
    </div>
  );
}
```

### CSS Class Generation
```jsx
// In WidgetGridV2
export default function WidgetGridV2({ children, expandedWidgets = {} }) {
  // Build class names from expanded widgets
  const expansionClasses = Object.entries(expandedWidgets)
    .filter(([, isExpanded]) => isExpanded)
    .map(([widgetId]) => `${widgetId}-expanded`);

  const gridClassName = [
    'widget-grid-v2',
    ...expansionClasses,  // e.g., 'models-expanded', 'brackets-expanded'
  ].join(' ');

  return <div className={gridClassName}>{children}</div>;
}
```

---

## CSS Grid Layout Definitions

### Default Layout (4 columns)
```css
.widget-grid-v2 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-areas:
    "models       brackets     map         map"
    "discussion   brackets     map         map"
    "nearby       nearby       alerts      smallstack"
    "pressure     visibility   forecast    rounding";
  gap: 8px;
}
```

### Single Widget Expanded
```css
/* Models expanded - takes 2×2 */
.widget-grid-v2.models-expanded {
  grid-template-areas:
    "models       models       brackets    map"
    "models       models       brackets    map"
    "discussion   discussion   alerts      smallstack"
    "nearby       nearby       alerts      smallstack"
    "pressure     visibility   forecast    rounding";
}

/* Brackets expanded - takes 2×2 */
.widget-grid-v2.brackets-expanded {
  grid-template-areas:
    "models       brackets     brackets    map"
    "discussion   brackets     brackets    map"
    "nearby       nearby       alerts      smallstack"
    "pressure     visibility   forecast    rounding";
}
```

### Multiple Widgets Expanded
```css
/* Both Models AND Brackets expanded - 5 columns */
.widget-grid-v2.models-expanded.brackets-expanded {
  grid-template-columns: repeat(5, 1fr);
  grid-template-areas:
    "models       models       brackets    brackets    map"
    "models       models       brackets    brackets    map"
    "discussion   discussion   alerts      alerts      smallstack"
    "nearby       nearby       forecast    forecast    rounding"
    "pressure     visibility   forecast    forecast    rounding";
}
```

### Min-Height for Expanded Widgets
```css
.widget-grid-v2.models-expanded .widget-area-models-expanded {
  min-height: 380px;
}

.widget-grid-v2.brackets-expanded .widget-area-brackets-expanded {
  min-height: 320px;
}
```

---

## Widget Component Pattern

### Dual Render Mode with Mobile Detection

```jsx
function ModelsWidget({ isExpanded, onToggleExpand, ...props }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simple mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handle widget click
  const handleWidgetClick = () => {
    if (isMobile) {
      setIsModalOpen(true);  // Mobile: use modal
    } else if (onToggleExpand) {
      onToggleExpand();       // Desktop: inline expand
    } else {
      setIsModalOpen(true);   // Fallback: modal
    }
  };

  // Render expanded inline view on desktop
  if (isExpanded && !isMobile) {
    return (
      <ExpandedModelsInline
        {...props}
        onCollapse={onToggleExpand}
      />
    );
  }

  // Render compact widget
  return (
    <>
      <GlassWidget onClick={handleWidgetClick}>
        {/* Compact content */}
      </GlassWidget>

      {/* Modal for mobile */}
      {isModalOpen && (
        <ModelsDetailModal
          onClose={() => setIsModalOpen(false)}
          {...props}
        />
      )}
    </>
  );
}
```

### Expanded Inline Component Structure

```jsx
function ExpandedModelsInline({ onCollapse, ...props }) {
  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Icon />
          <span className="text-sm font-semibold">Widget Title</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Expanded content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Full widget content here */}
      </div>
    </div>
  );
}
```

---

## Widget Sizing & Flexibility

See [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md#widget-grid-system) for full sizing documentation.

### Quick Reference

| Widget | Compact Size | Expanded Size | Flexibility | Notes |
|--------|--------------|---------------|-------------|-------|
| Observations | Full width | N/A | Fixed | No expansion |
| Models | M (2×1) | L (2×2) | Semi-flex | Chart + model grid |
| Brackets | M (1×2) | L (2×2) | Semi-flex | Chart + scrollable brackets |
| Discussion | M (1×1) | XL (3×2) | Semi-flex | Tabbed sections |
| Satellite/Map | L (2×2) | XL (3×3) | Rigid | Leaflet map, special handling |
| Nearby Stations | M (2×1) | L (2×2) | Rigid | Not yet implemented |
| Wind | S (1×1) | M (2×2) | Flexible | Chart + observations table |
| Resolution | S (1×1) | M (2×2) | Flexible | CLI/DSM tabs with countdown |
| Rounding | S (1×1) | M (2×2) | Flexible | Tabs with calculator |
| Forecast | S (1×1) | L (2×2) | Semi-flex | 10-period scrollable list |
| Alerts | S (1×2) | M (2×2) | Flexible | Alerts/News tabs |
| Rain | S (1×1) | M (2×2) | Flexible | Monthly/Seasonal tabs with charts |

### Expansion Displacement Priority

When space is needed, displace in this order:
1. **Flexible widgets** - Can shrink to XS or move
2. **Rigid widgets** - Move to next row, keep size
3. **Fixed widgets** - Never move (Observations)

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/CityDashboardNew.jsx` | Multi-expansion state object, `toggleExpansion()` helper |
| `src/components/weather/WidgetGridV2.jsx` | `expandedWidgets` prop, CSS class generation, fixed gridArea handling |
| `src/styles/liquid-glass.css` | Grid templates for each expansion combination |
| `src/components/weather/ModelsWidget.jsx` | `isExpanded`, `onToggleExpand` props, `ExpandedModelsInline` component |
| `src/components/weather/MarketBrackets.jsx` | Same pattern as ModelsWidget |
| `src/components/weather/RoundingWidget.jsx` | Expansion props, `ExpandedRoundingInline` with tabs |
| `src/components/weather/ResolutionWidget.jsx` | Expansion props, `ExpandedResolutionInline` with CLI/DSM tabs |
| `src/components/weather/SmallWidgets.jsx` | WindWidget expansion with chart and observations table |
| `src/components/widgets/RainWidget.jsx` | Expansion props, `ExpandedRainInline` with monthly/seasonal tabs |
| `src/components/weather/NWSForecastWidget.jsx` | Expansion props, `ExpandedForecastInline` with 7-day list |
| `src/components/weather/AlertsWidget.jsx` | Expansion props, `ExpandedAlertsInline` with alerts/news tabs |

---

## Responsive Considerations

### Desktop (≥1024px)
- Full multi-expansion support
- 4-5 column grid
- Multiple widgets can expand simultaneously

### Tablet (768px - 1023px)
- Multi-expansion supported
- 2-3 column grid
- Expanded widgets take more relative space

### Mobile (<768px)
- **No inline expansion** - use full-screen modal
- Single column grid
- Touch-friendly tap targets

```jsx
// Mobile detection pattern
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

if (isMobile) {
  // Open modal instead of inline expansion
  setIsModalOpen(true);
} else {
  // Inline expansion
  onToggleExpand();
}
```

---

## Animation & Transitions

### Content Transitions
```css
.widget-expansion-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Grid Limitations
- `grid-template-areas` changes are **instant** (no CSS animation)
- Use content opacity/transform transitions to smooth the experience
- Consider fade-out displaced widgets, then fade-in expanded content

---

## What Worked Well

1. **Object-based expansion state** - Clean tracking of multiple expansions
2. **CSS class composition** - `models-expanded brackets-expanded` naturally combines
3. **gridArea preservation** - Widgets stay in position, CSS handles expansion
4. **Explicit grid-template-areas** - Full control over every expansion combination
5. **Mobile fallback** - Keeps modals for small screens where inline doesn't work

## Known Issues

### Recharts Dimension Warnings
**Symptom:** Console warnings "width(-1) and height(-1) of chart should be greater than 0" during widget expansion.

**Cause:** When a widget expands/collapses, Recharts may briefly receive negative dimensions during the CSS transition.

**Impact:** Non-blocking, visual-only. Charts render correctly after transition completes.

**Workaround:** None required. Could add `minWidth`/`minHeight` to ResponsiveContainer if warnings are excessive.

### Click Target Confusion (ModelsWidget)
**Issue:** Clicking on model cards shows tooltips instead of expanding the widget. Users must click the header area specifically.

**Root Cause:** Model cards have their own click handlers for tooltips, which prevent event bubbling.

**Recommendation:** Consider adding an expand icon button in the header that's clearly distinguishable from content interactions.

---

## Gotchas & Things to Watch

1. **Always keep gridArea** - Never remove it when expanded, or widget flows to bottom

2. **CSS combinatorics** - Need grid definitions for each expansion combination
   - 2 widgets = 3 layouts (A, B, A+B)
   - 3 widgets = 7 layouts (A, B, C, A+B, A+C, B+C, A+B+C)
   - Consider: Not all combinations need explicit layouts; grid-auto-flow can handle many cases

3. **Min-height for expanded** - Prevent collapse during data loading

4. **Scroll into view** - Large expansions can push content off-screen

5. **Mobile detection** - Use simple window.innerWidth, not resize listeners (causes re-renders)

6. **Tab state preservation** - Expanded widgets with tabs (Rain, Alerts) reset to default tab on collapse/re-expand. Consider persisting tab state if needed.

7. **Chart resizing** - Recharts components need parent containers with explicit dimensions. Use `ResponsiveContainer` with height props, not just CSS.

---

## Adding Expansion to a New Widget

1. **Add to state object** in `CityDashboardNew.jsx`:
   ```jsx
   const [expandedWidgets, setExpandedWidgets] = useState({
     ...existing,
     newWidget: false,  // Add this
   });
   ```

2. **Define CSS grid layouts** in `liquid-glass.css`:
   ```css
   .widget-grid-v2.newWidget-expanded { ... }
   .widget-grid-v2.models-expanded.newWidget-expanded { ... }
   /* Add combinations as needed */
   ```

3. **Update widget component**:
   ```jsx
   function NewWidget({ isExpanded, onToggleExpand, ...props }) {
     const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

     if (isExpanded && !isMobile) {
       return <ExpandedNewWidgetInline onCollapse={onToggleExpand} {...props} />;
     }
     return <CompactNewWidget onClick={...} {...props} />;
   }
   ```

4. **Pass props from dashboard**:
   ```jsx
   <WidgetGridV2.Area area="newWidget" isExpanded={expandedWidgets.newWidget}>
     <NewWidget
       isExpanded={expandedWidgets.newWidget}
       onToggleExpand={() => toggleExpansion('newWidget')}
     />
   </WidgetGridV2.Area>
   ```

5. **Create expanded inline component** with collapse button and full content
