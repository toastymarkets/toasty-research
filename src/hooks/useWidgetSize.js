import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Size thresholds for widget content adaptation (in pixels)
 * These determine when widgets should switch between compact/expanded content
 */
const SIZE_THRESHOLDS = {
  // Width thresholds
  compact: 200,    // Below this = ultra compact
  medium: 320,     // Below this = compact, above = medium
  large: 480,      // Above this = full/expanded

  // Height thresholds
  shortHeight: 150,
  mediumHeight: 250,
  tallHeight: 400,
};

/**
 * Widget-specific thresholds for expansion suggestion
 * When both width AND height exceed these, suggest expansion
 */
const WIDGET_EXPANSION_THRESHOLDS = {
  models: { width: 400, height: 280 },
  brackets: { width: 280, height: 350 },
  map: { width: 400, height: 300 },
  discussion: { width: 450, height: 400 },
  nearby: { width: 450, height: 250 },
  wind: { width: 280, height: 200 },
  resolution: { width: 280, height: 200 },
  rounding: { width: 280, height: 200 },
  alerts: { width: 280, height: 200 },
  rain: { width: 280, height: 200 },
  pressure: { width: 280, height: 200 },
  visibility: { width: 280, height: 200 },
};

/**
 * Hook to track widget dimensions using ResizeObserver
 *
 * @param {Object} options - Configuration options
 * @param {string} options.widgetType - Type of widget for threshold lookup
 * @param {Function} options.onExpansionSuggestion - Callback when expansion state should change
 * @returns {Object} - { ref, width, height, sizeClass, shouldBeExpanded }
 */
export function useWidgetSize(options = {}) {
  const { widgetType, onExpansionSuggestion } = options;
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const lastSuggestionRef = useRef(null);

  // Calculate size class based on width
  const sizeClass = (() => {
    if (dimensions.width < SIZE_THRESHOLDS.compact) return 'compact';
    if (dimensions.width < SIZE_THRESHOLDS.medium) return 'medium';
    if (dimensions.width < SIZE_THRESHOLDS.large) return 'large';
    return 'expanded';
  })();

  // Calculate height class
  const heightClass = (() => {
    if (dimensions.height < SIZE_THRESHOLDS.shortHeight) return 'short';
    if (dimensions.height < SIZE_THRESHOLDS.mediumHeight) return 'medium';
    if (dimensions.height < SIZE_THRESHOLDS.tallHeight) return 'tall';
    return 'expanded';
  })();

  // Determine if widget should be expanded based on its size
  const shouldBeExpanded = (() => {
    if (!widgetType) return false;
    const thresholds = WIDGET_EXPANSION_THRESHOLDS[widgetType];
    if (!thresholds) return false;

    return dimensions.width >= thresholds.width && dimensions.height >= thresholds.height;
  })();

  // Notify expansion change
  const handleExpansionSuggestion = useCallback((newSuggestion) => {
    if (onExpansionSuggestion && lastSuggestionRef.current !== newSuggestion) {
      lastSuggestionRef.current = newSuggestion;
      onExpansionSuggestion(newSuggestion);
    }
  }, [onExpansionSuggestion]);

  // Set up ResizeObserver
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    // Initial measurement
    const { width, height } = element.getBoundingClientRect();
    setDimensions({ width, height });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Trigger expansion suggestion callback when shouldBeExpanded changes
  useEffect(() => {
    if (widgetType && onExpansionSuggestion) {
      handleExpansionSuggestion(shouldBeExpanded);
    }
  }, [shouldBeExpanded, widgetType, onExpansionSuggestion, handleExpansionSuggestion]);

  return {
    ref,
    width: dimensions.width,
    height: dimensions.height,
    sizeClass,
    heightClass,
    shouldBeExpanded,
    isCompact: sizeClass === 'compact',
    isMedium: sizeClass === 'medium',
    isLarge: sizeClass === 'large' || sizeClass === 'expanded',
    isShort: heightClass === 'short',
    isTall: heightClass === 'tall' || heightClass === 'expanded',
  };
}

/**
 * Simple hook to just get element dimensions without expansion logic
 */
export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, ...size };
}

export default useWidgetSize;
