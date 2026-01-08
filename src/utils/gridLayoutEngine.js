/**
 * GridLayoutEngine - Computes dynamic grid layouts based on widget constraints
 *
 * Uses a bin-packing algorithm to place widgets in a CSS Grid layout,
 * respecting size constraints and priorities.
 */

import {
  WIDGET_CONSTRAINTS,
  BREAKPOINTS,
  DEFAULT_WIDGET_ORDER,
  WIDGET_MIN_HEIGHTS,
} from '../config/gridConstraints';

/**
 * Main entry point: compute layout for given expansion state
 * @param {Object} expandedWidgets - { widgetId: boolean }
 * @param {number} viewportWidth - Current viewport width
 * @returns {Object} { gridStyles, areaMap, hiddenWidgets }
 */
export function computeGridLayout(expandedWidgets, viewportWidth) {
  const breakpoint = getBreakpoint(viewportWidth);
  const maxCols = BREAKPOINTS[breakpoint].preferredCols;

  // Prepare widgets with current sizes
  const widgets = prepareWidgets(expandedWidgets, breakpoint);

  // Place widgets using bin-packing
  const { grid, totalRows, hiddenWidgets } = placeWidgets(widgets, maxCols, expandedWidgets);

  // Generate CSS grid-template-areas string
  const gridTemplateAreas = generateGridTemplateAreas(grid, totalRows, maxCols);

  return {
    gridStyles: {
      display: 'grid',
      gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
      gridTemplateRows: `repeat(${totalRows}, auto)`,
      gridTemplateAreas,
      gap: '8px',
    },
    areaMap: getAreaMap(grid),
    hiddenWidgets,
    breakpoint,
    totalCols: maxCols,
    totalRows,
  };
}

/**
 * Get current breakpoint based on viewport width
 */
export function getBreakpoint(width) {
  if (width <= BREAKPOINTS.xs.maxWidth) return 'xs';
  if (width <= BREAKPOINTS.mobile.maxWidth) return 'mobile';
  if (width <= BREAKPOINTS.tablet.maxWidth) return 'tablet';
  return 'desktop';
}

/**
 * Prepare widgets with their current sizes based on expansion state
 */
function prepareWidgets(expandedWidgets, breakpoint) {
  const maxCols = BREAKPOINTS[breakpoint].maxCols;

  return DEFAULT_WIDGET_ORDER.map(widgetId => {
    const constraint = WIDGET_CONSTRAINTS[widgetId];
    if (!constraint) return null;

    const isExpanded = expandedWidgets[widgetId] || false;
    let size = isExpanded
      ? { ...constraint.expanded }
      : { ...constraint.collapsed };

    // Clamp to max columns for breakpoint
    size.cols = Math.min(size.cols, maxCols);

    // For very small breakpoints, adjust sizes
    if (breakpoint === 'xs') {
      size.cols = 1;
      // Keep row spans for important widgets
      if (!['brackets', 'smallstack'].includes(widgetId)) {
        size.rows = Math.min(size.rows, 2);
      }
    } else if (breakpoint === 'mobile') {
      // Mobile: max 2 cols
      size.cols = Math.min(size.cols, 2);
    }

    return {
      id: widgetId,
      size,
      min: constraint.min,
      priority: constraint.priority,
      isExpanded,
      canHide: constraint.canHide,
    };
  }).filter(Boolean);
}

/**
 * Place widgets using a bin-packing algorithm
 * Uses first-fit decreasing approach with priority ordering
 */
function placeWidgets(widgets, maxCols, expandedWidgets) {
  // Sort by priority (higher first), then by area (larger first)
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.size.cols * b.size.rows) - (a.size.cols * a.size.rows);
  });

  // Calculate total area needed
  const totalArea = sortedWidgets.reduce(
    (sum, w) => sum + w.size.cols * w.size.rows,
    0
  );
  const estimatedRows = Math.ceil(totalArea / maxCols) + 4;

  // Initialize grid
  const grid = [];
  for (let i = 0; i < estimatedRows; i++) {
    grid.push(new Array(maxCols).fill(null));
  }

  const placements = new Map();
  const hiddenWidgets = [];

  // Check if we need to hide widgets (e.g., map expanded takes extra space)
  const needsHiding = shouldHideWidgets(expandedWidgets, maxCols);

  // Place each widget
  for (const widget of sortedWidgets) {
    // Check if widget should be hidden
    if (needsHiding && widget.canHide && shouldHideWidget(widget.id, expandedWidgets)) {
      hiddenWidgets.push(widget.id);
      continue;
    }

    const placement = findPlacement(grid, widget.size, maxCols);
    if (placement) {
      markPlacement(grid, widget.id, placement);
      placements.set(widget.id, placement);
    } else {
      // If no space found, add new rows and place
      const newRow = grid.length;
      for (let i = 0; i < widget.size.rows; i++) {
        grid.push(new Array(maxCols).fill(null));
      }
      const newPlacement = {
        startRow: newRow,
        startCol: 0,
        endRow: newRow + widget.size.rows,
        endCol: widget.size.cols,
      };
      markPlacement(grid, widget.id, newPlacement);
      placements.set(widget.id, newPlacement);
    }
  }

  // Trim empty rows from bottom
  while (grid.length > 1 && grid[grid.length - 1].every(cell => cell === null)) {
    grid.pop();
  }

  return {
    grid,
    totalRows: grid.length,
    placements,
    hiddenWidgets,
  };
}

/**
 * Check if we need to hide any widgets based on current expansion state
 */
function shouldHideWidgets(expandedWidgets, maxCols) {
  // If map is expanded and we're constrained on columns, we may need to hide
  if (expandedWidgets.map && maxCols <= 4) {
    return true;
  }
  // If discussion is expanded (takes 4 cols), we might need to hide
  if (expandedWidgets.discussion && maxCols <= 4) {
    return true;
  }
  return false;
}

/**
 * Determine if a specific widget should be hidden
 */
function shouldHideWidget(widgetId, expandedWidgets) {
  // When map is expanded, hide alerts and smallstack (matches current behavior)
  if (expandedWidgets.map) {
    if (['alerts', 'smallstack'].includes(widgetId)) {
      // But if map + brackets are both expanded, don't hide (they fit)
      if (expandedWidgets.brackets) {
        return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * Find best placement for a widget using first-fit approach
 */
function findPlacement(grid, size, maxCols) {
  const { cols, rows } = size;
  const effectiveCols = Math.min(cols, maxCols);

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col <= maxCols - effectiveCols; col++) {
      if (canPlace(grid, row, col, effectiveCols, rows)) {
        return {
          startRow: row,
          startCol: col,
          endRow: row + rows,
          endCol: col + effectiveCols,
        };
      }
    }
  }

  return null;
}

/**
 * Check if widget can be placed at given position
 */
function canPlace(grid, startRow, startCol, cols, rows) {
  for (let r = startRow; r < startRow + rows; r++) {
    if (r >= grid.length) return false;
    for (let c = startCol; c < startCol + cols; c++) {
      if (grid[r][c] !== null) return false;
    }
  }
  return true;
}

/**
 * Mark grid cells as occupied by widget
 */
function markPlacement(grid, widgetId, placement) {
  const { startRow, startCol, endRow, endCol } = placement;
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      grid[r][c] = widgetId;
    }
  }
}

/**
 * Generate CSS grid-template-areas string from grid
 */
function generateGridTemplateAreas(grid, totalRows, totalCols) {
  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    const row = [];
    for (let c = 0; c < totalCols; c++) {
      row.push(grid[r]?.[c] || '.');
    }
    rows.push(`"${row.join(' ')}"`);
  }
  return rows.join(' ');
}

/**
 * Get list of widget IDs that are placed in the grid
 */
function getAreaMap(grid) {
  const areas = new Set();
  for (const row of grid) {
    for (const cell of row) {
      if (cell) areas.add(cell);
    }
  }
  return Array.from(areas);
}

/**
 * Get min-height for a widget based on its expansion state
 */
export function getWidgetMinHeight(widgetId, isExpanded) {
  if (isExpanded && WIDGET_MIN_HEIGHTS.expanded[widgetId]) {
    return WIDGET_MIN_HEIGHTS.expanded[widgetId];
  }
  return WIDGET_MIN_HEIGHTS[widgetId] || 110;
}

/**
 * Singleton layout engine instance
 */
class GridLayoutEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Compute layout with caching
   */
  computeLayout(expandedWidgets, viewportWidth) {
    const cacheKey = this.getCacheKey(expandedWidgets, viewportWidth);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const layout = computeGridLayout(expandedWidgets, viewportWidth);

    // Keep cache small (max 50 entries)
    if (this.cache.size >= 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, layout);

    return layout;
  }

  getCacheKey(expandedWidgets, viewportWidth) {
    const breakpoint = getBreakpoint(viewportWidth);
    const expandedKeys = Object.entries(expandedWidgets)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .sort()
      .join(',');
    return `${breakpoint}:${expandedKeys}`;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const gridLayoutEngine = new GridLayoutEngine();
