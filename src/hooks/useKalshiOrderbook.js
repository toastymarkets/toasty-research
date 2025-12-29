import { useState, useEffect, useCallback } from 'react';

/**
 * Kalshi API proxy endpoint
 */
const KALSHI_PROXY = '/api/kalshi';
const KALSHI_PATH = 'trade-api/v2';

/**
 * Fetch orderbook data from Kalshi API
 * @param {string} ticker - Full market ticker (e.g., "KXHIGHNY-25DEC29-B45")
 */
async function fetchOrderbook(ticker) {
  const url = `${KALSHI_PROXY}?path=${KALSHI_PATH}/markets/${ticker}/orderbook`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.orderbook || data;
}

/**
 * Hook to fetch Kalshi orderbook data for a market
 * @param {string} ticker - Full market ticker
 * @param {boolean} enabled - Whether to fetch data
 */
export function useKalshiOrderbook(ticker, enabled = true) {
  const [orderbook, setOrderbook] = useState({ yesBids: [], noBids: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!ticker || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchOrderbook(ticker);

      // Parse orderbook data
      // Kalshi returns yes_bids and no_bids (or similar structure)
      const yesBids = (data.yes || []).map(order => ({
        price: order[0], // Price in cents
        quantity: order[1], // Number of contracts
      })).sort((a, b) => b.price - a.price); // Sort by price descending

      const noBids = (data.no || []).map(order => ({
        price: order[0],
        quantity: order[1],
      })).sort((a, b) => b.price - a.price);

      setOrderbook({ yesBids, noBids });
    } catch (err) {
      console.error('[useKalshiOrderbook] Error:', err);
      setError(err.message);
      setOrderbook({ yesBids: [], noBids: [] });
    } finally {
      setLoading(false);
    }
  }, [ticker, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate best bid/ask
  const bestYesBid = orderbook.yesBids[0]?.price || null;
  const bestNoBid = orderbook.noBids[0]?.price || null;

  // Calculate total depth
  const totalYesDepth = orderbook.yesBids.reduce((sum, o) => sum + o.quantity, 0);
  const totalNoDepth = orderbook.noBids.reduce((sum, o) => sum + o.quantity, 0);

  return {
    orderbook,
    yesBids: orderbook.yesBids,
    noBids: orderbook.noBids,
    bestYesBid,
    bestNoBid,
    totalYesDepth,
    totalNoDepth,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useKalshiOrderbook;
