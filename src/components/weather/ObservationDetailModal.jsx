import PropTypes from 'prop-types';
import { X, Plus, Check, Table, BarChart3 } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { insertObservationToNotes } from '../../utils/noteInsertionEvents';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

/**
 * ObservationDetailModal - Shows observation data in NWS-style horizontal table
 * Displays surrounding observations with the selected one highlighted
 */
export default function ObservationDetailModal({
  isOpen,
  onClose,
  observation,
  surroundingObservations = [],
  allObservations = [],
  timezone = 'America/New_York',
  useMetric = false,
  onToggleUnits,
  cityName = '',
}) {
  // Track which observation was just added (for feedback)
  const [addedObservation, setAddedObservation] = useState(null);
  // Track active view: 'table' or 'chart'
  const [activeView, setActiveView] = useState('table');

  // Handle adding observation to notes
  const handleAddToNotes = useCallback((obs) => {
    insertObservationToNotes(obs, {
      cityName,
      timezone,
      useMetric,
    });

    // Show feedback
    setAddedObservation(obs.time || obs.timestamp);

    // Clear feedback after animation
    setTimeout(() => {
      setAddedObservation(null);
    }, 1500);
  }, [cityName, timezone, useMetric]);

  // Chart data transformation - must be before early return (React hooks rules)
  const chartData = useMemo(() => {
    if (!allObservations || allObservations.length === 0) return [];

    return allObservations.map(obs => {
      const timestamp = obs.timestamp instanceof Date ? obs.timestamp : new Date(obs.timestamp);
      return {
        time: timestamp.getTime(),
        timestamp,
        temperature: obs.temperature,
        dewpoint: obs.dewpoint,
        humidity: obs.humidity,
        timeLabel: timestamp.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        dateLabel: timestamp.toLocaleDateString('en-US', {
          timeZone: timezone,
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  }, [allObservations, timezone]);

  // Temperature range for Y axis
  const tempRange = useMemo(() => {
    if (chartData.length === 0) return { min: 30, max: 80 };
    const temps = chartData.map(d => d.temperature).filter(t => t != null);
    const dewpoints = chartData.map(d => d.dewpoint).filter(d => d != null);
    const allValues = [...temps, ...dewpoints];
    if (allValues.length === 0) return { min: 30, max: 80 };
    const min = Math.floor(Math.min(...allValues) / 5) * 5 - 5;
    const max = Math.ceil(Math.max(...allValues) / 5) * 5 + 5;
    return { min, max };
  }, [chartData]);

  // Find index of selected observation in chart data
  const selectedChartIndex = useMemo(() => {
    if (!observation || chartData.length === 0) return -1;
    const selectedTime = observation?.timestamp instanceof Date
      ? observation.timestamp.getTime()
      : observation?.timestamp ? new Date(observation.timestamp).getTime() : -1;
    return chartData.findIndex(d => d.time === selectedTime);
  }, [observation, chartData]);

  // Early return - after all hooks
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
    { key: 'add', label: '', width: 'w-10' },
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

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    // Convert temperature for display if using metric
    const displayTemp = (tempF) => {
      if (tempF == null) return '--';
      if (useMetric) {
        const tempC = (tempF - 32) * 5 / 9;
        return `${Math.round(tempC)}°C`;
      }
      return `${Math.round(tempF)}°F`;
    };

    return (
      <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs border border-white/10">
        <div className="text-white/60 mb-1">{data.timeLabel} • {data.dateLabel}</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
            <span className="text-white">Temp: {displayTemp(data.temperature)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#64D2FF]" />
            <span className="text-white">Dew: {displayTemp(data.dewpoint)}</span>
          </div>
          {data.humidity != null && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/40" />
              <span className="text-white">RH: {Math.round(data.humidity)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Full-screen backdrop - dims everything, sits behind sidebars */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container - constrained to main content area, above backdrop but below sidebars */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[344px] pointer-events-none">
        {/* Modal */}
        <div className="glass-elevated relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
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

          {/* View Toggle Tabs */}
          <div className="mt-3 flex bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setActiveView('table')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeView === 'table'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setActiveView('chart')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeView === 'chart'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Chart
            </button>
          </div>
        </div>

        {/* Table View */}
        {activeView === 'table' && (
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
                const obsKey = obs.time || obs.timestamp;
                const wasAdded = addedObservation === obsKey;

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
                    {columns.map(col => {
                      // Special handling for add button column
                      if (col.key === 'add') {
                        return (
                          <td key={col.key} className={`${col.width} px-1 py-2.5`}>
                            <button
                              onClick={() => handleAddToNotes(obs)}
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
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        );
                      }

                      return (
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
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {/* Chart View */}
        {activeView === 'chart' && (
          <div className="px-2 py-3">
            {chartData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGradientObs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF9F0A" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#FFD60A" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#30D158" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(time) => {
                        const date = new Date(time);
                        return date.toLocaleTimeString('en-US', {
                          timeZone: timezone,
                          hour: 'numeric',
                          hour12: true,
                        });
                      }}
                      interval="preserveStartEnd"
                      minTickGap={40}
                    />
                    <YAxis
                      yAxisId="temp"
                      domain={[tempRange.min, tempRange.max]}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (useMetric) {
                          const c = (v - 32) * 5 / 9;
                          return `${Math.round(c)}°`;
                        }
                        return `${v}°`;
                      }}
                      width={35}
                    />
                    <YAxis
                      yAxisId="humidity"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Temperature area fill */}
                    <Area
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke="none"
                      fill="url(#tempGradientObs)"
                    />

                    {/* Humidity line (subtle) */}
                    <Line
                      yAxisId="humidity"
                      type="monotone"
                      dataKey="humidity"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={1}
                      dot={false}
                    />

                    {/* Dew point line */}
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="dewpoint"
                      stroke="#64D2FF"
                      strokeWidth={1.5}
                      dot={false}
                    />

                    {/* Temperature line */}
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#FF9F0A"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#FF9F0A', stroke: '#fff', strokeWidth: 2 }}
                    />

                    {/* Selected observation marker */}
                    {selectedChartIndex >= 0 && chartData[selectedChartIndex] && (
                      <ReferenceDot
                        yAxisId="temp"
                        x={chartData[selectedChartIndex].time}
                        y={chartData[selectedChartIndex].temperature}
                        r={6}
                        fill="#FF9F0A"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/40 text-sm">
                No chart data available
              </div>
            )}

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#FF9F0A] rounded" />
                <span className="text-white/60">Temperature</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#64D2FF] rounded" />
                <span className="text-white/60">Dew Point</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-white/25 rounded" />
                <span className="text-white/60">Humidity</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer with units */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/10">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/40">
            <span>Temp: {useMetric ? '°C' : '°F'}</span>
            {activeView === 'table' && (
              <>
                <span>Wind: dir {useMetric ? 'km/h' : 'mph'}</span>
                <span>Vis: {useMetric ? 'km' : 'mi'}</span>
                <span>Press: {useMetric ? 'hPa' : 'inHg'}</span>
              </>
            )}
            {activeView === 'chart' && (
              <span>24h observation history</span>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
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
  allObservations: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    temperature: PropTypes.number,
    dewpoint: PropTypes.number,
    humidity: PropTypes.number,
  })),
  timezone: PropTypes.string,
  useMetric: PropTypes.bool,
  onToggleUnits: PropTypes.func,
  cityName: PropTypes.string,
};
