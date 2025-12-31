import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Cloud, Play, Pause, Satellite } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * Get GOES satellite configuration based on location
 * GOES-18: Pacific coast (pnw, psw only)
 * GOES-19: All other regions (replaced GOES-16, has more sectors)
 */
function getGOESConfig(lon, lat) {
  // GOES-18 only has pnw and psw sectors (Pacific coast)
  // Use GOES-19 for everything else (it has all sectors including nr)
  const isPacificCoast = lon < -115 || (lat > 42 && lon < -104);
  const satellite = isPacificCoast ? 'GOES18' : 'GOES19';
  const satNum = isPacificCoast ? '18' : '19';

  let sector;
  if (lat > 42 && lon < -104) {
    sector = 'pnw';                              // Seattle, Portland
  } else if (lon < -115) {
    sector = 'psw';                              // LA, SF, San Diego
  } else if (lon < -104) {
    sector = 'nr';                               // Denver, SLC (GOES-19)
  } else if (lat > 40 && lon > -85) {
    sector = 'ne';                               // NYC, Boston, Philly, DC
  } else if (lat > 37 && lon < -82) {
    sector = 'umv';                              // Chicago, Detroit
  } else if (lat < 30 && lon > -90) {
    sector = 'se';                               // Miami
  } else if (lon < -90) {
    sector = 'sp';                               // Houston, Austin, Dallas
  } else {
    sector = 'ne';                               // DC and others default to ne
  }

  return { satellite, satNum, sector };
}

/**
 * Get available sectors for a location (local + regional views)
 * Local sectors use 1200x1200, regional sectors use 1800x1080
 */
function getAvailableSectors(lon, lat) {
  const config = getGOESConfig(lon, lat);
  const isPacificCoast = config.satellite === 'GOES18';

  if (isPacificCoast) {
    return [
      { id: config.sector, label: 'Local', size: '1200x1200', satellite: 'GOES18' },
      { id: 'tpw', label: 'Pacific', size: '1800x1080', satellite: 'GOES18' },
    ];
  } else {
    return [
      { id: config.sector, label: 'Local', size: '1200x1200', satellite: 'GOES19' },
      { id: 'eus', label: 'East US', size: '1800x1080', satellite: 'GOES19' },
    ];
  }
}

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
  const [satelliteFrames, setSatelliteFrames] = useState([]);
  const [satelliteFrameIndex, setSatelliteFrameIndex] = useState(0);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteBand, setSatelliteBand] = useState(initialBand);
  const [satelliteSector, setSatelliteSector] = useState(initialSector || getGOESConfig(lon, lat).sector);

  // Get available sectors for this location (memoized to prevent infinite re-renders)
  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  // Sync active layer, band, and sector when popup opens
  useEffect(() => {
    if (isOpen && initialLayer) {
      setActiveLayer(initialLayer);
    }
    if (isOpen && initialBand) {
      setSatelliteBand(initialBand);
    }
    if (isOpen && initialSector) {
      setSatelliteSector(initialSector);
    }
  }, [isOpen, initialLayer, initialBand, initialSector]);

  // Reset satellite state when city changes
  useEffect(() => {
    const newSector = getGOESConfig(lon, lat).sector;
    setSatelliteSector(newSector);
    setSatelliteFrames([]);
    setSatelliteFrameIndex(0);
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


  // Fetch GOES satellite imagery frames
  useEffect(() => {
    if (!isOpen || !lat || !lon || activeLayer !== 'satellite') return;

    setSatelliteLoading(true);
    const sector = satelliteSector; // Use selected sector
    const sectorConfig = availableSectors.find(s => s.id === sector);
    const satellite = sectorConfig?.satellite || getGOESConfig(lon, lat).satellite;
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
      frameTime.setMilliseconds(0);

      const year = frameTime.getUTCFullYear();
      const dayOfYear = Math.floor((frameTime - new Date(Date.UTC(year, 0, 0))) / (1000 * 60 * 60 * 24));
      const hours = frameTime.getUTCHours().toString().padStart(2, '0');
      const minsStr = frameTime.getUTCMinutes().toString().padStart(2, '0');
      const timestamp = `${year}${dayOfYear.toString().padStart(3, '0')}${hours}${minsStr}`;

      // Use selected band for satellite imagery
      const url = `https://cdn.star.nesdis.noaa.gov/${satellite}/ABI/SECTOR/${sector}/${satelliteBand}/${timestamp}_${satellite}-ABI-${sector}-${satelliteBand}-${imageSize}.jpg`;

      frameUrls.push({
        url,
        time: frameTime,
        timestamp,
      });
    }

    // Validate which frames actually exist by trying to load them
    const validateFrames = async () => {
      const validFrames = [];

      // Check frames in parallel but limit concurrency
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
        setSatelliteFrameIndex(valid.length - 1); // Start at most recent
      } else {
        // Fallback: try latest_times.json API from CIRA
        console.warn('No GOES frames found via CDN, satellite view may be unavailable');
        setSatelliteFrames([]);
      }
      setSatelliteLoading(false);
    };

    validateFrames();
  }, [isOpen, lat, lon, activeLayer, satelliteBand, satelliteSector, availableSectors]);

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

  // Timeline playback
  useEffect(() => {
    if (!isPlaying) return;

    // Use appropriate frames based on active layer
    const activeFrames = activeLayer === 'satellite' ? satelliteFrames : frames;
    const setIndex = activeLayer === 'satellite' ? setSatelliteFrameIndex : setCurrentFrameIndex;

    if (activeFrames.length === 0) return;

    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % activeFrames.length);
    }, activeLayer === 'satellite' ? 100 : 500); // 100ms per frame for smooth 12-hour satellite animation

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, satelliteFrames.length, activeLayer]);

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
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
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
          <div className="absolute inset-0 z-10 bg-black">
            {satelliteLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/60 text-sm">Loading satellite imagery...</div>
              </div>
            ) : satelliteFrames.length > 0 ? (
              <img
                src={satelliteFrames[satelliteFrameIndex]?.url}
                alt="GOES Satellite"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/60 text-sm">Satellite imagery unavailable</div>
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


        {activeLayer === 'satellite' && satelliteFrames.length > 0 && (
          <div className="absolute bottom-24 left-4 z-[60]">
            <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <div className="text-[10px] text-white/60 mb-1.5 font-medium">GOES Satellite</div>
              <div className="text-sm font-semibold text-white">
                {getGOESConfig(lon, lat).satellite.replace('GOES', 'GOES-')}
              </div>
              <div className="text-[10px] text-white/50">
                {availableSectors.find(s => s.id === satelliteSector)?.label || satelliteSector} • {satelliteBand}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Scrubber */}
        {(() => {
          // Dynamic frame selection based on layer
          const isSatellite = activeLayer === 'satellite';
          const activeFrames = isSatellite ? satelliteFrames : frames;
          const activeIndex = isSatellite ? satelliteFrameIndex : currentFrameIndex;
          const setActiveIndex = isSatellite ? setSatelliteFrameIndex : setCurrentFrameIndex;
          const activeFrame = activeFrames[activeIndex];

          return (
            <div className="absolute bottom-0 left-0 right-0 z-[60] px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent">
              {/* Frame indicator */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  disabled={activeFrames.length === 0}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white" />
                  )}
                </button>
                <span className="text-sm text-white/80">
                  {activeFrame ? formatFrameTime(activeFrame) : '--:--'}
                </span>
                {!isSatellite && currentFrame?.type === 'nowcast' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs">
                    Forecast
                  </span>
                )}
                {isSatellite && satelliteFrames.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs">
                    GOES
                  </span>
                )}
              </div>

              {/* Scrubber track */}
              <div className="relative h-1.5 bg-white/20 rounded-full">
                {/* Now indicator (precipitation only) */}
                {!isSatellite && nowIndex > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60"
                    style={{ left: `${(nowIndex / (frames.length - 1)) * 100}%` }}
                  />
                )}

                {/* Progress fill */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-white/50"
                  style={{ width: `${activeFrames.length > 1 ? (activeIndex / (activeFrames.length - 1)) * 100 : 0}%` }}
                />

                {/* Draggable thumb */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, activeFrames.length - 1)}
                  value={activeIndex}
                  onChange={(e) => {
                    setActiveIndex(parseInt(e.target.value, 10));
                    setIsPlaying(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={activeFrames.length === 0}
                />

                {/* Visual thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg pointer-events-none"
                  style={{ left: `${activeFrames.length > 1 ? (activeIndex / (activeFrames.length - 1)) * 100 : 0}%` }}
                />
              </div>

              {/* Time labels */}
              <div className="flex justify-between mt-2 text-[10px] text-white/50">
                <span>{isSatellite ? '-12h' : '-2h'}</span>
                <span>Now</span>
                {!isSatellite && <span>+30m</span>}
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
