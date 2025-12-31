import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Cloud, Play, Pause, Satellite } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  getGOESConfig,
  getAvailableSectors,
  generateFrameUrl,
  preloadImage,
} from '../../utils/satellite';

/**
 * MapWidgetPopup - Apple Weather inspired expandable map modal
 * Features: Precipitation, Temperature, Wind layers with timeline playback
 */
const SATELLITE_BANDS = [
  { id: 'AirMass', label: 'AirMass' },
  { id: 'GEOCOLOR', label: 'GeoColor' },
  { id: 'Sandwich', label: 'Sandwich' },
];

export default function MapWidgetPopup({
  isOpen,
  onClose,
  lat,
  lon,
  cityName,
  currentTemp,
  initialLayer = 'precipitation',
  initialBand = 'AirMass',
  initialSector,
  onBandChange,
  onSectorChange,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [L, setL] = useState(null);
  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Satellite state - optimized with refs for animation
  const [satelliteImage, setSatelliteImage] = useState(null);
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [satelliteBand, setSatelliteBand] = useState(initialBand);
  const [satelliteSector, setSatelliteSector] = useState(initialSector || getGOESConfig(lon, lat).sector);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const loadingRef = useRef(false);

  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  // Sync settings when popup opens
  useEffect(() => {
    if (isOpen) {
      if (initialLayer) setActiveLayer(initialLayer);
      if (initialBand) setSatelliteBand(initialBand);
      if (initialSector) setSatelliteSector(initialSector);
    }
  }, [isOpen, initialLayer, initialBand, initialSector]);

  // Reset sector when city changes
  useEffect(() => {
    setSatelliteSector(getGOESConfig(lon, lat).sector);
  }, [lon, lat]);

  // Dynamically import Leaflet
  useEffect(() => {
    if (isOpen) {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, [isOpen]);

  // Fetch RainViewer radar frames
  useEffect(() => {
    if (!isOpen) return;

    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        const pastFrames = (data.radar?.past || []).map(f => ({
          time: new Date(f.time * 1000),
          path: f.path,
          type: 'past',
        }));
        const nowcastFrames = (data.radar?.nowcast || []).map(f => ({
          time: new Date(f.time * 1000),
          path: f.path,
          type: 'nowcast',
        }));
        const allFrames = [...pastFrames, ...nowcastFrames];
        setFrames(allFrames);
        // Start at most recent past frame (just before nowcast)
        setCurrentFrameIndex(Math.max(0, pastFrames.length - 1));
      })
      .catch(console.error);
  }, [isOpen]);


  // Load satellite imagery
  useEffect(() => {
    if (!isOpen || !lat || !lon || activeLayer !== 'satellite') return;
    if (loadingRef.current) return;

    const sectorConfig = availableSectors.find(s => s.id === satelliteSector);
    const satellite = sectorConfig?.satellite || getGOESConfig(lon, lat).satellite;
    const imageSize = sectorConfig?.size || '1200x1200';

    loadingRef.current = true;

    const loadSatellite = async () => {
      // Find most recent valid frame
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

      // Load animation frames in background (24 frames = 4 hours for popup)
      const urls = [];
      for (let i = 0; i < 24; i++) {
        urls.push(generateFrameUrl(satellite, satelliteSector, satelliteBand, imageSize, i * 10));
      }

      const results = await Promise.all(urls.map(preloadImage));
      const validUrls = results.filter(Boolean);

      if (validUrls.length > 0) {
        framesRef.current = validUrls;
        frameIndexRef.current = validUrls.length - 1;
      }

      loadingRef.current = false;
    };

    loadSatellite();
  }, [isOpen, lat, lon, activeLayer, satelliteBand, satelliteSector, availableSectors]);

  // Animate satellite frames
  useEffect(() => {
    if (!isOpen || activeLayer !== 'satellite' || !satelliteReady) return;

    const animate = () => {
      if (framesRef.current.length > 1) {
        frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
        setSatelliteImage(framesRef.current[frameIndexRef.current]);
      }
    };

    const interval = setInterval(animate, 120);
    return () => clearInterval(interval);
  }, [isOpen, activeLayer, satelliteReady]);

  // Reset loading state when city or settings change
  useEffect(() => {
    loadingRef.current = false;
    framesRef.current = [];
    frameIndexRef.current = 0;
  }, [lat, lon, satelliteBand, satelliteSector]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!L || !mapRef.current || !isOpen) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, lat, lon, isOpen]);

  // Update radar layer when frame changes (precipitation layer)
  useEffect(() => {
    if (!mapInstanceRef.current || !L || activeLayer !== 'precipitation') return;
    if (frames.length === 0) return;

    const map = mapInstanceRef.current;
    const currentFrame = frames[currentFrameIndex];
    if (!currentFrame) return;

    // Remove existing radar layer
    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
    }

    // Add new radar layer
    radarLayerRef.current = L.tileLayer(
      `https://tilecache.rainviewer.com${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      { opacity: 0.7, zIndex: 10 }
    );
    radarLayerRef.current.addTo(map);
  }, [L, activeLayer, frames, currentFrameIndex]);

  // Clean up radar layer when switching away from precipitation
  useEffect(() => {
    if (activeLayer !== 'precipitation' && radarLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }
  }, [activeLayer]);

  // Timeline playback for precipitation only (satellite uses its own animation)
  useEffect(() => {
    if (!isPlaying || activeLayer === 'satellite') return;
    if (frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length);
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, activeLayer]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Format time for display
  const formatFrameTime = useCallback((frame) => {
    if (!frame) return '';
    return frame.time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Get current frame info
  const currentFrame = frames[currentFrameIndex];
  const nowIndex = frames.findIndex(f => f.type === 'nowcast');

  if (!isOpen) return null;

  const layers = [
    { id: 'satellite', icon: Satellite, label: 'Satellite' },
    { id: 'precipitation', icon: Cloud, label: 'Precip' },
  ];

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - constrained size to leave room for sidebar */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 lg:p-12 pointer-events-none">
        <div className="relative w-full max-w-3xl h-full max-h-[600px] glass-elevated rounded-3xl overflow-hidden animate-scale-in flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="text-center">
              <span className="text-white font-medium text-sm">{cityName || 'Weather Map'}</span>
            </div>

            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* Layer Toggle - horizontal bar below header */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
              {layers.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveLayer(id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium
                    ${activeLayer === id
                      ? 'bg-white/25 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Sector and Band selectors (satellite only) */}
            {activeLayer === 'satellite' && (
              <>
                <select
                  value={satelliteSector}
                  onChange={(e) => {
                    setSatelliteSector(e.target.value);
                    if (onSectorChange) onSectorChange(e.target.value);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full bg-black/50 backdrop-blur-md text-white/80 border-none outline-none cursor-pointer"
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
                    setSatelliteBand(e.target.value);
                    if (onBandChange) onBandChange(e.target.value);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full bg-black/50 backdrop-blur-md text-white/80 border-none outline-none cursor-pointer"
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

        {/* Map Container - z-[1] creates stacking context to contain Leaflet's high z-indexes */}
        <div ref={mapRef} className="absolute inset-0 bg-gray-900 z-[1]" />


        {/* Satellite Overlay */}
        {activeLayer === 'satellite' && (
          <div className="absolute inset-0 z-10 bg-black overflow-hidden">
            {satelliteImage ? (
              <img
                src={satelliteImage}
                alt="GOES Satellite"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-sm">
                  {satelliteReady === false ? 'Satellite imagery unavailable' : 'Loading...'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* City Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
              <span className="text-lg font-semibold text-white">
                {currentTemp != null ? `${Math.round(currentTemp)}°` : '--°'}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-white mt-1 shadow-lg" />
          </div>
        </div>

        {/* Legend */}
        {activeLayer === 'precipitation' && (
          <div className="absolute bottom-24 left-4 z-[60]">
            <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <div className="text-[10px] text-white/60 mb-1.5 font-medium">Precipitation</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-24 h-2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff8800, #ff0000, #ff00ff)' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/50 mt-1">
                <span>Light</span>
                <span>Heavy</span>
              </div>
            </div>
          </div>
        )}


        {activeLayer === 'satellite' && satelliteReady && (
          <div className="absolute bottom-24 left-4 z-[60]">
            <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <div className="text-[10px] text-white/60 mb-1.5 font-medium">GOES Satellite</div>
              <div className="text-sm font-semibold text-white">
                {(availableSectors.find(s => s.id === satelliteSector)?.satellite || 'GOES19').replace('GOES', 'GOES-')}
              </div>
              <div className="text-[10px] text-white/50">
                {availableSectors.find(s => s.id === satelliteSector)?.label || satelliteSector} • {satelliteBand}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Scrubber - precipitation only, satellite auto-animates */}
        {activeLayer !== 'satellite' && (() => {
          const activeFrame = frames[currentFrameIndex];

          return (
            <div className="absolute bottom-0 left-0 right-0 z-[60] px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent">
              {/* Frame indicator */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  disabled={frames.length === 0}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>
                <span className="text-sm text-white/80">
                  {activeFrame ? formatFrameTime(activeFrame) : '--:--'}
                </span>
                {currentFrame?.type === 'nowcast' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs">
                    Forecast
                  </span>
                )}
              </div>

              {/* Scrubber track */}
              <div className="relative h-1.5 bg-white/20 rounded-full">
                {/* Now indicator */}
                {nowIndex > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60"
                    style={{ left: `${(nowIndex / (frames.length - 1)) * 100}%` }}
                  />
                )}

                {/* Progress fill */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-white/50"
                  style={{ width: `${frames.length > 1 ? (currentFrameIndex / (frames.length - 1)) * 100 : 0}%` }}
                />

                {/* Draggable thumb */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, frames.length - 1)}
                  value={currentFrameIndex}
                  onChange={(e) => {
                    setCurrentFrameIndex(parseInt(e.target.value, 10));
                    setIsPlaying(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={frames.length === 0}
                />

                {/* Visual thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg pointer-events-none"
                  style={{ left: `${frames.length > 1 ? (currentFrameIndex / (frames.length - 1)) * 100 : 0}%` }}
                />
              </div>

              {/* Time labels */}
              <div className="flex justify-between mt-2 text-[10px] text-white/50">
                <span>-2h</span>
                <span>Now</span>
                <span>+30m</span>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}

MapWidgetPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  cityName: PropTypes.string,
  currentTemp: PropTypes.number,
  initialLayer: PropTypes.oneOf(['precipitation', 'satellite', 'temperature', 'wind']),
  initialBand: PropTypes.oneOf(['AirMass', 'GEOCOLOR', 'Sandwich']),
  initialSector: PropTypes.string,
  onBandChange: PropTypes.func,
  onSectorChange: PropTypes.func,
};
