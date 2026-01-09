/**
 * Toasty Summary System Prompt
 *
 * Generates concise, trader-focused summaries of NWS forecast discussions.
 * See docs/TOASTY_SUMMARY.md for full documentation.
 */

export const SUMMARY_SYSTEM_PROMPT = `You are a meteorologist analyst generating brief forecast summaries for weather market traders.

## Your Task
Summarize the NWS Area Forecast Discussion into a concise, actionable brief for quantitative weather traders.

**CRITICAL: You are forecasting TODAY's high temperature ONLY.** The market settles on TODAY's maximum temperature. Ignore forecasts for tomorrow, the weekend, next week, or any future days mentioned in the AFD.

## Output Format (STRICT)
Use this EXACT format:

**TODAY'S HIGH: XX°F** (±X vs normal) | Confidence: HIGH/MED/LOW

**Key Factors:**
• [synoptic pattern - fronts, pressure, etc.]
• [cloud cover - % and timing]
• [wind - direction, speed, impact]
• [any other key driver]

**Trading Signals:**
• Precip: [probability, timing, amounts]
• Wind: [speed range, gusts, direction]
• Clouds: [coverage evolution]
• Models: [agreement level, spread]

## Rules
1. MAX 100 words total
2. Use bullet points only, no paragraphs
3. Include specific numbers (temps, %, times)
4. Note wind, clouds, rain/snow explicitly
5. Translate NWS jargon to plain language
6. State confidence level based on model agreement
7. Focus on factors affecting TODAY's HIGH temperature settlement
8. **CRITICAL: Only report TODAY's forecast. If the AFD mentions multiple days, extract ONLY the forecast for the current day. Ignore "tomorrow", "Saturday", "next week", etc.**

## Confidence Levels
- HIGH: Models agree within 2°F, clear pattern
- MED: 3-4°F spread or timing uncertainty
- LOW: 5°F+ spread, complex pattern, low predictability

## What to Extract from AFD (FOR TODAY ONLY)
1. TODAY's temperature forecast and expected high
2. TODAY's precipitation probability and timing
3. TODAY's wind speed/direction and changes
4. TODAY's cloud cover evolution
5. Any fronts or pressure systems affecting TODAY
6. Model consensus/disagreement for TODAY's high
7. Timing-sensitive factors for TODAY

## DO NOT Include
- Aviation specifics (TAF, ceilings for flight)
- Marine forecasts
- Fire weather details (unless relevant to temp)
- Lengthy explanations
- Hedging language
- **Forecasts for future days (tomorrow, weekend, next week, Monday, Tuesday, etc.)**
- **Temperature values mentioned for days other than TODAY**`;

/**
 * Build the summary prompt with AFD and context
 * @param {Object} context - Contains afd, city, weather, markets
 */
export function buildSummaryPrompt(context) {
  const parts = [SUMMARY_SYSTEM_PROMPT];

  parts.push('\n\n---\n## FORECAST DISCUSSION TO SUMMARIZE\n');

  // Add explicit TODAY's date - CRITICAL for disambiguation
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  parts.push(`**⚠️ TODAY IS: ${fullDate}**`);
  parts.push(`**You MUST forecast for ${dayOfWeek} (today) ONLY. Ignore all other days.**\n`);

  if (context?.city) {
    parts.push(`**City:** ${context.city.name}`);
    parts.push(`**NWS Office:** ${context.afd?.office || 'Unknown'}`);
  }

  if (context?.afd) {
    const afd = context.afd;

    if (afd.issuanceTime) {
      parts.push(`**AFD Issued:** ${afd.issuanceTime}`);
    }

    parts.push('\n### AFD Sections:\n');

    if (afd.synopsis) {
      parts.push(`**SYNOPSIS:**\n${afd.synopsis}\n`);
    }
    if (afd.nearTerm) {
      parts.push(`**NEAR TERM (focus on TODAY - ${dayOfWeek}):**\n${afd.nearTerm}\n`);
    }
    if (afd.shortTerm) {
      parts.push(`**SHORT TERM (extract TODAY's info only):**\n${afd.shortTerm}\n`);
    }
    if (afd.longTerm) {
      parts.push(`**LONG TERM (⚠️ IGNORE - this is for future days, not today):**\n${afd.longTerm}\n`);
    }
  }

  parts.push('\n---\n## CURRENT CONDITIONS\n');

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
    if (w.humidity != null) {
      parts.push(`**Humidity:** ${w.humidity}%`);
    }
  }

  // Add model forecast data - provides grounding for today's expected high
  if (context?.models?.length > 0) {
    const modelStr = context.models
      .map(m => `${m.name}: ${m.high}°F`)
      .join(', ');
    const temps = context.models.map(m => m.high).filter(t => t != null);
    const avgTemp = temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
    const spread = temps.length > 1 ? Math.max(...temps) - Math.min(...temps) : 0;

    parts.push(`\n**Model Forecasts for TODAY's High:** ${modelStr}`);
    if (avgTemp) parts.push(`**Model Average:** ${avgTemp}°F (spread: ±${Math.round(spread/2)}°F)`);
    parts.push(`*Use these model forecasts to validate your temperature prediction.*`);
  }

  if (context?.markets?.topBrackets?.length > 0) {
    const brackets = context.markets.topBrackets
      .map(b => `${b.label}: ${b.yesPrice}%`)
      .join(' | ');
    parts.push(`\n**Market Brackets (for TODAY):** ${brackets}`);
  }

  parts.push('\n---');
  parts.push(`\nNow generate the Toasty Summary for TODAY (${dayOfWeek}) using the exact format specified above. Remember: TODAY'S HIGH only.`);

  return parts.join('\n');
}

export default { SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt };
