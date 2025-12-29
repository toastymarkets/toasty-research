import { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { CITIES } from '../../config/cities';
import { useNWSHourlyForecast } from '../../hooks/useNWSHourlyForecast';
import { DataChipProvider } from '../../context/DataChipContext';

// Weather Components
import {
  HeroWeather,
  HourlyForecast,
  TenDayForecast,
  SunriseSunset,
  WidgetGrid,
  GlassWidget,
  UVIndexWidget,
  WindWidget,
  HumidityWidget,
  PressureWidget,
  VisibilityWidget,
  FeelsLikeWidget,
} from '../weather';

// Notepad
import ResearchNotepad from '../notepad/ResearchNotepad';

/**
 * HomePageNew - Apple Weather inspired home page
 * Shows weather for the first city (or selected city)
 */
export default function HomePageNew() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]); // Default to first city

  // Fetch hourly forecast
  const { forecast, loading: forecastLoading } = useNWSHourlyForecast(selectedCity?.slug);

  // Generate mock 10-day forecast from hourly data
  const tenDayForecast = useMemo(() => {
    if (!forecast?.periods) return [];

    // Group by date and get high/low
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

    return Object.values(byDate).slice(0, 10).map(day => ({
      date: day.date,
      high: Math.max(...day.temps),
      low: Math.min(...day.temps),
      condition: day.condition,
      current: day.temps[0],
    }));
  }, [forecast]);

  // Get current conditions from first hourly period
  const currentConditions = useMemo(() => {
    if (!forecast?.periods?.[0]) return null;
    return {
      temperature: forecast.periods[0].temperature,
      condition: forecast.periods[0].shortForecast,
      high: forecast.todayHigh,
      low: forecast.todayLow,
    };
  }, [forecast]);

  // Mock sunrise/sunset (calculate based on date)
  const sunTimes = useMemo(() => {
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 45, 0); // 6:45 AM
    const sunset = new Date(now);
    sunset.setHours(17, 30, 0); // 5:30 PM

    return {
      sunrise: sunrise.toISOString(),
      sunset: sunset.toISOString(),
    };
  }, []);

  // Mock weather data (will be replaced with real API data)
  const mockWeatherData = {
    uvIndex: 4,
    windSpeed: 12,
    windDirection: 225,
    humidity: 65,
    dewPoint: 42,
    pressure: 101325, // Pa
    visibility: 16093, // meters (10 miles)
    feelsLike: currentConditions?.temperature || 50,
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 overflow-x-hidden w-full max-w-[100vw]">
      {/* Hero Section */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pt-4 md:pt-8">
        <HeroWeather
          cityName={selectedCity?.name}
          temperature={currentConditions?.temperature}
          condition={currentConditions?.condition}
          high={currentConditions?.high}
          low={currentConditions?.low}
          loading={forecastLoading}
        />
      </div>

      {/* Hourly Forecast - Full width scroll */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 mt-4">
        <HourlyForecast
          periods={forecast?.periods || []}
          loading={forecastLoading}
          timezone={selectedCity?.timezone}
        />
      </div>

      {/* Widget Grid */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 mt-4">
        <WidgetGrid>
          {/* 10-Day Forecast - Takes 2 columns */}
          <WidgetGrid.Item span={2}>
            <TenDayForecast
              days={tenDayForecast}
              loading={forecastLoading}
            />
          </WidgetGrid.Item>

          {/* Research Notes Widget - Takes 2 columns */}
          <WidgetGrid.Item span={2}>
            <GlassWidget title="RESEARCH NOTES" icon={FileText} size="large">
              <div className="flex-1 -mx-2 -mb-2 overflow-hidden rounded-b-xl">
                <DataChipProvider>
                  <div className="h-[280px] overflow-y-auto">
                    <ResearchNotepad
                      storageKey="toasty_research_notes_v1_home"
                      compact={true}
                    />
                  </div>
                </DataChipProvider>
              </div>
            </GlassWidget>
          </WidgetGrid.Item>

          {/* Sunrise/Sunset */}
          <WidgetGrid.Item span={2}>
            <SunriseSunset
              sunrise={sunTimes.sunrise}
              sunset={sunTimes.sunset}
              timezone={selectedCity?.timezone}
            />
          </WidgetGrid.Item>

          {/* UV Index */}
          <UVIndexWidget value={mockWeatherData.uvIndex} />

          {/* Wind */}
          <WindWidget
            speed={mockWeatherData.windSpeed}
            direction={mockWeatherData.windDirection}
          />

          {/* Humidity */}
          <HumidityWidget
            value={mockWeatherData.humidity}
            dewPoint={mockWeatherData.dewPoint}
          />

          {/* Pressure */}
          <PressureWidget
            value={mockWeatherData.pressure}
            trend="steady"
          />

          {/* Visibility */}
          <VisibilityWidget value={mockWeatherData.visibility} />

          {/* Feels Like */}
          <FeelsLikeWidget
            actual={currentConditions?.temperature || 50}
            feelsLike={mockWeatherData.feelsLike}
          />
        </WidgetGrid>
      </div>

      {/* City selector (subtle, at bottom) */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 mt-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {CITIES.slice(0, 7).map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city)}
              className={`
                px-4 py-2 rounded-full text-sm transition-all
                ${selectedCity?.id === city.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                }
              `}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
