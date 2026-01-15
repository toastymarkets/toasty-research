import { useState, useEffect, useContext, useMemo } from 'react';
import { FileText, Clock, Radio } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { KalshiMarketsContext } from '../../hooks/useAllKalshiMarkets';
import { getNextCliRelease, getNextMetarRelease, formatCountdown } from '../../config/dataSchedule';

/**
 * DataCountdownBar - Key timing information for traders
 * Shows next CLI release, market close, and METAR across all cities
 */
export default function DataCountdownBar() {
  const { marketsData = {} } = useContext(KalshiMarketsContext) || {};
  const [now, setNow] = useState(new Date());

  // Update every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Find next CLI release across all market cities
  const nextCli = useMemo(() => {
    let earliest = null;
    let earliestCity = null;

    MARKET_CITIES.forEach(city => {
      const target = getNextCliRelease(city.stationId);
      if (target && (!earliest || target < earliest)) {
        earliest = target;
        earliestCity = city;
      }
    });

    if (!earliest) return null;

    const diff = earliest.getTime() - now.getTime();
    return {
      ...formatCountdown(diff),
      city: earliestCity?.name,
    };
  }, [now]);

  // Find next market close across all markets
  const nextMarketClose = useMemo(() => {
    let earliest = null;
    let earliestCity = null;

    Object.entries(marketsData).forEach(([slug, data]) => {
      if (data?.closeTime) {
        const closeDate = data.closeTime instanceof Date ? data.closeTime : new Date(data.closeTime);
        if (!earliest || closeDate < earliest) {
          earliest = closeDate;
          earliestCity = MARKET_CITIES.find(c => c.slug === slug);
        }
      }
    });

    if (!earliest) return null;

    const diff = earliest.getTime() - now.getTime();
    if (diff <= 0) return { formatted: 'Closed', city: earliestCity?.name };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      formatted: `${hours}h ${minutes}m ${seconds}s`,
      hours,
      city: earliestCity?.name,
    };
  }, [now, marketsData]);

  // Find next METAR (typically ~:51-:56 past the hour)
  const nextMetar = useMemo(() => {
    // METAR is roughly the same for all stations - next :53 past the hour
    const next = new Date(now);
    next.setMinutes(53, 0, 0);
    if (next <= now) {
      next.setHours(next.getHours() + 1);
    }

    const diff = next.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      formatted: `${minutes}m ${seconds}s`,
      minutes,
    };
  }, [now]);

  // Get current time in each timezone
  const timezones = useMemo(() => {
    return [
      { label: 'ET', tz: 'America/New_York' },
      { label: 'CT', tz: 'America/Chicago' },
      { label: 'MT', tz: 'America/Denver' },
      { label: 'PT', tz: 'America/Los_Angeles' },
    ].map(({ label, tz }) => ({
      label,
      time: now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }));
  }, [now]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-4">
      <div className="glass-widget p-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Next CLI Release */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Next CLI</p>
              <p className={`text-sm font-bold tabular-nums ${
                nextCli?.hours < 1 ? 'text-orange-400' : 'text-white'
              }`}>
                {nextCli?.formatted || '--'}
              </p>
            </div>
            {nextCli?.city && (
              <span className="text-[10px] text-white/30 hidden sm:block">
                {nextCli.city}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {/* Next Market Close */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Market Close</p>
              <p className="text-sm font-bold text-orange-400 tabular-nums">
                {nextMarketClose?.formatted || '--'}
              </p>
            </div>
            {nextMarketClose?.city && (
              <span className="text-[10px] text-white/30 hidden sm:block">
                {nextMarketClose.city}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {/* Next METAR */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-wide">Next METAR</p>
              <p className={`text-sm font-bold tabular-nums ${
                nextMetar?.minutes < 5 ? 'text-emerald-400' : 'text-white'
              }`}>
                {nextMetar?.formatted || '--'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-white/10 hidden lg:block" />

          {/* Timezone Clocks */}
          <div className="hidden lg:flex items-center gap-4">
            {timezones.map(({ label, time }) => (
              <div key={label} className="text-center min-w-[48px]">
                <p className="text-[9px] text-white/40 font-medium">{label}</p>
                <p className="text-xs font-medium text-white/70 tabular-nums">{time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
