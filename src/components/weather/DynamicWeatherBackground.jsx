/**
 * DynamicWeatherBackground - Shared weather background components
 * Used by both sidebar city cards and city dashboard pages
 */

// Check if it's daytime in a timezone (between 6am and 8pm)
export const isDaytime = (timezone) => {
  try {
    const hour = parseInt(new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }));
    return hour >= 6 && hour < 20;
  } catch {
    return true; // Default to daytime if timezone is invalid
  }
};

// Get weather background gradient based on condition and time
export const getWeatherBackground = (condition, timezone) => {
  const isDay = isDaytime(timezone);
  const cond = (condition || '').toLowerCase();

  // Snow conditions
  if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) {
    return isDay
      ? 'linear-gradient(135deg, #8BA4B4 0%, #5A7A8A 50%, #4A6A7A 100%)'
      : 'linear-gradient(135deg, #3A4A5A 0%, #2A3A4A 50%, #1A2A3A 100%)';
  }

  // Rain conditions
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
    return isDay
      ? 'linear-gradient(135deg, #5A6A7A 0%, #4A5A6A 50%, #3A4A5A 100%)'
      : 'linear-gradient(135deg, #2A3A4A 0%, #1A2A3A 50%, #0A1A2A 100%)';
  }

  // Fog/Mist conditions
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return isDay
      ? 'linear-gradient(135deg, #9AABBF 0%, #7A8B9F 50%, #6A7B8F 100%)'
      : 'linear-gradient(135deg, #4A5A6A 0%, #3A4A5A 50%, #2A3A4A 100%)';
  }

  // Cloudy conditions
  if (cond.includes('cloud') || cond.includes('overcast')) {
    return isDay
      ? 'linear-gradient(135deg, #6A8AAA 0%, #5A7A9A 50%, #4A6A8A 100%)'
      : 'linear-gradient(135deg, #3A4A5A 0%, #2A3A4A 50%, #1A2A3A 100%)';
  }

  // Partly cloudy
  if (cond.includes('partly')) {
    return isDay
      ? 'linear-gradient(135deg, #5A9AD9 0%, #4A8AC9 50%, #3A7AB9 100%)'
      : 'linear-gradient(135deg, #2A3A5A 0%, #1A2A4A 50%, #0A1A3A 100%)';
  }

  // Thunder/Storm
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) {
    return 'linear-gradient(135deg, #3A4050 0%, #2A3040 50%, #1A2030 100%)';
  }

  // Clear/Sunny (default)
  return isDay
    ? 'linear-gradient(135deg, #4A9EEA 0%, #3A8EDA 50%, #2A7ECA 100%)'
    : 'linear-gradient(135deg, #1A2A4A 0%, #0A1A3A 50%, #050F2A 100%)';
};

// Seeded random for consistent positions per index
const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Weather visual overlay component
export function WeatherOverlay({ condition, isDay, fullscreen = false }) {
  const cond = (condition || '').toLowerCase();

  // Adjust particle counts for fullscreen
  const scale = fullscreen ? 2.5 : 1;

  // Snow
  if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) {
    const count = Math.round(12 * scale);
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(count)].map((_, i) => {
          // Use seeded random for consistent but varied positions
          const startTop = seededRandom(i + 1) * 100;
          const duration = 2 + seededRandom(i + 100) * 1.5;
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/60 rounded-full animate-snow"
              style={{
                left: `${(i * (100 / count)) + seededRandom(i) * 5}%`,
                top: `${startTop}%`,
                animationDelay: `-${seededRandom(i + 50) * duration}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // Rain
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
    const count = Math.round(10 * scale);
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(count)].map((_, i) => {
          const startTop = seededRandom(i + 1) * 100;
          const duration = 0.6 + seededRandom(i + 100) * 0.3;
          return (
            <div
              key={i}
              className="absolute w-0.5 h-3 bg-white/30 rounded-full animate-rain"
              style={{
                left: `${(i * (100 / count)) + seededRandom(i) * 5}%`,
                top: `${startTop}%`,
                animationDelay: `-${seededRandom(i + 50) * duration}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // Fog/Mist
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(fullscreen ? 5 : 3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-2 bg-white/20 rounded-full animate-fog"
            style={{
              top: `${20 + i * 18}%`,
              width: '120%',
              left: '-10%',
              animationDelay: `-${i * 2}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Cloudy
  if (cond.includes('cloud') || cond.includes('overcast') || cond.includes('partly')) {
    const cloudCount = cond.includes('partly') ? (fullscreen ? 4 : 2) : (fullscreen ? 6 : 3);
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(cloudCount)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-cloud-drift"
            style={{
              top: `${10 + (i * 15) % 60}%`,
              left: `${seededRandom(i + 10) * 80}%`,
              animationDelay: `-${seededRandom(i) * 20}s`,
              animationDuration: `${20 + i * 5}s`,
              opacity: fullscreen ? 0.3 : 0.25,
            }}
          >
            <svg
              className={`${fullscreen ? 'w-24 h-16' : 'w-12 h-8'} text-white`}
              viewBox="0 0 64 40"
              fill="currentColor"
            >
              <ellipse cx="20" cy="28" rx="16" ry="10" />
              <ellipse cx="40" cy="28" rx="18" ry="12" />
              <ellipse cx="30" cy="18" rx="14" ry="10" />
            </svg>
          </div>
        ))}
      </div>
    );
  }

  // Thunder/Storm
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) {
    const count = Math.round(8 * scale);
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Rain */}
        {[...Array(count)].map((_, i) => {
          const startTop = seededRandom(i + 1) * 100;
          const duration = 0.5 + seededRandom(i + 100) * 0.2;
          return (
            <div
              key={`rain-${i}`}
              className="absolute w-0.5 h-3 bg-white/20 rounded-full animate-rain"
              style={{
                left: `${(i * (100 / count)) + seededRandom(i) * 5}%`,
                top: `${startTop}%`,
                animationDelay: `-${seededRandom(i + 50) * duration}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
        {/* Lightning flash */}
        <div className="absolute inset-0 bg-white/10 animate-lightning" />
      </div>
    );
  }

  // Clear/Sunny - show sun or stars
  if (isDay) {
    return (
      <div className={`absolute ${fullscreen ? 'top-20 right-20' : 'top-2 right-10'} pointer-events-none`}>
        <div className={`${fullscreen ? 'w-16 h-16' : 'w-8 h-8'} rounded-full bg-yellow-300/30 animate-pulse-slow`} />
        <div className={`absolute ${fullscreen ? 'inset-2' : 'inset-1'} rounded-full bg-yellow-200/20`} />
      </div>
    );
  } else {
    // Night - stars
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(fullscreen ? 15 : 6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle"
            style={{
              top: `${10 + (i * 17) % 70}%`,
              left: `${20 + (i * 23) % 70}%`,
              animationDelay: `-${seededRandom(i) * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }
}

/**
 * Full-page weather background component for dashboard
 */
export function DashboardWeatherBackground({ condition, timezone }) {
  const isDay = isDaytime(timezone);
  const background = getWeatherBackground(condition, timezone);

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-1000"
      style={{ background }}
    >
      <WeatherOverlay condition={condition} isDay={isDay} fullscreen={true} />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Gradient overlay for better content readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  );
}
