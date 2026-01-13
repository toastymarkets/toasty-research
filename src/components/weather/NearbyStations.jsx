import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { MapPin, Radio, Maximize2, Minimize2, Wind, Droplets, CloudRain } from 'lucide-react';
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
 * Wind direction abbreviations
 */
const WIND_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

/**
 * Create refined dot marker icon with pulsing effect for hovered state
 */
const createDotIcon = (isPrimary, isHovered) => {
  const baseSize = isPrimary ? 10 : 7;
  const size = isHovered ? baseSize * 1.6 : baseSize;
  const primaryColor = '#34D399'; // emerald-400
  const secondaryColor = '#60A5FA'; // blue-400
  const color = isPrimary ? primaryColor : secondaryColor;

  const pulseRing = isHovered ? `
    <div style="
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 1px solid ${color};
      opacity: 0.4;
      animation: pulse-ring 1.5s ease-out infinite;
    "></div>
  ` : '';

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${pulseRing}
        <div class="station-dot" style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.9);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 0 ${isHovered ? '12px' : '6px'} ${color}60,
            0 2px 4px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    className: 'dot-marker',
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
};

/**
 * Fetch nearby stations from NWS API
 */
const fetchNearbyStations = async (citySlug, limit = 6) => {
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
      .slice(0, limit)
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
 * Fetch latest observation with wind data and calculate today's running high
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

    // Wind data
    const windSpeedMs = latestObs.windSpeed?.value;
    const windSpeedMph = windSpeedMs != null ? Math.round(windSpeedMs * 2.237) : null;
    const windDirDeg = latestObs.windDirection?.value;
    const windDir = windDirDeg != null ? WIND_DIRS[Math.round(windDirDeg / 22.5) % 16] : null;
    const windGustMs = latestObs.windGust?.value;
    const windGustMph = windGustMs != null ? Math.round(windGustMs * 2.237) : null;

    // Humidity and dewpoint
    const humidity = latestObs.relativeHumidity?.value != null
      ? Math.round(latestObs.relativeHumidity.value)
      : null;
    const dewpointC = latestObs.dewpoint?.value;
    const dewpointF = dewpointC != null ? Math.round((dewpointC * 9/5) + 32) : null;

    // Calculate running high from today's observations
    const todayTemps = observations
      .map(obs => obs.properties?.temperature?.value)
      .filter(t => t != null)
      .map(t => Math.round((t * 9/5) + 32));

    const runningHigh = todayTemps.length > 0 ? Math.max(...todayTemps) : null;

    return {
      temperature: tempF,
      runningHigh,
      windSpeed: windSpeedMph,
      windDir,
      windGust: windGustMph,
      humidity,
      dewpoint: dewpointF,
      timestamp: new Date(latestObs.timestamp),
    };
  } catch (error) {
    return null;
  }
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
 * Tab navigation component
 */
function TabNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'nws', label: 'NWS', icon: Radio },
    { id: 'pws', label: 'PWS', icon: CloudRain },
  ];

  return (
    <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wide
              rounded-md transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }
            `}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={10} strokeWidth={2} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Temperature position indicator - shows where temp falls in the range
 */
function TempIndicator({ temp, min, max, isPrimary }) {
  if (temp == null || min == null || max == null || min === max) return null;

  const position = ((temp - min) / (max - min)) * 100;
  const color = isPrimary ? 'bg-emerald-400' : 'bg-blue-400';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 rounded-full overflow-hidden">
      <div
        className={`absolute h-full w-1 ${color} rounded-full transition-all duration-300`}
        style={{ left: `calc(${position}% - 2px)` }}
      />
    </div>
  );
}

/**
 * Compact station row for collapsed view
 */
function StationRowCompact({ station, observation, isPrimary, isHovered, onHover, tempRange }) {
  const temp = observation?.temperature;
  const high = observation?.runningHigh;
  const hasHigh = high != null && high !== temp;

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer
        transition-all duration-200 ease-out
        ${isHovered
          ? 'bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
          : 'hover:bg-white/[0.04]'
        }
        ${isPrimary ? 'bg-emerald-500/[0.06]' : ''}
      `}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Station indicator */}
      <div className="flex items-center justify-center w-5">
        {isPrimary ? (
          <div className="relative">
            <Radio size={12} className="text-emerald-400" strokeWidth={2.5} />
            <div className="absolute inset-0 animate-ping">
              <Radio size={12} className="text-emerald-400/30" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div className={`
            w-1.5 h-1.5 rounded-full transition-all duration-200
            ${isHovered ? 'bg-blue-400 scale-125' : 'bg-white/30'}
          `} />
        )}
      </div>

      {/* Station ID */}
      <span className={`
        font-mono text-[11px] tracking-wide transition-colors duration-200
        ${isPrimary
          ? 'text-emerald-300 font-medium'
          : isHovered ? 'text-white/90' : 'text-white/60'
        }
      `}>
        {station.id}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Temperature values */}
      <div className="flex items-baseline gap-1.5 font-mono">
        <span className={`
          text-sm tabular-nums font-semibold transition-colors duration-200
          ${isPrimary ? 'text-white' : isHovered ? 'text-white' : 'text-white/80'}
        `}>
          {temp != null ? temp : '—'}
          <span className="text-[10px] text-white/40">°</span>
        </span>

        {hasHigh && (
          <span className="text-[10px] tabular-nums text-orange-400/90 font-medium">
            ↑{high}
          </span>
        )}
      </div>

      <TempIndicator
        temp={temp}
        min={tempRange?.min}
        max={tempRange?.max}
        isPrimary={isPrimary}
      />
    </div>
  );
}

/**
 * Expanded station row with wind data
 */
function StationRowExpanded({ station, observation, isPrimary, isHovered, onHover }) {
  const temp = observation?.temperature;
  const high = observation?.runningHigh;
  const hasHigh = high != null && high !== temp;
  const windSpeed = observation?.windSpeed;
  const windDir = observation?.windDir;
  const humidity = observation?.humidity;

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200 ease-out border-l-2
        ${isHovered
          ? 'bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
          : 'hover:bg-white/[0.04]'
        }
        ${isPrimary
          ? 'border-emerald-400 bg-emerald-500/[0.06]'
          : 'border-transparent'
        }
      `}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Station ID */}
      <div className="w-[60px]">
        <span className={`
          font-mono text-xs tracking-wide transition-colors duration-200
          ${isPrimary
            ? 'text-emerald-300 font-semibold'
            : isHovered ? 'text-white/90' : 'text-white/60'
          }
        `}>
          {station.id}
        </span>
      </div>

      {/* Temperature */}
      <div className="w-[50px] text-right">
        <span className={`
          font-mono text-sm tabular-nums font-semibold
          ${isPrimary ? 'text-white' : 'text-white/80'}
        `}>
          {temp != null ? `${temp}°` : '—'}
        </span>
      </div>

      {/* Running High */}
      <div className="w-[40px] text-right">
        {hasHigh ? (
          <span className="font-mono text-xs tabular-nums text-orange-400/90 font-medium">
            ↑{high}°
          </span>
        ) : (
          <span className="font-mono text-xs text-white/20">—</span>
        )}
      </div>

      {/* Wind */}
      <div className="w-[55px] text-right flex items-center justify-end gap-1">
        {windSpeed != null ? (
          <>
            <Wind size={10} className="text-white/40" />
            <span className="font-mono text-[10px] tabular-nums text-white/60">
              {windDir || ''} {windSpeed}
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] text-white/20">—</span>
        )}
      </div>

      {/* Humidity */}
      <div className="w-[40px] text-right flex items-center justify-end gap-1">
        {humidity != null ? (
          <>
            <Droplets size={9} className="text-white/40" />
            <span className="font-mono text-[10px] tabular-nums text-white/50">
              {humidity}%
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] text-white/20">—</span>
        )}
      </div>
    </div>
  );
}

/**
 * Collapsed view - current compact layout
 */
function CollapsedView({ stations, observations, mainStationId, hoveredId, onHover, tempRange, config }) {
  const spread = tempRange ? tempRange.max - tempRange.min : 0;

  return (
    <div className="flex h-full gap-3">
      {/* Left: Station Table */}
      <div className="w-[46%] min-w-0 flex flex-col">
        {/* Station list */}
        <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
          {stations.map((station, index) => (
            <div
              key={station.id}
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                animation: 'fadeSlideIn 0.3s ease-out forwards'
              }}
            >
              <StationRowCompact
                station={station}
                observation={observations[station.id]}
                isPrimary={station.id === mainStationId}
                isHovered={station.id === hoveredId}
                onHover={onHover}
                tempRange={tempRange}
              />
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="pt-2.5 mt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[10px]">
            {tempRange && (
              <div className="flex items-center gap-2">
                <span className="text-white/40 uppercase tracking-wider">Range</span>
                <span className="font-mono tabular-nums text-white/70">
                  {tempRange.min}°
                  <span className="text-white/30 mx-0.5">→</span>
                  {tempRange.max}°
                </span>
                {spread > 0 && (
                  <span className={`
                    font-mono tabular-nums px-1.5 py-0.5 rounded
                    ${spread >= 10
                      ? 'bg-orange-500/20 text-orange-300'
                      : spread >= 5
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-white/50'
                    }
                  `}>
                    ±{Math.round(spread / 2)}°
                  </span>
                )}
              </div>
            )}
            <span className="text-white/30 font-mono">{stations.length} stn</span>
          </div>
        </div>
      </div>

      {/* Right: Map */}
      <div className="flex-1 min-w-0 rounded-lg overflow-hidden ring-1 ring-white/[0.06]">
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
            <DotMarker
              key={station.id}
              station={station}
              isPrimary={station.id === mainStationId}
              isHovered={station.id === hoveredId}
              onHover={onHover}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

/**
 * Expanded NWS view with more stations and wind data
 */
function ExpandedNWSView({ stations, observations, mainStationId, hoveredId, onHover, tempRange, config }) {
  const spread = tempRange ? tempRange.max - tempRange.min : 0;

  return (
    <div className="flex h-full gap-4">
      {/* Left: Station table with headers */}
      <div className="w-[45%] min-w-0 flex flex-col">
        {/* Table header */}
        <div className="flex items-center gap-3 px-3 py-1.5 text-[9px] uppercase tracking-wider text-white/30 border-b border-white/[0.06]">
          <div className="w-[60px]">Station</div>
          <div className="w-[50px] text-right">Temp</div>
          <div className="w-[40px] text-right">High</div>
          <div className="w-[55px] text-right">Wind</div>
          <div className="w-[40px] text-right">RH</div>
        </div>

        {/* Station list */}
        <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide py-1">
          {stations.map((station, index) => (
            <div
              key={station.id}
              style={{
                animationDelay: `${index * 40}ms`,
                opacity: 0,
                animation: 'fadeSlideIn 0.25s ease-out forwards'
              }}
            >
              <StationRowExpanded
                station={station}
                observation={observations[station.id]}
                isPrimary={station.id === mainStationId}
                isHovered={station.id === hoveredId}
                onHover={onHover}
              />
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[10px]">
            {tempRange && (
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-white/70">
                  {tempRange.min}°–{tempRange.max}°
                </span>
                {spread > 0 && (
                  <span className={`
                    font-mono tabular-nums px-1.5 py-0.5 rounded text-[9px]
                    ${spread >= 10
                      ? 'bg-orange-500/20 text-orange-300'
                      : spread >= 5
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-white/50'
                    }
                  `}>
                    {spread}° spread
                  </span>
                )}
              </div>
            )}
            <span className="text-white/30 font-mono">{stations.length} NWS stations</span>
          </div>
        </div>
      </div>

      {/* Right: Larger map */}
      <div className="flex-1 min-w-0 rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
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
            <DotMarker
              key={station.id}
              station={station}
              isPrimary={station.id === mainStationId}
              isHovered={station.id === hoveredId}
              onHover={onHover}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

/**
 * PWS View - Personal Weather Station tab (Ambient Weather)
 */
function PWSView({ config }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading for now - will integrate Ambient Weather API
    const timer = setTimeout(() => {
      setIsLoading(false);
      setError('PWS integration coming soon. This tab will show nearby personal weather stations from the Ambient Weather Network.');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
          </div>
          <span className="text-white/40 text-xs font-mono tracking-wide">LOADING PWS</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CloudRain size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/50 text-sm leading-relaxed">{error}</p>
          <p className="text-white/30 text-xs mt-4">
            PWS stations provide hyperlocal readings from residential weather stations,
            complementing the official NWS airport data.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Map marker component with hover state
 */
function DotMarker({ station, isPrimary, isHovered, onHover }) {
  const icon = useMemo(
    () => createDotIcon(isPrimary, isHovered),
    [isPrimary, isHovered]
  );

  return (
    <Marker
      position={[station.lat, station.lon]}
      icon={icon}
      eventHandlers={{
        mouseover: () => onHover(station.id),
        mouseout: () => onHover(null),
      }}
    />
  );
}

/**
 * NearbyStations - Weather stations widget with expandable table + map layout
 */
export default function NearbyStations({ citySlug, isExpanded, onToggleExpand }) {
  const [stations, setStations] = useState([]);
  const [observations, setObservations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStationId, setHoveredStationId] = useState(null);
  const [activeTab, setActiveTab] = useState('nws');

  const config = CITY_CONFIGS[citySlug];
  const mainStationId = MAIN_STATIONS[citySlug];

  // Load stations on mount - more stations when expanded
  useEffect(() => {
    if (!citySlug) return;

    const loadStations = async () => {
      setIsLoading(true);
      setStations([]);
      setObservations({});

      const limit = isExpanded ? 15 : 6;
      const nearbyStations = await fetchNearbyStations(citySlug, limit);
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
  }, [citySlug, isExpanded]);

  // Handle hover (shared between table and map)
  const handleHover = useCallback((stationId) => {
    setHoveredStationId(stationId);
  }, []);

  // Calculate temperature range and timestamp
  const { tempRange, latestTimestamp } = useMemo(() => {
    const temps = Object.values(observations)
      .map(o => o?.temperature)
      .filter(t => t != null);

    const latest = Object.values(observations)
      .map(o => o?.timestamp)
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    return {
      tempRange: temps.length > 0
        ? { min: Math.min(...temps), max: Math.max(...temps) }
        : null,
      latestTimestamp: latest,
    };
  }, [observations]);

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
      headerRight={
        <div className="flex items-center gap-2">
          {/* Tab navigation - only in expanded view */}
          {isExpanded && (
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          {/* Time ago */}
          {timeAgo && (
            <span className="text-[10px] text-white/40 font-mono">{timeAgo} ago</span>
          )}

          {/* Expand/collapse button */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-8 h-8 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
            </div>
            <span className="text-white/40 text-xs font-mono tracking-wide">LOADING</span>
          </div>
        </div>
      ) : isExpanded ? (
        activeTab === 'nws' ? (
          <ExpandedNWSView
            stations={stations}
            observations={observations}
            mainStationId={mainStationId}
            hoveredId={hoveredStationId}
            onHover={handleHover}
            tempRange={tempRange}
            config={config}
          />
        ) : (
          <PWSView config={config} />
        )
      ) : (
        <CollapsedView
          stations={stations}
          observations={observations}
          mainStationId={mainStationId}
          hoveredId={hoveredStationId}
          onHover={handleHover}
          tempRange={tempRange}
          config={config}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </GlassWidget>
  );
}

NearbyStations.propTypes = {
  citySlug: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};

NearbyStations.defaultProps = {
  isExpanded: false,
  onToggleExpand: null,
};
