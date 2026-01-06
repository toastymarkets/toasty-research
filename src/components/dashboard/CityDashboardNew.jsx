import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { useNWSWeather } from '../../hooks/useNWSWeather';
import { useNWSHourlyForecast } from '../../hooks/useNWSHourlyForecast';
import { useNWSObservationHistory } from '../../hooks/useNWSObservationHistory';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import { DataChipProvider } from '../../context/DataChipContext';
import { DashboardWeatherBackground } from '../weather/DynamicWeatherBackground';
import { FrogFriend } from '../frog';

// Weather Components
import {
  HeroWeather,
  HourlyForecast,
  TenDayForecast,
  MarketBrackets,
  NWSForecastWidget,
  NWSDiscussionWidget,
  ModelsWidget,
  WidgetGridV2,
  WeatherMap,
  WindWidget,
  ResolutionWidget,
  RoundingWidget,
  NearbyStations,
  AlertsWidget,
} from '../weather';
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
  const { isCollapsed: notesSidebarCollapsed } = useNotesSidebar();
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
    forecast: false,
    alerts: false,
  });

  // Toggle expansion for a specific widget
  const toggleExpansion = (widgetId) => {
    setExpandedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

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


      {/* Notes Sidebar - Desktop */}
      <div className="hidden lg:block">
        <NotesSidebar
          storageKey={notepadStorageKey}
          cityName={city.name}
          city={city}
          weather={weather}
          markets={marketData}
          observations={observations}
        />
      </div>

      {/* Mobile Notes Button */}
      <Link
        to="/research"
        className="md:hidden fixed bottom-6 right-6 z-50 glass-button-primary p-3 rounded-full shadow-lg"
      >
        <FileText className="w-5 h-5" />
      </Link>

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

      {/* Widget Grid V2 - CSS Grid with named areas */}
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 mt-2 pb-4">
        <WidgetGridV2 expandedWidgets={expandedWidgets}>
          {/* Models Widget */}
          <WidgetGridV2.Area area="models" isExpanded={expandedWidgets.models} expansionSize="medium">
            <ModelsWidget
              citySlug={citySlug}
              loading={forecastLoading}
              isExpanded={expandedWidgets.models}
              onToggleExpand={() => toggleExpansion('models')}
            />
          </WidgetGridV2.Area>

          {/* Market Brackets */}
          <WidgetGridV2.Area area="brackets" isExpanded={expandedWidgets.brackets} expansionSize="medium">
            <MarketBrackets
              citySlug={citySlug}
              cityName={city.name}
              loading={forecastLoading}
              variant="vertical"
              isExpanded={expandedWidgets.brackets}
              onToggleExpand={() => toggleExpansion('brackets')}
            />
          </WidgetGridV2.Area>

          {/* Weather Map (2x2) */}
          <WidgetGridV2.Area area="map">
            <WeatherMap
              lat={city.lat}
              lon={city.lon}
              zoom={8}
              cityName={city.name}
              currentTemp={currentTempF}
            />
          </WidgetGridV2.Area>

          {/* NWS Forecast Discussion */}
          <WidgetGridV2.Area area="discussion" isExpanded={expandedWidgets.discussion} expansionSize="large">
            <NWSDiscussionWidget
              lat={city.lat}
              lon={city.lon}
              citySlug={citySlug}
              isExpanded={expandedWidgets.discussion}
              onToggleExpand={() => toggleExpansion('discussion')}
            />
          </WidgetGridV2.Area>

          {/* Nearby Stations (2x2) */}
          <WidgetGridV2.Area area="nearby">
            <NearbyStations
              citySlug={citySlug}
              cityName={city.name}
            />
          </WidgetGridV2.Area>

          {/* NWS Alerts (spans 2 rows) */}
          <WidgetGridV2.Area area="alerts" isExpanded={expandedWidgets.alerts}>
            <AlertsWidget
              lat={city.lat}
              lon={city.lon}
              cityName={city.name}
              isExpanded={expandedWidgets.alerts}
              onToggleExpand={() => toggleExpansion('alerts')}
            />
          </WidgetGridV2.Area>

          {/* Wind + Resolution stacked */}
          <WidgetGridV2.Area area="smallstack">
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
            <ResolutionWidget
              stationId={city.stationId}
              citySlug={citySlug}
              cityName={city.name}
              timezone={city.timezone}
              loading={weatherLoading}
              isExpanded={expandedWidgets.resolution}
              onToggleExpand={() => toggleExpansion('resolution')}
            />
          </WidgetGridV2.Area>

          {/* Rain/Snow Trading */}
          <WidgetGridV2.Area area="pressure">
            <RainSnowBracketsWidget
              citySlug={citySlug}
              cityName={city.name}
            />
          </WidgetGridV2.Area>

          {/* Rain Accumulation */}
          <WidgetGridV2.Area area="visibility" isExpanded={expandedWidgets.rain}>
            <RainWidget
              citySlug={citySlug}
              cityName={city.name}
              isExpanded={expandedWidgets.rain}
              onToggleExpand={() => toggleExpansion('rain')}
            />
          </WidgetGridV2.Area>

          {/* NWS Forecast */}
          <WidgetGridV2.Area area="forecast" isExpanded={expandedWidgets.forecast}>
            <NWSForecastWidget
              citySlug={citySlug}
              lat={city.lat}
              lon={city.lon}
              timezone={city.timezone}
              isExpanded={expandedWidgets.forecast}
              onToggleExpand={() => toggleExpansion('forecast')}
            />
          </WidgetGridV2.Area>

          {/* Rounding Calculator */}
          <WidgetGridV2.Area area="rounding" isExpanded={expandedWidgets.rounding}>
            <RoundingWidget
              currentTemp={currentTempF}
              runningHigh={runningHigh}
              observationType={observationType}
              loading={weatherLoading}
              isExpanded={expandedWidgets.rounding}
              onToggleExpand={() => toggleExpansion('rounding')}
            />
          </WidgetGridV2.Area>
        </WidgetGridV2>
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
