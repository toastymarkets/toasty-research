import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useKalshiMarketsFromContext } from '../../hooks/useAllKalshiMarkets.jsx';

export default function CityCard({ city }) {
  const { topBrackets, totalVolume, closeTime, loading, error } = useKalshiMarketsFromContext(city.slug);
  const [timer, setTimer] = useState(null);

  // Update timer every second based on market close time
  useEffect(() => {
    const updateTimer = () => {
      if (!closeTime) {
        setTimer(null);
        return;
      }

      const now = new Date();
      const diff = closeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimer({ hours: 0, minutes: 0, seconds: 0, formatted: 'Closed' });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimer({ hours, minutes, seconds, formatted: `${hours}h ${minutes}m ${seconds}s` });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  return (
    <Link
      to={`/city/${city.slug}`}
      className="group block p-5 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-orange-500/30 hover:shadow-lg transition-all"
    >
      {/* Header with image and question */}
      <div className="flex items-start gap-3 mb-5">
        {city.image && (
          <img
            src={city.image}
            alt={city.name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <h3 className="font-medium text-[var(--color-text-primary)] leading-snug">
          Highest temperature in {city.name} today?
        </h3>
      </div>

      {/* Brackets */}
      {loading ? (
        <div className="space-y-3 mb-5">
          <div className="h-10 bg-[var(--color-card-elevated)] rounded-lg animate-pulse" />
          <div className="h-10 bg-[var(--color-card-elevated)] rounded-lg animate-pulse" />
        </div>
      ) : error ? (
        <div className="h-20 flex items-center justify-center text-sm text-[var(--color-text-muted)] mb-5">
          {error}
        </div>
      ) : topBrackets.length > 0 ? (
        <div className="space-y-3 mb-5">
          {topBrackets.map((bracket, i) => (
            <div key={bracket.ticker || i} className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {bracket.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
                  {bracket.yesPrice}%
                </span>
                <div className="flex rounded-lg overflow-hidden text-xs font-medium">
                  <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                    Yes
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-l border-white/20">
                    No
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center text-sm text-[var(--color-text-muted)] mb-5">
          No markets available
        </div>
      )}

      {/* Footer with volume and timer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <span className="text-sm text-[var(--color-text-muted)]">
          {formatVolume(totalVolume)}
        </span>
        <div className="flex items-center gap-2">
          {timer && (
            <span className="text-sm font-medium text-red-500 tabular-nums">
              {timer.formatted}
            </span>
          )}
          <button
            className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-orange-500 hover:text-orange-500 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Could open a quick-add modal
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
