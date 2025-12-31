/**
 * User-friendly error messages for API failures
 * These replace technical HTTP error codes with helpful text
 */

export const ERROR_MESSAGES = {
  // Weather service errors
  WEATHER_UNAVAILABLE: 'Weather data temporarily unavailable',
  WEATHER_TIMEOUT: 'Weather service is slow to respond',
  WEATHER_RATE_LIMIT: 'Too many requests - please wait a moment',

  // Market data errors
  MARKET_UNAVAILABLE: 'Market data temporarily unavailable',
  MARKET_CLOSED: 'Markets are currently closed',
  MARKET_NO_DATA: 'No market data available for this city',

  // Observation errors
  OBSERVATIONS_UNAVAILABLE: 'Station observations unavailable',
  STATION_OFFLINE: 'Weather station is offline',

  // Forecast errors
  FORECAST_UNAVAILABLE: 'Forecast data temporarily unavailable',

  // Generic errors
  NETWORK_ERROR: 'Network connection issue - check your internet',
  SERVER_ERROR: 'Server error - please try again later',
  UNKNOWN_ERROR: 'Something went wrong',
};

/**
 * Convert HTTP status codes to user-friendly messages
 */
export function getErrorMessage(error, context = 'generic') {
  const status = error?.response?.status || error?.status;
  const message = error?.message || '';

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('Timeout')) {
    return context === 'weather' ? ERROR_MESSAGES.WEATHER_TIMEOUT : ERROR_MESSAGES.SERVER_ERROR;
  }

  // HTTP status code mapping
  switch (status) {
    case 429:
      return ERROR_MESSAGES.WEATHER_RATE_LIMIT;
    case 503:
    case 502:
    case 504:
      return context === 'weather' ? ERROR_MESSAGES.WEATHER_UNAVAILABLE : ERROR_MESSAGES.SERVER_ERROR;
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR;
    case 404:
      return context === 'weather' ? ERROR_MESSAGES.STATION_OFFLINE : ERROR_MESSAGES.UNKNOWN_ERROR;
    default:
      break;
  }

  // Context-specific defaults
  switch (context) {
    case 'weather':
      return ERROR_MESSAGES.WEATHER_UNAVAILABLE;
    case 'market':
      return ERROR_MESSAGES.MARKET_UNAVAILABLE;
    case 'observations':
      return ERROR_MESSAGES.OBSERVATIONS_UNAVAILABLE;
    case 'forecast':
      return ERROR_MESSAGES.FORECAST_UNAVAILABLE;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}
