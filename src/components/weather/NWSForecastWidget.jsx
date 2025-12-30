import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Cloud, X, Sun, CloudRain, CloudSnow, Wind, ChevronRight, Plus, Check } from 'lucide-react';
import GlassWidget from './GlassWidget';
import { insertForecastToNotes } from '../../utils/noteInsertionEvents';

/**
 * NWSForecastWidget - Shows NWS forecast summary with clickable detail modal
 */
export default function NWSForecastWidget({
  citySlug,
  lat,
  lon,
  timezone = 'America/New_York',
  loading: externalLoading = false,
}) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch NWS forecast
  const fetchForecast = useCallback(async () => {
    if (!lat || !lon) return;

    const cacheKey = `nws_forecast_widget_v2_${citySlug}`;

    // Check cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 15 * 60 * 1000) {
          setForecast(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) { /* ignore */ }

    setLoading(true);

    try {
      // Get grid point
      const pointsRes = await fetch(
        `https://api.weather.gov/points/${lat},${lon}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!pointsRes.ok) throw new Error('Failed to get grid point');

      const pointsData = await pointsRes.json();
      const forecastUrl = pointsData.properties.forecast;
      const gridId = pointsData.properties.gridId; // NWS office (e.g., "LOX" for Los Angeles)
      const relativeLocation = pointsData.properties.relativeLocation?.properties;

      // Get forecast
      const forecastRes = await fetch(forecastUrl, {
        headers: { 'User-Agent': 'Toasty Research App' }
      });

      if (!forecastRes.ok) throw new Error('Failed to get forecast');

      const forecastData = await forecastRes.json();
      const periods = forecastData.properties.periods;

      // Transform periods
      const result = {
        periods: periods.map(p => ({
          name: p.name,
          temperature: p.temperature,
          temperatureUnit: p.temperatureUnit,
          shortForecast: p.shortForecast,
          detailedForecast: p.detailedForecast,
          isDaytime: p.isDaytime,
          icon: p.icon,
          windSpeed: p.windSpeed,
          windDirection: p.windDirection,
        })),
        updateTime: forecastData.properties.updateTime,
        gridId, // NWS office code
        city: relativeLocation?.city,
        state: relativeLocation?.state,
      };

      // Cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore */ }

      setForecast(result);
      setError(null);
    } catch (err) {
      console.error('[NWSForecastWidget] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug, lat, lon]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Get weather icon based on forecast text
  const getWeatherIcon = (text, isDaytime) => {
    if (!text) return Cloud;
    const t = text.toLowerCase();
    if (t.includes('rain') || t.includes('shower')) return CloudRain;
    if (t.includes('snow')) return CloudSnow;
    if (t.includes('wind')) return Wind;
    if (t.includes('sun') || t.includes('clear')) return isDaytime ? Sun : Cloud;
    return Cloud;
  };

  if (loading || externalLoading) {
    return (
      <GlassWidget title="FORECAST" icon={Cloud} size="small">
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="w-24 h-8 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (error || !forecast) {
    return (
      <GlassWidget title="FORECAST" icon={Cloud} size="small">
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          Unable to load forecast
        </div>
      </GlassWidget>
    );
  }

  const currentPeriod = forecast.periods[0];
  const nextPeriod = forecast.periods[1];
  const WeatherIcon = getWeatherIcon(currentPeriod?.shortForecast, currentPeriod?.isDaytime);

  return (
    <>
      <GlassWidget
        title="FORECAST"
        icon={Cloud}
        size="small"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between h-full">
          {/* Current period */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <WeatherIcon className="w-5 h-5 text-white/70" />
              <span className="text-2xl font-light text-white">
                {currentPeriod?.temperature}°
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1 line-clamp-1">
              {currentPeriod?.shortForecast}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              {currentPeriod?.name}
            </p>
          </div>

          {/* Tap indicator */}
          <ChevronRight className="w-4 h-4 text-white/30" />
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {isModalOpen && (
        <ForecastDetailModal
          forecast={forecast}
          timezone={timezone}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

NWSForecastWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  timezone: PropTypes.string,
  loading: PropTypes.bool,
};

/**
 * ForecastDetailModal - Shows detailed NWS forecast
 */
function ForecastDetailModal({ forecast, timezone, onClose }) {
  const [addedPeriod, setAddedPeriod] = useState(null);

  if (!forecast) return null;

  // Get weather icon
  const getWeatherIcon = (text, isDaytime) => {
    if (!text) return Cloud;
    const t = text.toLowerCase();
    if (t.includes('rain') || t.includes('shower')) return CloudRain;
    if (t.includes('snow')) return CloudSnow;
    if (t.includes('wind')) return Wind;
    if (t.includes('sun') || t.includes('clear')) return isDaytime ? Sun : Cloud;
    return Cloud;
  };

  // Get background color based on temperature
  const getTempBg = (temp, isDaytime) => {
    if (temp >= 90) return 'bg-orange-500/20';
    if (temp >= 80) return 'bg-yellow-500/20';
    if (temp >= 70) return 'bg-green-500/20';
    if (temp >= 60) return 'bg-cyan-500/20';
    if (temp >= 50) return 'bg-blue-500/20';
    if (temp >= 40) return 'bg-indigo-500/20';
    return 'bg-purple-500/20';
  };

  // Handle adding forecast to notes
  const handleAddToNotes = (period, idx) => {
    const locationLabel = forecast.city && forecast.state
      ? `${forecast.city}, ${forecast.state}`
      : forecast.gridId || 'Local Area';
    insertForecastToNotes(period, {
      source: 'NWS',
      gridId: forecast.gridId,
      location: locationLabel,
    });
    setAddedPeriod(idx);
    setTimeout(() => setAddedPeriod(null), 1500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">7-Day Forecast</h2>
              <p className="text-sm text-white/60">NWS Extended Forecast</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Forecast periods */}
          <div className="overflow-y-auto max-h-[60vh]">
            {forecast.periods.slice(0, 14).map((period, idx) => {
              const Icon = getWeatherIcon(period.shortForecast, period.isDaytime);
              const wasAdded = addedPeriod === idx;
              return (
                <div
                  key={idx}
                  className={`px-4 py-3 border-b border-white/5 ${getTempBg(period.temperature, period.isDaytime)}`}
                >
                  {/* Period header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-white/70" />
                      <span className="font-medium text-white">{period.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-light text-white">
                        {period.temperature}°{period.temperatureUnit}
                      </span>
                      <button
                        onClick={() => handleAddToNotes(period, idx)}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${wasAdded
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'hover:bg-white/10 text-white/40 hover:text-white/70'
                          }
                        `}
                        title="Add to notes"
                      >
                        {wasAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Short forecast */}
                  <p className="text-sm text-white/80 mb-1">{period.shortForecast}</p>

                  {/* Wind */}
                  {period.windSpeed && (
                    <p className="text-xs text-white/50">
                      Wind: {period.windDirection} {period.windSpeed}
                    </p>
                  )}

                  {/* Detailed forecast (collapsed by default, shown on tap) */}
                  <details className="mt-2">
                    <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                      More details
                    </summary>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">
                      {period.detailedForecast}
                    </p>
                  </details>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Data from National Weather Service
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

ForecastDetailModal.propTypes = {
  forecast: PropTypes.shape({
    periods: PropTypes.array.isRequired,
    updateTime: PropTypes.string,
  }),
  timezone: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
