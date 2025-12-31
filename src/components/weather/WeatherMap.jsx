import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Map, Maximize2, Cloud, Satellite } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import GlassWidget from './GlassWidget';
import MapWidgetPopup from './MapWidgetPopup';

/**
 * Get GOES satellite configuration based on longitude
 */
function getGOESConfig(lon, lat) {
  const isWest = lon < -105;
  const satellite = isWest ? 'GOES18' : 'GOES16';

  let sector;
  if (isWest) {
    if (lat > 42) sector = 'pnw';
    else if (lon < -115) sector = 'psw';
    else sector = 'nr';
  } else {
    if (lat > 40 && lon > -85) sector = 'ne';
    else if (lat > 38 && lon < -85) sector = 'umv';
    else if (lat < 30) sector = 'se';
    else if (lon < -90) sector = 'sp';
    else sector = 'ma';
  }

  return { satellite, sector };
}

/**
 * Get available sectors for a location (local + regional views)
 * Local sectors use 1200x1200, regional sectors use 1800x1080
 */
function getAvailableSectors(lon, lat) {
  const isWest = lon < -105;
  const config = getGOESConfig(lon, lat);

  if (isWest) {
    // GOES-18 regional sectors
    return [
      { id: config.sector, label: 'Local', size: '1200x1200' },
      { id: 'tpw', label: 'Tropical Pacific', size: '1800x1080' },
      { id: 'wus', label: 'West US', size: '1800x1080' },
    ];
  } else {
    // GOES-16 regional sectors
    return [
      { id: config.sector, label: 'Local', size: '1200x1200' },
      { id: 'eus', label: 'East US', size: '1800x1080' },
      { id: 'gm', label: 'Gulf of Mexico', size: '1800x1080' },
      { id: 'car', label: 'Caribbean', size: '1800x1080' },
    ];
  }
}

/**
 * WeatherMap - Interactive weather map widget with Precipitation/Satellite tabs
 */
export default function WeatherMap({
  lat,
  lon,
  zoom = 8,
  loading = false,
  className = '',
  cityName = '',
  currentTemp = null,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [L, setL] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('precipitation');

  // Satellite state
  const [satelliteFrames, setSatelliteFrames] = useState([]);
  const [satelliteIndex, setSatelliteIndex] = useState(0);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteBand, setSatelliteBand] = useState('AirMass');
  const [satelliteSector, setSatelliteSector] = useState(() => getGOESConfig(lon, lat).sector);

  // Get available sectors for this location (memoized to prevent infinite re-renders)
  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  const SATELLITE_BANDS = [
    { id: 'AirMass', label: 'AirMass' },
    { id: 'GEOCOLOR', label: 'GeoColor' },
    { id: 'Sandwich', label: 'Sandwich' },
  ];

  // Dynamically import Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Initialize map (only for precipitation tab)
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;
    if (activeTab !== 'precipitation') return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L, lat, lon, zoom, activeTab]);

  // Invalidate map size when container changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [L, activeTab]);

  // Add precipitation radar overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !L || activeTab !== 'precipitation') return;

    const map = mapInstanceRef.current;

    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        const pastFrames = data.radar?.past || [];
        const latestRadar = pastFrames[pastFrames.length - 1]?.path;
        if (latestRadar) {
          map.eachLayer((layer) => {
            if (layer.options?.isWeatherOverlay) {
              map.removeLayer(layer);
            }
          });

          const radarLayer = L.tileLayer(
            `https://tilecache.rainviewer.com${latestRadar}/256/{z}/{x}/{y}/2/1_1.png`,
            { opacity: 0.6, isWeatherOverlay: true }
          );
          radarLayer.addTo(map);
        }
      })
      .catch(console.error);
  }, [L, activeTab]);

  // Fetch satellite imagery when tab is active
  useEffect(() => {
    if (activeTab !== 'satellite' || !lat || !lon) return;

    setSatelliteLoading(true);
    const { satellite } = getGOESConfig(lon, lat);
    const sector = satelliteSector; // Use selected sector
    const sectorConfig = availableSectors.find(s => s.id === sector);
    const imageSize = sectorConfig?.size || '1200x1200';
    const isRegional = imageSize !== '1200x1200';

    const now = new Date();
    const frameUrls = [];

    // Local sectors: update every 5 min at minutes ending in 1 or 6
    // Regional sectors: update every 10 min at minutes ending in 0
    const frameCount = 72;
    const intervalMinutes = 10;
    for (let i = frameCount - 1; i >= 0; i--) {
      const frameTime = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
      const mins = frameTime.getUTCMinutes();

      let roundedMins;
      if (isRegional) {
        // Regional: round to nearest 10 (00, 10, 20, 30, 40, 50)
        roundedMins = Math.round(mins / 10) * 10;
      } else {
        // Local: round to nearest GOES interval (minutes ending in 1 or 6)
        const remainder = mins % 5;
        roundedMins = mins - remainder + (remainder < 3 ? 1 : 6);
      }

      frameTime.setUTCMinutes(roundedMins >= 60 ? roundedMins - 60 : roundedMins);
      if (roundedMins >= 60) frameTime.setUTCHours(frameTime.getUTCHours() + 1);
      frameTime.setSeconds(0);

      const year = frameTime.getUTCFullYear();
      const dayOfYear = Math.floor((frameTime - new Date(Date.UTC(year, 0, 0))) / (1000 * 60 * 60 * 24));
      const hours = frameTime.getUTCHours().toString().padStart(2, '0');
      const minsStr = frameTime.getUTCMinutes().toString().padStart(2, '0');
      const timestamp = `${year}${dayOfYear.toString().padStart(3, '0')}${hours}${minsStr}`;

      const url = `https://cdn.star.nesdis.noaa.gov/${satellite}/ABI/SECTOR/${sector}/${satelliteBand}/${timestamp}_${satellite}-ABI-${sector}-${satelliteBand}-${imageSize}.jpg`;

      frameUrls.push({ url, time: frameTime, timestamp });
    }

    const validateFrames = async () => {
      const checkFrame = async (frame) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ ...frame, valid: true });
          img.onerror = () => resolve({ ...frame, valid: false });
          img.src = frame.url;
        });
      };

      const results = await Promise.all(frameUrls.map(checkFrame));
      const valid = results.filter(f => f.valid);

      if (valid.length > 0) {
        setSatelliteFrames(valid);
        setSatelliteIndex(valid.length - 1);
      } else {
        setSatelliteFrames([]);
      }
      setSatelliteLoading(false);
    };

    validateFrames();
  }, [activeTab, lat, lon, satelliteBand, satelliteSector, availableSectors]);

  // Animate satellite frames
  useEffect(() => {
    if (activeTab !== 'satellite' || satelliteFrames.length === 0) return;

    const interval = setInterval(() => {
      setSatelliteIndex(prev => (prev + 1) % satelliteFrames.length);
    }, 100); // 100ms per frame for smooth 12-hour animation

    return () => clearInterval(interval);
  }, [activeTab, satelliteFrames.length]);

  // Update map center when lat/lon changes
  useEffect(() => {
    if (mapInstanceRef.current && lat && lon) {
      mapInstanceRef.current.setView([lat, lon], zoom);
    }
  }, [lat, lon, zoom]);

  if (loading) {
    return (
      <GlassWidget title="WEATHER MAP" icon={Map} size="large">
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="w-full h-full bg-white/10 rounded-lg" />
        </div>
      </GlassWidget>
    );
  }

  const tabs = [
    { id: 'precipitation', icon: Cloud, label: 'Precip' },
    { id: 'satellite', icon: Satellite, label: 'Satellite' },
  ];

  return (
    <>
      <GlassWidget
        title={activeTab === 'satellite' ? 'SATELLITE' : 'PRECIPITATION'}
        icon={Map}
        size="large"
        className={`h-full ${className}`}
      >
        <div className="relative flex-1 -mx-2 -mb-2 rounded-b-xl overflow-hidden">
          {/* Tab Toggle */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-full bg-black/40 backdrop-blur-sm">
              {tabs.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(id);
                  }}
                  className={`p-1.5 rounded-full transition-all ${
                    activeTab === id
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  title={id === 'precipitation' ? 'Precipitation Radar' : 'Satellite Imagery'}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Sector and Band selectors (satellite only) */}
            {activeTab === 'satellite' && (
              <>
                <select
                  value={satelliteSector}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSatelliteSector(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-[10px] rounded-full bg-black/40 backdrop-blur-sm text-white/80 border-none outline-none cursor-pointer"
                >
                  {availableSectors.map(({ id, label }) => (
                    <option key={id} value={id} className="bg-gray-900">
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={satelliteBand}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSatelliteBand(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-[10px] rounded-full bg-black/40 backdrop-blur-sm text-white/80 border-none outline-none cursor-pointer"
                >
                  {SATELLITE_BANDS.map(({ id, label }) => (
                    <option key={id} value={id} className="bg-gray-900">
                      {label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Precipitation Map */}
          {activeTab === 'precipitation' && (
            <div
              ref={mapRef}
              className="absolute inset-0 bg-gray-900 cursor-pointer"
              onClick={() => setIsPopupOpen(true)}
            />
          )}

          {/* Satellite View */}
          {activeTab === 'satellite' && (
            <div
              className="absolute inset-0 bg-black cursor-pointer"
              onClick={() => setIsPopupOpen(true)}
            >
              {satelliteLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/60 text-xs">Loading...</div>
                </div>
              ) : satelliteFrames.length > 0 ? (
                <img
                  src={satelliteFrames[satelliteIndex]?.url}
                  alt="GOES Satellite"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/60 text-xs">Unavailable</div>
                </div>
              )}
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={() => setIsPopupOpen(true)}
            className="absolute top-3 right-3 z-[1000] p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/50 hover:text-white transition-all"
            title="Expand map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            {activeTab === 'precipitation' ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000, #ff00ff)' }} />
                <span className="text-[10px] text-white/70">Light → Heavy</span>
              </div>
            ) : (
              <span className="text-[10px] text-white/70">
                {getGOESConfig(lon, lat).satellite.replace('GOES', 'GOES-')} • {availableSectors.find(s => s.id === satelliteSector)?.label || satelliteSector}
              </span>
            )}
          </div>
        </div>
      </GlassWidget>

      {/* Map Popup Modal */}
      <MapWidgetPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        lat={lat}
        lon={lon}
        cityName={cityName}
        currentTemp={currentTemp}
        initialLayer={activeTab}
        initialBand={satelliteBand}
        initialSector={satelliteSector}
        onBandChange={setSatelliteBand}
        onSectorChange={setSatelliteSector}
      />
    </>
  );
}

WeatherMap.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  zoom: PropTypes.number,
  loading: PropTypes.bool,
  className: PropTypes.string,
  cityName: PropTypes.string,
  currentTemp: PropTypes.number,
};
