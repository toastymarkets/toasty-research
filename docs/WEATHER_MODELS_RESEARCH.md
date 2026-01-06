# Weather Forecasting Models Research

## Executive Summary

This document provides comprehensive research on weather forecasting models to inform both our ModelsWidget design and potential educational features. Understanding how professional forecasters interpret model data gives us a significant edge in weather prediction markets.

---

## Table of Contents

1. [Major Weather Models](#major-weather-models)
2. [Model Accuracy Rankings](#model-accuracy-rankings)
3. [Model Characteristics Comparison](#model-characteristics-comparison)
4. [Known Model Biases](#known-model-biases)
5. [How Professional Forecasters Use Models](#how-professional-forecasters-use-models)
6. [Ensemble Forecasting](#ensemble-forecasting)
7. [National Blend of Models (NBM)](#national-blend-of-models-nbm)
8. [Resolution: What Actually Matters](#resolution-what-actually-matters)
9. [Visualizing Model Data](#visualizing-model-data)
10. [Implications for Weather Trading](#implications-for-weather-trading)
11. [Data Sources & APIs](#data-sources--apis)
12. [Widget Enhancement Ideas](#widget-enhancement-ideas)

---

## Major Weather Models

### Global Models

| Model | Full Name | Provider | Country | Best For |
|-------|-----------|----------|---------|----------|
| **ECMWF/IFS** | Integrated Forecasting System | European Centre | EU | Medium-range (3-10 days), considered most accurate globally |
| **GFS** | Global Forecast System | NOAA | USA | Extended forecasts (up to 16 days), free and widely available |
| **ICON** | Icosahedral Nonhydrostatic | DWD | Germany | High-resolution European forecasts |
| **UKMO** | Unified Model | UK Met Office | UK | Ranked 2nd globally for accuracy |
| **GEM** | Global Environmental Multiscale | CMC | Canada | North American forecasting |
| **JMA/GSM** | Global Spectral Model | JMA | Japan | Pacific and Asian forecasting |

### Regional/Mesoscale Models

| Model | Provider | Resolution | Forecast Range | Update Frequency | Best Use Case |
|-------|----------|------------|----------------|------------------|---------------|
| **HRRR** | NOAA | 3 km | 18-48 hours | Hourly | Severe weather, thunderstorm timing |
| **NAM** | NOAA | 12 km | 84 hours | Every 6 hours | Short-range continental US |
| **AROME** | Météo-France | 1.3 km | 48 hours | Every hour | European convection |
| **ICON-D2** | DWD | 2 km | 48 hours | Every 3 hours | Central European detail |

### AI/ML Models (Emerging)

| Model | Provider | Notes |
|-------|----------|-------|
| **AIFS** | ECMWF | First operational AI model (Feb 2025), ~10% better than physics models |
| **GenCast** | DeepMind | 97.2% more accurate than ECMWF ensemble beyond 36 hours |
| **GraphCast** | DeepMind | 10-day forecasts in under a minute |
| **Pangu-Weather** | Huawei | Competitive with ECMWF |

---

## Model Accuracy Rankings

### Global Model Rankings (2025)

1. **ECMWF** - Considered the "gold standard" globally
2. **UKMO** - UK Met Office, consistently ranks 2nd
3. **GFS** - US model, slightly behind but free and widely available
4. **ICON** - Excellent for Europe
5. **GEM** - Strong for North America

### Key Insight for Trading

> "The GFS model will predict conditions out to 16 days, but is most accurate in the 1-4 day range. In the 0-12 hour timeframe forecasters blend GFS with HRRR, and from 12-24 hours they blend GFS with NAM."

**Resolution Matters:**
- ECMWF: 9-14 km resolution
- GFS: 13-25 km resolution
- HRRR: 3 km resolution (explicit storm-scale)

---

## Model Characteristics Comparison

### Open-Meteo Available Models

| Model | Resolution | Forecast Length | Update Frequency |
|-------|-----------|-----------------|------------------|
| ICON | 2-11 km | 7.5 days | Every 3 hours |
| GFS & HRRR | 3-25 km | 16 days | Every hour |
| ARPEGE & AROME | 1-25 km | 4 days | Every hour |
| IFS & AIFS | 25 km | 15 days | Every 6 hours |
| UKMO | 2-10 km | 7 days | Every hour |
| JMA MSM & GSM | 5-55 km | 11 days | Every 3 hours |
| GEM | 2.5 km | 10 days | Every 6 hours |
| MET Nordic | 1 km | 2.5 days | Every hour |

### Models We Currently Display

In our ModelsWidget, we show 6 models via Open-Meteo:

1. **GFS** - NOAA's global model, 16-day range
2. **NBM** - National Blend of Models (bias-corrected blend)
3. **ECMWF** - European model, most accurate globally
4. **ICON** - German DWD model
5. **GEM** - Canadian model
6. **JMA** - Japanese model

---

## Known Model Biases

Understanding systematic biases is **critical** for weather trading.

### GFS Biases

| Bias Type | Description | Magnitude |
|-----------|-------------|-----------|
| **Cold Bias (Daytime)** | Too cool during afternoon hours | ~2°C cold at 3pm under clear skies |
| **Warm Bias (Nighttime)** | Too warm overnight | ~1°C warm at 7am |
| **Progressive Bias** | Storms depicted faster/weaker/further east | Consistent tendency |
| **Diurnal Cycle** | Underestimates day/night temperature swing | 1-2°C |

### ECMWF Biases

| Bias Type | Description | Magnitude |
|-----------|-------------|-----------|
| **Diurnal Underestimation** | Underestimates day/night temp range | 1-2K in summer |
| **Nighttime Warm** | Too warm at night | ~1K |
| **Daytime Cold** | Too cold during day | ~1-2K |
| **Storm Amplification** | Over-amplifies developing storms | Tends to overdo intensity |

### Trading Implication

> **Example:** If you're betting on a high temperature market and both GFS and ECMWF show 78°F for an afternoon high, the *actual* high is likely to be **higher** (79-80°F) due to both models' daytime cold bias under clear skies.

---

## How Professional Forecasters Use Models

### The NWS Approach

1. **No Single Model is King** - Forecasters look at ALL available models
2. **Time-Based Blending:**
   - 0-12 hours: GFS + HRRR
   - 12-24 hours: GFS + NAM
   - 3-10 days: ECMWF weighted heavily
   - 10+ days: Ensemble means

3. **Pattern Recognition** - Experienced forecasters know when certain models perform better:
   - Pacific storms: GFS often too fast
   - Gulf moisture: NAM handles better than GFS
   - Severe weather: HRRR is the standard

### Professional Tools

| Tool | URL | Features |
|------|-----|----------|
| **Pivotal Weather** | pivotalweather.com | Model comparison, soundings, ensemble data |
| **Tropical Tidbits** | tropicaltidbits.com | GFS, ECMWF, ICON with animations |
| **NCEP MAG** | mag.ncep.noaa.gov | Official NWS model graphics |
| **Windy** | windy.com | Beautiful visualization, multiple models |

---

## Ensemble Forecasting

### What Are Ensembles?

Instead of running ONE forecast, you run **20-50+ forecasts** with slightly different initial conditions. This shows the **range of possible outcomes**.

### Key Ensemble Products

| Ensemble | Members | Provider | Use Case |
|----------|---------|----------|----------|
| **GEFS** | 31 | NOAA | US ensemble, free |
| **EPS** | 51 | ECMWF | Most accurate ensemble globally |
| **SREF** | 26 | NOAA | Short-range regional |
| **GEPS** | 21 | CMC | Canadian ensemble |

### Interpreting Ensembles

**Tight Clustering = High Confidence**
- If all 31 GEFS members show 45-47°F high, confidence is very high

**Wide Spread = Low Confidence**
- If members range from 40-55°F, the atmosphere is in an uncertain state

**Ensemble Mean**
- Average of all members - often more accurate than any single deterministic run

### Visualization Methods

1. **Spaghetti Plots** - Each member as a separate line
2. **Plume Diagrams** - Show probability distribution over time
3. **Postage Stamps** - Grid of individual member maps
4. **Probability Maps** - "% chance of exceeding X°F"

---

## National Blend of Models (NBM)

### What Makes NBM Special

The NBM is the NWS's "secret weapon" - a **statistically calibrated blend** of 31+ model systems (171 inputs for rainfall).

### How It Works

1. **Bias Correction** - Uses historical performance to correct systematic errors
2. **Model Output Statistics (MOS)** - Statistical post-processing
3. **Weighted Blending** - Different weights based on model skill for specific variables
4. **High Resolution** - 2.5 km grid spacing

### Why NBM Matters for Trading

> "The goal of the NBM is to create a highly accurate, calibrated, skillful, and consistent starting point for NWS forecasters."

**The NBM has already corrected for known biases.** If you're comparing raw GFS to NBM and they differ, the NBM is usually closer to reality.

---

## Resolution: What Actually Matters

### Spatial vs Temporal Resolution

**Spatial Resolution** (grid spacing) is generally MORE important than update frequency.

| Model | Grid Spacing | Notes |
|-------|-------------|-------|
| HRRR | 3 km | Can resolve individual thunderstorms |
| NAM 3km | 3 km | Convection-allowing |
| ICON-D2 | 2 km | European convection |
| GFS | 13 km (0.25°) | Cannot explicitly resolve storms |
| ECMWF | 9 km | Better than GFS but still parameterized |

### The Resolution Trade-off

> "A model which rapidly produces data at both a high spatial and temporal resolution may be underpinned by less rigorous model physics, and the skill of the forecast may be compromised."

**Key Insight:** High resolution doesn't always mean more accurate. ECMWF at 9km often beats HRRR at 3km for Day 2+ forecasts because ECMWF has better physics.

### What Resolution to Use When

| Forecast Period | Best Resolution Approach |
|-----------------|-------------------------|
| 0-6 hours | HRRR 3km |
| 6-24 hours | NAM 3km / HRRR |
| 1-3 days | Blend of NAM/GFS/ECMWF |
| 3-7 days | ECMWF/GFS deterministic |
| 7-14 days | Ensemble means |

---

## Visualizing Model Data

### How Windy Does It

Windy excels because it:
1. **Animates** - Shows time evolution smoothly
2. **Layers** - Overlay temp, wind, precip
3. **Compares** - Switch between models instantly
4. **Interpolates** - Makes coarse data look smooth

### How Professionals Do It

Professional forecasters use:
1. **Meteograms** - Time series at a point
2. **Cross-sections** - Vertical slices through atmosphere
3. **Soundings** - Vertical profile at a location
4. **Thickness charts** - 1000-500mb for temperature patterns
5. **Model comparisons** - Side-by-side same parameter

### Best Practices for Our Widget

1. **Show Spread** - Min/Max/Mean across models
2. **Time Evolution** - How models change over forecast horizon
3. **Consistency Indicator** - Do models agree?
4. **Historical Bias** - What has each model done lately?

---

## Implications for Weather Trading

### Model Consensus = Market Efficiency

> "The prediction market price represents the combined 'wisdom' of hundreds of traders analyzing all available weather models (GFS, Euro, NAM), private forecasts, and climate data in real-time - creating a live, financially-backed consensus."

When models disagree, there's trading opportunity. When they agree, the market is likely efficient.

### Trading Signals

| Signal | Interpretation | Action |
|--------|---------------|--------|
| All models agree | High confidence, market likely priced correctly | Follow consensus |
| Models diverging | Uncertainty, possible mispricing | Look for edge |
| One model outlier | Either wrong or sees something others miss | Investigate why |
| Ensemble spread widening | Confidence decreasing | Reduce position size |
| NBM differs from raw models | NBM has bias correction advantage | Trust NBM |

### High Temperature Specific Tips

For Kalshi high temp markets:

1. **Check model timing** - When is peak heating forecast?
2. **Compare to observations** - Is current temp tracking forecast?
3. **Watch for clouds** - Clouds can cap highs significantly
4. **Know the station** - Airport stations often read differently than downtown
5. **Bias correct mentally** - Add 1-2°F to afternoon model forecasts under clear skies

---

## Data Sources & APIs

### Free APIs

| Source | URL | Models Available |
|--------|-----|------------------|
| **Open-Meteo** | open-meteo.com | GFS, ECMWF, ICON, GEM, JMA, NBM + more |
| **NWS API** | api.weather.gov | Official forecasts, observations, alerts |
| **Iowa Environmental Mesonet** | mesonet.agron.iastate.edu | Historical data, CLI/DSM |

### Professional APIs (Paid)

| Source | Notes |
|--------|-------|
| **Climavision** | High-resolution proprietary models |
| **DTN** | Agricultural/commodity focus |
| **WSI/IBM** | Enterprise weather data |
| **Tomorrow.io** | Minute-by-minute forecasts |

---

## Widget Enhancement Ideas

### Educational Tab Content

Based on this research, we could add an educational section to the ModelsWidget:

1. **"What is this model?"** - Tap a model to learn about it
2. **"Why do models differ?"** - Explain initial conditions, physics, resolution
3. **"Model Track Record"** - Show recent verification scores
4. **Glossary** - Define terms like ensemble, resolution, bias

### Visualization Improvements

1. **Ensemble Plume** - Show GEFS spread as shaded region
2. **Model Consistency Score** - % of models within 2°F
3. **Trend Arrows** - Is model getting warmer/cooler with each run?
4. **Historical Bias Badge** - "GFS typically 1°F cold here"

### Advanced Features

1. **Spaghetti Plot** - Show ensemble members as lines
2. **Model vs Observation** - Real-time bias tracking
3. **Confidence Intervals** - Based on ensemble spread
4. **Smart Alerts** - "Models now in agreement" or "Spread widening"

---

## Sources

### Primary Research Sources
- [NWS About Models](https://www.weather.gov/about/models)
- [NWS National Blend of Models](https://www.weather.gov/news/200318-nbm32)
- [Open-Meteo Documentation](https://open-meteo.com/en/docs)
- [ECMWF vs GFS Comparison - Windy.app](https://windy.app/blog/ecmwf-vs-gfs-differences-accuracy.html)
- [Weather Model Comparisons - Weather.us](https://weather.us/model-charts)
- [Tropical Tidbits Forecast Models](https://www.tropicaltidbits.com/analysis/models/)
- [Pivotal Weather](https://home.pivotalweather.com)

### Ensemble & Interpretation
- [Royal Meteorological Society - How to Interpret Ensembles](https://www.rmets.org/metmatters/how-interpret-ensemble-forecast)
- [Penn State Ensemble Forecasting](https://www.e-education.psu.edu/meteo3/node/2284)

### Model Bias Research
- [GFS Temperature Bias Study](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021GL095101)
- [ECMWF Near-Surface Bias](https://www.ecmwf.int/en/newsletter/157/meteorology/addressing-biases-near-surface-forecasts)
- [NWS Model Performance Characteristics](https://www.wpc.ncep.noaa.gov/mdlbias/biastext.shtml)

### Weather Trading
- [Climavision Commodity Trading](https://climavision.com/commodity-trading/)
- [Climate Prediction Markets - Columbia Business School](https://business.columbia.edu/insights/magazine/surprising-power-climate-prediction-markets)

---

## Next Steps

1. **Implement bias indicators** - Show known biases in tooltip
2. **Add ensemble data** - Integrate GEFS spread into widget
3. **Track model performance** - Store recent model vs actual for each city
4. **Educational modal** - Build out the "Learn" tab
5. **Confidence scoring** - Algorithm to compute model agreement

---

*Last Updated: January 2026*
*Research by: Toasty Research Team*
