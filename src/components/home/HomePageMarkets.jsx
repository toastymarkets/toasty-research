import { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { TrendingUp, CloudRain, Snowflake, ChevronDown } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { KalshiMarketsContext, useLowTempMarkets } from '../../hooks/useAllKalshiMarkets.jsx';
import { useKalshiRainMarkets } from '../../hooks/useKalshiRainMarkets';
import { useKalshiSnowMarkets } from '../../hooks/useKalshiSnowMarkets';
import MarketCardGlass from './MarketCardGlass';

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

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastFetch) return null;
    return lastFetch.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Use real rain markets data, sorted by volume
  const rainMarkets = useMemo(() => {
    return rainMarketsData.length > 0 ? rainMarketsData : [];
  }, [rainMarketsData]);

  // Use real snow markets data, sorted by volume
  const snowMarkets = useMemo(() => {
    return snowMarketsData.length > 0 ? snowMarketsData : [];
  }, [snowMarketsData]);

  // Check if there are no active rain/snow markets
  const noRainMarkets = !rainLoading && rainMarkets.length === 0;
  const noSnowMarkets = !snowLoading && snowMarkets.length === 0;

  return (
    <div className="min-h-screen pb-24 md:pb-8 overflow-x-hidden w-full max-w-[100vw]">
      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Weather Markets
            </h1>
            <p className="text-sm text-white/60">
              Real-time prediction markets on Kalshi
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="glass-badge flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-white/80 text-xs font-medium">Live</span>
            </div>
            {lastFetch && (
              <span className="text-[10px] text-white/40 hidden sm:block">
                Updated {formatLastUpdate()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Temperature Markets Section */}
      <TemperatureMarketsSection
        highTempMarkets={sortedTempMarkets}
        highTempLoading={tempLoading}
      />

      {/* Rain Markets Section */}
      <MarketSection
        title="Rain Markets"
        subtitle="Precipitation predictions"
        icon={CloudRain}
        markets={rainMarkets}
        loading={rainLoading}
        noActiveMarkets={noRainMarkets}
      />

      {/* Snow Markets Section */}
      <MarketSection
        title="Snow Markets"
        subtitle="Snowfall predictions"
        icon={Snowflake}
        markets={snowMarkets}
        loading={snowLoading}
        noActiveMarkets={noSnowMarkets}
      />

      {/* Footer */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-8 text-center">
        <p className="text-xs text-white/30">
          Data provided by{' '}
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

    </div>
  );
}

/**
 * Dropdown - Glass-styled dropdown for selecting options
 */
function Dropdown({ value, options, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-orange-400 font-semibold"
      >
        {selectedOption?.label || value}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[140px] py-1 glass-elevated z-50 animate-scale-in">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-3 py-2 text-left text-sm transition-colors
                ${option.value === value
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-white/80 hover:bg-white/10'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TemperatureMarketsSection - Interactive temperature markets with city/type selection
 */
function TemperatureMarketsSection({ highTempMarkets, highTempLoading }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    // Default to first city with most volume
    if (highTempMarkets.length > 0) {
      return highTempMarkets[0].slug;
    }
    return 'austin';
  });
  const [marketType, setMarketType] = useState('highest');
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

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

  // Sort markets with selected city first
  const sortedMarkets = useMemo(() => {
    const marketsCopy = [...markets];
    const selectedIndex = marketsCopy.findIndex(m => m.slug === selectedCity);
    if (selectedIndex > 0) {
      const [selected] = marketsCopy.splice(selectedIndex, 1);
      marketsCopy.unshift(selected);
    }
    return marketsCopy;
  }, [markets, selectedCity]);

  // Handle city change with shuffle animation
  const handleCityChange = (newCity) => {
    if (newCity === selectedCity) return;

    setIsShuffling(true);

    setTimeout(() => {
      setSelectedCity(newCity);
      setShuffleKey(prev => prev + 1);

      setTimeout(() => {
        setIsShuffling(false);
      }, 50);
    }, 200);
  };

  // Handle market type change with shuffle animation
  const handleMarketTypeChange = (newType) => {
    if (newType === marketType) return;

    setIsShuffling(true);

    setTimeout(() => {
      setMarketType(newType);
      setShuffleKey(prev => prev + 1);

      setTimeout(() => {
        setIsShuffling(false);
      }, 50);
    }, 200);
  };

  // City options for dropdown
  const cityOptions = MARKET_CITIES.map(city => ({
    value: city.slug,
    label: city.name,
  }));

  // Market type options
  const typeOptions = [
    { value: 'highest', label: 'Highest' },
    { value: 'lowest', label: 'Lowest' },
  ];

  // Check if low temp markets are available
  const lowMarketsAvailable = lowTempMarkets.some(m => m.topBrackets && m.topBrackets.length > 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-6">
      {/* Dynamic Section Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TrendingUp className="w-4 h-4 text-white/60" />
        <h2 className="text-lg font-semibold text-white flex items-center gap-1.5 flex-wrap">
          <Dropdown
            value={marketType}
            options={typeOptions}
            onChange={handleMarketTypeChange}
          />
          <span className="text-white/80">temperature in</span>
          <Dropdown
            value={selectedCity}
            options={cityOptions}
            onChange={handleCityChange}
          />
          <span className="text-white/80">today</span>
        </h2>
        {!loading && sortedMarkets.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 ml-2">
            {sortedMarkets.length} markets
          </span>
        )}
      </div>
      <p className="text-xs text-white/40 mb-4">
        {marketType === 'highest' ? 'Daily high' : 'Daily low'} temperature predictions
      </p>

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
      ) : !lowMarketsAvailable && marketType === 'lowest' ? (
        <div className="glass-widget p-8 text-center">
          <TrendingUp className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">No lowest temperature markets available</p>
          <p className="text-xs text-white/30 mt-1">These markets may not be active on Kalshi yet</p>
        </div>
      ) : (
        <div
          key={shuffleKey}
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {sortedMarkets.map((market, index) => (
            <MarketCardGlass
              key={market.slug}
              city={market}
              index={index}
              featured={market.slug === selectedCity}
              shuffling={isShuffling}
              shuffleDirection={index % 2 === 0 ? 1 : -1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MarketSection - Reusable section for a market category
 */
function MarketSection({
  title,
  subtitle,
  icon: Icon,
  markets,
  loading,
  noActiveMarkets = false
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-white/60" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {!loading && markets.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
            {markets.length} markets
          </span>
        )}
        {noActiveMarkets && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
            No Active Markets
          </span>
        )}
      </div>
      <p className="text-xs text-white/40 mb-4">{subtitle}</p>

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
      ) : noActiveMarkets ? (
        <div className="glass-widget p-8 text-center">
          <Icon className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">No active markets at this time</p>
          <p className="text-xs text-white/30 mt-1">Check back later for new markets</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
