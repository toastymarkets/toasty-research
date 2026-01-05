import { useState, memo, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Sun,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ChevronRight,
  CloudRain,
  Snowflake,
} from 'lucide-react';
import GlassWidget from './GlassWidget';
import { useMonthlyPrecipitation } from '../../hooks/useMonthlyPrecipitation';

// Lazy load modals with Recharts
const WindDetailModal = lazy(() => import('./WindDetailModal'));
const PrecipitationDetailModal = lazy(() => import('./PrecipitationDetailModal'));

/**
 * Small Weather Widgets - Apple Weather inspired compact widgets
 */

// ============ UV INDEX WIDGET ============
const UV_LEVELS = [
  { max: 2, label: 'Low', color: '#30D158' },
  { max: 5, label: 'Moderate', color: '#FFD60A' },
  { max: 7, label: 'High', color: '#FF9F0A' },
  { max: 10, label: 'Very High', color: '#FF453A' },
  { max: 15, label: 'Extreme', color: '#BF5AF2' },
];

export const UVIndexWidget = memo(function UVIndexWidget({ value = 0, loading = false }) {
  const level = UV_LEVELS.find(l => value <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
  const percentage = Math.min((value / 11) * 100, 100);

  if (loading) {
    return (
      <GlassWidget title="UV INDEX" icon={Sun} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-16 bg-white/10 rounded-full" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="UV INDEX" icon={Sun} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Value */}
        <span className="text-2xl font-light">{value}</span>
        <span className="text-[11px] font-medium" style={{ color: level.color }}>
          {level.label}
        </span>

        {/* Arc gauge */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, #30D158, #FFD60A, #FF9F0A, #FF453A, #BF5AF2)`,
            }}
          />
        </div>
      </div>
    </GlassWidget>
  );
});

UVIndexWidget.propTypes = {
  value: PropTypes.number,
  loading: PropTypes.bool,
};

// ============ WIND WIDGET ============
const getWindDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Particle-based ASCII Wind Animation Component
const ASCIIWindAnimation = ({ direction = 0, speed = 0 }) => {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const [, forceUpdate] = useState(0);

  // Determine if wind is more horizontal or vertical
  // direction: 0=N, 90=E, 180=S, 270=W
  // Particles move opposite: N wind → particles go south (vertical)
  const normalizedDir = ((direction % 360) + 360) % 360;
  const isVertical = (normalizedDir >= 315 || normalizedDir < 45) || // from N
                     (normalizedDir >= 135 && normalizedDir < 225);   // from S
  const isHorizontal = (normalizedDir >= 45 && normalizedDir < 135) || // from E
                       (normalizedDir >= 225 && normalizedDir < 315);  // from W

  // Wind characters based on intensity AND direction
  // Using subtle characters - mostly dots with slight variation for strong winds
  const getChar = useCallback((layer) => {
    if (speed === 0) return '·';

    if (isVertical) {
      // Vertical movement (N/S wind)
      if (speed > 25) return layer === 0 ? '∣' : '·';
      if (speed > 18) return layer === 0 ? '·' : '·';
      return '·';
    } else if (isHorizontal) {
      // Horizontal movement (E/W wind)
      if (speed > 25) return layer === 0 ? '−' : '·';
      if (speed > 18) return layer === 0 ? '·' : '·';
      return '·';
    }
    // Diagonal or default - just dots
    return '·';
  }, [speed, isVertical, isHorizontal]);

  // Convert wind direction to screen coordinates
  // Wind direction = where wind comes FROM (meteorological convention)
  // 0° = from North, 90° = from East, 180° = from South, 270° = from West
  // Particles move in opposite direction (toward), mapped to screen coords:
  // Screen: 0° = right (+X), 90° = down (+Y), 180° = left (-X), 270° = up (-Y)
  // Formula: screen_angle = wind_direction + 90°
  const dirRad = ((direction + 90) * Math.PI) / 180;

  // Particle count based on wind speed - high density
  const maxParticles = Math.min(80, Math.max(35, Math.floor(speed * 3)));

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth || 100;
    const height = container.offsetHeight || 50;

    // Initialize particles
    const createParticle = (init = false) => {
      const layer = Math.floor(Math.random() * 3); // 0=front, 1=mid, 2=back
      const layerSpeed = 1 - layer * 0.3; // Front moves faster
      const baseSpeed = Math.max(0.8, speed / 6);

      // Calculate velocity components
      const vx = Math.cos(dirRad) * baseSpeed * layerSpeed * (0.8 + Math.random() * 0.4);
      const vy = Math.sin(dirRad) * baseSpeed * layerSpeed * (0.8 + Math.random() * 0.4);

      // Spawn from the upwind edge (opposite to movement direction)
      let x, y;
      if (init) {
        x = Math.random() * width;
        y = Math.random() * height;
      } else {
        // Determine spawn edge based on movement direction
        if (Math.abs(vx) > Math.abs(vy)) {
          // Horizontal movement dominant - spawn from left or right edge
          x = vx > 0 ? -5 : width + 5;
          y = Math.random() * height;
        } else {
          // Vertical movement dominant - spawn from top or bottom edge
          x = Math.random() * width;
          y = vy > 0 ? -5 : height + 5;
        }
      }

      // Vary size more dramatically - range from 6px to 16px
      const baseSize = 8 + Math.random() * 8; // 8-16px range
      const layerScale = 1 - layer * 0.25; // Front layer larger
      const finalSize = baseSize * layerScale;

      return {
        x,
        y,
        vx,
        vy,
        layer,
        opacity: (0.3 + (2 - layer) * 0.25) * (0.5 + Math.random() * 0.5),
        char: getChar(layer),
        size: finalSize,
      };
    };

    // Reset particles when speed/direction changes significantly
    particlesRef.current = Array.from({ length: maxParticles }, () => createParticle(true));

    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      const speedFactor = deltaTime / 16; // Normalize to ~60fps

      particlesRef.current = particlesRef.current.map(p => {
        let newX = p.x + p.vx * speedFactor;
        let newY = p.y + p.vy * speedFactor;

        // Reset particle if it goes off screen
        const outOfBounds =
          newX < -20 || newX > width + 20 ||
          newY < -10 || newY > height + 10;

        if (outOfBounds) {
          return createParticle(false);
        }

        return { ...p, x: newX, y: newY };
      });

      forceUpdate(n => n + 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (speed > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, direction, dirRad, maxParticles, getChar]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-br from-slate-900/50 to-slate-800/30"
    >
      {/* Particles */}
      {particlesRef.current.map((p, i) => (
        <span
          key={i}
          className="absolute font-mono text-cyan-300 pointer-events-none select-none"
          style={{
            left: p.x,
            top: p.y,
            opacity: p.opacity,
            fontSize: p.size,
            textShadow: p.layer === 0 ? '0 0 4px rgba(34,211,238,0.6)' : 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 3 - p.layer,
          }}
        >
          {p.char}
        </span>
      ))}

      {/* Subtle direction indicator in corner */}
      <div className="absolute bottom-1 right-1 opacity-40">
        <svg viewBox="0 0 20 20" className="w-4 h-4">
          <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <g transform={`rotate(${direction}, 10, 10)`}>
            <path d="M10,3 L8.5,7 L10,6 L11.5,7 Z" fill="white" opacity="0.6" />
          </g>
        </svg>
      </div>

      {/* "Calm" indicator when no wind */}
      {speed === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 text-xs font-mono">calm</span>
        </div>
      )}
    </div>
  );
};

// Wind Compass SVG Component - Apple Weather style with arrow pointer (fallback/alternative)
const WindCompass = ({ direction = 0, speed = 0 }) => {
  // Generate tick marks (every 15 degrees = 24 ticks)
  const tickMarks = [...Array(24)].map((_, i) => {
    const angle = i * 15;
    const isCardinal = angle % 90 === 0;
    // Skip cardinal positions - we'll use labels there instead
    if (isCardinal) return null;
    const isMajor = angle % 45 === 0;
    const innerRadius = isMajor ? 35 : 37;
    const outerRadius = 40;
    const radian = (angle - 90) * (Math.PI / 180);
    const x1 = 50 + innerRadius * Math.cos(radian);
    const y1 = 50 + innerRadius * Math.sin(radian);
    const x2 = 50 + outerRadius * Math.cos(radian);
    const y2 = 50 + outerRadius * Math.sin(radian);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={isMajor ? 1.5 : 0.75}
      />
    );
  });

  // Calculate position for the edge dot indicator
  const dotRadius = 40;
  const dotRadian = (direction - 90) * (Math.PI / 180);
  const dotX = 50 + dotRadius * Math.cos(dotRadian);
  const dotY = 50 + dotRadius * Math.sin(dotRadian);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        {/* Glow effect for the compass */}
        <filter id="compassGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />

      {/* Tick marks */}
      {tickMarks}

      {/* Cardinal direction labels - positioned OUTSIDE the circle */}
      <text x="50" y="4" textAnchor="middle" dominantBaseline="hanging" fill="white" fontSize="9" fontWeight="600">N</text>
      <text x="96" y="50" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="8">E</text>
      <text x="50" y="97" textAnchor="middle" dominantBaseline="auto" fill="rgba(255,255,255,0.5)" fontSize="8">S</text>
      <text x="4" y="50" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="8">W</text>

      {/* Arrow pointer - rotated based on direction */}
      <g transform={`rotate(${direction}, 50, 50)`} filter="url(#compassGlow)">
        {/* Arrow pointing up (toward wind source) */}
        <path
          d="M 50,18 L 46,32 L 50,28 L 54,32 Z"
          fill="white"
        />
        {/* Arrow shaft */}
        <line
          x1="50"
          y1="28"
          x2="50"
          y2="38"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Edge dot indicator showing wind direction */}
      <circle
        cx={dotX}
        cy={dotY}
        r="4"
        fill="white"
        filter="url(#compassGlow)"
      />

      {/* Center speed display */}
      <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="16" fontWeight="600">
        {speed}
      </text>
      <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">
        mph
      </text>
    </svg>
  );
};

export const WindWidget = memo(function WindWidget({
  speed = 0,
  direction = 0,
  gusts = null,
  loading = false,
  observations = [],
  timezone = 'America/New_York',
  cityName,
  compact = false, // Compact mode for 1x1 grid cell
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert m/s to mph if needed
  const speedMph = typeof speed === 'object' ? Math.round(speed.value * 2.237) : Math.round(speed);
  const gustsMph = gusts ? (typeof gusts === 'object' ? Math.round(gusts.value * 2.237) : Math.round(gusts)) : null;
  const directionDeg = typeof direction === 'object' ? direction.value : direction;
  const directionCardinal = getWindDirection(directionDeg);

  if (loading) {
    return (
      <GlassWidget title="WIND" icon={Wind} size={compact ? 'small' : 'medium'}>
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className={compact ? 'w-16 h-16' : 'w-20 h-20'} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        </div>
      </GlassWidget>
    );
  }

  // Compact mode: ASCII animation with text below
  if (compact) {
    return (
      <>
        <GlassWidget
          title="WIND"
          icon={Wind}
          size="small"
          className="cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex flex-col flex-1 gap-1">
            {/* Top: ASCII Animation - 60% of widget */}
            <div className="flex-[3] min-h-[60px] bg-black/20 rounded-lg overflow-hidden">
              <ASCIIWindAnimation direction={directionDeg} speed={speedMph} />
            </div>

            {/* Bottom: Speed and direction info - 40% */}
            <div className="flex-[2] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light text-white">{speedMph}</span>
                  <span className="text-[10px] text-white/60">mph</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-white">{directionCardinal}</span>
                  <span className="text-[10px] text-white/50 ml-1">{Math.round(directionDeg)}°</span>
                </div>
              </div>
              {gustsMph && (
                <div className="text-[10px] text-white/50">
                  Gusts {gustsMph} mph
                </div>
              )}
            </div>
          </div>
        </GlassWidget>

        {/* Wind Detail Modal - Lazy loaded */}
        {isModalOpen && (
          <Suspense fallback={null}>
            <WindDetailModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              currentSpeed={speedMph}
              currentDirection={directionDeg}
              currentGusts={gustsMph}
              observations={observations}
              timezone={timezone}
              cityName={cityName}
            />
          </Suspense>
        )}
      </>
    );
  }

  // Default mode: ASCII animation featured with data below
  return (
    <>
      <GlassWidget
        title="WIND"
        icon={Wind}
        size="medium"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-col flex-1 gap-3">
          {/* Top: ASCII Animation - larger in default mode */}
          <div className="h-[72px] bg-black/20 rounded-lg overflow-hidden">
            <ASCIIWindAnimation direction={directionDeg} speed={speedMph} />
          </div>

          {/* Bottom: Data rows */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <span className="text-sm text-white/70">Speed</span>
              <span className="text-lg font-medium text-white">{speedMph} mph</span>
            </div>
            {gustsMph && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <span className="text-sm text-white/70">Gusts</span>
                <span className="text-sm font-medium text-white">{gustsMph} mph</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-white/70">Direction</span>
              <span className="text-sm font-medium text-white">{directionCardinal} ({Math.round(directionDeg)}°)</span>
            </div>
          </div>
        </div>
      </GlassWidget>

      {/* Wind Detail Modal - Lazy loaded */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <WindDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentSpeed={speedMph}
            currentDirection={directionDeg}
            currentGusts={gustsMph}
            observations={observations}
            timezone={timezone}
            cityName={cityName}
          />
        </Suspense>
      )}
    </>
  );
});

WindWidget.propTypes = {
  speed: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  direction: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  gusts: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
  observations: PropTypes.array,
  timezone: PropTypes.string,
  cityName: PropTypes.string,
};

// ============ HUMIDITY WIDGET ============
export const HumidityWidget = memo(function HumidityWidget({ value = 0, dewPoint = null, loading = false }) {
  // Handle NWS format
  const humidityValue = typeof value === 'object' ? Math.round(value.value) : Math.round(value);
  const dewPointValue = dewPoint ? (typeof dewPoint === 'object' ? Math.round((dewPoint.value * 9/5) + 32) : Math.round(dewPoint)) : null;

  if (loading) {
    return (
      <GlassWidget title="HUMIDITY" icon={Droplets} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="HUMIDITY" icon={Droplets} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Large percentage */}
        <span className="text-2xl font-light">{humidityValue}%</span>

        {/* Dew point */}
        {dewPointValue !== null && (
          <span className="text-[11px] text-glass-text-secondary">
            Dew point {dewPointValue}°
          </span>
        )}
      </div>
    </GlassWidget>
  );
});

HumidityWidget.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  dewPoint: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
};

// ============ PRESSURE WIDGET ============
const getTrendIcon = (trend) => {
  if (trend === 'rising') return TrendingUp;
  if (trend === 'falling') return TrendingDown;
  return Minus;
};

export const PressureWidget = memo(function PressureWidget({ value = 0, trend = 'steady', loading = false }) {
  // Convert Pa to inHg if needed (NWS returns Pa)
  const pressureInHg = typeof value === 'object'
    ? (value.value / 3386.39).toFixed(2)
    : (value / 3386.39).toFixed(2);

  const TrendIcon = getTrendIcon(trend);

  if (loading) {
    return (
      <GlassWidget title="PRESSURE" icon={Gauge} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="PRESSURE" icon={Gauge} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light">{pressureInHg}</span>
          <span className="text-[11px] text-glass-text-muted">inHg</span>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1 text-glass-text-secondary mt-0.5">
          <TrendIcon className="w-3 h-3" />
          <span className="text-[11px] capitalize">{trend}</span>
        </div>
      </div>
    </GlassWidget>
  );
});

PressureWidget.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  trend: PropTypes.oneOf(['rising', 'falling', 'steady']),
  loading: PropTypes.bool,
};

// ============ FEELS LIKE WIDGET ============
export const FeelsLikeWidget = memo(function FeelsLikeWidget({ actual = 0, feelsLike = 0, loading = false }) {
  // Convert Celsius to Fahrenheit if needed
  const actualF = typeof actual === 'object' ? Math.round((actual.value * 9/5) + 32) : Math.round(actual);
  const feelsLikeF = typeof feelsLike === 'object' ? Math.round((feelsLike.value * 9/5) + 32) : Math.round(feelsLike);
  const diff = feelsLikeF - actualF;

  if (loading) {
    return (
      <GlassWidget title="FEELS LIKE" icon={Thermometer} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="FEELS LIKE" icon={Thermometer} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Feels like temp */}
        <span className="text-2xl font-light">{feelsLikeF}°</span>

        {/* Comparison to actual */}
        <span className="text-[11px] text-glass-text-secondary">
          {diff === 0 ? 'Same as actual' : diff > 0 ? `${diff}° warmer` : `${Math.abs(diff)}° colder`}
        </span>
      </div>
    </GlassWidget>
  );
});

FeelsLikeWidget.propTypes = {
  actual: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  feelsLike: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
};

// ============ MARKET INSIGHT WIDGET ============
export const MarketInsightWidget = memo(function MarketInsightWidget({ marketData, forecastHigh, loading = false }) {
  // Extract the most likely bracket from market data
  const topBracket = marketData?.topBrackets?.[0];
  const marketError = marketData?.error;
  const hasMarketData = topBracket && !marketError;

  // Parse bracket label to extract temperature (e.g., "75° or above" -> 75)
  const getMarketPrediction = () => {
    if (!topBracket?.label) return null;
    const match = topBracket.label.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const marketPrediction = getMarketPrediction();
  const confidence = topBracket?.yesPrice || 0;

  // Calculate difference from NWS forecast
  const diff = marketPrediction && forecastHigh ? marketPrediction - forecastHigh : null;

  if (loading || marketData?.loading) {
    return (
      <GlassWidget title="MARKET INSIGHT" icon={BarChart3} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (!hasMarketData) {
    return (
      <GlassWidget title="MARKET INSIGHT" icon={BarChart3} size="small">
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-sm text-glass-text-muted text-center">
            No markets available
          </span>
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="MARKET INSIGHT" icon={BarChart3} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Market prediction */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light">{marketPrediction}°</span>
          <span className="text-[11px] text-glass-text-muted">high</span>
        </div>

        {/* Confidence */}
        <span className="text-[11px] text-glass-text-secondary">
          {confidence}% confidence
        </span>

        {/* Comparison to NWS */}
        {diff !== null && diff !== 0 && (
          <span className="text-[10px] text-glass-text-muted mt-0.5">
            {diff > 0 ? `${diff}° above NWS` : `${Math.abs(diff)}° below NWS`}
          </span>
        )}
      </div>
    </GlassWidget>
  );
});

MarketInsightWidget.propTypes = {
  marketData: PropTypes.shape({
    topBrackets: PropTypes.array,
    error: PropTypes.string,
    loading: PropTypes.bool,
  }),
  forecastHigh: PropTypes.number,
  loading: PropTypes.bool,
};

// ============ PRECIPITATION WIDGET ============
export const PrecipitationWidget = memo(function PrecipitationWidget({
  citySlug,
  cityName,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dailyData, totals, monthName, year, loading, error, stationName } = useMonthlyPrecipitation(citySlug);

  // Determine what to display based on data
  const hasRain = totals.precipitation > 0;
  const hasSnow = totals.snowfall > 0;
  const hasBoth = hasRain && hasSnow;
  const hasNeither = !hasRain && !hasSnow;

  // Primary display: rain if available, otherwise snow, otherwise 0
  const primaryValue = hasRain ? totals.precipitation.toFixed(2) : hasSnow ? totals.snowfall.toFixed(1) : '0.00';
  const primaryLabel = hasRain ? 'rain' : hasSnow ? 'snow' : 'rain';
  const PrimaryIcon = hasSnow && !hasRain ? Snowflake : Droplets;

  // Secondary value only shown when both rain and snow are present
  const secondaryValue = hasBoth ? totals.snowfall.toFixed(1) : null;

  if (loading) {
    return (
      <GlassWidget title="PRECIPITATION" icon={CloudRain} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (error) {
    return (
      <GlassWidget title="PRECIPITATION" icon={CloudRain} size="small">
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-sm text-glass-text-muted text-center">
            No data
          </span>
        </div>
      </GlassWidget>
    );
  }

  return (
    <>
      <GlassWidget
        title="PRECIPITATION"
        icon={CloudRain}
        size="small"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-col items-start justify-center flex-1">
          {/* Primary value */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light">{primaryValue}"</span>
            <span className="text-[11px] text-glass-text-muted">{primaryLabel}</span>
          </div>

          {/* Secondary value (if both rain & snow) */}
          {secondaryValue && (
            <div className="flex items-center gap-1 text-sky-300">
              <Snowflake className="w-3 h-3" />
              <span className="text-[11px]">{secondaryValue}" snow</span>
            </div>
          )}

          {/* Month label */}
          <span className="text-[11px] text-glass-text-muted mt-1">{monthName} MTD</span>
        </div>
      </GlassWidget>

      {/* Precipitation Detail Modal - Lazy loaded */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <PrecipitationDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            dailyData={dailyData}
            totals={totals}
            monthName={monthName}
            year={year}
            stationName={stationName}
          />
        </Suspense>
      )}
    </>
  );
});

PrecipitationWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string,
};
