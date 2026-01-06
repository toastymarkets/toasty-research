import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to fetch NWS Public Information Statements (PNS) for a forecast office
 *
 * PNS products contain:
 * - Record-breaking weather events
 * - Climate summaries (rainfall totals, temperature records)
 * - Storm reports with detailed measurements
 * - Public education and service announcements
 */
export function useNWSBulletins(forecastOffice, enabled = true) {
  const [bulletins, setBulletins] = useState([]);
  const [latestBulletin, setLatestBulletin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBulletins = useCallback(async () => {
    if (!forecastOffice || !enabled) return;

    const cacheKey = `nws_pns_${forecastOffice}`;

    // Check cache (30 min expiration)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setBulletins(data.bulletins || []);
          setLatestBulletin(data.latest || null);
          setLoading(false);
          return;
        }
      }
    } catch (e) { /* ignore */ }

    setLoading(true);
    setError(null);

    try {
      // Get PNS list for office
      const listRes = await fetch(
        `https://api.weather.gov/products/types/PNS/locations/${forecastOffice}`,
        { headers: { 'User-Agent': 'Toasty Research App' } }
      );

      if (!listRes.ok) throw new Error('Failed to fetch bulletins list');

      const listData = await listRes.json();
      const pnsList = listData['@graph'] || [];

      // Get last 5 bulletins (for list view)
      const recentBulletins = pnsList.slice(0, 5).map(pns => ({
        id: pns.id,
        issuanceTime: pns.issuanceTime,
        url: pns['@id'],
      }));

      setBulletins(recentBulletins);

      // Fetch the latest bulletin content
      let latestBulletinData = null;
      if (pnsList.length > 0) {
        const latestPns = pnsList[0];
        const contentRes = await fetch(latestPns['@id'], {
          headers: { 'User-Agent': 'Toasty Research App' }
        });

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          const parsed = parsePNSContent(contentData.productText || '');

          latestBulletinData = {
            id: latestPns.id,
            issuanceTime: latestPns.issuanceTime,
            rawText: contentData.productText,
            ...parsed,
          };
          setLatestBulletin(latestBulletinData);
        }
      }

      // Cache the results (use local variable, not state which is async)
      localStorage.setItem(cacheKey, JSON.stringify({
        data: {
          bulletins: recentBulletins,
          latest: latestBulletinData,
        },
        timestamp: Date.now(),
      }));

    } catch (err) {
      console.error('Error fetching NWS bulletins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forecastOffice, enabled]);

  useEffect(() => {
    fetchBulletins();
  }, [fetchBulletins]);

  // Check if there's a "fresh" bulletin (within last 24 hours)
  const hasFreshBulletin = latestBulletin?.issuanceTime
    ? (Date.now() - new Date(latestBulletin.issuanceTime).getTime()) < 24 * 60 * 60 * 1000
    : false;

  return {
    bulletins,
    latestBulletin,
    hasFreshBulletin,
    loading,
    error,
    refetch: fetchBulletins,
  };
}

/**
 * Parse PNS content into structured format
 */
function parsePNSContent(text) {
  if (!text) return { headlines: [], body: '', office: '', timestamp: '' };

  const lines = text.split('\n');

  // Extract office and timestamp from header
  let office = '';
  let timestamp = '';
  let bodyStart = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line.includes('National Weather Service')) {
      office = line.replace('National Weather Service', '').trim();
    }
    if (line.match(/\d{1,2}:\d{2}\s*(AM|PM)\s+[A-Z]{3}/i)) {
      timestamp = line.trim();
      bodyStart = i + 1;
    }
  }

  // Extract headlines (text wrapped in ...)
  const headlines = [];
  const headlineRegex = /\.\.\.([^.]+)\.\.\./g;
  let match;
  while ((match = headlineRegex.exec(text)) !== null) {
    headlines.push(match[1].trim());
  }

  // Get body text (skip header and terminator)
  const bodyLines = [];
  let inBody = false;

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at start
    if (!inBody && !line) continue;

    // End at $$ or repeated &&
    if (line === '$$' || line === '&&') break;

    inBody = true;
    bodyLines.push(line);
  }

  const body = bodyLines.join('\n').trim();

  return {
    headlines,
    body,
    office,
    timestamp,
  };
}

/**
 * Format relative time for bulletin
 */
export function formatBulletinTime(isoTime) {
  if (!isoTime) return '';

  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default useNWSBulletins;
