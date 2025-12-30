import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Cloud, Thermometer, Wind, Play, Pause } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * MapWidgetPopup - Apple Weather inspired expandable map modal
 * Features: Precipitation, Temperature, Wind layers with timeline playback
 */
export default function MapWidgetPopup({
  isOpen,
  onClose,
  lat,
  lon,
  cityName,
  currentTemp,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [L, setL] = useState(null);
  const [activeLayer, setActiveLayer] = useState('precipitation');
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [windData, setWindData] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);

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

  // Fetch wind data from Open-Meteo
  useEffect(() => {
    if (!isOpen || !lat || !lon) return;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph&timezone=auto&forecast_days=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.hourly) {
          const currentHour = new Date().getHours();
          setWindData({
            speed: data.hourly.wind_speed_10m[currentHour] || 0,
            direction: data.hourly.wind_direction_10m[currentHour] || 0,
            hourly: data.hourly,
          });
        }
      })
      .catch(console.error);
  }, [isOpen, lat, lon]);

  // Fetch temperature data from Open-Meteo
  useEffect(() => {
    if (!isOpen || !lat || !lon) return;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.hourly) {
          const currentHour = new Date().getHours();
          setTemperatureData({
            current: data.hourly.temperature_2m[currentHour] || currentTemp,
            hourly: data.hourly,
          });
        }
      })
      .catch(console.error);
  }, [isOpen, lat, lon, currentTemp]);

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

  // Wind particle animation
  useEffect(() => {
    if (activeLayer !== 'wind' || !canvasRef.current || !windData) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Wind vector components (convert direction to radians)
    const windRad = (windData.direction * Math.PI) / 180;
    const windU = Math.sin(windRad) * windData.speed * 0.3;
    const windV = -Math.cos(windRad) * windData.speed * 0.3;

    // Particles
    const particles = [];
    const particleCount = 400;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.age = 0;
        this.maxAge = 80 + Math.random() * 60;
      }

      update() {
        this.x += windU;
        this.y += windV;
        this.age++;

        if (
          this.age > this.maxAge ||
          this.x < 0 || this.x > canvas.width ||
          this.y < 0 || this.y > canvas.height
        ) {
          this.reset();
        }
      }

      draw() {
        const alpha = Math.max(0, 1 - this.age / this.maxAge) * 0.6;
        ctx.fillStyle = `rgba(100, 210, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeLayer, windData]);

  // Timeline playback
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length);
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

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
    { id: 'precipitation', icon: Cloud, label: 'Precipitation' },
    { id: 'temperature', icon: Thermometer, label: 'Temperature' },
    { id: 'wind', icon: Wind, label: 'Wind' },
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
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
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
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20">
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
          </div>

        {/* Map Container */}
        <div ref={mapRef} className="absolute inset-0 bg-gray-900" />

        {/* Wind Canvas Overlay */}
        {activeLayer === 'wind' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-10"
          />
        )}

        {/* Temperature Overlay */}
        {activeLayer === 'temperature' && temperatureData && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="glass-elevated px-8 py-6 rounded-2xl text-center">
              <div className="text-6xl font-thin text-white mb-2">
                {Math.round(temperatureData.current)}°
              </div>
              <div className="text-white/60 text-sm">{cityName}</div>
            </div>
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
          <div className="absolute bottom-24 left-4 z-20">
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

        {activeLayer === 'temperature' && (
          <div className="absolute bottom-24 left-4 z-20">
            <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <div className="text-[10px] text-white/60 mb-1.5 font-medium">Temperature</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-24 h-2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #10B981, #FBBF24, #F97316, #EF4444)' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/50 mt-1">
                <span>Cold</span>
                <span>Hot</span>
              </div>
            </div>
          </div>
        )}

        {activeLayer === 'wind' && windData && (
          <div className="absolute bottom-24 left-4 z-20">
            <div className="px-3 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <div className="text-[10px] text-white/60 mb-1.5 font-medium">Wind Speed</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(windData.speed)} mph
              </div>
              <div className="text-[10px] text-white/50">
                from {getWindDirection(windData.direction)}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Scrubber */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-8 bg-gradient-to-t from-black/70 to-transparent">
          {/* Frame indicator */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <span className="text-sm text-white/80">
              {currentFrame ? formatFrameTime(currentFrame) : '--:--'}
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
        </div>
      </div>
    </div>
  );
}

// Helper function for wind direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

MapWidgetPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  cityName: PropTypes.string,
  currentTemp: PropTypes.number,
};
