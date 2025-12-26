import { Link } from 'react-router-dom';
import { Sun, Moon, Thermometer, FileText, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../context/SidebarContext';

export default function NavBar() {
  const { isDark, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={toggleMobile}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-semibold text-lg">
                Toasty Research
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Research link */}
            <Link
              to="/research"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-card-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Research</span>
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-[var(--color-text-secondary)]" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
