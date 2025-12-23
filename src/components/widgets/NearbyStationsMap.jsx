import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ChevronDown, ChevronUp, MapPin, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const MAIN_STATIONS = {
  'new-york': 'KNYC', 'chicago': 'KMDW', 'los-angeles': 'KLAX', 'miami': 'KMIA',
  'denver': 'KDEN', 'austin': 'KAUS', 'philadelphia': 'KPHL', 'houston': 'KHOU',
  'seattle': 'KSEA', 'san-francisco': 'KSFO', 'boston': 'KBOS', 'washington-dc': 'KDCA',
  'dallas': 'KDFW', 'detroit': 'KDTW', 'salt-lake-city': 'KSLC',
};

const createIcon = (color, isMain = false) => {
  const size = isMain ? 32 : 24;
  const html = `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${isMain ? '<div style="width:8px;height:8px;background:white;border-radius:50%;"></div>' : ''}</div>`;
  return L.divIcon({ html, className: 'custom-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2 - 5] });
};

const mainStationIcon = createIcon('#10B981', true);
const nearbyStationIcon = createIcon('#3B82F6', false);

const fetchNearbyStations = async (citySlug) => {
  const config = CITY_CONFIGS[citySlug];
  if (!config) return [];
  try {
    const response = await fetch(`https://api.weather.gov/gridpoints/${config.gridOffice}/${config.gridX},${config.gridY}/stations`, {
      headers: { 'User-Agent': 'Toasty Research App' },
    });
    if (!response.ok) throw new Error('Failed to fetch stations');
    const data = await response.json();
    return data.features.filter(f => /^K[A-Z]{3}$/.test(f.properties.stationIdentifier)).slice(0, 10).map(f => ({
      id: f.properties.stationIdentifier, name: f.properties.name,
      lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
      distance: f.properties.distance?.value || 0,
    }));
  } catch (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
};

const fetchLatestObservation = async (stationId) => {
  try {
    const response = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
      headers: { 'User-Agent': 'Toasty Research App' },
    });
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
    return { temperature: tempF, dewpoint: dewpointF, humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null, windSpeed: windSpeedMph, windDirection: windDir, conditions: props.textDescription || 'N/A', timestamp: new Date(props.timestamp) };
  } catch (error) {
    return null;
  }
};

const FitBounds = ({ stations }) => {
  const map = useMap();
  useEffect(() => {
    if (stations.length > 0) map.fitBounds(L.latLngBounds(stations.map(s => [s.lat, s.lon])), { padding: [30, 30] });
  }, [stations, map]);
  return null;
};

const FlyToStation = ({ station }) => {
  const map = useMap();
  useEffect(() => { if (station) map.flyTo([station.lat + 0.02, station.lon], 10, { duration: 0.5 }); }, [station, map]);
  return null;
};

const formatDistance = (meters) => `${(meters / 1609.34).toFixed(1)} mi`;
const formatTimeAgo = (date) => { if (!date) return ''; const s = Math.floor((new Date() - date) / 1000); if (s < 60) return 'just now'; if (s < 120) return '1 min ago'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; return `${Math.floor(s / 3600)}h ago`; };

const StationPopup = ({ station, observation, isMain }) => (
  <div className="min-w-[200px]">
    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
      {station.name}
      {isMain && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Primary</span>}
    </div>
    <div className="text-xs text-gray-500 mb-2">{station.id} • {formatDistance(station.distance)}</div>
    {observation ? (
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">Temp:</span><span className="font-semibold text-gray-900">{observation.temperature}°F</span></div>
        {observation.dewpoint != null && <div className="flex justify-between"><span className="text-gray-600">Dew Point:</span><span className="text-gray-900">{observation.dewpoint}°F</span></div>}
        {observation.humidity != null && <div className="flex justify-between"><span className="text-gray-600">Humidity:</span><span className="text-gray-900">{observation.humidity}%</span></div>}
        {observation.windSpeed != null && <div className="flex justify-between"><span className="text-gray-600">Wind:</span><span className="text-gray-900">{observation.windDirection} {observation.windSpeed} mph</span></div>}
        <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">Updated {formatTimeAgo(observation.timestamp)}</div>
      </div>
    ) : <div className="text-sm text-gray-400">Loading...</div>}
  </div>
);

export default function NearbyStationsMap({ citySlug, cityName }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [stations, setStations] = useState([]);
  const [observations, setObservations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const markerRefs = useRef({});
  const config = CITY_CONFIGS[citySlug];
  const mainStationId = MAIN_STATIONS[citySlug];

  useEffect(() => {
    if (!isExpanded || !citySlug || stations.length > 0) return;
    const loadStations = async () => {
      setIsLoading(true);
      const nearbyStations = await fetchNearbyStations(citySlug);
      setStations(nearbyStations);
      setIsLoading(false);
      nearbyStations.forEach(async (station) => {
        const obs = await fetchLatestObservation(station.id);
        if (obs) setObservations(prev => ({ ...prev, [station.id]: obs }));
      });
    };
    loadStations();
  }, [isExpanded, citySlug, stations.length]);

  if (!config) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-3 group">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nearby Weather Stations</h2>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {stations.length > 0 && <span className="text-sm text-gray-400">{stations.length} stations</span>}
      </div>

      {isExpanded && (
        <>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              Loading nearby stations...
            </div>
          ) : (
            <>
              <div className="h-[300px] rounded-lg overflow-hidden mb-4">
                <MapContainer center={[config.lat, config.lon]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <FitBounds stations={stations} />
                  <FlyToStation station={selectedStation} />
                  {stations.map((station) => (
                    <Marker key={station.id} position={[station.lat, station.lon]} icon={station.id === mainStationId ? mainStationIcon : nearbyStationIcon}
                      ref={ref => { if (ref) markerRefs.current[station.id] = ref; }}
                      eventHandlers={{ click: () => setSelectedStation(station) }}>
                      <Popup><StationPopup station={station} observation={observations[station.id]} isMain={station.id === mainStationId} /></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {stations.slice(0, 6).map((station) => {
                  const obs = observations[station.id];
                  const isMain = station.id === mainStationId;
                  const isSelected = selectedStation?.id === station.id;
                  return (
                    <button key={station.id} onClick={() => { setSelectedStation(station); markerRefs.current[station.id]?.openPopup(); }}
                      className={`p-3 rounded-lg text-left transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${isMain ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100' : 'bg-gray-50 dark:bg-dark-elevated hover:bg-gray-100 dark:hover:bg-dark-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isMain ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{station.id}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{obs?.temperature != null ? `${obs.temperature}°F` : '—'}</div>
                      </div>
                      {obs && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          <div className="flex justify-between"><span className="text-gray-400">Dew</span><span className="text-gray-600 tabular-nums">{obs.dewpoint != null ? `${obs.dewpoint}°` : '—'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Hum</span><span className="text-gray-600 tabular-nums">{obs.humidity != null ? `${obs.humidity}%` : '—'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Wind</span><span className="text-gray-600 tabular-nums">{obs.windSpeed != null ? `${obs.windDirection || ''} ${obs.windSpeed}` : '—'}</span></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span>Primary</span></div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /><span>Nearby</span></div>
                </div>
                <a href={`https://www.weather.gov/wrh/timeseries?site=${mainStationId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  View on NWS <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
