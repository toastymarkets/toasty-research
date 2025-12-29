import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Map, Layers, Cloud, Thermometer, Wind } from 'lucide-react';
import GlassWidget from './GlassWidget';

/**
 * WeatherMap - Interactive precipitation/weather map widget
 * Uses Leaflet with weather overlays
 */
export default function WeatherMap({
  lat,
  lon,
  zoom = 8,
  loading = false,
  className = '',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('precipitation');
  const [L, setL] = useState(null);

  // Dynamically import Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark/satellite base layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L, lat, lon, zoom]);

  // Update weather overlay based on active layer
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;

    // Remove existing overlay layers
    map.eachLayer((layer) => {
      if (layer.options?.isWeatherOverlay) {
        map.removeLayer(layer);
      }
    });

    // Add appropriate weather layer
    let overlayUrl = '';
    switch (activeLayer) {
      case 'precipitation':
        // RainViewer precipitation radar
        overlayUrl = `https://tilecache.rainviewer.com/v2/radar/nowcast/{z}/{x}/{y}/2/1_1.png`;
        break;
      case 'temperature':
        // OpenWeatherMap temperature layer
        overlayUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`;
        break;
      case 'wind':
        // OpenWeatherMap wind layer
        overlayUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`;
        break;
      default:
        return;
    }

    // Only add RainViewer for now (no API key needed)
    if (activeLayer === 'precipitation') {
      // Fetch latest radar timestamp from RainViewer
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
          const latestRadar = data.radar?.nowcast?.[0]?.path;
          if (latestRadar) {
            const radarLayer = L.tileLayer(
              `https://tilecache.rainviewer.com${latestRadar}/256/{z}/{x}/{y}/2/1_1.png`,
              {
                opacity: 0.6,
                isWeatherOverlay: true,
              }
            );
            radarLayer.addTo(map);
          }
        })
        .catch(console.error);
    }
  }, [activeLayer, L]);

  // Update center when lat/lon changes
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

  const layers = [
    { id: 'precipitation', icon: Cloud, label: 'Rain' },
    { id: 'temperature', icon: Thermometer, label: 'Temp' },
    { id: 'wind', icon: Wind, label: 'Wind' },
  ];

  return (
    <GlassWidget title="WEATHER MAP" icon={Map} size="large" className={`h-full ${className}`}>
      <div className="relative flex-1 -mx-2 -mb-2 rounded-b-xl overflow-hidden">
        {/* Map container */}
        <div
          ref={mapRef}
          className="absolute inset-0 bg-gray-900"
        />

        {/* Layer toggle buttons */}
        <div className="absolute top-3 left-3 z-[1000] flex gap-1">
          {layers.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveLayer(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all backdrop-blur-sm
                ${activeLayer === id
                  ? 'bg-white/25 text-white'
                  : 'bg-black/30 text-white/70 hover:bg-black/40 hover:text-white'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        {activeLayer === 'precipitation' && (
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000, #ff00ff)' }} />
              <span className="text-[10px] text-white/70">Light → Heavy</span>
            </div>
          </div>
        )}
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
};
