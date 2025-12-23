import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Clock, ExternalLink } from 'lucide-react';
import { useNWSForecastDiscussion } from '../../hooks/useNWSWeather';

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export default function ForecastDiscussion({ cityId }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const { discussion, loading, error } = useNWSForecastDiscussion(cityId);

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-dark-border-strong border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
          <span className="text-sm">Loading forecast discussion...</span>
        </div>
      </div>
    );
  }

  if (error || !discussion) return null;

  const { parsed, summary, issuanceTime, officeName } = discussion;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-3 group">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">NWS Forecast Discussion</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          )}
        </button>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(issuanceTime)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {summary && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
          )}

          <div>
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {showFullText ? 'Hide' : 'Show'} full discussion
              {showFullText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showFullText && parsed?.rawText && (
              <pre className="mt-3 p-3 bg-gray-50 dark:bg-dark-elevated rounded-lg text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {parsed.rawText}
              </pre>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">NWS {officeName}</span>
            <a
              href={`https://forecast.weather.gov/product.php?site=${officeName}&issuedby=${officeName}&product=AFD`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
            >
              View on NWS
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
