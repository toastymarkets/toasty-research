import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { useNWSWeather } from '../../hooks/useNWSWeather';
import { useNWSHourlyForecast } from '../../hooks/useNWSHourlyForecast';
import { useNWSObservationHistory } from '../../hooks/useNWSObservationHistory';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import { DataChipProvider } from '../../context/DataChipContext';
import { useNWSAlerts } from '../../hooks/useNWSAlerts';
import { DashboardWeatherBackground } from '../weather/DynamicWeatherBackground';
import { FrogFriend } from '../frog';

// Weather Components
import {
  HeroWeather,
  HourlyForecast,
  TenDayForecast,
  MarketBrackets,
  NWSDiscussionWidget,
  ModelsWidget,
  WeatherMap,
  WindWidget,
  ResolutionWidget,
  RoundingWidget,
  NearbyStations,
  AlertsWidget,
} from '../weather';
import CityWidgetGrid from './CityWidgetGrid';
import RainWidget from '../widgets/RainWidget';
import RainSnowBracketsWidget from '../widgets/RainSnowBracketsWidget';

// Kalshi market data
import { useKalshiMarketsFromContext } from '../../hooks/useAllKalshiMarkets';

// Notes sidebar
import NotesSidebar from '../layout/NotesSidebar';

/**
 * Hook to get the current local time for a timezone
 */
function useLocalTime(timezone) {
  const [time, setTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }));
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return time;
}

/**
 * CityDashboardNew - Apple Weather inspired city dashboard
 */
function CityDashboardContent({ city, citySlug }) {
  // Fetch weather data
  const { weather, loading: weatherLoading } = useNWSWeather(city.stationId);
  const { forecast, loading: forecastLoading } = useNWSHourlyForecast(citySlug);
  const { observations, loading: observationsLoading, lastUpdated } = useNWSObservationHistory(city.stationId, 48);
  const marketData = useKalshiMarketsFromContext(citySlug);
  const localTime = useLocalTime(city.timezone);
  const { alerts } = useNWSAlerts(city.lat, city.lon);

  // Convert NWS temperature to Fahrenheit
  const currentTempF = useMemo(() => {
    if (weather?.temperature?.value == null) return null;
    return Math.round((weather.temperature.value * 9/5) + 32);
  }, [weather]);

  // Determine observation type based on latest observation's rawMessage
  // METAR = has rawMessage (hourly), ASOS = no rawMessage (5-minute)
  const observationType = useMemo(() => {
    if (!observations || observations.length === 0) return 'asos';
    const latest = observations[observations.length - 1];
    return latest?.rawMessage ? 'metar' : 'asos';
  }, [observations]);

  // Generate 10-day forecast from hourly data
  const tenDayForecast = useMemo(() => {
    if (!forecast?.periods) return [];

    const byDate = {};
    forecast.periods.forEach(period => {
      const date = period.dateStr;
      if (!byDate[date]) {
        byDate[date] = {
          date,
          temps: [],
          condition: period.shortForecast,
        };
      }
      byDate[date].temps.push(period.temperature);
    });

    return Object.values(byDate).slice(0, 10).map((day, index) => ({
      date: day.date,
      high: Math.max(...day.temps),
      low: Math.min(...day.temps),
      condition: day.condition,
      current: index === 0 ? currentTempF : undefined,
    }));
  }, [forecast, currentTempF]);

  // Calculate running high from today's observations
  const runningHigh = useMemo(() => {
    if (!observations?.length) return null;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayObs = observations.filter(o => {
      const obsDate = new Date(o.timestamp);
      return obsDate >= todayStart;
    });
    if (todayObs.length === 0) return null;
    const temps = todayObs.map(o => o.temperature).filter(t => t != null);
    return temps.length > 0 ? Math.max(...temps) : null;
  }, [observations]);

  // Get current conditions
  const currentConditions = useMemo(() => {
    const condition = weather?.textDescription || forecast?.periods?.[0]?.shortForecast || 'Clear';

    return {
      temperature: currentTempF,
      condition,
      high: runningHigh ?? forecast?.todayHigh, // Use running high if available, fallback to forecast
      low: forecast?.todayLow,
    };
  }, [weather, forecast, currentTempF, runningHigh]);

  // Sunrise/sunset times (mock - would need real API)
  const sunTimes = useMemo(() => {
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 45, 0);
    const sunset = new Date(now);
    sunset.setHours(17, 30, 0);
    return { sunrise: sunrise.toISOString(), sunset: sunset.toISOString() };
  }, []);

  // Extract weather details from NWS data
  const weatherDetails = useMemo(() => {
    return {
      windSpeed: weather?.windSpeed?.value || 0,
      windDirection: weather?.windDirection?.value || 0,
      humidity: weather?.humidity?.value || 65,
      pressure: weather?.barometricPressure?.value || 101325,
      visibility: weather?.visibility?.value || 16000,
      dewPoint: weather?.dewpoint?.value,
    };
  }, [weather]);

  const isLoading = weatherLoading && forecastLoading;
  const notepadStorageKey = `toasty_research_notes_v1_city_${citySlug}`;
  const { isCollapsed: notesSidebarCollapsed, toggleMobile } = useNotesSidebar();
  const heroRef = useRef(null);

  // Widget expansion state (multi-expansion support)
  const [expandedWidgets, setExpandedWidgets] = useState({
    discussion: false,
    models: false,
    brackets: false,
    rounding: false,
    resolution: false,
    wind: false,
    rain: false,
    map: false,
    alerts: false,
  });

  // Toggle expansion for a specific widget
  const toggleExpansion = (widgetId) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  // Compute which widgets are absent (shouldn't be in grid)
  // Alerts is hidden when there are no active alerts
  const absentWidgets = useMemo(() => {
    const absent = [];
    if (!alerts || alerts.length === 0) {
      absent.push('alerts');
    }
    return absent;
  }, [alerts]);

  return (
    <>
      {/* Dynamic weather background */}
      <DashboardWeatherBackground
        condition={currentConditions.condition}
        timezone={city.timezone}
      />

      <div className={`min-h-screen pb-24 md:pb-8 transition-all duration-300 overflow-x-hidden w-full max-w-[100vw] ${notesSidebarCollapsed ? '' : 'lg:pr-[21.25rem]'}`}>
        {/* Back button - floating glass, positioned after hamburger on mobile */}
      <div className="fixed top-4 left-14 z-50 md:left-[calc(19rem+0.5rem)]">
        <Link
          to="/"
          className="glass-button-icon flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>


      {/* Notes Sidebar - renders desktop sidebar on lg+ and mobile drawer on smaller screens */}
      <NotesSidebar
        storageKey={notepadStorageKey}
        cityName={city.name}
        city={city}
        weather={weather}
        markets={marketData}
        observations={observations}
      />

      {/* Mobile Notes Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed bottom-6 right-6 z-50 glass-button-primary p-3 rounded-full shadow-lg"
      >
        <FileText className="w-5 h-5" />
      </button>

      {/* Hero Section - compact */}
      <div ref={heroRef} className="w-full relative pt-4 md:pt-12">
        <div className="max-w-5xl mx-auto px-2 sm:px-3">
          <HeroWeather
            cityName={city.name}
            temperature={currentConditions.temperature}
            condition={currentConditions.condition}
            high={currentConditions.high}
            low={currentConditions.low}
            stationId={city.stationId}
            localTime={localTime}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Frog Friend - Physics-based movement across dashboard */}
      <div className="hidden sm:block">
        <FrogFriend condition={currentConditions.condition} heroRef={heroRef} />
      </div>

      {/* Hourly Forecast - Real NWS observation data */}
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 mt-2">
        <HourlyForecast
          observations={observations}
          loading={observationsLoading}
          timezone={city.timezone}
          cityName={city.name}
          currentTemp={currentTempF}
          stationId={city.stationId}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Widget Grid - Draggable & Resizable */}
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 mt-2 pb-4">
        <CityWidgetGrid
          citySlug={citySlug}
          expandedWidgets={expandedWidgets}
          onExpansionChange={(widgetId, shouldExpand) => {
            setExpandedWidgets(prev => ({
              ...prev,
              [widgetId]: shouldExpand
            }));
          }}
          absentWidgets={absentWidgets}
        >
          {/* Models Widget */}
          <div key="models" area="models" className="h-full">
            <ModelsWidget
              citySlug={citySlug}
              lat={city.lat}
              lon={city.lon}
              loading={forecastLoading}
              isExpanded={expandedWidgets.models}
              onToggleExpand={() => toggleExpansion('models')}
            />
          </div>

          {/* Market Brackets */}
          <div key="brackets" area="brackets" className="h-full">
            <MarketBrackets
              citySlug={citySlug}
              cityName={city.name}
              loading={forecastLoading}
              variant="vertical"
              isExpanded={expandedWidgets.brackets}
              onToggleExpand={() => toggleExpansion('brackets')}
            />
          </div>

          {/* Weather Map / Satellite */}
          <div key="map" area="map" className="h-full">
            <WeatherMap
              lat={city.lat}
              lon={city.lon}
              zoom={8}
              isExpanded={expandedWidgets.map}
              onToggleExpand={() => toggleExpansion('map')}
            />
          </div>

          {/* NWS Forecast Discussion */}
          <div key="discussion" area="discussion" className="h-full">
            <NWSDiscussionWidget
              lat={city.lat}
              lon={city.lon}
              citySlug={citySlug}
              cityName={city.name}
              forecastOffice={city.forecastOffice}
              weather={weather}
              markets={marketData}
              isExpanded={expandedWidgets.discussion}
              onToggleExpand={() => toggleExpansion('discussion')}
            />
          </div>

          {/* Nearby Stations */}
          <div key="nearby" area="nearby" className="h-full">
            <NearbyStations
              citySlug={citySlug}
              isExpanded={expandedWidgets.nearby}
              onToggleExpand={() => toggleExpansion('nearby')}
            />
          </div>

          {/* Alerts Widget - conditionally shown */}
          {alerts && alerts.length > 0 && (
            <div key="alerts" area="alerts" className="h-full">
              <AlertsWidget
                lat={city.lat}
                lon={city.lon}
                cityName={city.name}
                isExpanded={expandedWidgets.alerts}
                onToggleExpand={() => toggleExpansion('alerts')}
              />
            </div>
          )}

          {/* Wind Widget */}
          <div key="wind" area="wind" className="h-full">
            <WindWidget
              speed={weatherDetails.windSpeed}
              direction={weatherDetails.windDirection}
              loading={weatherLoading}
              observations={observations}
              timezone={city.timezone}
              cityName={city.name}
              compact={true}
              isExpanded={expandedWidgets.wind}
              onToggleExpand={() => toggleExpansion('wind')}
            />
          </div>

          {/* Resolution Widget */}
          <div key="resolution" area="resolution" className="h-full">
            <ResolutionWidget
              stationId={city.stationId}
              citySlug={citySlug}
              cityName={city.name}
              timezone={city.timezone}
              loading={weatherLoading}
              isExpanded={expandedWidgets.resolution}
              onToggleExpand={() => toggleExpansion('resolution')}
            />
          </div>

          {/* Rain/Snow Trading */}
          <div key="pressure" area="pressure" className="h-full">
            <RainSnowBracketsWidget
              citySlug={citySlug}
              cityName={city.name}
            />
          </div>

          {/* Rain Accumulation */}
          <div key="visibility" area="visibility" className="h-full">
            <RainWidget
              citySlug={citySlug}
              cityName={city.name}
              isExpanded={expandedWidgets.rain}
              onToggleExpand={() => toggleExpansion('rain')}
            />
          </div>

          {/* Rounding Calculator */}
          <div key="rounding" area="rounding" className="h-full">
            <RoundingWidget
              currentTemp={currentTempF}
              runningHigh={runningHigh}
              observationType={observationType}
              loading={weatherLoading}
              isExpanded={expandedWidgets.rounding}
              onToggleExpand={() => toggleExpansion('rounding')}
            />
          </div>
        </CityWidgetGrid>
      </div>
      </div>
    </>
  );
}

export default function CityDashboardNew() {
  const { citySlug } = useParams();
  const city = CITY_BY_SLUG[citySlug];

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4 text-white">City not found</h1>
          <Link to="/" className="text-apple-blue hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DataChipProvider>
      <CityDashboardContent city={city} citySlug={citySlug} />
    </DataChipProvider>
  );
}
