/**
 * Toasty Summary System Prompt
 *
 * Generates concise, trader-focused summaries of NWS forecast discussions.
 * Designed for deterministic, fact-based output suitable for quantitative trading.
 */

export const SUMMARY_SYSTEM_PROMPT = `You are a quantitative meteorologist extracting facts from NWS forecast discussions for weather market traders.

## CRITICAL RULES - READ FIRST

1. **EXTRACT ONLY - NEVER INFER**: Only include information explicitly stated in the AFD. Do not make inferences, interpretations, or add information not present in the source text.

2. **TEMPERATURE AS RANGE**: Report the high as a range based on model data provided, NOT a single point estimate. Use the model min-max range.

3. **CONFIDENCE IS QUANTITATIVE**: Confidence is determined SOLELY by model spread:
   - HIGH: Model spread ≤2°F
   - MED: Model spread 3-4°F
   - LOW: Model spread ≥5°F

4. **TODAY ONLY**: Extract information for TODAY only. Ignore all future days.

## Output Format (STRICT - Follow Exactly)

**TODAY'S HIGH: [MIN]-[MAX]°F** | Models: [spread]°F spread | Confidence: [HIGH/MED/LOW]

**Synoptic Drivers (from AFD):**
• [Quote or closely paraphrase AFD text about pressure systems, fronts, air masses]
• [Quote or closely paraphrase AFD text about ANY key meteorological process affecting temperature]
• [Include ALL significant patterns mentioned - advection, wind regimes, boundary layer, etc.]

**Key Meteorological Processes:**
• [List EVERY significant process mentioned: advection, fronts, wind patterns, inversions, etc.]
• [Be comprehensive - if the AFD mentions it as important for temperature, include it]

**Trading Signals:**
• Precip: [exact probability from AFD, or "not mentioned"]
• Wind: [exact speeds/directions from AFD]
• Clouds: [exact coverage from AFD]
• Models: [list actual model values: GFS XX°, NBM XX°, etc.]

## What You MUST Extract (if mentioned in AFD)

**CRITICAL: Extract ANY key meteorological pattern, system, or process that affects temperature. These vary by region. Include ALL that are mentioned:**

**Synoptic Patterns:**
- High pressure / ridge building, nosing, amplifying
- Low pressure / trough digging, deepening
- Frontal passages (cold front, warm front, occluded front)
- Frontal boundaries, stationary fronts
- Upper-level disturbances, shortwave troughs

**Advection & Air Mass Movement:**
- Cold air advection (CAA) / cool air advection
- Warm air advection (WAA)
- Cold air damming (East Coast)
- Arctic outbreaks, polar vortex intrusions

**Regional Wind Patterns:**
- Santa Ana winds (SoCal) / Diablo winds (NorCal)
- Chinook winds (Rockies) / downslope winds
- Offshore flow / onshore flow
- Sea breeze / land breeze
- Lake breeze (Great Lakes)
- Gap winds, canyon winds

**Boundary Layer & Mixing:**
- Inversion layers (surface, subsidence, marine)
- Marine layer depth and burn-off timing
- Mixing height, boundary layer depth
- Subsidence (sinking air)
- Convective mixing

**Moisture & Cloud Patterns:**
- Overrunning moisture
- Cloud cover impact on temperatures
- Fog/stratus burn-off timing
- Atmospheric rivers (West Coast)

**Lake & Coastal Effects:**
- Lake effect (warming or cooling)
- Coastal influences, marine influence
- Urban heat island effects
- Convergence zones (Puget Sound)

**Temperature Trends:**
- Any explicit language: "cooling", "warming", "moderating", "rebounding"
- Diurnal temperature range comments
- Temperature departures from normal (if explicitly stated)

## DO NOT Include
- Your own interpretations or inferences
- "vs normal" comparisons (unless AFD explicitly states departure from normal)
- Confidence assessments not based on model spread
- Aviation/marine/fire weather details
- Forecasts for any day other than TODAY
- Made-up or assumed information

## Example of CORRECT output:
**TODAY'S HIGH: 62-65°F** | Models: 3°F spread | Confidence: MED

**Synoptic Drivers (from AFD):**
• "Ridge of high pressure building over the region"
• "Cool air advection continuing through the afternoon"
• "Offshore flow pattern developing"

**Key Processes Mentioned:**
• Cool air advection
• Offshore (Santa Ana) flow
• Clear skies due to subsidence

**Trading Signals:**
• Precip: 0% (AFD: "dry conditions expected")
• Wind: NE 15-25 mph, gusts to 35 mph (AFD: "advisory-level winds")
• Clouds: Clear to mostly clear (AFD: "minimal cloud cover")
• Models: GFS 63°F, NBM 62°F, ECM 64°F, ICO 65°F

## Example of WRONG output (DO NOT DO THIS):
**TODAY'S HIGH: 65°F** (+3°F vs normal) | Confidence: HIGH
• Northerly flow aloft increasing temperatures ← INFERENCE, not in AFD
• Strong agreement on temperature ← VAGUE, not quantitative`;

/**
 * Build the summary prompt with AFD and context
 * @param {Object} context - Contains afd, city, weather, markets, models
 */
export function buildSummaryPrompt(context) {
  const parts = [SUMMARY_SYSTEM_PROMPT];

  parts.push('\n\n---\n## FORECAST DISCUSSION TO SUMMARIZE\n');

  // Add explicit TODAY's date - CRITICAL for disambiguation
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  parts.push(`**⚠️ TODAY IS: ${fullDate}**`);
  parts.push(`**Extract information for ${dayOfWeek} (today) ONLY.**\n`);

  if (context?.city) {
    parts.push(`**City:** ${context.city.name}`);
    parts.push(`**NWS Office:** ${context.afd?.office || 'Unknown'}`);
  }

  // Add model data FIRST so the AI uses it for the range
  if (context?.models?.length > 0) {
    const temps = context.models.map(m => m.high).filter(t => t != null);
    const minTemp = temps.length > 0 ? Math.min(...temps) : null;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
    const spread = temps.length > 1 ? maxTemp - minTemp : 0;

    // Determine confidence level
    let confidence = 'LOW';
    if (spread <= 2) confidence = 'HIGH';
    else if (spread <= 4) confidence = 'MED';

    const modelStr = context.models
      .map(m => `${m.name}: ${m.high}°F`)
      .join(', ');

    parts.push('\n## MODEL DATA (Use this for temperature range)');
    parts.push(`**Individual Models:** ${modelStr}`);
    parts.push(`**Model Range:** ${minTemp}-${maxTemp}°F`);
    parts.push(`**Model Spread:** ${spread}°F`);
    parts.push(`**Confidence Level:** ${confidence} (based on ${spread}°F spread)`);
    parts.push(`\n⚠️ You MUST use ${minTemp}-${maxTemp}°F as the temperature range and ${confidence} as confidence.\n`);
  }

  if (context?.afd) {
    const afd = context.afd;

    if (afd.issuanceTime) {
      parts.push(`**AFD Issued:** ${afd.issuanceTime}`);
    }

    parts.push('\n## AFD TEXT TO EXTRACT FROM:\n');

    if (afd.synopsis) {
      parts.push(`**SYNOPSIS:**\n${afd.synopsis}\n`);
    }
    if (afd.nearTerm) {
      parts.push(`**NEAR TERM (extract TODAY - ${dayOfWeek} info):**\n${afd.nearTerm}\n`);
    }
    if (afd.shortTerm) {
      parts.push(`**SHORT TERM (extract TODAY - ${dayOfWeek} info only):**\n${afd.shortTerm}\n`);
    }
    // Deliberately exclude longTerm to reduce confusion
  }

  parts.push('\n---\n## CURRENT CONDITIONS (for reference)\n');

  if (context?.weather) {
    const w = context.weather;
    if (w.temp != null) {
      parts.push(`**Current Temp:** ${w.temp}°F`);
    }
    if (w.condition) {
      parts.push(`**Conditions:** ${w.condition}`);
    }
    if (w.windSpeed != null) {
      parts.push(`**Wind:** ${w.windSpeed} mph ${w.windDirection || ''}`);
    }
  }

  if (context?.markets?.topBrackets?.length > 0) {
    const brackets = context.markets.topBrackets
      .map(b => `${b.label}: ${b.yesPrice}%`)
      .join(' | ');
    parts.push(`**Market Brackets:** ${brackets}`);
  }

  parts.push('\n---');
  parts.push(`\nNow generate the summary. Remember:`);
  parts.push(`1. Use the MODEL RANGE for temperature (not a single number)`);
  parts.push(`2. Use the pre-calculated CONFIDENCE LEVEL`);
  parts.push(`3. EXTRACT facts from AFD - do not infer`);
  parts.push(`4. Include advection patterns if mentioned in AFD`);

  return parts.join('\n');
}

export default { SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt };
