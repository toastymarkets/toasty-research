import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * ObservationDetailModal - Shows observation data in NWS-style horizontal table
 * Displays surrounding observations with the selected one highlighted
 */
export default function ObservationDetailModal({
  isOpen,
  onClose,
  observation,
  surroundingObservations = [],
  timezone = 'America/New_York',
  useMetric = false,
  onToggleUnits,
}) {
  if (!isOpen || !observation) return null;

  // Format time for table
  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for header
  const formatDate = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get wind direction label
  const getWindDirection = (degrees) => {
    if (degrees === null || degrees === undefined) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Format values based on unit system
  const formatTemp = (tempF) => {
    if (tempF == null) return '--';
    if (useMetric) {
      const tempC = (tempF - 32) * 5 / 9;
      return `${Math.round(tempC)}°`;
    }
    return `${Math.round(tempF)}°`;
  };

  const formatHumidity = (h) => h != null ? `${Math.round(h)}%` : '--';

  const formatWind = (obs) => {
    if (obs.windSpeed == null) return '--';
    const dir = getWindDirection(obs.windDirection);
    if (useMetric) {
      // Convert mph to km/h
      const kmh = obs.windSpeed * 1.60934;
      return `${dir} ${Math.round(kmh)}`;
    }
    return `${dir} ${Math.round(obs.windSpeed)}`;
  };

  const formatVisibility = (vis) => {
    if (vis == null) return '--';
    if (useMetric) {
      // Already in meters, convert to km
      return `${(vis / 1000).toFixed(1)}`;
    }
    // Convert meters to miles
    return `${(vis / 1609.34).toFixed(1)}`;
  };

  const formatPressure = (pa) => {
    if (pa == null) return '--';
    if (useMetric) {
      // Convert Pa to hPa (mbar)
      return `${Math.round(pa / 100)}`;
    }
    // Convert Pa to inHg
    return `${(pa / 3386.39).toFixed(2)}`;
  };

  // Table columns
  const columns = [
    { key: 'time', label: 'Time', width: 'w-16' },
    { key: 'temp', label: 'Temp', width: 'w-12' },
    { key: 'dewpoint', label: 'Dew', width: 'w-12' },
    { key: 'humidity', label: 'RH', width: 'w-12' },
    { key: 'wind', label: 'Wind', width: 'w-16' },
    { key: 'visibility', label: 'Vis', width: 'w-12' },
    { key: 'pressure', label: 'Press', width: 'w-14' },
  ];

  // Get cell value for observation
  const getCellValue = (obs, key) => {
    switch (key) {
      case 'time': return formatTime(obs.timestamp);
      case 'temp': return formatTemp(obs.temperature);
      case 'dewpoint': return formatTemp(obs.dewpoint);
      case 'humidity': return formatHumidity(obs.humidity);
      case 'wind': return formatWind(obs);
      case 'visibility': return formatVisibility(obs.visibility);
      case 'pressure': return formatPressure(obs.pressure);
      default: return '--';
    }
  };

  // Check if observation is the selected one
  const isSelected = (obs) => {
    return obs.time === observation.time ||
           (obs.timestamp && observation.timestamp &&
            new Date(obs.timestamp).getTime() === new Date(observation.timestamp).getTime());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="glass-elevated relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-white">
                Observation Details
              </div>
              <div className="text-sm text-white/60">
                {formatDate(observation.timestamp)} • {formatTime(observation.timestamp)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Unit toggle */}
              <button
                onClick={onToggleUnits}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium text-white/80"
              >
                {useMetric ? '°C' : '°F'}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Selected observation summary */}
          <div className="mt-3 flex items-center gap-4">
            <span className="text-4xl font-light text-white">
              {formatTemp(observation.temperature)}
            </span>
            <div className="text-sm text-white/70">
              {observation.description || 'No conditions reported'}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            {/* Table header */}
            <thead>
              <tr className="border-b border-white/10">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`${col.width} px-2 py-2 text-left font-medium text-white/50 uppercase tracking-wide`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {surroundingObservations.map((obs, idx) => {
                const selected = isSelected(obs);
                return (
                  <tr
                    key={obs.time || idx}
                    className={`
                      border-b border-white/5 transition-colors
                      ${selected
                        ? 'bg-white/20 font-medium'
                        : 'hover:bg-white/5'
                      }
                    `}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`
                          ${col.width} px-2 py-2.5
                          ${selected ? 'text-white' : 'text-white/70'}
                          ${col.key === 'time' ? 'font-medium' : ''}
                        `}
                      >
                        {getCellValue(obs, col.key)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with units */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/10">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/40">
            <span>Temp: {useMetric ? '°C' : '°F'}</span>
            <span>Wind: dir {useMetric ? 'km/h' : 'mph'}</span>
            <span>Vis: {useMetric ? 'km' : 'mi'}</span>
            <span>Press: {useMetric ? 'hPa' : 'inHg'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

ObservationDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  observation: PropTypes.shape({
    timestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    time: PropTypes.string,
    temperature: PropTypes.number,
    dewpoint: PropTypes.number,
    humidity: PropTypes.number,
    windSpeed: PropTypes.number,
    windDirection: PropTypes.number,
    windChill: PropTypes.number,
    visibility: PropTypes.number,
    pressure: PropTypes.number,
    description: PropTypes.string,
  }),
  surroundingObservations: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    time: PropTypes.string,
    temperature: PropTypes.number,
    dewpoint: PropTypes.number,
    humidity: PropTypes.number,
    windSpeed: PropTypes.number,
    windDirection: PropTypes.number,
    visibility: PropTypes.number,
    pressure: PropTypes.number,
    description: PropTypes.string,
  })),
  timezone: PropTypes.string,
  useMetric: PropTypes.bool,
  onToggleUnits: PropTypes.func,
};
