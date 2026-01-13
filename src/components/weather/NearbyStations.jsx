import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassWidget from './GlassWidget';

/**
 * City grid configurations for NWS station lookup
 */
const CITY_CONFIGS = {
  'new-york': { lat: 40.7828, lon: -73.9653, gridOffice: 'OKX', gridX: 34, gridY: 38 },
  'chicago': { lat: 41.7868, lon: -87.7522, gridOffice: 'LOT', gridX: 65, gridY: 76 },
  'los-angeles': { lat: 33.9425, lon: -118.4081, gridOffice: 'LOX', gridX: 154, gridY: 44 },
  'miami': { lat: 25.7959, lon: -80.2870, gridOffice: 'MFL', gridX: 109, gridY: 50 },
  'denver': { lat: 39.8561, lon: -104.6737, gridOffice: 'BOU', gridX: 62, gridY: 60 },
  'austin': { lat: 30.1944, lon: -97.6700, gridOffice: 'EWX', gridX: 156, gridY: 91 },
  'philadelphia': { lat: 39.8721, lon: -75.2311, gridOffice: 'PHI', gridX: 49, gridY: 74 },
  'houston': { lat: 29.6454, lon: -95.2789, gridOffice: 'HGX', gridX: 65, gridY: 97 },
  'seattle': { lat: 47.4502, lon: -122.3088, gridOffice: 'SEW', gridX: 124, gridY: 67 },
  'san-francisco': { lat: 37.6213, lon: -122.3790, gridOffice: 'MTR', gridX: 85, gridY: 105 },
  'boston': { lat: 42.3656, lon: -71.0096, gridOffice: 'BOX', gridX: 70, gridY: 76 },
  'washington-dc': { lat: 38.8512, lon: -77.0402, gridOffice: 'LWX', gridX: 96, gridY: 72 },
  'dallas': { lat: 32.8998, lon: -97.0403, gridOffice: 'FWD', gridX: 79, gridY: 108 },
  'detroit': { lat: 42.2124, lon: -83.3534, gridOffice: 'DTX', gridX: 65, gridY: 33 },
  'salt-lake-city': { lat: 40.7884, lon: -111.9778, gridOffice: 'SLC', gridX: 99, gridY: 175 },
};

/**
 * Primary station IDs for each city
 */
const MAIN_STATIONS = {
  'new-york': 'KNYC', 'chicago': 'KMDW', 'los-angeles': 'KLAX', 'miami': 'KMIA',
  'denver': 'KDEN', 'austin': 'KAUS', 'philadelphia': 'KPHL', 'houston': 'KHOU',
  'seattle': 'KSEA', 'san-francisco': 'KSFO', 'boston': 'KBOS', 'washington-dc': 'KDCA',
  'dallas': 'KDFW', 'detroit': 'KDTW', 'salt-lake-city': 'KSLC',
};

/**
 * Get temperature color based on value
 */
const getTempColor = (temp) => {
  if (temp == null) return '#6B7280'; // gray
  if (temp <= 32) return '#3B82F6'; // blue-500 - freezing
  if (temp <= 50) return '#60A5FA'; // blue-400 - cold
  if (temp <= 60) return '#93C5FD'; // blue-300 - cool
  if (temp <= 70) return '#9CA3AF'; // gray-400 - mild
  if (temp <= 80) return '#FBBF24'; // amber-400 - warm
  if (temp <= 90) return '#F97316'; // orange-500 - hot
  return '#EF4444'; // red-500 - very hot
};

/**
 * Get background color for temp (darker variant for marker bg)
 */
const getTempBgColor = (temp) => {
  if (temp == null) return 'rgba(107, 114, 128, 0.9)';
  if (temp <= 32) return 'rgba(59, 130, 246, 0.85)';
  if (temp <= 50) return 'rgba(96, 165, 250, 0.85)';
  if (temp <= 60) return 'rgba(147, 197, 253, 0.85)';
  if (temp <= 70) return 'rgba(75, 85, 99, 0.85)';
  if (temp <= 80) return 'rgba(251, 191, 36, 0.85)';
  if (temp <= 90) return 'rgba(249, 115, 22, 0.85)';
  return 'rgba(239, 68, 68, 0.85)';
};

/**
 * Create temperature label marker icon
 */
const createTempIcon = (temp, runningHigh, isPrimary) => {
  const bgColor = getTempBgColor(temp);
  const hasRunningHigh = runningHigh != null && runningHigh !== temp;

  // Build the label text
  let labelText = temp != null ? `${temp}°` : '—';
  if (isPrimary && hasRunningHigh) {
    labelText += `<span style="font-size: 9px; opacity: 0.8; margin-left: 2px;">↑${runningHigh}</span>`;
  }

  const primaryStyles = isPrimary ? `
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.8), 0 0 12px 4px rgba(16, 185, 129, 0.4);
    border: 1px solid rgba(16, 185, 129, 0.9);
  ` : `
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
  `;

  return L.divIcon({
    html: `<div class="temp-marker-label" style="
      font-size: 11px;
      font-weight: 600;
      color: white;
      background: ${bgColor};
      padding: 3px 6px;
      border-radius: 6px;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      ${primaryStyles}
      display: flex;
      align-items: center;
      transform: translate(-50%, -50%);
    ">${labelText}</div>`,
    className: 'temp-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

/**
 * Fetch nearby stations from NWS API
 */
const fetchNearbyStations = async (citySlug) => {
  const config = CITY_CONFIGS[citySlug];
  if (!config) return [];

  try {
    const response = await fetch(
      `https://api.weather.gov/gridpoints/${config.gridOffice}/${config.gridX},${config.gridY}/stations`,
      { headers: { 'User-Agent': 'Toasty Research App' } }
    );
    if (!response.ok) throw new Error('Failed to fetch stations');

    const data = await response.json();
    return data.features
      .filter(f => /^K[A-Z]{3}$/.test(f.properties.stationIdentifier))
      .slice(0, 10)
      .map(f => ({
        id: f.properties.stationIdentifier,
        name: f.properties.name,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        distance: f.properties.distance?.value || 0,
      }));
  } catch (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
};

/**
 * Fetch latest observation and calculate today's running high
 */
const fetchLatestObservation = async (stationId) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const response = await fetch(
      `https://api.weather.gov/stations/${stationId}/observations?start=${todayStart.toISOString()}&limit=50`,
      { headers: { 'User-Agent': 'Toasty Research App' } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const observations = data.features || [];

    if (observations.length === 0) return null;

    const latestObs = observations[0]?.properties;
    if (!latestObs) return null;

    const tempC = latestObs.temperature?.value;
    const tempF = tempC != null ? Math.round((tempC * 9/5) + 32) : null;
    const dewpointC = latestObs.dewpoint?.value;
    const dewpointF = dewpointC != null ? Math.round((dewpointC * 9/5) + 32) : null;
    const windSpeedKmh = latestObs.windSpeed?.value;
    const windSpeedMph = windSpeedKmh != null ? Math.round(windSpeedKmh * 0.621371) : null;
    const windDeg = latestObs.windDirection?.value;
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const windDir = windDeg != null ? dirs[Math.round(windDeg / 22.5) % 16] : null;

    const todayTemps = observations
      .map(obs => obs.properties?.temperature?.value)
      .filter(t => t != null)
      .map(t => Math.round((t * 9/5) + 32));

    const runningHigh = todayTemps.length > 0 ? Math.max(...todayTemps) : null;

    return {
      temperature: tempF,
      runningHigh,
      dewpoint: dewpointF,
      humidity: latestObs.relativeHumidity?.value ? Math.round(latestObs.relativeHumidity.value) : null,
      windSpeed: windSpeedMph,
      windDirection: windDir,
      conditions: latestObs.textDescription || 'N/A',
      timestamp: new Date(latestObs.timestamp),
    };
  } catch (error) {
    return null;
  }
};

/**
 * Format distance in miles
 */
const formatDistance = (meters) => {
  const miles = meters / 1609.34;
  return miles < 10 ? `${miles.toFixed(1)}mi` : `${Math.round(miles)}mi`;
};

/**
 * Map component to fit bounds to all stations
 */
function FitBounds({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [stations, map]);

  return null;
}

/**
 * Hover card component - appears when hovering a marker
 */
function HoverCard({ station, observation, isPrimary, position, mapContainer }) {
  if (!position || !mapContainer) return null;

  const distanceText = formatDistance(station.distance);
  const temp = observation?.temperature;
  const runningHigh = observation?.runningHigh;
  const hasRunningHigh = runningHigh != null && runningHigh !== temp;

  // Calculate position relative to map container
  const containerRect = mapContainer.getBoundingClientRect();
  const left = position.x;
  const top = position.y;

  // Determine if card should appear above or below marker
  const showAbove = top > containerRect.height / 2;

  return (
    <div
      className="absolute z-[1000] pointer-events-none"
      style={{
        left: `${left}px`,
        top: showAbove ? `${top - 8}px` : `${top + 8}px`,
        transform: showAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      }}
    >
      <div className="bg-black/85 backdrop-blur-xl rounded-lg px-3 py-2.5 border border-white/20 shadow-2xl min-w-[120px]">
        {/* Station ID */}
        <div className="flex items-center gap-1.5 mb-1">
          {isPrimary && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
          )}
          <span className="text-[11px] font-medium text-white/90">{station.id}</span>
          <span className="text-[10px] text-white/40 ml-auto">{distanceText}</span>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-white tabular-nums">
            {temp != null ? `${temp}°` : '—'}
          </span>
          {hasRunningHigh && (
            <span className="text-xs text-orange-400 tabular-nums">↑{runningHigh}°</span>
          )}
        </div>

        {/* Additional info */}
        {observation && (
          <div className="text-[10px] text-white/50 mt-1 space-y-0.5">
            {observation.windSpeed != null && (
              <div>{observation.windDirection} {observation.windSpeed}mph</div>
            )}
            {observation.humidity != null && (
              <div>{observation.humidity}% humidity</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Custom marker with hover detection
 */
function TempMarker({ station, observation, isPrimary, onHover, onLeave }) {
  const temp = observation?.temperature;
  const runningHigh = observation?.runningHigh;

  const icon = useMemo(
    () => createTempIcon(temp, runningHigh, isPrimary),
    [temp, runningHigh, isPrimary]
  );

  return (
    <Marker
      position={[station.lat, station.lon]}
      icon={icon}
      eventHandlers={{
        mouseover: (e) => onHover(station, e),
        mouseout: onLeave,
      }}
    />
  );
}

/**
 * NearbyStations - Weather stations widget with temperature-labeled map
 */
export default function NearbyStations({ citySlug }) {
  const [stations, setStations] = useState([]);
  const [observations, setObservations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null);
  const mapContainerRef = useRef(null);

  const config = CITY_CONFIGS[citySlug];
  const mainStationId = MAIN_STATIONS[citySlug];

  // Load stations on mount
  useEffect(() => {
    if (!citySlug) return;

    const loadStations = async () => {
      setIsLoading(true);
      setStations([]);
      setObservations({});

      const nearbyStations = await fetchNearbyStations(citySlug);
      setStations(nearbyStations);
      setIsLoading(false);

      // Fetch observations for each station
      nearbyStations.forEach(async (station) => {
        const obs = await fetchLatestObservation(station.id);
        if (obs) {
          setObservations(prev => ({ ...prev, [station.id]: obs }));
        }
      });
    };

    loadStations();
  }, [citySlug]);

  // Handle marker hover
  const handleMarkerHover = useCallback((station, e) => {
    if (mapContainerRef.current) {
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const point = e.containerPoint;
      setHoverPosition({ x: point.x, y: point.y });
      setHoveredStation(station);
    }
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredStation(null);
    setHoverPosition(null);
  }, []);

  // Calculate temperature range and primary station info
  const { tempRange, primaryObs, latestTimestamp } = useMemo(() => {
    const temps = Object.values(observations)
      .map(o => o?.temperature)
      .filter(t => t != null);

    const primary = observations[mainStationId];
    const latest = Object.values(observations)
      .map(o => o?.timestamp)
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    return {
      tempRange: temps.length > 0
        ? { min: Math.min(...temps), max: Math.max(...temps) }
        : null,
      primaryObs: primary,
      latestTimestamp: latest,
    };
  }, [observations, mainStationId]);

  // Format timestamp for display
  const timeAgo = useMemo(() => {
    if (!latestTimestamp) return '';
    const s = Math.floor((new Date() - latestTimestamp) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }, [latestTimestamp]);

  if (!config) {
    return (
      <GlassWidget title="NEARBY STATIONS" icon={MapPin} size="large">
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          No station data available
        </div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget
      title="NEARBY STATIONS"
      icon={MapPin}
      size="large"
      headerRight={timeAgo && <span className="text-[10px] text-white/40">{timeAgo} ago</span>}
    >
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-white/40 text-xs">Loading stations...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full -mx-1">
          {/* Full-height Map Container */}
          <div
            ref={mapContainerRef}
            className="flex-1 min-h-0 rounded-lg overflow-hidden relative"
            style={{ minHeight: '200px' }}
          >
            <MapContainer
              center={[config.lat, config.lon]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
              attributionControl={false}
            >
              <TileLayer
                attribution='&copy; CartoDB'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitBounds stations={stations} />

              {stations.map((station) => (
                <TempMarker
                  key={station.id}
                  station={station}
                  observation={observations[station.id]}
                  isPrimary={station.id === mainStationId}
                  onHover={handleMarkerHover}
                  onLeave={handleMarkerLeave}
                />
              ))}
            </MapContainer>

            {/* Hover Card Overlay */}
            {hoveredStation && (
              <HoverCard
                station={hoveredStation}
                observation={observations[hoveredStation.id]}
                isPrimary={hoveredStation.id === mainStationId}
                position={hoverPosition}
                mapContainer={mapContainerRef.current}
              />
            )}
          </div>

          {/* Footer Summary Bar */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 px-1">
            {/* Primary station summary */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-medium text-white/90">
                {mainStationId}
              </span>
              {primaryObs && (
                <span className="text-xs text-white/70 tabular-nums">
                  {primaryObs.temperature}°
                  {primaryObs.runningHigh != null && primaryObs.runningHigh !== primaryObs.temperature && (
                    <span className="text-orange-400/80 ml-0.5">↑{primaryObs.runningHigh}°</span>
                  )}
                </span>
              )}
            </div>

            {/* Range and count */}
            <div className="flex items-center gap-3 text-[10px] text-white/50">
              {tempRange && (
                <span className="tabular-nums">
                  {tempRange.min}°–{tempRange.max}°
                </span>
              )}
              <span>{stations.length} stn</span>
            </div>
          </div>
        </div>
      )}
    </GlassWidget>
  );
}

NearbyStations.propTypes = {
  citySlug: PropTypes.string.isRequired,
};
