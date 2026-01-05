# Rain Widget Guide

## Overview
The Rain Widget displays month-to-date (MTD) precipitation with year-over-year comparison and climate normal reference. It also includes a Snow tab for cities with snow data.

## Data Sources

### Rain MTD (Current Year)
- **Source**: IEM CLI API (`mesonet.agron.iastate.edu/json/cli.py`)
- **Field**: `precip_month` - official NWS month-to-date total
- **Why CLI?**: The NWS CLI (Climatological Report) is the authoritative source. Summing hourly METAR observations misses trace amounts and has gaps.

### Rain MTD Normal
- **Source**: IEM CLI API
- **Field**: `precip_month_normal` - prorated MTD normal based on day of month
- **Display**: Shows as "nml X.XX"" to indicate the expected MTD by this date

### Today's Precipitation
- **Source**: IEM CLI API
- **Field**: `precip` - today's precipitation
- **Display**: Shows as "today: X.XX"" or "today: T" for trace amounts

### Last Year's Full Month Total
- **Source**: IEM CLI API (historical)
- **Query**: Last day of the same month, previous year
- **Field**: `precip_month` - contains full month total

### Climate Normals (Modal)
- **Source**: `useClimateNormals.js` (hardcoded NOAA 1991-2020 data)
- **Purpose**: Full monthly normals for reference in the modal popup

## Validation

**Always verify widget data against the official NWS CLI report:**

1. Go to: `https://forecast.weather.gov/product.php?site={OFFICE}&product=CLI&issuedby={STATION}`
   - Example for NYC: https://forecast.weather.gov/product.php?site=okx&product=CLI&issuedby=NYC
   - Example for LAX: https://forecast.weather.gov/product.php?site=lox&product=CLI&issuedby=LAX

2. Compare these values:
   - **PRECIPITATION (IN)** > **MONTH TO DATE** → should match widget MTD
   - **PRECIPITATION (IN)** > **NORMAL** (MTD row) → should match "nml" value
   - **PRECIPITATION (IN)** > **YESTERDAY** → should match "today" value (previous day)

## Station Mapping

The widget uses the same station IDs as the main weather display:
- New York: `KNYC` (Central Park)
- Los Angeles: `KLAX`
- Chicago: `KMDW`
- See `src/config/cities.js` for full mapping

## Trace Amounts

- Trace amounts ("T") represent measurable but very small precipitation (< 0.005")
- Widget displays "T" for trace instead of "0.00"
- MTD trace is shown as a tiny value (0.001") to appear on charts

## Snow Tab

The Snow tab uses the same IEM CLI API but reads:
- `snow_month` for MTD snow
- `snow_month_normal` (if available)

Snow data may show "No snow data available" for cities without snow records.

## Troubleshooting

### Widget shows 0.00 but CLI shows precipitation
1. Check if the IEM API is returning data for the station
2. Verify the station ID in `cities.js` matches what IEM uses
3. Check browser console for fetch errors

### Normal doesn't match CLI report
- The "nml" value is the **prorated MTD normal**, not the full month normal
- Full month normals are shown in the "Monthly normals" modal

### Data is stale
- CLI reports are typically issued once daily (morning)
- Yesterday's precipitation shows in today's report
- Refresh the widget or reload the page

## API Reference

```
GET https://mesonet.agron.iastate.edu/json/cli.py
    ?station={ICAO}
    &year={YYYY}
    &month={M}
    &day={D}

Response fields:
- valid: "YYYY-MM-DD" date
- precip: daily precipitation (number or "T" or "M")
- precip_month: MTD total
- precip_month_normal: prorated MTD normal
- snow: daily snowfall
- snow_month: MTD snow total
```

Note: The API returns ALL historical data for the station. Filter results by `valid.startsWith("YYYY-MM")` to get the target month's data.
