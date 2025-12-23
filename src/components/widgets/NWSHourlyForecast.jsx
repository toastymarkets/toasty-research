import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Thermometer, TrendingUp, TrendingDown } from 'lucide-react';
import { useNWSHourlyForecast } from '../../hooks/useNWSHourlyForecast';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a] px-3 py-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{data.timeLabel}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{data.temperature}°F</p>
      {data.shortForecast && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[150px]">{data.shortForecast}</p>
      )}
    </div>
  );
};

const PeakDot = ({ cx, cy, payload, peakHour }) => {
  if (!cx || !cy || payload?.hour !== peakHour) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="rgb(249, 115, 22)" opacity={0.3} />
      <circle cx={cx} cy={cy} r={4} fill="rgb(249, 115, 22)" stroke="white" strokeWidth={2} />
    </g>
  );
};

export default function NWSHourlyForecast({ citySlug, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState('today');
  const { forecast, loading, error, refetch, updateTime } = useNWSHourlyForecast(citySlug);

  const formatUpdateTime = (date) => date?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) || '';

  const chartData = useMemo(() => {
    if (!forecast?.periods) return [];
    let filteredPeriods;
    switch (viewMode) {
      case 'today': filteredPeriods = forecast.periods.filter(p => p.isToday); break;
      case 'tomorrow': filteredPeriods = forecast.periods.filter(p => p.isTomorrow); break;
      case '48h': filteredPeriods = forecast.periods.slice(0, 48); break;
      default: filteredPeriods = forecast.periods.filter(p => p.isToday);
    }

    return filteredPeriods.map((period, index) => {
      const time = new Date(period.time);
      let timeLabel;
      if (viewMode === '48h') {
        const dayStr = period.isToday ? 'Today' : period.isTomorrow ? 'Tomorrow' : time.toLocaleDateString('en-US', { weekday: 'short' });
        timeLabel = `${dayStr} ${time.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: forecast.timezone })}`;
      } else {
        timeLabel = time.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: forecast.timezone });
      }
      return {
        ...period,
        timeLabel,
        displayHour: viewMode === '48h' ? index : time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: forecast.timezone }),
      };
    });
  }, [forecast, viewMode]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return [40, 90];
    const temps = chartData.map(d => d.temperature);
    return [Math.floor(Math.min(...temps) - 5), Math.ceil(Math.max(...temps) + 5)];
  }, [chartData]);

  const viewStats = useMemo(() => {
    if (!chartData.length) return null;
    const temps = chartData.map(d => d.temperature);
    const high = Math.max(...temps);
    const low = Math.min(...temps);
    const highPeriod = chartData.find(d => d.temperature === high);
    const lowPeriod = chartData.find(d => d.temperature === low);
    return { high, low, highTime: highPeriod?.timeLabel || '', lowTime: lowPeriod?.timeLabel || '', peakHour: highPeriod?.hour };
  }, [chartData]);

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <span className="text-sm">Failed to load NWS forecast</span>
        </div>
        <button onClick={refetch} className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline">Try again</button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
          <Thermometer size={18} className="text-blue-500 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-white">NWS Hourly Forecast</span>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        <div className="flex items-center gap-2">
          {updateTime && <span className="text-xs text-gray-500">{formatUpdateTime(updateTime)}</span>}
          <button onClick={refetch} className={`p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded ${loading ? 'animate-spin' : ''}`} disabled={loading}>
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {loading && !forecast ? (
            <div className="py-8 flex items-center justify-center">
              <RefreshCw size={16} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400 ml-2">Loading forecast...</span>
            </div>
          ) : forecast ? (
            <>
              <div className="flex gap-1 mb-4">
                {[{ id: 'today', label: 'Today' }, { id: 'tomorrow', label: 'Tomorrow' }, { id: '48h', label: 'Next 48h' }].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === mode.id
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] border border-transparent'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {chartData.length > 0 ? (
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" vertical={false} />
                      <XAxis dataKey="displayHour" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-gray-500 dark:text-gray-400" interval={viewMode === '48h' ? 5 : 'preserveStartEnd'} />
                      <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-gray-500 dark:text-gray-400" tickFormatter={v => `${v}°`} width={35} />
                      <Tooltip content={<CustomTooltip />} />
                      {viewStats && <ReferenceLine y={viewStats.high} stroke="rgb(239, 68, 68)" strokeDasharray="4 4" strokeOpacity={0.5} />}
                      {viewStats && <ReferenceLine y={viewStats.low} stroke="rgb(59, 130, 246)" strokeDasharray="4 4" strokeOpacity={0.5} />}
                      <Line type="monotone" dataKey="temperature" stroke="rgb(59, 130, 246)" strokeWidth={2} dot={props => <PeakDot {...props} peakHour={viewStats?.peakHour} />} activeDot={{ r: 5, fill: 'rgb(59, 130, 246)', stroke: 'white', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">No forecast data available</div>
              )}

              {viewStats && chartData.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-red-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">High: <span className="font-semibold text-gray-900 dark:text-white">{viewStats.high}°F</span></span>
                      <span className="text-xs text-gray-500">{viewStats.highTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={14} className="text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Low: <span className="font-semibold text-gray-900 dark:text-white">{viewStats.low}°F</span></span>
                      <span className="text-xs text-gray-500">{viewStats.lowTime}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400 text-right">Source: National Weather Service</div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
