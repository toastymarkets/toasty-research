# Toasty Design Guidelines

## Overview

Toasty uses a **dark monochromatic glassmorphism** design system inspired by Apple Weather and macOS Tahoe. The aesthetic prioritizes readability, visual hierarchy, and weather-responsive theming.

---

## Color Palette

### Primary Accent
| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Blue | `#007AFF` | `blue-400`, `blue-500` | Interactive elements, links, toggles, highlights |

### Apple Accent Colors
Used sparingly for semantic meaning and visual interest:

| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Blue | `#007AFF` | `--accent-blue` | Primary actions, links, active states |
| Green | `#30D158` | `--accent-green` | Success, positive values |
| Yellow | `#FFD60A` | `--accent-yellow` | Warnings, attention |
| Orange | `#FF9F0A` | `--accent-orange` | Timers, countdowns, alerts |
| Red | `#FF453A` | `--accent-red` | Errors, negative values |
| Purple | `#BF5AF2` | `--accent-purple` | "Yes" buttons in markets |
| Pink | `#FF375F` | `--accent-pink` | Special highlights |
| Teal | `#64D2FF` | `--accent-teal` | Secondary info |

### Glass Surface Colors
| Purpose | Value | CSS Variable |
|---------|-------|--------------|
| Background | `rgba(0, 0, 0, 0.3)` | `--glass-bg` |
| Hover | `rgba(0, 0, 0, 0.35)` | `--glass-bg-hover` |
| Active | `rgba(0, 0, 0, 0.4)` | `--glass-bg-active` |
| Border | `rgba(255, 255, 255, 0.25)` | `--glass-border` |
| Border Subtle | `rgba(255, 255, 255, 0.15)` | `--glass-border-subtle` |

### Text Colors (on glass)
| Purpose | Value | CSS Variable | Tailwind |
|---------|-------|--------------|----------|
| Primary | `#FFFFFF` | `--glass-text-primary` | `text-white` |
| Secondary | `rgba(255, 255, 255, 0.75)` | `--glass-text-secondary` | `text-white/75` |
| Muted | `rgba(255, 255, 255, 0.55)` | `--glass-text-muted` | `text-white/50` |
| Label | `rgba(255, 255, 255, 0.6)` | `--glass-text-label` | `text-white/60` |

### Weather Colors
| Type | Light | Dark |
|------|-------|------|
| Hot Temp | `#F97316` | `#FB923C` |
| Cold Temp | `#3B82F6` | `#60A5FA` |
| Rain | `#3B82F6` | `#60A5FA` |
| Snow | `#8B5CF6` | `#A78BFA` |

### Keyword Highlighting Colors
Used in NWS Discussion widget for meteorological term highlighting.
See [docs/FORECAST_KEYWORDS.md](./FORECAST_KEYWORDS.md) for full keyword list.

| Category | Tailwind Class | Usage |
|----------|----------------|-------|
| Temperature | `bg-orange-500/30 text-orange-300` | warm air advection, freeze, cooling trend |
| Synoptic | `bg-blue-500/30 text-blue-300` | high pressure, cold front, trough, troughing |
| Precipitation | `bg-cyan-500/30 text-cyan-300` | convection, cape, instability, rain, snow |
| Wind | `bg-teal-500/30 text-teal-300` | offshore flow, gust, gusty winds, santa ana |
| Confidence | `bg-purple-500/30 text-purple-300` | uncertainty, likely, models agree |
| Hazards | `bg-red-500/30 text-red-300` | fire weather, tornado, flash flood |
| Aviation | `bg-gray-500/30 text-gray-300` | VFR, IFR, MVFR, ceiling |
| Temp Range | `bg-yellow-500/30 text-yellow-300` | "highs in the 70s", "lows in the 40s" |
| Locations | `bg-emerald-500/30 text-emerald-300` | Point Conception, Front Range, Hill Country |

---

## Typography

### Font Stack
```css
/* Primary - Apple SF Pro inspired */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;

/* Monospace */
font-family: 'SF Mono', Menlo, Monaco, monospace;
```

### Type Scale
| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero Temp | `64px` / `96px` | 200 | Large temperature display |
| Location | `20px` / `34px` | 600 | City names, headers |
| Condition | `15px` / `20px` | 500 | Weather conditions |
| Widget Title | `10-11px` | 600 | Widget headers (uppercase) |
| Body | `15px` | 400 | General content |
| Caption | `13px` | 400 | Secondary info |
| Chip/Badge | `9-10px` | 500-600 | Labels, tags |

### Text Styling
- Use `drop-shadow-lg` on text over dynamic backgrounds
- Use `tabular-nums` for numerical data (prices, temps, timers)
- Headings: `font-semibold` or `font-bold`, `-0.02em` letter-spacing

---

## Glassmorphism

### Core Properties
```css
/* Standard glass effect */
background: rgba(0, 0, 0, 0.3);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.25);
border-radius: 22px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### Glass Classes
| Class | Usage |
|-------|-------|
| `.glass` | Standard glass card |
| `.glass-interactive` | Clickable glass with hover effects |
| `.glass-widget` | Dashboard widgets |
| `.glass-elevated` | Modals, popovers (heavier blur) |
| `.glass-subtle` | Less prominent surfaces |

### Border Radius Scale
| Size | Value | Usage |
|------|-------|-------|
| `--radius-sm` | `10px` | Small elements, chips |
| `--radius-md` | `16px` | Buttons, inputs |
| `--radius-lg` | `22px` | Cards, widgets |
| `--radius-xl` | `28px` | Modals, large containers |

---

## Components

### Cards
```jsx
// Market card with dynamic weather background
<Link className="glass-widget glass-interactive glass-animate-in">
  <WeatherOverlay />
  <div className="absolute inset-0 bg-black/30" /> {/* Readability overlay */}
  <div className="relative z-10 p-4">
    {/* Content */}
  </div>
</Link>
```

### Chips/Badges
```jsx
// Toggleable chip (active state)
<button className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-blue-500/80 text-white">
  daily
</button>

// Inactive chip
<button className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-white/20 text-white/60 hover:bg-white/30">
  monthly
</button>

// Info badge
<span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
  7 markets
</span>
```

### Buttons
```jsx
// Primary glass button
<button className="glass-button glass-button-primary">
  Action
</button>

// Icon button
<button className="glass-button glass-button-icon">
  <Icon />
</button>
```

### Market Brackets
```jsx
<div className="relative flex items-center justify-between py-2 px-2 rounded-lg">
  {/* Probability bar */}
  <div
    className="absolute left-0 top-0 bottom-0 rounded-lg opacity-25"
    style={{ width: `${probability}%`, backgroundColor: '#3B82F6' }}
  />
  <span className="relative text-sm font-medium text-white/80">{label}</span>
  <div className="relative flex items-center gap-2">
    <span className="text-sm font-bold text-white tabular-nums">{probability}%</span>
    <div className="flex rounded-md overflow-hidden text-[10px] font-medium">
      <span className="px-2 py-1 bg-purple-500/20 text-purple-400">Yes</span>
      <span className="px-2 py-1 bg-white/10 text-white/50">No</span>
    </div>
  </div>
</div>
```

---

## Spacing

### Card Padding
| Size | Value | Usage |
|------|-------|-------|
| Compact | `p-3` | Dense lists |
| Standard | `p-4` | Cards, widgets |
| Comfortable | `p-6` | Large containers |

### Grid Gaps
| Context | Value |
|---------|-------|
| Card grid | `gap-5` |
| Widget grid | `gap-2` (8px) |
| Section spacing | `mt-10` |
| Header margin | `mb-6` |

---

## Animations

### Timing
| Duration | Value | Usage |
|----------|-------|-------|
| Fast | `150ms` | Hover states, micro-interactions |
| Normal | `250ms` | Standard transitions |
| Slow | `400ms` | Page transitions, reveals |
| Spring | `500ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy effects |

### Animation Classes
```css
.glass-animate-in    /* Fade in + translateY */
.glass-animate-scale /* Scale in */
.glass-animate-slide-up /* Slide up */

/* Staggered delays */
.glass-delay-1 { animation-delay: 50ms; }
.glass-delay-2 { animation-delay: 100ms; }
.glass-delay-3 { animation-delay: 150ms; }
.glass-delay-4 { animation-delay: 200ms; }
.glass-delay-5 { animation-delay: 250ms; }
```

### Weather Animations
| Animation | Usage |
|-----------|-------|
| `.animate-snow` | Falling snowflakes |
| `.animate-rain` | Rain droplets |
| `.animate-fog` | Drifting fog |
| `.animate-cloud-drift` | Floating clouds |
| `.animate-lightning` | Storm flashes |
| `.animate-twinkle` | Star sparkle |

---

## Weather Backgrounds

### Time-Based Gradients
Backgrounds change based on local time:
- **Dawn** (5-7am): Purple to warm orange
- **Morning** (7-11am): Light blues
- **Day** (11am-3pm): Bright blue sky
- **Afternoon** (3-6pm): Muted blue
- **Sunset** (6-8pm): Gray twilight
- **Dusk** (8-9pm): Deep purple
- **Night** (9pm-5am): Dark blue/black

### Weather Condition Overlays
Applied on top of time gradients:
- Cloudy, Overcast, Rain, Storm, Snow, Fog

### Card Backgrounds
Use `getWeatherBackground()` for dynamic gradients:
```jsx
import { getWeatherBackground, WeatherOverlay } from '../weather/DynamicWeatherBackground';

const weatherBg = getWeatherBackground(weather?.condition, timezone);

<div style={{ background: weatherBg }}>
  <WeatherOverlay condition={weather?.condition} timezone={timezone} />
  <div className="absolute inset-0 bg-black/30" />
  {/* Content */}
</div>
```

---

## Responsive Design

### Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| `xs` | 420px | Extra small mobile |
| `sm` | 640px | Small devices |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Mobile Considerations
- Full-width cards on mobile (`max-width: 100%`)
- Reduced blur on mobile (`16px` vs `20px`)
- Smaller hero temperatures (`48px` vs `64px`)
- Touch-friendly tap targets (min 44px)

---

## Do's and Don'ts

### Do
- Use blue (`blue-400`/`blue-500`) as the primary interactive color
- Add `bg-black/30` overlay on dynamic backgrounds for text readability
- Use `tabular-nums` for all numerical displays
- Apply staggered animation delays for lists
- Use white with opacity for text hierarchy

### Don't
- Use bright colors for large surfaces
- Mix multiple accent colors in one component
- Skip the dark overlay on weather backgrounds
- Use pure black (`#000`) - prefer dark grays
- Overuse animations - keep them subtle

---

## Quick Reference

### Common Patterns
```jsx
// Section header with toggle
<h2 className="text-xl md:text-2xl font-bold text-white">
  how much will it <span className="text-blue-400">rain</span>
</h2>

// Timer display
<span className="text-xs font-medium text-orange-400 tabular-nums">
  2h 15m 30s
</span>

// Volume display
<span className="text-xs text-white/50">$324K</span>

// Interactive toggle text
<button className="text-blue-400 font-semibold hover:text-blue-300 transition-colors cursor-pointer">
  Highest
</button>
```

### File Structure
```
src/styles/
├── liquid-glass.css    # Core glassmorphism system
├── weather-gradients.css # Weather backgrounds
└── index.css           # Global styles, CSS variables
```
