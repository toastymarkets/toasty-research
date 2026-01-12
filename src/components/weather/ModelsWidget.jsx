import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Activity, X, ChevronRight, TrendingUp, TrendingDown, Plus, Check, BookOpen, AlertTriangle, Maximize2, Star, ExternalLink, Globe } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import GlassWidget from './GlassWidget';
import ErrorState from '../ui/ErrorState';
import { useMultiModelForecast, MODELS } from '../../hooks/useMultiModelForecast';
import { insertModelsToNotes, NOTE_INSERTION_EVENT } from '../../utils/noteInsertionEvents';
import { getModelBias, getStarModel } from '../../data/modelBias';

/**
 * Get confidence label and color based on model spread
 */
function getConfidence(spread) {
  if (spread <= 3) return { label: 'HIGH', color: 'text-green-400', bg: 'bg-green-500/20' };
  if (spread <= 6) return { label: 'MED', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  return { label: 'LOW', color: 'text-red-400', bg: 'bg-red-500/20' };
}

/**
 * Insert a single model forecast to notes
 */
function insertSingleModelToNotes(model, dayData, dateLabel) {
  const createChip = (value, label, type) => ({
    type: 'dataChip',
    attrs: { value, label, type, source: '', timestamp: '' }
  });

  const content = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [
        createChip(`${model.name} ${dayData.high}°F`, dateLabel, 'forecast'),
      ]
    }]
  };

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'single-model',
      content,
      rawData: { model, dayData, dateLabel },
    }
  });

  window.dispatchEvent(event);
}

/**
 * ModelsWidget - Square 2x2 widget showing model consensus and spread
 * Apple Weather inspired design with large hero temperature
 */
export default function ModelsWidget({ citySlug, lat, lon, loading: externalLoading = false, isExpanded = false, onToggleExpand }) {
  const { forecasts, loading, error, refetch } = useMultiModelForecast(citySlug);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simple mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Get the star (best) model for this city
  const starModel = getStarModel(citySlug);

  // Windy.com URL for this location
  const windyUrl = lat && lon
    ? `https://www.windy.com/?temp,${lat},${lon},10`
    : 'https://www.windy.com';

  if (loading || externalLoading) {
    return (
      <div className="glass-widget h-full flex flex-row">
        <div className="flex flex-col justify-center px-4 py-2 border-r border-white/10 min-w-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">Models</span>
          </div>
          <div className="animate-pulse">
            <div className="w-14 h-8 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center animate-pulse">
          <div className="w-full h-6 mx-3 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error || !forecasts) {
    return (
      <div className="glass-widget h-full flex flex-row">
        <div className="flex flex-col justify-center px-4 py-2 border-r border-white/10 min-w-[100px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">Models</span>
          </div>
          <span className="text-xl text-white/30">--°</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-3">
          <ErrorState
            message={error || 'Unable to load'}
            onRetry={() => refetch(true)}
            compact
          />
        </div>
      </div>
    );
  }

  const { models, consensus } = forecasts;
  const avgTemp = Math.round((consensus.min + consensus.max) / 2);
  const confidence = getConfidence(consensus.spread);

  // Sort models by temperature for display
  const sortedModels = [...models].sort((a, b) => (a.daily[0]?.high || 0) - (b.daily[0]?.high || 0));

  // Handle expand click
  const handleExpandClick = (e) => {
    e.stopPropagation();
    if (isMobile) {
      setIsModalOpen(true);
    } else if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsModalOpen(true);
    }
  };

  // Render inline expanded view on desktop
  if (isExpanded && !isMobile) {
    return (
      <ExpandedModelsInline
        forecasts={forecasts}
        onCollapse={onToggleExpand}
        citySlug={citySlug}
        lat={lat}
        lon={lon}
      />
    );
  }

  // Calculate spread percentage for visual indicator
  const spreadPercent = Math.min(100, (consensus.spread / 10) * 100);

  return (
    <>
      <div className="glass-widget h-full flex flex-row overflow-hidden group cursor-pointer" onClick={handleExpandClick}>
        {/* Left Section - Hero Consensus */}
        <div className="flex flex-col justify-center items-center px-5 py-3 min-w-[110px] relative">
          {/* Subtle gradient glow behind temp */}
          <div
            className={`absolute inset-0 opacity-20 ${
              confidence.label === 'HIGH' ? 'bg-gradient-to-br from-green-500/30 to-transparent' :
              confidence.label === 'MED' ? 'bg-gradient-to-br from-yellow-500/30 to-transparent' :
              'bg-gradient-to-br from-red-500/30 to-transparent'
            }`}
          />

          <div className="relative">
            {/* Consensus Temperature - Large and prominent */}
            <div className="text-4xl font-extralight text-white tabular-nums tracking-tight leading-none">
              {avgTemp}°
            </div>

            {/* Confidence Badge - Pill style */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${confidence.bg} backdrop-blur-sm`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  confidence.label === 'HIGH' ? 'bg-green-400' :
                  confidence.label === 'MED' ? 'bg-yellow-400' : 'bg-red-400'
                } animate-pulse`} />
                <span className={confidence.color}>±{Math.round(consensus.spread / 2)}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Divider with gradient */}
        <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Right Section - Model Spread Visualization */}
        <div className="flex-1 flex flex-col justify-center py-2 px-4 min-w-0 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-white/40" />
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Model Consensus</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Expand</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Model Spread Visualization - Elegant Bar */}
          <div className="relative h-8 mb-2">
            {/* Temperature Range Bar */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              {/* Gradient fill showing spread */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-white/20 to-orange-500/40" />
            </div>

            {/* Model Dots with better spacing */}
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2">
              {sortedModels.map((model, index) => {
                const temp = model.daily[0]?.high;
                if (!temp) return null;
                const range = consensus.max - consensus.min || 1;
                const position = ((temp - consensus.min) / range) * 100;
                const isStar = model.name === starModel;

                return (
                  <div
                    key={model.id}
                    className="absolute transition-all duration-300 group/dot"
                    style={{
                      left: `${Math.max(2, Math.min(98, position))}%`,
                      transform: 'translateX(-50%)',
                      zIndex: isStar ? 10 : index
                    }}
                    title={`${model.name}: ${temp}°F`}
                  >
                    {/* Glow effect for star model */}
                    {isStar && (
                      <div className="absolute inset-0 -m-1 rounded-full bg-yellow-400/30 blur-sm" />
                    )}
                    <div
                      className={`relative w-3 h-3 rounded-full border-2 shadow-lg transition-transform hover:scale-125 ${
                        isStar
                          ? 'bg-yellow-400 border-yellow-200 shadow-yellow-400/50'
                          : 'border-white/60 shadow-black/20'
                      }`}
                      style={{ backgroundColor: isStar ? undefined : model.color }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Range Labels */}
            <div className="absolute left-0 bottom-0 text-[9px] text-blue-400/60 font-medium tabular-nums">{consensus.min}°</div>
            <div className="absolute right-0 bottom-0 text-[9px] text-orange-400/60 font-medium tabular-nums">{consensus.max}°</div>
          </div>

          {/* Model Legend - Compact pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {sortedModels.slice(0, 6).map((model) => {
              const temp = model.daily[0]?.high;
              const isStar = model.name === starModel;
              return (
                <div
                  key={model.id}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] whitespace-nowrap transition-colors ${
                    isStar ? 'bg-yellow-500/10' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: model.color }}
                  />
                  <span className={`${isStar ? 'text-yellow-200' : 'text-white/60'}`}>
                    {model.name}
                  </span>
                  <span className="text-white/30">{temp}°</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        <ModelsDetailModal
          forecasts={forecasts}
          onClose={() => setIsModalOpen(false)}
          citySlug={citySlug}
        />
      )}
    </>
  );
}

ModelsWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  lat: PropTypes.number,
  lon: PropTypes.number,
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

/**
 * ExpandedModelsInline - Inline expanded view for desktop
 */
function ExpandedModelsInline({ forecasts, onCollapse, citySlug, lat, lon }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [addedDay, setAddedDay] = useState(null);
  const [activeTab, setActiveTab] = useState('forecast');
  const { models, consensus, dates, city } = forecasts;
  const starModel = getStarModel(citySlug);

  // Prepare chart data
  const chartData = useMemo(() => {
    return dates.slice(0, 7).map((date, idx) => {
      const dataPoint = {
        day: idx === 0 ? 'Today' : idx === 1 ? 'Tmw' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayIndex: idx,
      };
      models.forEach(model => {
        dataPoint[model.name] = model.daily[idx]?.high;
      });
      return dataPoint;
    });
  }, [dates, models]);

  const formatDate = (dateStr, index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tmw';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

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

  const handleAddToNotes = () => {
    const dateLabel = formatDate(dates[selectedDay], selectedDay);
    insertModelsToNotes({
      dayConsensus,
      models,
      selectedDay,
      dateLabel,
    });
    setAddedDay(selectedDay);
    setTimeout(() => setAddedDay(null), 1500);
  };

  const wasAdded = addedDay === selectedDay;

  return (
    <div className="glass-widget h-full flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold text-white">Model Comparison</span>
            <span className="text-xs text-white/40">{city}</span>
          </div>
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            title="Collapse"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Tab bar + Day selector row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Tabs */}
          <div className="flex gap-0.5 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                activeTab === 'forecast' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Forecast
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                activeTab === 'learn' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Learn
            </button>
          </div>

          {/* Day selector - only on forecast tab */}
          {activeTab === 'forecast' && (
            <div className="flex gap-1 overflow-x-auto">
              {dates.slice(0, 7).map((date, idx) => (
                <button
                  key={date}
                  onClick={() => setSelectedDay(idx)}
                  className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                    selectedDay === idx
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {formatDate(date, idx)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'forecast' ? (
          <div className="h-full flex flex-col">
            {/* Top section: Consensus + Chart side by side */}
            <div className="flex gap-3 p-3 border-b border-white/10">
              {/* Consensus */}
              <div className="flex-shrink-0 w-36">
                <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Consensus</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-orange-400" />
                    <span className="text-lg font-medium text-white">{dayConsensus.highAvg}°</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-blue-400" />
                    <span className="text-sm text-white/60">{dayConsensus.lowAvg}°</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    dayConsensus.spread <= 3 ? 'bg-green-500/20 text-green-400' :
                    dayConsensus.spread <= 6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    ±{Math.round(dayConsensus.spread / 2)}°
                  </span>
                  <button
                    onClick={handleAddToNotes}
                    className={`p-1 rounded transition-all ${
                      wasAdded ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white/40'
                    }`}
                    title="Add to notes"
                  >
                    {wasAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="flex-1 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} width={25} tickFormatter={(v) => `${v}°`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '10px' }}
                      formatter={(value, name) => [`${value}°`, name]}
                    />
                    {models.map((model) => (
                      <Line key={model.id} type="monotone" dataKey={model.name} stroke={model.color} strokeWidth={1.5} dot={{ r: 2, fill: model.color }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model list - scrollable */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1.5">
                {[...models].sort((a, b) => (b.daily[selectedDay]?.high || 0) - (a.daily[selectedDay]?.high || 0)).map((model) => {
                  const dayData = model.daily[selectedDay];
                  if (!dayData) return null;
                  const diffFromAvg = dayData.high - dayConsensus.highAvg;
                  const isStar = model.name === starModel;
                  const bias = getModelBias(citySlug, model.name);

                  return (
                    <div key={model.id} className="flex items-center gap-2 py-1.5 px-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {isStar && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                        <span className="text-xs font-medium text-white truncate">{model.name}</span>
                        {bias && bias.bias !== 0 && (
                          <span className={`text-[9px] ${bias.bias > 0 ? 'text-orange-400/60' : 'text-blue-400/60'}`}>
                            ({bias.bias > 0 ? '+' : ''}{bias.bias})
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white tabular-nums">{dayData.high}°</span>
                      {diffFromAvg !== 0 && (
                        <span className={`text-[10px] tabular-nums w-8 text-right ${diffFromAvg > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                          {diffFromAvg > 0 ? '+' : ''}{diffFromAvg}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Learn tab */
          <div className="h-full overflow-y-auto p-3 space-y-3">
            <p className="text-xs text-white/60 leading-relaxed">
              Weather models are computer simulations predicting atmospheric conditions. Different models vary in accuracy based on weather patterns and timeframe.
            </p>

            {/* Model cards in compact 2-column grid */}
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map((model) => (
                <div key={model.id} className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                    <span className="text-xs font-medium text-white">{model.name}</span>
                    <span className="text-[9px] text-white/40">{model.provider}</span>
                  </div>
                  <div className="text-[10px] text-white/50 mt-1 line-clamp-2">{model.bestFor}</div>
                  {model.knownBias && (
                    <div className="flex items-start gap-1 mt-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                      <span className="text-[9px] text-amber-400/80 line-clamp-2">{model.knownBias}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Spread guide */}
            <div className="bg-white/5 rounded-lg p-2 text-[10px]">
              <p className="text-white/50 mb-1">Model Spread Guide:</p>
              <div className="flex gap-3">
                <span><span className="text-green-400">±1-3°</span> High conf.</span>
                <span><span className="text-yellow-400">±4-6°</span> Medium</span>
                <span><span className="text-red-400">±7°+</span> Low conf.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ExpandedModelsInline.propTypes = {
  forecasts: PropTypes.object.isRequired,
  onCollapse: PropTypes.func.isRequired,
  citySlug: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
};

/**
 * ModelsDetailModal - Detailed multi-model comparison
 */
function ModelsDetailModal({ forecasts, onClose, citySlug }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [addedDay, setAddedDay] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast');
  const { models, consensus, dates, city } = forecasts;
  const starModel = getStarModel(citySlug);

  // Prepare chart data
  const chartData = useMemo(() => {
    return dates.slice(0, 7).map((date, idx) => {
      const dataPoint = {
        day: idx === 0 ? 'Today' : idx === 1 ? 'Tmw' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayIndex: idx,
      };
      models.forEach(model => {
        dataPoint[model.name] = model.daily[idx]?.high;
      });
      return dataPoint;
    });
  }, [dates, models]);

  const formatDate = (dateStr, index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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

  const handleAddToNotes = () => {
    const dateLabel = formatDate(dates[selectedDay], selectedDay);
    insertModelsToNotes({
      dayConsensus,
      models,
      selectedDay,
      dateLabel,
    });
    setAddedDay(selectedDay);
    setTimeout(() => setAddedDay(null), 1500);
  };

  const wasAdded = addedDay === selectedDay;

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

            {/* Tab bar */}
            <div className="flex gap-1 mt-3 bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('forecast')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'forecast'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Activity className="w-3 h-3" />
                Forecast
              </button>
              <button
                onClick={() => setActiveTab('learn')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'learn'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Learn
              </button>
            </div>

            {/* Day selector */}
            {activeTab === 'forecast' && (
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
                {dates.slice(0, 7).map((date, idx) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDay(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedDay === idx
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {formatDate(date, idx)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FORECAST TAB */}
          {activeTab === 'forecast' && (
            <>
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
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-white/50">Spread</p>
                      <p className={`text-lg font-medium ${
                        dayConsensus.spread <= 3 ? 'text-green-400' :
                        dayConsensus.spread <= 6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        ±{Math.round(dayConsensus.spread / 2)}°
                      </p>
                    </div>
                    <button
                      onClick={handleAddToNotes}
                      className={`p-1.5 rounded-lg transition-all ${
                        wasAdded
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'hover:bg-white/10 text-white/40 hover:text-white/70'
                      }`}
                      title="Add to notes"
                    >
                      {wasAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart */}
              {showChart && (
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50 uppercase tracking-wide">7-Day High Temps</p>
                    <button
                      onClick={() => setShowChart(false)}
                      className="text-[10px] text-white/40 hover:text-white/60"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v}°`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(value, name) => [`${value}°`, name]}
                        />
                        {models.map((model) => (
                          <Line key={model.id} type="monotone" dataKey={model.name} stroke={model.color} strokeWidth={2} dot={{ r: 3, fill: model.color }} activeDot={{ r: 5 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {models.map((model) => (
                      <div key={model.id} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.color }} />
                        <span className="text-[9px] text-white/50">{model.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showChart && (
                <button
                  onClick={() => setShowChart(true)}
                  className="w-full px-4 py-2 text-xs text-white/50 hover:text-white/70 hover:bg-white/5 border-b border-white/10"
                >
                  Show Chart
                </button>
              )}

              {/* Models list */}
              <div className="overflow-y-auto max-h-[35vh]">
                {[...models].sort((a, b) => (b.daily[selectedDay]?.high || 0) - (a.daily[selectedDay]?.high || 0)).map((model) => {
                  const dayData = model.daily[selectedDay];
                  if (!dayData) return null;
                  const diffFromAvg = dayData.high - dayConsensus.highAvg;
                  const isStar = model.name === starModel;

                  return (
                    <div key={model.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }} />
                          <div>
                            <div className="flex items-center gap-2">
                              {isStar && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                              <span className="font-medium text-white">{model.name}</span>
                              <span className="text-[10px] text-white/40 px-1.5 py-0.5 bg-white/10 rounded">{model.resolution}</span>
                            </div>
                            <p className="text-xs text-white/50">{model.description}</p>
                          </div>
                        </div>
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
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-2 bg-white/5 border-t border-white/10">
                <p className="text-[10px] text-white/40 text-center">Data from Open-Meteo API</p>
              </div>
            </>
          )}

          {/* LEARN TAB */}
          {activeTab === 'learn' && (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm text-white/70 leading-relaxed">
                  Weather models are computer simulations that predict future atmospheric conditions.
                  Different models use different physics, resolutions, and data sources.
                </p>
              </div>

              <div className="px-4 py-3 space-y-3">
                <h3 className="text-xs text-white/50 uppercase tracking-wide">Models We Track</h3>
                {MODELS.map((model) => (
                  <div key={model.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                        <div>
                          <div className="font-medium text-white">{model.name}</div>
                          <div className="text-xs text-white/50">{model.fullName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/40">{model.provider}</div>
                        <div className="text-[10px] text-white/40">{model.resolution}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      <span className="text-white/40">Best for: </span>{model.bestFor}
                    </div>
                    {model.knownBias && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-amber-400/80">{model.knownBias}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-white/10">
                <h3 className="text-xs text-white/50 uppercase tracking-wide mb-2">Understanding Model Spread</h3>
                <div className="space-y-2 text-sm text-white/70">
                  <p><span className="text-green-400 font-medium">Tight spread (±1-3°)</span> = High confidence</p>
                  <p><span className="text-yellow-400 font-medium">Medium spread (±4-6°)</span> = Moderate uncertainty</p>
                  <p><span className="text-red-400 font-medium">Wide spread (±7°+)</span> = Low confidence</p>
                </div>
              </div>

              <div className="px-4 py-2 bg-white/5 border-t border-white/10">
                <p className="text-[10px] text-white/40 text-center">Research source: docs/WEATHER_MODELS_RESEARCH.md</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ModelsDetailModal.propTypes = {
  forecasts: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  citySlug: PropTypes.string,
};
