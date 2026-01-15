import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Wind } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/**
 * WindDetailModal - Detailed wind information view (Apple Weather style)
 */

// Convert degrees to cardinal direction
const getWindDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Direction arrow component for chart header
const DirectionArrow = ({ direction, size = 12 }) => {
  if (direction === null || direction === undefined) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${direction + 180}deg)` }}
      className="text-white/60"
    >
      <path
        d="M12 4 L12 20 M12 4 L8 8 M12 4 L16 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function WindDetailModal({
  isOpen,
  onClose,
  currentSpeed,
  currentDirection,
  currentGusts,
  observations = [],
  timezone = 'America/New_York',
  cityName,
}) {
  // Delay chart rendering to prevent Recharts dimension warnings
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay to ensure container has dimensions before rendering chart
      const timer = setTimeout(() => setChartReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setChartReady(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process observations for wind data
  const windData = useMemo(() => {
    if (!observations || observations.length === 0) return [];

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return observations
      .filter(obs => {
        const obsTime = obs.timestamp instanceof Date ? obs.timestamp : new Date(obs.timestamp);
        return obsTime >= twentyFourHoursAgo && obs.windSpeed !== null;
      })
      .map(obs => {
        const timestamp = obs.timestamp instanceof Date ? obs.timestamp : new Date(obs.timestamp);
        return {
          time: timestamp.getTime(),
          timestamp,
          speed: obs.windSpeed || 0,
          direction: obs.windDirection,
          hour: timestamp.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: true,
          }),
        };
      });
  }, [observations, timezone]);

  // Get yesterday's data for comparison
  const comparisonData = useMemo(() => {
    if (!observations || observations.length === 0) return { today: 0, yesterday: 0 };

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    let todayMax = 0;
    let yesterdayMax = 0;

    observations.forEach(obs => {
      const obsTime = obs.timestamp instanceof Date ? obs.timestamp : new Date(obs.timestamp);
      const speed = obs.windSpeed || 0;

      if (obsTime >= todayStart) {
        todayMax = Math.max(todayMax, speed);
      } else if (obsTime >= yesterdayStart && obsTime < yesterdayEnd) {
        yesterdayMax = Math.max(yesterdayMax, speed);
      }
    });

    return { today: Math.round(todayMax), yesterday: Math.round(yesterdayMax) };
  }, [observations]);

  // Calculate min/max for chart
  const { minSpeed, maxSpeed, avgSpeed } = useMemo(() => {
    if (windData.length === 0) return { minSpeed: 0, maxSpeed: 30, avgSpeed: 0 };
    const speeds = windData.map(d => d.speed);
    return {
      minSpeed: Math.min(...speeds),
      maxSpeed: Math.max(...speeds),
      avgSpeed: Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length),
    };
  }, [windData]);

  // Sample direction arrows for chart (every ~3 hours)
  const directionSamples = useMemo(() => {
    if (windData.length === 0) return [];
    const step = Math.max(1, Math.floor(windData.length / 8));
    return windData.filter((_, i) => i % step === 0).slice(0, 8);
  }, [windData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs glass-border-premium">
        <div className="text-white/60 mb-1">
          {data.timestamp?.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
        <div className="text-white font-medium">{Math.round(data.speed)} mph</div>
        {data.direction !== null && (
          <div className="text-white/60 mt-0.5 flex items-center gap-1">
            <DirectionArrow direction={data.direction} size={10} />
            {getWindDirection(data.direction)}
          </div>
        )}
      </div>
    );
  };

  const directionText = getWindDirection(currentDirection);
  const comparisonDiff = comparisonData.today - comparisonData.yesterday;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-white/70" />
                <h2 className="text-lg font-semibold text-white">Wind</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Current Wind */}
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-light text-white">{currentSpeed}</span>
                <span className="text-xl text-white/80">mph</span>
                <span className="text-xl text-white/60">{directionText}</span>
              </div>
              {currentGusts && (
                <div className="text-sm text-white/60 mt-1">
                  Gusts: {currentGusts} mph
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[60vh] glass-scroll">
            {/* Direction Arrows Row */}
            {directionSamples.length > 0 && (
              <div className="px-4 pt-3 flex justify-between">
                {directionSamples.map((sample, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <DirectionArrow direction={sample.direction} size={14} />
                  </div>
                ))}
              </div>
            )}

            {/* Wind Speed Chart */}
            <div className="px-4 py-3">
              <div className="h-[180px]">
                {!chartReady ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
                  </div>
                ) : windData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/40 text-sm">
                    No wind data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
                    <AreaChart data={windData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(ts) => {
                          const date = new Date(ts);
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
                        domain={[0, Math.ceil(maxSpeed / 5) * 5 + 5]}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="speed"
                        stroke="rgba(56, 189, 248, 0.8)"
                        strokeWidth={2}
                        fill="url(#windGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Daily Summary */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-2">Daily Summary</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Wind is currently {currentSpeed} mph from the {directionText.toLowerCase()}.
                {windData.length > 0 && (
                  <> Today, wind speeds are {minSpeed} to {maxSpeed} mph
                  {currentGusts && <>, with gusts up to {currentGusts} mph</>}.</>
                )}
              </p>
            </div>

            {/* Daily Comparison */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-2">Daily Comparison</h3>
              <p className="text-sm text-white/60 mb-3">
                {comparisonDiff === 0
                  ? 'Peak wind speed today is similar to yesterday.'
                  : comparisonDiff > 0
                  ? `Peak wind speed today is ${comparisonDiff} mph higher than yesterday.`
                  : `Peak wind speed today is ${Math.abs(comparisonDiff)} mph lower than yesterday.`}
              </p>

              {/* Comparison Bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60 w-16">Today</span>
                  <div className="flex-1 h-6 bg-white/10 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-sky-400/40 rounded-lg transition-all"
                      style={{
                        width: `${Math.min(100, (comparisonData.today / Math.max(comparisonData.today, comparisonData.yesterday, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-16 text-right">
                    {comparisonData.today} mph
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60 w-16">Yesterday</span>
                  <div className="flex-1 h-6 bg-white/10 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-white/20 rounded-lg transition-all"
                      style={{
                        width: `${Math.min(100, (comparisonData.yesterday / Math.max(comparisonData.today, comparisonData.yesterday, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white/60 w-16 text-right">
                    {comparisonData.yesterday} mph
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Observations Table */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Recent Observations</h3>
              {windData.length === 0 ? (
                <p className="text-sm text-white/40">No recent observations available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/50 text-xs">
                        <th className="text-left py-2 pr-3 font-medium">Time</th>
                        <th className="text-right py-2 px-3 font-medium">Speed</th>
                        <th className="text-right py-2 pl-3 font-medium">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {windData.slice(-12).reverse().map((obs, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-white/5' : ''}>
                          <td className="py-2 pr-3 text-white/70">
                            {obs.timestamp?.toLocaleTimeString('en-US', {
                              timeZone: timezone,
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right text-white font-medium">
                            {Math.round(obs.speed)} mph
                          </td>
                          <td className="py-2 pl-3 text-right text-white/70">
                            <span className="inline-flex items-center gap-1">
                              {obs.direction !== null && (
                                <DirectionArrow direction={obs.direction} size={10} />
                              )}
                              {getWindDirection(obs.direction)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* About Wind */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-2">About Wind Speed and Gusts</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                The wind speed is calculated using the average over a short period of time.
                Gusts are short bursts of wind above this average. A gust typically lasts under 20 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

WindDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentSpeed: PropTypes.number,
  currentDirection: PropTypes.number,
  currentGusts: PropTypes.number,
  observations: PropTypes.array,
  timezone: PropTypes.string,
  cityName: PropTypes.string,
};
