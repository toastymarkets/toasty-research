import { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, ChevronUp, ChevronDown, Thermometer, Calendar } from 'lucide-react';

/**
 * Map city slugs to IEM network and station IDs
 * IEM uses state-based ASOS networks
 */
const CITY_IEM_CONFIG = {
  'new-york': { network: 'NY_ASOS', station: 'NYC', name: 'Central Park' },
  'chicago': { network: 'IL_ASOS', station: 'MDW', name: 'Midway' },
  'los-angeles': { network: 'CA_ASOS', station: 'LAX', name: 'LAX Airport' },
  'miami': { network: 'FL_ASOS', station: 'MIA', name: 'Miami Intl' },
  'denver': { network: 'CO_ASOS', station: 'DEN', name: 'Denver Intl' },
  'austin': { network: 'TX_ASOS', station: 'AUS', name: 'Austin Airport' },
  'philadelphia': { network: 'PA_ASOS', station: 'PHL', name: 'Philadelphia Intl' },
  'houston': { network: 'TX_ASOS', station: 'HOU', name: 'Hobby Airport' },
  'seattle': { network: 'WA_ASOS', station: 'SEA', name: 'Seattle-Tacoma' },
  'san-francisco': { network: 'CA_ASOS', station: 'SFO', name: 'SFO Airport' },
  'boston': { network: 'MA_ASOS', station: 'BOS', name: 'Logan Airport' },
  'washington-dc': { network: 'VA_ASOS', station: 'DCA', name: 'Reagan National' },
  'dallas': { network: 'TX_ASOS', station: 'DFW', name: 'DFW Airport' },
  'detroit': { network: 'MI_ASOS', station: 'DTW', name: 'Detroit Metro' },
  'salt-lake-city': { network: 'UT_ASOS', station: 'SLC', name: 'Salt Lake City' },
};

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Hook to fetch IEM daily summary data
 */
function useIEMDailySummary(citySlug, date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = CITY_IEM_CONFIG[citySlug];

  const fetchData = useCallback(async () => {
    if (!config) {
      setError('No IEM config for this city');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateStr = formatDate(date);
      const url = `https://mesonet.agron.iastate.edu/api/1/daily.json?network=${config.network}&station=${config.station}&date=${dateStr}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const records = json.data || [];

      if (records.length === 0) {
        setError('No data available');
        setData(null);
      } else {
        setData(records[0]);
      }
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [config, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, stationName: config?.name };
}

export default function DailySummary({ citySlug, cityName, className = '' }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isExpanded, setIsExpanded] = useState(true);

  const { data, loading, error, refetch, stationName } = useIEMDailySummary(citySlug, selectedDate);

  const config = CITY_IEM_CONFIG[citySlug];

  const formatTemp = (temp) => {
    if (temp == null) return '--';
    return `${Math.round(temp)}°F`;
  };

  const formatPrecip = (precip) => {
    if (precip == null) return '--';
    if (precip < 0.01) return 'Trace';
    return `${precip.toFixed(2)}"`;
  };

  const formatWind = (speed) => {
    if (speed == null) return '--';
    return `${Math.round(speed)} mph`;
  };

  const formatHumidity = (rh) => {
    if (rh == null) return '--';
    return `${Math.round(rh)}%`;
  };

  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Don't allow future dates beyond today
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold">Daily Summary (DSM)</h3>
          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-1.5 rounded-lg hover:bg-[var(--color-card-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Date selector */}
          <div className="flex items-center justify-between mb-4 p-2 rounded-xl bg-[var(--color-card-elevated)]">
            <button
              onClick={goToPrevDay}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ChevronDown size={16} className="rotate-90" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={goToNextDay}
              disabled={isToday}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={16} className="-rotate-90" />
            </button>
          </div>

          {/* Station info */}
          {config && (
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              Station: {config.station} ({stationName}) via IEM
            </div>
          )}

          {/* Content */}
          {!config ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              No IEM data available for this city
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--color-card-elevated)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : !data ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              No data for this date
            </div>
          ) : (
            <div className="space-y-3">
              {/* Temperature Card */}
              <div className="p-4 rounded-xl bg-[var(--color-card-elevated)]">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer size={16} className="text-orange-500" />
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">Temperature</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">High</div>
                    <div className="text-2xl font-bold text-red-500">{formatTemp(data.max_tmpf)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Low</div>
                    <div className="text-2xl font-bold text-blue-500">{formatTemp(data.min_tmpf)}</div>
                  </div>
                </div>
                {(data.max_feel != null || data.min_feel != null) && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Feels High: </span>
                      <span className="font-medium">{formatTemp(data.max_feel)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Feels Low: </span>
                      <span className="font-medium">{formatTemp(data.min_feel)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            Data from Iowa Environmental Mesonet (IEM)
          </div>
        </>
      )}
    </div>
  );
}
