import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
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

  const handleMarkerClick = (citySlug) => navigate(`/city/${citySlug}`);

  return (
    <section className="mb-12">
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
                      border border-[var(--color-border)] shadow-lg markets-map-container">
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
      </div>
    </section>
  );
}
