import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin,
  ChevronLeft,
  ChevronDown,
  X,
  Cloud,
  Snowflake,
  Wind,
  HelpCircle,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { getAllResearchNotes } from '../../utils/researchLogUtils';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../hooks/useTheme';

export default function Sidebar() {
  const {
    isCollapsed,
    toggleCollapse,
    isMobileOpen,
    closeMobile,
    toggleMobile,
  } = useSidebar();
  const { isDark, toggleTheme } = useTheme();

  const [notes, setNotes] = useState([]);
  const [isMarketsExpanded, setIsMarketsExpanded] = useState(true);
  const location = useLocation();

  // Load notes on mount and when route changes
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

  // Check if route is active
  const isActive = (path) => location.pathname === path;
  const isCityActive = (citySlug) => location.pathname === `/city/${citySlug}`;
  const isNoteActive = (note) => location.pathname === `/research/${note.type}/${note.slug}`;

  // Helper to get weather icon
  const getWeatherIcon = (type) => {
    const icons = {
      Temperature: Thermometer,
      Rain: Cloud,
      Snow: Snowflake,
      Wind: Wind,
      General: HelpCircle,
    };
    return icons[type] || HelpCircle;
  };

  // Helper to get link classes
  const linkClasses = (isActive) => {
    const base = 'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors';
    if (isActive) {
      return `${base} bg-orange-500/10 text-orange-500 font-medium`;
    }
    return `${base} text-[var(--color-text-secondary)] hover:bg-[var(--color-card-elevated)]`;
  };

  // Render sidebar content
  const renderSidebarContent = (isMobile = false) => (
    <div className="h-full flex flex-col">
      {/* Logo header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={isMobile ? closeMobile : undefined}
        >
          <img src="/logo.svg" alt="Toasty" className="w-8 h-8 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="font-heading font-semibold text-lg">
              Toasty
            </span>
          )}
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Markets section */}
      <section>
        {(!isCollapsed || isMobile) && (
          <button
            onClick={() => setIsMarketsExpanded(!isMarketsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                       hover:bg-[var(--color-card-elevated)] transition-colors group"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Markets
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 ${
                isMarketsExpanded ? '' : '-rotate-90'
              }`}
            />
          </button>
        )}
        {isMarketsExpanded && (
          <nav className="space-y-1 mt-2">
            {MARKET_CITIES.map((city) => (
              <Link
                key={city.id}
                to={`/city/${city.slug}`}
                className={linkClasses(isCityActive(city.slug))}
                onClick={isMobile ? closeMobile : undefined}
                title={isCollapsed && !isMobile ? city.name : undefined}
              >
                <MapPin className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span>{city.name}</span>}
              </Link>
            ))}
          </nav>
        )}
      </section>

      {/* Research notes section */}
      <section>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Research
            </h3>
            <Link
              to="/research"
              className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
              onClick={isMobile ? closeMobile : undefined}
            >
              View All
            </Link>
          </div>
        )}

        {notes.length === 0 ? (
          (!isCollapsed || isMobile) && (
            <p className="text-xs text-[var(--color-text-muted)] italic px-3">
              No notes yet
            </p>
          )
        ) : (
          <nav className="space-y-1">
            {notes.map((note) => {
              const Icon = getWeatherIcon(note.weatherType);
              const path = `/research/${note.type}/${note.slug}`;
              return (
                <Link
                  key={note.id}
                  to={path}
                  className={linkClasses(isNoteActive(note))}
                  onClick={isMobile ? closeMobile : undefined}
                  title={isCollapsed && !isMobile ? note.topic : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{note.topic}</div>
                      <div className="text-xs text-[var(--color-text-muted)] truncate">
                        {note.location}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </section>
      </div>

      {/* Theme toggle footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg
                     text-[var(--color-text-secondary)] hover:bg-[var(--color-card-elevated)]
                     transition-colors ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isCollapsed && !isMobile ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDark ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          {(!isCollapsed || isMobile) && (
            <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button - hidden when sidebar is open */}
      {!isMobileOpen && (
        <button
          onClick={toggleMobile}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg
                     bg-[var(--color-card-bg)] border border-[var(--color-border)]
                     hover:bg-[var(--color-card-elevated)] transition-colors shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:block
          fixed left-0 top-0 h-screen
          bg-[var(--color-card-bg)] border-r border-[var(--color-border)]
          z-40 transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-4 w-6 h-6 rounded-full
                     bg-[var(--color-card-bg)] border border-[var(--color-border)]
                     flex items-center justify-center hover:border-orange-500
                     transition-colors z-10"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Sidebar content */}
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <aside
            className="md:hidden fixed left-0 top-0 h-full w-72
                       bg-[var(--color-bg)] z-50
                       transform transition-transform duration-300 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 rounded-lg
                        hover:bg-[var(--color-card-elevated)] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar content (always expanded on mobile) */}
            <div className="pt-16">
              {renderSidebarContent(true)}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
