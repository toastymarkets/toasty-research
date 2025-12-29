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
} from 'lucide-react';
import GlassWidget from './GlassWidget';

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

export function UVIndexWidget({ value = 0, loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Value */}
        <span className="text-4xl font-light mb-1">{value}</span>
        <span className="text-lg font-medium mb-3" style={{ color: level.color }}>
          {level.label}
        </span>

        {/* Arc gauge */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
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
}

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

export function WindWidget({ speed = 0, direction = 0, gusts = null, loading = false }) {
  // Convert m/s to mph if needed
  const speedMph = typeof speed === 'object' ? Math.round(speed.value * 2.237) : Math.round(speed);
  const gustsMph = gusts ? (typeof gusts === 'object' ? Math.round(gusts.value * 2.237) : Math.round(gusts)) : null;
  const directionDeg = typeof direction === 'object' ? direction.value : direction;

  if (loading) {
    return (
      <GlassWidget title="WIND" icon={Wind} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-16 bg-white/10 rounded-full" />
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget title="WIND" icon={Wind} size="small">
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Compass */}
        <div className="relative w-20 h-20 mb-2">
          {/* Compass circle */}
          <div className="absolute inset-0 border-2 border-white/20 rounded-full" />

          {/* Direction arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${directionDeg}deg)` }}
          >
            <div className="w-0.5 h-8 bg-white/80 rounded-full origin-bottom" />
          </div>

          {/* Center with speed */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-medium">{speedMph}</span>
            <span className="text-xs text-glass-text-muted">mph</span>
          </div>

          {/* Cardinal directions */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs text-glass-text-muted">N</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-xs text-glass-text-muted">S</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-xs text-glass-text-muted">W</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-xs text-glass-text-muted">E</span>
        </div>

        {/* Direction label */}
        <span className="text-sm text-glass-text-secondary">
          {getWindDirection(directionDeg)}
          {gustsMph && <span className="ml-2">Gusts {gustsMph} mph</span>}
        </span>
      </div>
    </GlassWidget>
  );
}

WindWidget.propTypes = {
  speed: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  direction: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  gusts: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
};

// ============ HUMIDITY WIDGET ============
export function HumidityWidget({ value = 0, dewPoint = null, loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Large percentage */}
        <span className="text-4xl font-light mb-2">{humidityValue}%</span>

        {/* Dew point */}
        {dewPointValue !== null && (
          <span className="text-sm text-glass-text-secondary">
            Dew point {dewPointValue}°
          </span>
        )}

        {/* Visual bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-apple-blue rounded-full transition-all"
            style={{ width: `${humidityValue}%` }}
          />
        </div>
      </div>
    </GlassWidget>
  );
}

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

export function PressureWidget({ value = 0, trend = 'steady', loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Value */}
        <span className="text-3xl font-light mb-1">{pressureInHg}</span>
        <span className="text-sm text-glass-text-muted mb-2">inHg</span>

        {/* Trend */}
        <div className="flex items-center gap-1 text-glass-text-secondary">
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm capitalize">{trend}</span>
        </div>
      </div>
    </GlassWidget>
  );
}

PressureWidget.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  trend: PropTypes.oneOf(['rising', 'falling', 'steady']),
  loading: PropTypes.bool,
};

// ============ VISIBILITY WIDGET ============
export function VisibilityWidget({ value = 10, loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Value */}
        <span className="text-4xl font-light mb-1">{visibilityMiles}</span>
        <span className="text-sm text-glass-text-muted">miles</span>

        {/* Description */}
        <span className="text-sm text-glass-text-secondary mt-2">
          {parseFloat(visibilityMiles) >= 10 ? 'Clear' : parseFloat(visibilityMiles) >= 5 ? 'Good' : 'Limited'}
        </span>
      </div>
    </GlassWidget>
  );
}

VisibilityWidget.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
};

// ============ FEELS LIKE WIDGET ============
export function FeelsLikeWidget({ actual = 0, feelsLike = 0, loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Feels like temp */}
        <span className="text-4xl font-light mb-2">{feelsLikeF}°</span>

        {/* Comparison to actual */}
        <span className="text-sm text-glass-text-secondary">
          {diff === 0 ? 'Same as actual' : diff > 0 ? `${diff}° warmer` : `${Math.abs(diff)}° colder`}
        </span>

        {/* Actual temp for reference */}
        <span className="text-xs text-glass-text-muted mt-1">
          Actual: {actualF}°
        </span>
      </div>
    </GlassWidget>
  );
}

FeelsLikeWidget.propTypes = {
  actual: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  feelsLike: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  loading: PropTypes.bool,
};

// ============ MARKET INSIGHT WIDGET ============
export function MarketInsightWidget({ marketData, forecastHigh, loading = false }) {
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
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Market prediction */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-light">{marketPrediction}°</span>
          <span className="text-sm text-glass-text-muted">high</span>
        </div>

        {/* Confidence bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-apple-green rounded-full transition-all"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs text-glass-text-muted mt-1">
          {confidence}% market confidence
        </span>

        {/* Comparison to NWS */}
        {diff !== null && (
          <span className="text-xs text-glass-text-secondary mt-2">
            {diff === 0
              ? 'Matches NWS forecast'
              : diff > 0
                ? `${diff}° above NWS`
                : `${Math.abs(diff)}° below NWS`}
          </span>
        )}
      </div>
    </GlassWidget>
  );
}

MarketInsightWidget.propTypes = {
  marketData: PropTypes.shape({
    topBrackets: PropTypes.array,
    error: PropTypes.string,
    loading: PropTypes.bool,
  }),
  forecastHigh: PropTypes.number,
  loading: PropTypes.bool,
};
