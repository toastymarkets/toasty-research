# Precipitation Accumulation Widget - Implementation Plan

## Overview
Create a Rain/Snow Accumulation widget that visualizes month-to-date precipitation totals, replacing the visibility widget. Data will be sourced from the IEM (Iowa Environmental Mesonet) API which already provides daily precipitation (`precip`) and snowfall (`snow`) data.

## Data Source
**IEM Daily Summary API**
```
https://mesonet.agron.iastate.edu/api/1/daily.json?network={network}&station={station}&date={date}
```

Available fields:
- `precip` - Daily precipitation (inches)
- `snow` - Daily snowfall (inches)
- `snowd` - Snow depth on ground (inches)

The existing `useDSM` hook and `CITY_IEM_CONFIG` mapping already support 15+ cities.

## Implementation Steps

### Step 1: Create `useMonthlyPrecipitation` Hook
**File**: `src/hooks/useMonthlyPrecipitation.js`

- Fetch daily data for current month (day 1 through today)
- Aggregate daily `precip` and `snow` values
- Calculate running totals for each day
- Return structured data for visualization:
  ```js
  {
    dailyData: [{ date, precip, snow, runningPrecip, runningSnow }],
    totals: { precipitation: number, snowfall: number },
    loading, error, refetch
  }
  ```
- Use localStorage caching (1 hour TTL) to minimize API calls

### Step 2: Create `PrecipitationAccumulation` Widget Component
**File**: `src/components/widgets/PrecipitationAccumulation.jsx`

**Layout:**
- Header with month name, refresh button, expand/collapse
- Summary cards showing MTD totals (rain in inches, snow in inches)
- Recharts visualization:
  - **Bar chart**: Daily precipitation (blue) and snowfall (light blue/white)
  - **Line overlay**: Running accumulation totals
  - X-axis: Days of month
  - Dual Y-axis: Daily amounts (left), Cumulative (right)

**Features:**
- Responsive sizing (min 3 columns wide)
- Loading skeleton state
- Error state with retry
- SelectableData integration for adding values to research notes
- Glass morphism styling matching existing widgets

### Step 3: Register Widget
**File**: `src/config/WidgetRegistry.js`

```js
'precipitation-accumulation': {
  id: 'precipitation-accumulation',
  name: 'Precipitation Accumulation',
  description: 'Monthly rain and snow accumulation to date',
  icon: 'CloudRain',
  component: PrecipitationAccumulation,
  category: 'weather',
  requiredProps: ['citySlug', 'cityName'],
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 4,
}
```

### Step 4: Remove/Replace Visibility Widget
- Remove `VisibilityWidget` from `SmallWidgets.jsx` (if no longer needed)
- Update any dashboard layouts that reference it

## Visualization Design

```
┌─────────────────────────────────────────────────────┐
│ PRECIPITATION (MTD)                    ↻  ▲        │
│ January 2026 • NYC Central Park                    │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                │
│  │  RAIN        │  │  SNOW        │                │
│  │  2.34"       │  │  8.5"        │                │
│  │  MTD         │  │  MTD         │                │
│  └──────────────┘  └──────────────┘                │
│                                                     │
│  ▓  Daily Rain    ░  Daily Snow   ── Cumulative   │
│                                                     │
│  2.5" ┤         ▓                          ──── 10"│
│       │      ▓  ▓                      ────       │
│  1.5" ┤   ░  ▓░ ▓                  ────           │
│       │   ░  ▓░ ▓  ░           ────               │
│  0.5" ┤▓  ░  ▓░ ▓▓ ░▓      ────                   │
│       ├───┴──┴──┴──┴──┴──┴──┴──────────────────── │
│         1  5  10  15  20  25  30                   │
│                                                     │
│ Data from Iowa Environmental Mesonet (IEM)         │
└─────────────────────────────────────────────────────┘
```

## Technical Considerations

1. **API Rate Limiting**: Fetch all days in a single batch request if possible, otherwise throttle requests
2. **Caching**: localStorage with 1-hour TTL to avoid refetching on every render
3. **Missing Data**: Handle days with null/missing precipitation gracefully (show as 0 or skip)
4. **Timezone**: Use local date for month boundaries
5. **Month Selection**: Future enhancement - allow viewing previous months

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/hooks/useMonthlyPrecipitation.js` |
| Create | `src/components/widgets/PrecipitationAccumulation.jsx` |
| Modify | `src/config/WidgetRegistry.js` |
| Modify | `src/components/weather/SmallWidgets.jsx` (remove VisibilityWidget) |

## Dependencies
- Recharts (already installed)
- Lucide React icons (CloudRain, Snowflake, Droplets)
- Existing patterns from DailySummary widget
