import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import GlassWidget from './GlassWidget';
import ResolutionModal from './ResolutionModal';
import { useCLIReport } from '../../hooks/useCLIReport';
import { useDSM } from '../../hooks/useDSM';
import { useCliCountdown } from '../../hooks/useDataReleaseCountdown';

/**
 * ResolutionWidget - Displays official CLI settlement data with toggle for DSM
 * Design inspired by Apple Weather "Averages" widget
 */
export function ResolutionWidget({
  stationId,
  citySlug,
  cityName,
  timezone,
  loading: externalLoading = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('cli'); // 'cli' | 'dsm'

  const { data: cliData, loading: cliLoading } = useCLIReport(stationId);
  const { data: dsmData, loading: dsmLoading, stationName: dsmStationName } = useDSM(citySlug);
  const cliCountdown = useCliCountdown(stationId);

  // Only show loading on initial load, not when switching views
  const isInitialLoading = (cliLoading && dsmLoading) || externalLoading;

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format relative time
  const formatLastUpdated = () => {
    if (activeView === 'cli' && cliData?.valid) {
      return formatDate(cliData.valid);
    }
    if (activeView === 'dsm' && dsmData) {
      return 'Today';
    }
    return '--';
  };

  // Get current data based on view
  const getData = () => {
    if (activeView === 'cli' && cliData) {
      return {
        high: cliData.high,
        low: cliData.low,
        label: 'CLI',
        sublabel: formatDate(cliData.valid),
      };
    }
    if (activeView === 'dsm' && dsmData) {
      return {
        high: dsmData.highF != null ? Math.round(dsmData.highF) : null,
        low: dsmData.lowF != null ? Math.round(dsmData.lowF) : null,
        label: 'DSM',
        sublabel: 'so far today',
      };
    }
    return null;
  };

  const data = getData();
  const hasNoData = !data && !isInitialLoading;

  // Toggle handler
  const cycleView = (e) => {
    e.stopPropagation();
    setActiveView(prev => prev === 'cli' ? 'dsm' : 'cli');
  };

  if (isInitialLoading) {
    return (
      <GlassWidget
        title="REPORTS"
        icon={FileText}
        size="small"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-col h-full py-3">
          <div className="w-16 h-4 bg-white/10 rounded mb-3" />
          <div className="w-20 h-10 bg-white/10 rounded mb-2" />
          <div className="w-12 h-3 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (hasNoData) {
    return (
      <>
        <GlassWidget
          title="REPORTS"
          icon={FileText}
          size="small"
          className="cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex flex-col h-full py-3">
            {cliCountdown ? (
              <>
                <div className="text-4xl font-light text-white tracking-tight">
                  {cliCountdown.hours}h {cliCountdown.minutes}m
                </div>
                <div className="text-sm text-white/70 mt-1">
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
        <div className="flex flex-col h-full py-3">
          {/* Toggle Pills */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={cycleView}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${
                activeView === 'cli'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              CLI
            </button>
            <button
              onClick={cycleView}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${
                activeView === 'dsm'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              DSM
            </button>
          </div>

          {/* Hero Number - High */}
          <div className="text-4xl font-light text-white tracking-tight">
            {data?.high != null ? `${data.high}°` : '--'}
          </div>

          {/* Simple label */}
          <div className="text-sm text-white/70 mt-1">
            High
          </div>

          {/* Divider + Bottom Stats */}
          <div className="mt-auto pt-3">
            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Low</span>
                <span className="text-white font-medium">
                  {data?.low != null ? `${data.low}°` : '--'}
                </span>
              </div>
              {activeView === 'cli' && cliCountdown && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Next CLI</span>
                  <span className="text-amber-400 font-medium">
                    {cliCountdown.formatted}
                  </span>
                </div>
              )}
              {activeView === 'dsm' && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Status</span>
                  <span className="text-green-400 font-medium">Live</span>
                </div>
              )}
            </div>
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
};

export default ResolutionWidget;
