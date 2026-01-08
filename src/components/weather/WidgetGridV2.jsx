import PropTypes from 'prop-types';
import { useGridLayout } from '../../hooks/useGridLayout';

/**
 * WidgetGridV2 - Apple Weather inspired grid layout with dynamic placement
 *
 * Uses a JavaScript layout engine to compute grid positions dynamically,
 * handling any combination of widget expansions automatically.
 */
export default function WidgetGridV2({ children, className = '', expandedWidgets = {} }) {
  // Compute dynamic grid layout based on expansion state
  const { gridStyles, hiddenWidgets, isTransitioning } = useGridLayout(expandedWidgets);

  const gridClassName = [
    'widget-grid-v2',
    'w-full max-w-full overflow-hidden',
    isTransitioning ? 'grid-transitioning' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClassName} style={gridStyles}>
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
  smallstack: 'smallstack', // For stacked small widgets (wind + resolution)
  pressure: 'pressure',
  visibility: 'visibility',
  forecast: 'forecast',
  rounding: 'rounding',
};

/**
 * WidgetGridV2.Area - Places widget in a named grid area
 * The grid engine handles sizing; this just assigns the area name
 */
function WidgetGridArea({ area, children, className = '', isExpanded = false }) {
  return (
    <div
      className={`min-w-0 h-full widget-expansion-transition ${className}`}
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
};

WidgetGridV2.Area = WidgetGridArea;
WidgetGridV2.AREAS = GRID_AREAS;

/**
 * WidgetGridV2.Stack - Stacks multiple widgets vertically in one grid cell
 * Useful for placing two widgets in one column (e.g., wind + resolution)
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
