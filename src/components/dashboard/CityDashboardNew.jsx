import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';
import { useNWSWeather } from '../../hooks/useNWSWeather';
import { useNWSHourlyForecast } from '../../hooks/useNWSHourlyForecast';
import { useNWSObservationHistory } from '../../hooks/useNWSObservationHistory';
import { useNotesSidebar } from '../../context/NotesSidebarContext';
import { DashboardWeatherBackground } from '../weather/DynamicWeatherBackground';

// Weather Components
import {
  HeroWeather,
  HourlyForecast,
  TenDayForecast,
  MarketBrackets,
  NWSForecastWidget,
  NWSDiscussionWidget,
  ModelsWidget,
  WidgetGrid,
  WeatherMap,
  WindWidget,
  HumidityWidget,
  PressureWidget,
  VisibilityWidget,
  MarketInsightWidget,
} from '../weather';

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

  // Get current conditions
  const currentConditions = useMemo(() => {
    const condition = weather?.textDescription || forecast?.periods?.[0]?.shortForecast || 'Clear';

    return {
      temperature: currentTempF,
      condition,
      high: forecast?.todayHigh,
      low: forecast?.todayLow,
    };
  }, [weather, forecast, currentTempF]);

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
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 pt-4 md:pt-12">
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

      {/* Widget Grid - compact */}
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 mt-2 pb-4">
        <WidgetGrid>
          {/* Market Brackets - Kalshi temperature markets */}
          <WidgetGrid.Item span={2}>
            <MarketBrackets
              citySlug={citySlug}
              cityName={city.name}
              loading={forecastLoading}
            />
          </WidgetGrid.Item>

          {/* Weather Map */}
          <WidgetGrid.Item span={2}>
            <WeatherMap
              lat={city.lat}
              lon={city.lon}
              zoom={8}
              cityName={city.name}
              currentTemp={currentTempF}
            />
          </WidgetGrid.Item>

          {/* NWS Forecast */}
          <NWSForecastWidget
            citySlug={citySlug}
            lat={city.lat}
            lon={city.lon}
            timezone={city.timezone}
          />

          {/* Multi-Model Forecasts */}
          <ModelsWidget citySlug={citySlug} loading={forecastLoading} />

          {/* Wind */}
          <WindWidget
            speed={weatherDetails.windSpeed}
            direction={weatherDetails.windDirection}
            loading={weatherLoading}
            observations={observations}
            timezone={city.timezone}
            cityName={city.name}
          />

          {/* Humidity */}
          <HumidityWidget
            value={weatherDetails.humidity}
            dewPoint={weatherDetails.dewPoint}
            loading={weatherLoading}
          />

          {/* Pressure */}
          <PressureWidget
            value={weatherDetails.pressure}
            trend="steady"
            loading={weatherLoading}
          />

          {/* Visibility */}
          <VisibilityWidget
            value={weatherDetails.visibility}
            loading={weatherLoading}
          />

          {/* NWS Forecast Discussion */}
          <NWSDiscussionWidget
            lat={city.lat}
            lon={city.lon}
            citySlug={citySlug}
          />

          {/* Market Insight - Kalshi prediction data */}
          <MarketInsightWidget
            marketData={marketData}
            forecastHigh={forecast?.todayHigh}
            loading={forecastLoading}
          />
        </WidgetGrid>
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

  return <CityDashboardContent city={city} citySlug={citySlug} />;
}
