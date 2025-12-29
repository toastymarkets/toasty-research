import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Clock, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from 'lucide-react';
import GlassWidget from './GlassWidget';
import TemperatureChartModal from './TemperatureChartModal';

/**
 * HourlyForecast - Shows real NWS observation data with clickable chart popup
 * Displays recent observations in a horizontal scrolling format
 */

// Map condition to icon
const getConditionIcon = (condition, isDaytime = true) => {
  if (!condition) return isDaytime ? Sun : Moon;
  const text = condition.toLowerCase();

  if (text.includes('thunder') || text.includes('lightning')) return CloudLightning;
  if (text.includes('snow') || text.includes('flurr')) return CloudSnow;
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) return CloudRain;
  if (text.includes('fog') || text.includes('mist')) return CloudFog;
  if (text.includes('cloud') || text.includes('overcast')) return Cloud;
  return isDaytime ? Sun : Moon;
};

// Format time for display
const formatTime = (date, timezone, isNow = false) => {
  if (isNow) return 'Now';
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: true,
  });
};

// Get temperature color based on value
const getTempColor = (temp, min, max) => {
  const range = max - min || 1;
  const ratio = (temp - min) / range;

  // Apple-style gradient
  if (ratio < 0.2) return '#64D2FF';  // Blue
  if (ratio < 0.4) return '#5AC8FA';  // Cyan
  if (ratio < 0.6) return '#30D158';  // Green
  if (ratio < 0.8) return '#FFD60A';  // Yellow
  return '#FF9F0A'; // Orange
};

// Check if time is daytime (between 6am and 6pm)
const isDaytime = (date, timezone) => {
  const hour = parseInt(date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }));
  return hour >= 6 && hour < 18;
};

export default function HourlyForecast({
  observations = [],
  loading = false,
  timezone = 'America/New_York',
  cityName,
  currentTemp,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get last 24 hours of observations for display (most recent first for the scroll)
  const displayData = useMemo(() => {
    if (!observations || observations.length === 0) return [];

    // Take observations from the last 24 hours, sample every ~1 hour for display
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const filtered = observations
      .filter(obs => obs.timestamp >= twentyFourHoursAgo)
      .reverse(); // Most recent first

    // Sample roughly every hour (NWS reports ~every 5-60 minutes depending on station)
    const sampled = [];
    let lastHour = -1;

    for (const obs of filtered) {
      const hour = obs.timestamp.getHours();
      if (hour !== lastHour) {
        sampled.push(obs);
        lastHour = hour;
      }
    }

    return sampled.slice(0, 24);
  }, [observations]);

  // Calculate temp range for coloring
  const tempRange = useMemo(() => {
    if (displayData.length === 0) return { min: 0, max: 100 };
    const temps = displayData.map(d => d.temperature).filter(t => t != null);
    return {
      min: Math.min(...temps),
      max: Math.max(...temps),
    };
  }, [displayData]);

  if (loading) {
    return (
      <GlassWidget title="OBSERVATIONS" icon={Clock} size="medium">
        <div className="flex gap-3 overflow-x-auto glass-scroll pb-2 animate-pulse">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[50px]">
              <div className="h-4 w-8 bg-white/10 rounded" />
              <div className="h-6 w-6 bg-white/10 rounded-full" />
              <div className="h-5 w-8 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </GlassWidget>
    );
  }

  if (displayData.length === 0) {
    return (
      <GlassWidget title="OBSERVATIONS" icon={Clock} size="medium">
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          No observation data available
        </div>
      </GlassWidget>
    );
  }

  return (
    <>
      <GlassWidget
        title="OBSERVATIONS"
        icon={Clock}
        size="medium"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer"
      >
        <div className="flex gap-0 overflow-x-auto glass-scroll pb-1 -mx-1 px-1">
          {displayData.map((obs, index) => {
            const isNow = index === 0;
            const Icon = getConditionIcon(obs.description, isDaytime(obs.timestamp, timezone));
            const tempColor = getTempColor(obs.temperature, tempRange.min, tempRange.max);

            return (
              <div
                key={obs.time}
                className={`
                  flex flex-col items-center min-w-[44px] py-1 px-1 rounded-xl
                  ${isNow ? 'bg-white/10' : ''}
                `}
              >
                {/* Time */}
                <span className={`text-[11px] ${isNow ? 'font-semibold text-white' : 'text-white/60'}`}>
                  {formatTime(obs.timestamp, timezone, isNow)}
                </span>

                {/* Condition icon */}
                <div className="my-1">
                  <Icon className="w-5 h-5 text-white/90" />
                </div>

                {/* Temperature */}
                <span
                  className="text-[13px] font-medium"
                  style={{ color: tempColor }}
                >
                  {Math.round(obs.temperature)}°
                </span>
              </div>
            );
          })}
        </div>

        {/* Tap hint */}
        <div className="text-center mt-1">
          <span className="text-[10px] text-glass-text-muted">Tap for details</span>
        </div>
      </GlassWidget>

      {/* Chart Modal */}
      <TemperatureChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        observations={observations}
        cityName={cityName}
        currentTemp={currentTemp}
        timezone={timezone}
      />
    </>
  );
}

HourlyForecast.propTypes = {
  observations: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.instanceOf(Date),
    time: PropTypes.string,
    temperature: PropTypes.number,
    dewpoint: PropTypes.number,
    humidity: PropTypes.number,
    description: PropTypes.string,
  })),
  loading: PropTypes.bool,
  timezone: PropTypes.string,
  cityName: PropTypes.string,
  currentTemp: PropTypes.number,
};
