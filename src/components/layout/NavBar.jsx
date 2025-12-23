import { Link } from 'react-router-dom';
import { Sun, Moon, Thermometer } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function NavBar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-lg">
              Toasty Research
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
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
