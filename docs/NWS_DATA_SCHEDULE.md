# NWS Data Release Schedule Reference

All times are in UTC. CLI is the official resolution source for Kalshi temperature markets.

## Data Products

| Product | Description | Frequency | Settlement Use |
|---------|-------------|-----------|----------------|
| **CLI** | Climatological Report - Daily summary | Once daily | **Official** |
| **DSM** | Daily Summary Message - Interim data | 1-4x daily | Interim only |
| **METAR** | Hourly observations | Hourly | Tracking |
| **24hr High** | Special METAR with max temp | Once daily | Tracking |
| **6-Hour** | METAR with 6hr max/min temps | 4x daily | Tracking |

## Station Schedule

| Station | City | CLI Time | 24hr High | METAR | DSMs |
|---------|------|----------|-----------|-------|------|
| KATL | Atlanta, GA | 09:17 | 04:52 | :52 | 3 |
| KAUS | Austin, TX | 08:01 | 05:53 | :53 | 3 |
| KBOS | Boston, MA | 05:30 | 04:54 | :54 | 3 |
| KCLT | Charlotte, NC | 07:26 | 04:52 | :52 | 3 |
| KMDW | Chicago, IL | 06:46 | 05:53 | :53 | 2 |
| KDFW | Dallas, TX | 06:40 | 05:53 | :53 | 3 |
| KDAL | Dallas Love Field, TX | — | 05:53 | :53 | 3 |
| KDEN | Denver, CO | 07:31 | 06:53 | :53 | 4 |
| KDTW | Detroit, MI | 06:40 | 04:53 | :53 | — |
| KHOU | Houston, TX | 06:29 | 05:53 | :53 | 4 |
| KJAX | Jacksonville, FL | 06:32 | 04:56 | :56 | 2 |
| KLGA | LaGuardia, NY | 06:18 | 04:51 | :51 | 3 |
| KLAS | Las Vegas, NV | 08:44 | — | :56 | — |
| KLAX | Los Angeles, CA | 09:28 | 07:53 | :53 | 2 |
| KMIA | Miami, FL | 09:22 | 04:53 | :53 | 4 |
| KMSP | Minneapolis, MN | 07:12 | 05:53 | :53 | — |
| KBNA | Nashville, TN | 07:01 | 05:53 | :53 | 3 |
| KNYC | New York, NY | 06:18 | 04:51 | :51 | 2 |
| KOKC | Oklahoma City, OK | 07:28 | 05:52 | :52 | 3 |
| KPHL | Philadelphia, PA | 05:55 | 04:54 | :54 | 2 |
| KPHX | Phoenix, AZ | 08:16 | 06:51 | :51 | 3 |
| KSAT | San Antonio, TX | 08:01 | 05:51 | :51 | 4 |
| KSFO | San Francisco, CA | 08:51 | 07:56 | :56 | 2 |
| KSEA | Seattle, WA | 09:33 | 07:53 | :53 | 2 |
| KTPA | Tampa, FL | 09:27 | 04:53 | :53 | 3 |
| KDCA | Washington D.C. | 07:32 | 04:52 | :52 | 1 |

## 6-Hour High/Low Reports

These METARs include 6-hour maximum and minimum temperatures, useful for tracking intraday temperature trends.

| UTC Time | Label | Description |
|----------|-------|-------------|
| 05:53 | 00Z+6h | Overnight period |
| 11:53 | 06Z+6h | Morning period |
| 17:53 | 12Z+6h | Afternoon period |
| 23:53 | 18Z+6h | Evening period |

## CLI Report Details

The CLI (Climatological Report) is published by the National Weather Service and contains:

- **High Temperature**: Maximum temperature for the day
- **Low Temperature**: Minimum temperature for the day
- **Times**: When the high and low occurred
- **Precipitation**: Daily precipitation totals
- **Snowfall**: Daily snow amounts (when applicable)

### Important Notes

1. **Settlement**: Kalshi weather markets settle on the CLI high temperature
2. **Timing**: CLI is typically released the morning after the observation day
3. **Variability**: CLI release times can vary by ±35 minutes from typical times
4. **Rounding**: All temperatures are rounded to the nearest whole degree Fahrenheit

## Data Sources

### Primary Sources

- **NWS API**: `https://api.weather.gov/`
- **IEM CLI**: `https://mesonet.agron.iastate.edu/json/cli.py`
- **IEM Daily**: `https://mesonet.agron.iastate.edu/api/1/daily.json`

### External Resources

For each station, the following resources are available:

- **NWS Time Series**: Live temperature observations
- **CLI Report Feed**: Official settlement data via IEM
- **IEM ASOS History**: Historical observation data
- **IEM DSM Feed**: Daily summary messages
- **wethr.net City Resources**: https://wethr.net/edu/city-resources - Comprehensive data release schedule for all markets

## CLI vs DSM

| Aspect | CLI | DSM |
|--------|-----|-----|
| **Purpose** | Official daily climatological record | Interim observations |
| **Settlement** | Used for Kalshi markets | Not used |
| **Frequency** | Once daily | 1-4 times daily |
| **Content** | Final high/low for the day | "High so far" / "Low so far" |
| **Timing** | Morning after observation day | Throughout the day |

## Usage in Application

The data schedule is configured in `src/config/dataSchedule.js` and used by:

- `ResolutionWidget`: Displays CLI data with countdown to next release
- `ResolutionModal`: Detailed view with DSM data, schedule, and resources
- `useDataReleaseCountdown`: Hook for countdown timers
- `useDSM`: Hook for fetching Daily Summary data
