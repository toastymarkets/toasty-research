import PropTypes from 'prop-types';

/**
 * WidgetGridV2 - Apple Weather inspired grid layout with explicit areas
 * Uses CSS Grid with named template areas for precise widget placement
 * Supports multiple simultaneous widget expansions via expandedWidgets object
 */
export default function WidgetGridV2({ children, className = '', expandedWidgets = {} }) {
  // Build class name with expansion modifiers for each expanded widget
  const expansionClasses = Object.entries(expandedWidgets)
    .filter(([, isExpanded]) => isExpanded)
    .map(([widgetId]) => `${widgetId}-expanded`);

  const gridClassName = [
    'widget-grid-v2',
    'grid gap-2 w-full max-w-full overflow-hidden',
    ...expansionClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClassName}>
      {children}
    </div>
  );
}

WidgetGridV2.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  expandedWidgets: PropTypes.object,
};

/**
 * Widget area names for grid placement
 */
const GRID_AREAS = {
  models: 'models',
  brackets: 'brackets',
  map: 'map',
  discussion: 'discussion',
  nearby: 'nearby',
  alerts: 'alerts',
  smallstack: 'smallstack', // For stacked small widgets (wind + humidity)
  pressure: 'pressure',
  visibility: 'visibility',
  forecast: 'forecast',
  rounding: 'rounding',
};

/**
 * WidgetGridV2.Area - Places widget in a named grid area
 * Supports expansion via isExpanded prop with size control
 * When expanded, the widget keeps its grid area but spans more cells via CSS
 */
function WidgetGridArea({ area, children, className = '', isExpanded = false, expansionSize = 'medium' }) {
  // Build expansion-specific class name for CSS targeting
  const expansionClass = isExpanded ? `widget-area-${area}-expanded` : '';

  return (
    <div
      className={`min-w-0 h-full widget-expansion-transition ${expansionClass} ${className}`}
      style={{ gridArea: area }}
    >
      {children}
    </div>
  );
}

WidgetGridArea.propTypes = {
  area: PropTypes.oneOf(Object.values(GRID_AREAS)).isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  isExpanded: PropTypes.bool,
  expansionSize: PropTypes.oneOf(['medium', 'large']),
};

WidgetGridV2.Area = WidgetGridArea;
WidgetGridV2.AREAS = GRID_AREAS;

/**
 * WidgetGridV2.Stack - Stacks multiple widgets vertically in one grid cell
 * Useful for placing two widgets in one column
 */
function WidgetGridStack({ children, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 h-full ${className}`}>
      {children}
    </div>
  );
}

WidgetGridStack.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

WidgetGridV2.Stack = WidgetGridStack;
