# ASCII Weather Background Visualization Research

## Refined Vision (Updated 2026-01-05)

Replace Toasty's current dynamic weather background (time-based gradients) with a **full-screen ASCII-animated canvas** that visualizes real-time weather conditions. Glass widgets remain unchanged - the ASCII layer sits behind them, creating an immersive atmospheric backdrop driven by actual weather data.

## Core Concept

**Background Layer Architecture:**
```
┌─────────────────────────────────────────┐
│  Full-screen ASCII Weather Canvas      │ ← Real-time weather viz
│    ┌──────────────────┐                │
│    │ Glass Widget     │                │ ← Existing widgets
│    │ (unchanged)      │                │
│    └──────────────────┘                │
│  ┌──────────────────┐                  │
│  │ Glass Widget     │                  │
│  │ (unchanged)      │                  │
│  └──────────────────┘                  │
│                                         │
└─────────────────────────────────────────┘
```

**Weather conditions visualized:**
- **Clouds** - Box-drawing characters forming drifting cloud shapes
- **Wind** - Directional flow particles with speed-based animation
- **Rain** - Vertical falling characters, density = intensity
- **Snow** - Drifting asterisks/snowflakes
- **Sun** - Radiating rays (daytime, clear conditions)
- **Storms** - Lightning bolts, heavy precipitation
- **Clear** - Sparse particles, gentle ambient movement

**Color palette:**
- Monochrome navy (#001f3f) → light blue (#7fdbff) gradient
- Temperature/time-based: colder/night = darker navy, warmer/day = lighter blue
- Maintains existing Toasty blue palette

## Technical Architecture

### Multi-Layer Canvas System

**Parallax depth with multiple canvas layers:**

```html
<div id="ascii-weather-background">
  <canvas id="background-layer" class="z-0"></canvas>   <!-- Far: slow-moving clouds -->
  <canvas id="midground-layer" class="z-10"></canvas>   <!-- Mid: wind flow, light precip -->
  <canvas id="foreground-layer" class="z-20"></canvas>  <!-- Near: heavy precip, particles -->

  <!-- Glass widgets float above -->
  <div class="widgets-container z-30">
    <!-- Existing widgets here -->
  </div>
</div>
```

**CSS positioning:**
```css
.ascii-weather-background canvas {
  position: absolute;
  width: 100%;
  height: 100%;
}

#background-layer { z-index: 0; opacity: 0.4; }  /* Distant, subtle */
#midground-layer { z-index: 10; opacity: 0.6; }  /* Medium depth */
#foreground-layer { z-index: 20; opacity: 0.9; } /* Close, prominent */
.widgets-container { z-index: 30; }               /* Widgets on top */
```

**Performance insight:** Each 1920×1080 canvas layer consumes ~8MB GPU memory. Source: [Buttery-Smooth Canvas Parallax](https://dev.to/nidal_tahir_cde5660ddbe04/buttery-smooth-scroll-animations-building-a-high-performance-canvas-parallax-effect-2m8l)

### Depth Creation Techniques

**ASCII-specific depth methods** from [Advanced ASCII Techniques](https://asciieverything.com/ascii-blog/advanced-ascii-techniques-shading-depth-and-perspective-in-text-art/):

1. **Character size manipulation** - Smaller chars = distant, larger = close
2. **Layering with overlap** - Foreground elements overlap background
3. **Shading variation** - Character density gradients (`.,:;!|*#%@`)
4. **Atmospheric perspective** - Distant elements lighter/sparser
5. **Vanishing points** - One-point perspective for depth
6. **Speed-based parallax** - Far layers move slower than near

**Parallax implementation:**
```javascript
// Different movement speeds create depth
const backgroundSpeed = windSpeed * 0.3;  // Slow (distant clouds)
const midgroundSpeed = windSpeed * 0.6;   // Medium (wind particles)
const foregroundSpeed = windSpeed * 1.0;  // Fast (close precipitation)
```

### Weather Condition Mapping

**Data → Visualization logic:**

```javascript
const weatherData = useNWSWeather(citySlug);

const visualizationConfig = {
  // Cloud layer (background)
  clouds: {
    density: weatherData.cloudCover / 100,        // 0-1
    speed: weatherData.windSpeed * 0.3,           // Slow drift
    characters: ['░', '▒', '▓', '█'],            // Box-drawing
    layer: 'background'
  },

  // Wind layer (midground)
  wind: {
    enabled: weatherData.windSpeed > 5,
    speed: weatherData.windSpeed,                 // mph → pixels/frame
    direction: weatherData.windDirection,         // degrees
    characters: ['═', '─', '>', '<', '↑', '↓'],  // Directional
    particleCount: Math.floor(weatherData.windSpeed * 10),
    layer: 'midground'
  },

  // Precipitation layer (foreground)
  precipitation: {
    type: weatherData.precipType,                 // 'rain' | 'snow' | null
    rate: weatherData.precipRate,                 // intensity
    characters: weatherData.precipType === 'rain' ? ['|', '│', '¦'] : ['*', '❄', '✻'],
    fallSpeed: weatherData.precipType === 'rain' ? 8 : 3,  // rain faster than snow
    density: weatherData.precipRate * 100,        // particle count
    layer: 'foreground'
  },

  // Sun (background, clear conditions only)
  sun: {
    enabled: weatherData.cloudCover < 30 && isDaytime(weatherData),
    position: calculateSunPosition(weatherData.sunrise, weatherData.sunset),
    characters: ['☼', '\\', '|', '/'],            // Rays
    layer: 'background'
  },

  // Severe weather (foreground)
  severe: {
    lightning: weatherData.conditions.includes('thunderstorm'),
    heavySnow: weatherData.precipType === 'snow' && weatherData.precipRate > 0.5,
    highWinds: weatherData.windSpeed > 25,
    layer: 'foreground'
  }
};
```

### Box-Drawing Unicode Character Set

**Full character reference:** [Unicode Box Drawing (U+2500-257F)](https://unicode-table.com/en/blocks/box-drawing/)

**Weather-specific characters:**

```javascript
const ASCII_CHARS = {
  // Cloud shapes
  clouds: ['░', '▒', '▓', '█', '▄', '▀'],

  // Wind/flow
  horizontal: ['─', '━', '═', '—', '―'],
  vertical: ['│', '┃', '║'],
  arrows: ['→', '←', '↑', '↓', '↗', '↘', '↙', '↖'],
  flow: ['>', '<', '^', 'v'],

  // Precipitation
  rain: ['|', '│', '║', '¦', '┊', '┋'],
  snow: ['*', '❄', '✻', '✼', '❅', '❆', '✺'],

  // Sun/rays
  sun: ['☼', '☀', '○', '◎'],
  rays: ['\\', '|', '/', '─', '│'],

  // Lightning
  lightning: ['⚡', '↯', 'ϟ'],

  // Density gradient (light → dark)
  gradient: [' ', '.', '·', ':', ',', ';', '!', '|', '*', '#', '%', '@'],

  // Corners/boxes (for effects)
  corners: ['┌', '┐', '└', '┘', '╔', '╗', '╚', '╝']
};
```

**Browser support:** All modern browsers support Unicode box-drawing. Monospace font required for proper alignment.

**Recommended fonts:**
- `Menlo` (macOS default)
- `Monaco`
- `Consolas` (Windows)
- `Courier New` (fallback)

Source: [W3Schools UTF-8 Box Drawing](https://www.w3schools.com/charsets/ref_utf_box.asp)

## Performance Optimization

### Canvas Best Practices

From [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) and [HTML5 Canvas Performance Tips](https://gist.github.com/jaredwilli/5469626):

**1. Use requestAnimationFrame (not setInterval)**
```javascript
const animate = (timestamp) => {
  // Update particle positions
  updateParticles(timestamp);

  // Render layers
  renderBackgroundLayer();
  renderMidgroundLayer();
  renderForegroundLayer();

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
```

**Why:** requestAnimationFrame:
- Optimizes repaints (browser-aware)
- Throttles when tab inactive (saves battery)
- Syncs with display refresh rate (60fps)
- Provides timestamp for smooth interpolation

**2. Multi-layer canvas (avoid full-screen redraws)**

Split static and dynamic content:
- Background: Slow-moving clouds (redraw every 100ms)
- Midground: Wind particles (redraw every frame)
- Foreground: Precipitation (redraw every frame)

**Performance gain:** Unoptimized parallax triggers 15-30 repaints/sec. Layered approach reduces to 5-10 repaints/sec on static layers.

Source: [Buttery-Smooth Canvas Parallax](https://dev.to/nidal_tahir_cde5660ddbe04/buttery-smooth-scroll-animations-building-a-high-performance-canvas-parallax-effect-2m8l)

**3. Dirty rectangle rendering**

Only redraw changed regions:
```javascript
// Instead of clearing entire canvas
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Clear only dirty regions
particles.forEach(p => {
  ctx.clearRect(p.lastX - 5, p.lastY - 5, 10, 10);  // Clear old position
  // Draw new position
});
```

**4. Offscreen canvas for static elements**

Pre-render complex shapes:
```javascript
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// Render sun rays once to offscreen canvas
renderSunRays(offscreenCtx);

// Draw offscreen canvas to main canvas each frame (fast!)
ctx.drawImage(offscreenCanvas, sunX, sunY);
```

**5. Object pooling for particles**

Reuse particle objects instead of creating/destroying:
```javascript
class ParticlePool {
  constructor(size) {
    this.particles = Array(size).fill(null).map(() => new Particle());
    this.activeCount = 0;
  }

  get() {
    if (this.activeCount < this.particles.length) {
      return this.particles[this.activeCount++];
    }
    return null;  // Pool exhausted
  }

  reset() {
    this.activeCount = 0;  // All particles available
  }
}

// Create pool once
const particlePool = new ParticlePool(5000);

// Reuse particles each frame
particlePool.reset();
for (let i = 0; i < neededParticles; i++) {
  const particle = particlePool.get();
  if (particle) {
    particle.update();
    particle.draw();
  }
}
```

**6. Batch drawing operations**

Minimize context state changes:
```javascript
// BAD: Change fillStyle for each particle
particles.forEach(p => {
  ctx.fillStyle = p.color;
  ctx.fillText(p.char, p.x, p.y);
});

// GOOD: Group by color, change fillStyle once per group
const particlesByColor = groupBy(particles, 'color');
Object.entries(particlesByColor).forEach(([color, group]) => {
  ctx.fillStyle = color;
  group.forEach(p => ctx.fillText(p.char, p.x, p.y));
});
```

**7. Use typed arrays for particle data**

```javascript
// Instead of array of objects
const particles = Array(1000).fill(null).map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));

// Use typed arrays (faster memory access)
const particleCount = 1000;
const positions = new Float32Array(particleCount * 2);  // [x0, y0, x1, y1, ...]
const velocities = new Float32Array(particleCount * 2); // [vx0, vy0, vx1, vy1, ...]

// Access: positions[i*2] = x, positions[i*2+1] = y
```

**Performance targets:**
- 60fps on desktop (modern laptops)
- 30fps minimum on mobile
- 1000-5000 particles max depending on device
- Monitor with: `performance.now()` and adjust particle count dynamically

Sources:
- [MDN Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [HTML5 Canvas Performance Tips (GitHub Gist)](https://gist.github.com/jaredwilli/5469626)
- [Konva Optimize Animation Performance](https://konvajs.org/docs/performance/Optimize_Animation.html)

## Wind Flow Visualization

### Particle-Based Wind Systems

**Reference implementations:**

1. **[Esri/wind-js](https://github.com/Esri/wind-js)** - The gold standard
   - Uses Bilinear Interpolation for smooth wind field
   - Particles placed randomly, "evolved" based on interpolated velocity
   - Pure Canvas 2D API (no WebGL)

2. **[anvaka/wind-lines](https://github.com/anvaka/wind-lines)** - Streamline visualization
   - Drops thousands of particles onto vector field
   - Particles flow, creating streamline effect
   - WebGL-powered for 60fps with millions of particles

3. **[Mapbox Wind Map](https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f)** by Vladimir Agafonkin
   - GPU-powered wind visualization
   - Can render a million particles at 60fps
   - Uses WebGL shaders

**Our implementation approach (Canvas-based for simplicity):**

```javascript
class WindParticle {
  constructor(x, y, windSpeed, windDirection) {
    this.x = x;
    this.y = y;
    this.life = Math.random() * 100;  // Particle lifespan
    this.maxLife = 100;

    // Convert wind direction (meteorological) to velocity components
    // Wind direction is "from" direction, so add 180°
    const angleRad = (windDirection + 180) * Math.PI / 180;

    // Speed in pixels per frame (scale wind mph to screen space)
    const speed = windSpeed * 0.5;
    this.vx = Math.cos(angleRad) * speed;
    this.vy = Math.sin(angleRad) * speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    // Respawn if dead or off-screen
    if (this.life <= 0 || this.isOffScreen()) {
      this.respawn();
    }
  }

  draw(ctx, baseColor) {
    // Fade based on life (creates trail effect)
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;

    // Choose character based on direction
    const char = this.getDirectionalChar();
    ctx.fillText(char, this.x, this.y);
  }

  getDirectionalChar() {
    // Map velocity to directional character
    const angle = Math.atan2(this.vy, this.vx);
    const octant = Math.round(8 * angle / (2 * Math.PI)) % 8;
    return ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'][octant];
  }
}
```

**Wind data source:** Already available from `useNWSWeather`:
```javascript
const weatherData = useNWSWeather(citySlug);
// weatherData.windSpeed (mph)
// weatherData.windDirection (degrees, 0-360)
```

Sources:
- [Esri/wind-js GitHub](https://github.com/Esri/wind-js)
- [anvaka/wind-lines GitHub](https://github.com/anvaka/wind-lines)
- [Mapbox: How I Built a Wind Map with WebGL](https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f)

## Precipitation Animation

### Rain Implementation

```javascript
class RainDrop {
  constructor(x, y, intensity) {
    this.x = x;
    this.y = y;
    this.speed = 5 + intensity * 3;  // Heavier rain = faster
    this.char = intensity > 0.5 ? '║' : '│';  // Heavy vs light
  }

  update() {
    this.y += this.speed;

    // Add slight horizontal drift from wind
    this.x += windVelocityX * 0.3;

    // Respawn at top when off bottom
    if (this.y > canvas.height) {
      this.y = -10;
      this.x = Math.random() * canvas.width;
    }
  }

  draw(ctx) {
    ctx.fillText(this.char, this.x, this.y);
  }
}

// Particle density based on precip rate
const rainDropCount = weatherData.precipRate * 500;  // 0-500 drops
```

### Snow Implementation

```javascript
class Snowflake {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1 + Math.random() * 2;  // Slower than rain
    this.drift = Math.random() * 2 - 1;  // Horizontal drift
    this.char = ['*', '❄', '✻'][Math.floor(Math.random() * 3)];
  }

  update() {
    this.y += this.speed;
    this.x += this.drift + windVelocityX * 0.5;  // More affected by wind

    // Slow sinusoidal drift (like real snow)
    this.drift = Math.sin(Date.now() / 1000 + this.x) * 0.5;

    if (this.y > canvas.height) {
      this.y = -10;
      this.x = Math.random() * canvas.width;
    }
  }

  draw(ctx) {
    ctx.fillText(this.char, this.x, this.y);
  }
}
```

**Performance consideration:** Limit particle count based on device capability:
```javascript
const maxParticles = window.innerWidth < 768 ? 200 : 1000;  // Mobile vs desktop
const actualParticles = Math.min(calculatedParticles, maxParticles);
```

## Cloud Visualization

### Procedural Cloud Generation

**Approach:** Use box-drawing characters to form cloud-like shapes that drift across background layer

```javascript
class Cloud {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height * 0.5;  // Upper half
    this.width = 50 + Math.random() * 100;
    this.height = 20 + Math.random() * 30;
    this.speed = 0.2 + Math.random() * 0.5;  // Slow drift
    this.density = weatherData.cloudCover / 100;  // 0-1

    // Generate cloud shape
    this.shape = this.generateShape();
  }

  generateShape() {
    // Create organic cloud shape using box chars
    const chars = ['░', '▒', '▓'];
    const shape = [];

    for (let row = 0; row < this.height; row++) {
      const line = [];
      for (let col = 0; col < this.width; col++) {
        // Use perlin noise or random for organic shape
        const distFromCenter = Math.hypot(
          col - this.width / 2,
          row - this.height / 2
        );
        const maxDist = Math.min(this.width, this.height) / 2;
        const density = 1 - (distFromCenter / maxDist);

        if (density > 0.3) {
          const charIndex = Math.floor(density * chars.length);
          line.push(chars[charIndex]);
        } else {
          line.push(' ');
        }
      }
      shape.push(line.join(''));
    }

    return shape;
  }

  update() {
    this.x += this.speed;

    // Wrap around screen
    if (this.x > canvas.width) {
      this.x = -this.width;
    }
  }

  draw(ctx) {
    ctx.globalAlpha = this.density * 0.4;  // Clouds are subtle
    this.shape.forEach((line, i) => {
      ctx.fillText(line, this.x, this.y + i * 12);  // 12px line height
    });
    ctx.globalAlpha = 1.0;
  }
}
```

**Cloud count based on coverage:**
```javascript
const cloudCount = Math.floor((weatherData.cloudCover / 100) * 10);  // 0-10 clouds
```

## Sun Visualization

**Daytime + clear conditions only:**

```javascript
class Sun {
  constructor() {
    this.x = canvas.width * 0.75;   // Upper right
    this.y = canvas.height * 0.25;
    this.pulsePhase = 0;
  }

  update() {
    this.pulsePhase += 0.02;  // Gentle pulse
  }

  draw(ctx) {
    const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.9;  // 0.8-1.0
    ctx.globalAlpha = pulse;

    // Draw sun
    ctx.fillText('☼', this.x, this.y);

    // Draw rays
    const rayLength = 30 + Math.sin(this.pulsePhase) * 5;
    const rays = [
      { dx: 0, dy: -1, char: '|' },   // Up
      { dx: 0, dy: 1, char: '|' },    // Down
      { dx: -1, dy: 0, char: '─' },   // Left
      { dx: 1, dy: 0, char: '─' },    // Right
      { dx: -1, dy: -1, char: '\\' }, // Up-left
      { dx: 1, dy: -1, char: '/' },   // Up-right
      { dx: -1, dy: 1, char: '/' },   // Down-left
      { dx: 1, dy: 1, char: '\\' }    // Down-right
    ];

    ctx.globalAlpha = pulse * 0.5;
    rays.forEach(ray => {
      for (let i = 1; i <= 3; i++) {
        ctx.fillText(
          ray.char,
          this.x + ray.dx * i * 10,
          this.y + ray.dy * i * 10
        );
      }
    });

    ctx.globalAlpha = 1.0;
  }
}
```

## Severe Weather Effects

### Lightning

```javascript
class Lightning {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.duration = 0;
  }

  trigger() {
    this.active = true;
    this.x = Math.random() * canvas.width;
    this.y = 0;
    this.duration = 3;  // frames
  }

  update() {
    if (this.active) {
      this.duration--;
      if (this.duration <= 0) {
        this.active = false;
      }
    }

    // Random chance to trigger during thunderstorm
    if (weatherData.conditions.includes('thunderstorm')) {
      if (Math.random() < 0.01) {  // 1% chance per frame
        this.trigger();
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;

    // Flash entire background
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bolt
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#7fdbff';

    let x = this.x;
    let y = this.y;
    while (y < canvas.height) {
      ctx.fillText('⚡', x, y);
      y += 20;
      x += (Math.random() - 0.5) * 10;  // Jagged
    }
  }
}
```

### High Winds

```javascript
// Increase wind particle count and speed dramatically
if (weatherData.windSpeed > 25) {
  windParticleCount *= 2;
  windParticles.forEach(p => {
    p.vx *= 1.5;
    p.vy *= 1.5;
  });

  // Add debris particles
  debrisParticles.forEach(p => {
    p.char = ['~', '≈', '»'][Math.floor(Math.random() * 3)];
    p.update();
    p.draw(ctx);
  });
}
```

### Heavy Snow

```javascript
if (weatherData.precipType === 'snow' && weatherData.precipRate > 0.5) {
  // Accumulation effect on bottom
  const accumulation = Math.floor(weatherData.precipRate * 10);
  for (let i = 0; i < accumulation; i++) {
    ctx.fillText(
      '▁▂▃▄'[Math.min(i, 3)],  // Progressive accumulation
      Math.random() * canvas.width,
      canvas.height - i * 2
    );
  }
}
```

## Widget Interaction with Background

### Clearing Space Around Widgets

**Concept:** ASCII particles avoid widget areas, creating "clearings" in the weather visualization

```javascript
// Get widget bounding boxes from DOM
const widgetElements = document.querySelectorAll('.widget');
const widgetBounds = Array.from(widgetElements).map(el => el.getBoundingClientRect());

// Check if particle intersects any widget
function isInWidgetArea(x, y) {
  return widgetBounds.some(bounds => {
    return x >= bounds.left && x <= bounds.right &&
           y >= bounds.top && y <= bounds.bottom;
  });
}

// Update particles
particles.forEach(p => {
  p.update();

  // If entering widget area, reduce life or redirect
  if (isInWidgetArea(p.x, p.y)) {
    p.life *= 0.5;  // Fade faster near widgets

    // Or redirect around widget
    const nearestBound = findNearestWidgetBound(p.x, p.y);
    p.vx += (p.x - nearestBound.centerX) * 0.1;  // Push away
    p.vy += (p.y - nearestBound.centerY) * 0.1;
  }

  p.draw(ctx);
});
```

### Widget Expansion Effect

**When user expands a widget inline, ASCII background responds:**

```javascript
// Listen to widget expansion events
window.addEventListener('widget-expanded', (event) => {
  const { widgetId, bounds } = event.detail;

  // Push particles away from expanding widget
  particles.forEach(p => {
    if (isInRect(p.x, p.y, bounds)) {
      // Calculate push vector
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.hypot(dx, dy);

      // Apply outward force
      if (dist > 0) {
        p.vx += (dx / dist) * 5;  // Strong push
        p.vy += (dy / dist) * 5;
      }
    }
  });
});
```

### Mouse Hover Distortion

**Particles react to mouse movement:**

```javascript
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// In particle update
const distToMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
if (distToMouse < 100) {
  const force = (100 - distToMouse) / 100;  // 0-1
  const angle = Math.atan2(p.y - mouseY, p.x - mouseX);
  p.vx += Math.cos(angle) * force * 2;  // Push away from mouse
  p.vy += Math.sin(angle) * force * 2;
}
```

## Color System: Monochrome Navy → Light Blue

**Temperature and time-based gradient:**

```javascript
function getWeatherColor(temperature, timeOfDay) {
  const navy = { r: 0, g: 31, b: 63 };       // #001f3f
  const lightBlue = { r: 127, g: 219, b: 255 }; // #7fdbff

  // Interpolation factor (0-1)
  // Colder/night = 0 (navy), Warmer/day = 1 (light blue)
  let t = 0;

  // Temperature contribution (0-1)
  const tempMin = 0;   // 0°F
  const tempMax = 100; // 100°F
  const tempFactor = (temperature - tempMin) / (tempMax - tempMin);

  // Time contribution (0-1)
  const timeFactor = timeOfDay === 'night' ? 0 : timeOfDay === 'day' ? 1 : 0.5;

  // Combine (weighted average)
  t = tempFactor * 0.6 + timeFactor * 0.4;
  t = Math.max(0, Math.min(1, t));  // Clamp 0-1

  // Linear interpolation
  const r = Math.round(navy.r + (lightBlue.r - navy.r) * t);
  const g = Math.round(navy.g + (lightBlue.g - navy.g) * t);
  const b = Math.round(navy.b + (lightBlue.b - navy.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

// Usage
const weatherColor = getWeatherColor(weatherData.temperature, getTimeOfDay());
ctx.fillStyle = weatherColor;
```

**Layered opacity:**
- Background: Base color at 40% opacity
- Midground: Base color at 60% opacity
- Foreground: Base color at 90% opacity

**Creates depth through transparency and color consistency**

## Implementation Plan

### Phase 1: Base Infrastructure

**Tasks:**
1. Create `ASCIIWeatherBackground.jsx` component
2. Set up multi-layer canvas architecture (3 layers)
3. Implement requestAnimationFrame loop
4. Add canvas layering with z-index
5. Position glass widgets above canvas (z-index: 30)

**File structure:**
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
  │   └── ParticlePool.js
  └── utils/
      ├── weatherMapper.js            # Data → viz config
      ├── colorSystem.js              # Navy → light blue
      └── performanceMonitor.js       # FPS tracking
```

### Phase 2: Weather Conditions

**Implement each weather condition:**
1. **Clouds** - Box-drawing procedural shapes
2. **Wind** - Particle flow with directional characters
3. **Rain** - Vertical falling particles
4. **Snow** - Drifting snowflakes
5. **Clear/Sun** - Rays and sparse particles

**Priority order:** Wind → Rain → Clouds → Snow → Sun

### Phase 3: Advanced Effects

1. **Parallax depth** - Layer speed variation
2. **Severe weather** - Lightning, high winds, heavy snow
3. **Widget interaction** - Clearing, expansion response
4. **Mouse distortion** - Hover effects

### Phase 4: Optimization

1. **Performance monitoring** - FPS tracking, adaptive particle count
2. **Mobile optimization** - Reduce particles on small screens
3. **Object pooling** - Reuse particle instances
4. **Dirty rectangle rendering** - Only redraw changed areas

### Phase 5: Polish

1. **Smooth transitions** - Weather condition changes
2. **Data interpolation** - Smooth animation between 30s data updates
3. **Settings panel** - Toggle ASCII background on/off, adjust density
4. **Accessibility** - Reduced motion support

## Technical Specifications

### Canvas Configuration

```javascript
const canvasConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpi: window.devicePixelRatio || 1,  // Retina support

  layers: {
    background: {
      zIndex: 0,
      opacity: 0.4,
      updateInterval: 100  // ms (slow, static elements)
    },
    midground: {
      zIndex: 10,
      opacity: 0.6,
      updateInterval: 16  // ms (60fps)
    },
    foreground: {
      zIndex: 20,
      opacity: 0.9,
      updateInterval: 16  // ms (60fps)
    }
  },

  font: {
    family: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    size: 14,
    weight: 'normal'
  }
};
```

### Performance Budgets

**Target metrics:**
- Desktop: 60fps sustained, max 5000 particles
- Laptop: 60fps sustained, max 3000 particles
- Mobile: 30fps sustained, max 500 particles
- Memory: < 50MB total for all canvas layers

**Adaptive particle count:**
```javascript
function getMaxParticles() {
  const width = window.innerWidth;
  const isMobile = width < 768;
  const isTablet = width < 1024;

  if (isMobile) return 500;
  if (isTablet) return 2000;
  return 5000;
}

// Monitor FPS, reduce particles if dropping below 30fps
let frameCount = 0;
let lastTime = performance.now();

function checkPerformance() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastTime;

  if (elapsed >= 1000) {  // Every second
    const fps = frameCount;
    frameCount = 0;
    lastTime = now;

    if (fps < 30) {
      // Reduce particles by 20%
      currentMaxParticles *= 0.8;
    } else if (fps > 55 && currentMaxParticles < targetMaxParticles) {
      // Increase particles if performance headroom
      currentMaxParticles *= 1.1;
    }
  }
}
```

## Research Sources & References

### Parallax & Layering
- [The Best Way to Create Parallax Scrolling (2026)](https://www.builder.io/blog/parallax-scrolling-effect)
- [Multi-Layered Parallax with CSS & JavaScript](https://medium.com/@patrickwestwood/how-to-make-multi-layered-parallax-illustration-with-css-javascript-2b56883c3f27)
- [Buttery-Smooth Canvas Parallax Effect](https://dev.to/nidal_tahir_cde5660ddbe04/buttery-smooth-scroll-animations-building-a-high-performance-canvas-parallax-effect-2m8l)
- [Canvallax - Canvas Parallax Library](https://github.com/shshaw/Canvallax)

### Multi-Layer Particle Systems
- [MapTiler Weather Particle Layer](https://docs.maptiler.com/sdk-js/modules/weather/api/particles/)
- [Visualize Weather Forecast with WebGL - MapTiler](https://www.maptiler.com/news/2021/05/visualize-weather-forecast-with-webgl/)
- [Esri/wind-js - Wind Animation on Canvas](https://github.com/Esri/wind-js)
- [7 Advanced Canvas Techniques for Data Visualization](https://medium.com/uxdworld/7-advanced-javascript-canvas-techniques-for-data-visualization-e6236d72b754)

### ASCII Depth & Perspective
- [Advanced ASCII Techniques: Shading, Depth, and Perspective](https://asciieverything.com/ascii-blog/advanced-ascii-techniques-shading-depth-and-perspective-in-text-art/)
- [ASCII Art Guide - SymbolsGPT](https://www.symbolsgpt.com/blog/ascii-art-guide)
- [Build Depth with Layering Techniques](https://altenew.com/blogs/the-creative-corner/the-art-of-layering-tips-and-techniques-for-building-depth-and-dimension-in-your-artwork)

### Canvas Performance
- [MDN: Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [HTML5 Canvas Performance Tips (GitHub Gist)](https://gist.github.com/jaredwilli/5469626)
- [Konva: Optimize Animation Performance](https://konvajs.org/docs/performance/Optimize_Animation.html)
- [GSAP & Canvas Performance Optimization](https://www.augustinfotech.com/blogs/optimizing-gsap-and-canvas-for-smooth-performance-and-responsive-design/)

### Wind Visualization
- [Esri/wind-js GitHub](https://github.com/Esri/wind-js)
- [anvaka/wind-lines - Streamline Animation](https://github.com/anvaka/wind-lines)
- [How I Built a Wind Map with WebGL - Mapbox](https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f)
- [canvas-windy-particles GitHub](https://github.com/ashelkov/canvas-windy-particles)

### Box Drawing Characters
- [Unicode Box Drawing Block (U+2500-257F)](https://unicode-table.com/en/blocks/box-drawing/)
- [W3Schools: UTF-8 Box Drawings](https://www.w3schools.com/charsets/ref_utf_box.asp)
- [Box-drawing Characters - Wikipedia](https://en.wikipedia.org/wiki/Box-drawing_characters)
- [ASCIIFlow - Interactive ASCII Drawing Tool](https://asciiflow.com/)

### Z-Index & Canvas Layering
- [web.dev: Z-index and Stacking Contexts](https://web.dev/learn/css/z-index)
- [MDN: Optimizing Canvas (Multiple Layers)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

## Open Questions & Future Exploration

- [ ] Should we support WebGL upgrade path for 10,000+ particles?
- [ ] How to handle transitions between weather states? (e.g., rain → snow)
- [ ] Accessibility: Should we provide "reduced motion" mode that disables background?
- [ ] Should background respond to forecast data (show future conditions with transparency)?
- [ ] Interactive mode: Let users "stir" the weather with mouse?
- [ ] Sound design: Subtle ambient weather sounds (rain patter, wind whoosh)?
- [ ] Mobile: Touch gestures to control particle flow?
- [ ] Performance: Should we use Web Workers for particle physics calculations?
- [ ] Advanced: Implement actual fluid dynamics simulation for wind flow?
- [ ] Settings: User-configurable particle density, animation speed, layer opacity?

---

**Document version:** 2.0
**Last updated:** 2026-01-05
**Status:** Research complete, ready for implementation planning
