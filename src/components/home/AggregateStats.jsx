import { useState, useEffect, useContext } from 'react';
import { DollarSign, Activity, Clock } from 'lucide-react';
import { KalshiMarketsContext } from '../../hooks/useAllKalshiMarkets.jsx';

/**
 * AggregateStats - Summary statistics across all markets
 * Shows total volume, active markets, and time until next close
 */
export default function AggregateStats() {
  const context = useContext(KalshiMarketsContext);
  const [nextCloseTimer, setNextCloseTimer] = useState(null);

  const { marketsData = {}, loading } = context || {};

  // Calculate aggregate stats
  const totalVolume = Object.values(marketsData).reduce(
    (sum, m) => sum + (m.totalVolume || 0),
    0
  );

  const activeMarkets = Object.values(marketsData).filter(
    (m) => m.brackets?.length > 0 && !m.error
  ).length;

  const nextCloseTime = Object.values(marketsData)
    .map((m) => m.closeTime)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  // Update countdown timer for next market close
  useEffect(() => {
    const updateTimer = () => {
      if (!nextCloseTime) {
        setNextCloseTimer(null);
        return;
      }

      const now = new Date();
      const diff = nextCloseTime.getTime() - now.getTime();

      if (diff <= 0) {
        setNextCloseTimer('Closed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setNextCloseTimer(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [nextCloseTime]);

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-widget p-4 animate-pulse">
              <div className="h-3 w-16 bg-white/10 rounded mb-2" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-6">
      <div className="grid grid-cols-3 gap-3">
        {/* Total Volume */}
        <div className="glass-widget p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-white/50" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">
              Total Volume
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatVolume(totalVolume)}
          </div>
        </div>

        {/* Active Markets */}
        <div className="glass-widget p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-white/50" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">
              Active Markets
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {activeMarkets}
            <span className="text-sm text-white/50 font-normal">/7</span>
          </div>
        </div>

        {/* Next Close */}
        <div className="glass-widget p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-white/50" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">
              Next Close
            </span>
          </div>
          <div className="text-xl font-bold text-orange-400 tabular-nums">
            {nextCloseTimer || '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
