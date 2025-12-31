import PropTypes from 'prop-types';
import { X, Clock, MapPin, ExternalLink, Newspaper, AlertTriangle } from 'lucide-react';
import { getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';
import { formatNewsTime } from '../../hooks/useWeatherNews';

/**
 * AlertsNewsModal - Full-screen modal showing alerts and weather news
 */
export default function AlertsNewsModal({ alerts, news, cityName, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass max-w-2xl w-full max-h-[85vh] overflow-hidden rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Alerts & Weather News</h2>
            <p className="text-xs text-white/50">{cityName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Alerts Section */}
          {alerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Active Alerts ({alerts.length})
                </h3>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => {
                  const colors = getAlertColor(alert.severity);
                  const icon = getAlertIcon(alert.event);

                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}
                    >
                      {/* Alert Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold ${colors.text}`}>{alert.event}</h4>
                          <p className="text-[10px] text-white/50">
                            {alert.severity} • {alert.urgency}
                          </p>
                        </div>
                      </div>

                      {/* Headline */}
                      {alert.headline && (
                        <p className="text-xs text-white/80 mb-2">{alert.headline}</p>
                      )}

                      {/* Time and Area */}
                      <div className="flex flex-wrap gap-3 text-[10px] text-white/50 mb-2">
                        {alert.expires && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Expires: {alert.expires.toLocaleString()}</span>
                          </div>
                        )}
                        {alert.areaDesc && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{alert.areaDesc}</span>
                          </div>
                        )}
                      </div>

                      {/* Description (collapsible could be added later) */}
                      {alert.description && (
                        <details className="text-xs text-white/70">
                          <summary className="cursor-pointer text-white/50 hover:text-white/70 mb-1">
                            View full details
                          </summary>
                          <p className="whitespace-pre-wrap leading-relaxed mt-2 pl-2 border-l-2 border-white/10">
                            {alert.description}
                          </p>
                        </details>
                      )}

                      {/* Instructions */}
                      {alert.instruction && (
                        <div className="mt-3 p-2 rounded-lg bg-white/5">
                          <p className="text-[10px] font-semibold text-white/60 uppercase mb-1">
                            What to do
                          </p>
                          <p className="text-xs text-white/80 whitespace-pre-wrap">
                            {alert.instruction}
                          </p>
                        </div>
                      )}

                      {/* Source */}
                      {alert.senderName && (
                        <p className="text-[9px] text-white/30 mt-2">
                          Source: {alert.senderName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Weather News Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                Weather News
              </h3>
            </div>

            {news.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs">
                No weather news available
              </div>
            ) : (
              <div className="space-y-2">
                {news.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {item.imageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-xs text-white/50 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/40">
                          {item.source && <span>{item.source}</span>}
                          {item.source && item.publishedAt && <span>•</span>}
                          {item.publishedAt && <span>{formatNewsTime(item.publishedAt)}</span>}
                          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <p className="text-[10px] text-white/30 text-center">
            Alerts: National Weather Service • News: NewsData.io
          </p>
        </div>
      </div>
    </div>
  );
}

AlertsNewsModal.propTypes = {
  alerts: PropTypes.array.isRequired,
  news: PropTypes.array.isRequired,
  cityName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
