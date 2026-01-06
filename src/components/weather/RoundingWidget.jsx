import { useState, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Calculator, ChevronUp, ChevronDown, ChevronRight, Info, Bot } from 'lucide-react';
import GlassWidget from './GlassWidget';
import SelectableData from '../widgets/SelectableData';
import { findRange, findCelsiusRange, getPrintedRange, findASOSRange, findMETARRange } from '../../utils/roundingCalculator';

// Lazy load the heavy modal component
const RoundingModal = lazy(() => import('./RoundingModal'));

/**
 * RoundingWidget - Shows the real temperature range based on NWS rounding
 *
 * Displays the running high (or current observation) and the range of possible
 * actual temperatures that could have produced that displayed value through
 * NWS's rounding process.
 *
 * ASOS 5-minute: F→C→F double conversion (~±1°F uncertainty)
 * METAR hourly: C→F single conversion (~±0.9°F uncertainty)
 *
 * Supports inline expansion on desktop, modal on mobile.
 */
export default function RoundingWidget({
  currentTemp,
  runningHigh,
  observationType = 'asos',
  loading = false,
  isExpanded = false,
  onToggleExpand,
}) {
  // Use running high if available, otherwise fall back to current temp
  const displayTemp = runningHigh ?? currentTemp;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [celsiusOffset, setCelsiusOffset] = useState(0);

  // Mobile detection for expansion behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handle widget click - expand inline on desktop, modal on mobile
  const handleWidgetClick = () => {
    if (isMobile) {
      setIsModalOpen(true);
    } else if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  };

  // Calculate the real range for the displayed temperature (running high or current)
  const baseRangeData = displayTemp !== null && displayTemp !== undefined
    ? findRange(Math.round(displayTemp), observationType)
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

  // Render expanded inline view on desktop
  if (isExpanded && !isMobile) {
    return (
      <ExpandedRoundingInline
        displayTemp={displayTemp}
        observationType={observationType}
        onCollapse={onToggleExpand}
      />
    );
  }

  return (
    <>
      <GlassWidget
        title="ROUNDING"
        icon={Calculator}
        size="small"
        className="cursor-pointer"
        onClick={handleWidgetClick}
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
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-400/60"
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/60 w-10 text-right">
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

      {/* Modal - Lazy loaded */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <RoundingModal
            currentTemp={rangeData.displayedF}
            runningHigh={runningHigh}
            observationType={observationType}
            onClose={() => setIsModalOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

RoundingWidget.propTypes = {
  currentTemp: PropTypes.number,
  runningHigh: PropTypes.number,
  observationType: PropTypes.oneOf(['asos', 'metar']),
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedRoundingInline - Inline expanded view with calculator and info
 */
function ExpandedRoundingInline({ displayTemp, observationType, onCollapse }) {
  const [activeTab, setActiveTab] = useState('calculator');
  const [calcMode, setCalcMode] = useState(observationType);
  const [calcUnit, setCalcUnit] = useState('f');
  const [calcInput, setCalcInput] = useState(displayTemp?.toString() || '70');

  // Calculate range for current input
  const inputValue = parseInt(calcInput, 10);
  const isValidInput = !isNaN(inputValue) && inputValue >= -50 && inputValue <= 150;

  let calcRange = null;
  if (isValidInput) {
    if (calcUnit === 'c') {
      calcRange = findCelsiusRange(inputValue);
    } else if (calcMode === 'metar') {
      calcRange = findMETARRange(inputValue);
    } else {
      calcRange = findASOSRange(inputValue);
    }
  }

  // Get printed range for display
  const printed = calcRange ? getPrintedRange(
    calcUnit === 'c' ? calcRange.minF : calcRange.min,
    calcUnit === 'c' ? calcRange.maxF : calcRange.max
  ) : null;

  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-white/60" />
          <span className="text-sm font-semibold text-white">Temperature Rounding</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 text-white/60 rotate-180" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white/5 mx-3 mt-2 rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'calculator'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Calculator
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'info'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          How It Works
        </button>
        <button
          onClick={() => setActiveTab('omo')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'omo'
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          OMO Bots
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'calculator' && (
          <div className="space-y-3">
            {/* Mode and Unit Toggles */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-white/40 block mb-1">Data Type</label>
                <div className="flex bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setCalcMode('asos')}
                    className={`flex-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      calcMode === 'asos'
                        ? 'bg-orange-500/30 text-orange-300'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    ASOS
                  </button>
                  <button
                    onClick={() => setCalcMode('metar')}
                    className={`flex-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      calcMode === 'metar'
                        ? 'bg-blue-500/30 text-blue-300'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    METAR
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-white/40 block mb-1">Unit</label>
                <div className="flex bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setCalcUnit('f')}
                    className={`flex-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      calcUnit === 'f' ? 'bg-white/20 text-white' : 'text-white/50'
                    }`}
                  >
                    °F
                  </button>
                  <button
                    onClick={() => setCalcUnit('c')}
                    className={`flex-1 px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      calcUnit === 'c' ? 'bg-white/20 text-white' : 'text-white/50'
                    }`}
                  >
                    °C
                  </button>
                </div>
              </div>
            </div>

            {/* Temperature Input */}
            <div className="relative">
              <input
                type="number"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xl font-light text-white text-center focus:outline-none focus:border-white/40"
                min={-50}
                max={150}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                °{calcUnit.toUpperCase()}
              </span>
            </div>

            {/* Results */}
            {isValidInput && printed && (
              <div className={`p-3 rounded-lg ${
                printed.isSplit
                  ? 'bg-amber-500/15 border border-amber-500/30'
                  : 'bg-green-500/15 border border-green-500/30'
              }`}>
                <div className="text-[10px] text-white/50 uppercase tracking-wide mb-2 text-center">
                  Could Print As {printed.isSplit && `(${printed.count} outcomes)`}
                </div>
                <div className="space-y-1.5">
                  {printed.values.map((item) => (
                    <div key={item.temp} className="flex items-center gap-2">
                      <span className={`text-sm font-semibold w-10 ${
                        printed.isSplit ? 'text-amber-300' : 'text-green-300'
                      }`}>
                        {item.temp}°F
                      </span>
                      <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            printed.isSplit ? 'bg-amber-500/60' : 'bg-green-500/60'
                          }`}
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-white/70 w-10 text-right">
                        {item.probability}%
                      </span>
                    </div>
                  ))}
                </div>
                {calcRange && (
                  <div className="text-[10px] text-white/40 mt-2 text-center">
                    True range: {calcRange.min}°F to {calcRange.max}°F (±{calcRange.uncertainty}°F)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-3 text-xs">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <p className="text-amber-200/90">
                NWS uses two different data reporting methods with different precision levels.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-medium px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded">ASOS</span>
                <span className="text-white/80 font-medium">5-Minute (F→C→F)</span>
              </div>
              <p className="text-white/60 text-[11px]">
                Double conversion creates ~±1°F uncertainty
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-medium px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">METAR</span>
                <span className="text-white/80 font-medium">Hourly (C→F)</span>
              </div>
              <p className="text-white/60 text-[11px]">
                Single conversion has ~±0.9°F uncertainty
              </p>
            </div>

            <div className="text-[10px] text-white/50">
              Markets settle on displayed NWS values, not actual sensor readings.
            </div>
          </div>
        )}

        {activeTab === 'omo' && (
          <div className="space-y-3 text-xs">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
              <p className="text-red-200/90 text-[11px]">
                <span className="font-semibold">Warning:</span> Be cautious with limit orders when temp is near the day's high in cities with active OMO bots.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-white/80 font-medium">One-Minute Observation</span>
              </div>
              <p className="text-white/60 text-[11px]">
                Bots dial into ASOS phone lines to get temperature readings between public 5-minute updates.
              </p>
            </div>

            <div className="text-[10px] text-white/50">
              This gives operators a brief window of non-public information.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10">
        <p className="text-[9px] text-white/40 text-center">
          Based on NWS ASOS/METAR observation procedures
        </p>
      </div>
    </div>
  );
}

ExpandedRoundingInline.propTypes = {
  displayTemp: PropTypes.number,
  observationType: PropTypes.oneOf(['asos', 'metar']),
  onCollapse: PropTypes.func.isRequired,
};
