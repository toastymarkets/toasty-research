import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Check, ChevronRight, X, Maximize2 } from 'lucide-react';
import { useNWSAlerts, getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';

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
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }
  return 'Expired';
};

/**
 * AlertsWidget - Compact NWS weather alerts widget
 * Simple and focused - just shows alerts or "All Clear"
 */
export default function AlertsWidget({ lat, lon, cityName, isExpanded, onToggleExpand }) {
  const { alerts, loading, error, refetch } = useNWSAlerts(lat, lon);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleWidgetClick = () => {
    if (alerts.length === 0) return; // No action if no alerts
    if (isMobile) {
      setIsModalOpen(true);
    } else if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  };

  // Expanded inline view
  if (isExpanded && !isMobile && alerts.length > 0) {
    return (
      <ExpandedAlertsInline
        alerts={alerts}
        cityName={cityName}
        onCollapse={onToggleExpand}
      />
    );
  }

  if (loading) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="medium">
        <div className="flex items-center justify-center h-full">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </GlassWidget>
    );
  }

  if (error) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="medium">
        <ErrorState message={error} onRetry={refetch} compact />
      </GlassWidget>
    );
  }

  // No alerts - compact "All Clear" state
  if (alerts.length === 0) {
    return (
      <GlassWidget title="ALERTS" icon={AlertTriangle} size="medium">
        <div className="flex items-center gap-3 h-full">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">All Clear</p>
            <p className="text-[10px] text-white/40">No active weather alerts</p>
          </div>
        </div>
      </GlassWidget>
    );
  }

  // Has alerts
  const primaryAlert = alerts[0];
  const primaryColors = getAlertColor(primaryAlert.severity);
  const primaryIcon = getAlertIcon(primaryAlert.event);

  return (
    <>
      <GlassWidget
        title="ALERTS"
        icon={AlertTriangle}
        size="medium"
        className="cursor-pointer"
        onClick={handleWidgetClick}
        headerRight={
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded">
              {alerts.length}
            </span>
            {onToggleExpand && (
              <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
            )}
          </div>
        }
      >
        <div className="flex flex-col h-full">
          {/* Primary Alert */}
          <div className={`flex-1 p-2.5 rounded-lg ${primaryColors.bg} ${primaryColors.border} border`}>
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{primaryIcon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${primaryColors.text}`}>
                    {primaryAlert.event}
                  </span>
                  {primaryAlert.expires && (
                    <span className="text-[9px] text-white/40">
                      {formatTimeAgo(primaryAlert.expires)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5 leading-relaxed">
                  {primaryAlert.headline || primaryAlert.description?.slice(0, 100)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional alerts indicator */}
          {alerts.length > 1 && (
            <div className="flex items-center justify-between pt-2 mt-auto text-[10px]">
              <span className="text-white/40">+{alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''}</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
            </div>
          )}
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {isModalOpen && (
        <AlertsDetailModal
          alerts={alerts}
          cityName={cityName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

AlertsWidget.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  cityName: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedAlertsInline - Inline expanded view
 */
function ExpandedAlertsInline({ alerts, cityName, onCollapse }) {
  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Weather Alerts</span>
          <span className="text-xs text-white/40">{cityName}</span>
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded">
            {alerts.length}
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
        </button>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.map((alert) => {
          const colors = getAlertColor(alert.severity);
          const icon = getAlertIcon(alert.event);
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${colors.text}`}>
                      {alert.event}
                    </span>
                    {alert.expires && (
                      <span className="text-[10px] text-white/40">
                        Expires in {formatTimeAgo(alert.expires)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-1 line-clamp-4">
                    {alert.headline || alert.description?.slice(0, 300)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/40">
        Source: National Weather Service
      </div>
    </div>
  );
}

ExpandedAlertsInline.propTypes = {
  alerts: PropTypes.array.isRequired,
  cityName: PropTypes.string,
  onCollapse: PropTypes.func.isRequired,
};

/**
 * AlertsDetailModal - Full alerts detail modal
 */
function AlertsDetailModal({ alerts, cityName, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[21.25rem] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Weather Alerts</h2>
                <p className="text-sm text-white/60">{cityName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="overflow-y-auto max-h-[70vh] p-4 space-y-3">
            {alerts.map((alert) => {
              const colors = getAlertColor(alert.severity);
              const icon = getAlertIcon(alert.event);
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-bold ${colors.text}`}>
                          {alert.event}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {alert.severity}
                        </span>
                      </div>

                      {alert.headline && (
                        <p className="text-sm text-white/80 mt-2 leading-relaxed">
                          {alert.headline}
                        </p>
                      )}

                      {alert.description && (
                        <p className="text-xs text-white/60 mt-2 leading-relaxed line-clamp-6">
                          {alert.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-[10px] text-white/40">
                        {alert.onset && (
                          <span>Starts: {new Date(alert.onset).toLocaleString()}</span>
                        )}
                        {alert.expires && (
                          <span>Expires: {new Date(alert.expires).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Data from National Weather Service
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

AlertsDetailModal.propTypes = {
  alerts: PropTypes.array.isRequired,
  cityName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
