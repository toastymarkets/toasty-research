import { memo } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorState - Displays error message with optional retry button
 * Use this in widgets and components when API calls fail
 */
const ErrorState = memo(function ErrorState({
  message = 'Something went wrong',
  onRetry,
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <div className={`flex items-center justify-center gap-2 text-sm text-red-400/80 ${className}`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            title="Retry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm text-center text-white/70 max-w-[200px]">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80
                     bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
});

ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default ErrorState;
