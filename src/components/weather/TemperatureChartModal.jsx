import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Sun,
  CloudRain,
  Droplets,
  Sunrise,
  Sunset,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceDot,
} from 'recharts';

/**
 * TemperatureChartModal - Apple Weather inspired floating conditions popup
 */
export default function TemperatureChartModal({
  isOpen,
  onClose,
  observations = [],
  cityName,
  currentTemp,
  timezone = 'America/New_York',
}) {
  const [activeTab, setActiveTab] = useState('actual');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 = today

  // Generate week dates for calendar header
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    // Start from 3 days ago
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: date.getDate(),
        offset: i,
        isToday: i === 0,
        date,
      });
    }
    return dates;
  }, []);

  // Get selected date info
  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + selectedDayOffset);
    return {
      full: date.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      date,
    };
  }, [selectedDayOffset, timezone]);

  // Filter observations for selected day
  const dayObservations = useMemo(() => {
    if (!observations || observations.length === 0) return [];

    const selectedDateStr = selectedDate.date.toLocaleDateString('en-CA');

    return observations.filter(obs => {
      const obsDateStr = obs.timestamp.toLocaleDateString('en-CA');
      return obsDateStr === selectedDateStr;
    });
  }, [observations, selectedDate]);

  // Format data for chart
  const chartData = useMemo(() => {
    const data = dayObservations.map(obs => ({
      time: obs.timestamp,
      temperature: obs.temperature,
      dewpoint: obs.dewpoint,
      humidity: obs.humidity,
      hour: obs.timestamp.getHours(),
      timeLabel: obs.timestamp.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: true,
      }),
      description: obs.description,
    }));

    return data;
  }, [dayObservations, timezone]);

  // Get high/low for the day
  const stats = useMemo(() => {
    if (chartData.length === 0) return { high: null, low: null, highHour: 0, lowHour: 0 };
    const temps = chartData.map(d => d.temperature).filter(t => t != null);
    const highTemp = Math.max(...temps);
    const lowTemp = Math.min(...temps);
    const highPoint = chartData.find(d => d.temperature === highTemp);
    const lowPoint = chartData.find(d => d.temperature === lowTemp);

    return {
      high: Math.round(highTemp),
      low: Math.round(lowTemp),
      highHour: highPoint?.hour || 12,
      lowHour: lowPoint?.hour || 6,
    };
  }, [chartData]);

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

  // Sample points for weather icons (every 6 hours)
  const iconPoints = useMemo(() => {
    if (chartData.length === 0) return [];
    const hours = [0, 6, 12, 18];
    return hours.map(h => {
      const point = chartData.find(d => d.hour === h) || chartData[0];
      return { hour: h, description: point?.description };
    });
  }, [chartData]);

  // Get weather icon
  const getWeatherIcon = (description) => {
    if (!description) return Sun;
    const text = description.toLowerCase();
    if (text.includes('rain') || text.includes('shower')) return CloudRain;
    if (text.includes('cloud') || text.includes('overcast')) return Cloud;
    return Sun;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-black/80 px-2 py-1 rounded-lg text-xs">
        <div className="text-white/60">{data.timeLabel}</div>
        <div className="text-white font-medium">{Math.round(data.temperature)}°F</div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Light backdrop - NOT heavy blur */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Floating Card Modal */}
      <div className="glass-elevated relative w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-white/60" />
              <span className="text-sm font-medium text-white">Conditions</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Week calendar */}
          <div className="flex justify-between mb-2">
            {weekDates.map((d) => (
              <button
                key={d.offset}
                onClick={() => setSelectedDayOffset(d.offset)}
                className="flex flex-col items-center"
              >
                <span className="text-[10px] text-white/50 mb-1">{d.dayOfWeek}</span>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    selectedDayOffset === d.offset
                      ? 'bg-blue-500 text-white'
                      : d.isToday
                      ? 'text-blue-400'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  {d.dayNum}
                </span>
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedDayOffset(prev => prev - 1)}
              className="p-1 rounded hover:bg-white/10"
              disabled={selectedDayOffset <= -3}
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-xs text-white/70">{selectedDate.full}</span>
            <button
              onClick={() => setSelectedDayOffset(prev => prev + 1)}
              className="p-1 rounded hover:bg-white/10"
              disabled={selectedDayOffset >= 0}
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Current temperature display */}
          <div className="flex items-start gap-2 mb-2">
            <span className="text-4xl font-light text-white">
              {selectedDayOffset === 0 && currentTemp != null
                ? Math.round(currentTemp)
                : stats.high || '--'}°
            </span>
            <Cloud className="w-6 h-6 text-white/60 mt-1" />
          </div>
          <div className="text-xs text-white/50 mb-3">
            H:{stats.high || '--'}° L:{stats.low || '--'}°
          </div>
        </div>

        {/* Weather icons row */}
        <div className="px-4 flex justify-between mb-1">
          {iconPoints.map((point, i) => {
            const Icon = getWeatherIcon(point.description);
            return (
              <div key={i} className="flex flex-col items-center">
                <Icon className="w-4 h-4 text-white/50" />
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="px-2 h-[140px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradientModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9F0A" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#FFD60A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#30D158" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 6, 12, 18]}
                  tickFormatter={(h) => {
                    if (h === 0) return '12AM';
                    if (h === 6) return '6AM';
                    if (h === 12) return '12PM';
                    if (h === 18) return '6PM';
                    return '';
                  }}
                />
                <YAxis
                  domain={[tempRange.min, tempRange.max]}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°`}
                  ticks={[tempRange.min, Math.round((tempRange.min + tempRange.max) / 2), tempRange.max]}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="none"
                  fill="url(#tempGradientModal)"
                />

                {/* Dewpoint line (if active) */}
                {activeTab === 'dewpoint' && (
                  <Line
                    type="monotone"
                    dataKey="dewpoint"
                    stroke="#64D2FF"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}

                {/* Temperature line */}
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#FF9F0A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#FF9F0A' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-sm">
              No data for this day
            </div>
          )}
        </div>

        {/* Tab toggle */}
        <div className="px-4 py-3">
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('actual')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'actual'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Actual
            </button>
            <button
              onClick={() => setActiveTab('dewpoint')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'dewpoint'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Dew Point
            </button>
          </div>
          <p className="text-[10px] text-white/40 mt-2 text-center">
            {activeTab === 'actual' ? 'The actual temperature.' : 'The dew point temperature.'}
          </p>
        </div>

        {/* Scrollable additional sections */}
        <div className="max-h-[200px] overflow-y-auto glass-scroll">
          {/* Humidity section */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-white/50" />
              <span className="text-xs font-medium text-white/70">Humidity</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-white">
                {chartData.length > 0 && chartData[chartData.length - 1]?.humidity != null
                  ? chartData[chartData.length - 1].humidity
                  : '--'}
              </span>
              <span className="text-sm text-white/50">%</span>
            </div>
            {chartData.length > 0 && (
              <p className="text-[10px] text-white/40 mt-1">
                Range: {Math.min(...chartData.map(d => d.humidity).filter(h => h != null))}% - {Math.max(...chartData.map(d => d.humidity).filter(h => h != null))}%
              </p>
            )}
          </div>

          {/* Sunrise/Sunset section */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sunrise className="w-4 h-4 text-yellow-400/70" />
                  <span className="text-xs text-white/50">Sunrise</span>
                </div>
                <span className="text-sm font-medium text-white">6:45 AM</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sunset className="w-4 h-4 text-orange-400/70" />
                  <span className="text-xs text-white/50">Sunset</span>
                </div>
                <span className="text-sm font-medium text-white">5:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TemperatureChartModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  observations: PropTypes.array,
  cityName: PropTypes.string,
  currentTemp: PropTypes.number,
  timezone: PropTypes.string,
};
