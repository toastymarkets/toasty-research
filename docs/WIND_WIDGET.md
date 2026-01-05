# Wind Widget Reference

## Overview

The Wind Widget displays current wind conditions using an **ASCII particle animation system**. Particles drift across the widget in the direction the wind is blowing, with speed and density reflecting wind intensity.

---

## Visual Design

### Layout (Compact Mode)
```
┌─────────────────────────────┐
│ WIND                    [icon] │
├─────────────────────────────┤
│                             │
│   · ·  ·    ·  ·           │  ← 60% - ASCII Animation
│     ·    ·      ·   ·      │
│  ·    ·     ·        ·     │
│                        [◎]  │  ← Mini compass
├─────────────────────────────┤
│  7 mph              S 170°  │  ← 40% - Data display
│  Gusts 12 mph               │
└─────────────────────────────┘
```

### Color Scheme
| Element | Color | Value |
|---------|-------|-------|
| Particles | Cyan | `text-cyan-300` / `#67e8f9` |
| Strong wind glow | Cyan glow | `rgba(34, 211, 238, 0.6)` |
| Animation background | Dark gradient | `from-slate-900/50 to-slate-800/30` |
| Speed text | White | `text-white` |
| Direction text | White | `text-white` |
| Labels | White/50 | `text-white/50` |

---

## ASCII Particle System

### Core Concept

Individual ASCII characters (`·`) move across the widget container based on wind direction and speed. This creates an organic, flowing visualization that intuitively conveys wind conditions.

### Particle Properties

```typescript
interface Particle {
  x: number;          // X position in pixels
  y: number;          // Y position in pixels
  vx: number;         // X velocity (pixels per frame)
  vy: number;         // Y velocity (pixels per frame)
  layer: 0 | 1 | 2;   // Depth layer (0=front, 2=back)
  opacity: number;    // 0.3 - 0.8
  char: string;       // Character to render
  size: number;       // Font size in pixels (8-16)
}
```

### Character Selection

Characters are selected based on wind **direction** and **speed**:

```javascript
// Direction zones
const isVertical = (dir >= 315 || dir < 45) ||    // from N
                   (dir >= 135 && dir < 225);      // from S
const isHorizontal = (dir >= 45 && dir < 135) ||  // from E
                     (dir >= 225 && dir < 315);    // from W

// Character selection
if (speed === 0) return '·';
if (isVertical && speed > 25) return '∣';   // Light vertical bar
if (isHorizontal && speed > 25) return '−'; // Minus sign
return '·';  // Middle dot (default)
```

### Particle Count

Density scales with wind speed:

```javascript
const maxParticles = Math.min(80, Math.max(35, Math.floor(speed * 3)));
// 35 particles minimum, up to 80 at high speeds
```

### Size Variation

Particles have randomized sizes for depth effect:

```javascript
const baseSize = 8 + Math.random() * 8;  // 8-16px range
const layerScale = 1 - layer * 0.25;     // Front=100%, Mid=75%, Back=50%
const finalSize = baseSize * layerScale;
```

---

## Direction Mapping

### Meteorological Convention

Wind direction indicates where wind **comes FROM**:
- `0°` = from North
- `90°` = from East
- `180°` = from South
- `270°` = from West

### Screen Coordinate Conversion

Particles move **opposite** to wind direction (where wind blows TO):

```javascript
// Convert meteorological direction to screen angle
// Screen coords: 0°=right, 90°=down, 180°=left, 270°=up
const dirRad = ((direction + 90) * Math.PI) / 180;

// Calculate velocity components
const vx = Math.cos(dirRad) * baseSpeed;  // Horizontal movement
const vy = Math.sin(dirRad) * baseSpeed;  // Vertical movement
```

### Examples

| Wind From | Direction | Particles Move |
|-----------|-----------|----------------|
| North | 0° | Downward (south) |
| East | 90° | Leftward (west) |
| South | 180° | Upward (north) |
| West | 270° | Rightward (east) |

---

## Animation Loop

### Implementation

```javascript
useEffect(() => {
  let lastTime = performance.now();

  const animate = (currentTime) => {
    const deltaTime = Math.min(50, currentTime - lastTime);
    lastTime = currentTime;
    const speedFactor = deltaTime / 16; // Normalize to ~60fps

    // Update particle positions
    particlesRef.current = particlesRef.current.map(p => {
      let newX = p.x + p.vx * speedFactor;
      let newY = p.y + p.vy * speedFactor;

      // Reset if out of bounds
      if (outOfBounds(newX, newY)) {
        return createParticle(false); // Spawn new particle at edge
      }

      return { ...p, x: newX, y: newY };
    });

    forceUpdate(n => n + 1); // Trigger re-render
    animationRef.current = requestAnimationFrame(animate);
  };

  if (speed > 0) {
    animationRef.current = requestAnimationFrame(animate);
  }

  return () => cancelAnimationFrame(animationRef.current);
}, [speed, direction]);
```

### Particle Spawning

New particles spawn from the **upwind edge**:

```javascript
// Determine spawn edge based on movement direction
if (Math.abs(vx) > Math.abs(vy)) {
  // Horizontal movement dominant
  x = vx > 0 ? -5 : width + 5;  // Left or right edge
  y = Math.random() * height;
} else {
  // Vertical movement dominant
  x = Math.random() * width;
  y = vy > 0 ? -5 : height + 5;  // Top or bottom edge
}
```

---

## Layer System

Three depth layers create parallax effect:

| Layer | Speed | Size | Opacity | z-index |
|-------|-------|------|---------|---------|
| 0 (front) | 100% | Largest | Brightest | 3 |
| 1 (mid) | 70% | Medium | Medium | 2 |
| 2 (back) | 40% | Smallest | Dimmest | 1 |

```javascript
const layerSpeed = 1 - layer * 0.3;  // 1.0, 0.7, 0.4
const layerScale = 1 - layer * 0.25; // 1.0, 0.75, 0.5
const opacity = (0.3 + (2 - layer) * 0.25) * (0.5 + Math.random() * 0.5);
```

---

## Component Structure

### Files

```
src/components/weather/
├── SmallWidgets.jsx      # Contains WindWidget and ASCIIWindAnimation
├── WindDetailModal.jsx   # Expanded wind details with chart
└── GlassWidget.jsx       # Base widget container
```

### Props

```typescript
interface WindWidgetProps {
  speed: number;           // Wind speed (m/s or mph)
  direction: number;       // Wind direction in degrees
  gusts?: number;          // Gust speed (optional)
  loading?: boolean;       // Loading state
  observations?: Array;    // Historical data for modal
  timezone?: string;       // For time formatting
  cityName?: string;       // City name for modal
  compact?: boolean;       // Compact mode (default: false)
}
```

---

## Performance Considerations

1. **requestAnimationFrame**: Ensures smooth animation synced to display refresh
2. **deltaTime normalization**: Maintains consistent speed across different frame rates
3. **Particle pooling**: Reuse particles instead of creating/destroying
4. **Conditional rendering**: Only animate when `speed > 0`
5. **Cleanup**: Cancel animation frame on unmount

---

## Future Enhancements

Potential additions to explore:

- **Gusts visualization**: Brief bursts of faster/denser particles
- **Turbulence**: Random perturbations for gusty conditions
- **Trail effects**: Fading trails behind particles
- **Weather integration**: Different particles for rain/snow combined with wind
- **Sound**: Subtle wind audio that scales with speed

---

## Related Documentation

- [Design Guidelines - ASCII Particle Animations](./DESIGN_GUIDELINES.md#ascii-particle-animations)
- [Widget Registry](../src/config/WidgetRegistry.js)
