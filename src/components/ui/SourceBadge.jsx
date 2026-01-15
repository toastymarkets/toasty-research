/**
 * SourceBadge - Displays data source with color-coded badge
 *
 * Source types:
 * - CLI: Official NWS Climate Report (gold) - final settlement
 * - DSM: Daily Summary Message (silver) - interim data
 * - OBS: Live observation/METAR (blue) - real-time
 * - FCST: Forecast data (purple) - prediction
 * - NWS: NWS discussion/text (teal) - analysis
 */

const SOURCE_CONFIG = {
  CLI: {
    label: 'CLI',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    tooltip: 'Official NWS Climate Report - Final settlement value',
    icon: 'gold',
  },
  DSM: {
    label: 'DSM',
    color: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
    tooltip: 'Daily Summary Message - Interim data (not final)',
    icon: 'silver',
  },
  OBS: {
    label: 'OBS',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tooltip: 'Live METAR observation - Real-time data',
    icon: 'live',
  },
  METAR: {
    label: 'METAR',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tooltip: 'Aviation weather report - Updates hourly',
    icon: 'live',
  },
  FCST: {
    label: 'FCST',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    tooltip: 'NWS Forecast - Predicted value',
    icon: 'forecast',
  },
  NWS: {
    label: 'NWS',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    tooltip: 'NWS Discussion - Forecaster analysis',
    icon: 'text',
  },
  MODEL: {
    label: 'MODEL',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    tooltip: 'Weather model output - Computer forecast',
    icon: 'model',
  },
  IEM: {
    label: 'IEM',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    tooltip: 'Iowa Environmental Mesonet - Archive data',
    icon: 'archive',
  },
};

export default function SourceBadge({
  type,
  station = null,
  timestamp = null,
  size = 'sm',
  showTooltip = true,
}) {
  const config = SOURCE_CONFIG[type?.toUpperCase()] || SOURCE_CONFIG.OBS;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.color}
        ${sizeClasses[size] || sizeClasses.sm}
      `}
      title={showTooltip ? `${config.tooltip}${station ? ` (${station})` : ''}${timestamp ? ` @ ${timestamp}` : ''}` : undefined}
    >
      {config.label}
      {station && <span className="opacity-70">{station}</span>}
    </span>
  );
}

/**
 * Inline source indicator - smaller, for use inside text
 */
export function SourceIndicator({ type }) {
  const config = SOURCE_CONFIG[type?.toUpperCase()] || SOURCE_CONFIG.OBS;

  return (
    <span
      className={`text-[10px] px-1 py-px rounded ${config.color}`}
      title={config.tooltip}
    >
      {config.label}
    </span>
  );
}

/**
 * Data freshness indicator
 */
export function FreshnessIndicator({ timestamp, maxAgeMinutes = 60 }) {
  if (!timestamp) return null;

  const now = new Date();
  const dataTime = new Date(timestamp);
  const ageMinutes = Math.floor((now - dataTime) / (1000 * 60));

  let color = 'text-green-400'; // Fresh (< 15 min)
  let label = 'Live';

  if (ageMinutes >= maxAgeMinutes) {
    color = 'text-red-400';
    label = 'Stale';
  } else if (ageMinutes >= 30) {
    color = 'text-yellow-400';
    label = `${ageMinutes}m ago`;
  } else if (ageMinutes >= 15) {
    color = 'text-blue-400';
    label = `${ageMinutes}m ago`;
  } else if (ageMinutes > 0) {
    label = `${ageMinutes}m ago`;
  }

  return (
    <span className={`text-xs ${color}`}>
      {label}
    </span>
  );
}
