/**
 * Note Insertion Events - Global event system for inserting data into notes
 * Allows widgets outside the notepad context to insert formatted content
 */

// Event names
export const NOTE_INSERTION_EVENT = 'toasty:insert-note';

/**
 * Format wind direction from degrees to compass label
 */
const getWindDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

/**
 * Format observation data into TipTap-compatible content
 */
export function formatObservationForNotes(observation, metadata = {}) {
  const { cityName = 'Unknown', timezone = 'America/New_York', useMetric = false } = metadata;

  // Format timestamp
  const date = observation.timestamp instanceof Date
    ? observation.timestamp
    : new Date(observation.timestamp);

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateStr = date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Format values
  const formatTemp = (tempF) => {
    if (tempF == null) return '--';
    if (useMetric) {
      const tempC = (tempF - 32) * 5 / 9;
      return `${Math.round(tempC)}°C`;
    }
    return `${Math.round(tempF)}°F`;
  };

  const formatWind = () => {
    if (observation.windSpeed == null) return '--';
    const dir = getWindDirection(observation.windDirection);
    if (useMetric) {
      const kmh = observation.windSpeed * 1.60934;
      return `${dir} ${Math.round(kmh)} km/h`;
    }
    return `${dir} ${Math.round(observation.windSpeed)} mph`;
  };

  const formatVisibility = () => {
    if (observation.visibility == null) return '--';
    if (useMetric) {
      return `${(observation.visibility / 1000).toFixed(1)} km`;
    }
    return `${(observation.visibility / 1609.34).toFixed(1)} mi`;
  };

  const formatPressure = () => {
    if (observation.pressure == null) return '--';
    if (useMetric) {
      return `${Math.round(observation.pressure / 100)} hPa`;
    }
    return `${(observation.pressure / 3386.39).toFixed(2)} inHg`;
  };

  const formatHumidity = () => {
    if (observation.humidity == null) return '--';
    return `${Math.round(observation.humidity)}%`;
  };

  // Helper to create a data chip node
  const createChip = (value, label, type, source = cityName) => ({
    type: 'dataChip',
    attrs: {
      value,
      label,
      type,
      source,
      timestamp: timeStr,
    }
  });

  // Build TipTap content structure with data chips
  return {
    type: 'doc',
    content: [
      // Observation header as H3
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [
          { type: 'text', text: `${cityName} Observation` }
        ]
      },
      // Date/time line
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${dateStr} at ${timeStr}` },
          { type: 'text', text: observation.description ? ` — ${observation.description}` : '' }
        ]
      },
      // Temperature row with chip
      {
        type: 'paragraph',
        content: [
          createChip(formatTemp(observation.temperature), 'Temp', 'temperature'),
          { type: 'text', text: '  ' },
          createChip(formatHumidity(), 'Humidity', 'humidity'),
          { type: 'text', text: '  ' },
          createChip(formatWind(), 'Wind', 'wind'),
        ]
      },
      // Second row of chips
      {
        type: 'paragraph',
        content: [
          createChip(formatTemp(observation.dewpoint), 'Dew Pt', 'temperature'),
          { type: 'text', text: '  ' },
          createChip(formatPressure(), 'Pressure', 'pressure'),
          { type: 'text', text: '  ' },
          createChip(formatVisibility(), 'Visibility', 'default'),
        ]
      },
      // Horizontal rule separator
      {
        type: 'horizontalRule'
      },
      // Empty paragraph for spacing
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

/**
 * Dispatch an event to insert observation data into notes
 */
export function insertObservationToNotes(observation, metadata = {}) {
  const formattedContent = formatObservationForNotes(observation, metadata);

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'observation',
      content: formattedContent,
      rawData: observation,
      metadata
    }
  });

  window.dispatchEvent(event);
}

/**
 * Subscribe to note insertion events
 * Returns an unsubscribe function
 */
export function subscribeToNoteInsertions(callback) {
  const handler = (event) => {
    callback(event.detail);
  };

  window.addEventListener(NOTE_INSERTION_EVENT, handler);

  return () => {
    window.removeEventListener(NOTE_INSERTION_EVENT, handler);
  };
}
