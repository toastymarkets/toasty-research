import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, CloudRain } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARKET_CITIES } from '../../config/cities';

const FitBoundsToMarkets = () => {
  const map = useMap();

  useEffect(() => {
    if (MARKET_CITIES.length > 0) {
      const bounds = L.latLngBounds(
        MARKET_CITIES.map(city => [city.lat, city.lon])
      );
      const padding = window.innerWidth < 768 ? [20, 20] : [50, 50];
      map.fitBounds(bounds, { padding, maxZoom: 6 });
    }
  }, [map]);

  return null;
};

// Weather Radar Component using RainViewer API
const WeatherRadar = ({ isVisible, currentFrame, opacity = 0.6 }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !currentFrame) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Add new radar layer
    const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${currentFrame}/256/{z}/{x}/{y}/2/1_1.png`;
    layerRef.current = L.tileLayer(radarUrl, {
      opacity: opacity,
      zIndex: 10,
      attribution: 'RainViewer'
    });
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, isVisible, currentFrame, opacity]);

  return null;
};

const createCityMarker = (isHovered = false) => {
  const size = isHovered ? 44 : 36;
  const isDark = document.documentElement.classList.contains('dark');
  const borderColor = isDark ? '#27272A' : 'white';

  const html = `
    <div style="
      width: ${size}px; height: ${size}px;
      background: var(--color-orange-main);
      border: 4px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(241, 143, 1, 0.4), 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    ">
      <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'city-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 8]
  });
};

export default function InteractiveMarketsMap() {
  const navigate = useNavigate();
  const [hoveredCity, setHoveredCity] = useState(null);
  const isMobile = window.innerWidth < 768;

  // OpenWeatherMap API key (set this to enable cloud and temperature layers)
  // Get a free API key at: https://openweathermap.org/api
  const OWM_API_KEY = ''; // TODO: Add your API key here

  // Weather layer state
  const [radarVisible, setRadarVisible] = useState(false);
  const [currentRadarFrame, setCurrentRadarFrame] = useState(null);

  const handleMarkerClick = (citySlug) => navigate(`/city/${citySlug}`);

  // Fetch current radar frame from RainViewer API
  useEffect(() => {
    const fetchRadarFrame = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
          // Get the most recent frame
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          setCurrentRadarFrame(latestFrame.path);
        }
      } catch (error) {
        console.error('Failed to fetch radar data:', error);
      }
    };

    fetchRadarFrame();
    // Refresh radar data every 10 minutes
    const interval = setInterval(fetchRadarFrame, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleRadar = () => {
    setRadarVisible(!radarVisible);
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-heading font-semibold">Market Locations</h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Click any city to view its dashboard and market data
        </p>
      </div>

      <div className="h-[450px] md:h-[400px] sm:h-[350px] rounded-2xl overflow-hidden
                      border border-[var(--color-border)] shadow-lg markets-map-container relative">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={true}
          maxZoom={18}
          minZoom={3}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBoundsToMarkets />

          {/* Weather Layers */}
          <WeatherRadar
            isVisible={radarVisible}
            currentFrame={currentRadarFrame}
          />

          {MARKET_CITIES.map(city => (
            <Marker
              key={city.id}
              position={[city.lat, city.lon]}
              icon={createCityMarker(hoveredCity === city.id)}
              eventHandlers={{
                click: () => handleMarkerClick(city.slug),
                mouseover: () => !isMobile && setHoveredCity(city.id),
                mouseout: () => !isMobile && setHoveredCity(null)
              }}
            >
              <Popup closeButton={false}>
                <div className="min-w-[180px] p-2">
                  <h3 className="font-heading font-semibold text-base mb-1">
                    {city.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    Click to view dashboard
                  </p>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Station: {city.stationId}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Weather Layer Controls */}
        <div className="absolute top-3 right-3 z-[1000]">
          {/* Precipitation Radar Toggle */}
          <button
            onClick={toggleRadar}
            className={`p-2.5 rounded-lg shadow-lg transition-all ${
              radarVisible
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white dark:bg-[var(--color-card-bg)] text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-[var(--color-card-elevated)]'
            } border border-[var(--color-border)]`}
            title={radarVisible ? 'Hide precipitation radar' : 'Show precipitation radar'}
          >
            <CloudRain size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
