import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Star, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { useMultiModelForecast, CITY_COORDS } from '../../../hooks/useMultiModelForecast';

export default function ForecastModels({ citySlug, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const { forecasts, loading, error, refetch, lastUpdated } = useMultiModelForecast(citySlug);

  const getUncertaintyLevel = (spread) => {
    if (spread <= 2) return { level: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' };
    if (spread <= 4) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/20' };
    return { level: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/20' };
  };

  const formatLastUpdated = (date) => {
    if (!date) return '';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getDayLabel = (index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <span className="text-sm">Failed to load forecast models</span>
        </div>
        <button onClick={refetch} className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline">Try again</button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
          <TrendingUp size={18} className="text-orange-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Forecast Models</span>
          {forecasts && <span className="text-xs text-gray-500">{forecasts.models.length} models</span>}
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-xs text-gray-500">{formatLastUpdated(lastUpdated)}</span>}
          <button onClick={refetch} className={`p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded ${loading ? 'animate-spin' : ''}`} disabled={loading}>
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {loading && !forecasts ? (
            <div className="py-8 flex items-center justify-center">
              <RefreshCw size={16} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400 ml-2">Loading models...</span>
            </div>
          ) : forecasts ? (
            <>
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {forecasts.dates.slice(0, 5).map((date, i) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDay(i)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedDay === i
                        ? 'bg-orange-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/30'
                        : 'bg-gray-100 dark:bg-[#222] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] border border-transparent'
                    }`}
                  >
                    {getDayLabel(i)}
                  </button>
                ))}
              </div>

              {(() => {
                const dayHighs = forecasts.models.map(m => m.daily[selectedDay]?.high).filter(h => h != null);
                const spread = Math.max(...dayHighs) - Math.min(...dayHighs);
                const avg = Math.round(dayHighs.reduce((a, b) => a + b, 0) / dayHighs.length);
                const uncertainty = getUncertaintyLevel(spread);

                return (
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Model Consensus</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{avg}°F</span>
                          <span className="text-sm text-gray-500">({Math.min(...dayHighs)}° – {Math.max(...dayHighs)}°)</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg ${uncertainty.bg}`}>
                        <span className={`text-xs font-medium ${uncertainty.color}`}>{spread}° spread</span>
                      </div>
                    </div>
                    {spread >= 4 && (
                      <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400/80 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Models disagree significantly
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                {forecasts.models.sort((a, b) => a.priority - b.priority).map(model => {
                  const dayData = model.daily[selectedDay];
                  if (!dayData) return null;

                  const allHighs = forecasts.models.map(m => m.daily[selectedDay]?.high).filter(h => h != null);
                  const minHigh = Math.min(...allHighs);
                  const maxHigh = Math.max(...allHighs);
                  const isHighest = dayData.high === maxHigh && maxHigh !== minHigh;
                  const isLowest = dayData.high === minHigh && maxHigh !== minHigh;

                  return (
                    <div
                      key={model.id}
                      className={`p-3 rounded-xl border ${
                        isHighest ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                          : isLowest ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                          : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {model.priority === 1 && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                        <span className="text-xs text-gray-500">{model.name}</span>
                        <span className="text-[10px] text-gray-400">{model.resolution}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        isHighest ? 'text-red-600 dark:text-red-400'
                          : isLowest ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>{dayData.high}°F</span>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const coords = CITY_COORDS[citySlug?.toLowerCase()];
                if (!coords) return null;
                const openMeteoUrl = `https://open-meteo.com/en/docs#latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;
                return (
                  <div className="mt-4 flex justify-end">
                    <a href={openMeteoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
                      View on Open-Meteo <ExternalLink size={12} />
                    </a>
                  </div>
                );
              })()}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
