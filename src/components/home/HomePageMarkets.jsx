import { useState, useContext, useMemo } from 'react';
import { TrendingUp, CloudRain, Snowflake, ChevronRight } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { KalshiMarketsContext } from '../../hooks/useAllKalshiMarkets.jsx';
import { useKalshiRainMarkets, RAIN_CITIES } from '../../hooks/useKalshiRainMarkets';
import { useKalshiSnowMarkets, SNOW_CITIES } from '../../hooks/useKalshiSnowMarkets';
import MarketCardGlass from './MarketCardGlass';
import AllMarketsModal from './AllMarketsModal';

/**
 * HomePageMarkets - Markets-focused homepage
 * Displays top 3 markets by volume for each category with "Show more"
 */
export default function HomePageMarkets() {
  const context = useContext(KalshiMarketsContext);
  const { loading: tempLoading, lastFetch, marketsData = {} } = context || {};

  // Fetch rain and snow markets
  const { markets: rainMarketsData, loading: rainLoading } = useKalshiRainMarkets();
  const { markets: snowMarketsData, loading: snowLoading } = useKalshiSnowMarkets();

  // Modal state
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [rainModalOpen, setRainModalOpen] = useState(false);
  const [snowModalOpen, setSnowModalOpen] = useState(false);

  // Sort cities by volume and get top 3
  const sortedTempMarkets = useMemo(() => {
    return MARKET_CITIES
      .map(city => ({
        ...city,
        ...marketsData[city.slug],
      }))
      .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
  }, [marketsData]);

  const top3TempMarkets = sortedTempMarkets.slice(0, 3);

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
      <MarketSection
        title="Temperature Markets"
        subtitle="Highest temperature predictions"
        icon={TrendingUp}
        markets={top3TempMarkets}
        allMarkets={sortedTempMarkets}
        loading={tempLoading}
        onShowMore={() => setTempModalOpen(true)}
        totalCount={MARKET_CITIES.length}
      />

      {/* Rain Markets Section */}
      <MarketSection
        title="Rain Markets"
        subtitle="Precipitation predictions"
        icon={CloudRain}
        markets={rainMarkets.slice(0, 3)}
        allMarkets={rainMarkets}
        loading={rainLoading}
        onShowMore={() => setRainModalOpen(true)}
        totalCount={RAIN_CITIES.length}
        noActiveMarkets={noRainMarkets}
      />

      {/* Snow Markets Section */}
      <MarketSection
        title="Snow Markets"
        subtitle="Snowfall predictions"
        icon={Snowflake}
        markets={snowMarkets.slice(0, 3)}
        allMarkets={snowMarkets}
        loading={snowLoading}
        onShowMore={() => setSnowModalOpen(true)}
        totalCount={SNOW_CITIES.length}
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

      {/* Modals */}
      <AllMarketsModal
        isOpen={tempModalOpen}
        onClose={() => setTempModalOpen(false)}
        title="All Temperature Markets"
        icon={TrendingUp}
        markets={sortedTempMarkets}
        type="temperature"
      />
      <AllMarketsModal
        isOpen={rainModalOpen}
        onClose={() => setRainModalOpen(false)}
        title="All Rain Markets"
        icon={CloudRain}
        markets={rainMarkets}
        type="rain"
      />
      <AllMarketsModal
        isOpen={snowModalOpen}
        onClose={() => setSnowModalOpen(false)}
        title="All Snow Markets"
        icon={Snowflake}
        markets={snowMarkets}
        type="snow"
      />
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
  allMarkets,
  loading,
  onShowMore,
  totalCount,
  noActiveMarkets = false
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/60" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {noActiveMarkets && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
              No Active Markets
            </span>
          )}
        </div>
        {!noActiveMarkets && markets.length > 0 && (
          <button
            onClick={onShowMore}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Show all {totalCount}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-white/40 mb-4">{subtitle}</p>

      {/* Markets Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(Math.min(3, totalCount))].map((_, i) => (
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
