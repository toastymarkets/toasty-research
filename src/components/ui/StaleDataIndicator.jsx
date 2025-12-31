import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Format relative time (e.g., "5 min ago", "2 hours ago")
 */
function formatRelativeTime(date) {
  if (!date) return null;

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return then.toLocaleDateString();
}

/**
 * StaleDataIndicator - Shows when data was last updated
 * Highlights stale data with warning color
 */
const StaleDataIndicator = memo(function StaleDataIndicator({
  timestamp,
  staleThresholdMinutes = 10,
  className = '',
}) {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(timestamp));

  // Update relative time every minute
  useEffect(() => {
    setRelativeTime(formatRelativeTime(timestamp));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  const then = new Date(timestamp);
  const diffMin = (new Date() - then) / (1000 * 60);
  const isStale = diffMin > staleThresholdMinutes;

  return (
    <div
      className={`
        flex items-center gap-1.5 text-[10px]
        ${isStale ? 'text-amber-400/80' : 'text-white/40'}
        ${className}
      `}
      title={`Last updated: ${then.toLocaleString()}`}
    >
      {isStale ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      <span>{relativeTime}</span>
    </div>
  );
});

StaleDataIndicator.propTypes = {
  timestamp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  staleThresholdMinutes: PropTypes.number,
  className: PropTypes.string,
};

export default StaleDataIndicator;
