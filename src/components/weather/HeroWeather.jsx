import PropTypes from 'prop-types';
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning, Wind, MapPin } from 'lucide-react';

/**
 * HeroWeather - Large hero display for current weather
 * Apple Weather inspired with large temperature and conditions
 */

// Map condition text to icon
const getWeatherIcon = (condition) => {
  if (!condition) return Sun;
  const text = condition.toLowerCase();

  if (text.includes('thunder') || text.includes('lightning')) return CloudLightning;
  if (text.includes('snow') || text.includes('flurr') || text.includes('blizzard')) return CloudSnow;
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) return CloudRain;
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return CloudFog;
  if (text.includes('wind')) return Wind;
  if (text.includes('cloud') || text.includes('overcast')) return Cloud;
  return Sun;
};

export default function HeroWeather({
  cityName,
  temperature,
  condition,
  high,
  low,
  stationId,
  localTime,
  loading = false,
}) {
  const WeatherIcon = getWeatherIcon(condition);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-pulse">
        <div className="h-8 w-40 bg-white/10 rounded-lg mb-4" />
        <div className="h-24 w-32 bg-white/10 rounded-lg mb-4" />
        <div className="h-6 w-32 bg-white/10 rounded-lg mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded-lg" />
      </div>
    );
  }

  // Format temperature (handle NWS format which can be an object)
  const formatTemp = (temp) => {
    if (temp === null || temp === undefined) return '--';
    if (typeof temp === 'object' && temp.value !== undefined) {
      // Convert Celsius to Fahrenheit if needed
      const celsius = temp.value;
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const displayTemp = formatTemp(temperature);
  const displayHigh = formatTemp(high);
  const displayLow = formatTemp(low);

  return (
    <div className="flex flex-col items-center text-center py-2 md:py-4 w-full">
      {/* Station badge */}
      {stationId && localTime && (
        <div className="glass-badge mb-2">
          <MapPin className="w-3 h-3" />
          <span>{stationId}</span>
          <span className="text-glass-text-muted">•</span>
          <span>{localTime}</span>
        </div>
      )}

      {/* City name */}
      <h1 className="glass-location mb-0.5">
        {cityName || 'Loading...'}
      </h1>

      {/* Large temperature */}
      <div className="glass-temp-hero">
        {displayTemp}°
      </div>

      {/* Condition with high/low on same line - Apple style */}
      <div className="flex items-center gap-2 text-white/70">
        <span className="glass-condition">
          {condition || 'Clear'}
        </span>
      </div>

      {/* High/Low */}
      {(high !== undefined || low !== undefined) && (
        <div className="flex items-center gap-2 text-[13px] text-white/60 mt-0.5">
          <span>H:{displayHigh}°</span>
          <span>L:{displayLow}°</span>
        </div>
      )}

    </div>
  );
}

HeroWeather.propTypes = {
  cityName: PropTypes.string,
  temperature: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  condition: PropTypes.string,
  high: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  low: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  stationId: PropTypes.string,
  localTime: PropTypes.string,
  loading: PropTypes.bool,
};
