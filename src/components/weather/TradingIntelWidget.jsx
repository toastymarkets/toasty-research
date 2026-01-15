import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Zap, AlertTriangle, RefreshCw, BarChart2, ChevronRight, Maximize2, Check } from 'lucide-react';
import { useNWSAlerts, getAlertColor, getAlertIcon } from '../../hooks/useNWSAlerts';
import { useKalshiMarkets } from '../../hooks/useKalshiMarkets';
import { useMultiModelForecast } from '../../hooks/useMultiModelForecast';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';

/**
 * Model run schedule (approximate UTC times)
 */
const MODEL_SCHEDULE = {
  GFS: { runs: [0, 6, 12, 18], delay: 4 }, // 4 hours after init
  ECMWF: { runs: [0, 12], delay: 6 },
  NAM: { runs: [0, 6, 12, 18], delay: 2 },
  NBM: { runs: 'hourly', delay: 1 },
};

/**
 * Get next model run time
 */
function getNextModelRun(modelName) {
  const schedule = MODEL_SCHEDULE[modelName];
  if (!schedule || schedule.runs === 'hourly') return null;

  const now = new Date();
  const utcHour = now.getUTCHours();

  for (const run of schedule.runs) {
    const releaseHour = run + schedule.delay;
    if (releaseHour > utcHour) {
      const next = new Date();
      next.setUTCHours(releaseHour, 0, 0, 0);
      return { model: modelName, runTime: `${run.toString().padStart(2, '0')}z`, releaseTime: next };
    }
  }

  // Next day's first run
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(schedule.runs[0] + schedule.delay, 0, 0, 0);
  return { model: modelName, runTime: `${schedule.runs[0].toString().padStart(2, '0')}z`, releaseTime: next };
}

/**
 * Format time until
 */
function formatTimeUntil(date) {
  if (!date) return '';
  const diff = date.getTime() - Date.now();
  if (diff < 0) return 'now';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Detect market movers from bracket data
 */
function detectMarketMovers(brackets, priceChanges) {
  const movers = [];

  if (!brackets?.length || !priceChanges) return movers;

  brackets.forEach(bracket => {
    const change = priceChanges[bracket.ticker];
    if (change && Math.abs(change) >= 15) {
      movers.push({
        type: 'price_spike',
        bracket: bracket.label,
        change,
        description: `${bracket.label} ${change > 0 ? 'surged' : 'dropped'} ${Math.abs(change)}%`,
        severity: Math.abs(change) >= 25 ? 'high' : 'medium',
      });
    }
  });

  return movers;
}

/**
 * TradingIntelWidget - Trading intelligence hub
 * Shows alerts, model updates, and market movers
 */
export default function TradingIntelWidget({ citySlug, lat, lon, cityName, isExpanded, onToggleExpand }) {
  const [activeTab, setActiveTab] = useState('alerts');
  const { alerts, loading: alertsLoading, error: alertsError, refetch: refetchAlerts } = useNWSAlerts(lat, lon);
  const { brackets, loading: marketsLoading } = useKalshiMarkets(citySlug, 0);
  const { forecasts } = useMultiModelForecast(citySlug);

  // Calculate model consensus change (simplified - would need historical data for real impl)
  const modelInfo = useMemo(() => {
    if (!forecasts?.models) return null;
    const highs = forecasts.models.map(m => m.daily?.[0]?.high).filter(Boolean);
    const avg = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);
    const spread = Math.max(...highs) - Math.min(...highs);
    return { avg, spread, count: highs.length };
  }, [forecasts]);

  // Get next model runs
  const nextRuns = useMemo(() => {
    return ['GFS', 'ECMWF', 'NAM'].map(getNextModelRun).filter(Boolean).sort((a, b) =>
      a.releaseTime.getTime() - b.releaseTime.getTime()
    ).slice(0, 3);
  }, []);

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (alertsLoading) {
    return (
      <GlassWidget title="TRADING INTEL" icon={Zap} size="large">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </GlassWidget>
    );
  }

  if (alertsError) {
    return (
      <GlassWidget title="TRADING INTEL" icon={Zap} size="large">
        <ErrorState message={alertsError} onRetry={refetchAlerts} compact />
      </GlassWidget>
    );
  }

  return (
    <GlassWidget
      title="TRADING INTEL"
      icon={Zap}
      size="large"
      className="cursor-pointer"
      onClick={onToggleExpand}
      headerRight={onToggleExpand && (
        <Maximize2 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
      )}
    >
      {/* Tab Bar */}
      <div className="flex gap-1 mb-3 bg-white/5 rounded-lg p-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab('alerts'); }}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
            activeTab === 'alerts' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Alerts
          {alerts.length > 0 && (
            <span className="px-1 py-0.5 bg-amber-500/30 text-amber-400 rounded text-[8px]">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab('models'); }}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
            activeTab === 'models' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          Models
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab('market'); }}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
            activeTab === 'market' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          <BarChart2 className="w-3 h-3" />
          Market
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-400">No Active Alerts</p>
                  <p className="text-[10px] text-white/40">{cityName || 'Area'} is all clear</p>
                </div>
              </div>
            ) : (
              alerts.slice(0, 3).map((alert) => {
                const colors = getAlertColor(alert.severity);
                const icon = getAlertIcon(alert.event);
                return (
                  <div key={alert.id} className={`p-2.5 rounded-lg ${colors.bg} ${colors.border} border`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold ${colors.text}`}>{alert.event}</span>
                        <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5">
                          {alert.headline || alert.description?.slice(0, 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-2">
            {/* Model Summary */}
            {modelInfo && (
              <div className="p-2.5 bg-white/5 rounded-lg glass-border-premium">
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Model Consensus</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-white">{modelInfo.avg}°F</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    modelInfo.spread <= 3 ? 'bg-green-500/20 text-green-400' :
                    modelInfo.spread <= 6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    ±{Math.round(modelInfo.spread / 2)}° spread
                  </span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">{modelInfo.count} models</p>
              </div>
            )}

            {/* Upcoming Runs */}
            <p className="text-[10px] text-white/40 uppercase tracking-wide pt-1">Upcoming Runs</p>
            {nextRuns.map((run, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-medium text-white">{run.model} {run.runTime}</span>
                </div>
                <span className="text-[10px] text-white/40">in {formatTimeUntil(run.releaseTime)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-2">
            {marketsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : brackets?.length > 0 ? (
              <>
                {/* Leading bracket summary */}
                {(() => {
                  const leading = brackets.reduce((max, b) => b.yesPrice > (max?.yesPrice || 0) ? b : max, null);
                  if (!leading) return null;
                  return (
                    <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-[10px] text-white/40 uppercase tracking-wide">Leading Bracket</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-white">{leading.label}</span>
                        <span className="text-sm font-semibold text-blue-400">{leading.yesPrice}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bracket distribution */}
                <p className="text-[10px] text-white/40 uppercase tracking-wide pt-1">Distribution</p>
                <div className="grid grid-cols-3 gap-1">
                  {brackets.slice(0, 6).map((b) => (
                    <div key={b.ticker} className="p-1.5 bg-white/5 rounded text-center">
                      <p className="text-[9px] text-white/50">{b.label.replace(/°.*/, '°')}</p>
                      <p className="text-xs font-medium text-white">{b.yesPrice}%</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-white/40 text-xs">
                No market data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/10 mt-auto flex items-center justify-between">
        <span className="text-[10px] text-white/40">
          {activeTab === 'alerts' ? 'Source: NWS' :
           activeTab === 'models' ? 'Open-Meteo' : 'Kalshi'}
        </span>
        <ChevronRight className="w-3 h-3 text-white/30" />
      </div>
    </GlassWidget>
  );
}

TradingIntelWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  cityName: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};
