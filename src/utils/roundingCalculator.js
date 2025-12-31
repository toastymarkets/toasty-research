/**
 * NWS Temperature Rounding Calculator
 *
 * Two data types with different rounding processes:
 *
 * ASOS 5-Minute (F→C→F double conversion):
 * 1. Precise F → Round to whole °F (OMO)
 * 2. Convert to °C: (F - 32) × 5/9
 * 3. Round to whole °C
 * 4. Convert back to °F: (C × 9/5) + 32 (shown on NWS Graph)
 * 5. Round to whole °F (shown on NWS List)
 * Uncertainty: ~±1°F
 *
 * METAR Hourly (C→F single conversion):
 * 1. Precise C → Round to whole °C
 * 2. Convert to °F: (C × 9/5) + 32
 * 3. Round to whole °F
 * Uncertainty: ~±0.9°F
 */

/**
 * Find the range of actual temperatures for ASOS 5-minute data
 * Works backwards through the 5-step process
 *
 * @param {number} displayedF - The displayed Fahrenheit temperature (from NWS List)
 * @returns {Object} Range info with min, max, uncertainty, and intermediate values
 */
export function findASOSRange(displayedF) {
  // Step 5→4: Displayed F came from rounding, so step 4 was in [F-0.5, F+0.5)
  const step4Min = displayedF - 0.5;
  const step4Max = displayedF + 0.5;

  // Step 4→3: Find C values where (C × 9/5) + 32 is in [step4Min, step4Max)
  // Solving: C = (F - 32) × 5/9
  const cFromStep4Min = (step4Min - 32) * 5 / 9;
  const cFromStep4Max = (step4Max - 32) * 5 / 9;

  // Find integer C values in this range
  const celsiusValues = [];
  for (let c = Math.floor(cFromStep4Min); c <= Math.ceil(cFromStep4Max); c++) {
    const convertedF = (c * 9 / 5) + 32;
    if (convertedF >= step4Min && convertedF < step4Max) {
      celsiusValues.push(c);
    }
  }

  if (celsiusValues.length === 0) {
    // Fallback - shouldn't happen with valid input
    return {
      displayedF,
      min: displayedF - 1,
      max: displayedF + 1,
      uncertainty: 1,
      celsiusValue: Math.round((displayedF - 32) * 5 / 9),
      type: 'asos',
    };
  }

  // Step 3→2: For each C value, find the range of F values that round to C
  // These F values satisfy: round((F - 32) × 5/9) === C
  // Which means: C - 0.5 ≤ (F - 32) × 5/9 < C + 0.5
  // Solving: F = C × 9/5 + 32, with ±0.5°C margin converted to F

  let overallMinF = Infinity;
  let overallMaxF = -Infinity;

  for (const c of celsiusValues) {
    // F range where (F-32)*5/9 rounds to C
    const fMinForC = (c - 0.5) * 9 / 5 + 32;
    const fMaxForC = (c + 0.5) * 9 / 5 + 32;

    // Step 2→1: Find integer F values (OMO) in this range
    const minIntF = Math.ceil(fMinForC - 0.0001);
    const maxIntF = Math.floor(fMaxForC - 0.0001);

    // Step 1→0: For each integer F, original was in [F-0.5, F+0.5)
    const origMin = minIntF - 0.5;
    const origMax = maxIntF + 0.5;

    if (origMin < overallMinF) overallMinF = origMin;
    if (origMax > overallMaxF) overallMaxF = origMax;
  }

  // Round for display
  const min = Math.round(overallMinF * 10) / 10;
  const max = Math.round(overallMaxF * 10) / 10;
  const uncertainty = Math.round((max - min) / 2 * 10) / 10;

  return {
    displayedF,
    min,
    max,
    uncertainty,
    celsiusValue: celsiusValues[0], // Primary C value
    celsiusValues,
    type: 'asos',
  };
}

/**
 * Find the range of actual temperatures for METAR hourly data
 * Works backwards through the 3-step process
 *
 * @param {number} displayedF - The displayed Fahrenheit temperature
 * @returns {Object} Range info with min, max, uncertainty, and intermediate values
 */
export function findMETARRange(displayedF) {
  // Step 3→2: Displayed F came from rounding, so step 2 was in [F-0.5, F+0.5)
  const step2Min = displayedF - 0.5;
  const step2Max = displayedF + 0.5;

  // Step 2→1: Find C values where (C × 9/5) + 32 is in [step2Min, step2Max)
  const cFromStep2Min = (step2Min - 32) * 5 / 9;
  const cFromStep2Max = (step2Max - 32) * 5 / 9;

  // Find the integer C value (typically just one)
  let celsiusValue = null;
  for (let c = Math.floor(cFromStep2Min); c <= Math.ceil(cFromStep2Max); c++) {
    const convertedF = (c * 9 / 5) + 32;
    if (convertedF >= step2Min && convertedF < step2Max) {
      celsiusValue = c;
      break;
    }
  }

  if (celsiusValue === null) {
    celsiusValue = Math.round((displayedF - 32) * 5 / 9);
  }

  // Step 1→0: Original C was in [celsiusValue - 0.5, celsiusValue + 0.5)
  const origMinC = celsiusValue - 0.5;
  const origMaxC = celsiusValue + 0.5;

  // Convert to Fahrenheit
  const min = Math.round(((origMinC * 9 / 5) + 32) * 10) / 10;
  const max = Math.round(((origMaxC * 9 / 5) + 32) * 10) / 10;
  const uncertainty = Math.round((max - min) / 2 * 10) / 10;

  return {
    displayedF,
    min,
    max,
    uncertainty,
    celsiusValue,
    type: 'metar',
  };
}

/**
 * Find the range for a displayed Celsius value
 * Celsius is the native measurement, so simpler calculation
 *
 * @param {number} displayedC - The displayed Celsius temperature
 * @returns {Object} Range info in both C and F
 */
export function findCelsiusRange(displayedC) {
  // Original C was in [displayedC - 0.5, displayedC + 0.5)
  const minC = displayedC - 0.5;
  const maxC = displayedC + 0.5;

  // Convert to Fahrenheit
  const minF = Math.round(((minC * 9 / 5) + 32) * 10) / 10;
  const maxF = Math.round(((maxC * 9 / 5) + 32) * 10) / 10;

  return {
    displayedC,
    minC,
    maxC,
    minF,
    maxF,
    uncertaintyC: 0.5,
    uncertaintyF: Math.round((maxF - minF) / 2 * 10) / 10,
  };
}

/**
 * Simulate the ASOS 5-step forward rounding process
 * Useful for explanation/visualization
 *
 * @param {number} originalF - Original temperature in Fahrenheit
 * @returns {Object} All intermediate steps
 */
export function simulateASOSForward(originalF) {
  const step1 = Math.round(originalF);           // Round to whole F (OMO)
  const step2 = (step1 - 32) * 5 / 9;            // Convert to C
  const step3 = Math.round(step2);               // Round to whole C
  const step4 = (step3 * 9 / 5) + 32;            // Convert back to F
  const step5 = Math.round(step4);               // Round to whole F (displayed)

  return {
    original: originalF,
    step1_roundedF: step1,
    step2_celsiusExact: Math.round(step2 * 100) / 100,
    step3_roundedC: step3,
    step4_fahrenheitExact: Math.round(step4 * 10) / 10,
    step5_displayedF: step5,
  };
}

/**
 * Simulate the METAR 3-step forward rounding process
 * Useful for explanation/visualization
 *
 * @param {number} originalC - Original temperature in Celsius
 * @returns {Object} All intermediate steps
 */
export function simulateMETARForward(originalC) {
  const step1 = Math.round(originalC);           // Round to whole C
  const step2 = (step1 * 9 / 5) + 32;            // Convert to F
  const step3 = Math.round(step2);               // Round to whole F (displayed)

  return {
    original: originalC,
    step1_roundedC: step1,
    step2_fahrenheitExact: Math.round(step2 * 10) / 10,
    step3_displayedF: step3,
  };
}

/**
 * Get range based on observation type
 *
 * @param {number} displayedF - Displayed temperature in Fahrenheit
 * @param {'asos'|'metar'} observationType - Type of observation
 * @returns {Object} Range info
 */
export function findRange(displayedF, observationType = 'asos') {
  if (observationType === 'metar') {
    return findMETARRange(displayedF);
  }
  return findASOSRange(displayedF);
}

/**
 * Format a temperature range for display
 *
 * @param {number} min - Minimum temperature
 * @param {number} max - Maximum temperature
 * @returns {string} Formatted range string
 */
export function formatRange(min, max) {
  return `${min.toFixed(1)}° – ${max.toFixed(1)}°`;
}
