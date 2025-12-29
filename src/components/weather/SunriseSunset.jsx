import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Sunrise, Sunset } from 'lucide-react';
import GlassWidget from './GlassWidget';

/**
 * SunriseSunset - Sun path arc widget
 * Apple Weather inspired with animated sun position
 */

export default function SunriseSunset({
  sunrise,
  sunset,
  timezone = 'America/New_York',
  loading = false,
}) {
  // Calculate sun position and times
  const sunData = useMemo(() => {
    if (!sunrise || !sunset) return null;

    const now = new Date();
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);

    // Calculate current position (0 = sunrise, 100 = sunset)
    const dayLength = sunsetTime - sunriseTime;
    const timeSinceSunrise = now - sunriseTime;
    let position = (timeSinceSunrise / dayLength) * 100;

    // Clamp position
    const isDaytime = position >= 0 && position <= 100;
    position = Math.max(0, Math.min(100, position));

    // Format times
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      });
    };

    // Calculate daylight duration
    const daylightHours = Math.floor(dayLength / (1000 * 60 * 60));
    const daylightMinutes = Math.floor((dayLength % (1000 * 60 * 60)) / (1000 * 60));

    return {
      sunriseFormatted: formatTime(sunriseTime),
      sunsetFormatted: formatTime(sunsetTime),
      position,
      isDaytime,
      daylightDuration: `${daylightHours}h ${daylightMinutes}m`,
    };
  }, [sunrise, sunset, timezone]);

  if (loading) {
    return (
      <GlassWidget title="SUNRISE" icon={Sunrise} size="medium">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-full h-16 bg-white/10 rounded-lg" />
        </div>
      </GlassWidget>
    );
  }

  if (!sunData) {
    return (
      <GlassWidget title="SUNRISE" icon={Sunrise} size="medium">
        <div className="flex items-center justify-center h-full text-glass-text-muted">
          No sunrise/sunset data
        </div>
      </GlassWidget>
    );
  }

  // Calculate sun position on arc
  const arcAngle = (sunData.position / 100) * 180;
  const arcRadius = 80;
  const sunX = 50 + arcRadius * Math.cos((180 - arcAngle) * Math.PI / 180);
  const sunY = 85 - arcRadius * Math.sin((180 - arcAngle) * Math.PI / 180);

  return (
    <GlassWidget
      title={sunData.isDaytime ? "SUNSET" : "SUNRISE"}
      icon={sunData.isDaytime ? Sunset : Sunrise}
      size="medium"
    >
      <div className="flex flex-col flex-1">
        {/* Arc visualization - compact */}
        <div className="relative w-full h-16 mb-1">
          <svg
            viewBox="0 0 200 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Horizon line */}
            <line
              x1="10"
              y1="85"
              x2="190"
              y2="85"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Arc path (background) */}
            <path
              d="M 10 85 A 80 80 0 0 1 190 85"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />

            {/* Arc path (progress) */}
            {sunData.isDaytime && (
              <path
                d={`M 10 85 A 80 80 0 0 1 ${sunX} ${sunY}`}
                fill="none"
                stroke="rgba(255,200,100,0.6)"
                strokeWidth="2"
              />
            )}

            {/* Sun circle */}
            <circle
              cx={sunX}
              cy={sunY}
              r="6"
              fill={sunData.isDaytime ? "#FFD60A" : "rgba(255,255,255,0.3)"}
              className="drop-shadow-lg"
            />
          </svg>
        </div>

        {/* Times - compact */}
        <div className="flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-1">
            <Sunrise className="w-3 h-3 text-apple-orange" />
            <span>{sunData.sunriseFormatted}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{sunData.sunsetFormatted}</span>
            <Sunset className="w-3 h-3 text-apple-orange" />
          </div>
        </div>
      </div>
    </GlassWidget>
  );
}

SunriseSunset.propTypes = {
  sunrise: PropTypes.string,
  sunset: PropTypes.string,
  timezone: PropTypes.string,
  loading: PropTypes.bool,
};
