import PropTypes from 'prop-types';
import { Calendar, Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Wind } from 'lucide-react';
import GlassWidget from './GlassWidget';

/**
 * TenDayForecast - Apple Weather style multi-day forecast
 * Features gradient temperature bars with current temp indicator
 */

// Map condition to icon
const getConditionIcon = (condition) => {
  if (!condition) return Sun;
  const text = condition.toLowerCase();

  if (text.includes('thunder') || text.includes('lightning')) return CloudLightning;
  if (text.includes('snow') || text.includes('flurr')) return CloudSnow;
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) return CloudRain;
  if (text.includes('fog') || text.includes('mist')) return CloudFog;
  if (text.includes('wind')) return Wind;
  if (text.includes('cloud') || text.includes('overcast')) return Cloud;
  return Sun;
};

// Format day name - Apple style
const formatDay = (dateStr, index) => {
  if (index === 0) return 'Today';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Get temperature color based on value
const getTempColor = (temp, min, max) => {
  const range = max - min || 1;
  const ratio = (temp - min) / range;

  // Apple-style gradient: blue (cold) → cyan → green → yellow → orange (hot)
  if (ratio < 0.25) return '#64D2FF'; // Blue
  if (ratio < 0.5) return '#30D158';  // Green
  if (ratio < 0.75) return '#FFD60A'; // Yellow
  return '#FF9F0A'; // Orange
};

export default function TenDayForecast({ days = [], loading = false }) {
  if (loading) {
    return (
      <GlassWidget title="10-DAY FORECAST" icon={Calendar} size="large">
        <div className="space-y-3 animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-4 bg-white/10 rounded" />
              <div className="w-6 h-6 bg-white/10 rounded-full" />
              <div className="w-8 h-4 bg-white/10 rounded" />
              <div className="flex-1 h-1 bg-white/10 rounded-full" />
              <div className="w-8 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </GlassWidget>
    );
  }

  if (days.length === 0) {
    return (
      <GlassWidget title="10-DAY FORECAST" icon={Calendar} size="large">
        <div className="flex items-center justify-center h-full text-white/40">
          No forecast data available
        </div>
      </GlassWidget>
    );
  }

  // Calculate overall temperature range for the entire forecast period
  const allTemps = days.flatMap(d => [d.high, d.low].filter(t => t != null));
  const overallMin = Math.min(...allTemps);
  const overallMax = Math.max(...allTemps);
  const overallRange = overallMax - overallMin || 1;

  return (
    <GlassWidget title="10-DAY FORECAST" icon={Calendar} size="large" className="h-full">
      <div className="divide-y divide-white/10 overflow-y-auto">
        {days.slice(0, 10).map((day, index) => {
          const Icon = getConditionIcon(day.condition);

          // Calculate bar positions relative to overall range
          const lowPos = ((day.low - overallMin) / overallRange) * 100;
          const highPos = ((day.high - overallMin) / overallRange) * 100;
          const barWidth = Math.max(highPos - lowPos, 2); // Minimum 2% width

          // Current temp position for today
          const currentPos = day.current != null
            ? ((day.current - overallMin) / overallRange) * 100
            : null;

          return (
            <div
              key={day.date || index}
              className="flex items-center gap-1.5 py-1.5 first:pt-0 last:pb-0"
            >
              {/* Day name */}
              <span className="w-10 text-[12px] font-medium text-white shrink-0">
                {formatDay(day.date, index)}
              </span>

              {/* Weather icon */}
              <div className="w-6 flex justify-center shrink-0">
                <Icon className="w-4 h-4 text-white/80" />
              </div>

              {/* Low temp */}
              <span className="w-8 text-[12px] text-white/50 text-right shrink-0 tabular-nums">
                {Math.round(day.low)}°
              </span>

              {/* Temperature gradient bar */}
              <div className="flex-1 h-[4px] bg-white/10 rounded-full relative mx-1 overflow-hidden">
                {/* Gradient segment for this day's range */}
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${lowPos}%`,
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg,
                      ${getTempColor(day.low, overallMin, overallMax)},
                      ${getTempColor((day.low + day.high) / 2, overallMin, overallMax)},
                      ${getTempColor(day.high, overallMin, overallMax)}
                    )`,
                  }}
                />

                {/* Current temperature dot (only for today) */}
                {index === 0 && currentPos != null && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-white rounded-full shadow-lg border border-white/50"
                    style={{
                      left: `${currentPos}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </div>

              {/* High temp */}
              <span className="w-8 text-[12px] font-medium text-white text-right shrink-0 tabular-nums">
                {Math.round(day.high)}°
              </span>
            </div>
          );
        })}
      </div>
    </GlassWidget>
  );
}

TenDayForecast.propTypes = {
  days: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string,
    high: PropTypes.number,
    low: PropTypes.number,
    condition: PropTypes.string,
    current: PropTypes.number,
  })),
  loading: PropTypes.bool,
};
