import { useState, useEffect, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, X, ExternalLink, Wind as WindIcon, MapPin, Plus,
  Clock, Thermometer, Droplet, Droplets, Cloud, Gauge
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import SelectableData from './SelectableData';
import { useDataChip } from '../../context/DataChipContext';

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
 * ObservationRow Component
 * Individual row with hover state for row-level data selection
 */
function ObservationRow({
  obs,
  timeStr,
  stationName,
  sourceWithTime,
  fullRowValue,
  cityName,
  showNearby,
  stationId,
  useMetric,
  getTempColorClass,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { insertDataChip, isAvailable } = useDataChip();

  const handleRowInsert = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    insertDataChip({
      value: fullRowValue,
      label: 'Weather Observation',
      source: sourceWithTime,
      timestamp,
      type: 'default',
    });
  };

  return (
    <tr
      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="py-0.5 pr-1 w-6">
        {isAvailable && isHovered && (
          <button
            onClick={handleRowInsert}
            className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-orange-main)] text-white hover:scale-110 transition-transform"
            title={`Add full observation to notes`}
            type="button"
          >
            <Plus size={10} strokeWidth={3} />
          </button>
        )}
      </td>
      {showNearby && (
        <td className="py-0.5 pr-1">
          <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${
            obs.station === stationId
              ? 'bg-orange-500/20 text-orange-500'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {obs.station?.replace('K', '')}
          </span>
        </td>
      )}
      <td className="py-0.5 pr-1 text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {timeStr}
      </td>
      <td className="py-0.5 px-1">
        {obs.tempF != null ? (
          <SelectableData
            value={useMetric ? `${obs.tempC}°C` : `${obs.tempF}°F`}
            label="Temperature"
            source={sourceWithTime}
            type="temperature"
          >
            <span className={`px-1.5 py-0.5 rounded text-white font-medium tabular-nums ${getTempColorClass(obs.tempF)}`}>
              {useMetric ? `${obs.tempC}°` : `${obs.tempF}°`}
            </span>
          </SelectableData>
        ) : '--'}
      </td>
      <td className="py-0.5 px-1 text-gray-600 dark:text-gray-400 tabular-nums">
        {obs.dewpointF != null ? (
          <SelectableData
            value={useMetric ? `${obs.dewpointC}°C` : `${obs.dewpointF}°F`}
            label="Dewpoint"
            source={sourceWithTime}
            type="humidity"
          >
            <span>{useMetric ? `${obs.dewpointC}°` : `${obs.dewpointF}°`}</span>
          </SelectableData>
        ) : '--'}
      </td>
      <td className="py-0.5 px-1 text-gray-600 dark:text-gray-400 tabular-nums">
        {obs.humidity != null ? (
          <SelectableData
            value={`${obs.humidity}%`}
            label="Humidity"
            source={sourceWithTime}
            type="humidity"
          >
            <span>{obs.humidity}</span>
          </SelectableData>
        ) : '--'}
      </td>
      <td className="py-0.5 px-1 text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {obs.windSpeedMph != null ? (
          <SelectableData
            value={`${obs.windDirection || ''} ${useMetric ? obs.windSpeedKmh + 'km/h' : obs.windSpeedMph + 'mph'}`.trim()}
            label="Wind"
            source={sourceWithTime}
            type="wind"
          >
            <span>{obs.windDirection || ''} {useMetric ? obs.windSpeedKmh : obs.windSpeedMph}</span>
          </SelectableData>
        ) : '--'}
      </td>
      <td className="py-0.5 px-1 text-gray-600 dark:text-gray-400 truncate max-w-[80px]" title={obs.conditions || ''}>
        {obs.conditions || 'N/A'}
      </td>
      <td className="py-0.5 pl-1 text-gray-600 dark:text-gray-400 tabular-nums">
        {obs.pressureInHg != null ? (
          <SelectableData
            value={useMetric ? `${obs.pressureMb}mb` : `${obs.pressureInHg}"`}
            label="Pressure"
            source={sourceWithTime}
            type="pressure"
          >
            <span>{useMetric ? obs.pressureMb : obs.pressureInHg}</span>
          </SelectableData>
        ) : '--'}
      </td>
    </tr>
  );
}

/**
 * LiveStationData Widget
 * Comprehensive real-time weather observations from NWS station
 * with temperature trend chart and observation history table
 */
export default function LiveStationData({ stationId, cityName, timezone, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
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
          label: o.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone }),
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
        label: new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone }),
      }))
      .sort((a, b) => a.time - b.time);
  }, [observations, useMetric, showNearby, timezone]);

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
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone });
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
            <SelectableData
              value={useMetric ? `${current.tempC}°C` : `${current.tempF}°F`}
              label="Current Temperature"
              source={`${cityName} (${stationId})`}
              type="temperature"
            >
              <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {useMetric ? `${current.tempC}°C` : `${current.tempF}°F`}
              </span>
            </SelectableData>
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
          <div className="inline-flex rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5">
            <button
              onClick={() => setUseMetric(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !useMetric
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              °F
            </button>
            <button
              onClick={() => setUseMetric(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                useMetric
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              °C
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
              {/* Current conditions row - compact */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Temp</div>
                  <SelectableData
                    value={useMetric ? `${current.tempC}°C` : `${current.tempF}°F`}
                    label="Current Temperature"
                    source={`${cityName} (${stationId})`}
                    type="temperature"
                  >
                    <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                      {useMetric ? `${current.tempC}°` : `${current.tempF}°`}
                    </div>
                  </SelectableData>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Wind</div>
                  {current.windSpeedMph != null ? (
                    <SelectableData
                      value={`${current.windDirection || ''} ${useMetric ? current.windSpeedKmh + 'km/h' : current.windSpeedMph + 'mph'}`.trim()}
                      label="Wind"
                      source={`${cityName} (${stationId})`}
                      type="wind"
                    >
                      <div className="text-base font-semibold text-gray-900 dark:text-white">
                        {current.windDirection || ''} {useMetric ? current.windSpeedKmh : current.windSpeedMph}
                      </div>
                    </SelectableData>
                  ) : (
                    <div className="text-base font-semibold text-gray-900 dark:text-white">--</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Conditions</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-white truncate">
                      {current.conditions || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observation Table - Scrollable */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="w-6"></th>
                      {showNearby && <th className="text-left py-1 pr-1 text-[10px] uppercase tracking-wide">Station</th>}
                      <th className="text-center py-1 px-1" title="Time">
                        <Clock size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Temperature">
                        <Thermometer size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Dew Point">
                        <Droplet size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Humidity">
                        <Droplets size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Wind">
                        <WindIcon size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Sky Conditions">
                        <Cloud size={12} className="inline-block" />
                      </th>
                      <th className="text-center py-1 px-1" title="Pressure">
                        <Gauge size={12} className="inline-block" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((obs, i) => {
                      const timeStr = obs.timestamp?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: timezone });
                      const stationName = showNearby ? obs.station : stationId;
                      const sourceWithTime = `${cityName} (${stationName}) @ ${timeStr}`;

                      // Build full row value string
                      const rowValues = [];
                      if (obs.tempF != null) rowValues.push(useMetric ? `${obs.tempC}°C` : `${obs.tempF}°F`);
                      if (obs.dewpointF != null) rowValues.push(`Dew ${useMetric ? obs.dewpointC + '°C' : obs.dewpointF + '°F'}`);
                      if (obs.humidity != null) rowValues.push(`${obs.humidity}% RH`);
                      if (obs.windSpeedMph != null) rowValues.push(`${obs.windDirection || ''} ${useMetric ? obs.windSpeedKmh + 'km/h' : obs.windSpeedMph + 'mph'}`.trim());
                      if (obs.pressureInHg != null) rowValues.push(useMetric ? `${obs.pressureMb}mb` : `${obs.pressureInHg}"`);
                      const fullRowValue = rowValues.join(', ');

                      return (
                        <ObservationRow
                          key={i}
                          obs={obs}
                          timeStr={timeStr}
                          stationName={stationName}
                          sourceWithTime={sourceWithTime}
                          fullRowValue={fullRowValue}
                          cityName={cityName}
                          showNearby={showNearby}
                          stationId={stationId}
                          useMetric={useMetric}
                          getTempColorClass={getTempColorClass}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
