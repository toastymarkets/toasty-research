import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, ChevronRight, Clock, Calendar, ExternalLink, Timer, Thermometer, Radio, Info } from 'lucide-react';
import GlassWidget from './GlassWidget';
import ResolutionModal from './ResolutionModal';
import { useCLIReport } from '../../hooks/useCLIReport';
import { useDSM } from '../../hooks/useDSM';
import { useCliCountdown, useDataReleaseCountdown } from '../../hooks/useDataReleaseCountdown';
import {
  DATA_SCHEDULE,
  SIX_HOUR_OBSERVATION_TIMES,
  utcToLocalTime,
  getStationResources,
} from '../../config/dataSchedule';

/**
 * ResolutionWidget - Displays both CLI (settlement) and DSM (live) data side-by-side
 * Shows clear timestamps and countdown to next CLI release
 */
export function ResolutionWidget({
  stationId,
  citySlug,
  cityName,
  timezone,
  loading: externalLoading = false,
  isExpanded = false,
  onToggleExpand,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simple mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const { data: cliData, loading: cliLoading } = useCLIReport(stationId);
  const { data: dsmData, loading: dsmLoading, stationName: dsmStationName } = useDSM(citySlug);
  const cliCountdown = useCliCountdown(stationId);
  const { sixHour: dsmCountdown } = useDataReleaseCountdown(stationId);

  // Only show loading on initial load
  const isInitialLoading = (cliLoading && dsmLoading) || externalLoading;

  // Format date for CLI display (e.g., "Jan 4")
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format time for CLI display (e.g., "5:15a")
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'M') return '';
    const match = timeStr.match(/^(\d{1,2})(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const [, hour, min, period] = match;
      return `${hour}:${min}${period.toLowerCase().charAt(0)}`;
    }
    return '';
  };

  // Get CLI high value
  const cliHigh = cliData?.high;
  const cliTimestamp = cliData?.valid ? formatDate(cliData.valid) : null;
  const cliHighTime = cliData?.high_time ? formatTime(cliData.high_time) : null;

  // Get DSM high value
  const dsmHigh = dsmData?.highF != null ? Math.round(dsmData.highF) : null;
  // DSM date is always today
  const dsmDate = formatDate(new Date().toISOString().split('T')[0]);

  const hasAnyData = cliHigh != null || dsmHigh != null;

  // Handle widget click - desktop uses inline expansion, mobile uses modal
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
      <ExpandedResolutionInline
        stationId={stationId}
        citySlug={citySlug}
        cityName={cityName}
        timezone={timezone}
        cliData={cliData}
        dsmData={dsmData}
        dsmStationName={dsmStationName}
        cliCountdown={cliCountdown}
        dsmCountdown={dsmCountdown}
        onCollapse={onToggleExpand}
      />
    );
  }

  if (isInitialLoading) {
    return (
      <GlassWidget
        title="REPORTS"
        icon={FileText}
        size="small"
        className="cursor-pointer"
        onClick={handleWidgetClick}
      >
        <div className="flex flex-col h-full">
          <div className="flex gap-3 mb-2">
            <div className="flex-1">
              <div className="w-8 h-3 bg-white/10 rounded mb-1" />
              <div className="w-10 h-6 bg-white/10 rounded" />
            </div>
            <div className="flex-1">
              <div className="w-8 h-3 bg-white/10 rounded mb-1" />
              <div className="w-10 h-6 bg-white/10 rounded" />
            </div>
          </div>
          <div className="w-16 h-3 bg-white/10 rounded mt-auto" />
        </div>
      </GlassWidget>
    );
  }

  if (!hasAnyData) {
    return (
      <>
        <GlassWidget
          title="REPORTS"
          icon={FileText}
          size="small"
          className="cursor-pointer"
          onClick={handleWidgetClick}
        >
          <div className="flex flex-col h-full">
            {cliCountdown ? (
              <>
                <div className="text-2xl font-light text-white tracking-tight">
                  {cliCountdown.formatted}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  until next CLI
                </div>
              </>
            ) : (
              <div className="text-sm text-white/40">
                No data available
              </div>
            )}
          </div>
        </GlassWidget>

        {isModalOpen && (
          <ResolutionModal
            stationId={stationId}
            citySlug={citySlug}
            cityName={cityName}
            timezone={timezone}
            cliData={cliData}
            dsmData={dsmData}
            dsmStationName={dsmStationName}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <GlassWidget
        title="REPORTS"
        icon={FileText}
        size="small"
        className="cursor-pointer"
        onClick={handleWidgetClick}
      >
        <div className="flex flex-col h-full">
          {/* Side-by-side CLI and DSM */}
          <div className="flex gap-2">
            {/* CLI Column - Settlement */}
            <div className="flex-1 bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-medium text-green-400 uppercase tracking-wide">CLI</span>
                <span className="text-[8px] text-white/30">Settlement</span>
              </div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {cliHigh != null ? `${cliHigh}°` : '--'}
              </div>
              <div className="text-[9px] text-white/40 mt-0.5">
                {cliTimestamp || 'Pending'}
                {cliHighTime && ` ${cliHighTime}`}
              </div>
            </div>

            {/* DSM Column - Live */}
            <div className="flex-1 bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-medium text-cyan-400 uppercase tracking-wide">DSM</span>
                <span className="text-[8px] text-white/30">Live</span>
              </div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {dsmHigh != null ? `${dsmHigh}°` : '--'}
              </div>
              <div className="text-[9px] text-white/40 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {dsmDate}
              </div>
            </div>
          </div>

          {/* Countdowns - Always visible */}
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/10">
            {cliCountdown && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50">Next CLI</span>
                <span className="text-[11px] text-amber-400 font-medium">{cliCountdown.formatted}</span>
              </div>
            )}
            {dsmCountdown && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-white/50">Next DSM</span>
                <span className="text-[11px] text-cyan-400 font-medium">{dsmCountdown.formatted}</span>
              </div>
            )}
          </div>
        </div>
      </GlassWidget>

      {/* Modal */}
      {isModalOpen && (
        <ResolutionModal
          stationId={stationId}
          citySlug={citySlug}
          cityName={cityName}
          timezone={timezone}
          cliData={cliData}
          dsmData={dsmData}
          dsmStationName={dsmStationName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

ResolutionWidget.propTypes = {
  stationId: PropTypes.string.isRequired,
  citySlug: PropTypes.string,
  cityName: PropTypes.string,
  timezone: PropTypes.string,
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedResolutionInline - Inline expanded view for desktop
 * Shows full CLI/DSM data with tabs for Overview, Schedule, and Resources
 */
function ExpandedResolutionInline({
  stationId,
  citySlug,
  cityName,
  timezone,
  cliData,
  dsmData,
  dsmStationName,
  cliCountdown,
  dsmCountdown,
  onCollapse,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const countdowns = useDataReleaseCountdown(stationId);
  const schedule = DATA_SCHEDULE[stationId];

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'M') return '--';
    const match = timeStr.match(/^(\d{1,2})(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const [, hour, min, period] = match;
      return `${hour}:${min} ${period}`;
    }
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const resources = getStationResources(stationId);

  const externalLinks = [
    { label: 'NWS Time Series', url: resources.nwsTimeSeries, description: 'Live observations' },
    { label: 'CLI Report Feed', url: resources.cliReport, description: 'Settlement data' },
    { label: 'IEM ASOS History', url: resources.iemAsos, description: 'Historical data' },
    { label: 'IEM DSM Feed', url: resources.iemDsm, description: 'Daily summaries' },
  ];

  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/70" />
          <span className="text-sm font-semibold text-white">Settlement Reports</span>
          <span className="text-xs text-white/50">({stationId})</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 text-white/70 rotate-180" />
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="px-3 pt-2">
        <div className="flex bg-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'overview' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'schedule' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'resources' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Links</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3 glass-scroll">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Countdown Timers Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-white/50 uppercase">Next CLI</span>
                </div>
                {countdowns.cli ? (
                  <>
                    <div className="text-base font-semibold text-green-400">{countdowns.cli.formatted}</div>
                    <div className="text-[9px] text-white/40">~{utcToLocalTime(countdowns.cli.time, timezone)} local</div>
                  </>
                ) : (
                  <div className="text-xs text-white/40">No schedule</div>
                )}
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Timer className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-white/50 uppercase">Next 6hr</span>
                </div>
                {countdowns.sixHour ? (
                  <>
                    <div className="text-base font-semibold text-amber-400">{countdowns.sixHour.formatted}</div>
                    <div className="text-[9px] text-white/40">{countdowns.sixHour.label}</div>
                  </>
                ) : (
                  <div className="text-xs text-white/40">--</div>
                )}
              </div>
            </div>

            {/* CLI Report Data */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-white">CLI Report</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded">Settlement</span>
                </div>
                {cliData?.valid && <span className="text-[10px] text-white/50">{formatDate(cliData.valid)}</span>}
              </div>
              {cliData ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-white/40 mb-0.5">High</div>
                    <div className="text-xl font-bold text-red-400">{cliData.high != null ? `${cliData.high}°F` : '--'}</div>
                    <div className="text-[9px] text-white/50">at {formatTime(cliData.high_time)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-0.5">Low</div>
                    <div className="text-xl font-bold text-blue-400">{cliData.low != null ? `${cliData.low}°F` : '--'}</div>
                    <div className="text-[9px] text-white/50">at {formatTime(cliData.low_time)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-white/40 text-xs">No CLI data available yet today</div>
              )}
            </div>

            {/* DSM Data */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-white">DSM</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">Interim</span>
                </div>
                {dsmStationName && <span className="text-[10px] text-white/50">{dsmStationName}</span>}
              </div>
              {dsmData ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-white/40 mb-0.5">High So Far</div>
                    <div className="text-lg font-semibold text-red-400/80">{dsmData.highF != null ? `${Math.round(dsmData.highF)}°F` : '--'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-0.5">Low So Far</div>
                    <div className="text-lg font-semibold text-blue-400/80">{dsmData.lowF != null ? `${Math.round(dsmData.lowF)}°F` : '--'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-white/40 text-xs">No DSM data available</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {schedule ? (
              <>
                {/* Station Info */}
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">{schedule.name}</div>
                      <div className="text-[10px] text-white/50">{stationId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/40">METAR at</div>
                      <div className="text-xs font-medium text-white">:{schedule.metarMinute} hourly</div>
                    </div>
                  </div>
                </div>

                {/* Schedule Table */}
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-2 py-1.5 text-left text-white/40 font-medium">Type</th>
                        <th className="px-2 py-1.5 text-right text-white/40 font-medium">UTC</th>
                        <th className="px-2 py-1.5 text-right text-white/40 font-medium">Local</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-green-400" />
                            <span className="text-white">CLI</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right text-white/70">{schedule.cliTime || '--'}</td>
                        <td className="px-2 py-1.5 text-right text-white">{schedule.cliTime ? utcToLocalTime(schedule.cliTime, timezone) : '--'}</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="w-3 h-3 text-red-400" />
                            <span className="text-white">24hr High</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right text-white/70">{schedule.highTime24h || '--'}</td>
                        <td className="px-2 py-1.5 text-right text-white">{schedule.highTime24h ? utcToLocalTime(schedule.highTime24h, timezone) : '--'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6-Hour Windows */}
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] text-white/50 mb-1.5">6-Hour High/Low Reports</div>
                  <div className="flex flex-wrap gap-1">
                    {SIX_HOUR_OBSERVATION_TIMES.map((time) => (
                      <span key={time.utc} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/70">
                        {time.utc}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-white/40 text-xs">No schedule data available</div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-3">
            {/* External Links */}
            <div className="space-y-1.5">
              {externalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors group"
                >
                  <div>
                    <div className="text-xs text-white group-hover:text-blue-300 transition-colors">{link.label}</div>
                    <div className="text-[9px] text-white/40">{link.description}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-blue-400" />
                </a>
              ))}
            </div>

            {/* CLI vs DSM Explanation */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs font-medium text-white mb-2">CLI vs DSM</div>
              <div className="space-y-2 text-[10px]">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-green-300 font-medium">CLI</span>
                    <span className="text-white/60"> - Official NWS settlement data. Released once daily.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-purple-300 font-medium">DSM</span>
                    <span className="text-white/60"> - Interim observations. Not used for settlement.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settlement Rules */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <div className="text-[10px] font-semibold text-blue-300 mb-1">Settlement Rules</div>
              <ul className="space-y-0.5 text-[10px] text-blue-200/80">
                <li className="flex items-start gap-1">
                  <span className="text-blue-400">•</span>
                  <span>Markets settle on CLI high temp</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-400">•</span>
                  <span>CLI published morning after observation day</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-400">•</span>
                  <span>Temp rounded to nearest whole °F</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-white/5 border-t border-white/10">
        <p className="text-[9px] text-white/40 text-center">Data from NWS via Iowa Environmental Mesonet</p>
      </div>
    </div>
  );
}

ExpandedResolutionInline.propTypes = {
  stationId: PropTypes.string.isRequired,
  citySlug: PropTypes.string,
  cityName: PropTypes.string,
  timezone: PropTypes.string,
  cliData: PropTypes.object,
  dsmData: PropTypes.object,
  dsmStationName: PropTypes.string,
  cliCountdown: PropTypes.object,
  dsmCountdown: PropTypes.object,
  onCollapse: PropTypes.func.isRequired,
};

export default ResolutionWidget;
