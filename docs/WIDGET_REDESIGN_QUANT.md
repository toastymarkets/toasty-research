# Widget Redesign: Quant Meteorologist Perspective

## Executive Summary

This document outlines a comprehensive redesign of four dashboard widgets from the perspective of a **quantitative meteorologist trading weather prediction markets**. The core mission: **maximize information density for trading edge detection** while maintaining visual clarity.

---

## The Quant Meteorologist's Mindset

When trading temperature prediction markets, every decision revolves around one question:

> "What will be the official high temperature recorded at the settlement station, and where is the market mispricing that outcome?"

### Information Hierarchy (by trading value)

| Priority | Data Type | Why It Matters |
|----------|-----------|----------------|
| 1 | **Settlement Station Obs** | The ONLY temperature that matters for settlement |
| 2 | **Market Pricing vs Model Probability** | Edge = Model says 70% but market says 50% |
| 3 | **Model Consensus & Spread** | High spread = uncertainty = opportunity |
| 4 | **Observation Trajectory** | Is temp tracking forecast or diverging? |
| 5 | **Time Remaining** | How much can change before settlement? |
| 6 | **Meteorological Drivers** | What's pushing temp up/down? |

---

## Current State Analysis

### Widget 1: Market Brackets (Left Panel)

**Current Strengths:**
- Shows all brackets with probabilities
- Price chart showing 24h history
- Price change badges (+73, -35, etc.)
- Time remaining until close

**Critical Gaps:**
- **No current observation** - Can't see actual temp at settlement station
- **No model overlay on chart** - Price moves but what's driving them?
- **No market-vs-model comparison** - Where's the edge?
- **No settlement station callout** - Which station determines outcome?
- **Chart doesn't show observation trajectory** - Just market prices

### Widget 2: Models (Middle-Right)

**Current Strengths:**
- Shows 6 models with point forecasts
- Confidence badge (HIGH/MED/LOW based on spread)
- Consensus average

**Critical Gaps:**
- **No historical bias indication** - NBM runs warm in LA, etc.
- **No model convergence/divergence trend** - Are they coming together?
- **No hourly trajectory** - Just daily high, not when it peaks
- **No comparison to market brackets** - Models say 68° but which bracket is priced highest?
- **Resolution text too small** - Important for understanding model quality

### Widget 3: Satellite/Radar (Top-Right)

**Current Strengths:**
- Multiple products (Air Mass, GeoColor, IR, WV)
- Still/Animated toggle
- Auto-refresh

**Critical Gaps:**
- **CONUS scale too zoomed out** - Need regional/local view
- **No meteorological annotation** - What am I looking at?
- **No connection to forecast** - Clouds visible but so what?
- **No derived products** - Visible shows clouds but not their impact

### Widget 4: Alerts & News (Bottom-Right)

**Current Strengths:**
- Shows NWS alerts with severity
- Falls back to news when no alerts
- Expandable detail view

**Critical Gaps:**
- **News not market-relevant** - Generic weather news, not trading intel
- **No model run announcements** - "New GFS just dropped"
- **No market-moving event detection** - Front passage, clearing skies, etc.
- **Alerts don't show temperature impact** - Heat advisory = will it bust the bracket?

---

## Redesign Proposals

### Widget 1: Market Brackets (MAJOR REDESIGN)

**New Name:** `MarketIntelligence` or keep `MarketBrackets`

**New Information Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ MARKET BRACKETS          Today │ Tomorrow    [KLAX 68°] │
├─────────────────────────────────────────────────────────┤
│ Highest Temperature in Los Angeles Today                │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LEADING: 70-71°  ██████████████░░  99%  +73  6h 36m │ │
│ │          vs Models: 66° avg  →  MARKET 4° WARMER   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ CHART AREA (Multi-layer)                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  --- Market Price Lines (existing)                  │ │
│ │  ─── Model Consensus Band (NEW: shaded area)       │ │
│ │  ● ● Current Observation Trajectory (NEW)          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ BRACKET LIST with Edge Indicators                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● ≤63°     0%   ─     Models: 0%   ─               │ │
│ │ ● 64-65°   0%  -3     Models: 2%  🔻 UNDERPRICED   │ │
│ │ ● 66-67°   0%  -20    Models: 35% 🔻🔻 BIG EDGE    │ │
│ │ ● 68-69°   0%  -35    Models: 40% 🔻🔻 BIG EDGE    │ │
│ │ ● 70-71°  99%  +73    Models: 20% 🔺🔺 OVERPRICED  │ │
│ │ ● ≥72°     0%  -5     Models: 3%  ─                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Settlement: KLAX (LAX Airport) • Closes 11:59pm PT     │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**

1. **Live Observation Badge** (top-right corner)
   - Current temp at settlement station
   - Updates every 5 minutes
   - Color-coded: green if tracking forecast, amber if diverging

2. **Market vs Model Edge Indicator**
   - Calculate implied probability from model consensus
   - Compare to market price
   - Show arrows: 🔺 Overpriced, 🔻 Underpriced, ─ Fair

3. **Multi-layer Chart**
   - Keep existing market price lines
   - Add shaded band for model consensus range
   - Add observation trajectory dots (actual temps throughout day)

4. **Settlement Info Footer**
   - Explicit station ID (KLAX, KORD, etc.)
   - Clear close time with timezone

**Data Sources:**
- Observations: NWS API `/stations/{stationId}/observations/latest`
- Model consensus: Existing `useMultiModelForecast` hook

---

### Widget 2: Models (MODERATE REDESIGN)

**New Name:** `ModelConsensus` or keep `ModelsWidget`

**New Information Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ MODELS                   66° avg    [MED] ±3°   [→]    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CONSENSUS VISUALIZATION                             │ │
│ │                                                     │ │
│ │    63  64  65  66  67  68  69  70  71              │ │
│ │         ├──────[█████]──────┤                      │ │
│ │              ↑ NBM    GFS ↑                        │ │
│ │            ECM ↑       ↑ ICO                       │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ MODEL GRID with Bias Indicators                         │
│ ┌─────┬─────┬─────┐                                    │
│ │ GFS │ NBM │ ECM │                                    │
│ │ 69° │ 67° │ 63° │                                    │
│ │ +1▲ │  ★  │ -1▼ │ ← Historical bias for this city   │
│ └─────┴─────┴─────┘                                    │
│ ┌─────┬─────┬─────┐                                    │
│ │ ICO │ GEM │ JMA │                                    │
│ │ 69° │ 68° │ 68° │                                    │
│ │ +2▲ │  ─  │  ─  │                                    │
│ └─────┴─────┴─────┘                                    │
│                                                         │
│ Trend: Models converging ↘ (spread was 8° → now 6°)    │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**

1. **Visual Consensus Band**
   - Horizontal bar showing model spread
   - Individual model positions marked
   - Immediately shows agreement/disagreement

2. **Historical Bias Indicators**
   - Per-model, per-city bias from historical verification
   - `+1▲` = tends to forecast 1° too warm
   - `-1▼` = tends to forecast 1° too cold
   - `★` = best performer for this city

3. **Convergence/Divergence Trend**
   - Track model spread over last 3 model runs
   - "Converging" = confidence increasing
   - "Diverging" = uncertainty increasing

4. **Model Priority Star**
   - Indicate which model to trust most for this city/season
   - Based on historical verification data

**Data Enhancement:**
- Add `knownBias` object with city-specific corrections
- Add `lastRunSpread` to track convergence

---

### Widget 3: Satellite/Radar (MODERATE REDESIGN)

**New Name:** `SatelliteInsight` or keep `SatelliteWidget`

**New Information Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ [SAT] [RAD]              ● LIVE        [<] GOES-18 [>] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │              REGIONAL SATELLITE IMAGE               │ │
│ │           (Centered on forecast city)               │ │
│ │                                                     │ │
│ │                    ★ LAX                            │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ PRODUCT SELECTOR                                        │
│ [AIR✓] [GEO] [IR] [WV]                                 │
│                                                         │
│ METEOROLOGICAL INSIGHT (AI-generated or rule-based)    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💨 Marine layer ~15 miles offshore                  │ │
│ │ ☀️ Clear skies over LAX - full solar heating       │ │
│ │ 📈 Expect temps to peak 2-3pm local                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**

1. **Regional Focus**
   - Zoom to ~300km radius around forecast city
   - Mark settlement station location
   - Show relevant features (coast, mountains)

2. **Meteorological Insight Panel**
   - Rule-based or AI-generated interpretation
   - What does the imagery mean for temperature?
   - "Marine layer clearing" / "High clouds filtering sun"

3. **Product Selection Refinement**
   - Water Vapor for upper-level patterns
   - Visible/GeoColor for cloud cover
   - IR for overnight/storm situations

4. **Animation with Forecast Overlay** (expanded view)
   - Show cloud trajectory
   - Predict when clearing/clouding occurs

---

### Widget 4: Alerts & News (SIGNIFICANT REDESIGN)

**New Name:** `TradingIntel` or `MarketAlerts`

**New Information Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ TRADING INTEL             [Alerts] [Models] [Market]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ No Active NWS Alerts                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ MODEL UPDATES                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔄 GFS 12z just released              2 min ago    │ │
│ │    LA high: 69°F (+1° from 06z)                    │ │
│ │                                                     │ │
│ │ 🔄 ECMWF 00z running now              ~30 min      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ MARKET MOVERS                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📊 70-71° bracket spiked +40 in 1 hour             │ │
│ │ 📊 Large volume on ≥72° bracket                    │ │
│ │ 📊 Model-market divergence widening                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Tap for details →                                       │
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**

1. **Three-Tab Design**
   - **Alerts**: NWS weather alerts (existing)
   - **Models**: Model run status and key changes
   - **Market**: Unusual market activity detection

2. **Model Update Notifications**
   - Track when major models (GFS, ECMWF, NAM) release new runs
   - Show change from previous run
   - Indicate running/pending status

3. **Market Mover Detection**
   - Detect rapid price changes (>20% in 1 hour)
   - Detect unusual volume patterns
   - Highlight model-market divergence changes

4. **Remove Generic News**
   - Current news adds clutter, not trading value
   - Replace with actionable trading intelligence

---

## Visual Design Principles

### Color System for Trading Signals

| Signal | Color | Usage |
|--------|-------|-------|
| Edge (underpriced) | `emerald-400` | Market < Model probability |
| Edge (overpriced) | `amber-400` | Market > Model probability |
| Warm bias | `orange-400` | Model runs warm |
| Cold bias | `blue-400` | Model runs cold |
| Convergence | `green-400` | Models agreeing |
| Divergence | `red-400` | Models disagreeing |
| Live/Current | `cyan-400` | Real-time observation |

### Information Density Guidelines

1. **No wasted pixels** - Every element should inform trading
2. **Hierarchy through size, not decoration** - Big numbers = important
3. **Progressive disclosure** - Summary → Detail on click
4. **Tabular data** - Use `tabular-nums` for all numbers
5. **Minimal animation** - Only for attention on changes

### Typography Hierarchy

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Primary value | 18-24px | 600-700 | `white` |
| Secondary value | 14-16px | 500 | `white/80` |
| Label | 10-11px | 500 | `white/50` |
| Caption | 9-10px | 400 | `white/40` |

---

## Implementation Phases

### Phase 1: Data Layer Enhancement
- Add settlement station observation fetching
- Add model-vs-market probability calculation
- Add model historical bias data structure
- Add model run status tracking

### Phase 2: Market Brackets Redesign
- Add live observation badge
- Add edge indicators to bracket list
- Add observation trajectory to chart
- Add settlement station footer

### Phase 3: Models Widget Redesign
- Add visual consensus band
- Add historical bias indicators
- Add convergence/divergence tracking
- Improve hover states with full model info

### Phase 4: Satellite Widget Enhancement
- Add regional zoom centered on city
- Add settlement station marker
- Add meteorological insight panel
- Improve product selection UX

### Phase 5: Trading Intel Widget
- Redesign from Alerts to Trading Intel
- Add model run notifications
- Add market mover detection
- Remove generic news, add market-relevant events

---

## Success Metrics

1. **Time to Edge Detection**: How quickly can a trader spot model-market divergence?
2. **Information Scannability**: Can you get full market picture in <5 seconds?
3. **Decision Support**: Does every widget element help make trading decisions?
4. **Data Freshness**: Is real-time data prominently displayed?

---

## Appendix: Data Sources

| Data | Source | Refresh Rate |
|------|--------|--------------|
| Market prices | Kalshi API | 30 seconds |
| Station observations | NWS API | 5 minutes (METAR) |
| Model forecasts | Open-Meteo | Model run dependent |
| Satellite imagery | NOAA GOES | 5-10 minutes |
| NWS alerts | NWS API | 5 minutes |
| Model run status | Various | Real-time |

---

## Next Steps

1. Review and approve design direction
2. Create detailed component specifications
3. Implement data layer enhancements
4. Build UI components iteratively
5. User testing with trading scenarios
