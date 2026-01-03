import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useKalshiMarketsFromContext } from '../../hooks/useAllKalshiMarkets.jsx';
import { CITY_BY_SLUG } from '../../config/cities';
import { getWeatherBackground, WeatherOverlay } from '../weather/DynamicWeatherBackground';
import { useAllCitiesWeather } from '../../hooks/useAllCitiesWeather';

/**
 * MarketCardGlass - Glass-styled market card for homepage
 * Displays city market data with probability bars and countdown timer
 */
export default function MarketCardGlass({
  city,
  index = 0,
  comingSoon = false,
  featured = false,
  shuffling = false,
  shuffleDirection = 1
}) {
  // Get market data from context if it's a temperature market, otherwise use passed data
  const contextData = useKalshiMarketsFromContext(city.slug);

  // Use context data for temp markets, or passed data for rain/snow
  const topBrackets = city.topBrackets || contextData.topBrackets || [];
  const totalVolume = city.totalVolume ?? contextData.totalVolume;
  const closeTime = city.closeTime || contextData.closeTime;
  const loading = contextData.loading && !city.topBrackets;
  const error = contextData.error && !city.topBrackets;

  // Get city config for timezone
  const cityConfig = CITY_BY_SLUG[city.citySlug || city.slug];

  // Get weather data for dynamic background
  const { getWeatherForCity } = useAllCitiesWeather();
  const weather = getWeatherForCity(city.citySlug || city.slug);
  const weatherBg = getWeatherBackground(weather?.condition, cityConfig?.timezone);

  const [timer, setTimer] = useState(null);

  // Update timer every second based on market close time
  useEffect(() => {
    const updateTimer = () => {
      if (!closeTime) {
        setTimer(null);
        return;
      }

      const now = new Date();
      const closeDate = closeTime instanceof Date ? closeTime : new Date(closeTime);
      const diff = closeDate.getTime() - now.getTime();

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

  // Condense label: "39° to 40°" -> "39-40°"
  const condenseLabel = (label) => {
    if (!label) return '';
    return label
      .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
      .replace(/(\d+)°\s*or above/i, '≥$1°')
      .replace(/(\d+)°\s*or below/i, '≤$1°');
  };

  // Staggered animation delay
  const animationDelay = `glass-delay-${(index % 5) + 1}`;

  // Generate random shuffle offset for animation
  const shuffleX = shuffleDirection * (20 + Math.random() * 30);

  return (
    <Link
      to={`/city/${city.citySlug || city.slug}`}
      className={`
        glass-widget glass-interactive glass-animate-in ${animationDelay}
        block overflow-hidden transition-all duration-300 relative
        ${comingSoon ? 'opacity-60 pointer-events-none' : ''}
        ${featured ? 'card-featured' : ''}
        ${shuffling ? 'card-shuffling' : ''}
      `}
      style={{
        '--shuffle-x': `${shuffleX}px`,
        background: weatherBg,
      }}
    >
      {/* Weather overlay */}
      <WeatherOverlay condition={weather?.condition} timezone={cityConfig?.timezone} index={index} />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Card Content */}
      <div className="relative z-10 p-4">
        {/* City name */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-lg">
            {city.name}
          </h3>
          {comingSoon && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/50 text-white/70">
              Coming Soon
            </span>
          )}
        </div>
        {/* Brackets */}
        {loading ? (
          <div className="space-y-2 mb-4">
            <div className="h-9 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-9 bg-white/10 rounded-lg animate-pulse" />
          </div>
        ) : error ? (
          <div className="h-[72px] flex items-center justify-center text-xs text-white/40 mb-4">
            {error}
          </div>
        ) : topBrackets.length > 0 ? (
          <div className="space-y-2 mb-4">
            {topBrackets.slice(0, 2).map((bracket, i) => (
              <div
                key={bracket.ticker || i}
                className="relative flex items-center justify-between py-2 px-2 rounded-lg"
              >
                {/* Probability bar background */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-lg opacity-25"
                  style={{
                    width: `${bracket.yesPrice}%`,
                    backgroundColor: '#3B82F6',
                  }}
                />

                {/* Label */}
                <span className="relative text-sm font-medium text-white/80">
                  {condenseLabel(bracket.label)}
                </span>

                {/* Price and Yes/No */}
                <div className="relative flex items-center gap-2">
                  <span className="text-sm font-bold text-white tabular-nums">
                    {bracket.yesPrice}%
                  </span>
                  <div className="flex rounded-md overflow-hidden text-[10px] font-medium">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400">
                      Yes
                    </span>
                    <span className="px-2 py-1 bg-white/10 text-white/50">
                      No
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[72px] flex items-center justify-center text-xs text-white/40 mb-4">
            No markets available
          </div>
        )}

        {/* Footer with volume and timer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-white/50">
            {formatVolume(totalVolume)}
          </span>
          {timer && (
            <span className="text-xs font-medium text-orange-400 tabular-nums">
              {timer.formatted}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
