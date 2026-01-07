/**
 * Toasty Summary System Prompt
 *
 * Generates concise, trader-focused summaries of NWS forecast discussions.
 * See docs/TOASTY_SUMMARY.md for full documentation.
 */

export const SUMMARY_SYSTEM_PROMPT = `You are a meteorologist analyst generating brief forecast summaries for weather market traders.

## Your Task
Summarize the NWS Area Forecast Discussion into a concise, actionable brief for quantitative weather traders.

## Output Format (STRICT)
Use this EXACT format:

**HIGH: XX°F** (vs normal) | Confidence: HIGH/MED/LOW

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
7. Focus on factors affecting HIGH temperature settlement

## Confidence Levels
- HIGH: Models agree within 2°F, clear pattern
- MED: 3-4°F spread or timing uncertainty
- LOW: 5°F+ spread, complex pattern, low predictability

## What to Extract from AFD
1. Temperature forecast and trend
2. Precipitation probability and timing
3. Wind speed/direction and changes
4. Cloud cover evolution
5. Any fronts or pressure systems
6. Model consensus or disagreement
7. Timing-sensitive factors

## DO NOT Include
- Aviation specifics (TAF, ceilings for flight)
- Marine forecasts
- Fire weather details (unless relevant to temp)
- Lengthy explanations
- Hedging language`;

/**
 * Build the summary prompt with AFD and context
 * @param {Object} context - Contains afd, city, weather, markets
 */
export function buildSummaryPrompt(context) {
  const parts = [SUMMARY_SYSTEM_PROMPT];

  parts.push('\n\n---\n## FORECAST DISCUSSION TO SUMMARIZE\n');

  if (context?.city) {
    parts.push(`**City:** ${context.city.name}`);
    parts.push(`**NWS Office:** ${context.afd?.office || 'Unknown'}`);
  }

  if (context?.afd) {
    const afd = context.afd;

    if (afd.issuanceTime) {
      parts.push(`**Issued:** ${afd.issuanceTime}`);
    }

    parts.push('\n### AFD Sections:\n');

    if (afd.synopsis) {
      parts.push(`**SYNOPSIS:**\n${afd.synopsis}\n`);
    }
    if (afd.nearTerm) {
      parts.push(`**NEAR TERM:**\n${afd.nearTerm}\n`);
    }
    if (afd.shortTerm) {
      parts.push(`**SHORT TERM:**\n${afd.shortTerm}\n`);
    }
    if (afd.longTerm) {
      parts.push(`**LONG TERM:**\n${afd.longTerm}\n`);
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

  if (context?.markets?.topBrackets?.length > 0) {
    const brackets = context.markets.topBrackets
      .map(b => `${b.label}: ${b.yesPrice}%`)
      .join(' | ');
    parts.push(`\n**Market Brackets:** ${brackets}`);
  }

  parts.push('\n---');
  parts.push('\nNow generate the Toasty Summary using the exact format specified above.');

  return parts.join('\n');
}

export default { SUMMARY_SYSTEM_PROMPT, buildSummaryPrompt };
