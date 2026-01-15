import { useState, useEffect } from 'react';
import { Satellite, RotateCw, Maximize2 } from 'lucide-react';

const SATELLITE_PRODUCTS = {
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
};

/**
 * SatellitePreview - Compact GOES-19 satellite imagery for homepage
 */
export default function SatellitePreview({ onExpand }) {
  const [product, setProduct] = useState('geocolor');
  const [cacheKey, setCacheKey] = useState(Date.now());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheKey(Date.now());
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    setImageLoaded(false);
    setCacheKey(Date.now());
    setLastUpdate(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleProductChange = (e, newProduct) => {
    e.stopPropagation();
    setImageLoaded(false);
    setProduct(newProduct);
    setCacheKey(Date.now());
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const currentProduct = SATELLITE_PRODUCTS[product];
  const imageUrl = `${currentProduct.url}?t=${cacheKey}`;

  return (
    <div
      className="glass-widget glass-interactive overflow-hidden cursor-pointer group glass-animate-in"
      onClick={onExpand}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Satellite className="w-3 h-3 text-white/50" />
          <span className="text-[10px] text-white/50 uppercase tracking-wide font-medium">
            GOES-19
          </span>
        </div>

        {/* Product Selector */}
        <div className="flex gap-1">
          {Object.entries(SATELLITE_PRODUCTS).map(([key, { name }]) => (
            <button
              key={key}
              onClick={(e) => handleProductChange(e, key)}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                product === key
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-white/20 text-white/60 hover:bg-white/30'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[16/10] bg-slate-900/50">
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
            <Satellite className="w-8 h-8 text-white/20 animate-pulse" />
          </div>
        )}

        {/* Satellite Image */}
        <img
          src={imageUrl}
          alt={`GOES-19 ${currentProduct.name}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50">
            <Maximize2 className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">Click to expand</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-white/40">
          Updated {formatTime(lastUpdate)}
        </span>
        <button
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <RotateCw className={`w-3 h-3 text-white/40 hover:text-white/60 ${
            isRefreshing ? 'animate-spin' : ''
          }`} />
        </button>
      </div>
    </div>
  );
}
