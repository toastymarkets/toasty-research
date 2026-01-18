/**
 * City Layout Store
 * Persists widget layouts per city to localStorage
 */

const STORAGE_KEY_PREFIX = 'toasty_city_layout_v1_';

/**
 * Default layout for city dashboards
 * Uses a 4-column grid system
 * Each item: { i: widgetId, x: col, y: row, w: width, h: height }
 */
const DEFAULT_LAYOUT = [
  // Row 1: Models (2x2) + Brackets (1x2 tall) + Map (2x2)
  { i: 'models', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 2 },
  { i: 'brackets', x: 2, y: 0, w: 1, h: 2, minW: 1, minH: 2, maxW: 2, maxH: 3 },
  { i: 'map', x: 3, y: 0, w: 1, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },

  // Row 3: Discussion (2x2) + Nearby (2x1)
  { i: 'discussion', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  { i: 'nearby', x: 2, y: 2, w: 2, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },

  // Row 4: Wind (1x1) + Resolution (1x1) + Pressure/RainSnow (1x1) + Visibility/Rain (1x1)
  { i: 'wind', x: 2, y: 3, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
  { i: 'resolution', x: 3, y: 3, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },

  // Row 5: Small widgets
  { i: 'pressure', x: 0, y: 4, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
  { i: 'visibility', x: 1, y: 4, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
  { i: 'rounding', x: 2, y: 4, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },

  // Alerts - only shown when there are alerts
  { i: 'alerts', x: 3, y: 4, w: 1, h: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
];

/**
 * Widget size constraints (in grid units)
 * Used to enforce min/max during resize
 */
export const WIDGET_CONSTRAINTS = {
  models: { minW: 1, minH: 1, maxW: 4, maxH: 2 },
  brackets: { minW: 1, minH: 2, maxW: 2, maxH: 3 },
  map: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  discussion: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
  nearby: { minW: 2, minH: 1, maxW: 4, maxH: 2 },
  alerts: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
  wind: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
  resolution: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
  pressure: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
  visibility: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
  rounding: { minW: 1, minH: 1, maxW: 2, maxH: 2 },
};

/**
 * Thresholds for auto-expanding widgets based on size
 * When a widget is resized past these thresholds, it auto-expands
 */
export const EXPANSION_THRESHOLDS = {
  models: { expandW: 3, expandH: 2 },
  brackets: { expandW: 2, expandH: 3 },
  map: { expandW: 2, expandH: 2 },
  discussion: { expandW: 3, expandH: 3 },
  nearby: { expandW: 3, expandH: 2 },
  alerts: { expandW: 2, expandH: 2 },
  wind: { expandW: 2, expandH: 2 },
  resolution: { expandW: 2, expandH: 2 },
  rounding: { expandW: 2, expandH: 2 },
};

/**
 * Get storage key for a city
 */
function getStorageKey(citySlug) {
  return `${STORAGE_KEY_PREFIX}${citySlug}`;
}

/**
 * Get saved layout for a city, or generate default
 * @param {string} citySlug - The city identifier
 * @returns {Array} Layout array for react-grid-layout
 */
export function getCityLayout(citySlug) {
  try {
    const key = getStorageKey(citySlug);
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate layout has required properties
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].i) {
        // Merge with constraints to ensure they're up-to-date
        return parsed.map(item => ({
          ...item,
          ...(WIDGET_CONSTRAINTS[item.i] || {}),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load city layout:', e);
  }

  // Return default layout with constraints
  return DEFAULT_LAYOUT.map(item => ({
    ...item,
    ...(WIDGET_CONSTRAINTS[item.i] || {}),
  }));
}

/**
 * Save layout for a city
 * @param {string} citySlug - The city identifier
 * @param {Array} layout - Layout array from react-grid-layout
 */
export function saveCityLayout(citySlug, layout) {
  try {
    const key = getStorageKey(citySlug);
    // Store only position/size, not constraints (those come from WIDGET_CONSTRAINTS)
    const toStore = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch (e) {
    console.warn('Failed to save city layout:', e);
  }
}

/**
 * Reset layout for a city to default
 * @param {string} citySlug - The city identifier
 */
export function resetCityLayout(citySlug) {
  try {
    const key = getStorageKey(citySlug);
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to reset city layout:', e);
  }
}

/**
 * Get default layout (without loading from storage)
 * @returns {Array} Default layout array
 */
export function getDefaultLayout() {
  return DEFAULT_LAYOUT.map(item => ({
    ...item,
    ...(WIDGET_CONSTRAINTS[item.i] || {}),
  }));
}

/**
 * Check if a widget should be expanded based on its current size
 * @param {string} widgetId - Widget identifier
 * @param {number} w - Current width in grid units
 * @param {number} h - Current height in grid units
 * @returns {boolean} Whether the widget should be in expanded state
 */
export function shouldWidgetBeExpanded(widgetId, w, h) {
  const thresholds = EXPANSION_THRESHOLDS[widgetId];
  if (!thresholds) return false;

  return w >= thresholds.expandW || h >= thresholds.expandH;
}
