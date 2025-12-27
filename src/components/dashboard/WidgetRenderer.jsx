import { Suspense, useState } from 'react';
import { X, GripVertical, RefreshCw } from 'lucide-react';
import { getWidget } from '../../config/WidgetRegistry';
import { CITY_BY_SLUG } from '../../config/cities';

/**
 * WidgetRenderer
 * Resolves city props and renders the widget component with a wrapper
 * Includes drag handle for react-grid-layout and replace button
 */
export default function WidgetRenderer({
  widgetInstance,
  citySlug,
  onRemove,
  onReplace,
  className = ''
}) {
  const [isHovered, setIsHovered] = useState(false);

  const widgetConfig = getWidget(widgetInstance.widgetId);
  const city = CITY_BY_SLUG[citySlug];

  if (!widgetConfig || !city) {
    return (
      <div className="h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
        Widget not found: {widgetInstance.widgetId}
      </div>
    );
  }

  const Component = widgetConfig.component;

  // Resolve props based on widget requirements
  const resolveProps = () => {
    const props = {};

    widgetConfig.requiredProps.forEach(prop => {
      switch (prop) {
        case 'stationId':
          props.stationId = city.stationId;
          break;
        case 'cityName':
          props.cityName = city.name;
          break;
        case 'citySlug':
          props.citySlug = citySlug;
          break;
        case 'cityId':
          props.cityId = city.id;
          break;
        default:
          console.warn(`Unknown prop: ${prop}`);
      }
    });

    return props;
  };

  const widgetProps = resolveProps();

  return (
    <div
      className={`relative h-full bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Widget controls - show on hover */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {onReplace && (
            <button
              onClick={() => onReplace(widgetInstance.id)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-500 transition-colors"
              title="Replace widget"
            >
              <RefreshCw size={14} />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(widgetInstance.id)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
              title="Remove widget"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Widget content - scrollable if needed */}
      <div className="flex-1 overflow-auto p-5">
        <Suspense
          fallback={
            <div className="py-8 flex items-center justify-center">
              <RefreshCw size={16} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400 ml-2">Loading widget...</span>
            </div>
          }
        >
          <Component {...widgetProps} />
        </Suspense>
      </div>
    </div>
  );
}
