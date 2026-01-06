import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronRight, Newspaper, Maximize2 } from 'lucide-react';
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
export default function AlertsWidget({ lat, lon, cityName, isExpanded, onToggleExpand }) {
  const { alerts, loading, error, refetch } = useNWSAlerts(lat, lon);
  const { news, loading: newsLoading } = useWeatherNews(cityName, alerts.length === 0 && !loading);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mobile detection for dual behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handle widget click - dual behavior
  const handleWidgetClick = () => {
    if (isMobile) {
      setIsModalOpen(true);
    } else if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  };

  // Render expanded inline view on desktop
  if (isExpanded && !isMobile) {
    return (
      <ExpandedAlertsInline
        alerts={alerts}
        news={news}
        cityName={cityName}
        onCollapse={onToggleExpand}
      />
    );
  }

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
          onClick={handleWidgetClick}
          headerRight={onToggleExpand && (
            <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
          )}
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
        onClick={handleWidgetClick}
        headerRight={onToggleExpand && (
          <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
        )}
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
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedAlertsInline - Inline expanded view showing alerts and news
 */
function ExpandedAlertsInline({ alerts, news, cityName, onCollapse }) {
  const [activeTab, setActiveTab] = useState(alerts.length > 0 ? 'alerts' : 'news');

  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Alerts & News</span>
          <span className="text-xs text-white/40">{cityName}</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'alerts'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Alerts
          {alerts.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'news'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <Newspaper className="w-3 h-3" />
          News
          {news.length > 0 && (
            <span className="ml-1 text-[10px] text-white/40">({news.length})</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'alerts' ? (
          alerts.length > 0 ? (
            <div className="space-y-2">
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
                        <span className={`text-sm font-bold ${colors.text}`}>
                          {alert.event}
                        </span>
                        <p className="text-xs text-white/70 mt-1 line-clamp-3">
                          {alert.headline || alert.description?.slice(0, 200)}
                        </p>
                        {alert.expires && (
                          <p className="text-[10px] text-white/40 mt-2">
                            {formatTimeAgo(alert.expires)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm text-white/70">No Active Alerts</p>
              <p className="text-xs text-white/40 mt-1">{cityName || 'This area'} is all clear</p>
            </div>
          )
        ) : (
          news.length > 0 ? (
            <div className="space-y-2">
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-xs text-white/80 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-white/40">
                    {item.source && <span>{item.source}</span>}
                    {item.publishedAt && <span>• {formatNewsTime(item.publishedAt)}</span>}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Newspaper className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-sm text-white/50">No weather news available</p>
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/40">
        Source: NWS Alerts, NewsData.io
      </div>
    </div>
  );
}

ExpandedAlertsInline.propTypes = {
  alerts: PropTypes.array.isRequired,
  news: PropTypes.array.isRequired,
  cityName: PropTypes.string,
  onCollapse: PropTypes.func.isRequired,
};
