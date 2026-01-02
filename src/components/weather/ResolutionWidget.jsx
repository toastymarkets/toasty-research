import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, Clock } from 'lucide-react';
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
  const { data: dsmData, loading: dsmLoading } = useDSM(citySlug);
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
        <div className="flex flex-col h-full py-1">
          <div className="w-16 h-10 bg-white/10 rounded mb-2" />
          <div className="w-24 h-3 bg-white/10 rounded mb-1" />
          <div className="w-20 h-3 bg-white/10 rounded" />
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
          <div className="flex flex-col h-full py-1">
            {cliCountdown ? (
              <>
                <div className="text-3xl font-light text-white tracking-tight">
                  {cliCountdown.hours}h {cliCountdown.minutes}m
                </div>
                <div className="text-sm text-white/60 mt-2 leading-relaxed">
                  until next
                </div>
                <div className="text-sm text-white/60">
                  CLI report
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
        <div className="flex flex-col h-full py-1">
          {/* Toggle Pills */}
          <div className="flex gap-1 mb-2">
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
          <div className="text-3xl font-light text-white tracking-tight">
            {data?.high != null ? `${data.high}°` : '--'}
          </div>

          {/* Descriptor */}
          <div className="text-sm mt-2 leading-relaxed">
            <span className="font-semibold text-white">High</span>
            <span className="text-white/50"> · {data?.sublabel}</span>
          </div>

          {/* Bottom Stats */}
          <div className="mt-auto pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-white">Low</span>
              <span className="text-white">
                {data?.low != null ? `${data.low}°` : '--'}
              </span>
            </div>
            {activeView === 'cli' && cliCountdown && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Next
                </span>
                <span className="text-amber-400 font-medium">
                  {cliCountdown.formatted}
                </span>
              </div>
            )}
            {activeView === 'dsm' && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Updated</span>
                <span className="text-white/70">Live</span>
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
