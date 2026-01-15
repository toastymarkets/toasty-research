import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, CloudRain, Snowflake, Droplets } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * PrecipitationDetailModal - Monthly precipitation detail view
 */
export default function PrecipitationDetailModal({
  isOpen,
  onClose,
  dailyData = [],
  totals = { precipitation: 0, snowfall: 0 },
  monthName,
  year,
  stationName,
}) {
  if (!isOpen) return null;

  // Prepare chart data with cumulative totals
  const chartData = useMemo(() => {
    return dailyData.map((day) => ({
      day: day.day,
      date: day.date,
      rain: day.precip,
      snow: day.snow,
      cumulativeRain: day.runningPrecip,
      cumulativeSnow: day.runningSnow,
    }));
  }, [dailyData]);

  // Determine if we have rain/snow data
  const hasRain = totals.precipitation > 0;
  const hasSnow = totals.snowfall > 0;

  // Calculate max for Y axis
  const maxDaily = useMemo(() => {
    if (dailyData.length === 0) return 1;
    const maxRain = Math.max(...dailyData.map((d) => d.precip || 0));
    const maxSnow = Math.max(...dailyData.map((d) => d.snow || 0));
    return Math.max(maxRain, maxSnow, 0.5);
  }, [dailyData]);

  const maxCumulative = useMemo(() => {
    if (dailyData.length === 0) return 1;
    const maxRain = Math.max(...dailyData.map((d) => d.runningPrecip || 0));
    const maxSnow = Math.max(...dailyData.map((d) => d.runningSnow || 0));
    return Math.max(maxRain, maxSnow, 1);
  }, [dailyData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs glass-border-premium">
        <div className="text-white/60 mb-1">
          {monthName} {data.day}, {year}
        </div>
        {data.rain > 0 && (
          <div className="text-blue-400 flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            Rain: {data.rain.toFixed(2)}"
          </div>
        )}
        {data.snow > 0 && (
          <div className="text-sky-300 flex items-center gap-1">
            <Snowflake className="w-3 h-3" />
            Snow: {data.snow.toFixed(1)}"
          </div>
        )}
        {data.rain === 0 && data.snow === 0 && (
          <div className="text-white/40">No precipitation</div>
        )}
      </div>
    );
  };

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
                <CloudRain className="w-5 h-5 text-white/70" />
                <h2 className="text-lg font-semibold text-white">Precipitation</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-sm text-white/60 mt-1">
              {monthName} {year} {stationName && `• ${stationName}`}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[70vh] glass-scroll">
            {/* Summary Cards */}
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              {/* Rain Card */}
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Rain</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {totals.precipitation.toFixed(2)}"
                </div>
                <div className="text-xs text-white/50">Month to date</div>
              </div>

              {/* Snow Card */}
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-sky-300 mb-1">
                  <Snowflake className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Snow</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {totals.snowfall.toFixed(1)}"
                </div>
                <div className="text-xs text-white/50">Month to date</div>
              </div>
            </div>

            {/* Chart */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Daily Accumulation</h3>
              <div className="h-[200px]">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/40 text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rainBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
                        </linearGradient>
                        <linearGradient id="snowBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(125, 211, 252, 0.8)" />
                          <stop offset="100%" stopColor="rgba(125, 211, 252, 0.3)" />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={20}
                      />
                      <YAxis
                        yAxisId="daily"
                        orientation="left"
                        domain={[0, Math.ceil(maxDaily * 10) / 10 + 0.1]}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                        tickFormatter={(v) => `${v}"`}
                      />
                      <YAxis
                        yAxisId="cumulative"
                        orientation="right"
                        domain={[0, Math.ceil(maxCumulative) + 1]}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                        tickFormatter={(v) => `${v}"`}
                        hide
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {hasRain && (
                        <Bar
                          yAxisId="daily"
                          dataKey="rain"
                          fill="url(#rainBarGradient)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={20}
                        />
                      )}
                      {hasSnow && (
                        <Bar
                          yAxisId="daily"
                          dataKey="snow"
                          fill="url(#snowBarGradient)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={20}
                        />
                      )}
                      <Line
                        yAxisId="cumulative"
                        type="monotone"
                        dataKey="cumulativeRain"
                        stroke="rgba(59, 130, 246, 1)"
                        strokeWidth={2}
                        dot={false}
                        name="Total Rain"
                      />
                      {hasSnow && (
                        <Line
                          yAxisId="cumulative"
                          type="monotone"
                          dataKey="cumulativeSnow"
                          stroke="rgba(125, 211, 252, 1)"
                          strokeWidth={2}
                          dot={false}
                          name="Total Snow"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/50">
                {hasRain && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-2 rounded-sm bg-blue-500/60" />
                      Daily Rain
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-0.5 bg-blue-500" />
                      Total Rain
                    </span>
                  </>
                )}
                {hasSnow && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-2 rounded-sm bg-sky-300/60" />
                      Daily Snow
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-0.5 bg-sky-300" />
                      Total Snow
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="px-4 py-3 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Daily Breakdown</h3>
              {dailyData.length === 0 ? (
                <p className="text-sm text-white/40">No daily data available</p>
              ) : (
                <div className="overflow-x-auto max-h-[200px] overflow-y-auto glass-scroll">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-black/50 backdrop-blur-sm">
                      <tr className="text-white/50 text-xs">
                        <th className="text-left py-2 pr-3 font-medium">Date</th>
                        <th className="text-right py-2 px-3 font-medium">Rain</th>
                        <th className="text-right py-2 pl-3 font-medium">Snow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dailyData.slice().reverse().map((day, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-white/5' : ''}>
                          <td className="py-2 pr-3 text-white/70">
                            {monthName} {day.day}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-400">
                            {day.precip > 0 ? `${day.precip.toFixed(2)}"` : '—'}
                          </td>
                          <td className="py-2 pl-3 text-right text-sky-300">
                            {day.snow > 0 ? `${day.snow.toFixed(1)}"` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-xs text-white/40 text-center">
                Data from Iowa Environmental Mesonet {stationName && `• ${stationName}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

PrecipitationDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dailyData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      day: PropTypes.number,
      precip: PropTypes.number,
      snow: PropTypes.number,
      runningPrecip: PropTypes.number,
      runningSnow: PropTypes.number,
    })
  ),
  totals: PropTypes.shape({
    precipitation: PropTypes.number,
    snowfall: PropTypes.number,
  }),
  monthName: PropTypes.string,
  year: PropTypes.number,
  stationName: PropTypes.string,
};
