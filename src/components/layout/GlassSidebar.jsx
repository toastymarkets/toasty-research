import { useState, useEffect, useMemo, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const location = useLocation();

  // Fetch real weather data for all cities
  const { weatherData, loading: weatherLoading, getWeatherForCity } = useAllCitiesWeather();

  // Get market data from context
  const marketsContext = useContext(KalshiMarketsContext);
  const marketsData = marketsContext?.marketsData || {};

  // Helper to check if a market is live (unresolved)
  const isMarketLive = (closeTime) => {
    if (!closeTime) return false;
    const closeDate = closeTime instanceof Date ? closeTime : new Date(closeTime);
    return closeDate > new Date();
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

  // Filter and sort cities - prioritize live markets
  const sortedCities = useMemo(() => {
    const filtered = CITIES.filter(city =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aMarket = marketsData[a.slug];
      const bMarket = marketsData[b.slug];

      const aLive = isMarketLive(aMarket?.closeTime);
      const bLive = isMarketLive(bMarket?.closeTime);

      // Live markets first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Then cities with markets (closed)
      if (a.hasMarket && !b.hasMarket) return -1;
      if (!a.hasMarket && b.hasMarket) return 1;

      // Within same category, sort by volume
      return (bMarket?.totalVolume || 0) - (aMarket?.totalVolume || 0);
    });
  }, [searchQuery, marketsData]);

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
    const hasLiveMarket = isMarketLive(cityMarket?.closeTime);
    const topBracket = cityMarket?.topBrackets?.[0];

    return (
      <Link
        key={city.id}
        to={`/city/${city.slug}`}
        onClick={isMobile ? closeMobile : undefined}
        className={`
          block px-3 py-3 rounded-2xl transition-all relative overflow-hidden
          ${isActive ? 'ring-2 ring-white/30' : 'hover:scale-[1.02]'}
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
              {hasLiveMarket && (
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
            {hasLiveMarket && cityMarket?.topBrackets?.[0] && (
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
            {hasLiveMarket && cityMarket?.topBrackets?.[1] && (
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
            {!hasLiveMarket && weather.humidity != null && (
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
      {/* Search bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-0 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
      </div>

      {/* Cities list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        {sortedCities.length > 0 ? (
          sortedCities.map(city => renderCityItem(city, isMobile))
        ) : (
          <div className="text-center py-8 text-white/40 text-sm">
            No cities found
          </div>
        )}
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

            {/* Cities section */}
            <div className="pt-14 flex-1 min-h-0 overflow-hidden flex flex-col">
              {renderCitiesPanel(true)}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
