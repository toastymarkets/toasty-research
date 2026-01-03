/**
 * Weather Knowledge Base for RAG
 *
 * Curated knowledge from Kalshi Discord climate channel.
 * Used to inject relevant domain expertise into copilot responses.
 */

// Category keywords for matching user queries
export const CATEGORY_KEYWORDS = {
  settlement_rules: [
    'settlement', 'settle', 'cli', 'dsm', 'official', 'final', 'report',
    'midnight', 'resolve', 'payout', 'outcome', 'result'
  ],
  weather_stations: [
    'station', 'sensor', 'asos', 'awos', 'metar', 'knyc', 'kmdw', 'kmia',
    'kaus', 'kden', 'klax', 'kphl', 'airport', 'central park', 'belvedere',
    'calibration', 'accuracy', 'reading'
  ],
  timing_schedules: [
    'time', 'when', 'schedule', 'release', 'update', 'delay', 'utc',
    'local', 'midnight', 'hour', 'minute', '5-minute', 'hourly'
  ],
  forecasts: [
    'forecast', 'model', 'gfs', 'nam', 'hrrr', 'ecmwf', 'nbm', 'nws',
    'prediction', 'expected', 'outlook', 'discussion', 'afd'
  ],
  weather_models: [
    'model', 'gfs', 'nam', 'hrrr', 'ecmwf', 'euro', 'nbm', 'ensemble',
    'accuracy', 'bias', 'error', 'verification'
  ],
  data_issues: [
    'error', 'wrong', 'incorrect', 'missing', 'outage', 'discrepancy',
    'bug', 'glitch', 'broken', 'issue', 'problem'
  ],
  temperature_conversion: [
    'rounding', 'celsius', 'fahrenheit', 'convert', 'conversion',
    'decimal', 'round', 'display', 'actual', 'inflate'
  ],
  data_sources: [
    'source', 'url', 'link', 'website', 'api', 'data', 'where',
    'find', 'check', 'look', 'mesowest', 'synoptic', 'iem'
  ]
};

// Curated knowledge snippets by category
export const KNOWLEDGE_BASE = {
  settlement_rules: [
    {
      topic: "CLI vs Real-time Data",
      content: "The CLI (Climatological Report) is the gold standard for settlement. Real-time 5-minute observations often show inflated temperatures due to rounding. The CLI uses quality-controlled sensor data and frequently reports 1°F lower than what 5-minute data suggested throughout the day."
    },
    {
      topic: "CLI vs OMO Discrepancies",
      content: "There are days where CLI high is higher than any One-Minute Observations (OMOs). This usually happens when there are missing OMO readings - the high might be from a gap period. Always cross-reference multiple data sources."
    },
    {
      topic: "Settlement Timing",
      content: "Settlement is based on the HIGHEST temperature from midnight to midnight local time. The CLI report typically releases the next morning (5-10am UTC). Markets settle after CLI publication, not at midnight."
    },
    {
      topic: "DSM vs CLI Relationship",
      content: "99% of the time DSM and CLI report the same value. But this doesn't mean the final result will match - if the high temp occurs after the afternoon DSM/CLI release, it won't be reflected until the next day's CLI. Also, a human reviews the CLI before sending and can update it."
    },
    {
      topic: "CLI Human Review",
      content: "The CLI is hand-reviewed. 99% of the time they ship it with the same value pre-populated by the DSM, but sometimes they will 'dial' it - meaning they have access to accumulated raw data that the public doesn't see, and can make corrections."
    },
    {
      topic: "Settlement Surprises",
      content: "There have been cases where markets seemed 'safe' based on real-time data but the DSM/CLI showed different results. Example: A rainy day in Austin where rain plummeted temperature, but the DSM showed the high was actually reached earlier. Also, Miami once had an incorrect CLI that Kalshi settled on before NWS corrected it."
    }
  ],

  weather_stations: [
    {
      topic: "Temperature Measurement & Conversion",
      content: "Weather stations measure in Fahrenheit but report in Celsius to nearest tenth. Example: 82°F rounds to 27.8°C. When displayed, 27.8°C converts back to 82.04°F. The decimal you see (like 73.4°F) means actual temp is either 73°F or 74°F - can't know which exactly."
    },
    {
      topic: "ASOS vs AWOS",
      content: "ASOS (Automated Surface Observing System) generates automatic one-minute observations. AWOS is a simpler system. ASOS stations at major airports provide the most detailed data. One-minute data is accessible via phone dial-in but not easily available online."
    },
    {
      topic: "Central Park Station (KNYC)",
      content: "The NYC temperature market uses the Central Park station at Belvedere Castle. There's no local display of ASOS data at the castle. The station is fenced and secure. NYC is considered LOW bot risk because OMO data isn't easily accessible."
    },
    {
      topic: "Station Observation Times",
      content: "Hourly METAR observations are typically taken at :51-:56 past each hour. 5-minute data updates continuously but has more rounding. The hourly observations have better precision (0.1°C before conversion)."
    }
  ],

  timing_schedules: [
    {
      topic: "5-Minute vs Hourly Data",
      content: "5-minute data updates every 5 minutes but undergoes multiple rounding steps that inflate values. Hourly observations at :51-:54 past each hour are more precise. For settlement, CLI uses raw sensor data, not the rounded 5-minute displays."
    },
    {
      topic: "DSM Release Schedule",
      content: "DSM release times vary by city. Some stations release 1x daily, others up to 4x. The DSM contains 'highest temperature observed so far' - not final. Traders with bots can react instantly to DSM releases."
    },
    {
      topic: "Midnight Temperature Handling",
      content: "If temperature at midnight (12:00 AM) was 57.7°F, that counts for the NEW day, not the previous day. The NWS may report different highs than what real-time observations showed at 12:51 AM because of how they bucket observations."
    }
  ],

  forecasts: [
    {
      topic: "NWS Forecast Discussion",
      content: "The Area Forecast Discussion (AFD) from NWS contains detailed meteorologist reasoning about the forecast. It explains model disagreements, confidence levels, and specific concerns. Available at forecast.weather.gov under 'Forecast Discussion'."
    },
    {
      topic: "Useful Data URLs",
      content: "NYC: tgftp.nws.noaa.gov/weather/current/KNYC.html | Chicago: mesowest.utah.edu KMDW | Miami: mesowest.utah.edu KMIA | MesoWest provides 5-minute data with LOCAL time display."
    },
    {
      topic: "Model Verification",
      content: "When GFS, ECMWF, and NBM agree within 1-2°F, confidence is high. NBM (National Blend of Models) is often most accurate for temperature. When models differ by 3°F+, expect wider outcome ranges."
    }
  ],

  weather_models: [
    {
      topic: "ECMWF Forecast Errors",
      content: "ECMWF IFS forecast errors come from: initial condition errors, model physics approximations, and chaotic atmosphere dynamics. Temperature forecasts degrade ~1°F accuracy per day of forecast lead time."
    },
    {
      topic: "Model Comparison Strategy",
      content: "Don't try to outperform NOAA/AccuWeather with your own model. Instead, track their accuracy over time - collect forecasts and compare to actuals. Then predict based on their historical bias for each city/season."
    }
  ],

  data_issues: [
    {
      topic: "Rounding Uncertainty",
      content: "When you see 73.4°F from a 5-minute reading, the actual temperature could be 73°F or 74°F. The .4 comes from Celsius conversion rounding. You cannot know the exact value from the display alone."
    },
    {
      topic: "Missing Observations",
      content: "When observations are missing, it could be transmission error. They might physically check the computer which stores observations temporarily. Whether they'll do that depends on the station importance."
    },
    {
      topic: "4PM Report Accuracy",
      content: "The preliminary 4PM report can differ from final CLI. Looking back historically, it's worth tracking how often the preliminary differs from final settlement."
    },
    {
      topic: "NWS Model Delays",
      content: "NCEP model data can experience dissemination delays. This affects GFS, RAP, HRRR, and other models. When delays occur, NWS issues a Senior Duty Meteorologist Alert Administrative Message. During delays, forecast data may be stale."
    },
    {
      topic: "API vs Display Rounding",
      content: "The NWS API reports Celsius values like 21.2°C, but the actual sensor rounds to the nearest whole number. The API may use different rounding rules than the display. The 'pub' temperature shown on weather maps suffers from rounding issues - use it only to spot trends."
    },
    {
      topic: "Incorrect CLI Reports",
      content: "CLI reports can be incorrect and later corrected. However, if Kalshi has already settled based on the wrong CLI, the settlement stands. This has happened in Miami where an incorrect CLI was corrected later in the morning but Kalshi had already settled."
    }
  ],

  temperature_conversion: [
    {
      topic: "The Rounding Chain",
      content: "Sensor reads 77.6°F → Rounds to 78°F → Converts to 25.56°C → Rounds to 26°C → Displays as 78.8°F. The displayed 78.8°F is INFLATED. Actual was 77.6°F and CLI will report 78°F. This multi-step rounding causes ~1°F inflation in displays."
    },
    {
      topic: "Interpreting Decimal Temps",
      content: "A displayed temp of 93.2°F (from 34°C) has uncertainty. With 0.5°C rounding error, it could be 33.5°C-34.4°C = 92.3°F-93.9°F. Markets at boundary values (like 92-93) have this conversion risk."
    }
  ],

  data_sources: [
    {
      topic: "Real-Time Data Sources",
      content: "Best sources: NWS TGFTP for raw observations, MesoWest for 5-minute data with local time, IEM (Iowa Environmental Mesonet) for historical data. For CLI: forecast.weather.gov/product.php with CLI product type."
    },
    {
      topic: "API Access",
      content: "Synoptic Data (mesonet API) provides programmatic access to weather observations. For Kalshi API, use kalshi_python package. Note: API structures change - keep code updated."
    }
  ]
};

/**
 * Find relevant knowledge snippets for a user query
 * @param {string} query - User's question or message
 * @param {number} maxSnippets - Maximum snippets to return
 * @returns {Array} Relevant knowledge snippets
 */
export function retrieveKnowledge(query, maxSnippets = 3) {
  const queryLower = query.toLowerCase();
  const scores = {};

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        scores[category] += 1;
        // Boost for exact word match (not substring)
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(query)) {
          scores[category] += 1;
        }
      }
    }
  }

  // Get categories with scores > 0, sorted by score
  const matchedCategories = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2) // Top 2 categories
    .map(([cat]) => cat);

  // If no matches, return general settlement knowledge
  if (matchedCategories.length === 0) {
    matchedCategories.push('settlement_rules');
  }

  // Collect snippets from matched categories
  const snippets = [];
  for (const category of matchedCategories) {
    const categoryKnowledge = KNOWLEDGE_BASE[category] || [];
    snippets.push(...categoryKnowledge);
  }

  // Score snippets by relevance to query
  const scoredSnippets = snippets.map(snippet => {
    let score = 0;
    const contentLower = (snippet.topic + ' ' + snippet.content).toLowerCase();

    // Check for query words in snippet
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }

    return { ...snippet, relevanceScore: score };
  });

  // Sort by relevance and return top N
  return scoredSnippets
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxSnippets);
}

/**
 * Format knowledge snippets for injection into prompt
 * @param {Array} snippets - Knowledge snippets
 * @returns {string} Formatted string for prompt
 */
export function formatKnowledgeForPrompt(snippets) {
  if (!snippets || snippets.length === 0) {
    return '';
  }

  const formatted = snippets
    .map(s => `**${s.topic}:** ${s.content}`)
    .join('\n\n');

  return `\n## Relevant Domain Knowledge\n${formatted}\n`;
}
