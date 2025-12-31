import { useState } from 'react';
import PropTypes from 'prop-types';
import { Calculator } from 'lucide-react';
import GlassWidget from './GlassWidget';
import RoundingModal from './RoundingModal';
import { findRange, formatRange } from '../../utils/roundingCalculator';

/**
 * RoundingWidget - Shows the real temperature range based on NWS rounding
 *
 * Displays the current observation and the range of possible actual temperatures
 * that could have produced that displayed value through NWS's rounding process.
 *
 * ASOS 5-minute: F→C→F double conversion (~±1°F uncertainty)
 * METAR hourly: C→F single conversion (~±0.9°F uncertainty)
 */
export default function RoundingWidget({
  currentTemp,
  observationType = 'asos',
  loading = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate the real range for the current temperature
  const rangeData = currentTemp !== null && currentTemp !== undefined
    ? findRange(Math.round(currentTemp), observationType)
    : null;

  const typeLabel = observationType === 'metar' ? 'METAR' : 'ASOS';

  if (loading) {
    return (
      <GlassWidget title="ROUNDING" icon={Calculator} size="small">
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="w-16 h-8 bg-white/10 rounded mb-2" />
          <div className="w-24 h-4 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (rangeData === null) {
    return (
      <GlassWidget title="ROUNDING" icon={Calculator} size="small">
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-sm text-glass-text-muted text-center">
            No observation data
          </span>
        </div>
      </GlassWidget>
    );
  }

  return (
    <>
      <GlassWidget
        title="ROUNDING"
        icon={Calculator}
        size="small"
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-col items-start justify-center flex-1">
          {/* Type badge and displayed temperature */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
              observationType === 'metar'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-orange-500/20 text-orange-300'
            }`}>
              {typeLabel}
            </span>
          </div>

          {/* Displayed temperature */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light">{rangeData.displayedF}°</span>
            <span className="text-[11px] text-glass-text-muted">displayed</span>
          </div>

          {/* Real range */}
          <span className="text-[11px] text-glass-text-secondary">
            {formatRange(rangeData.min, rangeData.max)} actual
          </span>

          {/* Uncertainty */}
          <span className="text-[10px] text-glass-text-muted mt-0.5">
            ±{rangeData.uncertainty}°F uncertainty
          </span>
        </div>
      </GlassWidget>

      {/* Modal */}
      {isModalOpen && (
        <RoundingModal
          currentTemp={rangeData.displayedF}
          observationType={observationType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

RoundingWidget.propTypes = {
  currentTemp: PropTypes.number,
  observationType: PropTypes.oneOf(['asos', 'metar']),
  loading: PropTypes.bool,
};
