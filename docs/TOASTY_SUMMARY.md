# Toasty Summary - AI-Powered Forecast Summaries

## Overview

Toasty Summary uses Claude AI to generate concise, trader-focused summaries of NWS Area Forecast Discussions (AFDs). This replaces the inconsistent "Synopsis" section as the default view, providing standardized, actionable intelligence for quantitative weather traders.

## Purpose

NWS forecast discussions vary significantly by office:
- Some offices write detailed synopses, others barely a sentence
- Writing styles and terminology differ between forecasters
- Key trading signals (temperature, precipitation) are buried in technical jargon
- Timing information is inconsistent

Toasty Summary normalizes this data into a consistent, succinct format optimized for weather market trading decisions.

## Target Audience

**Quant Meteorologist Weather Traders** who need:
- Quick assessment of forecast confidence
- Temperature trend direction and magnitude
- Precipitation probability and timing
- Wind impacts on temperature
- Cloud cover effects on highs/lows

## Summary Format

Each Toasty Summary should contain these sections:

### 1. Temperature Outlook (Required)
```
High: XX°F (above/near/below normal)
Trend: warming/cooling/steady through [timeframe]
Confidence: high/medium/low
```

### 2. Key Factors (Required)
Bullet points of what's driving the forecast:
- Synoptic pattern (fronts, pressure systems)
- Cloud cover expectations
- Wind direction and speed
- Moisture/precipitation timing

### 3. Trading Signals (Required)
Explicit callouts for market-relevant info:
- **Precipitation**: Rain/snow probability, timing, amounts
- **Wind**: Speed, gusts, direction changes
- **Clouds**: Coverage %, timing of clearing/building
- **Uncertainty**: Model agreement, forecast confidence

### 4. Settlement Impact (Optional)
If relevant to Kalshi high temp markets:
- Factors that could push settlement higher/lower
- Morning vs afternoon temperature evolution
- Any anomalies (inversions, sea breeze, etc.)

## Example Summaries

### Example 1: Clear Day (High Confidence)
```
HIGH: 82°F (2° above normal) | Confidence: HIGH

Key Factors:
• Surface high building, clear skies through settlement
• Light N winds 5-10 mph, no sea breeze expected
• Excellent radiational heating conditions

Trading Signals:
• Precip: 0% - dry pattern locked in
• Wind: Light, not a factor
• Clouds: Clear AM, few afternoon cumulus (10%)
• Models: Strong agreement on 81-83°F range
```

### Example 2: Transitional Day (Lower Confidence)
```
HIGH: 76°F (near normal) | Confidence: MEDIUM

Key Factors:
• Cold front passage early AM, clouds clearing midday
• NW winds 10-15 gusting 25 mph post-frontal
• Temperature recovery depends on clearing timing

Trading Signals:
• Precip: 30% early AM showers, dry by noon
• Wind: Gusty NW flow limiting afternoon warming
• Clouds: OVC→SCT transition 10am-1pm critical
• Models: 3°F spread (74-77°F), timing uncertainty

Settlement Impact:
Front timing is key - early passage favors higher settlement.
Watch 10am obs for clearing trend.
```

## Implementation Guidelines

### Leverage Existing Copilot Infrastructure
Toasty Summary uses the existing `/api/copilot` endpoint with a specialized prompt. This avoids creating new infrastructure and maintains consistency.

### Input Data
The summary generator receives:
1. Full AFD text (all sections)
2. Current conditions (temp, wind, sky)
3. City/office context
4. Current market brackets and odds

### System Prompt
Located in `prompts/summary-system.js` - uses similar structure to copilot-system.js

### Caching Strategy
- Cache summaries in localStorage with key: `toasty_summary_${citySlug}_${afdIssuanceTime}`
- TTL: 30 minutes (matches AFD update frequency)
- Invalidate on new AFD issuance (compare issuance timestamps)
- Show cached summary immediately, refresh in background if stale

### API Usage
Uses existing `/api/copilot` with summary-specific context:
```javascript
const response = await fetch('/api/copilot', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Generate Toasty Summary' }],
    context: {
      mode: 'summary',  // Triggers summary-specific prompt
      city: { name, stationId },
      afd: { synopsis, nearTerm, shortTerm, longTerm, office, issuanceTime },
      weather: { temp, condition, humidity, windSpeed, windDirection },
      markets: { topBrackets, closeTime }
    }
  })
});
```

## UI Integration

### Tab Structure
```
[Toasty Summary] [Near Term] [Short Term] [Long Term] [Reports]
     ^default
```

### Visual Design
- Toasty Summary tab has subtle AI indicator (sparkle icon)
- Summary uses same glassmorphism styling as other content
- Temperature outlook prominently displayed
- Color-coded confidence indicator (green/yellow/orange)
- "Generated X min ago" timestamp

### Fallback Behavior
If Claude API unavailable:
1. Show Synopsis section as fallback
2. Display "AI summary unavailable" message
3. Allow manual refresh attempt

## Quality Guidelines

### DO:
- Use specific numbers (temperatures, percentages, times)
- Highlight uncertainty when models disagree
- Note timing-sensitive factors
- Translate NWS jargon to plain language
- Include wind direction in cardinal format (N, NW, etc.)

### DON'T:
- Include lengthy explanations
- Copy NWS text verbatim
- Speculate beyond the AFD content
- Use hedging language excessively
- Include aviation-specific content (TAF, ceiling heights)

## Future Enhancements

1. **Historical Comparison**: Compare forecast to recent actuals
2. **Model Consensus**: Pull in external model data (GFS, ECMWF)
3. **Alert Integration**: Flag when forecast differs significantly from market consensus
4. **Personalization**: Learn trader preferences over time
5. **Push Notifications**: Alert on significant forecast changes

## Metrics

Track:
- Summary generation latency
- Cache hit rate
- User engagement (time on summary vs raw AFD)
- Feedback signals (thumbs up/down)

---

*Document Version: 1.0*
*Last Updated: January 2025*
