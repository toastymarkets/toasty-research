import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, TrendingUp, CloudRain, Snowflake } from 'lucide-react';

/**
 * AllMarketsModal - Popup showing all markets in a category
 * Displays condensed market cards in a scrollable grid
 */
export default function AllMarketsModal({
  isOpen,
  onClose,
  title,
  icon: Icon = TrendingUp,
  markets = [],
  type = 'temperature'
}) {
  const [timer, setTimer] = useState({});

  // Update timers every second
  useEffect(() => {
    if (!isOpen) return;

    const updateTimers = () => {
      const newTimers = {};
      markets.forEach(market => {
        if (market.closeTime) {
          const now = new Date();
          const diff = market.closeTime.getTime() - now.getTime();
          if (diff <= 0) {
            newTimers[market.slug] = 'Closed';
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            newTimers[market.slug] = `${hours}h ${minutes}m`;
          }
        }
      });
      setTimer(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [isOpen, markets]);

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  // Condense bracket label
  const condenseLabel = (label) => {
    if (!label) return '';
    return label
      .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
      .replace(/(\d+)°\s*or above/i, '≥$1°')
      .replace(/(\d+)°\s*or below/i, '≤$1°');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-[100] flex items-center justify-center">
        <div className="glass-elevated w-full max-w-4xl max-h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-white/70" />
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <span className="text-sm text-white/50">({markets.length} markets)</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Markets Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {markets.map((market) => (
                <Link
                  key={market.slug}
                  to={`/city/${market.slug}`}
                  onClick={onClose}
                  className="glass-widget p-3 hover:bg-white/10 transition-colors"
                >
                  {/* City Name & Timer */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{market.name}</span>
                    <span className="text-xs text-orange-400 tabular-nums">
                      {timer[market.slug] || '--'}
                    </span>
                  </div>

                  {/* Top Bracket */}
                  {market.topBrackets?.[0] && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white/60">
                        {condenseLabel(market.topBrackets[0].label)}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {market.topBrackets[0].yesPrice}%
                      </span>
                    </div>
                  )}

                  {/* Volume */}
                  <div className="text-xs text-white/40 mt-2">
                    {formatVolume(market.totalVolume)} volume
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              Click any market to view detailed forecasts and data
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
