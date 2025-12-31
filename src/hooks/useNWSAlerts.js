import { useState, useEffect } from 'react';

/**
 * Hook to fetch NWS alerts for a location
 * Uses the NWS API: https://api.weather.gov/alerts
 */
export function useNWSAlerts(lat, lon) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch alerts for the point
        const response = await fetch(
          `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
          {
            headers: {
              'User-Agent': 'Toasty Research App',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch alerts: ${response.status}`);
        }

        const data = await response.json();

        // Parse alerts
        const parsedAlerts = (data.features || []).map((feature) => {
          const props = feature.properties;
          return {
            id: props.id,
            event: props.event,
            headline: props.headline,
            description: props.description,
            instruction: props.instruction,
            severity: props.severity, // Minor, Moderate, Severe, Extreme
            urgency: props.urgency, // Immediate, Expected, Future, Past, Unknown
            certainty: props.certainty,
            onset: props.onset ? new Date(props.onset) : null,
            expires: props.expires ? new Date(props.expires) : null,
            senderName: props.senderName,
            areaDesc: props.areaDesc,
          };
        });

        // Sort by severity (Extreme first, then Severe, etc.)
        const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
        parsedAlerts.sort((a, b) =>
          (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4)
        );

        setAlerts(parsedAlerts);
      } catch (err) {
        console.error('Error fetching NWS alerts:', err);
        setError(err.message);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  return { alerts, loading, error };
}

/**
 * Get color for alert severity
 */
export function getAlertColor(severity) {
  switch (severity) {
    case 'Extreme':
      return { bg: 'bg-red-500/30', text: 'text-red-400', border: 'border-red-500/50' };
    case 'Severe':
      return { bg: 'bg-orange-500/30', text: 'text-orange-400', border: 'border-orange-500/50' };
    case 'Moderate':
      return { bg: 'bg-yellow-500/30', text: 'text-yellow-400', border: 'border-yellow-500/50' };
    case 'Minor':
      return { bg: 'bg-blue-500/30', text: 'text-blue-400', border: 'border-blue-500/50' };
    default:
      return { bg: 'bg-gray-500/30', text: 'text-gray-400', border: 'border-gray-500/50' };
  }
}

/**
 * Get icon for alert type
 */
export function getAlertIcon(event) {
  const eventLower = event?.toLowerCase() || '';

  if (eventLower.includes('tornado')) return '🌪️';
  if (eventLower.includes('hurricane') || eventLower.includes('tropical')) return '🌀';
  if (eventLower.includes('flood')) return '🌊';
  if (eventLower.includes('thunder') || eventLower.includes('lightning')) return '⛈️';
  if (eventLower.includes('winter') || eventLower.includes('snow') || eventLower.includes('blizzard')) return '❄️';
  if (eventLower.includes('heat')) return '🌡️';
  if (eventLower.includes('wind')) return '💨';
  if (eventLower.includes('fire')) return '🔥';
  if (eventLower.includes('fog')) return '🌫️';
  if (eventLower.includes('freeze') || eventLower.includes('frost')) return '🥶';

  return '⚠️';
}
