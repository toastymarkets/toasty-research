import PropTypes from 'prop-types';

/**
 * WidgetGridV2 - Apple Weather inspired grid layout with explicit areas
 * Uses CSS Grid with named template areas for precise widget placement
 * Supports widget expansion via expandedWidget prop
 */
export default function WidgetGridV2({ children, className = '', expandedWidget = null }) {
  // Build class name with expansion modifier
  const gridClassName = [
    'widget-grid-v2',
    'grid gap-2 w-full max-w-full overflow-hidden',
    expandedWidget === 'discussion' && 'discussion-expanded',
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
  expandedWidget: PropTypes.string,
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
 */
function WidgetGridArea({ area, children, className = '' }) {
  return (
    <div
      className={`min-w-0 h-full ${className}`}
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
