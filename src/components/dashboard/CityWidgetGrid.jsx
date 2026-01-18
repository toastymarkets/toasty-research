import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RotateCcw } from 'lucide-react';
import {
  getCityLayout,
  saveCityLayout,
  resetCityLayout,
  WIDGET_CONSTRAINTS,
  shouldWidgetBeExpanded,
} from '../../stores/cityLayoutStore';

/**
 * Hook to measure container width
 */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureWidth = () => {
      const newWidth = element.offsetWidth;
      if (newWidth > 0) {
        setWidth(newWidth);
      }
    };

    // Initial measurement
    measureWidth();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      measureWidth();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return width;
}

/**
 * CityWidgetGrid - Draggable and resizable widget grid using react-grid-layout
 *
 * Replaces WidgetGridV2 with full drag/drop and resize support.
 * Persists layout to localStorage per city.
 */
export default function CityWidgetGrid({
  citySlug,
  children,
  expandedWidgets = {},
  onExpansionChange,
  absentWidgets = [],
  className = '',
}) {
  const containerRef = useRef(null);
  const width = useContainerWidth(containerRef);

  // Load layout from storage
  const [layout, setLayout] = useState(() => getCityLayout(citySlug));
  const saveTimeoutRef = useRef(null);

  // Determine columns based on width
  // More aggressive breakpoints to use 4 columns earlier
  const cols = useMemo(() => {
    if (width < 400) return 1;
    if (width < 550) return 2;
    if (width < 700) return 3;
    return 4;
  }, [width]);

  // Filter out absent widgets from layout and adjust for current column count
  const filteredLayout = useMemo(() => {
    return layout
      .filter(item => !absentWidgets.includes(item.i))
      .map(item => ({
        ...item,
        // Clamp x and w to fit current column count
        x: Math.min(item.x, cols - 1),
        w: Math.min(item.w, cols),
      }));
  }, [layout, absentWidgets, cols]);

  // Debounced save to localStorage
  const debouncedSave = useCallback((newLayout) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCityLayout(citySlug, newLayout);
    }, 500);
  }, [citySlug]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    // Merge new positions with existing constraints
    const mergedLayout = newLayout.map(item => ({
      ...item,
      ...(WIDGET_CONSTRAINTS[item.i] || {}),
    }));
    setLayout(mergedLayout);
    debouncedSave(mergedLayout);
  }, [debouncedSave]);

  // Handle resize stop - check if widget should auto-expand
  const handleResizeStop = useCallback((currentLayout, oldItem, newItem) => {
    if (onExpansionChange) {
      const shouldBeExpanded = shouldWidgetBeExpanded(newItem.i, newItem.w, newItem.h);
      const currentlyExpanded = expandedWidgets[newItem.i] || false;

      if (shouldBeExpanded !== currentlyExpanded) {
        onExpansionChange(newItem.i, shouldBeExpanded);
      }
    }
  }, [onExpansionChange, expandedWidgets]);

  // Reset layout to default
  const handleResetLayout = useCallback(() => {
    resetCityLayout(citySlug);
    setLayout(getCityLayout(citySlug));
  }, [citySlug]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Map children to grid items
  const gridItems = useMemo(() => {
    const childArray = Array.isArray(children) ? children : [children];
    return childArray
      .filter(Boolean)
      .map(child => {
        // Get the widget ID from the child's area prop or key
        const widgetId = child.props?.area || child.key;
        if (!widgetId || absentWidgets.includes(widgetId)) {
          return null;
        }
        return (
          <div key={widgetId} className="city-widget-grid-item relative">
            {/* Invisible drag handle overlay at top of widget */}
            <div className="widget-drag-handle" />
            {child}
          </div>
        );
      })
      .filter(Boolean);
  }, [children, absentWidgets]);

  return (
    <div ref={containerRef} className={`city-widget-grid relative ${className}`}>
      {/* Reset button */}
      <button
        onClick={handleResetLayout}
        className="absolute -top-10 right-0 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/60 hover:text-white/90 bg-black/20 hover:bg-black/40 rounded-lg transition-all"
        title="Reset layout to default"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Layout</span>
      </button>

      <GridLayout
        className="layout"
        layout={filteredLayout}
        cols={cols}
        rowHeight={140}
        width={width}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        isDraggable={cols > 1}
        isResizable={cols > 1}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={handleLayoutChange}
        onResizeStop={handleResizeStop}
      >
        {gridItems}
      </GridLayout>
    </div>
  );
}

CityWidgetGrid.propTypes = {
  citySlug: PropTypes.string.isRequired,
  children: PropTypes.node,
  expandedWidgets: PropTypes.object,
  onExpansionChange: PropTypes.func,
  absentWidgets: PropTypes.array,
  className: PropTypes.string,
};

/**
 * Widget wrapper component - provides drag handle and consistent styling
 */
export function CityWidget({ id, children, className = '' }) {
  return (
    <div className={`city-widget h-full flex flex-col ${className}`}>
      {/* Drag handle - full header area */}
      <div className="widget-drag-handle cursor-grab active:cursor-grabbing" />
      {/* Widget content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

CityWidget.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};
