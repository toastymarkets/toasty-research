import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { getWeatherBackground, WeatherOverlay } from '../weather/DynamicWeatherBackground';
import { useAllCitiesWeather } from '../../hooks/useAllCitiesWeather';
import { useKalshiMultiBracketHistory } from '../../hooks/useKalshiMultiBracketHistory';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/**
 * Condense bracket label for compact display
 */
function condenseLabel(label) {
  if (!label) return '';
  return label
    .replace(/(\d+)°\s*(to|or)\s*(\d+)°/i, '$1-$3°')
    .replace(/(\d+)°\s*or above/i, '≥$1°')
    .replace(/(\d+)°\s*or below/i, '≤$1°');
}

/**
 * FeaturedMarketCard - Larger featured card for highest-volume market
 * Shows more data: current temp, price chart, 3 brackets
 */
export default function FeaturedMarketCard({ city }) {
  const cityConfig = CITY_BY_SLUG[city?.slug];
  const { getWeatherForCity } = useAllCitiesWeather();
  const weather = getWeatherForCity(city?.slug);
  const weatherBg = getWeatherBackground(weather?.condition, cityConfig?.timezone);

  const [timer, setTimer] = useState(null);

  const topBrackets = city?.topBrackets || [];
  const allBrackets = city?.brackets || topBrackets;
  const seriesTicker = city?.seriesTicker;
  const totalVolume = city?.totalVolume;
  const closeTime = city?.closeTime;

  // Fetch price history for the line chart - show all brackets over 24h
  const {
    data: chartData,
    legendData,
    bracketColors,
    loading: chartLoading,
  } = useKalshiMultiBracketHistory(seriesTicker, allBrackets, '1d', allBrackets.length || 10, !!seriesTicker);

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      if (!closeTime) {
        setTimer(null);
        return;
      }

      const now = new Date();
      const closeDate = closeTime instanceof Date ? closeTime : new Date(closeTime);
      const diff = closeDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimer({ formatted: 'Closed' });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimer({ formatted: `${hours}h ${minutes}m ${seconds}s` });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  if (!city) return null;

  return (
    <Link
      to={`/city/${city.slug}`}
      className="glass-widget glass-interactive glass-animate-in block overflow-hidden relative card-featured"
      style={{ background: weatherBg }}
    >
      <WeatherOverlay condition={weather?.condition} timezone={cityConfig?.timezone} index={0} />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
              {city.name}
            </h3>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/30 text-blue-300 font-medium border border-blue-500/30 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Top Volume
            </span>
          </div>
          {weather?.temperature && (
            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase">Current</p>
              <p className="text-xl font-bold text-white tabular-nums drop-shadow-lg">
                {Math.round(weather.temperature)}°F
              </p>
            </div>
          )}
        </div>

        {/* Price Chart + Brackets */}
        {topBrackets.length > 0 ? (
          <div className="mb-4">
            {/* Price History Chart */}
            <div className="h-[100px] mb-3 rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.07] overflow-hidden border border-white/5 relative" style={{ minWidth: '200px' }}>
              {chartLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-white/40">
                  Price history unavailable
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const timeData = payload[0]?.payload;
                        // Sort by value descending for tooltip
                        const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
                        return (
                          <div className="bg-black/90 backdrop-blur-md px-3 py-2 rounded-lg text-[10px] shadow-xl border border-white/10">
                            <div className="text-white/50 mb-1.5 text-[9px] uppercase tracking-wide">{timeData?.timeLabel}</div>
                            <div className="space-y-1">
                              {sortedPayload.map((entry, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                  <span className="text-white/70 flex-1">{condenseLabel(entry.dataKey)}</span>
                                  <span className="font-semibold text-white tabular-nums">{entry.value}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {legendData.map(({ label, color }, idx) => (
                      <Line
                        key={label}
                        type="monotone"
                        dataKey={label}
                        stroke={color}
                        strokeWidth={idx === 0 ? 2.5 : 2}
                        strokeOpacity={idx === 0 ? 1 : 0.7}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Compact Bracket List */}
            <div className="space-y-1.5">
              {topBrackets.slice(0, 3).map((bracket, i) => {
                const color = bracketColors[bracket.label] || '#3B82F6';
                return (
                  <div
                    key={bracket.ticker || i}
                    className="relative flex items-center justify-between py-2 px-3 rounded-lg"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-lg opacity-25"
                      style={{ width: `${bracket.yesPrice}%`, backgroundColor: color }}
                    />
                    <div className="relative flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-white">
                        {condenseLabel(bracket.label)}
                      </span>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {bracket.yesPrice}%
                      </span>
                      <div className="flex rounded-md overflow-hidden text-[9px] font-medium">
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400">Yes</span>
                        <span className="px-1.5 py-0.5 bg-white/10 text-white/50">No</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-white/40 mb-4">
            Loading market data...
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15">
          <span className="text-sm font-medium text-white/70">{formatVolume(totalVolume)}</span>
          {timer && (
            <span className="text-sm font-bold text-orange-400 tabular-nums">
              {timer.formatted}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
