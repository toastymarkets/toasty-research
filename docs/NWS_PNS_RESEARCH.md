# NWS Public Information Statement (PNS) Research

## What is a PNS?

A **Public Information Statement (PNS)** is an NWS text product used to communicate noteworthy weather information that doesn't fit into standard forecasts or warnings. Unlike alerts (which are urgent), PNS reports provide:

- **Record-breaking weather events** (rainfall totals, temperature records)
- **Climate summaries** (water year totals, monthly comparisons)
- **Storm summaries** (post-event reports with detailed measurements)
- **Public education** (weather preparedness information)
- **Service announcements** (NOAA Weather Radio outages, etc.)

## Example: LA Rainfall Summary (Jan 5, 2026)

The tweet linked to a PNS from NWS Los Angeles/Oxnard (LOX) documenting exceptional rainfall:

**Key highlights:**
- Downtown LA received 14.11" through Jan 4 — 99% of normal annual rainfall
- Mount Wilson Observatory: 44.62" — highest since 1949
- Santa Barbara Airport: 20.15" — wettest water year start on record
- Multiple atmospheric river events documented from Oct-Jan

This type of content is valuable for prediction market traders tracking weather extremes.

## API Access

PNS products are available through the NWS API:

### List PNS products by office
```
GET https://api.weather.gov/products/types/PNS/locations/{office}
```

**Example for Los Angeles:**
```
https://api.weather.gov/products/types/PNS/locations/LOX
```

### Get specific PNS content
```
GET https://api.weather.gov/products/{productId}
```

Returns JSON with `productText` containing the full statement.

### Response structure
```json
{
  "@graph": [
    {
      "@id": "https://api.weather.gov/products/...",
      "id": "a01cbec3-a59d-4c64-9add-8e1c6d41e9e6",
      "issuingOffice": "KLOX",
      "issuanceTime": "2026-01-06T00:51:00+00:00",
      "productCode": "PNS",
      "productName": "Public Information Statement"
    }
  ]
}
```

## City Forecast Office Mapping

Our cities map to these NWS offices (already in `cities.js`):

| City | Office | Office ID |
|------|--------|-----------|
| New York | OKX | KOKX |
| Chicago | LOT | KLOT |
| Los Angeles | LOX | KLOX |
| Miami | MFL | KMFL |
| Denver | BOU | KBOU |
| Austin | EWX | KEWX |
| Philadelphia | PHI | KPHI |
| Houston | HGX | KHGX |
| Seattle | SEW | KSEW |
| San Francisco | MTR | KMTR |
| Boston | BOX | KBOX |
| Washington DC | LWX | KLWX |
| Dallas | FWD | KFWD |
| Detroit | DTX | KDTX |
| Salt Lake City | SLC | KSLC |
| New Orleans | LIX | KLIX |

## Integration Options

### Option 1: Add to Alerts Widget

**Pros:**
- Natural fit alongside weather alerts
- Already has "news" section when no alerts present
- Users already check this widget for important info

**Cons:**
- PNS is different from alerts (informational vs urgent)
- Might clutter the alerts flow

**Implementation:**
- Add a "Bulletins" tab/section to AlertsWidget
- Fetch latest PNS for the office
- Display alongside alerts and news

### Option 2: Add to Discussion Widget (Recommended)

**Pros:**
- Both are NWS text products
- Similar format (long-form text with data)
- Discussion widget already has tabs (could add "Bulletins" tab)
- Already parses NWS text products

**Cons:**
- Could make discussion widget too complex
- PNS frequency varies (might be empty often)

**Implementation:**
- Add "Bulletins" tab to ExpandedDiscussionInline
- Fetch latest PNS from same office as AFD
- Use similar text parsing/highlighting

### Option 3: New Standalone Widget

**Pros:**
- Clean separation of concerns
- Dedicated space for bulletins

**Cons:**
- Another widget to track
- Takes up dashboard space
- Low-frequency updates (might look stale)

## Recommended Approach: Discussion Widget Tab

1. **Add "Bulletins" or "Reports" tab** to ExpandedDiscussionInline
2. **Fetch recent PNS** from the same forecast office as AFD
3. **Show summary in compact mode** (badge if new PNS exists)
4. **Apply keyword highlighting** (same system as AFD)
5. **Cache with 30-min expiration** (same as AFD)

### UI Mockup
```
┌─────────────────────────────────────────────────┐
│ NWS Discussion                    [↙] Collapse  │
├─────────────────────────────────────────────────┤
│ [Discussion] [Bulletins]                        │
├─────────────────────────────────────────────────┤
│ PUBLIC INFORMATION STATEMENT                    │
│ National Weather Service Los Angeles/Oxnard CA  │
│ 4:50 PM PST Mon Jan 5 2026                      │
│                                                 │
│ ...DOWNTOWN LOS ANGELES 4TH WETTEST START TO    │
│ THE WATER YEAR SINCE 1877...                    │
│                                                 │
│ Several significant storms, including a couple  │
│ of atmospheric river events, affected...        │
│                                                 │
│ [View full report ↗]                            │
└─────────────────────────────────────────────────┘
```

### Compact Mode Badge
When a recent PNS exists (< 24 hours), show a small indicator:
```
┌────────────────────────────┐
│ DISCUSSION   📋 New Report │
│ ...synopsis preview...     │
└────────────────────────────┘
```

## Implementation Tasks

1. [ ] Create `useNWSBulletins.js` hook to fetch PNS products
2. [ ] Add "Bulletins" tab to ExpandedDiscussionInline
3. [ ] Parse PNS text format (similar to AFD but simpler)
4. [ ] Add keyword highlighting (reuse existing system)
5. [ ] Show badge in compact mode when fresh PNS exists
6. [ ] Add link to full report on weather.gov

## Technical Notes

### PNS Text Format
PNS reports are free-form text with:
- Header block (office info, timestamp)
- Headlines in ellipses: `...HEADLINE TEXT...`
- Section breaks with `&&`
- Data tables (rainfall amounts, records)

### Caching Strategy
- Cache PNS list for 30 minutes (same as AFD)
- Check `issuanceTime` to determine "newness"
- Consider a PNS "new" if issued within 24 hours

### Sources
- [NWS API Documentation](https://www.weather.gov/documentation/services-web-api)
- [Public Information Statement Help](https://www.weather.gov/bgm/helpPublicInformationStatements)
- [IEM PNS Archive](https://mesonet.agron.iastate.edu/wx/afos/p.php)
