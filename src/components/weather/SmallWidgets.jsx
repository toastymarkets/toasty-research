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
      <div className="flex flex-col items-start justify-center flex-1">
        {/* Speed and direction */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-light">{speedMph}</span>
          <span className="text-[11px] text-glass-text-muted">mph</span>
        </div>
        <span className="text-[11px] text-glass-text-secondary">
          {getWindDirection(directionDeg)}
        </span>
        {gustsMph && (
          <span className="text-[10px] text-glass-text-muted mt-1">
            Gusts {gustsMph} mph
          </span>
        )}
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
