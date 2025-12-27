/**
 * Vercel Serverless Function to proxy Kalshi API requests
 * This bypasses CORS restrictions in production
 */

export default async function handler(req, res) {
  // Get the path after /api/kalshi/
  const { path } = req.query;
  const kalshiPath = Array.isArray(path) ? path.join('/') : path;

  // Build the Kalshi API URL
  const kalshiUrl = `https://api.elections.kalshi.com/${kalshiPath}`;

  // Forward query parameters
  const url = new URL(kalshiUrl);
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') {
      url.searchParams.set(key, value);
    }
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

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Kalshi proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Kalshi API' });
  }
}
