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
• [Quote or closely paraphrase actual AFD text about pressure systems]
• [Quote or closely paraphrase actual AFD text about advection patterns - ALWAYS include if mentioned]
• [Quote or closely paraphrase actual AFD text about fronts/boundaries]

**Key Processes Mentioned:**
• [List specific meteorological processes: warm/cold air advection, offshore flow, onshore flow, etc.]
• [Include wind patterns: Santa Ana, Chinook, sea breeze, etc. if mentioned]

**Trading Signals:**
• Precip: [exact probability from AFD, or "not mentioned"]
• Wind: [exact speeds/directions from AFD]
• Clouds: [exact coverage from AFD]
• Models: [list actual model values: GFS XX°, NBM XX°, etc.]

## What You MUST Extract (if mentioned in AFD)

**ALWAYS include these if the AFD mentions them:**
- Cold air advection / cool air advection
- Warm air advection
- Offshore flow / onshore flow
- Santa Ana winds (SoCal)
- Frontal passages
- Ridge/trough positions
- Inversion layers
- Marine layer depth
- Any temperature trend language ("cooling", "warming", "moderating")

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
