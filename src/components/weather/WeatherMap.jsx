import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Map, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import GlassWidget from './GlassWidget';
import MapWidgetPopup from './MapWidgetPopup';

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
  cityName = '',
  currentTemp = null,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [L, setL] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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

    // Fix map size after initialization (Leaflet needs this for proper tile loading)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Also invalidate on window resize
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L, lat, lon, zoom]);

  // Invalidate map size when container might have changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [L]);

  // Add precipitation radar overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;

    // Fetch latest radar timestamp from RainViewer
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        // Use the most recent past radar frame (actual data, not forecast)
        const pastFrames = data.radar?.past || [];
        const latestRadar = pastFrames[pastFrames.length - 1]?.path;
        if (latestRadar) {
          // Remove existing overlay layers first
          map.eachLayer((layer) => {
            if (layer.options?.isWeatherOverlay) {
              map.removeLayer(layer);
            }
          });

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
  }, [L]);

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

  return (
    <>
      <GlassWidget title="PRECIPITATION" icon={Map} size="large" className={`h-full ${className}`}>
        <div className="relative flex-1 -mx-2 -mb-2 rounded-b-xl overflow-hidden">
          {/* Map container */}
          <div
            ref={mapRef}
            className="absolute inset-0 bg-gray-900 cursor-pointer"
            onClick={() => setIsPopupOpen(true)}
          />

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
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000, #ff00ff)' }} />
              <span className="text-[10px] text-white/70">Light → Heavy</span>
            </div>
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
