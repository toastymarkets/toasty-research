# NOAA GOES Satellite Products - Research & Interpretation Guide

**Purpose**: Deep research into NOAA GOES satellite imagery products used in the SatelliteWidget
**Sources**: NOAA, NESDIS STAR, CIRA/RAMMB, GOES-R Program
**Date**: 2026-01-06

---

## Table of Contents

1. [Overview of GOES Satellites](#overview)
2. [Product 1: Air Mass RGB](#air-mass-rgb)
3. [Product 2: GeoColor](#geocolor)
4. [Product 3: Water Vapor (Band 10)](#water-vapor-band-10)
5. [Product 4: Infrared (Band 13)](#infrared-band-13)
6. [Educational Resources](#educational-resources)
7. [Animation Loop Investigation](#animation-loop-investigation)
8. [Implementation Recommendations](#implementation-recommendations)

---

## Overview of GOES Satellites {#overview}

### GOES Satellite System

**GOES** (Geostationary Operational Environmental Satellites) are a series of NOAA weather satellites positioned in geostationary orbit over the United States.

**Current Constellation**:
- **GOES-19 (GOES-East)** at 75.2°W - Covers Eastern US, Atlantic
- **GOES-18 (GOES-West)** at 137.2°W - Covers Western US, Pacific

### Advanced Baseline Imager (ABI)

The GOES-R Series satellites carry the ABI instrument with **16 spectral bands**:
- **Visible/Near-Infrared**: Bands 1-6 (cloud analysis, vegetation, aerosols)
- **Water Vapor**: Bands 8-10 (atmospheric moisture at different levels)
- **Infrared**: Bands 7, 11-16 (cloud-top temperatures, fire detection)

**Temporal Resolution**:
- Full Disk: Every 10 minutes
- CONUS: Every 5 minutes
- Mesoscale: Every 30-60 seconds

**Spatial Resolution**: 0.5-2 km depending on band

### Data Access

**Official Sites**:
- Main portal: https://www.goes.noaa.gov/
- NOAA STAR Imagery Viewer: https://www.star.nesdis.noaa.gov/GOES/
- RAMMB SLIDER (Interactive viewer): https://rammb-slider.cira.colostate.edu/

**CDN Structure**:
```
https://cdn.star.nesdis.noaa.gov/{SATELLITE}/ABI/{SECTOR}/{PRODUCT}/
Example: https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/latest.jpg
```

---

## Product 1: Air Mass RGB {#air-mass-rgb}

### What It Shows

**Air Mass RGB** is a multi-spectral composite designed to **visualize atmospheric dynamics** in the middle and upper troposphere. It highlights differences between air masses and identifies features critical to cyclone development.

**Band Composition**:
- **Red**: Water Vapor Difference (6.2 µm - 7.3 µm) → Shows moisture gradients
- **Green**: Ozone Difference (9.7 µm - 10.8 µm) → Indicates ozone levels (tropical vs mid-latitude air)
- **Blue**: Upper-Level Water Vapor (6.2 µm) → Shows temperature differences

### Color Interpretation

| Color | Air Mass Type | Characteristics |
|-------|---------------|-----------------|
| **Green** | Tropical air mass | Moist, low ozone, warm |
| **Greenish-Red** | Subtropical air mass | Moderately dry |
| **Blue** | Mid-latitude air mass | Cooler, mid-latitude characteristics |
| **Dark Red / Maroon** | Descending stratospheric air | Dry, high ozone, high potential vorticity (PV) |
| **White** | Deep clouds | High, thick cloud tops |
| **Beige** | Mid-level clouds | Intermediate cloud heights |

### How to Interpret

**Tropical Cyclones**:
- Appear mostly **white** (deep convection) surrounded by **green** (moist tropical air)
- Water vapor at 6.2 µm and 7.3 µm produce similar brightness temperatures
- Results in small red component values

**Extratropical Cyclones**:
- Show **blue and red** patterns indicating mid-latitude air
- **Dark red** areas indicate subsiding dry air from the stratosphere
- Associated with **jet streaks** and **PV anomalies**

**Frontal Boundaries**:
- Sharp color contrasts indicate boundaries between different air masses
- Particularly effective at showing **upper-level frontal zones**

### Meteorological Applications

**Primary Uses** (source: [GOES-R Satellite Imagery RGBs](https://www.goes-r.gov/featureStories/satelliteImageryRGBs.html)):
1. **Rapid cyclogenesis monitoring** - Track intensifying low-pressure systems
2. **Jet stream identification** - Locate jet streaks and wind maxima
3. **PV anomaly detection** - Identify potential vorticity features
4. **Air mass distinction** - Differentiate between polar and tropical air masses
5. **Storm environment diagnosis** - Assess pre-convective conditions

**Operational Value**:
- Originally designed for **extra-tropical cyclone monitoring**
- Helps forecasters quickly identify atmospheric features that would require analyzing multiple individual channels
- Critical for **medium-range forecasting** (3-7 days)

### References
- [CIRA Air Mass RGB Quick Guide](https://rammb.cira.colostate.edu/training/visit/quick_guides/QuickGuide_GOESR_AirMassRGB_final.pdf) (PDF)
- [RAMMB Air Mass Product Page](https://rammb2.cira.colostate.edu/research/goes-r/proving_ground/cira_product_list/msg-based_rgb_air_mass_product/)
- [CIMSS: Air Mass RGB Views Two Cyclones](https://cimss.ssec.wisc.edu/satellite-blog/archives/28840)

---

## Product 2: GeoColor {#geocolor}

### What It Shows

**GeoColor** is a hybrid product that approximates **true-color imagery** during the day and switches to **enhanced infrared** at night. It's designed to look as close as possible to what the Earth would look like from space with human eyes.

**Developed by**: CIRA (Cooperative Institute for Research in the Atmosphere)

**Band Composition**:
- **Daytime**: Uses 5 ABI channels to simulate true color (red, simulated green, blue visible bands)
- **Nighttime**: Infrared bands (7 and 13) with city lights overlay

### Color Interpretation

**Daytime Features**:

| Feature | Color | Notes |
|---------|-------|-------|
| Low-level water clouds | Light blue | Fog, stratus, low cumulus |
| Mid-level clouds | Grayish white | Alto-cumulus, alto-stratus |
| High/thick clouds | Bright white | Cirrus, cumulonimbus tops |
| Ocean surface | Blue shades | Varies by depth and clarity |
| Vegetation/forests | Green shades | Healthy vegetation |
| Dry land/desert | Brown/tan shades | Arid regions |
| Snow/ice | Bright white | Can be confused with clouds |
| Thick smoke | Dark gray/tan | Wildfire smoke plumes |
| Thin smoke | Bluish gray | Dispersed smoke |

**Nighttime Features**:

| Feature | Color | Notes |
|---------|-------|-------|
| Low clouds (liquid water) | Blue | Fog and stratus appear blue |
| High clouds (ice) | Gray to white | Colder cloud tops |
| City lights | Gold/yellow | **Static overlay, not real-time** |
| Clear sky | Dark purple/black | Cloud-free areas |

### How to Interpret

**Key Advantage**:
> "Since the colors of features in the daytime are what viewers expect them to be, the product requires little to no training." - NASA Earthdata

**Daytime Use**:
- Intuitive visualization requiring minimal meteorological training
- Excellent for public communication and media
- Helps distinguish **clouds from smoke** or **blowing dust**
- Vegetation health monitoring

**Nighttime Use**:
- **Blue coloring** highlights low-level clouds and fog (key difference from standard IR)
- Useful for **marine layer** and **fog forecasting**
- City lights provide geographic reference (from VIIRS Day Night Band compilation)

**Important Limitation**:
- Nighttime city lights are from a **static database**, not real-time
- Included for orientation purposes only

### Meteorological Applications

**Primary Uses** (source: [CIRA GeoColor Product Guide](https://www.star.nesdis.noaa.gov/GOES/documents/QuickGuide_CIRA_Geocolor_20171019.pdf)):
1. **General situational awareness** - Quick overview of weather patterns
2. **Public communication** - Intuitive for non-meteorologists
3. **Smoke and dust detection** - Distinguished from clouds by color
4. **Fog/low cloud monitoring** - Blue coloring at night reveals low clouds
5. **Tropical cyclone visualization** - Clear view of storm structure
6. **Snow cover identification** - Bright white areas (requires context to distinguish from clouds)

**Operational Value**:
- Minimal training required for interpretation
- Excellent for briefings and media presentations
- Complements other products by providing context

### References
- [CIRA GeoColor Quick Guide](https://www.star.nesdis.noaa.gov/GOES/documents/QuickGuide_CIRA_Geocolor_20171019.pdf) (PDF)
- [NASA: GeoColor Imagery Added to Worldview](https://www.earthdata.nasa.gov/learn/articles/goes-geocolor-worldview)
- [RAMMB GeoColor Detailed Product Page](https://rammb.cira.colostate.edu/research/goes-r/proving_ground/cira_product_list/geocolor_imagery_detailed.asp)

---

## Product 3: Water Vapor (Band 10) {#water-vapor-band-10}

### What It Shows

**Band 10** (7.3 µm) is the **Lower-Level Water Vapor channel** that senses atmospheric moisture in the **mid-to-lower troposphere** (roughly 500-700 mb level).

**Wavelength**: 7.3 µm (micrometers)
**Weighting Function Peak**: ~600 mb (~4 km altitude)

**Complementary Bands**:
- Band 8 (6.2 µm): Upper troposphere water vapor
- Band 9 (6.9 µm): Mid troposphere water vapor
- Band 10 (7.3 µm): **Lower troposphere water vapor** ← Used in widget

### Color Interpretation

**Standard Color Enhancement**:

| Color | Moisture Content | Brightness Temperature |
|-------|------------------|------------------------|
| **Bright blue/white** | High water vapor | Warmer (more moisture) |
| **Gray** | Moderate moisture | Intermediate |
| **Dark orange/brown** | Low/no moisture | Cooler (dry air) |

**Physical Meaning**:
- Water vapor **absorbs** infrared radiation at 7.3 µm
- High moisture → warmer brightness temperature → bright in imagery
- Dry air → cooler brightness temperature → dark in imagery

### How to Interpret

**Moisture Tracking**:
- **Bright areas**: High moisture content, potential for convection
- **Dark areas**: Dry air, subsidence, stable conditions
- **Sharp gradients**: Moisture boundaries, potential frontal zones

**Cloud Interference**:
- Dense clouds **obstruct** the view of lower-altitude moisture
- Band 10 cannot "see through" thick clouds
- This is a key limitation compared to clear-air analysis

**Animation Analysis**:
- Track **moisture plumes** moving into a region
- Identify **dry slots** wrapping into cyclones
- Monitor **moisture transport** from oceans to land

### Meteorological Applications

**Primary Uses** (source: [NOAA Band 10 Quick Guide](https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band10.pdf)):

1. **Lower tropospheric wind tracking** - Moisture features reveal air flow
2. **Jet streak identification** - Moisture boundaries often align with jets
3. **Severe weather potential** - High low-level moisture = fuel for storms
4. **Lower-level moisture estimation** - Quantify moisture availability
5. **Turbulence detection** - Sharp moisture gradients indicate instability
6. **Volcanic plume tracking** - SO₂ (sulfur dioxide) rich plumes are visible
7. **Lake effect snow monitoring** - Moisture streaming off Great Lakes

**Forecasting Value**:
- **Pre-convective assessment**: High Band 10 brightness = moisture for storms
- **Dry air intrusion**: Identifies dry air undercutting storms (weakening)
- **Atmospheric rivers**: Tracks moisture plumes from subtropics

**Comparison to Other WV Bands**:
- Band 8 (upper level): Jet streams, upper-level divergence
- Band 9 (mid level): Mid-tropospheric moisture, balanced view
- Band 10 (lower level): **Surface-based convection fuel**, low-level jets

### References
- [NOAA Band 10 ABI Quick Guide](https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band10.pdf) (PDF)
- [CIMSS Water Vapor Imagery Tutorial](https://cimss.ssec.wisc.edu/goes/misc/wv/wv_intro.html)
- [Penn State METEO 3: Water Vapor Imagery](https://www.e-education.psu.edu/meteo3/l5_p6.html)

---

## Product 4: Infrared (Band 13) {#infrared-band-13}

### What It Shows

**Band 13** (10.3 µm) is a **"Clean" Infrared Window** channel that measures thermal radiation from the Earth's surface and cloud tops with minimal atmospheric interference.

**Wavelength**: 10.3 µm (micrometers)
**Type**: Longwave infrared window (thermal)

**"Clean" Designation**: Less sensitive to water vapor absorption than traditional IR channels (like Band 14 at 11.2 µm), providing a clearer view.

### Brightness Temperature Interpretation

**Physical Principle**:
Objects emit infrared radiation proportional to their temperature (Stefan-Boltzmann Law). Colder objects appear brighter in enhanced IR imagery.

**Standard Color Enhancement**:

| Feature | Brightness Temp | Color (typical) | Height/Meaning |
|---------|----------------|-----------------|----------------|
| **Very cold cloud tops** | < -60°C | White/bright | High cumulonimbus, severe storms |
| **Cold clouds** | -40°C to -60°C | Light gray | Cirrus, mid-level clouds |
| **Warm clouds** | -20°C to -40°C | Dark gray | Low clouds, stratus |
| **Very warm clouds/surface** | > -20°C | Dark/black | Fog, low stratus, clear ground |
| **Warm surface** | +10°C to +30°C | Black | Clear sky land/ocean |

**Key Relationship**:
- **Colder** = **Higher** cloud tops = **More intense** convection
- **Warmer** = **Lower** clouds or **clear sky**

### How to Interpret

**Cloud-Top Height Estimation**:
- Extremely cold tops (< -60°C) indicate **overshooting tops** in severe thunderstorms
- Rapid cooling in animation = **explosive convective development**
- Warming tops = **Weakening convection**

**Day/Night Capability**:
- Works **24/7** unlike visible channels
- Critical for nighttime monitoring of:
  - Tropical cyclones
  - Severe weather
  - Fog development

**Comparison to Other IR Bands**:
- **Band 13 (10.3 µm)**: "Cleaner" signal, less water vapor contamination
- **Band 14 (11.2 µm)**: Traditional IR window, slightly more moisture sensitive
- **Band 7 (3.9 µm)**: Shortwave IR, sensitive to low clouds and fog

### Meteorological Applications

**Primary Uses** (source: [NOAA Band 13 Quick Guide](https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band13.pdf)):

1. **Air temperature estimation** - Derive atmospheric temperature profiles
2. **Tropopause location** - Identify boundary between troposphere and stratosphere
3. **Cloud-top height retrieval** - Essential for aviation and storm analysis
4. **Cloud-drift winds** - Track features to calculate wind speed/direction
5. **ASOS supplementation** - Fill gaps in automated surface observations
6. **Storm intensity estimation** - Colder tops = stronger updrafts
7. **Fog/low cloud detection** - Identify low-level features (better with multi-band)

**Severe Weather Applications**:
- **Overshooting tops**: Extremely cold pixels (< -70°C) indicate violent updrafts
- **Enhanced-V signature**: V-shaped cold region = strong updraft, potential tornadic
- **Rapid intensification**: Quick cooling = explosive development

**Tropical Cyclone Analysis**:
- **Eye temperature**: Warmer eye = stronger storm
- **Central Dense Overcast (CDO)**: Cold ring around eye
- **Dvorak Technique**: Uses IR temps for intensity estimation

**Aviation**:
- Identify areas of deep convection (icing, turbulence hazard)
- Cloud-top heights for route planning
- Volcanic ash detection (when combined with other bands)

### References
- [CIMSS Band 13 Quick Guide](https://cimss.ssec.wisc.edu/goes/OCLOFactSheetPDFs/ABIQuickGuide_Band13.pdf) (PDF)
- [NOAA STAR Band 13 Information](https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band13.pdf) (PDF)
- [NOAA JetStream: GOES East](https://www.noaa.gov/jetstream/goes_east)

---

## Educational Resources {#educational-resources}

### Official Quick Guides

**CIRA/RAMMB Quick Guides** (PDF format):
- Air Mass RGB: https://rammb.cira.colostate.edu/training/visit/quick_guides/QuickGuide_GOESR_AirMassRGB_final.pdf
- GeoColor: https://www.star.nesdis.noaa.gov/GOES/documents/QuickGuide_CIRA_Geocolor_20171019.pdf
- Band 10 (Water Vapor): https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band10.pdf
- Band 13 (IR): https://www.star.nesdis.noaa.gov/GOES/documents/ABIQuickGuide_Band13.pdf

**Complete Quick Guide Collection**:
http://rammb.cira.colostate.edu/training/visit/quick_guides/

### Comprehensive Training

**Beginner's Guide to GOES-R Series Data**:
https://www.goes-r.gov/downloads/resources/documents/Beginners_Guide_to_GOES-R_Series_Data.pdf

**RAMMB Satellite Foundational Course (SatFC-G)**:
https://rammb.cira.colostate.edu/training/visit/training_sessions/satfc-g.asp
- Modular training grouped by topics
- Includes quizzes and runtime estimates
- Covers all ABI bands and RGB products

**GOES-R Training Portal**:
https://www.goes-r.gov/users/training/imagery.html
- Band-specific training modules
- RGB product interpretation guides
- Downloadable presentations

### Interactive Tools

**RAMMB SLIDER** (Satellite Loop Interactive Data Explorer):
https://rammb-slider.cira.colostate.edu/
- Real-time GOES-16/17/18/19 imagery
- All bands and RGB products
- Custom time loops
- Multi-panel comparisons

**NOAA STAR GOES Imagery Viewer**:
https://www.star.nesdis.noaa.gov/GOES/
- Official NOAA interface
- Full Disk, CONUS, Mesoscale, Sectoral views
- Pre-generated loops (12-96 hours)
- Direct access to CDN imagery

**CIMSS GOES Image Viewer**:
http://cimss.ssec.wisc.edu/goes/goesdata.html
- University of Wisconsin viewer
- High-quality imagery
- Educational annotations

### Key Organizations

**CIRA** (Cooperative Institute for Research in the Atmosphere):
- Partnership with RAMMB and NOAA
- Develops GeoColor and many RGB products
- Located at Colorado State University

**RAMMB** (Regional and Mesoscale Meteorology Branch):
- NOAA NESDIS branch
- Satellite product development and validation
- Training material creation

**NOAA STAR** (Center for Satellite Applications and Research):
- Official GOES data distribution
- Algorithm development
- Product validation

### Additional Learning Resources

**ABI Bands Quick Info**:
https://www.goes-r.gov/education/ABI-bands-quick-info.html
- Overview of all 16 ABI bands
- Common applications for each

**Satellite Imagery RGBs Feature Story**:
https://www.goes-r.gov/featureStories/satelliteImageryRGBs.html
https://www.nesdis.noaa.gov/news/satellite-imagery-rgbs-adding-value-saving-time
- RGB product overview
- Operational applications
- Case studies

**COMET MetEd**:
https://www.meted.ucar.edu/
- Free online courses on satellite meteorology
- Self-paced learning modules
- Certificates available

---

## Animation Loop Investigation {#animation-loop-investigation}

### Current Issue

The SatelliteWidget currently uses pre-generated GIF animations from NOAA's CDN:
```
https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-AirMass-625x375.gif
```

**Reported Problem**: Animations appear to play in **reverse chronological order** (newest frame first → oldest frame last), which is counter-intuitive for tracking storm motion and development.

### Investigation Findings

**Search Results**:
- No official NOAA documentation found specifying frame order in pre-generated GIFs
- NOAA STAR website offers GIF downloads but doesn't document internal frame sequence
- Third-party tools exist that create custom GIF animations from NOAA imagery

**Potential Causes**:
1. **CDN Convention**: NOAA may generate GIFs with newest-first ordering
2. **Browser Rendering**: Unlikely - GIF frame order is fixed in file
3. **Incorrect URL**: Possible different URL has forward-playing version

### Verification Methods

To definitively determine frame order:

1. **Download and Extract Frames**:
   ```bash
   # Download sample GIF
   curl -o test.gif "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-GEOCOLOR-625x375.gif"

   # Extract frames with timestamps
   ffmpeg -i test.gif -vsync 0 frame_%03d.png
   ```

2. **Check Individual JPG Timestamps**:
   - Navigate CDN directory: https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/
   - Compare JPG timestamps to GIF frame sequence

3. **Contact NOAA**:
   - Email: NESDIS.STAR.webmaster@noaa.gov
   - Request documentation on GIF frame ordering

### Alternative Solutions

**Option 1: Custom Frame-by-Frame Animation**

The project already has infrastructure for this in `src/utils/satellite.js`:

```javascript
// Generate URLs for frames at specific times
function generateFrameUrl(satellite, sector, band, imageSize, minutesAgo)

// Preload images for smooth animation
function preloadImage(url)
```

**Implementation** (similar to `WeatherMap.jsx`):
1. Generate array of frame URLs for past 4 hours
2. Preload all frames
3. Cycle through frames with `setInterval` in **forward chronological order**
4. Gives complete control over frame order, speed, and timing

**Advantages**:
- ✅ Guaranteed chronological order
- ✅ Customizable frame count and interval
- ✅ Regional sector support (not just CONUS)
- ✅ Play/pause controls
- ✅ Frame scrubbing capability

**Disadvantages**:
- ❌ More complex implementation
- ❌ Higher bandwidth (downloading individual frames vs single GIF)
- ❌ Requires loading state during frame preload

**Option 2: CSS/JavaScript GIF Reversal**

**Not Recommended**: Browsers don't natively support reversing GIF playback. Would require:
- Extracting frames with canvas API
- Reversing frame array
- Re-rendering as animation
- Very inefficient and complex

**Option 3: Find Alternative NOAA URLs**

**Investigation Needed**: Check if NOAA offers:
- Different GIF endpoints with forward chronology
- MP4/WebM video alternatives (can be reversed with CSS)
- RAMMB SLIDER API access

### Recommended Path Forward

**Immediate**:
1. Verify current frame order by downloading and extracting a test GIF
2. Check NOAA documentation or contact NESDIS.STAR.webmaster@noaa.gov

**Short-term**:
- If GIFs are confirmed reversed: Implement custom frame-by-frame animation using existing `satellite.js` utilities

**Long-term**:
- Custom animation provides better UX (play/pause, scrubbing, speed control)
- Enables regional sector support
- Aligns with existing `WeatherMap.jsx` pattern

---

## Implementation Recommendations {#implementation-recommendations}

### 1. Add Explanatory Tooltips

Each satellite product tab should have an info icon (ⓘ) with a tooltip explaining:

**Air Mass RGB**:
> "Shows atmospheric dynamics and air masses. Green = tropical/moist air, blue = mid-latitude air, dark red = descending dry air. Useful for tracking cyclones and jet streams."

**GeoColor**:
> "Simulates true-color view during the day, infrared at night. Blue nighttime colors show low clouds and fog. Most intuitive product for general weather monitoring."

**Water Vapor**:
> "Lower-level moisture (mid-troposphere). Bright = high moisture, dark = dry air. Tracks moisture plumes, identifies dry slots, and shows pre-storm moisture."

**Infrared**:
> "Cloud-top temperatures. White/bright = very cold/high clouds (severe weather), dark = warm/low clouds or clear sky. Works day and night."

### 2. Add "Learn More" Links

Each product should link to its official Quick Guide:

```jsx
<a
  href="https://rammb.cira.colostate.edu/training/visit/quick_guides/"
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
>
  Learn more about {productName} <ExternalLink size={10} />
</a>
```

### 3. Add Product-Specific Metadata

Extend `SATELLITE_PRODUCTS` object:

```javascript
const SATELLITE_PRODUCTS = {
  airmass: {
    name: 'Air Mass',
    shortDesc: 'Atmospheric dynamics & cyclone tracking',
    fullDesc: 'Multi-band composite showing air mass characteristics...',
    applications: ['Cyclone monitoring', 'Jet stream identification', 'Frontal analysis'],
    learnMoreUrl: 'https://rammb.cira.colostate.edu/training/visit/quick_guides/QuickGuide_GOESR_AirMassRGB_final.pdf',
    still: '...',
    animated: '...',
  },
  // ... etc
};
```

### 4. Add Interactive Color Legend

For Air Mass RGB, add a collapsible legend:

```jsx
<details className="mt-2 text-xs">
  <summary className="cursor-pointer text-blue-400">Show color guide</summary>
  <dl className="mt-2 space-y-1">
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 bg-green-500 rounded"></span>
      <dt className="font-medium">Green:</dt>
      <dd className="text-white/75">Tropical/moist air</dd>
    </div>
    {/* ... more colors */}
  </dl>
</details>
```

### 5. Regional Sector Support

**Priority Enhancement**: Switch from hardcoded CONUS to city-specific sectors

```javascript
// Accept props
function SatelliteWidget({ citySlug, cityName }) {
  const cityConfig = MARKET_CITIES[citySlug];
  const { satellite, sector } = getGOESConfig(cityConfig.lon, cityConfig.lat);

  // Build URLs dynamically
  const productUrl = `https://cdn.star.nesdis.noaa.gov/${satellite}/ABI/SECTOR/${sector}/${product}/latest.jpg`;
}
```

**Impact**:
- Higher resolution imagery for specific regions
- Relevant coverage area (not always full CONUS)
- Matches pattern used in `WeatherMap.jsx`

### 6. Loading States

Add skeleton loaders for better UX:

```jsx
{isLoading && (
  <div className="absolute inset-0 bg-gray-800/50 animate-pulse rounded-lg" />
)}
```

### 7. Timestamp from Image Metadata

Consider parsing actual image timestamp from NOAA's filename convention:
```
2024123015_GOES19-ABI-CONUS-GEOCOLOR-625x375.jpg
      └─ YYYYDDDHHNN (Year, Day of Year, Hour, Minute)
```

This would show **actual capture time** rather than client-side load time.

### 8. Accessibility

Add comprehensive ARIA labels:

```jsx
<nav role="tablist" aria-label="Satellite product selection">
  <button
    role="tab"
    aria-selected={activeTab === 'airmass'}
    aria-controls="satellite-image-panel"
    id="tab-airmass"
  >
    Air Mass
  </button>
</nav>

<div
  role="tabpanel"
  aria-labelledby="tab-airmass"
  id="satellite-image-panel"
>
  <img ... />
</div>
```

### 9. Error Handling with Context

Provide helpful error messages:

```jsx
{imageError && (
  <div className="error-state">
    <AlertCircle />
    <p>Unable to load {SATELLITE_PRODUCTS[activeTab].name} imagery</p>
    <p className="text-xs text-white/50">
      This may be due to a temporary NOAA server issue or network problem.
    </p>
    <button onClick={handleRetry}>Retry</button>
    <a href="https://www.star.nesdis.noaa.gov/GOES/" target="_blank">
      View on NOAA GOES →
    </a>
  </div>
)}
```

---

## Summary

The NOAA GOES satellite system provides powerful tools for weather analysis and forecasting. The four products in the SatelliteWidget serve complementary purposes:

1. **Air Mass RGB**: Advanced meteorologist tool for atmospheric dynamics
2. **GeoColor**: Intuitive true-color proxy for general awareness
3. **Water Vapor**: Moisture tracking and convective potential
4. **Infrared**: Cloud-top temperatures and 24/7 monitoring

**Key Improvements Needed**:
- ✅ Add educational tooltips and links
- ✅ Implement regional sector support
- ✅ Fix animation chronology (investigate + potential custom animation)
- ✅ Add proper error handling
- ✅ Improve accessibility

With these enhancements, the SatelliteWidget will be a valuable research tool for understanding meteorological conditions relevant to prediction market trading.

---

## Sources

- [NOAA GOES Program](https://www.goes.noaa.gov/)
- [NOAA STAR GOES Imagery](https://www.star.nesdis.noaa.gov/GOES/)
- [GOES-R Series](https://www.goes-r.gov/)
- [CIRA/RAMMB Training Resources](https://rammb.cira.colostate.edu/training/visit/quick_guides/)
- [RAMMB SLIDER](https://rammb-slider.cira.colostate.edu/)
- [NASA Earthdata: GeoColor](https://www.earthdata.nasa.gov/learn/articles/goes-geocolor-worldview)
- [GOES-R Satellite Imagery RGBs](https://www.goes-r.gov/featureStories/satelliteImageryRGBs.html)
- [CIMSS Satellite Blog: Air Mass RGB](https://cimss.ssec.wisc.edu/satellite-blog/archives/28840)
- [CIMSS Water Vapor Tutorial](https://cimss.ssec.wisc.edu/goes/misc/wv/wv_intro.html)
