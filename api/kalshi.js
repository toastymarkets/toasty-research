/**
 * Vercel Serverless Function to proxy Kalshi API requests
 * Route: /api/kalshi?path=trade-api/v2/markets&series_ticker=KXHIGHNY
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path from query
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  // Build the Kalshi API URL
  const url = new URL(`https://api.elections.kalshi.com/${path}`);

  // Forward query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Kalshi proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Kalshi API' });
  }
}
