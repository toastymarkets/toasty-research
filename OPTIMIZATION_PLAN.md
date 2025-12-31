# Optimization Plan: Load States, Error Handling & Performance

## Overview
Comprehensive optimization pass to make the app feel smooth, handle errors gracefully, and perform well on all devices.

---

## Phase 1: Quick Wins (High Impact, Low Effort)

### 1.1 Add React.memo to Frequently Re-rendering Components
- [x] `src/components/home/CityCard.jsx` - Timer causes 10+ re-renders/second ✅
- [x] `src/components/weather/SmallWidgets.jsx` - All widget exports ✅
- [x] `src/components/weather/WidgetGrid.jsx` - WidgetGridItem ✅

### 1.2 Fix Empty Catch Blocks (Silent Failures)
- [x] `src/hooks/useNWSHourlyForecast.js` (Lines 37, 140) ✅
- [x] `src/hooks/useMultiModelForecast.js` (Lines 69-71, 154-156) ✅
- [x] Add explanatory comments instead of empty blocks ✅

### 1.3 Add Lazy Loading to Images
- [x] `src/components/home/CityCard.jsx` - Add `loading="lazy"` ✅
- [ ] `src/components/home/InteractiveMarketsMap.jsx` - Verify all images

### 1.4 Centralize Constants
- [x] Create `src/constants/cache.js` with CACHE_DURATIONS ✅
- [x] Standardize cache times across hooks (using centralized constants) ✅

---

## Phase 2: Error Handling (User-Facing)

### 2.1 Create Error Toast/Notification System
- [ ] Create `src/components/ui/Toast.jsx`
- [ ] Create `src/context/ToastContext.jsx`
- [ ] Add toast on API failures instead of silent fails

### 2.2 Add User-Friendly Error Messages
Replace HTTP status codes with friendly messages:
- [ ] `src/hooks/useNWSWeather.js` - "Weather service temporarily unavailable"
- [ ] `src/hooks/useKalshiMarkets.js` - "Market data unavailable"
- [ ] `src/hooks/useAllCitiesWeather.js` - Show error state, not null

### 2.3 Add Retry Buttons
- [ ] Weather widgets - "Tap to retry" on failure
- [ ] Market data - Retry button when API fails
- [ ] Map components - Retry for radar/satellite

### 2.4 Graceful Degradation
- [ ] Show cached data when API fails
- [ ] Indicate stale data with timestamp ("Updated 5 min ago")

---

## Phase 3: Loading States & Skeletons

### 3.1 Consistent Skeleton Loaders
- [ ] `src/components/weather/MarketBracketsModal.jsx` - Add skeleton for tab content
- [ ] `src/components/weather/RoundingModal.jsx` - Add loading state
- [ ] `src/components/weather/ObservationDetailModal.jsx` - Skeleton for chart/table

### 3.2 Coordinated Loading Strategy
- [ ] `src/components/dashboard/CityDashboardNew.jsx` - Show unified loading state
- [ ] Prevent content "jumping" by reserving space with skeletons

### 3.3 Map Loading States
- [ ] `src/components/home/InteractiveMarketsMap.jsx` - Individual city weather loading
- [ ] Show placeholder icons while weather loads

---

## Phase 4: Performance Optimizations

### 4.1 Code-Split Large Modals (Lazy Load)
```javascript
const ObservationDetailModal = lazy(() => import('./ObservationDetailModal'));
const MarketBracketsModal = lazy(() => import('./MarketBracketsModal'));
const RoundingModal = lazy(() => import('./RoundingModal'));
```
- [x] Wrap modal imports with React.lazy() ✅
- [x] Add Suspense fallback ✅
- Result: Main bundle reduced from 927KB to 872KB (~55KB savings)

### 4.2 Fix Timer Memory Leaks
- [x] `src/components/home/CityCard.jsx` - Memoize interval handler ✅
- [x] Use useCallback for setInterval functions ✅

### 4.3 Add useCallback to Event Handlers
- [ ] `src/components/weather/WeatherMap.jsx` - handleMouseMove, handleMouseUp
- [ ] `src/components/dashboard/WidgetRenderer.jsx` - resolveProps()

### 4.4 Virtualize Large Lists
- [ ] `src/components/home/HomePageMarkets.jsx` - Use react-window for 50+ markets
- [ ] `src/components/home/AllMarketsModal.jsx` - Virtualize or paginate

### 4.5 Lazy Load Recharts
- [ ] Only import Recharts when modal opens
- [ ] Reduces initial bundle by ~60KB

---

## Phase 5: Mobile Responsiveness

### 5.1 Fix Touch Targets (Minimum 44x44px)
- [ ] `src/components/home/CityCard.jsx` - Plus button too small (24px)
- [ ] `src/components/weather/MapWidgetPopup.jsx` - Expand button
- [ ] Add padding wrappers around small buttons

### 5.2 Fix Modal Spacing
- [ ] `src/components/home/AllMarketsModal.jsx` - `inset-2` instead of `inset-4` on mobile
- [ ] `src/components/weather/MarketBracketsModal.jsx` - Same fix

### 5.3 Improve Touch Scrolling
- [ ] `src/components/weather/HourlyForecast.jsx` - Add `snap-x snap-mandatory`
- [ ] Increase tap targets in horizontal scrollers

### 5.4 Viewport-Relative Sizing
- [ ] `src/components/home/InteractiveMarketsMap.jsx` - Use `min-h-[300px] h-[min(60vh,500px)]`
- [ ] Remove hardcoded heights where possible

---

## Phase 6: Code Cleanup

### 6.1 Remove Dead Code
- [ ] Check if `src/components/home/HomePage.jsx` is used (vs HomePageMarkets)
- [ ] Check if `src/components/dashboard/CityDashboard.jsx` is used (vs CityDashboardNew)
- [ ] Remove unused component versions

### 6.2 Extract Duplicate Code
- [ ] Create `src/utils/satImage.js` - generateFrameUrl, preloadImage
- [ ] Create `src/utils/stations.js` - fetchNearbyStations, fetchLatestObservation
- [ ] Consolidate getTickerDate() to one location

### 6.3 Split Large Components
- [ ] `src/components/weather/SmallWidgets.jsx` (572 lines) → Individual widget files
- [ ] `src/components/weather/ObservationDetailModal.jsx` (746 lines) → Subcomponents

### 6.4 Consistent Logging
- [ ] Replace all `console.error()` with `logger.error()`
- [ ] Files: ErrorBoundary, InteractiveMarketsMap, NearbyStations

---

## Priority Order

| Priority | Phase | Estimated Impact |
|----------|-------|------------------|
| 1 | Phase 1 (Quick Wins) | High - immediate perf gains |
| 2 | Phase 2 (Error Handling) | High - better UX |
| 3 | Phase 4.1 (Lazy Load Modals) | High - faster initial load |
| 4 | Phase 3 (Loading States) | Medium - smoother UX |
| 5 | Phase 5 (Mobile) | Medium - better mobile UX |
| 6 | Phase 6 (Cleanup) | Low - maintainability |

---

## Files Most Needing Attention

1. **`CityCard.jsx`** - Timer re-renders, small touch target, missing lazy image
2. **`ObservationDetailModal.jsx`** - 746 lines, needs code-split
3. **`useNWSWeather.js`** - Silent errors, no user feedback
4. **`InteractiveMarketsMap.jsx`** - Multiple issues (errors, loading, mobile)
5. **`SmallWidgets.jsx`** - Should be split into individual files
