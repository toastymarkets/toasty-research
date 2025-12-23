import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WIDGET_REGISTRY, getAllWidgets } from '../config/WidgetRegistry';

const DashboardContext = createContext(null);

const STORAGE_KEY = 'toasty_research_dashboard_v4'; // v4 for 3-column layout

// Default layout with grid positions (12-column grid, w=4 allows 3 per row)
const createDefaultLayout = () => ({
  widgets: [
    // Row 1 - 3 widgets
    { id: 'live-market-brackets-1', widgetId: 'live-market-brackets', x: 0, y: 0, w: 4, h: 5, visible: true },
    { id: 'live-station-data-1', widgetId: 'live-station-data', x: 4, y: 0, w: 4, h: 5, visible: true },
    { id: 'forecast-models-1', widgetId: 'forecast-models', x: 8, y: 0, w: 4, h: 5, visible: true },
    // Row 2 - 3 widgets
    { id: 'nws-hourly-forecast-1', widgetId: 'nws-hourly-forecast', x: 0, y: 5, w: 4, h: 5, visible: true },
    { id: 'forecast-discussion-1', widgetId: 'forecast-discussion', x: 4, y: 5, w: 4, h: 4, visible: true },
    { id: 'daily-summary-1', widgetId: 'daily-summary', x: 8, y: 5, w: 4, h: 4, visible: true },
    // Row 3
    { id: 'nearby-stations-map-1', widgetId: 'nearby-stations-map', x: 0, y: 9, w: 4, h: 5, visible: true },
  ],
});

// Migrate old format (column/order/size) to new format (x/y/w/h)
const migrateLayout = (oldLayout) => {
  if (!oldLayout?.widgets) return createDefaultLayout();

  // Check if already in new format
  if (oldLayout.widgets[0]?.x !== undefined) {
    // Already migrated - but update to 3-column widths if still using old 6-width
    const needsWidthUpdate = oldLayout.widgets.some(w => w.w === 6);
    if (needsWidthUpdate) {
      return {
        widgets: oldLayout.widgets.map(w => ({
          ...w,
          w: 4, // Update to third-width
          x: w.x === 6 ? 4 : w.x, // Shift old column 2 to middle
        }))
      };
    }
    return oldLayout;
  }

  // Group widgets by column (old format)
  const col0 = oldLayout.widgets.filter(w => w.column === 0).sort((a, b) => a.order - b.order);
  const col1 = oldLayout.widgets.filter(w => w.column === 1).sort((a, b) => a.order - b.order);

  const migratedWidgets = [];
  let y0 = 0;
  let y1 = 0;

  // Migrate column 0 widgets to x: 0 (third width)
  col0.forEach(w => {
    const config = WIDGET_REGISTRY[w.widgetId] || {};
    const h = config.defaultH || 5;
    migratedWidgets.push({
      id: w.id,
      widgetId: w.widgetId,
      x: 0,
      y: y0,
      w: 4, // Third width
      h,
      visible: w.visible !== false,
    });
    y0 += h;
  });

  // Migrate column 1 widgets to x: 4 (middle column)
  col1.forEach(w => {
    const config = WIDGET_REGISTRY[w.widgetId] || {};
    const h = config.defaultH || 5;
    migratedWidgets.push({
      id: w.id,
      widgetId: w.widgetId,
      x: 4, // Middle column
      y: y1,
      w: 4, // Third width
      h,
      visible: w.visible !== false,
    });
    y1 += h;
  });

  return { widgets: migratedWidgets };
};

// Find an open position in the grid for a new widget
const findOpenPosition = (widgets, newW, newH) => {
  const COLS = 12;
  const occupiedCells = new Set();

  // Mark all occupied cells
  widgets.forEach(w => {
    for (let x = w.x; x < w.x + w.w; x++) {
      for (let y = w.y; y < w.y + w.h; y++) {
        occupiedCells.add(`${x},${y}`);
      }
    }
  });

  // Find the first position that fits
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= COLS - newW; x++) {
      let fits = true;
      for (let dx = 0; dx < newW && fits; dx++) {
        for (let dy = 0; dy < newH && fits; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) {
            fits = false;
          }
        }
      }
      if (fits) {
        return { x, y };
      }
    }
  }

  // Fallback: place at bottom
  const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
  return { x: 0, y: maxY };
};

export function DashboardProvider({ citySlug, children }) {
  const [layout, setLayout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load layout from localStorage on mount
  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${citySlug}`;

    try {
      // Try current version first
      let saved = localStorage.getItem(storageKey);
      if (saved) {
        setLayout(JSON.parse(saved));
      } else {
        // Start fresh with new default layout
        setLayout(createDefaultLayout());
      }
    } catch {
      setLayout(createDefaultLayout());
    }
    setIsLoading(false);
  }, [citySlug]);

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    if (layout && !isLoading) {
      const storageKey = `${STORAGE_KEY}_${citySlug}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(layout));
      } catch (e) {
        console.error('Failed to save layout:', e);
      }
    }
  }, [layout, citySlug, isLoading]);

  // Handle layout changes from react-grid-layout
  const onLayoutChange = useCallback((newGridLayout) => {
    setLayout(prev => {
      if (!prev) return prev;

      const updatedWidgets = prev.widgets.map(widget => {
        const gridItem = newGridLayout.find(item => item.i === widget.id);
        if (gridItem) {
          return {
            ...widget,
            x: gridItem.x,
            y: gridItem.y,
            w: gridItem.w,
            h: gridItem.h,
          };
        }
        return widget;
      });

      return { ...prev, widgets: updatedWidgets };
    });
  }, []);

  const addWidget = useCallback((widgetId) => {
    const widgetConfig = WIDGET_REGISTRY[widgetId];
    if (!widgetConfig) return;

    const newW = widgetConfig.defaultW || 2;
    const newH = widgetConfig.defaultH || 5;
    const position = findOpenPosition(layout?.widgets || [], newW, newH);

    const newWidget = {
      id: `${widgetId}-${Date.now()}`,
      widgetId,
      x: position.x,
      y: position.y,
      w: newW,
      h: newH,
      visible: true,
    };

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  }, [layout]);

  const removeWidget = useCallback((instanceId) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== instanceId),
    }));
  }, []);

  const replaceWidget = useCallback((instanceId, newWidgetId) => {
    const widgetConfig = WIDGET_REGISTRY[newWidgetId];
    if (!widgetConfig) return;

    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => {
        if (w.id !== instanceId) return w;
        return {
          ...w,
          id: `${newWidgetId}-${Date.now()}`,
          widgetId: newWidgetId,
          // Keep same position and size
        };
      }),
    }));
  }, []);

  const toggleWidget = useCallback((instanceId) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === instanceId ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(createDefaultLayout());
  }, []);

  // Get all visible widgets
  const getWidgets = useCallback(() => {
    if (!layout) return [];
    return layout.widgets.filter(w => w.visible);
  }, [layout]);

  // Get grid layout array for react-grid-layout
  const getGridLayout = useCallback(() => {
    if (!layout) return [];
    return layout.widgets
      .filter(w => w.visible)
      .map(w => {
        return {
          i: w.id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          minW: 1,  // Allow widgets to shrink on small screens
          minH: 2,
        };
      });
  }, [layout]);

  const getAvailableWidgets = useCallback(() => {
    return getAllWidgets();
  }, []);

  const value = {
    layout,
    isLoading,
    addWidget,
    removeWidget,
    replaceWidget,
    toggleWidget,
    resetLayout,
    getWidgets,
    getGridLayout,
    getAvailableWidgets,
    onLayoutChange,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
