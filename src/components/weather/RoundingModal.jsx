import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, ArrowRight, Info, Calculator, Bot, AlertTriangle, Clock, Phone } from 'lucide-react';
import {
  findASOSRange,
  findMETARRange,
  findCelsiusRange,
  simulateASOSForward,
  simulateMETARForward,
  formatRange,
  getPrintedRange,
} from '../../utils/roundingCalculator';

/**
 * RoundingModal - Detailed view of NWS temperature rounding
 *
 * Two tabs:
 * 1. How It Works - Explanation of ASOS vs METAR processes
 * 2. Calculator - Interactive tool with C/F and ASOS/METAR toggles
 */
export default function RoundingModal({ currentTemp, runningHigh, observationType = 'asos', onClose }) {
  // Default to running high if available, otherwise use current temp
  const defaultTemp = runningHigh ?? currentTemp;
  const [activeTab, setActiveTab] = useState('calculator');
  const [calcMode, setCalcMode] = useState(observationType); // 'asos' | 'metar'
  const [calcUnit, setCalcUnit] = useState('f'); // 'f' | 'c'
  const [calcInput, setCalcInput] = useState(defaultTemp?.toString() || '70');

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
                  Temperature Rounding
                </h2>
                <p className="text-sm text-white/60">
                  Understanding NWS data precision
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
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calculator</span>
                <span className="sm:hidden">Calc</span>
              </button>
              <button
                onClick={() => setActiveTab('explanation')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'explanation'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">How It Works</span>
                <span className="sm:hidden">Info</span>
              </button>
              <button
                onClick={() => setActiveTab('omo')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'omo'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">OMO Bots</span>
                <span className="sm:hidden">OMO</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] glass-scroll">
            {activeTab === 'explanation' && <ExplanationTab />}
            {activeTab === 'calculator' && (
              <CalculatorTab
                input={calcInput}
                onInputChange={setCalcInput}
                mode={calcMode}
                onModeChange={setCalcMode}
                unit={calcUnit}
                onUnitChange={setCalcUnit}
                rangeData={calcRange}
                isValid={isValidInput}
              />
            )}
            {activeTab === 'omo' && <OMOBotsTab />}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Based on NWS ASOS/METAR observation procedures
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

RoundingModal.propTypes = {
  currentTemp: PropTypes.number,
  runningHigh: PropTypes.number,
  observationType: PropTypes.oneOf(['asos', 'metar']),
  onClose: PropTypes.func.isRequired,
};

/**
 * ExplanationTab - Visual explanation of ASOS vs METAR rounding
 */
function ExplanationTab() {
  // Example for ASOS
  const asosExample = simulateASOSForward(69.7);
  const asosRange = findASOSRange(asosExample.step5_displayedF);

  // Example for METAR
  const metarExample = simulateMETARForward(20.7);
  const metarRange = findMETARRange(metarExample.step3_displayedF);

  return (
    <div className="p-4 space-y-5">
      {/* Intro */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <p className="text-sm text-amber-200/90">
          NWS uses two different data reporting methods with different levels of precision.
          Understanding these differences is critical for trading temperature markets.
        </p>
      </div>

      {/* ASOS Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded">
            ASOS
          </span>
          <h3 className="text-sm font-semibold text-white">5-Minute Data (F→C→F)</h3>
        </div>

        <p className="text-xs text-white/60 mb-3">
          ASOS stations record temperature in Fahrenheit, convert to Celsius for storage,
          then convert back to Fahrenheit for display. This double-conversion creates more uncertainty.
        </p>

        <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
          <RoundingStep
            step={1}
            label="Measure & round to °F"
            before={`${asosExample.original}°F`}
            after={`${asosExample.step1_roundedF}°F`}
            note="OMO"
          />
          <RoundingStep
            step={2}
            label="Convert to °C"
            before={`${asosExample.step1_roundedF}°F`}
            after={`${asosExample.step2_celsiusExact}°C`}
          />
          <RoundingStep
            step={3}
            label="Round to whole °C"
            before={`${asosExample.step2_celsiusExact}°C`}
            after={`${asosExample.step3_roundedC}°C`}
            highlight
          />
          <RoundingStep
            step={4}
            label="Convert back to °F"
            before={`${asosExample.step3_roundedC}°C`}
            after={`${asosExample.step4_fahrenheitExact}°F`}
            note="Graph"
          />
          <RoundingStep
            step={5}
            label="Round to whole °F"
            before={`${asosExample.step4_fahrenheitExact}°F`}
            after={`${asosExample.step5_displayedF}°F`}
            note="List"
            highlight
          />
        </div>

        <div className="mt-2 text-xs text-white/50">
          Uncertainty: <span className="text-orange-300 font-medium">±{asosRange.uncertainty}°F</span>
          {' '}(actual range: {formatRange(asosRange.min, asosRange.max)})
        </div>
      </div>

      {/* METAR Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
            METAR
          </span>
          <h3 className="text-sm font-semibold text-white">Hourly Data (C→F)</h3>
        </div>

        <p className="text-xs text-white/60 mb-3">
          METAR reports measure in Celsius first, then convert to Fahrenheit.
          This single conversion has less uncertainty than ASOS.
        </p>

        <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
          <RoundingStep
            step={1}
            label="Measure & round to °C"
            before={`${metarExample.original}°C`}
            after={`${metarExample.step1_roundedC}°C`}
            highlight
          />
          <RoundingStep
            step={2}
            label="Convert to °F"
            before={`${metarExample.step1_roundedC}°C`}
            after={`${metarExample.step2_fahrenheitExact}°F`}
          />
          <RoundingStep
            step={3}
            label="Round to whole °F"
            before={`${metarExample.step2_fahrenheitExact}°F`}
            after={`${metarExample.step3_displayedF}°F`}
            note="Displayed"
            highlight
          />
        </div>

        <div className="mt-2 text-xs text-white/50">
          Uncertainty: <span className="text-blue-300 font-medium">±{metarRange.uncertainty}°F</span>
          {' '}(actual range: {formatRange(metarRange.min, metarRange.max)})
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="bg-white/5 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-white mb-2">Key Takeaways</h3>
        <ul className="space-y-1.5 text-xs text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">1.</span>
            <span><span className="text-orange-300">ASOS</span> has more uncertainty (~±1°F) due to F→C→F double conversion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">2.</span>
            <span><span className="text-blue-300">METAR</span> has less uncertainty (~±0.9°F) with single C→F conversion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">3.</span>
            <span>Markets settle on displayed NWS values, not actual sensor readings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">4.</span>
            <span>Edge cases near bracket boundaries have higher risk</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * OMOBotsTab - Information about One-Minute Observation bots
 */
function OMOBotsTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-300 mb-1">Trading Warning</h3>
          <p className="text-xs text-red-200/80">
            Be cautious leaving limit orders exposed when the current temperature is near the day's high,
            especially in cities where OMO bots are known to be active.
          </p>
        </div>
      </div>

      {/* What is OMO */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">What is OMO?</h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          <span className="text-purple-300 font-medium">OMO</span> stands for{' '}
          <span className="text-white">One-Minute Observation</span>. Some ASOS stations allow access
          to near-real-time data via a dial-in phone system, traditionally used by pilots.
          Automated bots can call this system to retrieve temperature readings.
        </p>
      </div>

      {/* The Advantage */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-semibold text-white">The Information Advantage</h4>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Public NWS Time Series data only shows <span className="text-white">5-minute readings</span>.
          OMO bots can potentially access temperature readings for the minutes{' '}
          <span className="text-amber-300">between</span> those public reports, giving operators
          a brief window of non-public information.
        </p>
      </div>

      {/* How It Works */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-white">How It Works</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-300 flex-shrink-0">
              1
            </span>
            <p className="text-xs text-white/70">
              Bot dials into the ASOS station's phone line
            </p>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-300 flex-shrink-0">
              2
            </span>
            <p className="text-xs text-white/70">
              System reads current conditions (temperature in °C)
            </p>
          </div>
          <div className="flex items-start gap-3 bg-white/5 rounded-lg p-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-300 flex-shrink-0">
              3
            </span>
            <p className="text-xs text-white/70">
              Bot parses audio and acts before public data updates
            </p>
          </div>
        </div>
      </div>

      {/* Key Details */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-white">Key Details</h4>

        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs">•</span>
            <p className="text-xs text-white/70">
              <span className="text-white">Data Format:</span> Temperature is provided in Celsius (°C),
              so it still has rounding ambiguity when converted to Fahrenheit
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs">•</span>
            <p className="text-xs text-white/70">
              <span className="text-white">Access Limitation:</span> Often only one call can access
              the ASOS line at a time
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs">•</span>
            <p className="text-xs text-white/70">
              <span className="text-white">City Variation:</span> Not all cities have active OMO bots;
              some markets are more affected than others
            </p>
          </div>
        </div>
      </div>

      {/* Market Implications */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-amber-300 mb-2">Market Implications</h4>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          If a bot hears a new maximum temperature (even just a new rounded °C value) before it's public,
          it might quickly fill orders that become unfavorable due to the new information.
          This is especially risky for limit orders near the day's current high temperature.
        </p>
      </div>
    </div>
  );
}

/**
 * RoundingStep - Single step visualization
 */
function RoundingStep({ step, label, before, after, note, highlight }) {
  return (
    <div className={`flex items-center gap-2 py-1 px-2 rounded ${highlight ? 'bg-white/5' : ''}`}>
      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50 flex-shrink-0">
        {step}
      </span>
      <span className="text-[11px] text-white/70 flex-1">{label}</span>
      <div className="flex items-center gap-1 text-[11px]">
        <span className="text-white/40">{before}</span>
        <ArrowRight className="w-3 h-3 text-white/30" />
        <span className={highlight ? 'text-amber-300 font-medium' : 'text-white'}>{after}</span>
        {note && (
          <span className="text-[9px] px-1 py-0.5 bg-white/10 text-white/50 rounded ml-1">
            {note}
          </span>
        )}
      </div>
    </div>
  );
}

RoundingStep.propTypes = {
  step: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  before: PropTypes.string.isRequired,
  after: PropTypes.string.isRequired,
  note: PropTypes.string,
  highlight: PropTypes.bool,
};

/**
 * CalculatorTab - Interactive temperature calculator
 */
function CalculatorTab({ input, onInputChange, mode, onModeChange, unit, onUnitChange, rangeData, isValid }) {
  return (
    <div className="p-4 space-y-4">
      {/* Toggles */}
      <div className="flex gap-3">
        {/* Data Type Toggle */}
        <div className="flex-1">
          <label className="text-[10px] text-white/40 block mb-1.5">Data Type</label>
          <div className="flex bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange('asos')}
              className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                mode === 'asos'
                  ? 'bg-orange-500/30 text-orange-300'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              ASOS
            </button>
            <button
              onClick={() => onModeChange('metar')}
              className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                mode === 'metar'
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              METAR
            </button>
          </div>
        </div>

        {/* Unit Toggle */}
        <div className="flex-1">
          <label className="text-[10px] text-white/40 block mb-1.5">Unit</label>
          <div className="flex bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onUnitChange('f')}
              className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                unit === 'f'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              °F
            </button>
            <button
              onClick={() => onUnitChange('c')}
              className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                unit === 'c'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              °C
            </button>
          </div>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="text-[10px] text-white/40 block mb-1.5">
          Enter displayed temperature
        </label>
        <div className="relative">
          <input
            type="number"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-2xl font-light text-white text-center focus:outline-none focus:border-white/40 transition-colors"
            min={-50}
            max={150}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
            °{unit.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Results */}
      {isValid && rangeData && (
        <>
          {/* Range Display */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-[10px] text-white/40 mb-3 text-center uppercase tracking-wide">
              Actual Temperature Range
            </h3>

            {(() => {
              // Calculate printed range for market outcomes
              const minF = unit === 'c' ? rangeData.minF : rangeData.min;
              const maxF = unit === 'c' ? rangeData.maxF : rangeData.max;
              const printed = getPrintedRange(minF, maxF);

              return (
                <>
                  {/* PRINTED RANGE - Most important for trading */}
                  <div className={`mb-4 p-3 rounded-lg ${
                    printed.isSplit
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'bg-green-500/15 border border-green-500/30'
                  }`}>
                    <div className="text-[10px] text-white/50 uppercase tracking-wide mb-2 text-center">
                      Could Print As {printed.isSplit && `(${printed.count} outcomes)`}
                    </div>

                    {/* Probability Distribution */}
                    <div className="space-y-2">
                      {printed.values.map((item) => (
                        <div key={item.temp} className="flex items-center gap-3">
                          <span className={`text-lg font-semibold w-12 ${
                            printed.isSplit ? 'text-amber-300' : 'text-green-300'
                          }`}>
                            {item.temp}°F
                          </span>
                          <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                printed.isSplit ? 'bg-amber-500/60' : 'bg-green-500/60'
                              }`}
                              style={{ width: `${item.probability}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white/80 w-14 text-right">
                            {item.probability}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {printed.isSplit && (
                      <div className="text-[10px] text-amber-200/70 mt-3 text-center">
                        Assumes uniform distribution within true range
                      </div>
                    )}
                  </div>

                  {/* True Range (decimal) */}
                  {unit === 'c' ? (
                    <>
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="text-center">
                          <span className="text-lg font-light text-blue-300">{rangeData.minC}°C</span>
                        </div>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 via-white to-red-400 rounded-full" />
                        <div className="text-center">
                          <span className="text-lg font-light text-red-300">{rangeData.maxC}°C</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-white/50">
                        = {rangeData.minF}°F to {rangeData.maxF}°F (true range)
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <span className="text-lg font-light text-blue-300">{rangeData.min}°F</span>
                        </div>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 via-white to-red-400 rounded-full" />
                        <div className="text-center">
                          <span className="text-lg font-light text-red-300">{rangeData.max}°F</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-white/50 mt-1">
                        true range (±{rangeData.uncertainty}°F)
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* Calculation Details */}
          {unit === 'f' && (
            <div className="bg-white/5 rounded-lg p-3">
              <h4 className="text-[10px] text-white/40 mb-2 uppercase tracking-wide">
                How this was calculated ({mode.toUpperCase()})
              </h4>
              <div className="space-y-1 text-xs text-white/70">
                {mode === 'asos' ? (
                  <>
                    <p>• Displayed {rangeData.displayedF}°F came from rounding</p>
                    <p>• Intermediate Celsius: {rangeData.celsiusValue}°C</p>
                    <p>• Original F rounded to values that convert to {rangeData.celsiusValue}°C</p>
                    <p>• Combined original range: {rangeData.min}°F to {rangeData.max}°F</p>
                  </>
                ) : (
                  <>
                    <p>• Displayed {rangeData.displayedF}°F came from rounding</p>
                    <p>• Came from {rangeData.celsiusValue}°C (rounded)</p>
                    <p>• Original was {rangeData.celsiusValue - 0.5}°C to {rangeData.celsiusValue + 0.5}°C</p>
                    <p>• In Fahrenheit: {rangeData.min}°F to {rangeData.max}°F</p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!isValid && (
        <div className="text-center text-white/40 py-6">
          Enter a temperature between -50° and 150°
        </div>
      )}
    </div>
  );
}

CalculatorTab.propTypes = {
  input: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['asos', 'metar']).isRequired,
  onModeChange: PropTypes.func.isRequired,
  unit: PropTypes.oneOf(['f', 'c']).isRequired,
  onUnitChange: PropTypes.func.isRequired,
  rangeData: PropTypes.object,
  isValid: PropTypes.bool.isRequired,
};
