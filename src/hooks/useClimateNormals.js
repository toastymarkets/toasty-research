import { useMemo } from 'react';

/**
 * NOAA 1991-2020 Climate Normals - Monthly Precipitation (inches)
 * Source: NCEI Climate Normals (https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals)
 * Data is static and only updates every 10 years (next update: 2031)
 *
 * Station mappings match IEM stations used in useMonthlyPrecipitation.js
 */
const CLIMATE_NORMALS = {
  // New York - JFK Airport (KJFK) 1991-2020 normals
  'new-york': {
    station: 'JFK Airport',
    annual: 46.23,
    monthly: [3.65, 3.11, 4.21, 3.96, 3.96, 4.03, 4.53, 4.05, 4.09, 3.77, 3.50, 3.37],
  },

  // Chicago - Midway (KMDW) 1991-2020 normals
  'chicago': {
    station: 'Chicago Midway',
    annual: 38.19,
    monthly: [2.06, 1.94, 2.62, 3.60, 4.13, 4.10, 3.87, 4.10, 3.30, 3.19, 2.98, 2.30],
  },

  // Los Angeles - LAX (KLAX) 1991-2020 normals
  'los-angeles': {
    station: 'LAX Airport',
    annual: 14.93,
    monthly: [3.12, 3.80, 2.43, 0.73, 0.25, 0.07, 0.02, 0.03, 0.18, 0.62, 1.04, 2.64],
  },

  // Miami - Miami Intl (KMIA) 1991-2020 normals
  'miami': {
    station: 'Miami Intl',
    annual: 61.93,
    monthly: [1.88, 2.24, 2.89, 3.36, 5.52, 9.69, 6.50, 8.63, 9.84, 6.34, 3.26, 1.78],
  },

  // Denver - Denver Intl (KDEN) 1991-2020 normals
  'denver': {
    station: 'Denver Intl',
    annual: 15.81,
    monthly: [0.40, 0.37, 1.14, 1.76, 2.32, 1.98, 2.17, 1.93, 1.28, 1.00, 0.73, 0.73],
  },

  // Austin - Austin Airport (KAUS) 1991-2020 normals
  'austin': {
    station: 'Austin Airport',
    annual: 34.32,
    monthly: [2.22, 2.01, 2.75, 2.44, 4.95, 4.05, 1.97, 2.29, 3.23, 3.99, 2.65, 1.77],
  },

  // Philadelphia - Philadelphia Intl (KPHL) 1991-2020 normals
  'philadelphia': {
    station: 'Philadelphia Intl',
    annual: 42.99,
    monthly: [3.15, 2.66, 3.68, 3.47, 3.43, 3.72, 4.39, 3.49, 4.15, 3.46, 3.14, 3.25],
  },

  // Houston - Hobby Airport (KHOU) 1991-2020 normals
  'houston': {
    station: 'Houston Hobby',
    annual: 53.78,
    monthly: [3.68, 3.04, 3.55, 3.62, 5.15, 5.94, 4.30, 4.81, 5.17, 5.58, 4.41, 4.53],
  },

  // Seattle - Seattle-Tacoma (KSEA) 1991-2020 normals
  'seattle': {
    station: 'Seattle-Tacoma',
    annual: 37.49,
    monthly: [5.13, 3.51, 3.72, 2.59, 2.06, 1.51, 0.70, 0.93, 1.63, 3.48, 5.67, 6.56],
  },

  // San Francisco - SFO (KSFO) 1991-2020 normals
  'san-francisco': {
    station: 'SFO Airport',
    annual: 20.65,
    monthly: [4.40, 4.01, 3.26, 1.46, 0.59, 0.15, 0.02, 0.06, 0.21, 1.04, 2.36, 3.09],
  },

  // Boston - Logan Airport (KBOS) 1991-2020 normals
  'boston': {
    station: 'Boston Logan',
    annual: 47.41,
    monthly: [3.36, 3.25, 4.32, 3.74, 3.45, 3.72, 3.38, 3.37, 3.47, 4.10, 3.98, 4.27],
  },

  // Washington DC - Reagan National (KDCA) 1991-2020 normals
  'washington-dc': {
    station: 'Reagan National',
    annual: 42.52,
    monthly: [2.93, 2.62, 3.60, 3.22, 3.82, 3.88, 3.99, 3.17, 3.83, 3.37, 3.07, 3.02],
  },

  // Dallas - DFW (KDFW) 1991-2020 normals
  'dallas': {
    station: 'Dallas-Fort Worth',
    annual: 36.95,
    monthly: [2.21, 2.47, 3.44, 3.11, 4.88, 4.00, 2.17, 2.23, 3.06, 4.31, 2.88, 2.19],
  },

  // Detroit - Detroit Metro (KDTW) 1991-2020 normals
  'detroit': {
    station: 'Detroit Metro',
    annual: 34.66,
    monthly: [2.08, 2.00, 2.33, 3.18, 3.49, 3.46, 3.27, 3.07, 3.27, 2.80, 2.89, 2.82],
  },

  // Salt Lake City (KSLC) 1991-2020 normals
  'salt-lake-city': {
    station: 'Salt Lake City',
    annual: 16.50,
    monthly: [1.22, 1.21, 1.77, 2.04, 1.93, 0.97, 0.66, 0.70, 1.17, 1.54, 1.47, 1.82],
  },

  // New Orleans - Louis Armstrong (KMSY) 1991-2020 normals
  'new-orleans': {
    station: 'New Orleans Intl',
    annual: 64.16,
    monthly: [5.22, 4.87, 4.79, 4.54, 4.79, 7.51, 6.28, 6.21, 5.32, 4.13, 4.43, 6.07],
  },
};

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Hook to get 30-year climate normals for precipitation
 *
 * @param {string} citySlug - City slug (e.g., 'los-angeles')
 * @returns {{
 *   monthlyNormals: Array<{month: number, monthName: string, monthAbbrev: string, precipitation: number}>,
 *   currentMonthNormal: number,
 *   annualNormal: number,
 *   stationName: string,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useClimateNormals(citySlug) {
  return useMemo(() => {
    const normals = CLIMATE_NORMALS[citySlug];

    if (!normals) {
      return {
        monthlyNormals: [],
        currentMonthNormal: null,
        annualNormal: null,
        stationName: null,
        loading: false,
        error: `No climate normals available for ${citySlug}`,
      };
    }

    // Build monthly normals array with names
    const monthlyNormals = normals.monthly.map((precip, index) => ({
      month: index + 1, // 1-indexed
      monthName: MONTH_NAMES[index],
      monthAbbrev: MONTH_ABBREVS[index],
      precipitation: precip,
    }));

    // Get current month's normal (0-indexed)
    const currentMonth = new Date().getMonth();
    const currentMonthNormal = normals.monthly[currentMonth];

    return {
      monthlyNormals,
      currentMonthNormal,
      annualNormal: normals.annual,
      stationName: normals.station,
      loading: false,
      error: null,
    };
  }, [citySlug]);
}

/**
 * Get the climate normal for a specific month
 *
 * @param {string} citySlug - City slug
 * @param {number} month - Month (1-12)
 * @returns {number|null} - Precipitation normal in inches, or null if not found
 */
export function getMonthlyNormal(citySlug, month) {
  const normals = CLIMATE_NORMALS[citySlug];
  if (!normals || month < 1 || month > 12) return null;
  return normals.monthly[month - 1];
}

/**
 * Get list of supported cities
 */
export function getSupportedCities() {
  return Object.keys(CLIMATE_NORMALS);
}

export default useClimateNormals;
