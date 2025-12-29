import { useState, useEffect } from 'react';
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

  // Filter cities based on search
  const filteredCities = CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if a city is active
  const isCityActive = (citySlug) => location.pathname === `/city/${citySlug}`;

  // Render city item - Apple Weather style with dynamic backgrounds
  const renderCityItem = (city, isMobile = false) => {
    const realWeather = getWeatherForCity(city.slug);
    const weather = realWeather || { temp: '--', condition: 'Loading...' };
    const isActive = isCityActive(city.slug);
    const localTime = getLocalTime(city.timezone);
    const weatherBg = getWeatherBackground(weather.condition, city.timezone);

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

        <div className="relative flex items-start justify-between">
          {/* Left side - City info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {city.slug === 'new-york' && (
                <MapPin className="w-3 h-3 text-white/80 flex-shrink-0" />
              )}
              <span className="text-[15px] font-semibold text-white truncate drop-shadow-sm">
                {city.name}
              </span>
            </div>
            <p className="text-[11px] text-white/70 mt-0.5 drop-shadow-sm">
              {localTime}
            </p>
            <p className="text-[13px] text-white/90 mt-2 drop-shadow-sm">
              {weather.condition}
            </p>
            {weather.humidity != null && (
              <p className="text-[11px] text-white/70 mt-0.5 drop-shadow-sm">
                Humidity: {weather.humidity}%
              </p>
            )}
          </div>

          {/* Right side - Temperature */}
          <span className="text-[36px] font-light text-white leading-none drop-shadow-md">
            {weather.temp != null ? `${weather.temp}°` : '--'}
          </span>
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
        {filteredCities.length > 0 ? (
          filteredCities.map(city => renderCityItem(city, isMobile))
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
