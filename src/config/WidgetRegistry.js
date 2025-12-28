import LiveStationData from '../components/widgets/LiveStationData';
import NearbyStationsMap from '../components/widgets/NearbyStationsMap';
import ForecastModels from '../components/widgets/ForecastModels';
import ForecastDiscussion from '../components/widgets/ForecastDiscussion';
import NWSHourlyForecast from '../components/widgets/NWSHourlyForecast';
import LiveMarketBrackets from '../components/widgets/LiveMarketBrackets';
import DailySummary from '../components/widgets/DailySummary';

/**
 * Widget Registry
 * Central registry of all available widgets with metadata
 */
export const WIDGET_REGISTRY = {
  'live-market-brackets': {
    id: 'live-market-brackets',
    name: 'Live Market Brackets',
    description: 'Real-time Kalshi market brackets with Yes/No prices and volume',
    icon: 'TrendingUp',
    component: LiveMarketBrackets,
    category: 'market',
    requiredProps: ['citySlug', 'cityName'],
    // Grid layout properties (12-column grid, rowHeight: 80px)
    defaultW: 4,   // 1/3 width - fits 3 per row
    defaultH: 5,
    minW: 3,
    minH: 4,
  },
  'live-station-data': {
    id: 'live-station-data',
    name: 'Live Station Data',
    description: 'Real-time weather observations from NWS station with temperature, humidity, and wind',
    icon: 'Radio',
    component: LiveStationData,
    category: 'weather',
    requiredProps: ['stationId', 'cityName', 'timezone'],
    defaultW: 6,  // Half width (6/12 columns)
    defaultH: 5,
    minW: 4,
    minH: 4,
  },
  'nearby-stations-map': {
    id: 'nearby-stations-map',
    name: 'Nearby Stations',
    description: 'Interactive map showing nearby weather stations with current readings',
    icon: 'MapPin',
    component: NearbyStationsMap,
    category: 'weather',
    requiredProps: ['citySlug', 'cityName'],
    defaultW: 4,
    defaultH: 5,
    minW: 3,
    minH: 4,
  },
  'forecast-models': {
    id: 'forecast-models',
    name: 'Forecast Models',
    description: 'Multi-model weather forecast comparison (ECMWF, GFS, HRRR, NAM, etc.)',
    icon: 'TrendingUp',
    component: ForecastModels,
    category: 'forecast',
    requiredProps: ['citySlug'],
    defaultW: 4,
    defaultH: 5,
    minW: 3,
    minH: 4,
  },
  'forecast-discussion': {
    id: 'forecast-discussion',
    name: 'NWS Discussion',
    description: 'Official NWS forecast analysis and meteorologist discussion',
    icon: 'FileText',
    component: ForecastDiscussion,
    category: 'forecast',
    requiredProps: ['cityId'],
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
  },
  'nws-hourly-forecast': {
    id: 'nws-hourly-forecast',
    name: 'NWS Hourly Forecast',
    description: 'Official NWS hourly temperature forecast curve',
    icon: 'Thermometer',
    component: NWSHourlyForecast,
    category: 'forecast',
    requiredProps: ['citySlug'],
    defaultW: 4,
    defaultH: 5,
    minW: 3,
    minH: 4,
  },
  'daily-summary': {
    id: 'daily-summary',
    name: 'Daily Summary (DSM)',
    description: 'IEM daily summary with high/low temperatures',
    icon: 'FileText',
    component: DailySummary,
    category: 'weather',
    requiredProps: ['citySlug', 'cityName'],
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
  },
};

export const getWidget = (widgetId) => WIDGET_REGISTRY[widgetId];
export const getAllWidgets = () => Object.values(WIDGET_REGISTRY);
export const getWidgetsByCategory = (category) => Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
export const getCategories = () => [...new Set(Object.values(WIDGET_REGISTRY).map(w => w.category))];
