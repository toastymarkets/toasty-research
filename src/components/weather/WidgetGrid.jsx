import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * WidgetGrid - Responsive grid layout for weather widgets
 * Apple Weather inspired grid with automatic sizing
 */
export default function WidgetGrid({ children, className = '' }) {
  return (
    <div
      className={`
        grid gap-2 items-stretch w-full max-w-full overflow-hidden
        grid-cols-1
        xs:grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}

WidgetGrid.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * WidgetGrid.Item - Wrapper for grid items with size control
 */
const WidgetGridItem = memo(function WidgetGridItem({ children, span = 1, className = '' }) {
  // On mobile (grid-cols-1), all items are full width
  // On xs+ (grid-cols-2), span-2 items take full width
  // On sm+ (grid-cols-3), span-2 items take 2 cols, span-3 takes full
  // On lg+ (grid-cols-4), all spans work as expected
  const spanClasses = {
    1: '',
    2: 'xs:col-span-2',
    3: 'xs:col-span-2 sm:col-span-3',
    4: 'xs:col-span-2 sm:col-span-3 lg:col-span-4',
  };

  return (
    <div className={`${spanClasses[span] || ''} h-full w-full ${className}`}>
      {children}
    </div>
  );
});

WidgetGridItem.propTypes = {
  children: PropTypes.node,
  span: PropTypes.oneOf([1, 2, 3, 4]),
  className: PropTypes.string,
};

WidgetGrid.Item = WidgetGridItem;
