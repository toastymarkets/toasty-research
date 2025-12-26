import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCcw, Clock } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { CITY_BY_SLUG } from '../../config/cities';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { useNWSWeather } from '../../hooks/useNWSWeather';
import WidgetRenderer from './WidgetRenderer';
import AddWidgetPanel from './AddWidgetPanel';
import DashboardLayout, { usePanelResize } from './DashboardLayout';
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

// Hook to measure container width with dynamic updates
function useContainerWidth(ref, resizeSignal) {
  const [width, setWidth] = useState(null);

  // Re-measure when resize signal changes
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureWidth = () => {
      const newWidth = element.offsetWidth;
      if (newWidth > 0) {
        setWidth(newWidth);
      }
    };

    // Measure after a small delay to ensure DOM has updated
    const timeoutId = setTimeout(measureWidth, 16);
    return () => clearTimeout(timeoutId);
  }, [resizeSignal]);

  // Initial measurement with delay and ResizeObserver
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureWidth = () => {
      const newWidth = element.offsetWidth;
      if (newWidth > 0) {
        setWidth(newWidth);
      }
    };

    // Initial measurement with delay to ensure layout is complete
    const initialTimeout = setTimeout(measureWidth, 100);

    const resizeObserver = new ResizeObserver(() => {
      measureWidth();
    });
    resizeObserver.observe(element);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  // Return measured width or fallback
  return width || ref.current?.offsetWidth || 800;
}

function DashboardContent({ city, citySlug }) {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [replaceWidgetId, setReplaceWidgetId] = useState(null);
  const containerRef = useRef(null);
  const resizeSignal = usePanelResize();
  const width = useContainerWidth(containerRef, resizeSignal);

  const {
    isLoading,
    addWidget,
    removeWidget,
    replaceWidget,
    resetLayout,
    getWidgets,
    getGridLayout,
    onLayoutChange,
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
  const gridLayout = getGridLayout();

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

        {/* Dashboard grid */}
        <div ref={containerRef} className="dashboard-grid">
          <GridLayout
            className="layout"
            layout={gridLayout}
            cols={12}
            rowHeight={80}
            width={width || 1200}
            isDraggable={false}
            isResizable={false}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            compactType="vertical"
          >
            {widgets.map(widget => (
              <div key={widget.id} className="widget-grid-item">
                <WidgetRenderer
                  widgetInstance={widget}
                  citySlug={citySlug}
                  onRemove={removeWidget}
                  onReplace={handleReplaceWidget}
                />
              </div>
            ))}
          </GridLayout>
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
