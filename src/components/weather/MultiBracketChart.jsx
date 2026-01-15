import { useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ChartScreenshotButton from '../ui/ChartScreenshotButton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Condense bracket label for display
 * "38° to 39°" -> "38-39°F"
 * "45° or above" -> "≥45°F"
 * "30° or below" -> "≤30°F"
 */
function condenseLabel(label) {
  if (!label) return '';

  // Handle range: "38° to 39°" -> "38-39°F"
  const rangeMatch = label.match(/(\d+)°?\s*to\s*(\d+)°?/i);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}°F`;
  }

  // Handle "or above"
  const aboveMatch = label.match(/(\d+)°?\s*(or above|and above|\+)/i);
  if (aboveMatch) {
    return `≥${aboveMatch[1]}°F`;
  }

  // Handle "or below"
  const belowMatch = label.match(/(\d+)°?\s*(or below|and below)/i);
  if (belowMatch) {
    return `≤${belowMatch[1]}°F`;
  }

  return label;
}

/**
 * MultiBracketChart - Shows price history for multiple brackets on one chart
 * Similar to Polymarket's multi-outcome view
 */
export default function MultiBracketChart({
  data,
  legendData,
  bracketColors,
  period,
  onPeriodChange,
  loading,
  cityName = '',
}) {
  const chartRef = useRef(null);
  const periods = ['1h', '6h', '1d', '1w', 'all'];
  const periodLabels = { '1h': '1H', '6h': '6H', '1d': '1D', '1w': '1W', 'all': 'ALL' };

  // Delay chart rendering to ensure container has dimensions
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setChartReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculate Y-axis domain
  const { minPrice, maxPrice } = useMemo(() => {
    if (!data || data.length === 0) return { minPrice: 0, maxPrice: 100 };

    const allPrices = [];
    legendData.forEach(({ label }) => {
      data.forEach(d => {
        if (d[label] != null) allPrices.push(d[label]);
      });
    });

    if (allPrices.length === 0) return { minPrice: 0, maxPrice: 100 };

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = Math.max(5, (max - min) * 0.1);

    return {
      minPrice: Math.max(0, Math.floor(min - padding)),
      maxPrice: Math.min(100, Math.ceil(max + padding)),
    };
  }, [data, legendData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const timeData = payload[0]?.payload;
    const timeLabel = timeData?.timeLabel || '--';

    return (
      <div className="bg-black/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs glass-border-premium shadow-xl">
        <div className="text-white/60 mb-1.5 font-medium">{timeLabel}</div>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white/70">{condenseLabel(entry.dataKey)}</span>
              </div>
              <span className="font-medium text-white">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Custom legend
  const renderLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-2">
      {legendData.map(({ label, color, currentPrice }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white/70">{condenseLabel(label)}</span>
          <span className="font-semibold text-white">{currentPrice}%</span>
        </div>
      ))}
    </div>
  );

  // Generate caption for screenshot
  const screenshotCaption = cityName
    ? `${cityName} price chart - ${new Date().toLocaleDateString()}`
    : `Price chart - ${new Date().toLocaleDateString()}`;

  return (
    <div ref={chartRef} className="relative group bg-white/5 rounded-xl p-3">
      {/* Screenshot button */}
      <ChartScreenshotButton chartRef={chartRef} caption={screenshotCaption} />

      {/* Legend */}
      {renderLegend()}

      {/* Chart */}
      <div className="h-[180px]">
        {loading || !chartReady ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/40 text-sm">
            No price history available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(ts) => {
                  const date = new Date(ts * 1000);
                  if (period === '1h' || period === '6h') {
                    return date.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                  }
                  if (period === '1d') {
                    return date.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      hour12: true,
                    });
                  }
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Render a line for each bracket */}
              {legendData.map(({ label, color }) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  activeDot={{
                    r: 4,
                    fill: color,
                    stroke: 'rgba(255,255,255,0.4)',
                    strokeWidth: 2,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-center mt-2">
        <div className="flex bg-white/10 rounded-lg p-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                period === p
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

MultiBracketChart.propTypes = {
  data: PropTypes.array.isRequired,
  legendData: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      currentPrice: PropTypes.number.isRequired,
    })
  ).isRequired,
  bracketColors: PropTypes.object.isRequired,
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  cityName: PropTypes.string,
};
