import { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, X, ExternalLink, Wind as WindIcon, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';

/**
 * Nearby stations for each primary station
 */
const NEARBY_STATIONS = {
  'KNYC': ['KJFK', 'KLGA', 'KEWR', 'KTEB'],
  'KMDW': ['KORD', 'KPWK', 'KDPA', 'KGYY'],
  'KLAX': ['KBUR', 'KSMO', 'KVNY', 'KLGB', 'KSNA'],
  'KMIA': ['KFLL', 'KOPF', 'KTMB', 'KHWO'],
  'KDEN': ['KAPA', 'KBJC', 'KFTG', 'KCOS'],
  'KAUS': ['KATT', 'KGTU', 'KHYI', 'KSAT'],
  'KPHL': ['KPNE', 'KTTN', 'KILG', 'KMIV'],
  'KHOU': ['KIAH', 'KELP', 'KDWH', 'KSGR'],
  'KSEA': ['KBFI', 'KRNT', 'KPAE', 'KTCM'],
  'KSFO': ['KOAK', 'KSJC', 'KHWD', 'KSQL'],
  'KBOS': ['KBVN', 'KOWD', 'KBED', 'KPVC'],
  'KDCA': ['KIAD', 'KBWI', 'KHEF', 'KADW'],
  'KDFW': ['KDAL', 'KADS', 'KAFW', 'KFTW'],
  'KDTW': ['KDET', 'KYIP', 'KARB', 'KPTK'],
  'KSLC': ['KPVU', 'KOGD', 'KLGU', 'KU42'],
};

/**
 * LiveStationData Widget
 * Comprehensive real-time weather observations from NWS station
 * with temperature trend chart and observation history table
 */
export default function LiveStationData({ stationId, cityName, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showAllObs, setShowAllObs] = useState(false);
  const [useMetric, setUseMetric] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  const nearbyStations = NEARBY_STATIONS[stationId] || [];

  // Fetch observations from a single station
  const fetchStationObs = async (station) => {
    try {
      const response = await fetch(
        `https://api.weather.gov/stations/${station}/observations?limit=20`,
        { headers: { 'User-Agent': 'Toasty Research App', 'Accept': 'application/geo+json' } }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const features = data.features || [];
      const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

      return features.map(f => {
        const props = f.properties;
        const tempC = props.temperature?.value;
        const dewC = props.dewpoint?.value;
        const windKmh = props.windSpeed?.value;
        const windDeg = props.windDirection?.value;
        const pressurePa = props.barometricPressure?.value;

        return {
          station,
          timestamp: props.timestamp ? new Date(props.timestamp) : null,
          tempC,
          tempF: tempC != null ? Math.round((tempC * 9/5) + 32) : null,
          dewpointC: dewC,
          dewpointF: dewC != null ? Math.round((dewC * 9/5) + 32) : null,
          humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null,
          windSpeedKmh: windKmh,
          windSpeedMph: windKmh != null ? Math.round(windKmh * 0.621371) : null,
          windDirection: windDeg != null ? dirs[Math.round(windDeg / 22.5) % 16] : null,
          pressurePa,
          pressureInHg: pressurePa != null ? (pressurePa * 0.0002953).toFixed(2) : null,
          pressureMb: pressurePa != null ? (pressurePa / 100).toFixed(1) : null,
          conditions: props.textDescription || null,
        };
      }).filter(o => o.timestamp);
    } catch {
      return [];
    }
  };

  // Fetch recent observations (last 6 hours)
  const fetchObservations = async () => {
    if (!stationId) return;
    setLoading(true);

    try {
      // Always fetch primary station
      const stationsToFetch = [stationId];

      // Add nearby stations if toggle is on
      if (showNearby && nearbyStations.length > 0) {
        stationsToFetch.push(...nearbyStations);
      }

      // Fetch all stations in parallel
      const allResults = await Promise.all(
        stationsToFetch.map(s => fetchStationObs(s))
      );

      // Flatten and sort by timestamp (most recent first)
      const allObs = allResults
        .flat()
        .sort((a, b) => b.timestamp - a.timestamp);

      setObservations(allObs);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
    const interval = setInterval(fetchObservations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stationId, showNearby]);

  // Current observation (most recent)
  const current = observations[0];

  // Calculate 1-hour trend
  const trend = useMemo(() => {
    if (observations.length < 2 || !current?.tempF) return null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourAgoObs = observations.find(o => o.timestamp && o.timestamp <= oneHourAgo);
    if (!hourAgoObs?.tempF) return null;
    const diff = current.tempF - hourAgoObs.tempF;
    if (Math.abs(diff) <= 1) return 'Stable';
    if (diff > 0) return `+${diff}°`;
    return `${diff}°`;
  }, [observations, current]);

  // Chart data (last 6 hours, reversed for chronological order)
  // When nearby stations are enabled, average observations within 5-minute windows
  const chartData = useMemo(() => {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const filtered = observations.filter(o => o.timestamp && o.timestamp >= sixHoursAgo && o.tempF != null);

    if (!showNearby || filtered.length === 0) {
      // Single station - just return as-is
      return filtered
        .map(o => ({
          time: o.timestamp.getTime(),
          temp: useMetric ? o.tempC : o.tempF,
          label: o.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        }))
        .reverse();
    }

    // Multiple stations - group by 5-minute intervals and average
    const intervalMs = 5 * 60 * 1000; // 5 minutes
    const buckets = new Map();

    filtered.forEach(o => {
      const bucketTime = Math.floor(o.timestamp.getTime() / intervalMs) * intervalMs;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime).push(useMetric ? o.tempC : o.tempF);
    });

    // Convert buckets to chart data with averaged temps
    return Array.from(buckets.entries())
      .map(([time, temps]) => ({
        time,
        temp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
        label: new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }))
      .sort((a, b) => a.time - b.time);
  }, [observations, useMetric, showNearby]);

  // Chart Y-axis domain
  const chartDomain = useMemo(() => {
    if (chartData.length === 0) return [50, 70];
    const temps = chartData.map(d => d.temp).filter(t => t != null);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const padding = Math.max(3, (max - min) * 0.2);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  // Average temp for reference line
  const avgTemp = useMemo(() => {
    if (chartData.length === 0) return null;
    const temps = chartData.map(d => d.temp).filter(t => t != null);
    return Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  }, [chartData]);

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Get temp color class based on temperature
  const getTempColorClass = (tempF) => {
    if (tempF == null) return 'bg-gray-600';
    if (tempF >= 90) return 'bg-red-600';
    if (tempF >= 80) return 'bg-orange-500';
    if (tempF >= 70) return 'bg-yellow-500';
    if (tempF >= 60) return 'bg-green-600';
    if (tempF >= 50) return 'bg-emerald-600';
    if (tempF >= 40) return 'bg-teal-600';
    if (tempF >= 32) return 'bg-cyan-600';
    return 'bg-blue-600';
  };

  const displayedObs = showAllObs ? observations : observations.slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-gray-900 dark:text-white">Live Station Data</span>
          <span className="text-sm text-gray-500">{stationId}</span>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">{formatTimeAgo(lastUpdate)}</span>
          )}
          {current?.tempF != null && (
            <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {useMetric ? `${current.tempC}°C` : `${current.tempF}°F`}
            </span>
          )}
        </div>
      </div>

      {/* Toggle buttons */}
      {isExpanded && (
        <div className="flex justify-between items-center mb-4">
          {/* Nearby stations toggle */}
          {nearbyStations.length > 0 && (
            <button
              onClick={() => setShowNearby(!showNearby)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                showNearby
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <MapPin size={12} />
              Nearby ({nearbyStations.length})
            </button>
          )}
          {nearbyStations.length === 0 && <div />}

          {/* Units toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseMetric(false)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                !useMetric
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                useMetric
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Metric
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <>
          {loading && observations.length === 0 ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400 ml-2">Loading observations...</span>
            </div>
          ) : error ? (
            <div className="py-4 text-center text-red-400">
              <p className="text-sm">Error loading data</p>
              <button onClick={fetchObservations} className="text-xs text-orange-400 underline mt-1">Try again</button>
            </div>
          ) : current ? (
            <>
              {/* Current conditions row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current Temp</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {useMetric ? `${current.tempC}°C` : `${current.tempF}°F`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Trend (1h)</div>
                  <div className={`text-lg font-semibold ${
                    trend === 'Stable' ? 'text-gray-500' :
                    trend?.startsWith('+') ? 'text-orange-500' : 'text-blue-500'
                  }`}>
                    {trend || '--'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Wind</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {current.windSpeedMph != null
                      ? `${current.windDirection || ''} ${useMetric ? current.windSpeedKmh + 'km/h' : current.windSpeedMph + 'mph'}`
                      : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Conditions</div>
                  <div className="flex items-center gap-2">
                    <WindIcon size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white truncate">
                      {current.conditions || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Temperature Trend Chart */}
              {chartData.length > 1 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature Trend (Last 6 Hours){showNearby && <span className="text-xs text-gray-500 ml-2">• Avg of {nearbyStations.length + 1} stations</span>}
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={chartDomain}
                          tick={{ fontSize: 10, fill: '#9CA3AF' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}°`}
                        />
                        {avgTemp && (
                          <ReferenceLine
                            y={avgTemp}
                            stroke="#6B7280"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="temp"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Observation Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide">
                      {showNearby && <th className="text-left py-2 pr-2">Station</th>}
                      <th className="text-left py-2 pr-2">Time</th>
                      <th className="text-left py-2 px-2">Temp</th>
                      <th className="text-left py-2 px-2">Dewpoint</th>
                      <th className="text-left py-2 px-2">Humidity</th>
                      <th className="text-left py-2 px-2">Wind</th>
                      <th className="text-left py-2 px-2">Sky</th>
                      <th className="text-left py-2 pl-2">Pressure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedObs.map((obs, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                        {showNearby && (
                          <td className="py-2 pr-2">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              obs.station === stationId
                                ? 'bg-orange-500/20 text-orange-500'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {obs.station?.replace('K', '')}
                            </span>
                          </td>
                        )}
                        <td className="py-2 pr-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {obs.timestamp?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-white font-medium tabular-nums ${getTempColorClass(obs.tempF)}`}>
                            {useMetric ? `${obs.tempC}°C` : `${obs.tempF}°F`}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400 tabular-nums">
                          {obs.dewpointF != null ? (useMetric ? `${obs.dewpointC}°C` : `${obs.dewpointF}°F`) : '--'}
                        </td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400 tabular-nums">
                          {obs.humidity != null ? `${obs.humidity}%` : '--'}
                        </td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {obs.windSpeedMph != null
                            ? `${obs.windDirection || ''} ${useMetric ? obs.windSpeedKmh + 'km/h' : obs.windSpeedMph + 'mph'}`
                            : '--'}
                        </td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={obs.conditions || ''}>
                          {obs.conditions || 'N/A'}
                        </td>
                        <td className="py-2 pl-2 text-gray-600 dark:text-gray-400 tabular-nums">
                          {obs.pressureInHg != null ? (useMetric ? `${obs.pressureMb}mb` : `${obs.pressureInHg}"`) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show all observations toggle */}
              {observations.length > 10 && (
                <button
                  onClick={() => setShowAllObs(!showAllObs)}
                  className="mt-3 text-sm text-orange-500 hover:text-orange-400 font-medium"
                >
                  {showAllObs ? 'Show Less' : `Show All ${observations.length} Observations`}
                </button>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {showNearby
                    ? `Data from NWS (${stationId} + ${nearbyStations.length} nearby) • Updates every 5 minutes`
                    : `Data from National Weather Service (${stationId}) • Updates every 5 minutes`
                  }
                </span>
                <a
                  href={`https://www.weather.gov/wrh/timeseries?site=${stationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                >
                  View on NWS <ExternalLink size={12} />
                </a>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
