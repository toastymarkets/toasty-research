/**
 * Centralized cache and timing constants
 * All time values are in milliseconds
 */

// Time unit helpers
export const SECONDS = 1000;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;

// Cache durations for different data types
export const CACHE_DURATIONS = {
  // High-frequency updates (real-time data)
  WEATHER_CURRENT: 5 * MINUTES,      // Current conditions
  OBSERVATIONS: 5 * MINUTES,         // Station observations
  ALERTS: 5 * MINUTES,               // Weather alerts

  // Medium-frequency updates (forecasts)
  FORECAST_HOURLY: 15 * MINUTES,     // NWS hourly forecast
  FORECAST_MODELS: 15 * MINUTES,     // Multi-model forecasts
  FORECAST_DAILY: 15 * MINUTES,      // NWS daily forecast

  // Low-frequency updates (static/semi-static)
  DISCUSSION: 30 * MINUTES,          // NWS forecast discussion
  RADAR_FRAMES: 10 * MINUTES,        // Radar imagery

  // Long-term
  SESSION_STORAGE: 24 * HOURS,       // Session-based data
};

// Refresh intervals for auto-updating components
export const REFRESH_INTERVALS = {
  WEATHER: 5 * MINUTES,
  OBSERVATIONS: 5 * MINUTES,
  RADAR: 10 * MINUTES,
  ALERTS: 5 * MINUTES,
  DISCUSSION: 30 * MINUTES,
};

// Time windows for data filtering
export const TIME_WINDOWS = {
  ONE_HOUR: 1 * HOURS,
  SIX_HOURS: 6 * HOURS,
  TWENTY_FOUR_HOURS: 24 * HOURS,
  ONE_WEEK: 7 * 24 * HOURS,
};
