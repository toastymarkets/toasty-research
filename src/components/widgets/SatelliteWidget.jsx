import { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

const SATELLITE_PRODUCTS = {
  airmass: {
    name: 'Air Mass',
    still: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/AirMass/latest.jpg',
    animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-AirMass-625x375.gif',
  },
  geocolor: {
    name: 'GeoColor',
    still: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/latest.jpg',
    animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-GEOCOLOR-625x375.gif',
  },
  watervapor: {
    name: 'Water Vapor',
    still: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/10/latest.jpg',
    animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-10-625x375.gif',
  },
  infrared: {
    name: 'Infrared',
    still: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/13/latest.jpg',
    animated: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/GIFS/GOES19-CONUS-13-625x375.gif',
  },
};

export default function SatelliteWidget() {
  const [activeTab, setActiveTab] = useState('airmass');
  const [isAnimated, setIsAnimated] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update image URL when tab or mode changes
  useEffect(() => {
    updateImageUrl();
  }, [activeTab, isAnimated]);

  // Auto-refresh every 5 minutes (only in still mode)
  useEffect(() => {
    if (!isAnimated) {
      const interval = setInterval(() => {
        updateImageUrl();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [isAnimated, activeTab]);

  const updateImageUrl = () => {
    const product = SATELLITE_PRODUCTS[activeTab];
    const baseUrl = isAnimated ? product.animated : product.still;

    // Add cache-busting parameter for still images
    const url = isAnimated
      ? baseUrl
      : `${baseUrl}?t=${Date.now()}`;

    setImageUrl(url);
    setLastUpdate(new Date());
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    updateImageUrl();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="card-elevated p-4">
      {/* Header with Title and Animation Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-[var(--color-text-primary)]">
          Satellite Imagery
        </h3>

        {/* Still/Animated Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-border)]">
          <button
            onClick={() => setIsAnimated(false)}
            className={`px-3 py-1 text-sm font-medium rounded transition-all ${
              !isAnimated
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Still
          </button>
          <button
            onClick={() => setIsAnimated(true)}
            className={`px-3 py-1 text-sm font-medium rounded transition-all ${
              isAnimated
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Animated
          </button>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {Object.entries(SATELLITE_PRODUCTS).map(([key, product]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-orange-500/50 hover:text-[var(--color-text-primary)]'
            }`}
          >
            {product.name}
          </button>
        ))}
      </div>

      {/* Satellite Image */}
      <div className="relative rounded-lg overflow-hidden bg-[var(--color-card-bg)] border border-[var(--color-border)] mb-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`${SATELLITE_PRODUCTS[activeTab].name} satellite imagery`}
            className="w-full h-auto"
            loading="lazy"
          />
        )}
      </div>

      {/* Footer - Timestamp and Refresh (only in Still mode) */}
      {!isAnimated && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>
            {lastUpdate && `Last updated: ${formatTime(lastUpdate)}`}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-card-bg)] hover:text-orange-500 transition-all disabled:opacity-50"
            title="Refresh image"
          >
            <RotateCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      )}

      {/* Info text for Animated mode */}
      {isAnimated && (
        <div className="text-xs text-[var(--color-text-muted)] text-center">
          Showing 4-hour loop
        </div>
      )}
    </div>
  );
}
