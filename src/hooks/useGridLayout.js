/**
 * useGridLayout - React hook for dynamic grid layout computation
 *
 * Recomputes layout when expansion state changes or window resizes.
 * Uses the GridLayoutEngine for bin-packing algorithm.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { gridLayoutEngine, getBreakpoint } from '../utils/gridLayoutEngine';

/**
 * useGridLayout - Main hook for computing dynamic grid layout
 * @param {Object} expandedWidgets - { widgetId: boolean } expansion state
 * @param {Array} absentWidgets - Widget IDs that should not be rendered
 * @returns {Object} { gridStyles, areaMap, hiddenWidgets, isTransitioning }
 */
export function useGridLayout(expandedWidgets, absentWidgets = []) {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debounced resize handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewportWidth(window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Track previous layout for transition detection
  const [previousAreas, setPreviousAreas] = useState(null);

  // Compute layout when dependencies change
  const layout = useMemo(() => {
    return gridLayoutEngine.computeLayout(expandedWidgets, viewportWidth, absentWidgets);
  }, [expandedWidgets, viewportWidth, absentWidgets]);

  // Detect layout changes and trigger transition
  useEffect(() => {
    if (previousAreas && previousAreas !== layout.gridStyles.gridTemplateAreas) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timeout);
    }
    setPreviousAreas(layout.gridStyles.gridTemplateAreas);
  }, [layout.gridStyles.gridTemplateAreas, previousAreas]);

  return {
    ...layout,
    isTransitioning,
  };
}

/**
 * useBreakpoint - Hook to get current responsive breakpoint
 * @returns {string} 'desktop' | 'tablet' | 'mobile' | 'xs'
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'desktop'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setBreakpoint(getBreakpoint(window.innerWidth));
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
}

/**
 * useWidgetVisibility - Hook to check if a widget should be visible
 * @param {string} widgetId - The widget ID to check
 * @param {Array} hiddenWidgets - Array of hidden widget IDs from layout
 * @returns {boolean} Whether the widget should be visible
 */
export function useWidgetVisibility(widgetId, hiddenWidgets) {
  return useMemo(() => {
    return !hiddenWidgets?.includes(widgetId);
  }, [widgetId, hiddenWidgets]);
}
