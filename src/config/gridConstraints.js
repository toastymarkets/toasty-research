/**
 * Widget Grid Constraint Definitions
 *
 * Defines size requirements and priority for each widget in the dashboard grid.
 * Used by the GridLayoutEngine to compute dynamic layouts.
 */

export const WIDGET_CONSTRAINTS = {
  models: {
    id: 'models',
    collapsed: { cols: 2, rows: 1 }, // Horizontal widget like map
    expanded: { cols: 4, rows: 2 },
    min: { cols: 2, rows: 1 },
    priority: 4, // High priority - key forecast widget
    canHide: false,
  },
  brackets: {
    id: 'brackets',
    collapsed: { cols: 2, rows: 2 },
    expanded: { cols: 3, rows: 2 },
    min: { cols: 2, rows: 2 },
    priority: 5, // Highest - key trading widget
    canHide: false,
  },
  map: {
    id: 'map',
    collapsed: { cols: 2, rows: 1 }, // Wide cinematic
    expanded: { cols: 4, rows: 2 }, // Full mission control view
    min: { cols: 2, rows: 1 },
    priority: 4,
    canHide: false,
  },
  discussion: {
    id: 'discussion',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 4, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 2,
    canHide: false,
  },
  nearby: {
    id: 'nearby',
    collapsed: { cols: 2, rows: 1 }, // ALWAYS 2 cols minimum
    expanded: { cols: 2, rows: 2 },
    min: { cols: 2, rows: 1 }, // Hard constraint
    priority: 2,
    canHide: false,
  },
  alerts: {
    id: 'alerts',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 2, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 3,
    canHide: true, // Can hide when map expanded
  },
  smallstack: {
    id: 'smallstack',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 2, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 1,
    canHide: true, // Can hide when map expanded
    isStack: true,
    stackWidgets: ['wind', 'resolution'],
  },
  pressure: {
    id: 'pressure',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 2, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 1,
    canHide: true,
  },
  visibility: {
    id: 'visibility',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 2, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 1,
    canHide: true,
  },
  rounding: {
    id: 'rounding',
    collapsed: { cols: 1, rows: 1 },
    expanded: { cols: 2, rows: 2 },
    min: { cols: 1, rows: 1 },
    priority: 1,
    canHide: true,
  },
};

/**
 * Responsive breakpoint configurations
 */
export const BREAKPOINTS = {
  desktop: { minWidth: 1025, maxCols: 6, preferredCols: 4 },
  tablet: { minWidth: 641, maxWidth: 1024, maxCols: 4, preferredCols: 3 },
  mobile: { minWidth: 481, maxWidth: 640, maxCols: 2, preferredCols: 2 },
  xs: { maxWidth: 480, maxCols: 1, preferredCols: 1 },
};

/**
 * Default widget order for placement (priority-ordered)
 * Higher priority widgets are placed first to get better positions
 */
export const DEFAULT_WIDGET_ORDER = [
  'brackets',   // Priority 5 - key trading widget
  'models',     // Priority 4 - 2x2 forecast models
  'map',        // Priority 4 - wide satellite
  'alerts',     // Priority 3 - conditionally shown
  'discussion', // Priority 2
  'nearby',     // Priority 2 - must be 2 cols
  'smallstack', // Priority 1
  'pressure',   // Priority 1
  'visibility', // Priority 1
  'rounding',   // Priority 1
];

/**
 * Min-height values for widgets (in pixels)
 * Applied via inline styles or CSS
 */
export const WIDGET_MIN_HEIGHTS = {
  // Small widgets (1x1)
  pressure: 110,
  visibility: 110,
  rounding: 110,

  // Medium widgets
  discussion: 130,
  alerts: 130,
  nearby: 130,
  smallstack: 130,

  // Square widgets (2x2)
  brackets: 268,

  // Horizontal widgets (2x1)
  models: 130,

  // Wide widgets
  map: 130,

  // Expanded heights
  expanded: {
    models: 380,
    brackets: 380,
    discussion: 400,
    map: 280,
    alerts: 320,
    smallstack: 360,
    rounding: 280,
    visibility: 320,
  },
};
