# Toasty Site Review - January 9, 2026

## Overview

Comprehensive site functionality test performed as a new user trying to forecast the high temperature in Los Angeles. This review documents the user journey, useful widgets, errors encountered, and UX/UI improvement suggestions.

**Test Date:** January 9, 2026
**Tester:** Claude (simulating new user)
**Cities Tested:** Los Angeles (primary), observed NYC data

---

## User Journey: Forecasting LA High Temperature

### Step 1: Homepage Overview
The homepage provides an excellent at-a-glance view of all markets:
- **City cards** show current temp, leading brackets, and conditions
- **Market sections**: "Highest temperature today", "how much will it rain", "how much will it snow"
- LA showed: 55°F current, 64-65° at 49%, 62-63° at 37%

**First Impression:** Clean, information-dense, easy to identify active markets.

### Step 2: City Dashboard (LA)
Clicked into Los Angeles dashboard. Immediately useful widgets visible:

#### Most Useful Widgets for Forecasting:

1. **Models Widget** - Critical for forecast grounding
   - Shows 6 models: GFS 63°, NBM 62°, ECM 60°, ICO 64°, GEM 62°, JMA 63°
   - Range: 60-64°F with ±2° spread
   - Confidence indicator: "Med"
   - Hover tooltips show model details (e.g., "GEM - Global Environmental Multiscale Model • CMC (Canada) • 15km")
   - **Click to add to notes** - very useful!

2. **Market Brackets Widget** - Core trading interface
   - Shows all brackets with probabilities
   - Expandable with full price chart (1H/6H/1D/1W/ALL timeframes)
   - **"Add chart to notes"** button captures screenshot
   - Individual brackets clickable with "Add to notes" option
   - Shows time to close (e.g., "Closes 14h 0m")

3. **Discussion Widget** - NWS forecast analysis
   - Expandable to full AFD
   - **Keyword highlighting** (Santa Ana, ridge, warming trend, etc.)
   - Multiple sections: AI, Syn, Short, Long, Avn, Marine, Gloss
   - Keywords clickable to add to notes
   - Shows issuance time and office (NWS LOX)

4. **Observations Widget** - Real-time temperature tracking
   - Horizontal scrolling timeline of hourly observations
   - Shows temperature trend throughout the day
   - Station info (KLAX) and last update time

5. **Reports Widget** - Settlement data
   - CLI (Settlement): 62°F from Jan 8
   - DSM (Live): 57°F
   - Countdown to next CLI/DSM releases

6. **Alerts Widget** - Active weather alerts
   - Beach Hazards Statement visible
   - Expiration countdown

#### Secondary Widgets:
- **Nearby Stations Map** - Multiple station temps on map
- **Satellite** - Local/Pacific, AirMass/GeoColor/Sandwich options
- **Wind** - Speed and direction visualization
- **Rain Odds** - Monthly precipitation markets
- **Forecast** - NWS point forecast (62°F Sunny)
- **Rounding** - Shows Celsius conversion breakpoints

### Step 3: Research Notes Integration

The Research Notes sidebar enables capturing analysis:
- **Auto-saves** with "Saved" indicator
- **Date header**: "Los Angeles | Friday, January 9, 2026"
- **"My forecast:"** section for personal notes
- Can add:
  - Model data (e.g., "Today GEM 62°F" as tag)
  - Price chart screenshots
  - Keywords from Discussion
  - Station temperatures
- **Ask AI** section with pre-built questions:
  - "Why is 64° to 65° at 50%?"
  - "Analyze the current market odds"
  - "What's driving the stable temperature?"
  - "What temperature should I expect at settlement?"

---

## Forecast Analysis (What I Observed)

Based on the data gathered:

**Models:** 60-64°F range (±2° spread = Med confidence)
- GFS: 63°F
- NBM: 62°F
- ECM: 60°F (coldest outlier)
- ICO: 64°F (warmest outlier)
- GEM: 62°F
- JMA: 63°F

**Key Drivers from AFD:**
- Santa Ana winds continuing through weekend
- Cool air advection today limiting warming to 1-3°F
- Ridge building with offshore flow
- High pressure developing over Nevada

**Market Pricing:**
- 64-65°F: 50% (leading)
- 62-63°F: 37-41% (second)
- 66-67°F: 10%
- 60-61°F: 3%

**Analysis:** Models cluster around 62-63°F. AFD mentions cool air advection limiting highs today. The 62-63°F bracket at ~40% may be undervalued given model consensus and AFD language about limited warming.

---

## Errors Encountered

### 1. Kalshi API Rate Limiting (429 Errors)
**Frequency:** Multiple times during session
**Impact:** Some market data temporarily unavailable
**Console messages:**
```
Failed to load resource: the server responded with a status of 429 (Too Many Requests)
Monthly rain market for new-york not found: HTTP 429
Daily rain market for seattle not found: HTTP 429
```
**Suggestion:** Implement more aggressive request batching or caching to reduce API calls.

### 2. AI Summary API 404 (Local Development)
**Error:** "Failed to generate summary" when expanding Discussion widget
**Cause:** Running `npm run dev` instead of `vercel dev` - serverless functions not available
**Console message:**
```
Error fetching summary: Error: Failed to generate summary
Failed to load resource: the server responded with a status of 404 (Not Found)
```
**Suggestion:** Better error messaging: "AI Summary requires 'vercel dev' for local development" (already partially implemented)

### 3. Chart Dimension Warnings
**Console message:**
```
The width(-1) and height(-1) of chart should be greater than 0
```
**Impact:** Minor - charts still render correctly
**Cause:** Recharts rendering before container dimensions are calculated

### 4. HTML Nesting Warning
**Console message:**
```
In HTML, <button> cannot be a descendant of <button>
```
**Impact:** Minor - functionality not affected
**Location:** Market Brackets expanded view

---

## UX/UI Suggestions

### High Priority

1. **Onboarding/Tutorial for New Users**
   - First-time users may not know what widgets are most important
   - Consider a "Getting Started" tooltip tour
   - Or a "Forecaster's Checklist" in the sidebar

2. **Model Consensus Indicator**
   - Show "Model Consensus: 62°F" prominently
   - Visual indicator when models agree vs. disagree
   - Currently requires mental math from user

3. **Quick Forecast Entry**
   - One-click "My forecast: XX°F" button
   - Currently requires typing in notes

4. **Settlement Countdown More Prominent**
   - The "Closes in 14h" is easy to miss
   - Consider a persistent countdown in header

### Medium Priority

5. **Discussion Widget - Default to AI Summary**
   - Most users want the summary first, not raw AFD
   - AI tab should be default when summary available

6. **Bracket Comparison to Models**
   - Show which bracket each model falls into
   - Visual overlay on Market Brackets showing model predictions

7. **Historical Settlement Data**
   - "Yesterday's high: 62°F" for context
   - Week's high range for pattern recognition

8. **Research Notes - Quick Templates**
   - Pre-built templates: "Bullish thesis", "Bearish thesis", "Key factors"
   - One-click to insert common structures

### Low Priority

9. **Dark Mode Already Excellent**
   - The glassmorphism aesthetic is professional
   - Consider slight increase in contrast for keyword highlighting

10. **Mobile Responsiveness**
    - Dashboard works but dense
    - Consider priority widget ordering for mobile

11. **Keyboard Shortcuts**
    - `1-6` to jump to different widgets
    - `N` to focus notes
    - `R` to refresh data

---

## Screenshots Captured

| File | Description |
|------|-------------|
| `site-review/01-homepage.png` | Full homepage with all city cards |
| `site-review/02-la-dashboard.png` | LA dashboard overview |
| `site-review/03-la-discussion-expanded.png` | Expanded NWS Discussion with keyword highlighting |
| `site-review/04-la-model-tooltip.png` | Model tooltip showing GEM details |
| `site-review/05-la-market-brackets-expanded.png` | Expanded Market Brackets with price chart |
| `site-review/06-la-chart-added-to-notes.png` | Price chart added to Research Notes |

---

## Summary

### Strengths
- **Information density** - All critical data visible without excessive clicking
- **Research Notes integration** - Seamless capture of data points
- **Keyword highlighting** - Makes AFD scanning efficient
- **Model tooltips** - Educational without being intrusive
- **Chart capture** - One-click screenshot to notes is excellent
- **Professional aesthetic** - Dark glassmorphism feels like a trading terminal

### Areas for Improvement
- **API rate limiting** - 429 errors disrupt experience
- **Model consensus visibility** - Requires mental math
- **New user guidance** - Could use onboarding
- **AI Summary default** - Should be primary view when available

### Overall Assessment
Toasty is a **highly functional** weather trading research tool. The widget system provides excellent flexibility, and the Research Notes integration creates a natural forecasting workflow. With minor UX improvements around model consensus and new user guidance, it could be an indispensable tool for weather prediction market traders.

---

*Review conducted January 9, 2026*
