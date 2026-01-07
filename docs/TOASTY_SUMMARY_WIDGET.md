# Toasty Summary Widget

AI-powered forecast summaries designed for quantitative weather traders.

## Overview

The Toasty Summary widget uses Claude AI to analyze NWS Area Forecast Discussions (AFD) and generate concise, actionable summaries focused on factors that affect weather market trading.

## Location

- **Component**: `NWSDiscussionWidget.jsx` → `ToastySummaryContent` component
- **Hook**: `src/hooks/useToastySummary.js`
- **Prompt**: `prompts/summary-system.js`
- **API**: `api/copilot.js` (mode: 'summary')

## How It Works

1. User expands the Discussion widget
2. Hook fetches AFD sections (synopsis, near term, short term, long term)
3. Sends to `/api/copilot` with `mode: 'summary'`
4. Claude generates a structured summary
5. Result is cached in localStorage (keyed by city + AFD issuance time)

## Output Format

```
**HIGH: XX°F** (vs normal) | Confidence: HIGH/MED/LOW

**Key Factors:**
• [synoptic pattern]
• [cloud cover]
• [wind]

**Trading Signals:**
• Precip: [probability, timing]
• Wind: [speed, direction]
• Clouds: [coverage]
• Models: [agreement]
```

## Caching

- **Key**: `toasty_summary_${citySlug}_${issuanceTime}`
- **TTL**: 30 minutes
- Cache invalidates when new AFD is issued (different issuanceTime)

## Configuration

Edit `prompts/summary-system.js` to modify:
- Output format
- Word limits
- Confidence level definitions
- What to extract/exclude

---

## Known Issues & Future Work

### High Priority

- [ ] **Tab overflow on mobile** - Too many tabs cause horizontal scroll; need compact mode
- [ ] **Error visibility** - Users may not understand AI errors; need clearer messaging
- [ ] **Loading state UX** - Current pulse animation is subtle; consider skeleton

### Medium Priority

- [ ] **Model agreement parsing** - Extract specific model names from AFD (GFS, NAM, ECMWF)
- [ ] **Temperature vs normal** - Need historical data to show deviation from normal
- [ ] **Confidence extraction** - Parse forecaster confidence language more accurately
- [ ] **Market integration** - Show relevant bracket prices alongside temperature forecast

### Low Priority / Nice to Have

- [ ] **Summary history** - Keep last few summaries for comparison
- [ ] **Export to notes** - One-click add summary to research notes
- [ ] **Customizable format** - User preferences for summary detail level
- [ ] **Highlight changes** - Show what changed from previous AFD

### Technical Debt

- [ ] **Streaming optimization** - Summary is short; consider non-streaming for simpler code
- [ ] **Error retry logic** - Add exponential backoff for API failures
- [ ] **Token counting** - Track usage for cost monitoring
- [ ] **Test coverage** - Add unit tests for prompt builder and hook

---

## Design Notes

### Tab Bar Improvements Needed

Current tabs are too wide and cause overflow:
- Summary | Synopsis | Near Term | Short Term | Long Term | Aviation | Marine | Glossary

Proposed compact version:
- Summary | Syn | Near | Short | Long | Avn | Marine | Gloss

Or use icons where appropriate.

### Color Scheme

- Summary tab: Purple gradient (`from-purple-500/20 to-blue-500/20`)
- AI indicator: Sparkles icon in purple
- Refresh button: White/10 background with spin animation when loading

### Mobile Considerations

- Summary should be default tab (current behavior)
- Consider collapsing less-used tabs behind "More" menu
- Touch targets need to be at least 44px

---

## API Reference

### Request

```javascript
POST /api/copilot
{
  "messages": [{ "role": "user", "content": "Generate Toasty Summary" }],
  "context": {
    "mode": "summary",
    "city": { "name": "Chicago" },
    "afd": {
      "office": "LOT",
      "issuanceTime": "2024-01-15T14:30:00Z",
      "synopsis": "...",
      "nearTerm": "...",
      "shortTerm": "...",
      "longTerm": "..."
    },
    "weather": {
      "temp": 45,
      "condition": "Partly Cloudy",
      "humidity": 65,
      "windSpeed": 12,
      "windDirection": "NW"
    },
    "markets": {
      "topBrackets": [
        { "label": "44-46°F", "yesPrice": 35 },
        { "label": "46-48°F", "yesPrice": 45 }
      ]
    }
  }
}
```

### Response

Server-Sent Events stream:
```
data: {"type":"text","content":"**HIGH: 47°F**"}
data: {"type":"text","content":" (2° above normal)"}
...
data: {"type":"done"}
```

---

## Related Documentation

- [TOASTY_SUMMARY.md](./TOASTY_SUMMARY.md) - Prompt guidelines and examples
- [FORECAST_KEYWORDS.md](./FORECAST_KEYWORDS.md) - Keyword highlighting system
