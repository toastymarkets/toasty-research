import { useState, useEffect, useRef } from 'react';
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
    const { satellite, sector } = getGOESConfig(lon, lat);

    const now = new Date();
    const frameUrls = [];

    // GOES images update at minutes ending in 1 or 6 (01, 06, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56)
    for (let i = 23; i >= 0; i--) {
      const frameTime = new Date(now.getTime() - i * 5 * 60 * 1000);
      // Round to nearest GOES interval (minutes ending in 1 or 6)
      const mins = frameTime.getUTCMinutes();
      const remainder = mins % 5;
      const roundedMins = mins - remainder + (remainder < 3 ? 1 : 6);
      frameTime.setUTCMinutes(roundedMins > 59 ? roundedMins - 60 : roundedMins);
      if (roundedMins > 59) frameTime.setUTCHours(frameTime.getUTCHours() + 1);
      frameTime.setSeconds(0);

      const year = frameTime.getUTCFullYear();
      const dayOfYear = Math.floor((frameTime - new Date(Date.UTC(year, 0, 0))) / (1000 * 60 * 60 * 24));
      const hours = frameTime.getUTCHours().toString().padStart(2, '0');
      const minsStr = frameTime.getUTCMinutes().toString().padStart(2, '0');
      const timestamp = `${year}${dayOfYear.toString().padStart(3, '0')}${hours}${minsStr}`;

      // Use AirMass band for better cloud/weather visualization
      const url = `https://cdn.star.nesdis.noaa.gov/${satellite}/ABI/SECTOR/${sector}/AirMass/${timestamp}_${satellite}-ABI-${sector}-AirMass-1200x1200.jpg`;

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
  }, [activeTab, lat, lon]);

  // Animate satellite frames
  useEffect(() => {
    if (activeTab !== 'satellite' || satelliteFrames.length === 0) return;

    const interval = setInterval(() => {
      setSatelliteIndex(prev => (prev + 1) % satelliteFrames.length);
    }, 400);

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
          <div className="absolute top-3 left-3 z-[1000] flex gap-1 p-1 rounded-full bg-black/40 backdrop-blur-sm">
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
                {getGOESConfig(lon, lat).satellite.replace('GOES', 'GOES-')} AirMass
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
