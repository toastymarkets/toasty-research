import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * DynamicBackground - Apple Weather inspired animated background
 * Changes gradient based on time of day and weather conditions
 */

// Time periods for gradient selection
const TIME_PERIODS = {
  DAWN: 'dawn',      // 5am - 7am
  MORNING: 'morning', // 7am - 11am
  DAY: 'day',        // 11am - 3pm
  AFTERNOON: 'afternoon', // 3pm - 6pm
  SUNSET: 'sunset',   // 6pm - 8pm
  DUSK: 'dusk',      // 8pm - 9pm
  NIGHT: 'night',    // 9pm - 5am
};

// Weather condition mappings
const WEATHER_CONDITIONS = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  OVERCAST: 'overcast',
  RAIN: 'rain',
  STORM: 'storm',
  SNOW: 'snow',
  FOG: 'fog',
};

/**
 * Get the current time period based on hour
 */
function getTimePeriod(hour) {
  if (hour >= 5 && hour < 7) return TIME_PERIODS.DAWN;
  if (hour >= 7 && hour < 11) return TIME_PERIODS.MORNING;
  if (hour >= 11 && hour < 15) return TIME_PERIODS.DAY;
  if (hour >= 15 && hour < 18) return TIME_PERIODS.AFTERNOON;
  if (hour >= 18 && hour < 20) return TIME_PERIODS.SUNSET;
  if (hour >= 20 && hour < 21) return TIME_PERIODS.DUSK;
  return TIME_PERIODS.NIGHT;
}

/**
 * Map NWS condition text to our weather condition
 */
function mapWeatherCondition(conditionText) {
  if (!conditionText) return WEATHER_CONDITIONS.CLEAR;

  const text = conditionText.toLowerCase();

  if (text.includes('thunder') || text.includes('storm')) {
    return WEATHER_CONDITIONS.STORM;
  }
  if (text.includes('snow') || text.includes('blizzard') || text.includes('flurr')) {
    return WEATHER_CONDITIONS.SNOW;
  }
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) {
    return WEATHER_CONDITIONS.RAIN;
  }
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) {
    return WEATHER_CONDITIONS.FOG;
  }
  if (text.includes('overcast')) {
    return WEATHER_CONDITIONS.OVERCAST;
  }
  if (text.includes('cloud') || text.includes('partly') || text.includes('mostly cloudy')) {
    return WEATHER_CONDITIONS.CLOUDY;
  }

  return WEATHER_CONDITIONS.CLEAR;
}

export default function DynamicBackground({
  weatherCondition = null,
  timezone = null,
  animate = true,
  showCelestial = true,
  showClouds = true,
  children
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time period based on timezone or local time
  const timePeriod = useMemo(() => {
    let hour;
    if (timezone) {
      try {
        const options = { hour: 'numeric', hour12: false, timeZone: timezone };
        hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(currentTime));
      } catch {
        hour = currentTime.getHours();
      }
    } else {
      hour = currentTime.getHours();
    }
    return getTimePeriod(hour);
  }, [currentTime, timezone]);

  // Map weather condition
  const condition = useMemo(() => {
    return mapWeatherCondition(weatherCondition);
  }, [weatherCondition]);

  // Build class names
  const backgroundClasses = useMemo(() => {
    const classes = ['weather-background'];

    // Time-based class
    classes.push(`time-${timePeriod}`);

    // Weather condition class (only if not clear)
    if (condition !== WEATHER_CONDITIONS.CLEAR) {
      classes.push(`condition-${condition}`);
    }

    // Animation class
    if (animate && condition === WEATHER_CONDITIONS.CLEAR) {
      classes.push('animate-gradient');
    }

    return classes.join(' ');
  }, [timePeriod, condition, animate]);

  // Determine if we should show rain/snow animations
  const showRain = condition === WEATHER_CONDITIONS.RAIN || condition === WEATHER_CONDITIONS.STORM;
  const showSnow = condition === WEATHER_CONDITIONS.SNOW;
  const isNight = timePeriod === TIME_PERIODS.NIGHT || timePeriod === TIME_PERIODS.DUSK;

  return (
    <div className={backgroundClasses}>
      {/* Sun element */}
      {showCelestial && !isNight && <div className="sun" />}

      {/* Moon element */}
      {showCelestial && isNight && <div className="moon" />}

      {/* Stars for night */}
      {showCelestial && isNight && <div className="stars" />}

      {/* Cloud layer */}
      {showClouds && (condition === WEATHER_CONDITIONS.CLOUDY || condition === WEATHER_CONDITIONS.OVERCAST) && (
        <div className="clouds">
          <div className="cloud" />
          <div className="cloud" />
          <div className="cloud" />
        </div>
      )}

      {/* Rain animation */}
      {showRain && <div className="rain-layer" />}

      {/* Snow animation */}
      {showSnow && <div className="snow-layer" />}

      {/* Bottom fade for content */}
      <div className="bottom-fade" />

      {/* Content */}
      {children}
    </div>
  );
}

DynamicBackground.propTypes = {
  weatherCondition: PropTypes.string,
  timezone: PropTypes.string,
  animate: PropTypes.bool,
  showCelestial: PropTypes.bool,
  showClouds: PropTypes.bool,
  children: PropTypes.node,
};

// Export constants for external use
export { TIME_PERIODS, WEATHER_CONDITIONS, getTimePeriod, mapWeatherCondition };
