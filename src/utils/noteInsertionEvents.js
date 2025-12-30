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
  }).replace(' AM', '').replace(' PM', '');

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
  const createChip = (value, label, type) => ({
    type: 'dataChip',
    attrs: {
      value,
      label,
      type,
      source: '',
      timestamp: '',
    }
  });

  // Format wind without unit for compact display
  const formatWindCompact = () => {
    if (observation.windSpeed == null) return '--';
    const dir = getWindDirection(observation.windDirection);
    return `${dir} ${Math.round(observation.windSpeed)}`;
  };

  // Format pressure without unit for compact display
  const formatPressureCompact = () => {
    if (observation.pressure == null) return '--';
    if (useMetric) {
      return `${Math.round(observation.pressure / 100)}`;
    }
    return `${(observation.pressure / 3386.39).toFixed(2)}`;
  };

  // Build full observation as a single chip with all data
  const fullObsValue = [
    timeStr,
    formatTemp(observation.temperature),
    formatHumidity(),
    `DP ${formatTemp(observation.dewpoint)}`,
    formatWindCompact(),
    formatPressureCompact(),
  ].filter(v => v && v !== '--').join(' · ');

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          createChip(fullObsValue, '', 'observation'),
        ]
      },
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
 * Format a single data point from an observation for notes
 * @param {Object} observation - The observation data
 * @param {string} dataType - One of: temperature, dewpoint, humidity, wind, visibility, pressure
 * @param {Object} metadata - Optional metadata (timezone, useMetric)
 */
export function formatSingleDataPoint(observation, dataType, metadata = {}) {
  const { timezone = 'America/New_York', useMetric = false } = metadata;

  // Format timestamp
  const date = observation.timestamp instanceof Date
    ? observation.timestamp
    : new Date(observation.timestamp);

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(' AM', '').replace(' PM', '');

  // Format helper functions
  const formatTemp = (tempF) => {
    if (tempF == null) return '--';
    if (useMetric) {
      const tempC = (tempF - 32) * 5 / 9;
      return `${Math.round(tempC)}°C`;
    }
    return `${Math.round(tempF)}°F`;
  };

  const formatHumidity = () => {
    if (observation.humidity == null) return '--';
    return `${Math.round(observation.humidity)}%`;
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

  // Helper to create a data chip node
  const createChip = (value, label, type) => ({
    type: 'dataChip',
    attrs: { value, label, type, source: '', timestamp: '' }
  });

  // Compact formatters (no units)
  const formatWindCompact = () => {
    if (observation.windSpeed == null) return '--';
    const dir = getWindDirection(observation.windDirection);
    return `${dir} ${Math.round(observation.windSpeed)}`;
  };

  const formatPressureCompact = () => {
    if (observation.pressure == null) return '--';
    if (useMetric) {
      return `${Math.round(observation.pressure / 100)}`;
    }
    return `${(observation.pressure / 3386.39).toFixed(2)}`;
  };

  const formatVisibilityCompact = () => {
    if (observation.visibility == null) return '--';
    if (useMetric) {
      return `${(observation.visibility / 1000).toFixed(1)}`;
    }
    return `${(observation.visibility / 1609.34).toFixed(1)}`;
  };

  // Build chip value with timestamp included
  let chipValue;
  let chipType;
  switch (dataType) {
    case 'temperature':
      chipValue = `${timeStr} · ${formatTemp(observation.temperature)}`;
      chipType = 'temperature';
      break;
    case 'dewpoint':
      chipValue = `${timeStr} · DP ${formatTemp(observation.dewpoint)}`;
      chipType = 'temperature';
      break;
    case 'humidity':
      chipValue = `${timeStr} · ${formatHumidity()}`;
      chipType = 'humidity';
      break;
    case 'wind':
      chipValue = `${timeStr} · ${formatWindCompact()}`;
      chipType = 'wind';
      break;
    case 'visibility':
      chipValue = `${timeStr} · Vis ${formatVisibilityCompact()}`;
      chipType = 'humidity';
      break;
    case 'pressure':
      chipValue = `${timeStr} · ${formatPressureCompact()}`;
      chipType = 'pressure';
      break;
    default:
      chipValue = `${timeStr} · --`;
      chipType = 'observation';
  }

  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [
        createChip(chipValue, '', chipType),
      ]
    }]
  };
}

/**
 * Dispatch an event to insert a single data point into notes
 */
export function insertSingleDataPoint(observation, dataType, metadata = {}) {
  const formattedContent = formatSingleDataPoint(observation, dataType, metadata);

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'single-data',
      content: formattedContent,
      rawData: observation,
      dataType,
      metadata
    }
  });

  window.dispatchEvent(event);
}

/**
 * Format NWS forecast period for notes
 */
export function formatForecastForNotes(period, metadata = {}) {
  const { source = 'NWS', gridId, location } = metadata;

  // Build source label (e.g., "NWS Forecast (LOX) · Los Angeles, CA")
  const sourceLabel = gridId
    ? `${source} Forecast (${gridId})`
    : `${source} Forecast`;
  const headerText = location
    ? `${sourceLabel} · ${location}`
    : sourceLabel;

  // Helper to create a data chip node
  const createChip = (value, label, type) => ({
    type: 'dataChip',
    attrs: {
      value,
      label,
      type,
      source: '',
      timestamp: '',
    }
  });

  return {
    type: 'doc',
    content: [
      // Source header
      {
        type: 'paragraph',
        content: [
          { type: 'text', marks: [{ type: 'bold' }], text: headerText }
        ]
      },
      // Period name + condition
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${period.name}: ${period.shortForecast}` }
        ]
      },
      // Temperature and wind chips
      {
        type: 'paragraph',
        content: [
          createChip(`${period.temperature}°${period.temperatureUnit || 'F'}`, '', 'forecast'),
          { type: 'text', text: ' ' },
          ...(period.windSpeed ? [
            createChip(`${period.windDirection} ${period.windSpeed}`, 'Wind', 'wind'),
          ] : []),
        ]
      },
      // Horizontal rule
      {
        type: 'horizontalRule'
      },
    ]
  };
}

/**
 * Dispatch an event to insert forecast data into notes
 */
export function insertForecastToNotes(period, metadata = {}) {
  const formattedContent = formatForecastForNotes(period, metadata);

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'forecast',
      content: formattedContent,
      rawData: period,
      metadata
    }
  });

  window.dispatchEvent(event);
}

/**
 * Format model comparison data for notes
 */
export function formatModelsForNotes(data, metadata = {}) {
  const { dayConsensus, models, selectedDay, dateLabel } = data;

  // Helper to create a data chip node
  const createChip = (value, label, type) => ({
    type: 'dataChip',
    attrs: {
      value,
      label,
      type,
      source: '',
      timestamp: '',
    }
  });

  // Build model summary text
  const modelSummary = models.map(m => {
    const dayData = m.daily[selectedDay];
    return `${m.name}: ${dayData?.high}°`;
  }).join(' · ');

  return {
    type: 'doc',
    content: [
      // Date header
      {
        type: 'paragraph',
        content: [
          { type: 'text', marks: [{ type: 'bold' }], text: `Model Consensus · ${dateLabel}` }
        ]
      },
      // Consensus chips
      {
        type: 'paragraph',
        content: [
          createChip(`${dayConsensus.highAvg}°`, 'High', 'temperature'),
          { type: 'text', text: ' ' },
          createChip(`${dayConsensus.lowAvg}°`, 'Low', 'forecast'),
          { type: 'text', text: ' ' },
          createChip(`±${Math.round(dayConsensus.spread / 2)}°`, 'Spread',
            dayConsensus.spread <= 3 ? 'market' : dayConsensus.spread <= 6 ? 'humidity' : 'temperature'),
        ]
      },
      // Model breakdown
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: modelSummary }
        ]
      },
      // Horizontal rule
      {
        type: 'horizontalRule'
      },
    ]
  };
}

/**
 * Dispatch an event to insert model comparison data into notes
 */
export function insertModelsToNotes(data, metadata = {}) {
  const formattedContent = formatModelsForNotes(data, metadata);

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'models',
      content: formattedContent,
      rawData: data,
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
