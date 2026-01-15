import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';

/**
 * AlertsBanner - Horizontal scrolling alert feed across all market cities
 * Renders nothing when no alerts are active
 */
export default function AlertsBanner() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Fetch alerts for all market cities
  useEffect(() => {
    const fetchAllAlerts = async () => {
      setLoading(true);

      const alertPromises = MARKET_CITIES.map(async (city) => {
        try {
          const response = await fetch(
            `https://api.weather.gov/alerts/active?point=${city.lat},${city.lon}`,
            { headers: { 'User-Agent': 'Toasty Research App' } }
          );

          if (!response.ok) return [];

          const data = await response.json();
          return (data.features || []).map((feature) => ({
            id: feature.properties.id,
            event: feature.properties.event,
            headline: feature.properties.headline,
            description: feature.properties.description,
            severity: feature.properties.severity,
            expires: feature.properties.expires ? new Date(feature.properties.expires) : null,
            cityName: city.name,
            citySlug: city.slug,
          }));
        } catch (err) {
          console.error(`Error fetching alerts for ${city.name}:`, err);
          return [];
        }
      });

      const results = await Promise.all(alertPromises);
      const combined = results.flat();

      // Deduplicate by alert ID and sort by severity
      const unique = Array.from(new Map(combined.map(a => [a.id, a])).values());
      const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
      unique.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

      setAllAlerts(unique);
      setLoading(false);
    };

    fetchAllAlerts();

    // Refresh every 5 minutes
    const interval = setInterval(fetchAllAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't render anything if no alerts
  if (!loading && allAlerts.length === 0) {
    return null;
  }

  // Loading state - minimal skeleton
  if (loading) {
    return null; // Don't show loading state for alerts banner
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 mt-3">
        <div className="glass-widget py-2 px-3 flex items-center gap-3 overflow-hidden">
          {/* Alert indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium hidden sm:block">
              Alerts
            </span>
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
              {allAlerts.length}
            </span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-white/10 flex-shrink-0" />

          {/* Scrolling alert chips */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {allAlerts.map((alert) => {
                const colors = getAlertColor(alert.severity);
                return (
                  <button
                    key={alert.id}
                    onClick={() => setExpandedAlert(alert)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0
                      ${colors.bg} border ${colors.border}
                      hover:scale-105 transition-transform cursor-pointer
                    `}
                  >
                    <span className="text-sm">{getAlertIcon(alert.event)}</span>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {alert.cityName}
                    </span>
                    <span className="text-[10px] text-white/60 max-w-[100px] truncate">
                      {alert.event}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Alert Modal */}
      {expandedAlert && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedAlert(null)}
        >
          <div
            className="glass-elevated max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getAlertIcon(expandedAlert.event)}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{expandedAlert.event}</h3>
                  <p className="text-sm text-white/60">{expandedAlert.cityName}</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedAlert(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                {(() => {
                  const colors = getAlertColor(expandedAlert.severity);
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {expandedAlert.severity}
                    </span>
                  );
                })()}
                {expandedAlert.expires && (
                  <span className="text-xs text-white/40">
                    Expires: {expandedAlert.expires.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Headline */}
              {expandedAlert.headline && (
                <p className="text-sm text-white/80 font-medium">
                  {expandedAlert.headline}
                </p>
              )}

              {/* Description */}
              {expandedAlert.description && (
                <div className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {expandedAlert.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
