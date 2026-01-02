import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to fetch CLI (Climatological Report) data from IEM
 * CLI is the official NWS settlement data for Kalshi markets
 *
 * @param {string} stationId - NWS station ID (e.g., "KNYC")
 * @returns {{ data, loading, error, refetch }}
 */
export function useCLIReport(stationId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!stationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const year = new Date().getFullYear();
      const url = `https://mesonet.agron.iastate.edu/json/cli.py?station=${stationId}&year=${year}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const results = json.results || [];

      if (results.length === 0) {
        setError('No CLI data available');
        setData(null);
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Find today's report, or fall back to the most recent
      let todayReport = results.find(r => r.valid === today);

      if (!todayReport) {
        // CLI may not be available yet today - use most recent
        // Results are sorted by date, get the last one
        todayReport = results[results.length - 1];
      }

      setData(todayReport);
    } catch (err) {
      console.error('[CLI] Error fetching CLI data:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
