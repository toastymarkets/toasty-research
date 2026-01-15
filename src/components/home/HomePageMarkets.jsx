import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, CloudRain, Snowflake, BarChart3, Maximize2 } from 'lucide-react';
import { MARKET_CITIES, CITY_BY_SLUG } from '../../config/cities';
import { KalshiMarketsContext, useLowTempMarkets } from '../../hooks/useAllKalshiMarkets.jsx';
import { useKalshiRainMarkets } from '../../hooks/useKalshiRainMarkets';
import { useKalshiSnowMarkets } from '../../hooks/useKalshiSnowMarkets';
import { useAllCitiesWeather } from '../../hooks/useAllCitiesWeather';
import { getWeatherBackground, WeatherOverlay } from '../weather/DynamicWeatherBackground';
import MarketCardGlass from './MarketCardGlass';
import DataCountdownBar from './DataCountdownBar';
import AlertsBanner from './AlertsBanner';
import SatellitePreview from './SatellitePreview';
import FeaturedMarketCard from './FeaturedMarketCard';
import NewsCards from './NewsCards';

/**
 * HomePageMarkets - Markets-focused homepage
 * Displays all markets by volume in scrollable sections
 */
export default function HomePageMarkets() {
  const context = useContext(KalshiMarketsContext);
  const { loading: tempLoading, lastFetch, marketsData = {} } = context || {};

  // Fetch rain and snow markets
  const { markets: rainMarketsData, loading: rainLoading } = useKalshiRainMarkets();
  const { markets: snowMarketsData, loading: snowLoading } = useKalshiSnowMarkets();

  // Sort cities by volume
  const sortedTempMarkets = useMemo(() => {
    return MARKET_CITIES
      .map(city => ({
        ...city,
        ...marketsData[city.slug],
      }))
      .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
  }, [marketsData]);

  // Use real rain markets data, sorted by volume
  const rainMarkets = useMemo(() => {
    return rainMarketsData.length > 0 ? rainMarketsData : [];
  }, [rainMarketsData]);

  // Use real snow markets data, sorted by volume
  const snowMarkets = useMemo(() => {
    return snowMarketsData.length > 0 ? snowMarketsData : [];
  }, [snowMarketsData]);

  // Calculate total market stats
  const totalMarkets = sortedTempMarkets.length + rainMarkets.length + snowMarkets.length;
  const totalVolume = useMemo(() => {
    const tempVol = sortedTempMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
    const rainVol = rainMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
    const snowVol = snowMarkets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
    return tempVol + rainVol + snowVol;
  }, [sortedTempMarkets, rainMarkets, snowMarkets]);

  const formatTotalVolume = (vol) => {
    if (!vol) return '$0';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  // Find the featured market (highest volume)
  const featuredMarket = sortedTempMarkets[0];
  const remainingTempMarkets = sortedTempMarkets.slice(1);

  // State for satellite modal
  const [showSatelliteModal, setShowSatelliteModal] = useState(false);

  return (
    <div className="min-h-screen pb-24 md:pb-8 overflow-x-hidden w-full max-w-[100vw]">
      {/* Data Countdown Bar */}
      <DataCountdownBar />

      {/* Alerts Banner */}
      <AlertsBanner />

      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="glass-animate-in">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <BarChart3 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium text-white/60 uppercase tracking-wide">
                Weather Markets
              </span>
            </div>
            {totalVolume > 0 && (
              <span className="text-[10px] font-medium text-white/40">
                {formatTotalVolume(totalVolume)} volume
              </span>
            )}
          </div>

          {/* Main headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Predict the weather
          </h1>
          <p className="text-sm md:text-base text-white/50 max-w-xl">
            Trade on temperature, rain, and snow across major U.S. cities
          </p>
        </div>
      </div>

      {/* Featured Section: Satellite + Top Market */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Satellite Preview */}
          <SatellitePreview onExpand={() => setShowSatelliteModal(true)} />

          {/* Featured Market Card */}
          {featuredMarket && <FeaturedMarketCard city={featuredMarket} />}
        </div>
      </div>

      {/* Temperature Markets Section (excluding featured) */}
      <TemperatureMarketsSection
        highTempMarkets={remainingTempMarkets}
        highTempLoading={tempLoading}
        excludeFeatured={true}
      />

      {/* News Cards */}
      <NewsCards />

      {/* Rain Markets Section */}
      <PrecipitationSection
        type="rain"
        markets={rainMarkets}
        loading={rainLoading}
      />

      {/* Snow Markets Section */}
      <PrecipitationSection
        type="snow"
        markets={snowMarkets}
        loading={snowLoading}
      />

      {/* Satellite Modal */}
      {showSatelliteModal && (
        <SatelliteModal onClose={() => setShowSatelliteModal(false)} />
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 mt-12 pb-4">
        <div className="pt-6 border-t border-white/5">
          <p className="text-xs text-white/30 text-center">
            Market data provided by{' '}
            <a
              href="https://kalshi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              Kalshi
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * SectionHeader - Consistent section header with optional badge
 */
function SectionHeader({ children, badge, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
          {children}
        </h2>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 font-medium">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Toggle - Inline clickable toggle styled as part of heading text
 */
function Toggle({ value, options, onChange }) {
  const currentIndex = options.findIndex(opt => opt.value === value);
  const currentLabel = options[currentIndex]?.label || value;

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % options.length;
    onChange(options[nextIndex].value);
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline decoration-blue-400/30 underline-offset-2 hover:decoration-blue-300/50"
    >
      {currentLabel}
    </button>
  );
}

/**
 * TemperatureMarketsSection - Interactive temperature markets with type/timeframe selection
 */
function TemperatureMarketsSection({ highTempMarkets, highTempLoading }) {
  const [marketType, setMarketType] = useState('highest');
  const [timeframe, setTimeframe] = useState('today');

  // Fetch low temp markets
  const { marketsData: lowTempMarketsData, loading: lowTempLoading } = useLowTempMarkets();

  // Build low temp markets array
  const lowTempMarkets = useMemo(() => {
    return MARKET_CITIES.map(city => ({
      ...city,
      ...lowTempMarketsData[city.slug],
    })).sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
  }, [lowTempMarketsData]);

  // Select markets based on type
  const markets = marketType === 'highest' ? highTempMarkets : lowTempMarkets;
  const loading = marketType === 'highest' ? highTempLoading : lowTempLoading;

  // Market type options
  const typeOptions = [
    { value: 'highest', label: 'highest' },
    { value: 'lowest', label: 'lowest' },
  ];

  // Timeframe options
  const timeframeOptions = [
    { value: 'today', label: 'today' },
    { value: 'tomorrow', label: 'tomorrow' },
  ];

  // Check if low temp markets are available
  const lowMarketsAvailable = lowTempMarkets.some(m => m.topBrackets && m.topBrackets.length > 0);

  // Check if we should show "coming soon" for tomorrow or lowest
  const showComingSoon = timeframe === 'tomorrow' || (!lowMarketsAvailable && marketType === 'lowest');

  const marketCount = !loading && !showComingSoon && markets.length > 0 ? `${markets.length} markets` : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6">
      {/* Section Header - proper inline text flow */}
      <SectionHeader badge={marketCount}>
        <span className="text-white/60">What will be the </span>
        <Toggle value={marketType} options={typeOptions} onChange={setMarketType} />
        <span className="text-white/60"> temperature </span>
        <Toggle value={timeframe} options={timeframeOptions} onChange={setTimeframe} />
        <span className="text-white/60">?</span>
      </SectionHeader>

      {/* Markets Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-widget animate-pulse">
              <div className="h-20 bg-white/10" />
              <div className="p-3">
                <div className="h-3 w-32 bg-white/10 rounded mb-3" />
                <div className="space-y-2 mb-3">
                  <div className="h-9 bg-white/10 rounded-lg" />
                  <div className="h-9 bg-white/10 rounded-lg" />
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <div className="h-3 w-12 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : showComingSoon ? (
        <div className="glass-widget p-8 text-center">
          <TrendingUp className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">
            {timeframe === 'tomorrow'
              ? "Tomorrow's markets coming soon"
              : 'No lowest temperature markets available'}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {timeframe === 'tomorrow'
              ? 'Check back later for tomorrow\'s predictions'
              : 'These markets may not be active on Kalshi yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((market, index) => (
            <MarketCardGlass
              key={market.slug}
              city={market}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PrecipitationSection - Rain/Snow markets with grouped city cards
 */
function PrecipitationSection({ type, markets, loading }) {
  const Icon = type === 'rain' ? CloudRain : Snowflake;

  // Group markets by city - combine daily and monthly for same city
  const groupedMarkets = useMemo(() => {
    const cityMap = {};

    markets.forEach(market => {
      const citySlug = market.citySlug || market.slug;
      if (!cityMap[citySlug]) {
        cityMap[citySlug] = {
          citySlug,
          name: market.name?.replace(' Daily', '').replace(' Monthly', '') || citySlug,
          types: {},
        };
      }
      const marketType = market.type || 'monthly';
      cityMap[citySlug].types[marketType] = {
        topBrackets: market.topBrackets,
        totalVolume: market.totalVolume,
        closeTime: market.closeTime,
        slug: market.slug,
      };
    });

    // Convert to array and sort by total volume across all types
    return Object.values(cityMap)
      .map(city => ({
        ...city,
        totalVolume: Object.values(city.types).reduce((sum, t) => sum + (t.totalVolume || 0), 0),
      }))
      .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
  }, [markets]);

  const noActiveMarkets = !loading && groupedMarkets.length === 0;
  const cityCount = !loading && groupedMarkets.length > 0 ? `${groupedMarkets.length} cities` : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-10">
      {/* Section Header */}
      <SectionHeader badge={cityCount}>
        <span className="text-white/60">How much will it </span>
        <span className="text-blue-400">{type}</span>
        <span className="text-white/60">?</span>
      </SectionHeader>

      {/* Markets Grid */}
      {loading ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-widget animate-pulse">
              <div className="h-20 bg-white/10" />
              <div className="p-3">
                <div className="h-3 w-32 bg-white/10 rounded mb-3" />
                <div className="space-y-2 mb-3">
                  <div className="h-9 bg-white/10 rounded-lg" />
                  <div className="h-9 bg-white/10 rounded-lg" />
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <div className="h-3 w-12 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : noActiveMarkets ? (
        <div className="glass-widget p-8 text-center">
          <Icon className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">No active {type} markets at this time</p>
          <p className="text-xs text-white/30 mt-1">Check back later for new markets</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groupedMarkets.map((market, index) => (
            <PrecipitationCard
              key={market.citySlug}
              city={market}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PrecipitationCard - Card with toggleable monthly/daily chips
 */
function PrecipitationCard({ city, index }) {
  const availableTypes = Object.keys(city.types);
  const [activeType, setActiveType] = useState(availableTypes.includes('daily') ? 'daily' : 'monthly');

  const activeData = city.types[activeType] || {};
  const { topBrackets = [], totalVolume, closeTime } = activeData;

  // Get city config for weather background
  const cityConfig = CITY_BY_SLUG[city.citySlug];
  const { getWeatherForCity } = useAllCitiesWeather();
  const weather = getWeatherForCity(city.citySlug);
  const weatherBg = getWeatherBackground(weather?.condition, cityConfig?.timezone);

  const [timer, setTimer] = useState(null);

  useEffect(() => {
    const updateTimer = () => {
      if (!closeTime) {
        setTimer(null);
        return;
      }

      const now = new Date();
      const closeDate = closeTime instanceof Date ? closeTime : new Date(closeTime);
      const diff = closeDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimer({ formatted: 'Closed' });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimer({ formatted: `${hours}h ${minutes}m ${seconds}s` });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${Math.round(vol / 1000)}K`;
    return `$${vol.toLocaleString()}`;
  };

  const animationDelay = `glass-delay-${(index % 5) + 1}`;

  return (
    <Link
      to={`/city/${city.citySlug}`}
      className={`glass-widget glass-interactive glass-animate-in ${animationDelay} block overflow-hidden transition-all duration-300 relative`}
      style={{ background: weatherBg }}
    >
      <WeatherOverlay condition={weather?.condition} timezone={cityConfig?.timezone} index={index} />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 p-4">
        {/* City name and type chips */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-lg">
            {city.name}
          </h3>
          {availableTypes.length > 0 && (
            <div className="flex gap-1">
              {availableTypes.map(t => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveType(t);
                  }}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                    activeType === t
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-white/20 text-white/60 hover:bg-white/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Brackets */}
        {topBrackets.length > 0 ? (
          <div className="space-y-2 mb-4">
            {topBrackets.slice(0, 2).map((bracket, i) => (
              <div
                key={bracket.ticker || i}
                className="relative flex items-center justify-between py-2 px-2 rounded-lg"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-lg opacity-25"
                  style={{ width: `${bracket.yesPrice}%`, backgroundColor: '#3B82F6' }}
                />
                <span className="relative text-sm font-medium text-white/80">
                  {bracket.label}
                </span>
                <div className="relative flex items-center gap-2">
                  <span className="text-sm font-bold text-white tabular-nums">
                    {bracket.yesPrice}%
                  </span>
                  <div className="flex rounded-md overflow-hidden text-[10px] font-medium">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400">Yes</span>
                    <span className="px-2 py-1 bg-white/10 text-white/50">No</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[72px] flex items-center justify-center text-xs text-white/40 mb-4">
            No data for {activeType}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-white/50">{formatVolume(totalVolume)}</span>
          {timer && (
            <span className="text-xs font-medium text-orange-400 tabular-nums">
              {timer.formatted}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * SatelliteModal - Full-screen satellite imagery viewer
 */
function SatelliteModal({ onClose }) {
  const [product, setProduct] = useState('geocolor');
  const [cacheKey, setCacheKey] = useState(Date.now());

  const PRODUCTS = {
    geocolor: {
      name: 'Visible',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/latest.jpg',
    },
    airmass: {
      name: 'Air Mass',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/AirMass/latest.jpg',
    },
    infrared: {
      name: 'Infrared',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/13/latest.jpg',
    },
    watervapor: {
      name: 'Water Vapor',
      url: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/09/latest.jpg',
    },
  };

  const currentProduct = PRODUCTS[product];
  const imageUrl = `${currentProduct.url}?t=${cacheKey}`;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-elevated max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-white/50" />
            <h3 className="text-lg font-semibold text-white">GOES-19 CONUS Satellite</h3>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(PRODUCTS).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => {
                  setProduct(key);
                  setCacheKey(Date.now());
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                  product === key
                    ? 'bg-blue-500/80 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[16/10] bg-slate-900/50">
          <img
            src={imageUrl}
            alt={`GOES-19 ${currentProduct.name}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center justify-between border-t border-white/10">
          <span className="text-xs text-white/40">
            Data: NOAA/NESDIS GOES-19 • Updated every 5 minutes
          </span>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

