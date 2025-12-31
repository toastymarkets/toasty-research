import PropTypes from 'prop-types';

/**
 * GlassWidget - Base container for all weather widgets
 * Apple Weather inspired glass card with header
 */
export default function GlassWidget({
  title,
  icon: Icon,
  size = 'medium',
  className = '',
  children,
  onClick,
}) {
  // Size classes - Apple compact style
  const sizeClasses = {
    small: 'min-h-[120px]',
    medium: 'min-h-[120px]',
    large: 'min-h-[260px]',
  };

  return (
    <div
      className={`
        glass-widget flex flex-col w-full h-full max-w-full overflow-hidden
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Widget header */}
      {title && (
        <div className="widget-header">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          <span>{title}</span>
        </div>
      )}

      {/* Widget content */}
      <div className="widget-content flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

GlassWidget.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
};
