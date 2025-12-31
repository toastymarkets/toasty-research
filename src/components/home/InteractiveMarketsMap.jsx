import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, CloudRain, Cloud, CloudSnow, Sun, Satellite } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARKET_CITIES } from '../../config/cities';

const SATELLITE_PRODUCTS = {
  airmass: {
    name: 'Air Mass',
    url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-AirMass-625x375.gif',
  },
  geocolor: {
    name: 'GeoColor',
    url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-GEOCOLOR-625x375.gif',
  },
  infrared: {
    name: 'Infrared',
    url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-13-625x375.gif',
  },
};

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
  const size = isHovered ? 16 : 12;
  const glowIntensity = isHovered ? 1 : 0.5;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: #F18F01;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow:
        0 0 0 1px rgba(241, 143, 1, 0.2),
        0 0 ${isHovered ? 20 : 8}px ${isHovered ? 6 : 2}px rgba(241, 143, 1, ${glowIntensity}),
        0 0 ${isHovered ? 30 : 12}px ${isHovered ? 8 : 3}px rgba(241, 143, 1, ${glowIntensity * 0.6});
      cursor: pointer;
      transition: all 0.3s ease;
    "></div>
  `;

  return L.divIcon({
    html,
    className: 'city-marker-icon',
    iconSize: [size + 40, size + 40],
    iconAnchor: [(size + 40) / 2, (size + 40) / 2],
    tooltipAnchor: [0, 0]
  });
};

// Helper to get weather icon based on description
const getWeatherIcon = (description) => {
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
    return CloudRain;
  }
  if (desc.includes('snow') || desc.includes('flurr')) {
    return CloudSnow;
  }
  if (desc.includes('cloud') || desc.includes('overcast')) {
    return Cloud;
  }
  return Sun; // Default to sun for clear/fair/etc
};

export default function InteractiveMarketsMap() {
  const navigate = useNavigate();
  const [hoveredCity, setHoveredCity] = useState(null);
  const [cityWeather, setCityWeather] = useState({});
  const [weatherLoading, setWeatherLoading] = useState(true);
  const isMobile = window.innerWidth < 768;

  // View mode state
  const [viewMode, setViewMode] = useState('markets'); // 'markets' or 'satellite'

  // Weather layer state
  const [radarVisible, setRadarVisible] = useState(false);
  const [currentRadarFrame, setCurrentRadarFrame] = useState(null);

  // Satellite state
  const [satelliteProduct, setSatelliteProduct] = useState('airmass');

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

  // Fetch weather data for all cities
  useEffect(() => {
    const fetchCityWeather = async (city) => {
      try {
        // Fetch latest observation with 24-hour max
        const obsResponse = await fetch(
          `https://api.weather.gov/stations/${city.stationId}/observations/latest`,
          { headers: { 'User-Agent': 'Toasty Research App' } }
        );

        if (!obsResponse.ok) return null;
        const obsData = await obsResponse.json();
        const props = obsData.properties;

        // Get most recent temperature (in Celsius)
        const currentTemp = props?.temperature?.value;

        // Get weather description
        const weatherDescription = props?.textDescription || '';

        // Get 24-hour max or 6-hour max (both in Celsius)
        let highTempC = props?.maxTemperatureLast24Hours?.value;

        // Fallback to 6-hour max if 24-hour not available
        if (!highTempC) {
          highTempC = props?.maxTemperatureLast6Hours?.value;
        }

        // Convert high to Fahrenheit
        const highTemp = highTempC !== null && highTempC !== undefined
          ? (highTempC * 9/5) + 32
          : null;

        return { currentTemp, highTemp, weatherDescription };
      } catch (error) {
        console.error(`Failed to fetch weather for ${city.name}:`, error);
        return null;
      }
    };

    const fetchAllWeather = async () => {
      setWeatherLoading(true);
      const weatherData = {};
      await Promise.all(
        MARKET_CITIES.map(async (city) => {
          const weather = await fetchCityWeather(city);
          if (weather) {
            weatherData[city.slug] = weather;
          }
        })
      );
      setCityWeather(weatherData);
      setWeatherLoading(false);
    };

    fetchAllWeather();
    const interval = setInterval(fetchAllWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {viewMode === 'markets' ? (
              <MapPin className="w-5 h-5 text-orange-500" />
            ) : (
              <Satellite className="w-5 h-5 text-orange-500" />
            )}
            <h2 className="text-xl font-heading font-semibold">
              {viewMode === 'markets' ? 'Market Locations' : 'Satellite Imagery'}
            </h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('markets')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                viewMode === 'markets'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setViewMode('satellite')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                viewMode === 'satellite'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {viewMode === 'markets' ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Click any city to view its dashboard and market data
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {Object.entries(SATELLITE_PRODUCTS).map(([key, product]) => (
              <button
                key={key}
                onClick={() => setSatelliteProduct(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  satelliteProduct === key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-orange-500/50 hover:text-[var(--color-text-primary)]'
                }`}
              >
                {product.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area - Map or Satellite */}
      {viewMode === 'markets' ? (
        <div className="min-h-[300px] h-[min(60vh,450px)] md:h-[min(50vh,400px)] rounded-2xl overflow-hidden
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
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
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
                <Tooltip
                  direction="top"
                  offset={[0, -60]}
                  opacity={1}
                  className="map-tooltip-animated"
                  permanent={false}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {cityWeather[city.slug]?.weatherDescription && (() => {
                      const WeatherIcon = getWeatherIcon(cityWeather[city.slug].weatherDescription);
                      return <WeatherIcon className="w-6 h-6 flex-shrink-0" />;
                    })()}
                    <div className="text-center">
                      <div className="text-xs font-semibold mb-1">{city.id}</div>
                      {cityWeather[city.slug]?.currentTemp !== null && cityWeather[city.slug]?.currentTemp !== undefined ? (
                        <div className="text-xl font-bold text-orange-500">
                          {Math.round((cityWeather[city.slug].currentTemp * 9/5) + 32)}°
                        </div>
                      ) : weatherLoading ? (
                        <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
                      ) : (
                        <div className="text-xs text-gray-400">--</div>
                      )}
                    </div>
                  </div>
                </Tooltip>
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
      ) : (
        <div>
          {/* Satellite Image Loop */}
          <div className="rounded-2xl overflow-hidden bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-lg mb-3">
            <img
              src={SATELLITE_PRODUCTS[satelliteProduct].url}
              alt={`${SATELLITE_PRODUCTS[satelliteProduct].name} satellite imagery`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>

          {/* Footer */}
          <div className="text-xs text-[var(--color-text-muted)] text-center px-1">
            4-hour loop
          </div>
        </div>
      )}
    </>
  );
}
