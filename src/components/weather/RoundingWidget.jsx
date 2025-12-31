import { useState } from 'react';
import PropTypes from 'prop-types';
import { Calculator, ChevronUp, ChevronDown } from 'lucide-react';
import GlassWidget from './GlassWidget';
import RoundingModal from './RoundingModal';
import SelectableData from '../widgets/SelectableData';
import { findRange, findCelsiusRange, getPrintedRange } from '../../utils/roundingCalculator';

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
  const [celsiusOffset, setCelsiusOffset] = useState(0);

  // Calculate the real range for the current temperature
  const baseRangeData = currentTemp !== null && currentTemp !== undefined
    ? findRange(Math.round(currentTemp), observationType)
    : null;

  // Get the base Celsius value and apply offset
  const baseCelsius = baseRangeData?.celsiusValue ?? 0;
  const displayCelsius = baseCelsius + celsiusOffset;

  // Calculate range for the displayed Celsius value (with offset)
  const rangeData = baseRangeData
    ? (celsiusOffset === 0 ? baseRangeData : findCelsiusRange(displayCelsius))
    : null;

  // Calculate printed range with probabilities
  const printed = rangeData
    ? getPrintedRange(
        celsiusOffset === 0 ? rangeData.min : rangeData.minF,
        celsiusOffset === 0 ? rangeData.max : rangeData.maxF
      )
    : null;

  const isCurrent = celsiusOffset === 0;

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
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          {/* Celsius stepper */}
          <div className="flex items-center justify-between w-full mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCelsiusOffset(prev => prev - 1);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/25 transition-colors"
              title="Previous °C"
            >
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>

            <div className="text-center">
              <span className={`text-base font-semibold ${
                isCurrent ? 'text-white' : 'text-blue-300'
              }`}>
                {displayCelsius}°C
              </span>
              <span className="text-sm font-light text-white/40 ml-1.5">
                {Math.round((displayCelsius * 9/5) + 32)}°F
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCelsiusOffset(prev => prev + 1);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/25 transition-colors"
              title="Next °C"
            >
              <ChevronUp className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Reset to current button (when offset) */}
          {!isCurrent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCelsiusOffset(0);
              }}
              className="text-[10px] text-white/40 hover:text-white/60 mb-2"
            >
              ← reset to {baseCelsius}°C
            </button>
          )}

          {/* Probability distribution */}
          {printed && (
            <SelectableData
              value={printed.values.length === 1
                ? `${printed.values[0].temp}°F`
                : `${printed.min}-${printed.max}°F`}
              label={`${displayCelsius}°C`}
              source="Rounding"
              type="rounding"
            >
              <div className="w-full">
                <div className="space-y-1">
                  {printed.values.map((item) => (
                    <div key={item.temp} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-12 text-white">
                        {item.temp}°F
                      </span>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400/40"
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/50 w-10 text-right">
                        {item.probability}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SelectableData>
          )}
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
