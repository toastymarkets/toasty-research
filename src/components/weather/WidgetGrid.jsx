import PropTypes from 'prop-types';

/**
 * WidgetGrid - Responsive grid layout for weather widgets
 * Apple Weather inspired grid with automatic sizing
 */
export default function WidgetGrid({ children, className = '' }) {
  return (
    <div
      className={`
        grid gap-3
        grid-cols-2
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
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
function WidgetGridItem({ children, span = 1, className = '' }) {
  const spanClasses = {
    1: '',
    2: 'col-span-2',
    3: 'col-span-2 lg:col-span-3',
    4: 'col-span-2 lg:col-span-4',
  };

  return (
    <div className={`${spanClasses[span] || ''} ${className}`}>
      {children}
    </div>
  );
}

WidgetGridItem.propTypes = {
  children: PropTypes.node,
  span: PropTypes.oneOf([1, 2, 3, 4]),
  className: PropTypes.string,
};

WidgetGrid.Item = WidgetGridItem;
