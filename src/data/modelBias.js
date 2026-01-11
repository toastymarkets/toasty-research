/**
 * Model Bias Data - City-specific historical bias corrections
 *
 * Source: Historical verification data and meteorological research.
 *
 * bias: Average temperature error (positive = runs warm, negative = runs cold)
 * confidence: How reliable is this bias estimate? (high/medium/low)
 * star: Is this the best-performing model for this city?
 * note: Brief explanation of the bias
 * seasonalBias: Optional seasonal variations
 */

export const MODEL_BIAS = {
  'los-angeles': {
    GFS: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Tends warm; struggles with marine layer timing',
      seasonalBias: { summer: +2, winter: 0 },
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for LA - bias-corrected for coastal effects',
    },
    ECMWF: {
      bias: -1,
      confidence: 'medium',
      star: false,
      note: 'Slightly cold; good for synoptic patterns',
    },
    ICON: {
      bias: +1,
      confidence: 'low',
      star: false,
      note: 'Limited LA-specific tuning',
    },
    GEM: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Generally neutral for SoCal',
    },
    JMA: {
      bias: -1,
      confidence: 'low',
      star: false,
      note: 'Pacific model; useful for offshore patterns',
    },
  },

  'chicago': {
    GFS: {
      bias: 0,
      confidence: 'high',
      star: false,
      note: 'Performs well in continental interior',
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for Chicago - excellent lake effect handling',
    },
    ECMWF: {
      bias: -1,
      confidence: 'medium',
      star: false,
      note: 'Tends cold in winter; good storm tracking',
      seasonalBias: { winter: -2, summer: 0 },
    },
    ICON: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Slightly warm in continental setups',
    },
    GEM: {
      bias: 0,
      confidence: 'high',
      star: false,
      note: 'Good for Great Lakes region',
    },
    JMA: {
      bias: 0,
      confidence: 'low',
      star: false,
      note: 'Neutral but less reliable for Midwest',
    },
  },

  'new-york': {
    GFS: {
      bias: 0,
      confidence: 'high',
      star: false,
      note: 'Good baseline; watch for coastal storm errors',
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for NYC - urban heat island corrections',
    },
    ECMWF: {
      bias: -1,
      confidence: 'high',
      star: false,
      note: 'Gold standard for Nor\'easters',
    },
    ICON: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Reliable for Northeast',
    },
    GEM: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Can be warm in summer',
    },
    JMA: {
      bias: 0,
      confidence: 'low',
      star: false,
      note: 'Independent check on Atlantic patterns',
    },
  },

  'miami': {
    GFS: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Struggles with tropical convection timing',
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for Miami - handles sea breeze well',
    },
    ECMWF: {
      bias: 0,
      confidence: 'high',
      star: false,
      note: 'Excellent tropical modeling',
    },
    ICON: {
      bias: +1,
      confidence: 'low',
      star: false,
      note: 'Less reliable for subtropical',
    },
    GEM: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Neutral for Florida',
    },
    JMA: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Good for tracking tropical systems',
    },
  },

  'denver': {
    GFS: {
      bias: +2,
      confidence: 'medium',
      star: false,
      note: 'Consistently warm; struggles with downslope',
      seasonalBias: { winter: +3, summer: +1 },
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for Denver - corrects for elevation',
    },
    ECMWF: {
      bias: -1,
      confidence: 'medium',
      star: false,
      note: 'Slightly cold; good storm tracking',
    },
    ICON: {
      bias: +1,
      confidence: 'low',
      star: false,
      note: 'Limited mountain terrain handling',
    },
    GEM: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Good for Alberta Clipper tracking',
    },
    JMA: {
      bias: 0,
      confidence: 'low',
      star: false,
      note: 'Less reliable for Rockies',
    },
  },

  'austin': {
    GFS: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Slightly warm in summer',
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for Austin - handles Texas convection',
    },
    ECMWF: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Good for frontal passages',
    },
    ICON: {
      bias: +1,
      confidence: 'low',
      star: false,
      note: 'Limited Texas tuning',
    },
    GEM: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Neutral for Central Texas',
    },
    JMA: {
      bias: 0,
      confidence: 'low',
      star: false,
      note: 'Useful for Gulf patterns',
    },
  },

  'philadelphia': {
    GFS: {
      bias: 0,
      confidence: 'high',
      star: false,
      note: 'Reliable for Mid-Atlantic',
    },
    NBM: {
      bias: 0,
      confidence: 'high',
      star: true,
      note: 'Best for Philly - urban corrections',
    },
    ECMWF: {
      bias: -1,
      confidence: 'high',
      star: false,
      note: 'Excellent for coastal storms',
    },
    ICON: {
      bias: 0,
      confidence: 'medium',
      star: false,
      note: 'Reliable for region',
    },
    GEM: {
      bias: +1,
      confidence: 'medium',
      star: false,
      note: 'Can be warm',
    },
    JMA: {
      bias: 0,
      confidence: 'low',
      star: false,
      note: 'Independent verification',
    },
  },
};

/**
 * Get bias data for a specific model and city
 */
export function getModelBias(citySlug, modelName) {
  return MODEL_BIAS[citySlug]?.[modelName] || null;
}

/**
 * Get the "star" model for a city (most accurate)
 */
export function getStarModel(citySlug) {
  const cityBias = MODEL_BIAS[citySlug];
  if (!cityBias) return 'NBM'; // Default to NBM

  const starEntry = Object.entries(cityBias).find(([, data]) => data.star);
  return starEntry ? starEntry[0] : 'NBM';
}

/**
 * Apply bias correction to a model forecast
 */
export function applyBiasCorrection(citySlug, modelName, temperature) {
  const bias = getModelBias(citySlug, modelName);
  if (!bias || temperature == null) return temperature;
  return temperature - bias.bias; // Subtract bias to get corrected value
}

export default MODEL_BIAS;
