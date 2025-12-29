import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  Menu,
  MapPin,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { CITIES } from '../../config/cities';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { useSidebar } from '../../context/SidebarContext';

// Mock weather data - in production, this would come from a shared context/API
const getMockWeather = (citySlug) => {
  const weathers = {
    'new-york': { temp: 42, high: 45, low: 38, condition: 'Cloudy' },
    'chicago': { temp: 38, high: 40, low: 32, condition: 'Snow' },
    'los-angeles': { temp: 68, high: 72, low: 58, condition: 'Sunny' },
    'miami': { temp: 78, high: 82, low: 71, condition: 'Partly Cloudy' },
    'denver': { temp: 45, high: 52, low: 35, condition: 'Clear' },
    'austin': { temp: 62, high: 68, low: 54, condition: 'Sunny' },
    'philadelphia': { temp: 40, high: 44, low: 35, condition: 'Rain' },
    'houston': { temp: 65, high: 70, low: 58, condition: 'Cloudy' },
    'seattle': { temp: 48, high: 52, low: 44, condition: 'Rain' },
    'san-francisco': { temp: 58, high: 62, low: 52, condition: 'Fog' },
    'boston': { temp: 36, high: 40, low: 30, condition: 'Snow' },
    'washington-dc': { temp: 44, high: 48, low: 38, condition: 'Cloudy' },
    'dallas': { temp: 55, high: 62, low: 48, condition: 'Clear' },
    'detroit': { temp: 34, high: 38, low: 28, condition: 'Snow' },
    'salt-lake-city': { temp: 40, high: 45, low: 32, condition: 'Clear' },
  };
  return weathers[citySlug] || { temp: 50, high: 55, low: 45, condition: 'Clear' };
};

// Get local time for a timezone
const getLocalTime = (timezone) => {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Check if it's daytime in a timezone (between 6am and 8pm)
const isDaytime = (timezone) => {
  const hour = parseInt(new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }));
  return hour >= 6 && hour < 20;
};

// Weather visual overlay component
const WeatherOverlay = ({ condition, isDay }) => {
  const cond = (condition || '').toLowerCase();

  // Snow
  if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/60 rounded-full animate-snow"
            style={{
              left: `${8 + i * 8}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Rain
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-3 bg-white/30 rounded-full animate-rain"
            style={{
              left: `${10 + i * 9}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.6 + Math.random() * 0.3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Fog/Mist
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-2 bg-white/20 rounded-full animate-fog"
            style={{
              top: `${25 + i * 25}%`,
              width: '120%',
              left: '-10%',
              animationDelay: `${i * 2}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Cloudy
  if (cond.includes('cloud') || cond.includes('overcast') || cond.includes('partly')) {
    const cloudCount = cond.includes('partly') ? 2 : 3;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(cloudCount)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-cloud-drift"
            style={{
              top: `${10 + i * 20}%`,
              left: `${50 + i * 15}%`,
              animationDelay: `${i * 3}s`,
              animationDuration: `${20 + i * 5}s`,
            }}
          >
            <svg
              className="w-12 h-8 text-white/25"
              viewBox="0 0 64 40"
              fill="currentColor"
            >
              <ellipse cx="20" cy="28" rx="16" ry="10" />
              <ellipse cx="40" cy="28" rx="18" ry="12" />
              <ellipse cx="30" cy="18" rx="14" ry="10" />
            </svg>
          </div>
        ))}
      </div>
    );
  }

  // Thunder/Storm
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Rain */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`rain-${i}`}
            className="absolute w-0.5 h-3 bg-white/20 rounded-full animate-rain"
            style={{
              left: `${10 + i * 11}%`,
              animationDelay: `${i * 0.12}s`,
              animationDuration: `${0.5 + Math.random() * 0.2}s`,
            }}
          />
        ))}
        {/* Lightning flash */}
        <div className="absolute inset-0 bg-white/10 animate-lightning" />
      </div>
    );
  }

  // Clear/Sunny - show sun or stars
  if (isDay) {
    return (
      <div className="absolute top-2 right-10 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-yellow-300/30 animate-pulse-slow" />
        <div className="absolute inset-1 rounded-full bg-yellow-200/20" />
      </div>
    );
  } else {
    // Night - stars
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle"
            style={{
              top: `${15 + (i * 13) % 50}%`,
              left: `${55 + (i * 17) % 40}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }
};

// Get weather background gradient based on condition and time
const getWeatherBackground = (condition, timezone) => {
  const isDay = isDaytime(timezone);
  const cond = (condition || '').toLowerCase();

  // Snow conditions
  if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) {
    return isDay
      ? 'linear-gradient(135deg, #8BA4B4 0%, #5A7A8A 50%, #4A6A7A 100%)'
      : 'linear-gradient(135deg, #3A4A5A 0%, #2A3A4A 50%, #1A2A3A 100%)';
  }

  // Rain conditions
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) {
    return isDay
      ? 'linear-gradient(135deg, #5A6A7A 0%, #4A5A6A 50%, #3A4A5A 100%)'
      : 'linear-gradient(135deg, #2A3A4A 0%, #1A2A3A 50%, #0A1A2A 100%)';
  }

  // Fog/Mist conditions
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) {
    return isDay
      ? 'linear-gradient(135deg, #9AABBF 0%, #7A8B9F 50%, #6A7B8F 100%)'
      : 'linear-gradient(135deg, #4A5A6A 0%, #3A4A5A 50%, #2A3A4A 100%)';
  }

  // Cloudy conditions
  if (cond.includes('cloud') || cond.includes('overcast')) {
    return isDay
      ? 'linear-gradient(135deg, #6A8AAA 0%, #5A7A9A 50%, #4A6A8A 100%)'
      : 'linear-gradient(135deg, #3A4A5A 0%, #2A3A4A 50%, #1A2A3A 100%)';
  }

  // Partly cloudy
  if (cond.includes('partly')) {
    return isDay
      ? 'linear-gradient(135deg, #5A9AD9 0%, #4A8AC9 50%, #3A7AB9 100%)'
      : 'linear-gradient(135deg, #2A3A5A 0%, #1A2A4A 50%, #0A1A3A 100%)';
  }

  // Thunder/Storm
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) {
    return 'linear-gradient(135deg, #3A4050 0%, #2A3040 50%, #1A2030 100%)';
  }

  // Clear/Sunny (default)
  return isDay
    ? 'linear-gradient(135deg, #4A9EEA 0%, #3A8EDA 50%, #2A7ECA 100%)'
    : 'linear-gradient(135deg, #1A2A4A 0%, #0A1A3A 50%, #050F2A 100%)';
};

export default function GlassSidebar() {
  const { isMobileOpen, closeMobile, toggleMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const location = useLocation();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load notes
  useEffect(() => {
    setNotes(getAllResearchNotes());
  }, [location.pathname]);

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
    const weather = getMockWeather(city.slug);
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
            <p className="text-[11px] text-white/70 mt-0.5 drop-shadow-sm">
              H:{weather.high}° L:{weather.low}°
            </p>
          </div>

          {/* Right side - Temperature */}
          <span className="text-[36px] font-light text-white leading-none drop-shadow-md">
            {weather.temp}°
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

  // Research notes panel content
  const renderNotesPanel = (isMobile = false) => (
    <div className="flex flex-col">
      {/* Header */}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/50" />
          <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
            Research Notes
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-white/40 transition-transform ${
            showNotes ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Notes list */}
      {showNotes && (
        <div className="px-2 pb-2 space-y-0.5">
          {notes.slice(0, 5).map(note => (
            <Link
              key={note.id}
              to={`/research/${note.type}/${note.slug}`}
              onClick={isMobile ? closeMobile : undefined}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FileText className="w-4 h-4 text-white/50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{note.topic}</div>
                <div className="text-[11px] text-white/50 truncate">{note.location}</div>
              </div>
            </Link>
          ))}
          {notes.length > 5 && (
            <Link
              to="/research"
              onClick={isMobile ? closeMobile : undefined}
              className="block text-center text-xs text-apple-blue py-2 hover:underline"
            >
              View all {notes.length} notes
            </Link>
          )}
        </div>
      )}
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

      {/* Desktop Sidebar - Two separate cards */}
      <div className="hidden md:flex fixed left-3 top-3 bottom-3 w-72 flex-col gap-3 z-40">
        {/* Cities Card */}
        <aside className="flex-1 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden min-h-0">
          {renderCitiesPanel(false)}
        </aside>

        {/* Research Notes Card */}
        {notes.length > 0 && (
          <aside className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex-shrink-0">
            {renderNotesPanel(false)}
          </aside>
        )}
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

            {/* Research Notes section - separate area at bottom */}
            {notes.length > 0 && (
              <div className="border-t border-white/10 flex-shrink-0">
                {renderNotesPanel(true)}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
