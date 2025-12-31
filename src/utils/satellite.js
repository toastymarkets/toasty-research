/**
 * GOES Satellite Image Utilities
 *
 * Shared utilities for generating and loading GOES satellite imagery.
 * Used by WeatherMap and MapWidgetPopup components.
 */

/**
 * Get GOES satellite configuration based on location
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @returns {{ satellite: string, sector: string }}
 */
export function getGOESConfig(lon, lat) {
  const isPacificCoast = lon < -115 || (lat > 42 && lon < -104);
  const satellite = isPacificCoast ? 'GOES18' : 'GOES19';

  let sector;
  if (lat > 42 && lon < -104) sector = 'pnw';
  else if (lon < -115) sector = 'psw';
  else if (lon < -104) sector = 'nr';
  else if (lat > 40 && lon > -85) sector = 'ne';
  else if (lat > 37 && lon < -82) sector = 'umv';
  else if (lat < 30 && lon > -90) sector = 'se';
  else if (lon < -90) sector = 'sp';
  else sector = 'ne';

  return { satellite, sector };
}

/**
 * Get available sectors for a location
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @returns {Array<{ id: string, label: string, size: string, satellite: string }>}
 */
export function getAvailableSectors(lon, lat) {
  const config = getGOESConfig(lon, lat);
  const isPacificCoast = config.satellite === 'GOES18';

  return isPacificCoast
    ? [
        { id: config.sector, label: 'Local', size: '1200x1200', satellite: 'GOES18' },
        { id: 'tpw', label: 'Pacific', size: '1800x1080', satellite: 'GOES18' },
      ]
    : [
        { id: config.sector, label: 'Local', size: '1200x1200', satellite: 'GOES19' },
        { id: 'eus', label: 'East US', size: '1800x1080', satellite: 'GOES19' },
      ];
}

/**
 * Generate GOES frame URL for a given time offset
 * @param {string} satellite - GOES18 or GOES19
 * @param {string} sector - Sector code (ne, se, pnw, etc.)
 * @param {string} band - Image band (GEOCOLOR, etc.)
 * @param {string} imageSize - Image dimensions (1200x1200, 1800x1080)
 * @param {number} minutesAgo - Minutes in the past
 * @returns {string} URL to the satellite image
 */
export function generateFrameUrl(satellite, sector, band, imageSize, minutesAgo) {
  const frameTime = new Date(Date.now() - minutesAgo * 60 * 1000);
  const mins = frameTime.getUTCMinutes();
  const isRegional = imageSize !== '1200x1200';

  let roundedMins = isRegional
    ? Math.round(mins / 10) * 10
    : mins - (mins % 5) + (mins % 5 < 3 ? 1 : 6);

  if (roundedMins >= 60) {
    roundedMins -= 60;
    frameTime.setUTCHours(frameTime.getUTCHours() + 1);
  }
  frameTime.setUTCMinutes(roundedMins);
  frameTime.setSeconds(0);

  const year = frameTime.getUTCFullYear();
  const dayOfYear = Math.floor((frameTime - new Date(Date.UTC(year, 0, 0))) / 86400000);
  const timestamp = `${year}${String(dayOfYear).padStart(3, '0')}${String(frameTime.getUTCHours()).padStart(2, '0')}${String(roundedMins).padStart(2, '0')}`;

  return `https://cdn.star.nesdis.noaa.gov/${satellite}/ABI/SECTOR/${sector}/${band}/${timestamp}_${satellite}-ABI-${sector}-${band}-${imageSize}.jpg`;
}

/**
 * Preload an image and return promise
 * @param {string} url - Image URL to preload
 * @returns {Promise<string|null>} Resolves with URL on success, null on error
 */
export function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
