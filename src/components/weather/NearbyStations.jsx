import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Plus, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassWidget from './GlassWidget';
import { useDataChip } from '../../context/DataChipContext';

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
 * Create glowing marker icon
 */
const createGlowingIcon = (color, isMain = false) => {
  const size = isMain ? 16 : 12;
  const glowSize = isMain ? '12px 4px' : '8px 2px';

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 ${glowSize} ${color}80;
      border: 2px solid white;
    "></div>`,
    className: 'glowing-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  });
};

const primaryIcon = createGlowingIcon('#10B981', true);
const nearbyIcon = createGlowingIcon('#3B82F6', false);

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
 * Fetch latest observation for a station
 */
const fetchLatestObservation = async (stationId) => {
  try {
    const response = await fetch(
      `https://api.weather.gov/stations/${stationId}/observations/latest`,
      { headers: { 'User-Agent': 'Toasty Research App' } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const props = data.properties;

    const tempC = props.temperature?.value;
    const tempF = tempC != null ? Math.round((tempC * 9/5) + 32) : null;
    const dewpointC = props.dewpoint?.value;
    const dewpointF = dewpointC != null ? Math.round((dewpointC * 9/5) + 32) : null;
    const windSpeedKmh = props.windSpeed?.value;
    const windSpeedMph = windSpeedKmh != null ? Math.round(windSpeedKmh * 0.621371) : null;
    const windDeg = props.windDirection?.value;
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const windDir = windDeg != null ? dirs[Math.round(windDeg / 22.5) % 16] : null;

    return {
      temperature: tempF,
      dewpoint: dewpointF,
      humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null,
      windSpeed: windSpeedMph,
      windDirection: windDir,
      conditions: props.textDescription || 'N/A',
      timestamp: new Date(props.timestamp),
    };
  } catch (error) {
    return null;
  }
};

/**
 * Format distance in miles
 */
const formatDistance = (meters) => `${(meters / 1609.34).toFixed(1)} mi`;

/**
 * Format time ago
 */
const formatTimeAgo = (date) => {
  if (!date) return '';
  const s = Math.floor((new Date() - date) / 1000);
  if (s < 60) return 'just now';
  if (s < 120) return '1 min ago';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

/**
 * Map component to fit bounds to all stations
 */
function FitBounds({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [s.lat, s.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [stations, map]);

  return null;
}


/**
 * Station popup content
 */
function StationPopup({ station, observation, isMain }) {
  return (
    <div className="min-w-[180px]">
      <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        {station.name}
        {isMain && (
          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            Primary
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {station.id} • {formatDistance(station.distance)}
      </div>
      {observation ? (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Temp:</span>
            <span className="font-semibold text-gray-900">{observation.temperature}°F</span>
          </div>
          {observation.dewpoint != null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Dew Point:</span>
              <span className="text-gray-900">{observation.dewpoint}°F</span>
            </div>
          )}
          {observation.humidity != null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Humidity:</span>
              <span className="text-gray-900">{observation.humidity}%</span>
            </div>
          )}
          {observation.windSpeed != null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Wind:</span>
              <span className="text-gray-900">{observation.windDirection} {observation.windSpeed} mph</span>
            </div>
          )}
          <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
            Updated {formatTimeAgo(observation.timestamp)}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">Loading...</div>
      )}
    </div>
  );
}

/**
 * Compact station cell - shows only ID + temperature
 * Full details appear in popup on click
 */
function StationCell({ station, observation, isPrimary, isSelected, onClick, onQuickAdd, isEditorReady }) {
  const temp = observation?.temperature;

  return (
    <button
      className={`
        group relative flex items-center justify-between w-full
        py-2 px-3 text-left transition-all
        hover:bg-white/10 rounded-lg
        ${isSelected ? 'bg-white/15' : ''}
      `}
      onClick={onClick}
    >
      {/* Station ID with indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrimary ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-blue-400'}`} />
        <span className="text-xs font-medium text-white/80">{station.id}</span>
      </div>

      {/* Temperature + Quick Add */}
      <div className="flex items-center gap-2">
        {/* Quick Add Button - appears on hover */}
        {isEditorReady && observation?.temperature != null && (
          <span
            onClick={(e) => onQuickAdd(e)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full
                       bg-white/20 flex items-center justify-center transition-opacity
                       hover:bg-white/30"
            title="Add to notes"
          >
            <Plus size={12} strokeWidth={2.5} className="text-white/80" />
          </span>
        )}
        <span className="text-base font-semibold text-white tabular-nums">
          {temp != null ? `${temp}°` : '—'}
        </span>
      </div>
    </button>
  );
}

/**
 * NearbyStations - Weather stations widget with map and cards
 */
export default function NearbyStations({ citySlug, cityName }) {
  const [stations, setStations] = useState([]);
  const [observations, setObservations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const markerRefs = useRef({});

  const { insertDataChip, isEditorReady } = useDataChip();

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

  // Handle quick add to notes
  const handleQuickAdd = (station, obs, e) => {
    e.stopPropagation();

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    insertDataChip({
      value: `${obs.temperature}°F`,
      secondary: station.id,
      label: 'Station Obs',
      source: `NWS ${station.id}`,
      timestamp,
      type: 'weather',
    });
  };

  // Handle station selection
  const handleStationClick = (station) => {
    setSelectedStation(station);
    markerRefs.current[station.id]?.openPopup();
  };

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
    <GlassWidget title="NEARBY STATIONS" icon={MapPin} size="large">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-white/40 text-xs">Loading stations...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Map Container */}
          <div className="h-[180px] rounded-lg overflow-hidden mb-3 -mx-1">
            <MapContainer
              center={[config.lat, config.lon]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                attribution='&copy; CartoDB'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitBounds stations={stations} />

              {stations.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lon]}
                  icon={station.id === mainStationId ? primaryIcon : nearbyIcon}
                  ref={ref => { if (ref) markerRefs.current[station.id] = ref; }}
                  eventHandlers={{
                    click: () => setSelectedStation(station),
                  }}
                >
                  <Popup>
                    <StationPopup
                      station={station}
                      observation={observations[station.id]}
                      isMain={station.id === mainStationId}
                    />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Station Grid - 2 columns for better readability */}
          <div className="grid grid-cols-2 gap-1">
            {stations.slice(0, 6).map((station) => (
              <StationCell
                key={station.id}
                station={station}
                observation={observations[station.id]}
                isPrimary={station.id === mainStationId}
                isSelected={selectedStation?.id === station.id}
                onClick={() => handleStationClick(station)}
                onQuickAdd={(e) => handleQuickAdd(station, observations[station.id], e)}
                isEditorReady={isEditorReady}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Primary station</span>
            </div>
            <span className="text-[10px] text-white/40">
              {stations.length} stations
            </span>
          </div>
        </>
      )}
    </GlassWidget>
  );
}

NearbyStations.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
};
