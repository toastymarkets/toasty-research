import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import GlassWidget from './GlassWidget';
import ResolutionModal from './ResolutionModal';
import { useCLIReport } from '../../hooks/useCLIReport';
import { useDSM } from '../../hooks/useDSM';
import { useCliCountdown } from '../../hooks/useDataReleaseCountdown';

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
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: cliData, loading: cliLoading } = useCLIReport(stationId);
  const { data: dsmData, loading: dsmLoading, stationName: dsmStationName } = useDSM(citySlug);
  const cliCountdown = useCliCountdown(stationId);

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

  const hasAnyData = cliHigh != null || dsmHigh != null;

  if (isInitialLoading) {
    return (
      <GlassWidget
        title="REPORTS"
        icon={FileText}
        size="small"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
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
          onClick={() => setIsModalOpen(true)}
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
        onClick={() => setIsModalOpen(true)}
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
                High so far
              </div>
            </div>
          </div>

          {/* Countdown - Always visible */}
          {cliCountdown && (
            <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/10">
              <span className="text-[10px] text-white/50">Next CLI</span>
              <span className="text-[11px] text-amber-400 font-medium">{cliCountdown.formatted}</span>
            </div>
          )}
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
};

export default ResolutionWidget;
