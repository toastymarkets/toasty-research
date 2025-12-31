import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronRight, X, Clock, MapPin } from 'lucide-react';
import { useNWSAlerts, getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';
import GlassWidget from './GlassWidget';

/**
 * Format relative time
 */
const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
  const minutes = Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  if (diff > 0) {
    // Future (expires)
    if (hours > 24) return `Expires in ${Math.floor(hours / 24)}d`;
    if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
    return `Expires in ${minutes}m`;
  } else {
    // Past
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  }
};

/**
 * Alert Detail Modal
 */
function AlertDetailModal({ alert, onClose }) {
  if (!alert) return null;

  const colors = getAlertColor(alert.severity);
  const icon = getAlertIcon(alert.event);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b border-white/10 ${colors.bg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <h2 className={`text-lg font-bold ${colors.text}`}>{alert.event}</h2>
                <p className="text-xs text-white/60">{alert.severity} • {alert.urgency}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Headline */}
          {alert.headline && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Summary</h3>
              <p className="text-sm text-white/80">{alert.headline}</p>
            </div>
          )}

          {/* Time info */}
          <div className="flex flex-wrap gap-4 text-xs text-white/60">
            {alert.onset && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Started: {alert.onset.toLocaleString()}</span>
              </div>
            )}
            {alert.expires && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Expires: {alert.expires.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Area */}
          {alert.areaDesc && (
            <div className="flex items-start gap-2 text-xs text-white/60">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{alert.areaDesc}</span>
            </div>
          )}

          {/* Description */}
          {alert.description && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Details</h3>
              <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                {alert.description}
              </p>
            </div>
          )}

          {/* Instructions */}
          {alert.instruction && (
            <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
              <h3 className={`text-sm font-semibold ${colors.text} mb-1`}>What to do</h3>
              <p className="text-xs text-white/80 whitespace-pre-wrap">
                {alert.instruction}
              </p>
            </div>
          )}

          {/* Source */}
          {alert.senderName && (
            <p className="text-[10px] text-white/40 pt-2 border-t border-white/10">
              Source: {alert.senderName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AlertsWidget - Shows NWS weather alerts
 * If no alerts, shows a "No active alerts" message
 */
export default function AlertsWidget({ lat, lon, cityName }) {
  const { alerts, loading, error } = useNWSAlerts(lat, lon);
  const [selectedAlert, setSelectedAlert] = useState(null);

  if (loading) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="large">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </GlassWidget>
    );
  }

  if (error) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="large">
        <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
          Unable to load alerts
        </div>
      </GlassWidget>
    );
  }

  // No alerts
  if (alerts.length === 0) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="medium">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
            <span className="text-xl">✓</span>
          </div>
          <p className="text-xs font-medium text-white/80">No Active Alerts</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {cityName || 'This area'} has no weather alerts
          </p>
        </div>
      </GlassWidget>
    );
  }

  return (
    <>
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="large">
        <div className="flex-1 overflow-y-auto space-y-2">
          {alerts.slice(0, 3).map((alert) => {
            const colors = getAlertColor(alert.severity);
            const icon = getAlertIcon(alert.event);

            return (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`w-full text-left p-2.5 rounded-lg ${colors.bg} ${colors.border} border transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${colors.text} truncate`}>
                        {alert.event}
                      </span>
                      <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5">
                      {alert.headline || alert.description?.slice(0, 100)}
                    </p>
                    {alert.expires && (
                      <p className="text-[9px] text-white/40 mt-1">
                        {formatTimeAgo(alert.expires)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {alerts.length > 3 && (
            <p className="text-[10px] text-white/40 text-center pt-1">
              +{alerts.length - 3} more alerts
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 mt-2">
          <p className="text-[10px] text-white/40">
            Source: National Weather Service
          </p>
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </>
  );
}

AlertsWidget.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  cityName: PropTypes.string,
};
