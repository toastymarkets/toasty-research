# Wethr.net Research: Learning from Their Approach

**Date:** January 14, 2026
**Branch:** `research/wethr-api-docs`
**Source:** https://wethr.net

**Purpose:** Learn from Wethr.net's approach to weather market data accuracy and presentation. Toasty is a different product (trader dashboard vs data platform), but Wethr has solved key problems we can learn from.

---

## What Wethr.net Does Well

### 1. Settlement Data Accuracy

**Their Approach:**
- Pre-calculate "Wethr High/Low" using two logic modes:
  - `nws` logic - matches Kalshi settlement rules exactly
  - `wu` logic - local time window with exact temps
- Automatically reconcile CLI vs DSM data
- Single source of truth for settlement values

**What We Can Learn:**
- Having explicit "logic modes" clarifies what calculation method is being used
- Users need to understand *which* high/low they're seeing (CLI-based vs observation-based)
- Toasty could add clearer labeling: "Settlement High (CLI)" vs "Observed Max"

### 2. Multi-Layer Temperature Visualization

**Their Approach:**
- Display multiple temperature lines simultaneously:
  - **Wethr High** - calculated settlement value
  - **Max** - highest observation
  - **Public** - what general weather sites show
  - **Min** - lowest observation

**What We Can Learn:**
- Traders need to see the *spread* between different temperature measures
- The gap between "Max observation" and "Settlement value" is trading signal
- Toasty could show multiple temp lines on our charts, not just one

### 3. Model Comparison

**Their Approach:**
- Access to 9 forecast models: HRRR, RAP, NAM, NAM4KM, GFS, plus MOS variants
- Model Analyzer tool for side-by-side comparison
- Blended Model Builder for custom ensembles

**What We Can Learn:**
- Serious traders want to see model disagreement/spread
- MOS (Model Output Statistics) models are valuable - they're statistically corrected
- Showing "model consensus" vs "model spread" is useful signal
- Toasty's Forecast Models widget could evolve toward real model comparison

### 4. Similar Days Tool (Analogs)

**Their Approach:**
- Find historical days with similar conditions
- Help traders understand "what happened last time conditions were like this"

**What We Can Learn:**
- Historical analogs are valuable for prediction
- Pattern matching gives traders confidence
- Toasty could add a "Similar Days" feature to our analysis tools

### 5. NWS Forecast Evolution Tracking

**Their Approach:**
- Track how NWS forecasts changed over time
- Show forecast "busts" and drift

**What We Can Learn:**
- Forecasts change - tracking that change is valuable signal
- If NWS keeps revising upward, that's bullish for high brackets
- Toasty could store forecast history and show evolution charts

### 6. Speed as Core Value

**Their Mission Statement:**
> "Financial markets demand greater speed than is practical for traditional weather sites."

**What We Can Learn:**
- Weather sites optimize for casual users (hourly updates fine)
- Trading requires near-real-time (minute-level freshness)
- Toasty should continue prioritizing data freshness over fancy features

---

## Data Accuracy Techniques

### How They Achieve Accuracy

1. **CLI/DSM Reconciliation**
   - CLI = official daily climate report (gold standard)
   - DSM = interim daily summary (available sooner)
   - They merge these intelligently based on availability

2. **Station-Specific Logic**
   - Different stations have different reporting quirks
   - They handle 31+ stations with per-station logic

3. **Time Window Handling**
   - NWS uses specific time windows for "daily high"
   - Not simply "highest temp in 24 hours"
   - Getting this wrong = wrong settlement prediction

4. **Probability Ranges**
   - Return calculated probability brackets
   - Based on current temp + forecast uncertainty

### Lessons for Toasty

| Their Technique | Toasty Opportunity |
|-----------------|-------------------|
| Explicit CLI/DSM labels | Add "Data Source: CLI" badges |
| Multiple temp lines | Show settlement vs observation gap |
| Time window clarity | Explain "Settlement Window: 7AM-7AM local" |
| Probability brackets | Show bracket probability estimates |

---

## UX/Design Patterns Worth Noting

### 1. Data Layering
- Users can toggle different data layers on/off
- Not overwhelming by default, but depth available

### 2. Tool Specialization
- Separate tools for different tasks (analyzer, converter, mapper)
- Not trying to cram everything into one view

### 3. Tiered Access
- Free tier gets delayed data (3 min)
- Paid gets real-time
- Creates clear value prop without hard paywall

### 4. Beta Features
- Model Builder marked as "beta"
- Shows they iterate publicly

---

## Key Concepts from Their Platform

### Temperature Types Explained

| Type | Definition | Use Case |
|------|------------|----------|
| **Wethr High** | Calculated settlement-matching value | Trading decisions |
| **Max Observed** | Highest METAR reading | Real-time tracking |
| **Public High** | What weather apps show | General reference |
| **CLI High** | Official NWS daily report | Settlement source |
| **DSM High** | Interim NWS summary | Early settlement signal |

### Model Types

| Category | Models | Characteristics |
|----------|--------|-----------------|
| **Mesoscale** | HRRR, RAP | High-res, short-range, frequent updates |
| **Regional** | NAM, NAM4KM | Medium-res, 3-4 day range |
| **Global** | GFS | Lower-res, extended range |
| **Statistical** | MOS variants | Bias-corrected, often more accurate |

**Key Insight:** MOS models (LAV-MOS, GFS-MOS, NAM-MOS, NBS-MOS) statistically correct raw model output. Often more accurate than raw models for surface temps.

---

## Feature Ideas Inspired by Wethr

### High Priority

1. **Settlement vs Observation Indicator**
   - Show the gap between current max observation and likely settlement
   - "Current Max: 87°F | Settlement Range: 85-87°F"

2. **Data Source Badges**
   - Clear labels on which data source each number comes from
   - "CLI", "DSM", "METAR", "Forecast"

3. **Forecast Change Tracking**
   - Store NWS forecasts over time
   - Show "Forecast shifted +2°F in last 6 hours"

### Medium Priority

4. **Model Spread Indicator**
   - Even without raw model data, show "Models agree" vs "Models diverge"
   - Could scrape/derive from NWS discussion

5. **Historical Analog Hints**
   - "Similar conditions on [date] resulted in [outcome]"
   - Adds confidence to predictions

### Lower Priority

6. **Multi-Station View**
   - Compare nearby stations
   - Useful for understanding local variation

---

## What Makes Toasty Different

| Wethr.net | Toasty |
|-----------|--------|
| Data platform | Trading dashboard |
| API-first | UI-first |
| Subscription revenue | Free tool |
| Raw data focus | Analysis + context focus |
| Tools for power users | Widgets for all levels |
| Weather data only | Weather + Market data combined |

**Toasty's Unique Value:**
- Combines weather data WITH Kalshi market data in one view
- Widget-based customizable dashboard
- NWS Discussion analysis with keyword highlighting
- Research notes and copilot features
- Free and open

**Not Competing:** We serve different needs. Wethr is the data layer. Toasty is the trading interface. Some users probably use both.

---

## Actionable Takeaways

### Quick Wins
- [ ] Add clearer data source labels (CLI/DSM/METAR badges)
- [ ] Show "Settlement High" vs "Current Max" distinction in UI
- [ ] Note time windows in tooltips ("Daily high: midnight-midnight local")

### Medium Effort
- [ ] Track NWS forecast changes over time
- [ ] Add forecast evolution visualization
- [ ] Show model consensus/spread from NWS discussions

### Research Further
- [ ] How do they calculate probability ranges?
- [ ] What's their CLI/DSM reconciliation logic?
- [ ] How do they handle station-specific quirks?

---

## Questions Answered

**Q: Why is their data accurate?**
A: They explicitly handle CLI vs DSM, use correct time windows, and have station-specific logic.

**Q: What's their secret sauce?**
A: No magic - just careful implementation of NWS data rules that most weather apps ignore.

**Q: Should Toasty use their API?**
A: Not necessary. We can implement similar logic ourselves. Their value is in doing the work; we can learn the approach.

**Q: Are they competition?**
A: No. Different products. They're a data platform; we're a trading dashboard. Complementary.
