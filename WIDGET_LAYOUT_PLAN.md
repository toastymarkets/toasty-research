# Widget Layout Optimization Plan

## Current System Analysis

### GlassWidget Sizes (Height)
```
small:  min-h-[120px]  (~1 row)
medium: min-h-[120px]  (~1 row)
large:  min-h-[260px]  (~2 rows)
```

### WidgetGrid Spans (Width)
```
span=1: 1 column (25% on desktop)
span=2: 2 columns (50% on desktop)
span=3: 3 columns (75% on desktop)
span=4: 4 columns (100% - full width)
```

### Current Issue
- Only controls WIDTH (span) and MIN-HEIGHT (size)
- No way to make widgets span multiple ROWS
- Widgets stretch to fill row height (causes ugly stretching)
- No consistent "filler" widget system

---

## Proposed: Apple Weather-Style Widget System

### New Widget Size Classes

| Size | Width | Height | Use Case |
|------|-------|--------|----------|
| `xs` | 1 col | 1 row (~120px) | UV, Humidity, Pressure, Visibility |
| `sm` | 2 col | 1 row (~120px) | Forecast summary, Rounding |
| `md` | 1 col | 2 rows (~260px) | Models, Discussion (stacked content) |
| `lg` | 2 col | 2 rows (~260px) | Maps, Nearby Stations, Market Brackets |
| `xl` | 4 col | 1 row (~100px) | Observations banner |

### Visual Grid (4 columns × N rows)

```
┌─────────────────────────────────────────────────────┐
│              OBSERVATIONS (xl: 4×1)                 │  Row 1
├────────────┬────────────┬───────────────────────────┤
│  MODELS    │  MARKET    │     WEATHER MAP           │  Row 2
│  (md: 1×2) │  BRACKETS  │     (lg: 2×2)             │
│            │  (md: 1×2) │                           │
├────────────┼────────────┤                           │  Row 3
│ DISCUSSION │            │                           │
│  (stacked) │            │                           │
├────────────┴────────────┼─────────────┬─────────────┤
│    NEARBY STATIONS      │    NEWS     │   WIND      │  Row 4
│    (lg: 2×2)            │  (md: 1×2)  │  (xs: 1×1)  │
│                         │             ├─────────────┤
│                         │             │  HUMIDITY   │  Row 5
│                         │             │  (xs: 1×1)  │
├─────────────┬───────────┼─────────────┼─────────────┤
│  PRESSURE   │VISIBILITY │  FORECAST   │  ROUNDING   │  Row 6
│  (xs: 1×1)  │ (xs: 1×1) │  (xs: 1×1)  │  (xs: 1×1)  │
└─────────────┴───────────┴─────────────┴─────────────┘
```

---

## Implementation Approach

### Option A: CSS Grid with Named Areas (Recommended)
Define explicit grid template with named areas:

```css
.widget-grid-v2 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto;
  gap: 8px;
  grid-template-areas:
    "obs      obs      obs      obs"
    "models   brackets map      map"
    "discuss  brackets map      map"
    "nearby   nearby   news     wind"
    "nearby   nearby   news     humidity"
    "pressure visible  forecast rounding";
}
```

**Pros**: Precise control, easy to rearrange, explicit layout
**Cons**: Less flexible for dynamic widgets

### Option B: Subgrid Approach
Use nested grids for widget groups:

```jsx
<WidgetGrid>
  <WidgetGroup cols={2} rows={2}>
    <ModelsWidget />
    <DiscussionWidget />
    <MarketBracketsWidget tall />
  </WidgetGroup>
  <WeatherMap span={2} tall />
  ...
</WidgetGrid>
```

**Pros**: More flexible, reusable patterns
**Cons**: More complex nesting

---

## Widget-Specific Changes

### 1. Market Brackets (Vertical Layout)
**Current**: Horizontal (span=2, short)
**New**: Vertical (span=1, tall/md)

Changes needed:
- Stack brackets vertically instead of horizontally
- Remove "Today/Tomorrow" tabs → use single column with date label
- Condense header
- Keep all bracket functionality

```
┌─────────────────┐
│ MARKET BRACKETS │
│ Today           │
├─────────────────┤
│ ≤30°      0%    │
│ 31-32°   34%    │
│ 33-34°   62% ← │
│ 35-36°    3%    │
│ ≥37°      0%    │
├─────────────────┤
│ Closes 9h 12m   │
└─────────────────┘
```

### 2. Models Widget (Standalone)
**Current**: Stacked with Forecast
**New**: Standalone vertical widget (md: 1×2)

### 3. Discussion Widget
**Current**: Span=1, stretches
**New**: Fixed height, pairs with Models in left column

### 4. News Widget (NEW)
**Features**:
- NWS Alerts (from existing alerts API)
- Weather news RSS feed (future)
- Scrollable content area

### 5. Filler Widgets (xs size)
These fill gaps and can be rearranged:
- Wind (xs) - simplified, no compass
- Humidity (xs)
- Pressure (xs)
- Visibility (xs)
- Forecast (xs) - just temp + condition
- Rounding (xs)

---

## Questions for You

1. **Models + Discussion pairing**: Should these always stack together in the left column, or be independent?

2. **News widget priority**: Should alerts be shown first (with red styling), then news items below?

3. **Filler widget behavior**: On mobile, should filler widgets:
   - Stack in a 2-column mini-grid?
   - Hide some and show "More" button?
   - Show all in scrollable row?

4. **Market Brackets tabs**: In the vertical layout, should we:
   - Remove tabs entirely (just show today)?
   - Use a small toggle at top?
   - Use swipe to switch days?

5. **Row height consistency**: Should all rows be exactly the same height, or allow some variation (like Apple does)?

---

## Implementation Steps

1. **Phase 1: Grid System Update**
   - Create new `WidgetGridV2` component with CSS Grid areas
   - Add new size variants to `GlassWidget`
   - Test responsive behavior

2. **Phase 2: Widget Reformatting**
   - Update MarketBrackets for vertical layout
   - Separate Models and Forecast widgets
   - Update Discussion widget sizing

3. **Phase 3: News Widget**
   - Create NWSAlertsWidget component
   - Add API hook for NWS alerts
   - Design alert card UI

4. **Phase 4: Filler Widgets**
   - Create simplified "xs" versions of Wind, Humidity, etc.
   - Test grid placement

5. **Phase 5: Polish**
   - Mobile responsive adjustments
   - Animation/transitions
   - Final spacing tweaks
