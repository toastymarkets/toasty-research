/**
 * Edge Calculator - Compare model probability vs market price
 *
 * The core of quant meteorology trading: find where the market
 * is mispricing temperature outcomes based on model consensus.
 */

/**
 * Calculate the probability distribution across temperature brackets
 * based on model forecasts.
 *
 * Uses a Gaussian distribution centered on each model's forecast
 * with uncertainty proportional to model spread.
 *
 * @param {Array} models - Array of model forecasts with daily[0].high
 * @param {Array} brackets - Array of market brackets with label (e.g., "70-71°")
 * @returns {Object} Map of bracket label -> probability (0-100)
 */
export function calculateModelProbabilities(models, brackets) {
  if (!models?.length || !brackets?.length) return {};

  // Extract model high temperatures for today
  const modelHighs = models
    .map(m => m.daily?.[0]?.high)
    .filter(h => h != null);

  if (modelHighs.length === 0) return {};

  // Calculate mean and standard deviation
  const mean = modelHighs.reduce((a, b) => a + b, 0) / modelHighs.length;
  const variance = modelHighs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / modelHighs.length;
  const stdDev = Math.sqrt(variance) || 1.5; // Minimum 1.5° uncertainty

  const probabilities = {};

  brackets.forEach(bracket => {
    const range = parseBracketRange(bracket.label);
    if (!range) {
      probabilities[bracket.label] = 0;
      return;
    }

    // Calculate probability using CDF of normal distribution
    const prob = normalCDF(range.max, mean, stdDev) - normalCDF(range.min, mean, stdDev);
    probabilities[bracket.label] = Math.round(prob * 100);
  });

  // Normalize to ensure probabilities sum to 100
  const total = Object.values(probabilities).reduce((a, b) => a + b, 0);
  if (total > 0) {
    Object.keys(probabilities).forEach(key => {
      probabilities[key] = Math.round((probabilities[key] / total) * 100);
    });
  }

  return probabilities;
}

/**
 * Parse bracket label to get min/max temperature range
 *
 * Handles formats:
 * - "70-71°" or "70° to 71°" -> { min: 70, max: 71 }
 * - "≤63°" or "63° or below" -> { min: -Infinity, max: 63 }
 * - "≥72°" or "72° or above" -> { min: 72, max: Infinity }
 */
function parseBracketRange(label) {
  if (!label) return null;

  // Handle "≤X°" or "X° or below"
  const belowMatch = label.match(/(?:≤|<=?)(\d+)|(\d+)°?\s*or\s*below/i);
  if (belowMatch) {
    const temp = parseInt(belowMatch[1] || belowMatch[2], 10);
    return { min: -100, max: temp }; // Use -100 instead of -Infinity for math
  }

  // Handle "≥X°" or "X° or above"
  const aboveMatch = label.match(/(?:≥|>=?)(\d+)|(\d+)°?\s*or\s*above/i);
  if (aboveMatch) {
    const temp = parseInt(aboveMatch[1] || aboveMatch[2], 10);
    return { min: temp, max: 150 }; // Use 150 instead of Infinity for math
  }

  // Handle "X-Y°" or "X° to Y°"
  const rangeMatch = label.match(/(\d+)°?\s*(?:-|to)\s*(\d+)/i);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10) + 1, // Add 1 for inclusive upper bound
    };
  }

  return null;
}

/**
 * Normal distribution CDF (cumulative distribution function)
 */
function normalCDF(x, mean, stdDev) {
  const z = (x - mean) / stdDev;
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

/**
 * Error function approximation (for normal CDF)
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate edge between model probability and market price
 *
 * @param {number} modelProb - Model-derived probability (0-100)
 * @param {number} marketPrice - Market price/probability (0-100)
 * @returns {Object} { edge: number, signal: 'underpriced' | 'overpriced' | 'fair', magnitude: 'small' | 'medium' | 'large' }
 */
export function calculateEdge(modelProb, marketPrice) {
  if (modelProb == null || marketPrice == null) {
    return { edge: 0, signal: 'fair', magnitude: 'small' };
  }

  const edge = modelProb - marketPrice;
  const absEdge = Math.abs(edge);

  let signal = 'fair';
  if (edge > 5) signal = 'underpriced'; // Market undervaluing this outcome
  if (edge < -5) signal = 'overpriced'; // Market overvaluing this outcome

  let magnitude = 'small';
  if (absEdge > 10) magnitude = 'medium';
  if (absEdge > 20) magnitude = 'large';

  return { edge, signal, magnitude };
}

/**
 * Calculate edges for all brackets
 *
 * @param {Array} models - Model forecasts
 * @param {Array} brackets - Market brackets with yesPrice
 * @returns {Object} Map of bracket ticker -> edge info
 */
export function calculateAllEdges(models, brackets) {
  const modelProbs = calculateModelProbabilities(models, brackets);
  const edges = {};

  brackets.forEach(bracket => {
    const modelProb = modelProbs[bracket.label] || 0;
    const marketPrice = bracket.yesPrice || 0;
    edges[bracket.ticker] = {
      ...calculateEdge(modelProb, marketPrice),
      modelProb,
      marketPrice,
    };
  });

  return edges;
}

/**
 * Find brackets with significant edge
 *
 * @param {Array} models - Model forecasts
 * @param {Array} brackets - Market brackets
 * @param {number} minEdge - Minimum edge to consider significant (default 10%)
 * @returns {Array} Brackets with significant edge, sorted by edge magnitude
 */
export function findSignificantEdges(models, brackets, minEdge = 10) {
  const edges = calculateAllEdges(models, brackets);

  return brackets
    .map(bracket => ({
      ...bracket,
      edge: edges[bracket.ticker],
    }))
    .filter(b => Math.abs(b.edge?.edge || 0) >= minEdge)
    .sort((a, b) => Math.abs(b.edge?.edge || 0) - Math.abs(a.edge?.edge || 0));
}

/**
 * Get model consensus statistics
 *
 * @param {Array} models - Model forecasts
 * @returns {Object} { mean, min, max, spread, confidence }
 */
export function getModelConsensus(models) {
  if (!models?.length) {
    return { mean: null, min: null, max: null, spread: null, confidence: 'unknown' };
  }

  const highs = models
    .map(m => m.daily?.[0]?.high)
    .filter(h => h != null);

  if (highs.length === 0) {
    return { mean: null, min: null, max: null, spread: null, confidence: 'unknown' };
  }

  const mean = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);
  const min = Math.min(...highs);
  const max = Math.max(...highs);
  const spread = max - min;

  let confidence = 'high';
  if (spread > 3) confidence = 'medium';
  if (spread > 6) confidence = 'low';

  return { mean, min, max, spread, confidence };
}

export default {
  calculateModelProbabilities,
  calculateEdge,
  calculateAllEdges,
  findSignificantEdges,
  getModelConsensus,
};
