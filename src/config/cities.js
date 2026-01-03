/**
 * City configuration for Toasty Research
 * Maps cities to their NWS station IDs and metadata
 */

// City images from Unsplash (free to use)
const CITY_IMAGES = {
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&h=200&fit=crop',
  'chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=200&h=200&fit=crop',
  'los-angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=200&h=200&fit=crop',
  'miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=200&h=200&fit=crop',
  'denver': 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=200&h=200&fit=crop',
  'austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=200&h=200&fit=crop',
  'philadelphia': 'https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=200&h=200&fit=crop',
  'houston': 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=200&h=200&fit=crop',
  'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=200&h=200&fit=crop',
  'san-francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200&h=200&fit=crop',
  'boston': 'https://images.unsplash.com/photo-1501979376754-1d09c43da9a3?w=200&h=200&fit=crop',
  'washington-dc': 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=200&h=200&fit=crop',
  'dallas': 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=200&h=200&fit=crop',
  'detroit': 'https://images.unsplash.com/photo-1564502929457-da8ad77dbe50?w=200&h=200&fit=crop',
  'salt-lake-city': 'https://images.unsplash.com/photo-1527549993586-dff825b37782?w=200&h=200&fit=crop',
  'new-orleans': 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=200&h=200&fit=crop',
};

export const CITIES = [
  { id: 'NYC', slug: 'new-york', name: 'New York', stationId: 'KNYC', lat: 40.78333, lon: -73.96667, timezone: 'America/New_York', forecastOffice: 'OKX', hasMarket: true },
  { id: 'CHI', slug: 'chicago', name: 'Chicago', stationId: 'KMDW', lat: 41.78417, lon: -87.75528, timezone: 'America/Chicago', forecastOffice: 'LOT', hasMarket: true },
  { id: 'LAX', slug: 'los-angeles', name: 'Los Angeles', stationId: 'KLAX', lat: 33.9425, lon: -118.40806, timezone: 'America/Los_Angeles', forecastOffice: 'LOX', hasMarket: true },
  { id: 'MIA', slug: 'miami', name: 'Miami', stationId: 'KMIA', lat: 25.79056, lon: -80.31639, timezone: 'America/New_York', forecastOffice: 'MFL', hasMarket: true },
  { id: 'DEN', slug: 'denver', name: 'Denver', stationId: 'KDEN', lat: 39.84722, lon: -104.65694, timezone: 'America/Denver', forecastOffice: 'BOU', hasMarket: true },
  { id: 'AUS', slug: 'austin', name: 'Austin', stationId: 'KAUS', lat: 30.18306, lon: -97.68, timezone: 'America/Chicago', forecastOffice: 'EWX', hasMarket: true },
  { id: 'PHI', slug: 'philadelphia', name: 'Philadelphia', stationId: 'KPHL', lat: 39.87222, lon: -75.23889, timezone: 'America/New_York', forecastOffice: 'PHI', hasMarket: true },
  { id: 'HOU', slug: 'houston', name: 'Houston', stationId: 'KHOU', lat: 29.64028, lon: -95.27889, timezone: 'America/Chicago', forecastOffice: 'HGX', hasMarket: false },
  { id: 'SEA', slug: 'seattle', name: 'Seattle', stationId: 'KSEA', lat: 47.46861, lon: -122.30889, timezone: 'America/Los_Angeles', forecastOffice: 'SEW', hasMarket: false },
  { id: 'SFO', slug: 'san-francisco', name: 'San Francisco', stationId: 'KSFO', lat: 37.61961, lon: -122.36558, timezone: 'America/Los_Angeles', forecastOffice: 'MTR', hasMarket: false },
  { id: 'BOS', slug: 'boston', name: 'Boston', stationId: 'KBOS', lat: 42.36056, lon: -71.00972, timezone: 'America/New_York', forecastOffice: 'BOX', hasMarket: false },
  { id: 'DC', slug: 'washington-dc', name: 'Washington DC', stationId: 'KDCA', lat: 38.85222, lon: -77.03417, timezone: 'America/New_York', forecastOffice: 'LWX', hasMarket: false },
  { id: 'DAL', slug: 'dallas', name: 'Dallas', stationId: 'KDFW', lat: 32.89833, lon: -97.01944, timezone: 'America/Chicago', forecastOffice: 'FWD', hasMarket: false },
  { id: 'DET', slug: 'detroit', name: 'Detroit', stationId: 'KDTW', lat: 42.21417, lon: -83.35333, timezone: 'America/New_York', forecastOffice: 'DTX', hasMarket: false },
  { id: 'SLC', slug: 'salt-lake-city', name: 'Salt Lake City', stationId: 'KSLC', lat: 40.77069, lon: -111.96503, timezone: 'America/Denver', forecastOffice: 'SLC', hasMarket: false },
  { id: 'MSY', slug: 'new-orleans', name: 'New Orleans', stationId: 'KMSY', lat: 29.99333, lon: -90.25806, timezone: 'America/Chicago', forecastOffice: 'LIX', hasMarket: false },
];

// Add image URLs to cities
CITIES.forEach(city => {
  city.image = CITY_IMAGES[city.slug];
});

// Filter for cities with active markets
export const MARKET_CITIES = CITIES.filter(c => c.hasMarket);

// Lookup maps for quick access
export const CITY_BY_SLUG = Object.fromEntries(CITIES.map(c => [c.slug, c]));
export const CITY_BY_ID = Object.fromEntries(CITIES.map(c => [c.id, c]));
export const CITY_STATION_IDS = Object.fromEntries(CITIES.map(c => [c.slug, c.stationId]));

// For compatibility with existing hooks that use CITY_STATIONS format
export const CITY_STATIONS = Object.fromEntries(
  CITIES.map(c => [c.slug, {
    stationId: c.stationId,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    timezone: c.timezone,
    forecastOffice: c.forecastOffice,
  }])
);

// Slug to city ID mapping
export const SLUG_TO_CITY_ID = Object.fromEntries(CITIES.map(c => [c.slug, c.id]));
export const CITY_ID_TO_SLUG = Object.fromEntries(CITIES.map(c => [c.id, c.slug]));
