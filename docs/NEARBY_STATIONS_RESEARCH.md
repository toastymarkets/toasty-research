# Nearby Stations Widget - Research & Design

## Purpose

The Nearby Stations widget helps prediction market traders understand **hyperlocal temperature variations** across a metro area. This is critical because:

1. **Official settlement** uses a single airport station (e.g., KLAX for Los Angeles)
2. **Microclimate differences** can be 5-15°F within the same metro area
3. **PWS networks** provide ground-truth data from backyards, not airport tarmacs

---

## Data Sources Research

### 1. NWS ASOS/AWOS Stations (Current)

**What we have now:**
- ~6-10 stations per metro area
- Professional-grade equipment at airports
- METAR observations every ~5-20 minutes
- Running high calculation from today's observations

**Limitations:**
- Stations concentrated at airports
- Large gaps in residential/suburban coverage
- Airport heat island effects (concrete, jet exhaust)

### 2. Ambient Weather Network (AWN) - **RECOMMENDED**

**Overview:**
- 100,000+ personal weather stations worldwide
- High density in residential areas
- Updates every 2.5-16 seconds (configurable)

**API Access:**
The official API requires station ownership, but there's an **undocumented public API** used by the AWN web app that allows geolocation queries:

```python
from aioambient import OpenAPI

api = OpenAPI()
# Get devices within 3 miles of coordinates
devices = await api.get_devices_by_location(34.05, -118.25, 3.0)
# Returns MAC addresses of nearby stations

# Get current data from a specific station
data = await api.get_device_details("<MAC_ADDRESS>")
```

**Available Data Fields:**
| Field | Description |
|-------|-------------|
| `tempf` | Temperature (°F) |
| `feelsLike` | Feels-like temperature |
| `dewPoint` | Dew point |
| `humidity` | Relative humidity (%) |
| `windspeedmph` | Wind speed (mph) |
| `windgustmph` | Wind gust (mph) |
| `winddir` | Wind direction (degrees) |
| `baromrelin` | Barometric pressure (relative) |
| `hourlyrainin` | Hourly rainfall (inches) |
| `dailyrainin` | Daily rainfall total |
| `solarradiation` | Solar radiation (W/m²) |
| `uv` | UV index |

**Pros:**
- Free (no API key for public data)
- Dense residential coverage
- Real-time updates
- Rich data beyond just temperature

**Cons:**
- Undocumented API (may change)
- Variable data quality (citizen science)
- No official "running high" calculation

**Implementation:**
Would need a Vercel serverless function to proxy requests (CORS).

### 3. Weather Underground (WU)

**Overview:**
- 250,000+ PWS stations (largest network)
- Acquired by IBM in 2019
- API now requires paid subscription

**Access Options:**
1. **Paid API** - Not viable for free app
2. **Web Scraping** - Possible with `wunderground-pws` Python library
   - Uses BeautifulSoup to scrape station pages
   - Can average multiple stations
   - No API key required

**Available Data:**
- Temperature, humidity, pressure
- Wind speed/gust/direction
- Precipitation rate/total
- UV index, solar radiation

**Cons:**
- Scraping is fragile (site changes break it)
- Rate limiting/blocking risk
- Ethical concerns with scraping

### 4. PWSWeather

**Overview:**
- Powered by AerisWeather
- Requires data contribution for API access
- Good map visualization

**Not viable** for our use case (would need to run a PWS).

---

## Design: Collapsed vs Expanded Widget

### Collapsed (Current - 2x2 Grid)

**Purpose:** Quick glance at nearby temps and spread

**Shows:**
- 6 nearest NWS stations in table
- Map with dot markers
- Primary station highlighted
- Temperature spread (±X°)
- Time since update

**User Actions:**
- Hover to see station details
- Click to expand

### Expanded (Planned - Full Width)

**Purpose:** Deep dive into microclimate data for trading decisions

**Tab 1: NWS Stations** (enhanced)
| Feature | Description |
|---------|-------------|
| All stations | Show 10-15 stations, not just 6 |
| Running high chart | Mini sparkline of today's temps |
| Wind indicators | Show wind speed/direction |
| Larger map | Interactive pan/zoom |
| Station popups | Full observation data |

**Tab 2: PWS Network** (Ambient Weather)
| Feature | Description |
|---------|-------------|
| PWS stations | 20-50 nearby residential stations |
| Real-time temps | Updates every few seconds |
| Quality indicator | Station reliability score |
| Dense map | Heat map overlay option |
| Feels-like temps | Show apparent temperature |

### Why Two Tabs?

| NWS Stations | PWS Network |
|--------------|-------------|
| Official/calibrated | Citizen science |
| Settlement relevance | Microclimate detail |
| Sparse but reliable | Dense but variable |
| 5-20 min updates | Real-time updates |

Traders need **both** perspectives:
- NWS for what will likely be the settlement reading
- PWS for ground-truth neighborhood conditions

---

## Implementation Plan

### Phase 1: Enhanced Expanded View (NWS Only)

1. Add expand/collapse toggle to widget
2. Show all NWS stations when expanded
3. Add wind direction indicators
4. Larger, more interactive map
5. Running high mini-charts

### Phase 2: PWS Integration (Ambient Weather)

1. Create `/api/ambient-weather.js` Vercel function
   - Proxy for undocumented AWN API
   - Cache for 30 seconds
   - Rate limit handling

2. Create `useAmbientWeather.js` hook
   - `getStationsByLocation(lat, lon, radius)`
   - `getStationData(macAddress)`
   - Polling every 30s

3. Add "PWS" tab to expanded widget
   - Station table with more columns
   - Heat map visualization option
   - Quality filtering

### Phase 3: Data Quality & Insights

1. Station reliability scoring
   - Based on update frequency
   - Comparison to nearby stations
   - Historical variance

2. Microclimate analysis
   - Identify consistently hot/cold spots
   - Elevation correlation
   - Urban heat island detection

---

## Technical Notes

### API Endpoints Needed

```javascript
// Vercel function: /api/ambient-weather.js

// GET /api/ambient-weather?lat=34.05&lon=-118.25&radius=5
// Returns nearby PWS stations

// GET /api/ambient-weather?mac=XX:XX:XX:XX:XX:XX
// Returns current data for specific station
```

### Data Refresh Strategy

| Source | Collapsed | Expanded |
|--------|-----------|----------|
| NWS | 5 min | 2 min |
| AWN | — | 30 sec |

### Caching

```javascript
// localStorage keys
'nearby_nws_stations_v1_${citySlug}'  // Station list, 1 hour
'nearby_nws_obs_v1_${citySlug}'       // Observations, 5 min
'nearby_awn_stations_v1_${citySlug}'  // PWS list, 30 min
'nearby_awn_obs_v1_${citySlug}'       // PWS data, 30 sec
```

---

## Sources

- [Ambient Weather Network](https://ambientweather.net/) - 100K+ PWS stations
- [aioambient Python library](https://github.com/bachya/aioambient) - Undocumented API access
- [Ambient Weather API Docs](https://github.com/ambient-weather/api-docs) - Official API reference
- [Weather Underground PWS](https://www.wunderground.com/pws/overview) - 250K+ stations (paid API)
- [wunderground-pws scraper](https://github.com/lfhohmann/wunderground-pws) - Web scraping option
- [PWSWeather](https://www.pwsweather.com/) - AerisWeather-powered network
- [Visual Crossing](https://www.visualcrossing.com/resources/blog/replacing-the-weather-underground-api/) - WU API alternative

---

## Open Questions

1. **AWN API stability** - How often does the undocumented API change?
2. **Data quality filtering** - What metrics determine "good" PWS data?
3. **Map performance** - Can we render 50+ markers without lag?
4. **Mobile UX** - How does expanded view work on phones?
