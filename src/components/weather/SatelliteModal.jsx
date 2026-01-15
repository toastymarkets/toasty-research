import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, Info } from 'lucide-react';
import {
  getGOESConfig,
  getAvailableSectors,
  generateFrameUrl,
  preloadImage,
} from '../../utils/satellite';

/**
 * SatelliteModal - Full-screen satellite imagery viewer
 *
 * Design: Mission Control / Weather Operations Center aesthetic
 * - Dark backdrop with subtle scan line texture
 * - Monospace data readouts
 * - Professional-grade controls
 */
export default function SatelliteModal({
  isOpen,
  onClose,
  lat,
  lon,
  initialBand = 'AirMass',
  initialSector,
}) {
  // Animation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [frames, setFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Settings state
  const [band, setBand] = useState(initialBand);
  const [sector, setSector] = useState(initialSector || getGOESConfig(lon, lat).sector);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTime = useRef(0);

  const availableSectors = useMemo(() => getAvailableSectors(lon, lat), [lon, lat]);

  const BANDS = [
    { id: 'AirMass', label: 'Air Mass', description: 'Shows air mass boundaries and jet streams' },
    { id: 'GEOCOLOR', label: 'GeoColor', description: 'True color during day, infrared at night' },
    { id: 'Sandwich', label: 'Sandwich', description: 'Combines visible and infrared imagery' },
  ];

  // Load satellite frames
  useEffect(() => {
    if (!isOpen) return;

    const loadFrames = async () => {
      setIsLoading(true);
      setLoadProgress(0);
      setFrames([]);

      const sectorConfig = availableSectors.find(s => s.id === sector);
      const satellite = sectorConfig?.satellite || getGOESConfig(lon, lat).satellite;
      const imageSize = '1200x1200';

      // Load 24 frames (4 hours of data, 10 min intervals)
      const frameCount = 24;
      const urls = [];

      for (let i = 0; i < frameCount; i++) {
        urls.push(generateFrameUrl(satellite, sector, band, imageSize, i * 10));
      }

      const loadedFrames = [];
      let loaded = 0;

      // Load frames with progress tracking
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await preloadImage(url);
          loaded++;
          setLoadProgress(Math.round((loaded / frameCount) * 100));
          return result;
        })
      );

      // Filter valid frames and reverse for chronological order
      const validFrames = results.filter(Boolean).reverse();

      setFrames(validFrames);
      setCurrentFrameIndex(validFrames.length - 1); // Start at most recent
      setIsLoading(false);
    };

    loadFrames();
  }, [isOpen, band, sector, lat, lon, availableSectors]);

  // Animation loop
  useEffect(() => {
    if (!isOpen || !isPlaying || frames.length <= 1) return;

    const animate = (timestamp) => {
      if (timestamp - lastFrameTime.current >= 150) { // ~6.6 fps
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
        lastFrameTime.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, isPlaying, frames.length]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'ArrowLeft':
          setIsPlaying(false);
          setCurrentFrameIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setIsPlaying(false);
          setCurrentFrameIndex(prev => Math.min(frames.length - 1, prev + 1));
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, frames.length, onClose]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Get frame timestamp from URL (approximate)
  const getFrameTimestamp = useCallback((index) => {
    if (frames.length === 0) return '--:--';
    const minutesAgo = (frames.length - 1 - index) * 10;
    const time = new Date(Date.now() - minutesAgo * 60 * 1000);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [frames.length]);

  if (!isOpen) return null;

  const currentSectorConfig = availableSectors.find(s => s.id === sector);
  const satelliteName = currentSectorConfig?.satellite?.replace('GOES', 'GOES-') || 'GOES-19';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop with scan line effect */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm">
        {/* Scan line overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
      </div>

      {/* Main container */}
      <div className="relative w-full h-full max-w-[1600px] max-h-[900px] m-4 flex flex-col">

        {/* Header - Mission Control style */}
        <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-900/90 to-transparent">
          {/* Left: Title and satellite info */}
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SATELLITE IMAGERY
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-wider mt-0.5">
                {satelliteName} • {currentSectorConfig?.label || sector}
              </p>
            </div>

            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Status</span>
              <span className="text-xs text-emerald-400 font-mono">LIVE</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg transition-all ${
                showInfo
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Show info"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
          {/* Satellite image */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-black glass-border-premium">
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <div className="relative w-24 h-24">
                  {/* Orbital loading animation */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin"
                    style={{ animationDuration: '1.5s' }}
                  />
                  <div className="absolute inset-4 rounded-full border border-white/20" />
                  <div
                    className="absolute inset-4 rounded-full border border-transparent border-t-cyan-400/50 animate-spin"
                    style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                  />
                </div>
                <p className="mt-4 text-sm text-white/50 font-mono">
                  Loading frames... {loadProgress}%
                </p>
                {/* Progress bar */}
                <div className="mt-2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Satellite image */}
            {frames.length > 0 && (
              <img
                src={frames[currentFrameIndex]}
                alt="GOES Satellite Imagery"
                className="w-full h-full object-contain"
              />
            )}

            {/* Corner data overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/10">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Band</span>
                <p className="text-sm text-white font-medium">{BANDS.find(b => b.id === band)?.label}</p>
              </div>
            </div>

            <div className="absolute top-3 right-3">
              <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-right">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Frame Time</span>
                <p className="text-sm text-cyan-400 font-mono">{getFrameTimestamp(currentFrameIndex)}</p>
              </div>
            </div>

            {/* Info panel overlay */}
            {showInfo && (
              <div className="absolute bottom-16 left-3 right-3 p-4 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2">
                  {BANDS.find(b => b.id === band)?.label}
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  {BANDS.find(b => b.id === band)?.description}
                </p>
                <p className="text-[10px] text-white/40 mt-3">
                  Showing {frames.length} frames • 10-minute intervals • {Math.round(frames.length * 10 / 60)} hours of data
                </p>
              </div>
            )}

            {/* Timeline scrubber */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              {/* Timeline track */}
              <div className="relative h-8 mb-2">
                {/* Track background */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/10 rounded-full" />

                {/* Progress */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-150"
                  style={{ width: `${(currentFrameIndex / Math.max(1, frames.length - 1)) * 100}%` }}
                />

                {/* Playhead */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-150 cursor-pointer"
                  style={{ left: `calc(${(currentFrameIndex / Math.max(1, frames.length - 1)) * 100}% - 6px)` }}
                />

                {/* Clickable track */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, frames.length - 1)}
                  value={currentFrameIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(parseInt(e.target.value));
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Time display */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-mono">
                    {getFrameTimestamp(0)}
                  </span>
                  <span className="text-xs text-white/20">→</span>
                  <span className="text-xs text-white/40 font-mono">
                    {getFrameTimestamp(frames.length - 1)}
                  </span>
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIndex(0);
                    }}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Go to start"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIndex(frames.length - 1);
                    }}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    title="Go to end"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Frame counter */}
                <div className="text-xs text-white/40 font-mono">
                  {currentFrameIndex + 1} / {frames.length}
                </div>
              </div>
            </div>
          </div>

          {/* Side panel - Controls */}
          <aside className="w-64 flex-shrink-0 flex flex-col gap-4">
            {/* Sector selector */}
            <div className="p-4 rounded-xl bg-white/5 glass-border-premium">
              <h3 className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Region</h3>
              <div className="space-y-1">
                {availableSectors.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSector(id)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all ${
                      sector === id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Band selector */}
            <div className="p-4 rounded-xl bg-white/5 glass-border-premium">
              <h3 className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Imagery Type</h3>
              <div className="space-y-1">
                {BANDS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setBand(id)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all ${
                      band === id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-auto">
              <h3 className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Shortcuts</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Play/Pause</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Prev Frame</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">←</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Next Frame</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">→</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Fullscreen</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Close</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

SatelliteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  initialBand: PropTypes.string,
  initialSector: PropTypes.string,
};
