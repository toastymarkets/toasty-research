import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronRight, Newspaper } from 'lucide-react';
import { useNWSAlerts, getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';
import { useWeatherNews, formatNewsTime } from '../../hooks/useWeatherNews';
import GlassWidget from './GlassWidget';
import AlertsNewsModal from './AlertsNewsModal';
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
 * AlertsWidget - Shows NWS weather alerts and weather news
 * If no alerts, shows weather news instead
 */
export default function AlertsWidget({ lat, lon, cityName }) {
  const { alerts, loading, error, refetch } = useNWSAlerts(lat, lon);
  const { news, loading: newsLoading } = useWeatherNews(cityName, alerts.length === 0 && !loading);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <ErrorState
          message={error}
          onRetry={refetch}
          compact
        />
      </GlassWidget>
    );
  }

  // No alerts - show news instead
  if (alerts.length === 0) {
    return (
      <>
        <GlassWidget
          title="ALERTS & NEWS"
          icon={AlertTriangle}
          size="large"
          className="cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          {/* No alerts badge */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">No Active Alerts</span>
          </div>

          {/* Weather News */}
          {newsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : news.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="flex items-center gap-1 text-[10px] text-white/40 mb-1">
                <Newspaper className="w-3 h-3" />
                <span>Weather News</span>
              </div>
              {news.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-xs text-white/80 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-white/40">
                    {item.source && <span>{item.source}</span>}
                    {item.publishedAt && <span>• {formatNewsTime(item.publishedAt)}</span>}
                  </div>
                </div>
              ))}
              {news.length > 3 && (
                <p className="text-[9px] text-white/40 text-center">
                  +{news.length - 3} more articles
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs text-white/60">No weather news available</p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {cityName || 'This area'} is all clear
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 mt-2 flex items-center justify-between">
            <p className="text-[10px] text-white/40">
              Tap for details
            </p>
            <ChevronRight className="w-3 h-3 text-white/30" />
          </div>
        </GlassWidget>

        {/* Modal */}
        {isModalOpen && (
          <AlertsNewsModal
            alerts={alerts}
            news={news}
            cityName={cityName}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <GlassWidget
        title="ALERTS"
        icon={AlertTriangle}
        size="large"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex-1 overflow-y-auto space-y-2">
          {alerts.slice(0, 3).map((alert) => {
            const colors = getAlertColor(alert.severity);
            const icon = getAlertIcon(alert.event);

            return (
              <div
                key={alert.id}
                className={`w-full text-left p-2.5 rounded-lg ${colors.bg} ${colors.border} border transition-all hover:bg-white/10`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${colors.text} truncate`}>
                        {alert.event}
                      </span>
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
              </div>
            );
          })}

          {alerts.length > 3 && (
            <p className="text-[10px] text-white/40 text-center pt-1">
              +{alerts.length - 3} more alerts
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 mt-2 flex items-center justify-between">
          <p className="text-[10px] text-white/40">
            Source: NWS
          </p>
          <ChevronRight className="w-3 h-3 text-white/30" />
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {isModalOpen && (
        <AlertsNewsModal
          alerts={alerts}
          news={news}
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
};
