import { useState, useEffect, useCallback } from 'react';

/**
 * Map city slugs to IEM network and station IDs
 * IEM uses state-based ASOS networks
 */
const CITY_IEM_CONFIG = {
  'new-york': { network: 'NY_ASOS', station: 'NYC', name: 'Central Park' },
  'chicago': { network: 'IL_ASOS', station: 'MDW', name: 'Midway' },
  'los-angeles': { network: 'CA_ASOS', station: 'LAX', name: 'LAX Airport' },
  'miami': { network: 'FL_ASOS', station: 'MIA', name: 'Miami Intl' },
  'denver': { network: 'CO_ASOS', station: 'DEN', name: 'Denver Intl' },
  'austin': { network: 'TX_ASOS', station: 'AUS', name: 'Austin Airport' },
  'philadelphia': { network: 'PA_ASOS', station: 'PHL', name: 'Philadelphia Intl' },
  'houston': { network: 'TX_ASOS', station: 'HOU', name: 'Hobby Airport' },
  'seattle': { network: 'WA_ASOS', station: 'SEA', name: 'Seattle-Tacoma' },
  'san-francisco': { network: 'CA_ASOS', station: 'SFO', name: 'SFO Airport' },
  'boston': { network: 'MA_ASOS', station: 'BOS', name: 'Logan Airport' },
  'washington-dc': { network: 'VA_ASOS', station: 'DCA', name: 'Reagan National' },
  'dallas': { network: 'TX_ASOS', station: 'DFW', name: 'DFW Airport' },
  'detroit': { network: 'MI_ASOS', station: 'DTW', name: 'Detroit Metro' },
  'salt-lake-city': { network: 'UT_ASOS', station: 'SLC', name: 'Salt Lake City' },
  'atlanta': { network: 'GA_ASOS', station: 'ATL', name: 'Hartsfield-Jackson' },
  'charlotte': { network: 'NC_ASOS', station: 'CLT', name: 'Charlotte Douglas' },
  'jacksonville': { network: 'FL_ASOS', station: 'JAX', name: 'Jacksonville Intl' },
  'las-vegas': { network: 'NV_ASOS', station: 'LAS', name: 'McCarran Intl' },
  'minneapolis': { network: 'MN_ASOS', station: 'MSP', name: 'Minneapolis-St. Paul' },
  'nashville': { network: 'TN_ASOS', station: 'BNA', name: 'Nashville Intl' },
  'oklahoma-city': { network: 'OK_ASOS', station: 'OKC', name: 'Will Rogers' },
  'phoenix': { network: 'AZ_ASOS', station: 'PHX', name: 'Sky Harbor' },
  'san-antonio': { network: 'TX_ASOS', station: 'SAT', name: 'San Antonio Intl' },
  'tampa': { network: 'FL_ASOS', station: 'TPA', name: 'Tampa Intl' },
};

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Hook to fetch Daily Summary Message (DSM) data from IEM
 *
 * The DSM contains daily observations including high/low temperatures,
 * precipitation, wind, and humidity data. This is interim data -
 * official settlement uses CLI reports.
 *
 * @param {string} citySlug - City slug (e.g., 'new-york')
 * @param {Date} date - Date to fetch data for (defaults to today)
 * @returns {{ data, loading, error, refetch, stationName, station }}
 */
export function useDSM(citySlug, date = new Date()) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = CITY_IEM_CONFIG[citySlug];

  const fetchData = useCallback(async () => {
    if (!config) {
      setError('No IEM config for this city');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateStr = formatDate(date);
      const url = `https://mesonet.agron.iastate.edu/api/1/daily.json?network=${config.network}&station=${config.station}&date=${dateStr}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const records = json.data || [];

      if (records.length === 0) {
        setError('No data available');
        setData(null);
      } else {
        // Enhance data with formatted values
        const record = records[0];
        setData({
          ...record,
          // Add formatted values for convenience
          highF: record.max_tmpf,
          lowF: record.min_tmpf,
          feelsHighF: record.max_feel,
          feelsLowF: record.min_feel,
          precip: record.precip,
          avgWindMph: record.avg_sknt ? record.avg_sknt * 1.15078 : null, // Convert knots to mph
          maxWindMph: record.max_sknt ? record.max_sknt * 1.15078 : null,
          avgRh: record.avg_rh,
          minRh: record.min_rh,
          maxRh: record.max_rh,
        });
      }
    } catch (err) {
      console.error('[DSM] Error fetching DSM data:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [config, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    stationName: config?.name,
    station: config?.station,
    network: config?.network,
  };
}

/**
 * Get IEM config for a city
 * @param {string} citySlug - City slug
 * @returns {Object|null} - IEM config or null
 */
export function getIEMConfig(citySlug) {
  return CITY_IEM_CONFIG[citySlug] || null;
}

export default useDSM;
