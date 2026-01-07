import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Map, Cloud, Satellite, ChevronLeft, ChevronRight } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import GlassWidget from './GlassWidget';
import {
  getGOESConfig,
  getAvailableSectors,
  generateFrameUrl,
  preloadImage,
} from '../../utils/satellite';

/**
 * WeatherMap - Interactive weather map widget with Precipitation/Satellite tabs
 */
export default function WeatherMap({
  lat,
  lon,
  zoom = 8,
  loading = false,
  className = '',
  isExpanded = false,
  onToggleExpand = null,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [L, setL] = useState(null);
  const [activeTab, setActiveTab] = useState('satellite');

  // Satellite state - use refs for animation to avoid re-renders
  const [satelliteImage, setSatelliteImage] = useState(null); // Current displayed image
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [satelliteBand, setSatelliteBand] = useState('AirMass');
  const [satelliteSector, setSatelliteSector] = useState(() => getGOESConfig(lon, lat).sector);
  const framesRef = useRef([]); // Animation frames stored in ref
  const frameIndexRef = useRef(0);
  const loadingRef = useRef(false);

  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  // Reset sector when city changes (but keep current image visible until new one loads)
  useEffect(() => {
    setSatelliteSector(getGOESConfig(lon, lat).sector);
  }, [lon, lat]);

  const SATELLITE_BANDS = [
    { id: 'AirMass', label: 'AirMass' },
    { id: 'GEOCOLOR', label: 'GeoColor' },
    { id: 'Sandwich', label: 'Sandwich' },
  ];

  // Dynamically import Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => setL(leaflet.default));
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

  // Load satellite imagery
  useEffect(() => {
    if (activeTab !== 'satellite' || !lat || !lon) return;
    if (loadingRef.current) return; // Prevent duplicate loads

    const sectorConfig = availableSectors.find(s => s.id === satelliteSector);
    const satellite = sectorConfig?.satellite || getGOESConfig(lon, lat).satellite;
    const imageSize = sectorConfig?.size || '1200x1200';

    loadingRef.current = true;

    const loadSatellite = async () => {
      // Try to find the most recent valid frame (check last 6 timestamps)
      let firstValidUrl = null;
      for (let i = 0; i < 6; i++) {
        const url = generateFrameUrl(satellite, satelliteSector, satelliteBand, imageSize, i * 10);
        const result = await preloadImage(url);
        if (result) {
          firstValidUrl = result;
          break;
        }
      }

      if (!firstValidUrl) {
        setSatelliteReady(false);
        loadingRef.current = false;
        return;
      }

      // Show first frame immediately
      setSatelliteImage(firstValidUrl);
      setSatelliteReady(true);

      // Load animation frames in background (18 frames = 3 hours)
      const urls = [];
      for (let i = 0; i < 18; i++) {
        urls.push(generateFrameUrl(satellite, satelliteSector, satelliteBand, imageSize, i * 10));
      }

      const results = await Promise.all(urls.map(preloadImage));
      const validUrls = results.filter(Boolean);

      if (validUrls.length > 0) {
        // Reverse so index 0 = oldest, index N = newest
        // Animation increments: oldest → newest (correct chronological order)
        framesRef.current = validUrls.reverse();
        frameIndexRef.current = 0;
      }

      loadingRef.current = false;
    };

    loadSatellite();
  }, [activeTab, lat, lon, satelliteBand, satelliteSector, availableSectors]);

  // Animate satellite frames using refs (no re-renders during animation)
  useEffect(() => {
    if (activeTab !== 'satellite' || !satelliteReady) return;

    const animate = () => {
      if (framesRef.current.length > 1) {
        frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
        setSatelliteImage(framesRef.current[frameIndexRef.current]);
      }
    };

    const interval = setInterval(animate, 120);
    return () => clearInterval(interval);
  }, [activeTab, satelliteReady]);

  // Reset loading state when city or settings change
  useEffect(() => {
    loadingRef.current = false;
    framesRef.current = [];
    frameIndexRef.current = 0;
  }, [lat, lon, satelliteBand, satelliteSector]);

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
    { id: 'satellite', icon: Satellite, label: 'Satellite' },
    { id: 'precipitation', icon: Cloud, label: 'Precip' },
  ];

  return (
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
              className={`absolute inset-0 bg-gray-900 ${onToggleExpand ? 'cursor-pointer' : ''}`}
              onClick={onToggleExpand}
            />
          )}

          {/* Satellite View */}
          {activeTab === 'satellite' && (
            <div
              className={`absolute inset-0 bg-black overflow-hidden ${onToggleExpand ? 'cursor-pointer' : ''}`}
              onClick={onToggleExpand}
            >
              {satelliteImage ? (
                <img
                  src={satelliteImage}
                  alt="GOES Satellite"
                  className="w-full h-full object-cover transition-opacity duration-150"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/40 text-xs">{satelliteReady === false ? 'Unavailable' : 'Loading...'}</div>
                </div>
              )}
            </div>
          )}

          {/* Expand button */}
          {onToggleExpand && (
            <div className="absolute top-3 right-3 z-[1000]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/50 hover:text-white transition-all"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            {activeTab === 'precipitation' ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000, #ff00ff)' }} />
                <span className="text-[10px] text-white/70">Light → Heavy</span>
              </div>
            ) : (
              <span className="text-[10px] text-white/70">
                {(availableSectors.find(s => s.id === satelliteSector)?.satellite || 'GOES19').replace('GOES', 'GOES-')} • {availableSectors.find(s => s.id === satelliteSector)?.label || satelliteSector}
              </span>
            )}
          </div>
        </div>
      </GlassWidget>
  );
}

WeatherMap.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  zoom: PropTypes.number,
  loading: PropTypes.bool,
  className: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func,
};
