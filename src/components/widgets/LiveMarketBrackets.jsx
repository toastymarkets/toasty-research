import { useState, useEffect } from 'react';
import { TrendingUp, Clock, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { useKalshiMarkets, CITY_SERIES } from '../../hooks/useKalshiMarkets';
import SelectableData from './SelectableData';

export default function LiveMarketBrackets({ citySlug, cityName, className = '' }) {
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow
  const { brackets, totalVolume, closeTime, loading, error, refetch, seriesTicker } = useKalshiMarkets(citySlug, dayOffset);
  const [timer, setTimer] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const dayLabel = dayOffset === 0 ? 'today' : 'tomorrow';

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      if (!closeTime) {
        setTimer(null);
        return;
      }

      const now = new Date();
      const diff = closeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimer({ formatted: 'Market Closed' });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimer({ formatted: `${hours}h ${minutes}m ${seconds}s` });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  const formatVolume = (vol) => {
    if (!vol) return '$0';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  const hasSeries = CITY_SERIES[citySlug];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold">Live Market Brackets</h3>
          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        <div className="flex items-center gap-2">
          {timer && (
            <span className="flex items-center gap-1 text-sm text-red-500 font-medium tabular-nums">
              <Clock size={14} />
              {timer.formatted}
            </span>
          )}
          <button
            onClick={refetch}
            className="p-1.5 rounded-lg hover:bg-[var(--color-card-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Day toggle */}
      {isExpanded && (
        <div className="flex items-center gap-1 mb-4 p-1 bg-[var(--color-card-elevated)] rounded-lg w-fit">
          <button
            onClick={() => setDayOffset(0)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              dayOffset === 0
                ? 'bg-purple-500 text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDayOffset(1)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              dayOffset === 1
                ? 'bg-purple-500 text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Tomorrow
          </button>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Question */}
          <div className="px-4 py-3 mb-4 rounded-xl bg-[var(--color-card-elevated)]">
            <p className="text-sm font-medium">
              Highest temperature in {cityName} {dayLabel}?
            </p>
          </div>

          {/* Content */}
          {!hasSeries ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              No Kalshi market available for this city
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-[var(--color-card-elevated)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : brackets.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              No open markets for {dayLabel}
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center justify-between px-3 py-1 mb-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                <span>Bracket</span>
                <span>Chance</span>
              </div>

              {/* Brackets list */}
              <div className="space-y-2">
                {brackets.map((bracket, i) => (
                  <div
                    key={bracket.ticker || i}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-card-elevated)] hover:bg-[var(--color-card-elevated)]/80 transition-colors"
                  >
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {bracket.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <SelectableData
                        value={`${bracket.yesPrice}%`}
                        label={`${bracket.label} (${dayLabel})`}
                        source={`Kalshi ${cityName}`}
                        type="market"
                      >
                        <span className="text-lg font-bold tabular-nums">
                          {bracket.yesPrice}%
                        </span>
                      </SelectableData>
                      <div className="flex rounded-lg overflow-hidden text-xs font-medium">
                        <SelectableData
                          value={`Yes ${bracket.yesPrice}¢`}
                          label={`${bracket.label} Yes (${dayLabel})`}
                          source={`Kalshi ${cityName}`}
                          type="market"
                        >
                          <span className="px-2.5 py-1.5 bg-purple-500/20 text-purple-400">
                            Yes {bracket.yesPrice}¢
                          </span>
                        </SelectableData>
                        <SelectableData
                          value={`No ${bracket.noPrice}¢`}
                          label={`${bracket.label} No (${dayLabel})`}
                          source={`Kalshi ${cityName}`}
                          type="market"
                        >
                          <span className="px-2.5 py-1.5 bg-gray-500/20 text-gray-400">
                            No {bracket.noPrice}¢
                          </span>
                        </SelectableData>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Volume footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)] text-sm">
                <span className="text-[var(--color-text-muted)]">Total Volume</span>
                <SelectableData
                  value={formatVolume(totalVolume)}
                  label={`${dayLabel} Market Volume`}
                  source={`Kalshi ${cityName}`}
                  type="market"
                >
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {formatVolume(totalVolume)}
                  </span>
                </SelectableData>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
