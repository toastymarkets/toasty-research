import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Sun,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import GlassWidget from './GlassWidget';
import WindDetailModal from './WindDetailModal';

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

// Wind Compass SVG Component with animated wind flag
const WindCompass = ({ direction = 0, speed = 0 }) => {
  // Generate tick marks (every 10 degrees = 36 ticks for finer graduation)
  const tickMarks = [...Array(36)].map((_, i) => {
    const angle = i * 10;
    const isCardinal = angle % 90 === 0;
    const isMajor = angle % 30 === 0;
    // Skip cardinal positions - we'll use labels there instead
    if (isCardinal) return null;
    const innerRadius = isMajor ? 36 : 38;
    const outerRadius = 42;
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
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  });

  // Animation speed based on wind - faster wind = faster wave
  // Range: 0.4s (strong wind 30+ mph) to 3s (light breeze)
  const animationDuration = speed > 0 ? Math.max(0.4, 3 - (speed / 10)) : 0;
  // Wave amplitude based on wind speed (more wind = bigger waves)
  const waveAmplitude = Math.min(6, speed * 0.4);
  // Flag extends more when there's wind
  const flagExtend = Math.min(8, speed * 0.5);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />

      {/* Tick marks */}
      {tickMarks}

      {/* Wind flag - rotated based on direction */}
      <g transform={`rotate(${direction}, 50, 50)`}>
        {/* Flag pole */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="24"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Triangular pennant flag - attached at top of pole */}
        <g transform="translate(50, 24)">
          {speed === 0 ? (
            /* Still flag - hangs down when no wind */
            <path
              d="M 0,0 L 0,12 L 6,6 Z"
              fill="rgba(255,255,255,0.8)"
            />
          ) : (
            /* Waving triangular flag - wave travels through the fabric */
            <path
              d={`M 0,0 L ${16 + flagExtend},5 L 0,10 Z`}
              fill="rgba(255,255,255,0.85)"
            >
              <animate
                attributeName="d"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
                values={`
                  M 0,0 C 5,${-waveAmplitude} 10,${waveAmplitude} ${16 + flagExtend},5 C 10,${5 + waveAmplitude} 5,${10 - waveAmplitude} 0,10 Z;
                  M 0,0 C 5,${waveAmplitude} 10,${-waveAmplitude} ${16 + flagExtend},5 C 10,${5 - waveAmplitude} 5,${10 + waveAmplitude} 0,10 Z;
                  M 0,0 C 5,${-waveAmplitude} 10,${waveAmplitude} ${16 + flagExtend},5 C 10,${5 + waveAmplitude} 5,${10 - waveAmplitude} 0,10 Z
                `}
              />
            </path>
          )}
        </g>
      </g>

      {/* Cardinal direction labels - positioned OUTSIDE the circle */}
      <text x="50" y="4" textAnchor="middle" dominantBaseline="hanging" fill="white" fontSize="8" fontWeight="600">N</text>
      <text x="97" y="50" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="7">E</text>
      <text x="50" y="97" textAnchor="middle" dominantBaseline="auto" fill="rgba(255,255,255,0.5)" fontSize="7">S</text>
      <text x="3" y="50" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="7">W</text>

      {/* Center speed display - rendered LAST so it appears on top */}
      <circle cx="50" cy="50" r="16" fill="rgba(0,0,0,0.4)" />
      <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="600">
        {speed}
      </text>
      <text x="50" y="61" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="7">
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
  compact = false, // New: compact mode for 1x1 grid cell
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert m/s to mph if needed
  const speedMph = typeof speed === 'object' ? Math.round(speed.value * 2.237) : Math.round(speed);
  const gustsMph = gusts ? (typeof gusts === 'object' ? Math.round(gusts.value * 2.237) : Math.round(gusts)) : null;
  const directionDeg = typeof direction === 'object' ? direction.value : direction;

  if (loading) {
    return (
      <GlassWidget title="WIND" icon={Wind} size={compact ? 'small' : 'medium'}>
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className={compact ? 'w-16 h-16' : 'w-20 h-20'} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        </div>
      </GlassWidget>
    );
  }

  // Compact mode: Compass with succinct wind info
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
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Prominent compass */}
            <div className="w-[56px] h-[56px]">
              <WindCompass direction={directionDeg} speed={speedMph} />
            </div>
            {/* Succinct wind info: "WSW 6mph" */}
            <div className="text-sm font-medium text-white mt-1">
              {getWindDirection(directionDeg)} {speedMph}mph
            </div>
            {gustsMph && (
              <div className="text-[10px] text-white/50">
                Gusts {gustsMph}
              </div>
            )}
          </div>
        </GlassWidget>

        {/* Wind Detail Modal */}
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
      </>
    );
  }

  // Default mode: Compass + text data side by side
  return (
    <>
      <GlassWidget
        title="WIND"
        icon={Wind}
        size="medium"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between flex-1 gap-3">
          {/* Left: Text data with separator lines */}
          <div className="flex flex-col divide-y divide-white/10 flex-1">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[11px] text-glass-text-muted">Wind</span>
              <span className="text-sm font-medium text-white">{speedMph} mph</span>
            </div>
            {gustsMph && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-glass-text-muted">Gusts</span>
                <span className="text-sm font-medium text-white">{gustsMph} mph</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[11px] text-glass-text-muted">Direction</span>
              <span className="text-sm font-medium text-white">{Math.round(directionDeg)}° {getWindDirection(directionDeg)}</span>
            </div>
          </div>

          {/* Right: Compass */}
          <div className="w-20 h-20 flex-shrink-0">
            <WindCompass direction={directionDeg} speed={speedMph} />
          </div>
        </div>

        {/* Tap hint */}
        <div className="flex items-center justify-end mt-1">
          <ChevronRight className="w-4 h-4 text-white/30" />
        </div>
      </GlassWidget>

      {/* Wind Detail Modal */}
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

// ============ VISIBILITY WIDGET ============
export const VisibilityWidget = memo(function VisibilityWidget({ value = 10, loading = false }) {
  // Convert meters to miles if needed
  const visibilityMiles = typeof value === 'object'
    ? (value.value / 1609.34).toFixed(1)
    : (value / 1609.34).toFixed(1);

  if (loading) {
    return (
      <GlassWidget title="VISIBILITY" icon={Eye} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="VISIBILITY" icon={Eye} size="small">
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light">{visibilityMiles}</span>
          <span className="text-[11px] text-glass-text-muted">mi</span>
        </div>

        {/* Description */}
        <span className="text-[11px] text-glass-text-secondary">
          {parseFloat(visibilityMiles) >= 10 ? 'Clear' : parseFloat(visibilityMiles) >= 5 ? 'Good' : 'Limited'}
        </span>
      </div>
    </GlassWidget>
  );
});

VisibilityWidget.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
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
