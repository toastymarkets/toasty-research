import LiveStationData from '../components/widgets/LiveStationData';
import NearbyStationsMap from '../components/widgets/NearbyStationsMap';
import ForecastModels from '../components/widgets/ForecastModels';
import ForecastDiscussion from '../components/widgets/ForecastDiscussion';
import NWSHourlyForecast from '../components/widgets/NWSHourlyForecast';
import LiveMarketBrackets from '../components/widgets/LiveMarketBrackets';
import DailySummary from '../components/widgets/DailySummary';
import RainWidget from '../components/widgets/RainWidget';

/**
 * Widget Registry
 * Central registry of all available widgets with metadata
 *
 * Grid constraints (for 4-column city dashboard grid):
 * - minW/minH: Minimum size in grid units
 * - maxW/maxH: Maximum size in grid units
 * - defaultW/defaultH: Default size for workspace dashboard (12-column)
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
    // Grid layout properties (12-column grid for workspace, rowHeight: 80px)
    defaultW: 4,   // 1/3 width - fits 3 per row
    defaultH: 5,
    minW: 1,
    minH: 2,
    maxW: 2,
    maxH: 3,
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
    minW: 2,
    minH: 1,
    maxW: 4,
    maxH: 2,
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
    minW: 2,
    minH: 1,
    maxW: 4,
    maxH: 2,
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
    minW: 1,
    minH: 1,
    maxW: 4,
    maxH: 2,
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
    minW: 1,
    minH: 1,
    maxW: 4,
    maxH: 4,
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
    minW: 2,
    minH: 1,
    maxW: 4,
    maxH: 2,
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
    minW: 1,
    minH: 1,
    maxW: 2,
    maxH: 2,
  },
  'rain-accumulation': {
    id: 'rain-accumulation',
    name: 'Rain Accumulation',
    description: 'Monthly precipitation with actual vs forecast vs market vs historical comparison',
    icon: 'CloudRain',
    component: RainWidget,
    category: 'weather',
    requiredProps: ['citySlug', 'cityName'],
    defaultW: 4,
    defaultH: 5,
    minW: 1,
    minH: 1,
    maxW: 2,
    maxH: 2,
  },
};

export const getWidget = (widgetId) => WIDGET_REGISTRY[widgetId];
export const getAllWidgets = () => Object.values(WIDGET_REGISTRY);
export const getWidgetsByCategory = (category) => Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
export const getCategories = () => [...new Set(Object.values(WIDGET_REGISTRY).map(w => w.category))];
