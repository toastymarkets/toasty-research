import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCcw, Clock } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { useNWSWeather } from '../../hooks/useNWSWeather';
import WidgetRenderer from './WidgetRenderer';
import AddWidgetPanel from './AddWidgetPanel';
import DashboardLayout from './DashboardLayout';
import ResearchNotepad from '../notepad/ResearchNotepad';

/**
 * Hook to get the current local time for a timezone
 */
function useLocalTime(timezone) {
  const [time, setTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }));
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return time;
}

function DashboardContent({ city, citySlug }) {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [replaceWidgetId, setReplaceWidgetId] = useState(null);

  const {
    isLoading,
    addWidget,
    removeWidget,
    replaceWidget,
    resetLayout,
    getWidgets,
  } = useDashboard();

  // Get current weather and local time
  const { weather } = useNWSWeather(city.stationId);
  const localTime = useLocalTime(city.timezone);

  // Convert temperature from Celsius to Fahrenheit
  const currentTempF = weather?.temperature?.value != null
    ? Math.round((weather.temperature.value * 9/5) + 32)
    : null;

  const handleAddWidget = (widgetId) => {
    if (replaceWidgetId) {
      replaceWidget(replaceWidgetId, widgetId);
      setReplaceWidgetId(null);
    } else {
      addWidget(widgetId);
    }
    setShowAddWidget(false);
  };

  const handleReplaceWidget = (instanceId) => {
    setReplaceWidgetId(instanceId);
    setShowAddWidget(true);
  };

  const openAddWidget = () => {
    setReplaceWidgetId(null);
    setShowAddWidget(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const widgets = getWidgets();

  const notepadStorageKey = `toasty_research_notes_v1_city_${citySlug}`;

  return (
    <DashboardLayout
      storageKey={`toasty_city_layout_${citySlug}`}
      notepadSlot={<ResearchNotepad storageKey={notepadStorageKey} />}
    >
      <div className="w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-heading font-bold">{city.name}</h1>
                {currentTempF !== null && (
                  <span className="text-2xl font-bold text-orange-500">{currentTempF}°F</span>
                )}
                <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                  <Clock size={14} />
                  <span className="text-sm font-medium tabular-nums">{localTime}</span>
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Station: {city.stationId} • {city.forecastOffice}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddWidget}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Widget</span>
            </button>
            <button
              onClick={resetLayout}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-card-elevated)] text-[var(--color-text-secondary)] transition-colors"
              title="Reset to default layout"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Dashboard grid - CSS Grid with auto-sizing rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {widgets.map(widget => (
            <WidgetRenderer
              key={widget.id}
              widgetInstance={widget}
              citySlug={citySlug}
              onRemove={removeWidget}
              onReplace={handleReplaceWidget}
            />
          ))}
        </div>
      </div>

      {/* Add/Replace widget modal */}
      {showAddWidget && (
        <AddWidgetPanel
          onAddWidget={handleAddWidget}
          onClose={() => {
            setShowAddWidget(false);
            setReplaceWidgetId(null);
          }}
          isReplacing={!!replaceWidgetId}
        />
      )}
    </DashboardLayout>
  );
}

export default function CityDashboard() {
  const { citySlug } = useParams();
  const city = CITY_BY_SLUG[citySlug];

  if (!city) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">City not found</h1>
          <Link to="/" className="text-orange-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider citySlug={citySlug}>
      <DashboardContent city={city} citySlug={citySlug} />
    </DashboardProvider>
  );
}
