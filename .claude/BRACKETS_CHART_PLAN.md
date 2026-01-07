# Market Brackets Chart Implementation Plan
**Branch**: `feature/brackets-chart-fix`
**Target**: Add multi-bracket price history chart to expanded widget view

---

## Problem Statement

The Market Brackets widget's **inline expanded view** is missing the critical price history chart that exists in the modal view. This severely limits trading utility.

### Current State
- ✅ Modal view: Includes `MultiBracketChart` with period selection
- ❌ Inline expanded view: Shows only bracket list + stats sidebar
- ❌ No price history visualization in expanded widget
- ❌ No period selection for historical analysis

### Visual Evidence
Screenshot: `.playwright-mcp/brackets-expanded-no-chart.png`

---

## Why This Matters (Quant Trader Perspective)

### Trading Decisions Require Price History

**Without the chart, I cannot:**
1. **Identify momentum** - Is the leading bracket gaining or losing probability?
2. **Spot value opportunities** - Are brackets mispriced relative to recent movement?
3. **Assess market conviction** - Is this a stable consensus or volatile?
4. **Time entries/exits** - When did the market move and how fast?
5. **Compare bracket dynamics** - Which brackets are correlated? Which move independently?
6. **Analyze volatility** - How much are probabilities fluctuating?

### Key Trading Use Cases

**Fade vs Follow Strategy**
- If leading bracket went 60% → 94% in 1 hour → **fade** (overreaction)
- If leading bracket steadily climbed 70% → 94% over 6 hours → **follow** (informed flow)

**Arbitrage Detection**
- If two adjacent brackets (41-42° and 43-44°) diverge significantly on the chart → potential arb
- If probabilities don't sum to ~100% over time → mispricin

**Risk Management**
- High volatility on chart → use wider stops, smaller size
- Stable chart → tighter stops, larger size

**Timeframe Analysis**
- 1h view: Intraday noise vs signal
- 6h view: Session trends
- 1d view: Full market day pattern
- 1w view: Macro shifts, new information incorporation
- all: Full market lifecycle

### Why Inline Expansion Matters

**Dashboard workflow:**
1. Scan all widgets quickly (collapsed view)
2. Expand interesting widget **inline** to see chart
3. Make quick trading decision
4. Collapse and move to next widget

**vs Modal workflow (slower):**
1. Scan all widgets
2. Click to open modal (covers entire screen)
3. View chart
4. Close modal
5. Lose context of other widgets

**Inline = faster iteration = better trading**

---

## Technical Implementation

### 1. Add Hook to ExpandedBracketsInline

**Location**: `src/components/weather/MarketBrackets.jsx:350`

**Add state for chart period:**
```javascript
const [chartPeriod, setChartPeriod] = useState('1d');
```

**Add the data fetching hook:**
```javascript
const {
  data: chartData,
  legendData,
  bracketColors,
  loading: chartLoading,
} = useKalshiMultiBracketHistory(seriesTicker, brackets, chartPeriod, 4, true);
```

**Import at top:**
```javascript
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import MultiBracketChart from './MultiBracketChart';
```

### 2. Integrate Chart Component

**Location**: Insert after header, before content section (around line 477)

**Layout Structure:**
```
<div className="glass-widget h-full flex flex-col">
  {/* Header - existing */}

  {/* NEW: Chart Section */}
  <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
    <MultiBracketChart
      data={chartData}
      legendData={legendData}
      bracketColors={bracketColors}
      period={chartPeriod}
      onPeriodChange={setChartPeriod}
      loading={chartLoading}
      cityName={cityName}
    />
  </div>

  {/* Content: Two-column layout - existing */}
</div>
```

### 3. Layout Considerations

**Current layout:**
- Header (flex-shrink-0)
- Content (flex-1, overflow-hidden)
  - Brackets list (flex-1, overflow-y-auto)
  - Stats sidebar (w-36, flex-shrink-0)

**New layout:**
- Header (flex-shrink-0)
- **Chart (flex-shrink-0, h-auto)** ← NEW
- Content (flex-1, overflow-hidden)
  - Brackets list (flex-1, overflow-y-auto)
  - Stats sidebar (w-36, flex-shrink-0)

**Why this works:**
- Chart has fixed height (~240px including controls)
- Remaining space flexes for scrollable bracket list
- No layout shift or overflow issues

### 4. Chart Component Props

The `MultiBracketChart` component expects:
- `data`: Array of {timestamp, [bracketLabel]: price, timeLabel}
- `legendData`: Array of {label, color, currentPrice}
- `bracketColors`: Object mapping bracket labels to colors
- `period`: String ('1h', '6h', '1d', '1w', 'all')
- `onPeriodChange`: Function to update period
- `loading`: Boolean
- `cityName`: String (for screenshot caption)

All of these are provided by `useKalshiMultiBracketHistory` hook.

---

## Implementation Steps

### Phase 1: Code Integration
1. ✅ Review existing code (DONE)
2. Add imports to `MarketBrackets.jsx`
3. Add hook and state to `ExpandedBracketsInline` component
4. Insert `MultiBracketChart` component into layout
5. Verify prop passing

### Phase 2: Testing
1. Start dev server
2. Navigate to city dashboard (e.g., New York)
3. Click expand icon on Market Brackets widget
4. Verify chart appears with:
   - ✅ Multiple bracket lines rendered
   - ✅ Legend showing current prices
   - ✅ Period selector (1H/6H/1D/1W/ALL)
   - ✅ Tooltip on hover
   - ✅ Loading state
   - ✅ Screenshot button
5. Test period switching:
   - Click each period button
   - Verify chart updates with correct timeframe
   - Verify X-axis labels adjust appropriately
6. Test with different cities
7. Test with tomorrow's market (dayOffset=1)

### Phase 3: Edge Cases
- Empty data (no price history) → "No price history available"
- API error → Chart shows error state
- Rate limiting (429) → Graceful degradation
- Single bracket → Chart still renders
- Many brackets → Only top 4 shown (by probability)

---

## Expected Behavior

### Normal Operation
1. User clicks maximize icon on brackets widget
2. Widget expands inline
3. Chart loads (200-400ms delay for API calls)
4. Shows top 4 brackets by probability
5. Default period: 1d (24 hours of 1-hour candles)
6. User can switch periods to zoom in/out

### Chart Features
- **Lines**: Top 4 brackets colored (blue palette + accent)
- **Legend**: Shows bracket labels with current prices
- **X-axis**: Time labels (format adapts to period)
- **Y-axis**: Percentage (0-100%)
- **Tooltip**: Shows exact price at timestamp for all brackets
- **Period selector**: 1H/6H/1D/1W/ALL buttons
- **Screenshot button**: Captures chart for research notes

### Trading Workflow
1. Dashboard shows all widgets collapsed
2. Trader spots interesting bracket odds
3. Clicks expand on brackets widget
4. **Chart loads** ← NEW - immediately see price history
5. Analyzes momentum, volatility, correlation
6. Makes trading decision
7. Collapses widget and moves on

---

## Risk Mitigation

### API Rate Limiting
- Hook already implements 200ms delay between requests
- Fetches top 4 brackets only (not all 6)
- Caches data in component state
- User can manually refetch if needed

### Performance
- Chart component is optimized (React memoization)
- Data transformation happens in hook
- No re-renders unless period changes
- Lazy loading via code splitting (already done for modal)

### Layout
- Chart has fixed height, won't cause overflow
- Brackets list remains scrollable below
- Works with existing grid expansion system

### Fallback
- If chart fails to load, widget still functional
- Bracket list and stats sidebar always visible
- Error message in chart area if API fails

---

## Success Criteria

✅ **Functionality**
- Chart renders in expanded inline view
- Shows top 4 brackets by probability
- Period selection works (all 5 periods)
- Data updates when switching days (today/tomorrow)
- Tooltip shows accurate prices
- Legend displays current odds

✅ **UX**
- No layout shift when chart loads
- Loading state is clear
- Chart doesn't overlap other widgets
- Smooth period transitions
- Screenshot feature works

✅ **Performance**
- Chart loads within 500ms (with data)
- No jank when expanding widget
- Responsive to period changes

✅ **Visual Design**
- Matches glassmorphism design system
- Chart colors harmonize with theme
- Typography consistent
- Spacing balanced

---

## Trading Impact Analysis

### Before (Current State)
**Decision time**: ~30 seconds
1. See brackets (5s)
2. Open modal to view chart (3s)
3. Analyze chart (15s)
4. Close modal (2s)
5. Lose context, refocus (5s)

**Cognitive load**: HIGH
- Context switching (dashboard → modal → dashboard)
- Cannot compare with other widgets while chart open
- Slower iteration across multiple cities

### After (With Chart)
**Decision time**: ~12 seconds
1. Expand widget inline (1s)
2. See chart + brackets simultaneously (0s)
3. Analyze (10s)
4. Collapse (1s)

**Cognitive load**: LOW
- No context switching
- Can see chart + other widgets
- Faster multi-city analysis
- Better pattern recognition across markets

**Expected improvement**: ~2.5x faster per decision
- 8 decisions/day before → **20 decisions/day after**
- More opportunities identified
- Better trade timing

---

## Quant Meteorologist Perspective

### Information Architecture
The chart answers the critical question: **"How did we get here?"**

Current odds (94% for 41-42°) are **outcome** not **process**.

Chart reveals:
- **Process**: Did it spike suddenly (news) or grind up (fundamentals)?
- **Context**: Where were we 1h, 6h, 24h ago?
- **Momentum**: Accelerating, decelerating, stable?
- **Conviction**: Volatile (uncertain) or stable (confident)?

### Pattern Recognition
With chart visible:
1. **Weather regime changes** → sharp moves on chart
2. **Model updates** → step functions at 12Z/00Z
3. **Observation data** → hourly bumps at :51
4. **Smart money** → smooth accumulation
5. **Retail panic** → spiky volatility

### Multi-Market Strategy
With inline charts:
- Open 3 city dashboards
- Expand brackets on each
- **Compare charts side by side**
- Identify correlated vs diverging markets
- Deploy capital to highest alpha opportunity

**This workflow is impossible with modals** (only one modal at a time)

---

## Notes

- The chart is already built and tested (used in modal)
- The hook is production-ready with error handling
- Integration is low-risk (adding, not modifying)
- Fallback is graceful (widget works without chart)
- Benefits are immediate (better trading decisions)

## File Changes

**Modified**:
- `src/components/weather/MarketBrackets.jsx` - Add chart to `ExpandedBracketsInline`

**No new files needed** - All components and hooks already exist

---

**Status**: Ready to implement
**Estimated time**: 15-20 minutes
**Risk level**: LOW (additive change, well-tested components)
