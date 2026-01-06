# ASCII Weather Background Project - Session Summary

**Date:** 2026-01-05
**Status:** Research complete, ready to begin implementation

## What We're Building

**Replace the current dynamic weather background with a full-screen ASCII-animated canvas** that visualizes real-time weather conditions behind the glass widgets.

### Vision

- Glass widgets **stay exactly as they are** (no changes to widget code)
- Behind them: living ASCII animation showing clouds, wind, rain, snow, sun, storms
- All driven by real weather data we already collect (NWS API)
- Monochrome navy → light blue color palette (matches existing design)
- Interactive: particles respond to widget expansion and mouse movement

### Key Design Decisions Made

✅ **Background replacement, not widget replacement** - ASCII is the backdrop, widgets stay glass
✅ **Box-drawing Unicode characters** - Full send on `░▒▓█` `→↘↓` `│║¦` etc.
✅ **Monochrome navy/blue palette** - `#001f3f` → `#7fdbff` based on temp/time
✅ **Multi-layer canvas** - 3 layers for parallax depth (background/midground/foreground)
✅ **Canvas-based initially** - Start with Canvas 2D API, can upgrade to WebGL later
✅ **Widget interaction** - Particles clear space around widgets, respond to expansion

## Technical Architecture

### 3-Layer Canvas System

```
┌─────────────────────────────────────────┐
│ Background Layer (z:0, 40% opacity)     │ ← Clouds, sun (slow drift)
│ Midground Layer (z:10, 60% opacity)     │ ← Wind flow particles
│ Foreground Layer (z:20, 90% opacity)    │ ← Rain/snow (fast)
│                                         │
│   ┌──────────────────┐                 │
│   │ Glass Widget     │ (z:30)          │ ← Existing widgets
│   └──────────────────┘                 │
└─────────────────────────────────────────┘
```

### Weather Conditions → ASCII

| Condition | Characters | Layer | Notes |
|-----------|-----------|-------|-------|
| Clouds | `░▒▓█` | Background | Procedural shapes, drift slowly |
| Wind | `→↘↓←↖` `═─` | Midground | Directional particles, speed-based |
| Rain | `│║¦` | Foreground | Vertical fall, density = intensity |
| Snow | `*❄✻` | Foreground | Drifting, affected by wind |
| Sun | `☼` + `─│/\` | Background | Rays, daytime + clear only |
| Lightning | `⚡` | Foreground | Flash + bolt, random during storms |

### Data Mapping

Real-time weather data → ASCII visualization:

```javascript
const weatherData = useNWSWeather(citySlug); // Already exists!

// Maps to:
- cloudCover (%) → cloud density
- windSpeed (mph) → particle count & animation speed
- windDirection (degrees) → particle flow direction
- precipType ('rain'|'snow') → character selection
- precipRate → particle density
- temperature → color gradient
- timeOfDay → color gradient
- conditions → severe weather effects
```

### Performance Targets

- **Desktop:** 60fps sustained, max 5000 particles
- **Laptop:** 60fps sustained, max 3000 particles
- **Mobile:** 30fps sustained, max 500 particles
- **Adaptive:** Monitor FPS, adjust particle count automatically

### File Structure (Planned)

```
src/components/weather/
  ├── ASCIIWeatherBackground.jsx      # Main component
  ├── layers/
  │   ├── BackgroundLayer.jsx         # Clouds, sun
  │   ├── MidgroundLayer.jsx          # Wind flow
  │   └── ForegroundLayer.jsx         # Precipitation
  ├── particles/
  │   ├── CloudParticle.js
  │   ├── WindParticle.js
  │   ├── RainDrop.js
  │   ├── Snowflake.js
  │   ├── Sun.js
  │   ├── Lightning.js
  │   └── ParticlePool.js             # Object pooling
  └── utils/
      ├── weatherMapper.js            # Data → viz config
      ├── colorSystem.js              # Navy → light blue
      └── performanceMonitor.js       # FPS tracking
```

## Key Technical Insights from Research

### Performance Optimization

1. **Multi-layer canvas** - Reduces repaints from 15-30/sec to 5-10/sec ([source](https://dev.to/nidal_tahir_cde5660ddbe04/buttery-smooth-scroll-animations-building-a-high-performance-canvas-parallax-effect-2m8l))
2. **Object pooling** - Reuse particle instances instead of create/destroy
3. **requestAnimationFrame** - Browser-optimized, auto-throttles when tab inactive
4. **Dirty rectangle rendering** - Only redraw changed regions
5. **Offscreen canvas** - Pre-render complex shapes (sun rays)
6. **Typed arrays** - Use `Float32Array` for particle data (faster memory access)
7. **Batch drawing** - Group particles by color, minimize context state changes

### Parallax Depth Creation

Different layer speeds create depth perception:
```javascript
const backgroundSpeed = windSpeed * 0.3;  // Slow (distant clouds)
const midgroundSpeed = windSpeed * 0.6;   // Medium (wind particles)
const foregroundSpeed = windSpeed * 1.0;  // Fast (close precipitation)
```

### ASCII Depth Techniques

From [Advanced ASCII Techniques](https://asciieverything.com/ascii-blog/advanced-ascii-techniques-shading-depth-and-perspective-in-text-art/):

1. Character size manipulation (smaller = distant)
2. Layering with overlap
3. Shading variation (character density gradients)
4. Atmospheric perspective (distant = lighter/sparser)
5. Speed-based parallax

### Widget Interaction

**Particles avoid widget areas:**
```javascript
// Get widget bounding boxes from DOM
const widgetBounds = Array.from(document.querySelectorAll('.widget'))
  .map(el => el.getBoundingClientRect());

// Redirect particles around widgets or fade them faster
if (isInWidgetArea(particle.x, particle.y)) {
  particle.life *= 0.5;  // Fade faster
  // Or push away from widget
}
```

**Expansion effect:**
When user expands widget inline, particles get pushed outward with force vector.

## Implementation Phases

### Phase 1: Base Infrastructure ⬅️ START HERE
- Create `ASCIIWeatherBackground.jsx` component
- Set up 3-layer canvas with z-index positioning
- Implement requestAnimationFrame loop
- Position glass widgets above canvas
- Basic canvas configuration (fonts, DPI, sizing)

### Phase 2: Weather Conditions
Priority order:
1. Wind (we already have particles from WindWidget - expand!)
2. Rain (simple vertical fall)
3. Clouds (procedural shapes)
4. Snow (drifting)
5. Sun (rays)

### Phase 3: Advanced Effects
- Parallax depth (different layer speeds)
- Severe weather (lightning, high winds, heavy snow)
- Widget interaction (clearing, expansion response)
- Mouse distortion (hover effects)

### Phase 4: Optimization
- Performance monitoring (FPS tracking)
- Mobile optimization (reduce particles)
- Object pooling
- Dirty rectangle rendering

### Phase 5: Polish
- Smooth weather transitions
- Data interpolation (smooth between 30s updates)
- Settings panel (toggle on/off, adjust density)
- Accessibility (reduced motion support)

## Research Documentation

All research and technical details documented in:
- **`docs/ASCII_VISUALIZATION_RESEARCH.md`** (1,051 lines)
  - Complete technical specs
  - Code examples for all weather conditions
  - Performance optimization techniques
  - 30+ research sources with links

## Questions to Revisit Later

- [ ] WebGL upgrade path for 10,000+ particles?
- [ ] Weather state transitions (rain → snow fade)?
- [ ] Reduced motion accessibility mode?
- [ ] Forecast data visualization (future conditions with transparency)?
- [ ] Sound design (ambient weather sounds)?
- [ ] Settings: user-configurable density/speed/opacity?

## Tomorrow's Focus

**Goal:** Get basic canvas infrastructure working with simple wind particles

**First tasks:**
1. Create `ASCIIWeatherBackground.jsx` base component
2. Set up 3-layer canvas system
3. Implement requestAnimationFrame loop
4. Port wind particles from WindWidget to background layer
5. Test z-index layering with existing widgets

**Integration point:**
- Current: `CityDashboardNew.jsx` has dynamic gradient background
- New: Wrap widgets with `<ASCIIWeatherBackground>` component
- Widgets pass through unchanged as children

## Color Palette Reference

```javascript
// Navy → Light Blue gradient
const navy = '#001f3f';      // Cold/night
const lightBlue = '#7fdbff';  // Warm/day

// Interpolate based on:
// - Temperature: 0°F → 100°F
// - Time: night → day
// Weighted: temp 60%, time 40%
```

## Character Sets Reference

```javascript
// Cloud shapes
clouds: ['░', '▒', '▓', '█']

// Wind/flow
arrows: ['→', '←', '↑', '↓', '↗', '↘', '↙', '↖']
horizontal: ['─', '━', '═']
vertical: ['│', '┃', '║']

// Precipitation
rain: ['|', '│', '║', '¦']
snow: ['*', '❄', '✻', '✼']

// Sun
sun: ['☼', '☀']
rays: ['\\', '|', '/', '─']

// Lightning
lightning: ['⚡', '↯']

// Density gradient (light → dark)
gradient: [' ', '.', '·', ':', ',', ';', '!', '|', '*', '#', '%', '@']
```

## Key Resources to Reference Tomorrow

### Wind Visualization
- [Esri/wind-js](https://github.com/Esri/wind-js) - Gold standard for wind particles
- [How I Built a Wind Map with WebGL - Mapbox](https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f)

### Canvas Performance
- [MDN: Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [HTML5 Canvas Performance Tips](https://gist.github.com/jaredwilli/5469626)

### Box Drawing Characters
- [Unicode Box Drawing Block](https://unicode-table.com/en/blocks/box-drawing/)
- [W3Schools UTF-8 Box Drawings](https://www.w3schools.com/charsets/ref_utf_box.asp)

---

**Ready to build tomorrow!** 🚀
