import { useState } from 'react';
import PropTypes from 'prop-types';
import { Activity, X, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import GlassWidget from './GlassWidget';
import { useMultiModelForecast, MODELS } from '../../hooks/useMultiModelForecast';

/**
 * ModelsWidget - Shows multi-model forecast comparison
 * Compact view with detail modal on click
 */
export default function ModelsWidget({ citySlug, loading: externalLoading = false }) {
  const { forecasts, loading, error } = useMultiModelForecast(citySlug);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading || externalLoading) {
    return (
      <GlassWidget title="MODELS" icon={Activity} size="small">
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="w-full h-12 bg-white/10 rounded" />
        </div>
      </GlassWidget>
    );
  }

  if (error || !forecasts) {
    return (
      <GlassWidget title="MODELS" icon={Activity} size="small">
        <div className="flex items-center justify-center h-full text-white/40 text-xs">
          Unable to load models
        </div>
      </GlassWidget>
    );
  }

  const { models, consensus } = forecasts;

  return (
    <>
      <GlassWidget
        title="MODELS"
        icon={Activity}
        size="small"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex-1">
            {/* Consensus range */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-light text-white">
                {consensus.min}°-{consensus.max}°
              </span>
              <span className="text-xs text-white/50">today</span>
            </div>

            {/* Model dots */}
            <div className="flex gap-1 mt-2">
              {models.slice(0, 6).map((model) => (
                <div
                  key={model.id}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: model.color }}
                  title={`${model.name}: ${model.daily[0]?.high}°`}
                />
              ))}
            </div>

            {/* Spread indicator */}
            <p className="text-[10px] text-white/40 mt-1">
              {consensus.spread <= 3 ? 'Models agree' :
               consensus.spread <= 6 ? 'Some variance' : 'High uncertainty'}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-white/30" />
        </div>
      </GlassWidget>

      {/* Detail Modal */}
      {isModalOpen && (
        <ModelsDetailModal
          forecasts={forecasts}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

ModelsWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};

/**
 * ModelsDetailModal - Detailed multi-model comparison
 */
function ModelsDetailModal({ forecasts, onClose }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const { models, consensus, dates, city } = forecasts;

  // Get forecast for selected day
  const getDayForecast = (model, dayIndex) => model.daily[dayIndex];

  // Format date
  const formatDate = (dateStr, index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate day consensus
  const getDayConsensus = (dayIndex) => {
    const highs = models.map(m => m.daily[dayIndex]?.high).filter(h => h != null);
    const lows = models.map(m => m.daily[dayIndex]?.low).filter(l => l != null);
    return {
      highMin: Math.min(...highs),
      highMax: Math.max(...highs),
      highAvg: Math.round(highs.reduce((a, b) => a + b, 0) / highs.length),
      lowMin: Math.min(...lows),
      lowMax: Math.max(...lows),
      lowAvg: Math.round(lows.reduce((a, b) => a + b, 0) / lows.length),
      spread: Math.max(...highs) - Math.min(...highs),
    };
  };

  const dayConsensus = getDayConsensus(selectedDay);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[25] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:left-[300px] lg:right-[344px] pointer-events-none">
        <div className="glass-elevated relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in pointer-events-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Model Comparison</h2>
                <p className="text-sm text-white/60">{city} - 7 Day Forecast</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Day selector */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {dates.slice(0, 7).map((date, idx) => (
                <button
                  key={date}
                  onClick={() => setSelectedDay(idx)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${selectedDay === idx
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  {formatDate(date, idx)}
                </button>
              ))}
            </div>
          </div>

          {/* Consensus summary */}
          <div className="px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">Consensus</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-lg font-medium text-white">{dayConsensus.highAvg}°</span>
                    <span className="text-xs text-white/40">({dayConsensus.highMin}-{dayConsensus.highMax})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-blue-400" />
                    <span className="text-lg font-medium text-white">{dayConsensus.lowAvg}°</span>
                    <span className="text-xs text-white/40">({dayConsensus.lowMin}-{dayConsensus.lowMax})</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Spread</p>
                <p className={`text-lg font-medium ${
                  dayConsensus.spread <= 3 ? 'text-green-400' :
                  dayConsensus.spread <= 6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  ±{Math.round(dayConsensus.spread / 2)}°
                </p>
              </div>
            </div>
          </div>

          {/* Models list */}
          <div className="overflow-y-auto max-h-[45vh]">
            {models.map((model) => {
              const dayData = getDayForecast(model, selectedDay);
              if (!dayData) return null;

              const diffFromAvg = dayData.high - dayConsensus.highAvg;

              return (
                <div
                  key={model.id}
                  className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* Model info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{model.name}</span>
                          <span className="text-[10px] text-white/40 px-1.5 py-0.5 bg-white/10 rounded">
                            {model.resolution}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{model.description}</p>
                      </div>
                    </div>

                    {/* Temperatures */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-light text-white">{dayData.high}°</span>
                        <span className="text-sm text-white/40">{dayData.low}°</span>
                      </div>
                      {diffFromAvg !== 0 && (
                        <span className={`text-xs ${diffFromAvg > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                          {diffFromAvg > 0 ? '+' : ''}{diffFromAvg}° vs avg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Update frequency */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-white/30">
                      Updates: {model.updateFreq}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/5 border-t border-white/10">
            <p className="text-[10px] text-white/40 text-center">
              Data from Open-Meteo API • Models update at different intervals
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

ModelsDetailModal.propTypes = {
  forecasts: PropTypes.shape({
    models: PropTypes.array.isRequired,
    consensus: PropTypes.object.isRequired,
    dates: PropTypes.array.isRequired,
    city: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
