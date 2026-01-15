# Performance Optimization TODO

Efficiency improvements identified January 2026. Ordered by impact.

**Last Updated**: January 2026 - Optimization sweep completed

---

## Completed

### 1. [x] Lazy Load TipTap Editor
**Impact**: 100-150KB bundle reduction
**Status**: DONE

**Changes**:
- `src/components/notepad/ResearchNotepad.jsx` - NotepadEditor lazy loaded with Suspense
- `src/components/layout/NotesSidebar.jsx` - NotepadEditor lazy loaded with Suspense
- `src/components/layout/NotePreviewModal.jsx` - Extracted to separate file for lazy loading

TipTap dependencies (@tiptap/starter-kit, @tiptap/react, @tiptap/pm) are now loaded on-demand when notepad is opened.

---

### 2. [x] Fix Kalshi Context Re-render Storm
**Impact**: Eliminates unnecessary re-renders every 60s
**Status**: DONE

**Changes**:
- `src/hooks/useAllKalshiMarkets.jsx` - Context value memoized with useMemo

```javascript
const contextValue = useMemo(() => ({
  marketsData,
  loading,
  lastFetch,
  refetch: fetchAllMarkets
}), [marketsData, loading, lastFetch, fetchAllMarkets]);
```

---

### 3. [x] Deduplicate NWS API Calls
**Impact**: Prevents rate limiting, reduces bandwidth
**Status**: DONE

**Changes**:
- `src/utils/fetchDedup.js` - New utility for request deduplication and caching
- `src/hooks/useNWSWeather.js` - Uses fetchWithDedup for station observations and AFD

Features:
- Pending request deduplication (same URL returns same Promise)
- Response caching with configurable TTL (default 2 min)
- Cache statistics available via `getCacheStats()`

---

### 4. [x] Memoize Recharts Components
**Impact**: Prevents expensive chart re-renders
**Status**: ALREADY OPTIMIZED

Chart components already use `useMemo` extensively for data processing:
- `src/components/weather/TemperatureChartModal.jsx`
- `src/components/weather/MultiBracketChart.jsx`
- `src/components/weather/MarketBrackets.jsx`
- `src/components/widgets/RainWidget.jsx`

---

### 5. [x] Lazy Load Leaflet Maps
**Impact**: 40KB deferred from initial load
**Status**: DONE

**Changes**:
- `vite.config.js` - Removed leaflet/react-leaflet from optimizeDeps.include
- Maps still split into separate chunk via manualChunks

---

### 6. [x] Memoize DynamicBackground Calculations
**Impact**: Reduces repeated pure function calls
**Status**: ALREADY OPTIMIZED

`src/components/layout/DynamicBackground.jsx` already uses `useMemo` for:
- `timePeriod` calculation
- `condition` mapping
- `backgroundClasses` building

---

### 7. [x] Virtualize/Reduce Observation History
**Impact**: Reduces DOM bloat
**Status**: ALREADY OPTIMIZED

`src/hooks/useNWSObservationHistory.js` already has:
- 5-minute cache TTL
- localStorage caching with versioned keys
- Efficient data transformation

Observations are rendered in charts (need all data) not lists.

---

### 8. [x] Remove Console Logs
**Impact**: Cleaner console, tiny perf gain
**Status**: DONE

**Changes**:
- `src/hooks/useKalshiCandlesticks.js` - Removed all console.log/warn/error calls

---

### 9. [x] Coordinate Polling Intervals
**Impact**: Batched API calls
**Status**: DEFERRED

Current intervals are reasonable:
- Kalshi: 60s (rate limit aware)
- NWS Weather: 5min (matches NWS update frequency)
- Observations: 5min (cached)

Further optimization would require a shared scheduler which adds complexity for marginal gain.

---

### 10. [x] Verify Tailwind Purging
**Impact**: Ensures unused CSS removed
**Status**: ALREADY OPTIMIZED

`tailwind.config.js` has correct content paths:
```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

---

## Already Optimized (Pre-existing)

- [x] html2canvas - dynamic import in `src/utils/chartScreenshot.js`
- [x] Route-level lazy loading - all pages use `React.lazy()`
- [x] No CSS-in-JS - pure Tailwind
- [x] No image assets - uses SVG/CSS gradients
- [x] Manual chunk splitting in `vite.config.js`

---

## New Files Created

- `src/utils/fetchDedup.js` - Request deduplication utility
- `src/components/layout/NotePreviewModal.jsx` - Extracted from NotesSidebar for lazy loading

---

## Measurement

Run build to verify:
```bash
npm run build
```

Check output for:
- Total bundle size
- Individual chunk sizes
- Largest chunks

Target: Main bundle < 200KB, largest chunk < 150KB

---

*Created: January 2026*
*Completed: January 2026*
