import { useState, memo, lazy, Suspense } from 'react';
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

// ASCII Wind Animation Component - Dynamic flowing characters with compass
const ASCIIWindAnimation = ({ direction = 0, speed = 0 }) => {
  // Get cardinal direction for display
  const getCardinal = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  // Wind intensity affects character set and density
  const isStrong = speed > 15;
  const isModerate = speed > 6;

  // Animation duration inversely proportional to speed
  // Range: 2.5s (calm) to 0.5s (strong wind 25+ mph)
  const duration = Math.max(0.5, 2.5 - (speed / 12));

  // Number of streamlines based on intensity
  const numStreams = isStrong ? 5 : isModerate ? 4 : 3;

  // CSS keyframes for smooth flowing animation
  const keyframes = `
    @keyframes streamFlow {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
  `;

  // Generate stream characters based on intensity
  const getStreamChars = (streamIdx) => {
    if (speed === 0) return '· · · ·';
    if (isStrong) return '═══►';
    if (isModerate) return '───►';
    return '- - -›';
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg flex">
      <style>{keyframes}</style>

      {/* Left: Mini compass showing direction */}
      <div className="w-10 h-full flex items-center justify-center flex-shrink-0">
        <div className="relative w-8 h-8">
          {/* Compass circle */}
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Direction arrow */}
            <g transform={`rotate(${direction}, 16, 16)`}>
              <path d="M16,4 L14,12 L16,10 L18,12 Z" fill="white" opacity="0.9" />
              <line x1="16" y1="10" x2="16" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6" />
            </g>
            {/* N indicator */}
            <text x="16" y="5" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="4">N</text>
          </svg>
        </div>
      </div>

      {/* Right: Streaming particles */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden pr-1">
        {[...Array(numStreams)].map((_, i) => (
          <div
            key={i}
            className="h-3 overflow-hidden flex items-center"
            style={{ opacity: 0.3 + (i % 2) * 0.3 + (speed / 40) }}
          >
            <span
              className="text-[10px] font-mono text-cyan-300 whitespace-nowrap inline-block"
              style={{
                animation: speed > 0
                  ? `streamFlow ${duration + (i * 0.15)}s linear ${i * 0.2}s infinite`
                  : 'none',
                textShadow: isStrong ? '0 0 4px rgba(34,211,238,0.5)' : 'none',
              }}
            >
              {getStreamChars(i)}
            </span>
          </div>
        ))}
      </div>
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
            {/* Top: ASCII Animation */}
            <div className="h-[48px] bg-black/20 rounded-lg overflow-hidden">
              <ASCIIWindAnimation direction={directionDeg} speed={speedMph} />
            </div>

            {/* Bottom: Speed and direction info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-light text-white">{speedMph}</span>
                <span className="text-xs text-white/60">mph</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">{directionCardinal}</span>
                <span className="text-xs text-white/50 ml-1">{Math.round(directionDeg)}°</span>
              </div>
            </div>
            {gustsMph && (
              <div className="text-[11px] text-white/50">
                Gusts {gustsMph} mph
              </div>
            )}
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
