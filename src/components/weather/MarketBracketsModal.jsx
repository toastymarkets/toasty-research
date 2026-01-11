import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronDown, ExternalLink, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useDataChip } from '../../context/DataChipContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useKalshiCandlesticks, PERIODS } from '../../hooks/useKalshiCandlesticks';
import { useKalshiOrderbook } from '../../hooks/useKalshiOrderbook';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import MultiBracketChart from './MultiBracketChart';

/**
 * MarketBracketsModal - Detailed view of Kalshi market brackets
 */
export default function MarketBracketsModal({
  brackets,
  cityName,
  seriesTicker,
  closeTime,
  dayOffset,
  onDayChange,
  onClose,
}) {
  const [expandedBracket, setExpandedBracket] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1d');

  // Fetch multi-bracket price history for the overview chart
  const {
    data: chartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, brackets, chartPeriod, 4, true);

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!closeTime) return 'Unknown';
    const now = new Date();
    const diff = closeTime - now;
    if (diff <= 0) return 'Closed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get Kalshi URL for trading
  const getKalshiUrl = () => {
    const cityMap = {
      'KXHIGHNY': 'kxhighny/highest-temperature-in-new-york',
      'KXHIGHCHI': 'kxhighchi/highest-temperature-in-chicago',
      'KXHIGHLAX': 'kxhighlax/highest-temperature-in-los-angeles',
      'KXHIGHMIA': 'kxhighmia/highest-temperature-in-miami',
      'KXHIGHDEN': 'kxhighden/highest-temperature-in-denver',
      'KXHIGHAUS': 'kxhighaus/highest-temperature-in-austin',
      'KXHIGHPHIL': 'kxhighphil/highest-temperature-in-philadelphia',
    };
    return `https://kalshi.com/markets/${cityMap[seriesTicker] || ''}`;
  };

  const dayLabel = dayOffset === 0 ? 'Today' : 'Tomorrow';

  // Extract temperature from label for sorting
  const getTempValue = (label) => {
    // Handle "X° or above" -> use X
    // Handle "X° or below" -> use X - 1 (so it sorts before X)
    // Handle "X° to Y°" -> use X
    const aboveMatch = label.match(/(\d+)°?\s*(or above|and above|\+)/i);
    if (aboveMatch) return parseInt(aboveMatch[1], 10);

    const belowMatch = label.match(/(\d+)°?\s*(or below|and below)/i);
    if (belowMatch) return parseInt(belowMatch[1], 10) - 1;

    const rangeMatch = label.match(/(\d+)/);
    return rangeMatch ? parseInt(rangeMatch[1], 10) : 0;
  };

  // Sort brackets by temperature (lowest to highest)
  const sortedBrackets = [...brackets].sort((a, b) => getTempValue(a.label) - getTempValue(b.label));

  // Find the leading bracket (highest probability)
  const leadingBracket = brackets.reduce((max, b) => b.yesPrice > (max?.yesPrice || 0) ? b : max, null);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Kalshi Markets
                </h2>
                <p className="text-sm text-white/60">
                  Highest temp in {cityName} {dayLabel.toLowerCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Day Toggle & Timer */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => onDayChange(0)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dayOffset === 0
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => onDayChange(1)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dayOffset === 1
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  Tomorrow
                </button>
              </div>
              <span className="text-xs text-white/40">
                Closes in {formatTimeRemaining()}
              </span>
            </div>
          </div>

          {/* Multi-Bracket Price Chart */}
          <div className="px-4 py-3 border-b border-white/10">
            <MultiBracketChart
              data={chartData}
              legendData={legendData}
              bracketColors={bracketColors}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              loading={chartLoading}
              cityName={cityName}
            />
          </div>

          {/* Brackets List */}
          <div className="overflow-y-auto max-h-[40vh] glass-scroll">
            {sortedBrackets.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40 text-sm">
                No markets available for {dayLabel.toLowerCase()}
              </div>
            ) : (
              sortedBrackets.map((bracket, idx) => (
                <BracketRow
                  key={bracket.ticker}
                  bracket={bracket}
                  seriesTicker={seriesTicker}
                  isExpanded={expandedBracket === bracket.ticker}
                  onToggle={() => setExpandedBracket(expandedBracket === bracket.ticker ? null : bracket.ticker)}
                  isLeading={bracket.ticker === leadingBracket?.ticker}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <a
              href={getKalshiUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              Trade on Kalshi
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

MarketBracketsModal.propTypes = {
  brackets: PropTypes.array.isRequired,
  cityName: PropTypes.string.isRequired,
  seriesTicker: PropTypes.string.isRequired,
  closeTime: PropTypes.instanceOf(Date),
  dayOffset: PropTypes.number.isRequired,
  onDayChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * BracketRow - Single bracket with expandable chart
 */
function BracketRow({ bracket, seriesTicker, isExpanded, onToggle, isLeading }) {
  const [period, setPeriod] = useState('1h');
  const { insertDataChip, isEditorReady } = useDataChip();

  // Fetch candlesticks when expanded
  const { candles, loading: candlesLoading } = useKalshiCandlesticks(
    seriesTicker,
    bracket.ticker,
    period,
    isExpanded
  );

  // Fetch orderbook when expanded
  const { yesBids, noBids, loading: orderbookLoading } = useKalshiOrderbook(
    bracket.ticker,
    isExpanded
  );

  // Condense label (e.g., "38° to 39°" -> "38-39°F")
  const condenseLabel = (label) => {
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
  };

  // Handle inserting bracket data as a chip into notes
  const handleBracketInsert = (e) => {
    e.stopPropagation(); // Prevent row expansion

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    insertDataChip({
      value: condenseLabel(bracket.label),
      secondary: `${bracket.yesPrice}%`,
      label: 'Market Odds',
      source: `Kalshi ${seriesTicker}`,
      timestamp,
      type: 'market',
    });
  };

  return (
    <div className={`border-b border-white/5 ${isExpanded ? 'bg-white/5' : ''}`}>
      {/* Main Row - Clickable */}
      <button
        onClick={onToggle}
        className={`group relative w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
          isLeading ? 'bg-white/[0.03]' : ''
        }`}
      >
        {/* Quick Add Button */}
        {isEditorReady && (
          <button
            onClick={handleBracketInsert}
            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                       w-4 h-4 rounded-full bg-[var(--color-orange-main)]
                       flex items-center justify-center transition-opacity z-10
                       hover:scale-110"
            title="Add to notes"
          >
            <Plus size={10} strokeWidth={3} className="text-black" />
          </button>
        )}

        <div className={`flex items-center gap-3 ${isEditorReady ? 'ml-3' : ''}`}>
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
          <span className={`font-medium ${isLeading ? 'text-white' : 'text-white/80'}`}>
            {condenseLabel(bracket.label)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Yes/No Prices */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400">{bracket.yesPrice}¢</span>
            <span className="text-white/30">/</span>
            <span className="text-red-400">{bracket.noPrice}¢</span>
          </div>

          {/* Probability */}
          <div className={`text-sm font-medium min-w-[40px] text-right ${
            isLeading ? 'text-white' : 'text-white/70'
          }`}>
            {bracket.yesPrice}%
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {/* Period Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/50">Price History</span>
            <div className="flex bg-white/10 rounded-lg p-0.5">
              {['1h', '6h', '12h'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                    period === p
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[150px] mb-3">
            {candlesLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : candles.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/40 text-xs">
                No price history available
              </div>
            ) : (
              <PriceChart candles={candles} currentPrice={bracket.yesPrice} />
            )}
          </div>

          {/* Orderbook Summary */}
          <div className="grid grid-cols-2 gap-3">
            <OrderbookSide
              title="Yes Bids"
              bids={yesBids.slice(0, 3)}
              loading={orderbookLoading}
              color="emerald"
            />
            <OrderbookSide
              title="No Bids"
              bids={noBids.slice(0, 3)}
              loading={orderbookLoading}
              color="red"
            />
          </div>

          {/* Volume */}
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
            <span>Volume</span>
            <span>{bracket.volume.toLocaleString()} contracts</span>
          </div>
        </div>
      )}
    </div>
  );
}

BracketRow.propTypes = {
  bracket: PropTypes.object.isRequired,
  seriesTicker: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  isLeading: PropTypes.bool,
};

/**
 * PriceChart - Line chart showing yes price over time
 */
function PriceChart({ candles, currentPrice }) {
  // Prepare chart data with defensive checks
  const chartData = useMemo(() => {
    return candles
      .filter(c => c && typeof c.timestamp === 'number' && c.timestamp > 0)
      .map((c) => {
        const price = typeof c.yesPrice === 'number' ? c.yesPrice :
                      typeof c.close === 'number' ? c.close : 0;
        const timeObj = c.time instanceof Date ? c.time : new Date(c.timestamp * 1000);

        return {
          time: c.timestamp,
          timeLabel: timeObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          price: price,
        };
      })
      .filter(d => d.price > 0);
  }, [candles]);

  // Calculate price range with safety checks
  const prices = chartData.map((d) => d.price).filter((p) => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.max(0, Math.min(...prices) - 5) : 0;
  const maxPrice = prices.length > 0 ? Math.min(100, Math.max(...prices) + 5) : 100;

  // Custom tooltip with safety checks
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const timeLabel = typeof data.timeLabel === 'string' ? data.timeLabel : '--';
    const price = typeof data.price === 'number' ? data.price : 0;

    return (
      <div className="bg-black/80 backdrop-blur-sm px-2 py-1.5 rounded-lg text-xs border border-white/10">
        <div className="text-white/60 mb-0.5">{timeLabel}</div>
        <div className="text-white font-medium">{price}¢</div>
      </div>
    );
  };

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(ts) => {
            const date = new Date(ts * 1000);
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          }}
          interval="preserveStartEnd"
          minTickGap={50}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
          tickLine={false}
          axisLine={false}
          width={30}
          tickFormatter={(v) => `${v}¢`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={currentPrice}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#fff', stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

PriceChart.propTypes = {
  candles: PropTypes.array.isRequired,
  currentPrice: PropTypes.number,
};

/**
 * OrderbookSide - Shows top bids for one side
 */
function OrderbookSide({ title, bids, loading, color }) {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="text-[10px] text-white/50 mb-1.5">{title}</div>
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      ) : bids.length === 0 ? (
        <div className="text-[10px] text-white/30">No bids</div>
      ) : (
        <div className="space-y-0.5">
          {bids.map((bid, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <span className={colorClass}>{bid.price}¢</span>
              <span className="text-white/50">{bid.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

OrderbookSide.propTypes = {
  title: PropTypes.string.isRequired,
  bids: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  color: PropTypes.oneOf(['emerald', 'red']),
};
