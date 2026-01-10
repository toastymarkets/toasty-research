import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Cloud, Satellite, Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  getGOESConfig,
  getAvailableSectors,
  generateFrameUrl,
  preloadImage,
} from '../../utils/satellite';

/**
 * WeatherMap - Cinematic satellite imagery widget with inline expansion
 * Aerospace operations center aesthetic
 */
export default function WeatherMap({
  lat,
  lon,
  zoom = 8,
  loading = false,
  className = '',
  isExpanded = false,
  onToggleExpand,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [L, setL] = useState(null);
  const [activeTab, setActiveTab] = useState('satellite');

  // Satellite state
  const [satelliteImage, setSatelliteImage] = useState(null);
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [satelliteBand, setSatelliteBand] = useState('AirMass');
  const [satelliteSector, setSatelliteSector] = useState(() => getGOESConfig(lon, lat).sector);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const loadingRef = useRef(false);

  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  // Reset sector when city changes
  useEffect(() => {
    setSatelliteSector(getGOESConfig(lon, lat).sector);
  }, [lon, lat]);

  const SATELLITE_BANDS = [
    { id: 'AirMass', label: 'Air Mass', short: 'AIR' },
    { id: 'GEOCOLOR', label: 'GeoColor', short: 'GEO' },
    { id: 'Sandwich', label: 'Sandwich', short: 'SND' },
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

  // Invalidate map size when container/expansion changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
  }, [isExpanded]);

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
    if (loadingRef.current) return;

    const sectorConfig = availableSectors.find(s => s.id === satelliteSector);
    const satellite = sectorConfig?.satellite || getGOESConfig(lon, lat).satellite;
    const imageSize = sectorConfig?.size || '1200x1200';

    loadingRef.current = true;

    const loadSatellite = async () => {
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

      setSatelliteImage(firstValidUrl);
      setSatelliteReady(true);

      // Load more frames for expanded view
      const frameCount = isExpanded ? 24 : 12;
      const urls = [];
      for (let i = 0; i < frameCount; i++) {
        urls.push(generateFrameUrl(satellite, satelliteSector, satelliteBand, imageSize, i * 10));
      }

      const results = await Promise.all(urls.map(preloadImage));
      const validUrls = results.filter(Boolean);

      if (validUrls.length > 0) {
        framesRef.current = validUrls.reverse();
        frameIndexRef.current = 0;
        setCurrentFrame(0);
      }

      loadingRef.current = false;
    };

    loadSatellite();
  }, [activeTab, lat, lon, satelliteBand, satelliteSector, availableSectors, isExpanded]);

  // Animate satellite frames
  useEffect(() => {
    if (activeTab !== 'satellite' || !satelliteReady || !isPlaying) return;

    const animate = () => {
      if (framesRef.current.length > 1) {
        frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
        setSatelliteImage(framesRef.current[frameIndexRef.current]);
        setCurrentFrame(frameIndexRef.current);
      }
    };

    const interval = setInterval(animate, isExpanded ? 200 : 150);
    return () => clearInterval(interval);
  }, [activeTab, satelliteReady, isPlaying, isExpanded]);

  // Reset loading state when city or settings change
  useEffect(() => {
    loadingRef.current = false;
    framesRef.current = [];
    frameIndexRef.current = 0;
    setCurrentFrame(0);
  }, [lat, lon, satelliteBand, satelliteSector]);

  // Update map center when lat/lon changes
  useEffect(() => {
    if (mapInstanceRef.current && lat && lon) {
      mapInstanceRef.current.setView([lat, lon], zoom);
    }
  }, [lat, lon, zoom]);

  // Playback controls
  const handlePrevFrame = useCallback(() => {
    if (framesRef.current.length > 1) {
      setIsPlaying(false);
      frameIndexRef.current = (frameIndexRef.current - 1 + framesRef.current.length) % framesRef.current.length;
      setSatelliteImage(framesRef.current[frameIndexRef.current]);
      setCurrentFrame(frameIndexRef.current);
    }
  }, []);

  const handleNextFrame = useCallback(() => {
    if (framesRef.current.length > 1) {
      setIsPlaying(false);
      frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
      setSatelliteImage(framesRef.current[frameIndexRef.current]);
      setCurrentFrame(frameIndexRef.current);
    }
  }, []);

  const handleSeek = useCallback((index) => {
    if (framesRef.current.length > 0 && index >= 0 && index < framesRef.current.length) {
      frameIndexRef.current = index;
      setSatelliteImage(framesRef.current[index]);
      setCurrentFrame(index);
    }
  }, []);

  const currentSectorConfig = availableSectors.find(s => s.id === satelliteSector);
  const currentBandConfig = SATELLITE_BANDS.find(b => b.id === satelliteBand);
  const satelliteName = (currentSectorConfig?.satellite || 'GOES18').replace('GOES', 'GOES-');
  const totalFrames = framesRef.current.length;

  if (loading) {
    return (
      <div className={`glass rounded-2xl overflow-hidden h-full ${className}`}>
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="w-full h-full bg-white/10" />
        </div>
      </div>
    );
  }

  // Expanded view - full mission control interface
  if (isExpanded) {
    return (
      <div className={`relative rounded-2xl overflow-hidden h-full bg-black ${className}`} style={{ minHeight: '320px' }}>
        {/* Scan line overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />

        {/* Main content grid */}
        <div className="absolute inset-0 flex">
          {/* Left: Main imagery */}
          <div className="flex-1 relative">
            {/* Satellite imagery */}
            {activeTab === 'satellite' && (
              <>
                {satelliteImage ? (
                  <img
                    src={satelliteImage}
                    alt="GOES Satellite"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center">
                      <Satellite className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <div className="text-white/40 text-sm font-mono">
                        {satelliteReady === false ? 'SIGNAL UNAVAILABLE' : 'ACQUIRING SIGNAL...'}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Precipitation map */}
            {activeTab === 'precipitation' && (
              <div ref={mapRef} className="absolute inset-0 bg-gray-900" />
            )}

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
              }}
            />

            {/* Top left: Mode + satellite info */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('satellite')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                    activeTab === 'satellite'
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Satellite className="w-3.5 h-3.5" />
                  SATELLITE
                </button>
                <button
                  onClick={() => setActiveTab('precipitation')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
                    activeTab === 'precipitation'
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  RADAR
                </button>
              </div>

              {activeTab === 'satellite' && satelliteReady && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400 tracking-wider">LIVE</span>
                </div>
              )}
            </div>

            {/* Top right: Collapse button */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={onToggleExpand}
                className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all"
                title="Collapse"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom: Timeline and controls */}
            {activeTab === 'satellite' && (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-8 pb-3 px-4">
                {/* Timeline scrubber */}
                <div className="mb-3">
                  <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full transition-all duration-100"
                      style={{ width: totalFrames > 0 ? `${((currentFrame + 1) / totalFrames) * 100}%` : '0%' }}
                    />
                    {/* Clickable timeline */}
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, totalFrames - 1)}
                      value={currentFrame}
                      onChange={(e) => handleSeek(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                  {/* Left: Satellite info */}
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs font-mono text-white/90 tracking-wide">
                        {satelliteName} • {currentSectorConfig?.label || satelliteSector}
                      </div>
                      <div className="text-[10px] font-mono text-white/50 tracking-wider">
                        {currentBandConfig?.label || satelliteBand} COMPOSITE
                      </div>
                    </div>
                  </div>

                  {/* Center: Playback controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevFrame}
                      className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-3 rounded-full bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40 transition-all border border-cyan-500/50"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button
                      onClick={handleNextFrame}
                      className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <div className="ml-2 text-xs font-mono text-white/50">
                      {currentFrame + 1} / {totalFrames}
                    </div>
                  </div>

                  {/* Right: Band selectors */}
                  <div className="flex items-center gap-1">
                    {SATELLITE_BANDS.map(({ id, short, label }) => (
                      <button
                        key={id}
                        onClick={() => setSatelliteBand(id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all ${
                          satelliteBand === id
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                            : 'text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10'
                        }`}
                        title={label}
                      >
                        {short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Precipitation legend */}
            {activeTab === 'precipitation' && (
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70">PRECIPITATION INTENSITY</span>
                  <div className="w-32 h-2 rounded-full" style={{
                    background: 'linear-gradient(90deg, #22c55e, #eab308, #ef4444, #ec4899)'
                  }} />
                  <span className="text-[10px] font-mono text-white/50">Light → Heavy</span>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Region selector (satellite only) */}
          {activeTab === 'satellite' && (
            <div className="w-36 bg-black/40 backdrop-blur-sm border-l border-white/10 p-3 flex flex-col gap-4">
              <div>
                <div className="text-[10px] font-mono text-white/40 tracking-wider mb-2">REGION</div>
                <div className="flex flex-col gap-1">
                  {availableSectors.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSatelliteSector(id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        satelliteSector === id
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-white/40 tracking-wider mb-2">IMAGERY</div>
                <div className="flex flex-col gap-1">
                  {SATELLITE_BANDS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSatelliteBand(id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        satelliteBand === id
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-white/10">
                <div className="text-[10px] font-mono text-white/30 tracking-wider">SHORTCUTS</div>
                <div className="mt-2 space-y-1 text-[10px] font-mono text-white/40">
                  <div className="flex justify-between">
                    <span>Play/Pause</span>
                    <span className="text-white/60">Space</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prev/Next</span>
                    <span className="text-white/60">← →</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Collapsed view - compact cinematic
  return (
    <div
      className={`relative rounded-2xl overflow-hidden h-full cursor-pointer group ${className}`}
      onClick={onToggleExpand}
      style={{ minHeight: '140px' }}
    >
      {/* Main imagery container */}
      <div className="absolute inset-0 bg-black">
        {/* Precipitation Map */}
        {activeTab === 'precipitation' && (
          <div ref={mapRef} className="absolute inset-0 bg-gray-900" />
        )}

        {/* Satellite View */}
        {activeTab === 'satellite' && (
          <>
            {satelliteImage ? (
              <img
                src={satelliteImage}
                alt="GOES Satellite"
                className="w-full h-full object-cover transition-opacity duration-100"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                  <Satellite className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <div className="text-white/40 text-xs font-mono">
                    {satelliteReady === false ? 'SIGNAL UNAVAILABLE' : 'ACQUIRING...'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scan line overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />

        {/* Vignette effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2">
        {/* Mode tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('satellite'); }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium tracking-wide transition-all ${
              activeTab === 'satellite'
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Satellite className="w-3 h-3" />
            SAT
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('precipitation'); }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium tracking-wide transition-all ${
              activeTab === 'precipitation'
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Cloud className="w-3 h-3" />
            RAD
          </button>
        </div>

        {/* LIVE indicator + expand */}
        <div className="flex items-center gap-2">
          {activeTab === 'satellite' && satelliteReady && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider">LIVE</span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="p-1.5 rounded bg-black/40 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/60 transition-all"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom data bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-end justify-between p-2">
          {/* Left: Satellite info */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/90 tracking-wide">
                {satelliteName}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-[11px] font-mono text-white/70">
                {currentSectorConfig?.label || satelliteSector}
              </span>
            </div>
            {activeTab === 'satellite' && (
              <div className="text-[9px] font-mono text-white/40 tracking-wider">
                {currentBandConfig?.label || satelliteBand} COMPOSITE
              </div>
            )}
          </div>

          {/* Right: Band selectors */}
          {activeTab === 'satellite' && (
            <div className="flex items-center gap-1">
              {SATELLITE_BANDS.map(({ id, short }) => (
                <button
                  key={id}
                  onClick={(e) => { e.stopPropagation(); setSatelliteBand(id); }}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider transition-all ${
                    satelliteBand === id
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  {short}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'precipitation' && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full" style={{
                background: 'linear-gradient(90deg, #22c55e, #eab308, #ef4444, #ec4899)'
              }} />
              <span className="text-[9px] font-mono text-white/50">PRECIP</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
    </div>
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
