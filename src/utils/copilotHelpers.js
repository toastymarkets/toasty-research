/**
 * Copilot Helper Utilities
 * Context gathering and formatting for AI prompts
 */

/**
 * Gather context from the current dashboard state
 * @param {Object} options - Dashboard state objects
 * @returns {Object} Formatted context for the copilot API
 */
export function gatherCopilotContext({
  city,
  weather,
  observations,
  markets,
  forecast,
}) {
  const context = {};

  // City info
  if (city) {
    context.city = {
      name: city.name,
      slug: city.slug,
      stationId: city.stationId,
      timezone: city.timezone,
    };
  }

  // Current weather
  if (weather) {
    context.weather = {
      temp: weather.temperature ?? weather.temp,
      condition: weather.condition || weather.textDescription,
      humidity: weather.humidity ?? weather.relativeHumidity,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
    };
  }

  // Recent observations (summarized - last 6 hours)
  if (observations && observations.length > 0) {
    const recentObs = observations.slice(0, 12); // ~6 hours at 30min intervals
    context.observations = recentObs.map(obs => ({
      time: formatObsTime(obs.timestamp || obs.time),
      temp: obs.temperature ?? obs.temp,
      humidity: obs.humidity ?? obs.relativeHumidity,
    }));

    // Calculate trend
    if (recentObs.length >= 2) {
      const first = recentObs[0];
      const last = recentObs[recentObs.length - 1];
      const firstTemp = first.temperature ?? first.temp;
      const lastTemp = last.temperature ?? last.temp;
      if (firstTemp != null && lastTemp != null) {
        context.tempTrend = {
          change: (firstTemp - lastTemp).toFixed(1),
          direction: firstTemp > lastTemp ? 'rising' : firstTemp < lastTemp ? 'falling' : 'stable',
          hours: Math.round((new Date(recentObs[0].timestamp) - new Date(recentObs[recentObs.length - 1].timestamp)) / 3600000),
        };
      }
    }
  }

  // Market data
  if (markets) {
    context.markets = {
      topBrackets: markets.topBrackets?.slice(0, 3).map(b => ({
        label: b.label,
        yesPrice: b.yesPrice,
      })),
      totalVolume: markets.totalVolume,
      closeTime: markets.closeTime,
    };
  }

  // Forecast (if available)
  if (forecast && forecast.length > 0) {
    context.forecast = forecast.slice(0, 4).map(f => ({
      time: f.time || f.name,
      temp: f.temperature ?? f.temp,
      shortForecast: f.shortForecast || f.condition,
    }));
  }

  return context;
}

/**
 * Format observation timestamp for display
 */
function formatObsTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate suggested prompts based on context
 * @param {Object} context - Copilot context
 * @returns {Array} Array of suggested prompt strings
 */
export function getSuggestedPrompts(context) {
  const suggestions = [];

  if (context?.markets?.topBrackets?.length > 0) {
    const topBracket = context.markets.topBrackets[0];
    suggestions.push(`Why is ${topBracket.label} at ${topBracket.yesPrice}%?`);
    suggestions.push('Analyze the current market odds');
  }

  if (context?.tempTrend) {
    suggestions.push(`What's driving the ${context.tempTrend.direction} temperature?`);
  }

  if (context?.weather?.temp != null) {
    suggestions.push('What temperature should I expect at settlement?');
  }

  // Always include some general prompts
  suggestions.push('Write a summary of current conditions');
  suggestions.push('What factors should I consider?');

  return suggestions.slice(0, 4);
}

/**
 * Parse AI response for notepad insertion
 * Converts markdown to TipTap-compatible format
 * @param {string} content - AI response content
 * @returns {Array} TipTap content array
 */
export function parseResponseForNotepad(content) {
  if (!content) return [];

  // For now, just return as text paragraphs
  // TipTap can handle basic markdown naturally
  const lines = content.split('\n');
  const nodes = [];

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    // Check for headers
    if (line.startsWith('### ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.slice(4) }],
      });
    } else if (line.startsWith('## ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: line.slice(3) }],
      });
    } else if (line.startsWith('# ')) {
      nodes.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: line.slice(2) }],
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: line.slice(2) }],
          }],
        }],
      });
    } else {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      });
    }
  }

  return nodes;
}

/**
 * Format copilot content for notepad insertion with header
 * @param {string} content - AI response content
 * @returns {Array} TipTap content array with copilot header
 */
export function formatCopilotInsert(content) {
  return [
    { type: 'horizontalRule' },
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Copilot: ' },
      ],
    },
    ...parseResponseForNotepad(content),
    { type: 'paragraph' },
  ];
}

export default {
  gatherCopilotContext,
  getSuggestedPrompts,
  parseResponseForNotepad,
  formatCopilotInsert,
};
