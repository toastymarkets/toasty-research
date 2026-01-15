import { useState, useEffect, useMemo, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Menu,
  MapPin,
} from 'lucide-react';
import { CITIES } from '../../config/cities';
import { useSidebar } from '../../context/SidebarContext';
import { useAllCitiesWeather } from '../../hooks/useAllCitiesWeather';
import { KalshiMarketsContext } from '../../hooks/useAllKalshiMarkets';
import { isDaytime, getWeatherBackground, WeatherOverlay } from '../weather/DynamicWeatherBackground';

// Get local time for a timezone
const getLocalTime = (timezone) => {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function GlassSidebar() {
  const { isMobileOpen, closeMobile, toggleMobile } = useSidebar();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const location = useLocation();

  // Fetch real weather data for all cities
  const { weatherData, loading: weatherLoading, getWeatherForCity } = useAllCitiesWeather();

  // Get market data from context
  const marketsContext = useContext(KalshiMarketsContext);
  const marketsData = marketsContext?.marketsData || {};

  // Helper to check if a market is open (not yet closed)
  const isMarketOpen = (closeTime) => {
    if (!closeTime) return false;
    const closeDate = closeTime instanceof Date ? closeTime : new Date(closeTime);
    return closeDate > new Date();
  };

  // Helper to check if a market is truly active (open AND competitive)
  // A market at 99% is effectively resolved - outcome is known
  const isMarketActive = (market) => {
    if (!market?.closeTime) return false;
    if (!isMarketOpen(market.closeTime)) return false;

    // Check if top bracket is >= 99% (effectively resolved)
    const topBracket = market.topBrackets?.[0];
    if (topBracket?.yesPrice >= 99) return false;

    return true;
  };

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  // Sort cities - prioritize active (competitive) markets
  const sortedCities = useMemo(() => {
    return [...CITIES].sort((a, b) => {
      const aMarket = marketsData[a.slug];
      const bMarket = marketsData[b.slug];

      const aActive = isMarketActive(aMarket);
      const bActive = isMarketActive(bMarket);
      const aOpen = isMarketOpen(aMarket?.closeTime);
      const bOpen = isMarketOpen(bMarket?.closeTime);

      // 1. Active markets first (open + competitive)
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // 2. Then resolved markets (open but 99%)
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      // 3. Then cities with markets (closed)
      if (a.hasMarket && !b.hasMarket) return -1;
      if (!a.hasMarket && b.hasMarket) return 1;

      // Within same category, sort by volume
      return (bMarket?.totalVolume || 0) - (aMarket?.totalVolume || 0);
    });
  }, [marketsData]);

  // Check if a city is active
  const isCityActive = (citySlug) => location.pathname === `/city/${citySlug}`;

  // Condense bracket label: "39° to 40°" -> "39-40°"
  const condenseLabel = (label) => {
    if (!label) return '';
    return label
      .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
      .replace(/(\d+)°\s*or above/i, '≥$1°')
      .replace(/(\d+)°\s*or below/i, '≤$1°');
  };

  // Render city item - Apple Weather style with dynamic backgrounds
  const renderCityItem = (city, isMobile = false) => {
    const realWeather = getWeatherForCity(city.slug);
    const weather = realWeather || { temp: '--', condition: 'Loading...' };
    const isActive = isCityActive(city.slug);
    const localTime = getLocalTime(city.timezone);
    const weatherBg = getWeatherBackground(weather.condition, city.timezone);

    // Get market data for this city
    const cityMarket = marketsData[city.slug];
    const hasOpenMarket = isMarketOpen(cityMarket?.closeTime);
    const hasActiveMarket = isMarketActive(cityMarket); // Open AND competitive (not 99%)
    const topBracket = cityMarket?.topBrackets?.[0];

    return (
      <Link
        key={city.id}
        to={`/city/${city.slug}`}
        onClick={isMobile ? closeMobile : undefined}
        className={`
          block px-3 py-3 rounded-2xl transition-all relative overflow-hidden
          glass-border-premium
          ${isActive ? 'active' : ''}
        `}
        style={{ background: weatherBg }}
      >
        {/* Weather visual overlay */}
        <WeatherOverlay condition={weather.condition} isDay={isDaytime(city.timezone)} />

        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

        <div className="relative flex flex-col gap-0.5">
          {/* Row 1: City name + indicator + Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {city.slug === 'new-york' && (
                <MapPin className="w-3 h-3 text-white/80 flex-shrink-0" />
              )}
              <span className="text-[16px] font-semibold text-white drop-shadow-sm">
                {city.name}
              </span>
              {hasActiveMarket && (
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </div>
            <span className="text-[24px] font-light text-white leading-none drop-shadow-md">
              {weather.temp != null ? `${weather.temp}°` : '--'}
            </span>
          </div>

          {/* Row 2: Time + first bracket */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/70 drop-shadow-sm">
              {localTime}
            </span>
            {hasOpenMarket && cityMarket?.topBrackets?.[0] && (
              <span className={`
                text-[11px] px-2 py-0.5 rounded whitespace-nowrap
                ${cityMarket.topBrackets[0].yesPrice >= 70
                  ? 'bg-sky-400/25'
                  : cityMarket.topBrackets[0].yesPrice >= 30
                    ? 'bg-slate-400/20'
                    : 'bg-white/10'}
              `}>
                <span className="text-white/60">{condenseLabel(cityMarket.topBrackets[0].label)}</span>
                <span className="font-semibold text-white ml-1">{cityMarket.topBrackets[0].yesPrice}%</span>
              </span>
            )}
          </div>

          {/* Row 3: Weather + second bracket */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/90 drop-shadow-sm truncate max-w-[120px]">
              {weather.condition || 'Unknown'}
            </span>
            {hasOpenMarket && cityMarket?.topBrackets?.[1] && (
              <span className={`
                text-[11px] px-2 py-0.5 rounded whitespace-nowrap
                ${cityMarket.topBrackets[1].yesPrice >= 70
                  ? 'bg-sky-400/25'
                  : cityMarket.topBrackets[1].yesPrice >= 30
                    ? 'bg-slate-400/20'
                    : 'bg-white/10'}
              `}>
                <span className="text-white/60">{condenseLabel(cityMarket.topBrackets[1].label)}</span>
                <span className="font-semibold text-white ml-1">{cityMarket.topBrackets[1].yesPrice}%</span>
              </span>
            )}
            {!hasOpenMarket && weather.humidity != null && (
              <span className="text-[11px] text-white/60 drop-shadow-sm">
                {weather.humidity}% RH
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  // Cities panel content
  const renderCitiesPanel = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Cities list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {sortedCities.map(city => renderCityItem(city, isMobile))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      {!isMobileOpen && (
        <button
          onClick={toggleMobile}
          className="md:hidden fixed top-4 left-4 z-50 glass-button-icon"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-3 top-3 bottom-3 w-72 flex-col z-40">
        {/* Logo */}
        <Link to="/" className="px-2 pb-3 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="22" fill="white"/>
            <g fill="white">
              <rect x="46" y="8" width="8" height="16" rx="4"/>
              <rect x="46" y="76" width="8" height="16" rx="4"/>
              <rect x="8" y="46" width="16" height="8" rx="4"/>
              <rect x="76" y="46" width="16" height="8" rx="4"/>
              <rect x="16" y="16" width="8" height="14" rx="4" transform="rotate(-45 20 23)"/>
              <rect x="76" y="16" width="8" height="14" rx="4" transform="rotate(45 80 23)"/>
              <rect x="16" y="70" width="8" height="14" rx="4" transform="rotate(45 20 77)"/>
              <rect x="76" y="70" width="8" height="14" rx="4" transform="rotate(-45 80 77)"/>
            </g>
          </svg>
          <h1 className="text-2xl font-bold text-white tracking-tight">Toasty</h1>
        </Link>

        {/* Cities Card */}
        <aside className="flex-1 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden min-h-0">
          {renderCitiesPanel(false)}
        </aside>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <aside className="md:hidden fixed left-0 top-0 h-full w-80 bg-black/40 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col">
            {/* Close button */}
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Logo */}
            <Link to="/" onClick={closeMobile} className="px-4 pt-4 pb-3 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="22" fill="white"/>
                <g fill="white">
                  <rect x="46" y="8" width="8" height="16" rx="4"/>
                  <rect x="46" y="76" width="8" height="16" rx="4"/>
                  <rect x="8" y="46" width="16" height="8" rx="4"/>
                  <rect x="76" y="46" width="16" height="8" rx="4"/>
                  <rect x="16" y="16" width="8" height="14" rx="4" transform="rotate(-45 20 23)"/>
                  <rect x="76" y="16" width="8" height="14" rx="4" transform="rotate(45 80 23)"/>
                  <rect x="16" y="70" width="8" height="14" rx="4" transform="rotate(45 20 77)"/>
                  <rect x="76" y="70" width="8" height="14" rx="4" transform="rotate(-45 80 77)"/>
                </g>
              </svg>
              <h1 className="text-2xl font-bold text-white tracking-tight">Toasty</h1>
            </Link>

            {/* Cities section */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {renderCitiesPanel(true)}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
