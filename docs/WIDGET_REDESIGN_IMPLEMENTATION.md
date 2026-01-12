# Widget Redesign: Implementation Plan

## Overview

This document details the specific code changes required to implement the quant meteorologist widget redesign. Changes are organized by phase with estimated complexity.

---

## Phase 1: Data Layer Enhancement

### 1.1 Settlement Station Observation Hook

**New File:** `src/hooks/useSettlementObservation.js`

```javascript
// Purpose: Fetch and track current temperature at settlement station
// Updates: Every 5 minutes (METAR refresh rate)
// Returns: { temperature, dewpoint, timestamp, isStale, trend }
```

**Key Features:**
- Fetch from NWS API `/stations/{stationId}/observations/latest`
- Calculate trend (rising/falling/steady) from last 3 observations
- Mark as stale if >15 minutes old
- City-to-station mapping (KLAX for LA, KORD for Chicago, etc.)

**Complexity:** Medium

---

### 1.2 Model-Market Edge Calculator

**New File:** `src/utils/edgeCalculator.js`

```javascript
// Purpose: Calculate edge between model probability and market price
// Input: Model forecasts, bracket prices
// Output: Per-bracket edge signal

export function calculateModelProbability(models, bracket) {
  // Count models falling in this bracket
  // Apply uncertainty distribution
  // Return probability 0-100
}

export function calculateEdge(modelProb, marketPrice) {
  // Returns: { edge: number, signal: 'underpriced' | 'overpriced' | 'fair' }
}
```

**Logic:**
1. For each bracket, count how many models predict within that range
2. Apply Gaussian smoothing for uncertainty
3. Compare to market price
4. Signal threshold: >10% difference = edge

**Complexity:** Medium

---

### 1.3 Model Historical Bias Data

**New File:** `src/data/modelBias.js`

```javascript
// Purpose: Store historical bias corrections per model per city
// Source: Manual research + historical verification

export const MODEL_BIAS = {
  'los-angeles': {
    GFS: { bias: +1, confidence: 'high', note: 'Tends warm in marine layer' },
    NBM: { bias: 0, confidence: 'high', note: 'Best for LA', star: true },
    ECMWF: { bias: -1, confidence: 'medium', note: 'Slightly cold' },
    // ...
  },
  'chicago': {
    // ...
  }
};
```

**Complexity:** Low (data entry)

---

### 1.4 Model Run Status Tracker

**New File:** `src/hooks/useModelRunStatus.js`

```javascript
// Purpose: Track when major models release new runs
// Models: GFS (4x daily), ECMWF (2x daily), NAM (4x daily)
// Returns: { runs: [], nextRun: Date, lastChange: { model, diff } }
```

**Key Features:**
- Track known model run schedules
- Detect when data updates (compare forecast values)
- Show countdown to next expected run

**Complexity:** Medium-High

---

## Phase 2: Market Brackets Widget Redesign

### 2.1 Update MarketBrackets.jsx

**File:** `src/components/weather/MarketBrackets.jsx`

**Changes:**

1. **Add Observation Badge (Header)**
```jsx
// New import
import { useSettlementObservation } from '../../hooks/useSettlementObservation';

// In component
const { temperature, trend, isStale } = useSettlementObservation(citySlug);

// In header
<div className="flex items-center gap-2">
  <span className="text-xs text-white/50">{SETTLEMENT_STATIONS[citySlug]}</span>
  <span className={`text-sm font-bold tabular-nums ${isStale ? 'text-amber-400' : 'text-cyan-400'}`}>
    {temperature}°
  </span>
  {trend === 'rising' && <TrendingUp className="w-3 h-3 text-orange-400" />}
  {trend === 'falling' && <TrendingDown className="w-3 h-3 text-blue-400" />}
</div>
```

2. **Add Edge Indicators to Bracket List**
```jsx
// Import edge calculator
import { calculateEdge, calculateModelProbability } from '../../utils/edgeCalculator';

// In bracket row
const modelProb = calculateModelProbability(forecasts?.models, bracket);
const edge = calculateEdge(modelProb, bracket.yesPrice);

// Render edge indicator
{edge.signal === 'underpriced' && (
  <span className="text-[10px] text-emerald-400">
    {edge.edge > 20 ? '🔻🔻' : '🔻'}
  </span>
)}
{edge.signal === 'overpriced' && (
  <span className="text-[10px] text-amber-400">
    {edge.edge > 20 ? '🔺🔺' : '🔺'}
  </span>
)}
```

3. **Add Observation Layer to Chart**
```jsx
// New hook for observation history
const { observations } = useObservationHistory(citySlug);

// Add to chart
<Line
  type="monotone"
  dataKey="observation"
  stroke="#22d3ee"
  strokeWidth={2}
  strokeDasharray="5 3"
  dot={{ r: 3, fill: '#22d3ee' }}
/>
```

4. **Add Settlement Footer**
```jsx
<div className="pt-2 mt-1 flex-shrink-0 border-t border-white/10 flex justify-between">
  <span className="text-[10px] text-white/40">
    Settlement: {SETTLEMENT_STATIONS[citySlug]} ({STATION_NAMES[citySlug]})
  </span>
  <span className="text-[10px] text-white/40">
    Closes {formatTime(closeTime)} PT
  </span>
</div>
```

**Complexity:** High

---

### 2.2 Add Settlement Station Config

**File:** `src/config/settlementStations.js`

```javascript
export const SETTLEMENT_STATIONS = {
  'los-angeles': 'KLAX',
  'chicago': 'KORD',
  'new-york': 'KJFK',
  'miami': 'KMIA',
  // ...
};

export const STATION_NAMES = {
  'KLAX': 'LAX Airport',
  'KORD': "O'Hare Airport",
  // ...
};
```

**Complexity:** Low

---

## Phase 3: Models Widget Redesign

### 3.1 Update ModelsWidget.jsx

**File:** `src/components/weather/ModelsWidget.jsx`

**Changes:**

1. **Add Visual Consensus Band**
```jsx
// New component: ConsensusBar
function ConsensusBar({ models, selectedDay }) {
  const highs = models.map(m => m.daily[selectedDay]?.high).filter(Boolean);
  const min = Math.min(...highs);
  const max = Math.max(...highs);
  const avg = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);

  // Render horizontal bar with model positions
  return (
    <div className="relative h-8 bg-white/5 rounded-lg">
      {/* Temperature scale */}
      <div className="absolute inset-x-2 top-1 flex justify-between text-[9px] text-white/30">
        <span>{min - 2}°</span>
        <span>{max + 2}°</span>
      </div>
      {/* Model dots */}
      {models.map(model => {
        const temp = model.daily[selectedDay]?.high;
        const position = ((temp - (min - 2)) / ((max + 2) - (min - 2))) * 100;
        return (
          <div
            key={model.id}
            className="absolute w-2 h-2 rounded-full -translate-x-1/2 top-3"
            style={{
              left: `${position}%`,
              backgroundColor: model.color
            }}
            title={`${model.name}: ${temp}°`}
          />
        );
      })}
    </div>
  );
}
```

2. **Add Bias Indicators to Model Grid**
```jsx
// Import bias data
import { MODEL_BIAS } from '../../data/modelBias';

// In model cell
const bias = MODEL_BIAS[citySlug]?.[model.name];

<div className="flex items-center gap-0.5 text-[8px]">
  {bias?.star && <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />}
  {bias?.bias > 0 && <span className="text-orange-400">+{bias.bias}▲</span>}
  {bias?.bias < 0 && <span className="text-blue-400">{bias.bias}▼</span>}
  {bias?.bias === 0 && <span className="text-white/30">─</span>}
</div>
```

3. **Add Convergence Indicator**
```jsx
// Track spread over time (store in state or context)
const spreadTrend = useMemo(() => {
  // Compare current spread to spread from 6h, 12h ago
  // Return 'converging' | 'diverging' | 'stable'
}, [forecasts]);

// Render in footer
<div className="text-[10px] text-white/40">
  {spreadTrend === 'converging' && (
    <span className="text-green-400">↘ Models converging</span>
  )}
  {spreadTrend === 'diverging' && (
    <span className="text-red-400">↗ Models diverging</span>
  )}
</div>
```

**Complexity:** Medium-High

---

## Phase 4: Satellite Widget Enhancement

### 4.1 Update SatelliteWidget.jsx

**File:** `src/components/widgets/SatelliteWidget.jsx`

**Changes:**

1. **Add City-Centered Regional Imagery**
```javascript
// New: Regional GOES sectors
const REGIONAL_SECTORS = {
  'los-angeles': { sector: 'WEST', lat: 34.05, lon: -118.25 },
  'chicago': { sector: 'MIDWEST', lat: 41.88, lon: -87.63 },
  // ...
};

// Update image URLs to use regional sectors instead of CONUS
const getRegionalUrl = (citySlug, product) => {
  const sector = REGIONAL_SECTORS[citySlug].sector;
  return `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/${sector}/${product}/latest.jpg`;
};
```

2. **Add Settlement Station Marker**
```jsx
// Overlay station location on image
<div className="relative">
  <img src={imageUrl} />
  {/* Station marker */}
  <div
    className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
    style={{
      left: `${calculatePixelX(SETTLEMENT_STATIONS[citySlug])}px`,
      top: `${calculatePixelY(SETTLEMENT_STATIONS[citySlug])}px`,
    }}
  />
</div>
```

3. **Add Meteorological Insight Panel**
```jsx
// Rule-based insight generation
function generateInsight(product, citySlug, forecasts) {
  // Simple rules:
  // - GeoColor + coastal city + morning = check marine layer
  // - IR + cold tops = convection risk
  // - Water Vapor + jet stream pattern = wind event
  return insights;
}

// Render
<div className="text-[10px] text-white/60 p-2 bg-white/5 rounded-lg mt-2">
  {insights.map((insight, i) => (
    <p key={i} className="flex items-center gap-1">
      <span>{insight.icon}</span>
      <span>{insight.text}</span>
    </p>
  ))}
</div>
```

**Complexity:** Medium

---

## Phase 5: Trading Intel Widget

### 5.1 Create New TradingIntelWidget.jsx

**File:** `src/components/weather/TradingIntelWidget.jsx`

**Structure:**

```jsx
export default function TradingIntelWidget({ citySlug, lat, lon }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const { alerts } = useNWSAlerts(lat, lon);
  const { runs, nextRun, lastChange } = useModelRunStatus();
  const { movers } = useMarketMovers(citySlug);

  return (
    <GlassWidget title="TRADING INTEL" icon={Zap}>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-2">
        <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
          Alerts {alerts.length > 0 && <Badge>{alerts.length}</Badge>}
        </TabButton>
        <TabButton active={activeTab === 'models'} onClick={() => setActiveTab('models')}>
          Models
        </TabButton>
        <TabButton active={activeTab === 'market'} onClick={() => setActiveTab('market')}>
          Market
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' && <AlertsTab alerts={alerts} />}
      {activeTab === 'models' && <ModelsTab runs={runs} nextRun={nextRun} lastChange={lastChange} />}
      {activeTab === 'market' && <MarketTab movers={movers} />}
    </GlassWidget>
  );
}
```

**Sub-components:**

```jsx
// ModelsTab - Show model run status
function ModelsTab({ runs, nextRun, lastChange }) {
  return (
    <div className="space-y-2">
      {runs.map(run => (
        <div key={run.model} className="flex items-center justify-between p-2 bg-white/5 rounded">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3 h-3 ${run.status === 'running' ? 'animate-spin text-blue-400' : 'text-white/40'}`} />
            <span className="text-xs font-medium">{run.model} {run.runTime}</span>
          </div>
          <span className="text-[10px] text-white/40">{run.timeAgo}</span>
        </div>
      ))}
      {nextRun && (
        <div className="text-[10px] text-white/40">
          Next run: {nextRun.model} in {formatTimeUntil(nextRun.time)}
        </div>
      )}
    </div>
  );
}

// MarketTab - Show market movers
function MarketTab({ movers }) {
  return (
    <div className="space-y-2">
      {movers.map((mover, i) => (
        <div key={i} className="flex items-start gap-2 p-2 bg-white/5 rounded">
          <BarChart2 className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-white/80">{mover.description}</p>
            <p className="text-[10px] text-white/40">{mover.timeAgo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Complexity:** High

---

### 5.2 Market Movers Detection Hook

**File:** `src/hooks/useMarketMovers.js`

```javascript
// Purpose: Detect unusual market activity
// Checks:
// 1. Rapid price changes (>20% in 1 hour)
// 2. Model-market divergence widening
// 3. Volume spikes (if available)

export function useMarketMovers(citySlug) {
  const [movers, setMovers] = useState([]);
  const { brackets } = useKalshiMarkets(citySlug);
  const { history } = useKalshiMultiBracketHistory(/* ... */);

  useEffect(() => {
    const detected = [];

    // Check for rapid price changes
    brackets.forEach(bracket => {
      const change1h = calculate1HourChange(bracket, history);
      if (Math.abs(change1h) > 20) {
        detected.push({
          type: 'price_spike',
          description: `${bracket.label} ${change1h > 0 ? 'spiked' : 'dropped'} ${Math.abs(change1h)}% in 1 hour`,
          severity: Math.abs(change1h) > 30 ? 'high' : 'medium',
          timeAgo: 'now',
        });
      }
    });

    // Check for model-market divergence
    // ...

    setMovers(detected);
  }, [brackets, history]);

  return { movers };
}
```

**Complexity:** Medium

---

## File Summary

### New Files (8)
| File | Purpose | Complexity |
|------|---------|------------|
| `src/hooks/useSettlementObservation.js` | Fetch settlement station obs | Medium |
| `src/hooks/useObservationHistory.js` | Track observation trajectory | Medium |
| `src/hooks/useModelRunStatus.js` | Track model run times | Medium-High |
| `src/hooks/useMarketMovers.js` | Detect market anomalies | Medium |
| `src/utils/edgeCalculator.js` | Model vs market edge | Medium |
| `src/data/modelBias.js` | Historical bias data | Low |
| `src/config/settlementStations.js` | Station mapping | Low |
| `src/components/weather/TradingIntelWidget.jsx` | New trading intel widget | High |

### Modified Files (4)
| File | Changes | Complexity |
|------|---------|------------|
| `src/components/weather/MarketBrackets.jsx` | Add obs, edge, settlement | High |
| `src/components/weather/ModelsWidget.jsx` | Add consensus bar, bias | Medium-High |
| `src/components/widgets/SatelliteWidget.jsx` | Regional, insight | Medium |
| `src/components/dashboard/CityDashboardNew.jsx` | Wire new widgets | Low |

---

## Testing Checklist

- [ ] Settlement observation updates every 5 minutes
- [ ] Edge indicators show correctly (underpriced/overpriced)
- [ ] Model bias indicators match research data
- [ ] Consensus bar positions models correctly
- [ ] Satellite imagery loads regional sectors
- [ ] Model run notifications fire on schedule
- [ ] Market mover detection catches price spikes
- [ ] All components handle loading/error states

---

## Rollout Strategy

1. **Phase 1-2** (Week 1): Data layer + Market Brackets
2. **Phase 3** (Week 2): Models Widget
3. **Phase 4** (Week 2): Satellite Widget
4. **Phase 5** (Week 3): Trading Intel Widget
5. **Polish** (Week 3): Testing, bug fixes, refinement

---

## Dependencies

```json
{
  "existing": ["recharts", "lucide-react", "date-fns"],
  "new": []
}
```

No new dependencies required.
