import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Clock, Calendar, ExternalLink, FileText, Info, Radio, Timer, Thermometer } from 'lucide-react';
import { useDSM } from '../../hooks/useDSM';
import { useDataReleaseCountdown } from '../../hooks/useDataReleaseCountdown';
import {
  DATA_SCHEDULE,
  SIX_HOUR_OBSERVATION_TIMES,
  utcToLocalTime,
  getStationResources,
} from '../../config/dataSchedule';

/**
 * ResolutionModal - Detailed view of NWS data releases and settlement information
 *
 * Three tabs:
 * 1. Overview - Live data (CLI, DSM) with countdown timers
 * 2. Schedule - Full release schedule with local times
 * 3. Resources - External links and explanations
 */
export default function ResolutionModal({
  stationId,
  citySlug,
  cityName,
  timezone,
  cliData,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const countdowns = useDataReleaseCountdown(stationId);
  const { data: dsmData, loading: dsmLoading, stationName } = useDSM(citySlug);

  const schedule = DATA_SCHEDULE[stationId];

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
                <h2 className="text-lg font-semibold text-white">
                  Settlement Reports
                </h2>
                <p className="text-sm text-white/60">
                  {cityName} ({stationId})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-white/10 rounded-lg p-0.5 mt-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Live</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'resources'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Links</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] glass-scroll">
            {activeTab === 'overview' && (
              <OverviewTab
                cliData={cliData}
                dsmData={dsmData}
                dsmLoading={dsmLoading}
                countdowns={countdowns}
                schedule={schedule}
                timezone={timezone}
                stationName={stationName}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleTab
                schedule={schedule}
                stationId={stationId}
                timezone={timezone}
              />
            )}
            {activeTab === 'resources' && (
              <ResourcesTab stationId={stationId} cityName={cityName} />
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Data from NWS via Iowa Environmental Mesonet (IEM)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

ResolutionModal.propTypes = {
  stationId: PropTypes.string.isRequired,
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
  timezone: PropTypes.string.isRequired,
  cliData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

/**
 * OverviewTab - Live data with countdown timers
 */
function OverviewTab({ cliData, dsmData, dsmLoading, countdowns, schedule, timezone, stationName }) {
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

  return (
    <div className="p-4 space-y-4">
      {/* Countdown Timers */}
      <div className="grid grid-cols-2 gap-3">
        {/* CLI Countdown */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide">Next CLI</span>
          </div>
          {countdowns.cli ? (
            <>
              <div className="text-lg font-semibold text-green-400">
                {countdowns.cli.formatted}
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                ~{utcToLocalTime(countdowns.cli.time, timezone)} local
              </div>
            </>
          ) : (
            <div className="text-sm text-white/40">No schedule</div>
          )}
        </div>

        {/* 6-Hour Countdown */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide">Next 6hr</span>
          </div>
          {countdowns.sixHour ? (
            <>
              <div className="text-lg font-semibold text-amber-400">
                {countdowns.sixHour.formatted}
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {countdowns.sixHour.label} • {countdowns.sixHour.description}
              </div>
            </>
          ) : (
            <div className="text-sm text-white/40">--</div>
          )}
        </div>
      </div>

      {/* CLI Report Data */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">CLI Report</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded">
              Settlement
            </span>
          </div>
          {cliData?.valid && (
            <span className="text-xs text-white/50">{formatDate(cliData.valid)}</span>
          )}
        </div>

        {cliData ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1">High</div>
              <div className="text-2xl font-bold text-red-400">
                {cliData.high != null ? `${cliData.high}°F` : '--'}
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                at {formatTime(cliData.high_time)}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Low</div>
              <div className="text-2xl font-bold text-blue-400">
                {cliData.low != null ? `${cliData.low}°F` : '--'}
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                at {formatTime(cliData.low_time)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-white/40 text-sm">
            No CLI data available yet today
          </div>
        )}
      </div>

      {/* DSM Data */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Daily Summary (DSM)</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
              Interim
            </span>
          </div>
          {stationName && (
            <span className="text-xs text-white/50">{stationName}</span>
          )}
        </div>

        {dsmLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1">High So Far</div>
              <div className="text-xl font-semibold text-white/20">--</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Low So Far</div>
              <div className="text-xl font-semibold text-white/20">--</div>
            </div>
          </div>
        ) : dsmData ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1">High So Far</div>
              <div className="text-xl font-semibold text-red-400/80">
                {dsmData.highF != null ? `${Math.round(dsmData.highF)}°F` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Low So Far</div>
              <div className="text-xl font-semibold text-blue-400/80">
                {dsmData.lowF != null ? `${Math.round(dsmData.lowF)}°F` : '--'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-white/40 text-sm">
            No DSM data available
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-[10px] text-white/40">
            DSM shows interim observations. Markets settle on CLI report values.
          </p>
        </div>
      </div>

      {/* 6-Hour High/Low Tracking */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">6-Hour Observation Windows</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SIX_HOUR_OBSERVATION_TIMES.map((time) => (
            <div key={time.utc} className="bg-white/5 rounded p-2">
              <div className="text-xs font-medium text-white/80">{time.label}</div>
              <div className="text-[10px] text-white/40">
                {utcToLocalTime(time.utc, timezone)} local
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">{time.description}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/40 mt-3">
          6-hour METARs include max/min temps for intraday tracking.
        </p>
      </div>
    </div>
  );
}

OverviewTab.propTypes = {
  cliData: PropTypes.object,
  dsmData: PropTypes.object,
  dsmLoading: PropTypes.bool,
  countdowns: PropTypes.object,
  schedule: PropTypes.object,
  timezone: PropTypes.string,
  stationName: PropTypes.string,
};

/**
 * ScheduleTab - Full release schedule with local times
 */
function ScheduleTab({ schedule, stationId, timezone }) {
  if (!schedule) {
    return (
      <div className="p-4 text-center text-white/40">
        No schedule data available for this station
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Station Info */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">{schedule.name}</div>
            <div className="text-xs text-white/50">{stationId}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40">METAR at</div>
            <div className="text-sm font-medium text-white">:{schedule.metarMinute} hourly</div>
          </div>
        </div>
      </div>

      {/* Release Schedule Table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left text-white/40 font-medium">Data Type</th>
              <th className="px-3 py-2 text-right text-white/40 font-medium">UTC</th>
              <th className="px-3 py-2 text-right text-white/40 font-medium">Local</th>
            </tr>
          </thead>
          <tbody>
            {/* CLI Report */}
            <tr className="border-b border-white/5">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-white">CLI Report</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-white/70">
                {schedule.cliTime || '--'}
              </td>
              <td className="px-3 py-2.5 text-right text-white">
                {schedule.cliTime ? utcToLocalTime(schedule.cliTime, timezone) : '--'}
              </td>
            </tr>

            {/* 24hr High */}
            <tr className="border-b border-white/5">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-white">24hr High METAR</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-white/70">
                {schedule.highTime24h || '--'}
              </td>
              <td className="px-3 py-2.5 text-right text-white">
                {schedule.highTime24h ? utcToLocalTime(schedule.highTime24h, timezone) : '--'}
              </td>
            </tr>

            {/* Hourly METAR */}
            <tr className="border-b border-white/5">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white">Hourly METAR</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-white/70" colSpan={2}>
                :{schedule.metarMinute} past each hour (±1 min)
              </td>
            </tr>

            {/* DSM Count */}
            {schedule.dsmCount && (
              <tr>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-white">Daily DSMs</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-white" colSpan={2}>
                  {schedule.dsmCount} per day
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6-Hour Observations */}
      <div>
        <h3 className="text-xs font-medium text-white/60 mb-2 px-1">
          6-Hour High/Low Reports (UTC)
        </h3>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex flex-wrap gap-2">
            {SIX_HOUR_OBSERVATION_TIMES.map((time) => (
              <div
                key={time.utc}
                className="px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/80"
              >
                {time.utc} UTC
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/40 mt-2">
            These METARs include 6-hour max/min temperatures
          </p>
        </div>
      </div>

      {/* CLI Variability Note */}
      {schedule.cliVariability && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-200/90">
            CLI release time may vary by ±{schedule.cliVariability} minutes from the typical time.
          </p>
        </div>
      )}
    </div>
  );
}

ScheduleTab.propTypes = {
  schedule: PropTypes.object,
  stationId: PropTypes.string,
  timezone: PropTypes.string,
};

/**
 * ResourcesTab - External links and explanations
 */
function ResourcesTab({ stationId, cityName }) {
  const resources = getStationResources(stationId);

  const externalLinks = [
    {
      label: 'NWS Time Series',
      url: resources.nwsTimeSeries,
      description: 'Live temperature observations',
    },
    {
      label: 'CLI Report Feed',
      url: resources.cliReport,
      description: 'Official settlement data',
    },
    {
      label: 'IEM ASOS History',
      url: resources.iemAsos,
      description: 'Historical observation data',
    },
    {
      label: 'IEM DSM Feed',
      url: resources.iemDsm,
      description: 'Daily summary messages',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* External Links */}
      <div>
        <h3 className="text-xs font-medium text-white/60 mb-2 px-1">
          Data Resources for {cityName}
        </h3>
        <div className="space-y-2">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
            >
              <div>
                <div className="text-sm text-white group-hover:text-blue-300 transition-colors">
                  {link.label}
                </div>
                <div className="text-[10px] text-white/40">{link.description}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-blue-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* CLI vs DSM Explanation */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-3">CLI vs DSM</h3>
        <div className="space-y-3 text-xs">
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-green-300 font-medium">CLI (Climatological Report)</span>
              <p className="text-white/60 mt-0.5">
                Official NWS daily summary. Kalshi markets settle on CLI values.
                Released once daily after midnight local time.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-purple-300 font-medium">DSM (Daily Summary Message)</span>
              <p className="text-white/60 mt-0.5">
                Interim observations throughout the day. Shows "high so far" and "low so far".
                Not used for settlement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Rules */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-blue-300 mb-2">Settlement Rules</h3>
        <ul className="space-y-1.5 text-xs text-blue-200/80">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Markets settle on the CLI report high temperature</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>CLI is published the morning after the observation day</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Temperature is rounded to the nearest whole °F</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

ResourcesTab.propTypes = {
  stationId: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
};

export { OverviewTab, ScheduleTab, ResourcesTab };
