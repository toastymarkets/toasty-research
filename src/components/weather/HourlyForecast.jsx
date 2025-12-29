import PropTypes from 'prop-types';
import { Clock, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Sunset, Sunrise } from 'lucide-react';
import GlassWidget from './GlassWidget';

/**
 * HourlyForecast - Apple Weather style horizontal scrolling forecast
 * Features colored temperature bars based on temp value
 */

// Map condition to icon
const getConditionIcon = (condition, isDaytime) => {
  if (!condition) return isDaytime ? Sun : Moon;
  const text = condition.toLowerCase();

  if (text.includes('thunder') || text.includes('lightning')) return CloudLightning;
  if (text.includes('snow') || text.includes('flurr')) return CloudSnow;
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) return CloudRain;
  if (text.includes('fog') || text.includes('mist')) return CloudFog;
  if (text.includes('cloud') || text.includes('overcast')) return Cloud;
  return isDaytime ? Sun : Moon;
};

// Format hour for display
const formatHour = (hour, isNow = false) => {
  if (isNow) return 'Now';
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
};

// Get temperature color based on value - matches 10-day forecast
const getTempColor = (temp, min, max) => {
  const range = max - min || 1;
  const ratio = (temp - min) / range;

  // Apple-style gradient: blue (cold) → cyan → green → yellow → orange (hot)
  if (ratio < 0.2) return '#64D2FF';  // Blue
  if (ratio < 0.4) return '#5AC8FA';  // Cyan
  if (ratio < 0.6) return '#30D158';  // Green
  if (ratio < 0.8) return '#FFD60A';  // Yellow
  return '#FF9F0A'; // Orange
};

export default function HourlyForecast({ periods = [], loading = false, timezone }) {
  // Take next 24 hours
  const hourlyData = periods.slice(0, 24);

  if (loading) {
    return (
      <GlassWidget title="HOURLY FORECAST" icon={Clock} size="medium">
        <div className="flex gap-3 overflow-x-auto glass-scroll pb-2 animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[50px]">
              <div className="h-4 w-8 bg-white/10 rounded" />
              <div className="h-6 w-6 bg-white/10 rounded-full" />
              <div className="h-5 w-8 bg-white/10 rounded" />
              <div className="h-6 w-1 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </GlassWidget>
    );
  }

  if (hourlyData.length === 0) {
    return (
      <GlassWidget title="HOURLY FORECAST" icon={Clock} size="medium">
        <div className="flex items-center justify-center h-full text-white/40">
          No forecast data available
        </div>
      </GlassWidget>
    );
  }

  // Calculate temperature range for the 24h period
  const temps = hourlyData.map(p => p.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  return (
    <GlassWidget title="HOURLY FORECAST" icon={Clock} size="medium">
      <div className="flex gap-0 overflow-x-auto glass-scroll pb-1 -mx-1 px-1">
        {hourlyData.map((period, index) => {
          const Icon = getConditionIcon(period.shortForecast, period.isDaytime);
          const isNow = index === 0;
          const tempColor = getTempColor(period.temperature, minTemp, maxTemp);

          return (
            <div
              key={period.time}
              className={`
                flex flex-col items-center min-w-[44px] py-1 px-1 rounded-xl
                ${isNow ? 'bg-white/10' : ''}
              `}
            >
              {/* Time */}
              <span className={`text-[11px] ${isNow ? 'font-semibold text-white' : 'text-white/60'}`}>
                {formatHour(period.hour, isNow)}
              </span>

              {/* Condition icon */}
              <div className="my-1">
                <Icon className="w-5 h-5 text-white/90" />
              </div>

              {/* Temperature with color */}
              <span
                className="text-[13px] font-medium"
                style={{ color: tempColor }}
              >
                {Math.round(period.temperature)}°
              </span>
            </div>
          );
        })}
      </div>
    </GlassWidget>
  );
}

HourlyForecast.propTypes = {
  periods: PropTypes.arrayOf(PropTypes.shape({
    time: PropTypes.string,
    hour: PropTypes.number,
    temperature: PropTypes.number,
    shortForecast: PropTypes.string,
    isDaytime: PropTypes.bool,
  })),
  loading: PropTypes.bool,
  timezone: PropTypes.string,
};
