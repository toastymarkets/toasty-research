import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Clock, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from 'lucide-react';
import GlassWidget from './GlassWidget';
import ObservationDetailModal from './ObservationDetailModal';

// Shared unit preference key (same as modal)
const UNIT_STORAGE_KEY = 'obs_units_metric';

/**
 * HourlyForecast - Shows real NWS observation data with clickable individual observations
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

// Format time for display - show true timestamp with minutes
const formatTime = (date, timezone) => {
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  // Compact format: "8:45 PM" -> "8:45p"
  return timeStr.replace(' AM', 'a').replace(' PM', 'p');
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
  stationId,
  lastUpdated,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Unit preference - synced with modal via localStorage
  const [useMetric, setUseMetric] = useState(() => {
    const saved = localStorage.getItem(UNIT_STORAGE_KEY);
    return saved === 'true';
  });

  // Save and sync preference
  const toggleUnits = () => {
    const newValue = !useMetric;
    setUseMetric(newValue);
    localStorage.setItem(UNIT_STORAGE_KEY, newValue.toString());
  };

  // Listen for changes from modal
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === UNIT_STORAGE_KEY) {
        setUseMetric(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Format temperature based on unit preference
  const formatDisplayTemp = (tempF) => {
    if (tempF == null) return '--';
    if (useMetric) {
      const tempC = (tempF - 32) * 5 / 9;
      return Math.round(tempC);
    }
    return Math.round(tempF);
  };

  // Ensure all observations have proper Date objects
  const normalizedObservations = useMemo(() => {
    if (!observations || observations.length === 0) return [];

    return observations.map(obs => ({
      ...obs,
      // Ensure timestamp is a Date object
      timestamp: obs.timestamp instanceof Date ? obs.timestamp : new Date(obs.timestamp),
    }));
  }, [observations]);

  // Get last 24 hours of observations for chart (oldest first for proper chart display)
  const allObservations24h = useMemo(() => {
    if (normalizedObservations.length === 0) return [];

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return normalizedObservations
      .filter(obs => obs.timestamp >= twentyFourHoursAgo);
    // Keep oldest first for chart X-axis
  }, [normalizedObservations]);

  // Get last 24 hours of observations for display (most recent first for the scroll)
  // Show ALL observations with true 5-minute timestamps - no sampling
  const displayData = useMemo(() => {
    if (allObservations24h.length === 0) return [];

    // Reverse for display (most recent first)
    const reversed = [...allObservations24h].reverse();

    // Return all observations (limit to 72 for performance - 6 hours of 5-min data)
    return reversed.slice(0, 72);
  }, [allObservations24h]);

  // Format last updated time
  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return null;
    const date = lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated);
    const now = new Date();
    const diffMinutes = Math.round((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, [lastUpdated]);

  // Get surrounding observations for the modal (5 before, selected, 5 after)
  const getSurroundingObservations = useMemo(() => {
    if (selectedIndex === null || displayData.length === 0) return [];

    // Get 5 observations before and 5 after the selected one
    const start = Math.max(0, selectedIndex - 5);
    const end = Math.min(displayData.length, selectedIndex + 6);

    return displayData.slice(start, end);
  }, [selectedIndex, displayData]);

  const selectedObservation = selectedIndex !== null ? displayData[selectedIndex] : null;

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
      >
        <div className="flex gap-0 overflow-x-auto glass-scroll pb-1 -mx-1 px-1">
          {displayData.map((obs, index) => {
            const isMostRecent = index === 0;
            const Icon = getConditionIcon(obs.description, isDaytime(obs.timestamp, timezone));

            return (
              <button
                key={obs.time}
                onClick={() => setSelectedIndex(index)}
                className={`
                  flex flex-col items-center min-w-[48px] py-1 px-0.5 rounded-xl
                  transition-all hover:bg-white/10 active:scale-95
                  ${isMostRecent ? 'bg-white/10' : ''}
                `}
              >
                {/* Time - show true timestamp */}
                <span className={`text-[10px] ${isMostRecent ? 'font-semibold text-white' : 'text-white/60'}`}>
                  {formatTime(obs.timestamp, timezone)}
                </span>

                {/* Condition icon */}
                <div className="my-1">
                  <Icon className="w-5 h-5 text-white/90" />
                </div>

                {/* Temperature */}
                <span className={`text-[13px] font-medium ${isMostRecent ? 'text-white' : 'text-white/60'}`}>
                  {formatDisplayTemp(obs.temperature)}°
                </span>
              </button>
            );
          })}
        </div>

        {/* Station info, unit toggle, and tap hint */}
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px] text-glass-text-muted">
            {stationId ? `Station: ${stationId}` : ''}
            {lastUpdatedText ? ` • ${lastUpdatedText}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleUnits();
              }}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-[10px] font-medium text-white/70"
            >
              {useMetric ? '°C' : '°F'}
            </button>
            <span className="text-[10px] text-glass-text-muted">Tap for details</span>
          </div>
        </div>
      </GlassWidget>

      {/* Observation Detail Modal */}
      <ObservationDetailModal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        observation={selectedObservation}
        surroundingObservations={getSurroundingObservations}
        allObservations={allObservations24h}
        timezone={timezone}
        useMetric={useMetric}
        onToggleUnits={toggleUnits}
        cityName={cityName}
      />
    </>
  );
}

HourlyForecast.propTypes = {
  observations: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
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
  stationId: PropTypes.string,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
};
