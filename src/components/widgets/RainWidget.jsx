import { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CloudRain, Snowflake, RefreshCw, ChevronRight, Droplets } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { useClimateNormals } from '../../hooks/useClimateNormals';
import { CITY_BY_SLUG } from '../../config/cities';
import RainHistoryModal from '../weather/RainHistoryModal';

// Historical rain highs for January (approximate values from records)
const HISTORICAL_RAIN_HIGHS = {
  'los-angeles': { value: 12.71, year: 1995 },
  'chicago': { value: 8.2, year: 1967 },
  'new-york': { value: 7.99, year: 1979 },
  'miami': { value: 9.91, year: 2016 },
  'denver': { value: 2.33, year: 1883 },
  'austin': { value: 8.86, year: 2007 },
  'philadelphia': { value: 6.63, year: 1996 },
  'houston': { value: 12.15, year: 1998 },
  'seattle': { value: 12.92, year: 1953 },
  'san-francisco': { value: 11.59, year: 1862 },
  'boston': { value: 8.23, year: 1979 },
  'washington-dc': { value: 5.98, year: 1996 },
  'dallas': { value: 7.64, year: 2007 },
  'detroit': { value: 5.18, year: 1950 },
  'salt-lake-city': { value: 5.83, year: 1993 },
  'new-orleans': { value: 14.27, year: 1991 },
};

// Historical snow highs for January (approximate values from records)
const HISTORICAL_SNOW_HIGHS = {
  'new-york': { value: 36.0, year: 1996 },
  'chicago': { value: 30.0, year: 1999 },
  'boston': { value: 35.5, year: 2005 },
  'denver': { value: 27.1, year: 1982 },
  'detroit': { value: 24.5, year: 1999 },
  'philadelphia': { value: 30.7, year: 1996 },
  'washington-dc': { value: 28.0, year: 1996 },
  'salt-lake-city': { value: 26.4, year: 1993 },
  'seattle': { value: 21.4, year: 1950 },
  'dallas': { value: 7.8, year: 2010 },
  'los-angeles': { value: 2.0, year: 1949 },
  'miami': { value: 0.0, year: null },
  'austin': { value: 4.4, year: 1985 },
  'houston': { value: 4.4, year: 1895 },
  'san-francisco': { value: 3.7, year: 1887 },
  'new-orleans': { value: 8.2, year: 1895 },
};

// Snow climate normals for January (inches, 1991-2020 NOAA data)
const SNOW_NORMALS = {
  'new-york': 7.0,
  'chicago': 11.3,
  'boston': 12.9,
  'denver': 6.7,
  'detroit': 12.3,
  'philadelphia': 6.4,
  'washington-dc': 5.6,
  'salt-lake-city': 12.0,
  'seattle': 1.0,
  'dallas': 0.3,
  'los-angeles': 0.0,
  'miami': 0.0,
  'austin': 0.1,
  'houston': 0.0,
  'san-francisco': 0.0,
  'new-orleans': 0.0,
};

/**
 * Fetch current month rain MTD from IEM CLI archive
 * Uses CLI (Climatological Report) which has official NWS precipitation data
 * This is more reliable than summing hourly METAR observations
 */
function useCurrentRainFromCLI(citySlug) {
  const [mtdTotal, setMtdTotal] = useState(null);
  const [mtdNormal, setMtdNormal] = useState(null);
  const [todayPrecip, setTodayPrecip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const city = CITY_BY_SLUG[citySlug];
    if (!city?.stationId) {
      setLoading(false);
      setMtdTotal(0);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const url = `https://mesonet.agron.iastate.edu/json/cli.py?station=${city.stationId}&year=${year}&month=${month}&day=${day}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.results && data.results.length > 0) {
        const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const monthResults = data.results.filter(r =>
          r.valid && r.valid.startsWith(targetPrefix)
        );

        // Get most recent day with data
        const result = monthResults[monthResults.length - 1];
        if (result) {
          // precip_month = MTD total
          const monthTotal = result.precip_month;
          if (monthTotal !== null && monthTotal !== undefined && monthTotal !== 'M') {
            if (monthTotal === 'T') {
              setMtdTotal(0.001); // Trace - show as non-zero but tiny
            } else {
              setMtdTotal(parseFloat(monthTotal));
            }
          } else {
            setMtdTotal(0);
          }

          // precip_month_normal = prorated MTD normal (what the normal should be by this day)
          const mtdNormalValue = result.precip_month_normal;
          if (mtdNormalValue !== null && mtdNormalValue !== undefined && mtdNormalValue !== 'M') {
            setMtdNormal(parseFloat(mtdNormalValue));
          }

          // precip = today's precipitation
          const todayValue = result.precip;
          if (todayValue !== null && todayValue !== undefined) {
            if (todayValue === 'T') {
              setTodayPrecip('T'); // Keep as trace string
            } else if (todayValue !== 'M') {
              setTodayPrecip(parseFloat(todayValue));
            }
          }
        } else {
          setMtdTotal(0);
        }
      } else {
        setMtdTotal(0);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching current rain from CLI:', err);
      setError(err.message);
      setMtdTotal(0);
    } finally {
      setLoading(false);
    }
  }, [citySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  return { mtdTotal, mtdNormal, todayPrecip, monthName, loading, error, refetch: fetchData };
}

/**
 * Fetch last year's full month precipitation from IEM CLI archive
 * Uses the CLI (Climatological Report) endpoint which has reliable historical data
 */
function useLastYearPrecipitation(citySlug) {
  const [lastYearTotal, setLastYearTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLastYear() {
      const city = CITY_BY_SLUG[citySlug];
      if (!city?.stationId) {
        setLoading(false);
        setLastYearTotal(0);
        return;
      }

      try {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        const month = now.getMonth() + 1; // 1-indexed for API

        // Get the last day of the month last year
        const lastDayOfMonth = new Date(lastYear, month, 0).getDate();

        // Fetch CLI data for the last day of the month (contains full month total)
        const url = `https://mesonet.agron.iastate.edu/json/cli.py?station=${city.stationId}&year=${lastYear}&month=${month}&day=${lastDayOfMonth}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data?.results && data.results.length > 0) {
          // API returns all historical data, filter for target year/month
          const targetPrefix = `${lastYear}-${String(month).padStart(2, '0')}`;
          const monthResults = data.results.filter(r =>
            r.valid && r.valid.startsWith(targetPrefix)
          );

          // Take the last day of the month (has full month total)
          const result = monthResults[monthResults.length - 1] || data.results[0];
          // precip_month contains the full month precipitation
          const monthTotal = result.precip_month;
          if (monthTotal !== null && monthTotal !== undefined && monthTotal !== 'M') {
            setLastYearTotal(parseFloat(monthTotal));
          } else {
            setLastYearTotal(0);
          }
        } else {
          setLastYearTotal(0);
        }
      } catch (err) {
        console.error('Error fetching last year precipitation:', err);
        setError(err.message);
        setLastYearTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchLastYear();
  }, [citySlug]);

  return { lastYearTotal, loading, error };
}

/**
 * Fetch last year's full month snow from IEM CLI archive
 * Uses the CLI (Climatological Report) endpoint which has reliable historical data
 */
function useLastYearSnow(citySlug) {
  const [lastYearTotal, setLastYearTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLastYear() {
      const city = CITY_BY_SLUG[citySlug];
      if (!city?.stationId) {
        setLoading(false);
        setLastYearTotal(0);
        return;
      }

      try {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        const month = now.getMonth() + 1;

        const lastDayOfMonth = new Date(lastYear, month, 0).getDate();
        const url = `https://mesonet.agron.iastate.edu/json/cli.py?station=${city.stationId}&year=${lastYear}&month=${month}&day=${lastDayOfMonth}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data?.results && data.results.length > 0) {
          const targetPrefix = `${lastYear}-${String(month).padStart(2, '0')}`;
          const monthResults = data.results.filter(r =>
            r.valid && r.valid.startsWith(targetPrefix)
          );

          const result = monthResults[monthResults.length - 1] || data.results[0];
          const monthTotal = result.snow_month;
          if (monthTotal !== null && monthTotal !== undefined && monthTotal !== 'M' && monthTotal !== 'T') {
            setLastYearTotal(parseFloat(monthTotal));
          } else if (monthTotal === 'T') {
            setLastYearTotal(0); // Trace amount
          } else {
            setLastYearTotal(null); // Missing data
          }
        } else {
          setLastYearTotal(null);
        }
      } catch (err) {
        console.error('Error fetching last year snow:', err);
        setError(err.message);
        setLastYearTotal(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLastYear();
  }, [citySlug]);

  return { lastYearTotal, loading, error };
}

/**
 * Fetch current month snow MTD from IEM CLI archive
 */
function useCurrentSnow(citySlug) {
  const [mtdTotal, setMtdTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCurrentSnow() {
      const city = CITY_BY_SLUG[citySlug];
      if (!city?.stationId) {
        setLoading(false);
        setMtdTotal(0);
        return;
      }

      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const url = `https://mesonet.agron.iastate.edu/json/cli.py?station=${city.stationId}&year=${year}&month=${month}&day=${day}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data?.results && data.results.length > 0) {
          const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
          const monthResults = data.results.filter(r =>
            r.valid && r.valid.startsWith(targetPrefix)
          );

          // Get most recent day with data
          const result = monthResults[monthResults.length - 1];
          if (result) {
            const monthTotal = result.snow_month;
            if (monthTotal !== null && monthTotal !== undefined && monthTotal !== 'M' && monthTotal !== 'T') {
              setMtdTotal(parseFloat(monthTotal));
            } else if (monthTotal === 'T') {
              setMtdTotal(0); // Trace
            } else {
              setMtdTotal(null);
            }
          } else {
            setMtdTotal(null);
          }
        } else {
          setMtdTotal(null);
        }
      } catch (err) {
        console.error('Error fetching current snow:', err);
        setError(err.message);
        setMtdTotal(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentSnow();
  }, [citySlug]);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  return { mtdTotal, monthName, loading, error };
}

/**
 * RainWidget - Compact monthly precipitation/snow comparison
 * Shows this season vs last season with normal reference line
 * Includes Rain/Snow tabs
 */
export default function RainWidget({ citySlug, cityName }) {
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('rain'); // 'rain' or 'snow'

  // Fetch rain data from IEM CLI (official NWS data)
  const {
    mtdTotal: rainMtd,
    mtdNormal: rainMtdNormal, // Prorated MTD normal from CLI
    todayPrecip: rainToday,
    monthName,
    loading: rainMtdLoading,
    error: rainMtdError,
    refetch: refetchRain,
  } = useCurrentRainFromCLI(citySlug);

  // Full month normals for modal
  const {
    currentMonthNormal: rainMonthNormal,
    monthlyNormals,
    annualNormal,
    stationName: normalsStation,
  } = useClimateNormals(citySlug);

  const { lastYearTotal: rainLastYear, loading: rainLastYearLoading } = useLastYearPrecipitation(citySlug);

  // Fetch snow data
  const { mtdTotal: snowMtd, loading: snowMtdLoading, error: snowMtdError } = useCurrentSnow(citySlug);
  const { lastYearTotal: snowLastYear, loading: snowLastYearLoading } = useLastYearSnow(citySlug);
  const snowNormal = SNOW_NORMALS[citySlug] ?? 0;

  // Current actual MTD based on active tab
  const actualMtd = activeTab === 'rain' ? (rainMtd ?? 0) : (snowMtd ?? 0);
  const lastYearTotal = activeTab === 'rain' ? rainLastYear : snowLastYear;
  // Use prorated MTD normal for rain (from CLI), full month for snow
  const currentNormal = activeTab === 'rain' ? (rainMtdNormal ?? rainMonthNormal) : snowNormal;
  // Today's precipitation (for display)
  const todayPrecip = activeTab === 'rain' ? rainToday : null;

  // Historical high for this month
  const historicalHigh = activeTab === 'rain'
    ? HISTORICAL_RAIN_HIGHS[citySlug]
    : HISTORICAL_SNOW_HIGHS[citySlug];

  // Prepare chart data - two bars with labels
  const chartData = useMemo(() => {
    const data = [];
    const unit = activeTab === 'rain' ? '"' : '"';
    const barColor = activeTab === 'rain' ? '#22D3EE' : '#A5B4FC'; // cyan-400 for rain, indigo-300 for snow

    // Last year - always include even if 0
    data.push({
      name: '2025',
      value: lastYearTotal ?? 0,
      fill: '#64748B', // slate-500
      label: lastYearTotal !== null ? `${lastYearTotal.toFixed(1)}${unit}` : '...',
    });

    // This year MTD
    data.push({
      name: '2026',
      value: actualMtd,
      fill: barColor,
      label: `${actualMtd.toFixed(1)}${unit}`,
    });

    return data;
  }, [actualMtd, lastYearTotal, activeTab]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'rain') {
      await refetchRain();
    }
    // Snow data refreshes on mount, no explicit refetch
    setIsRefreshing(false);
  };

  // Loading state
  const isLoading = activeTab === 'rain'
    ? ((rainMtdLoading && rainMtd === null) || rainLastYearLoading)
    : (snowMtdLoading || snowLastYearLoading);

  const mtdError = activeTab === 'rain' ? rainMtdError : snowMtdError;

  // Custom label renderer for bars - bold for current year (index 1)
  const renderCustomLabel = (props) => {
    const { x, y, width, value, index } = props;
    const isCurrentYear = index === 1;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={isCurrentYear ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)"}
        textAnchor="middle"
        fontSize={isCurrentYear ? 12 : 10}
        fontWeight={isCurrentYear ? "700" : "400"}
      >
        {typeof value === 'number' ? `${value.toFixed(2)}"` : value}
      </text>
    );
  };

  return (
    <>
      <div className="glass-widget h-full flex flex-col overflow-hidden">
        {/* Header with Tabs */}
        <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
              <button
                onClick={() => setActiveTab('rain')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'rain'
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <CloudRain className="w-3 h-3" />
                Rain
              </button>
              <button
                onClick={() => setActiveTab('snow')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeTab === 'snow'
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <Snowflake className="w-3 h-3" />
                Snow
              </button>
            </div>
            <span className="text-[10px] text-white/40">{monthName}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-3 py-2 flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-white/40 text-xs">Loading...</div>
            </div>
          ) : mtdError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-400/70 text-xs">{mtdError}</div>
            </div>
          ) : (activeTab === 'snow' && snowMtd === null && snowLastYear === null) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-white/40 text-xs text-center">
                <Snowflake className="w-6 h-6 mx-auto mb-1 opacity-30" />
                No snow data available
              </div>
            </div>
          ) : (
            <>
              {/* Chart with side label */}
              <div className="flex-1 flex min-h-[90px]">
                {/* Bar Chart - no Y-axis, bars show values */}
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 18, right: 8, left: 8, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      {/* Hidden Y-axis just for scaling */}
                      <YAxis hide domain={[0, 'auto']} />
                      {/* Normal reference line */}
                      {currentNormal > 0 && (
                        <ReferenceLine
                          y={currentNormal}
                          stroke="rgba(34,211,238,0.4)"
                          strokeDasharray="4 3"
                          strokeWidth={1}
                        />
                      )}
                      <Bar
                        dataKey="value"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={52}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          content={renderCustomLabel}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Side label for normal */}
                {currentNormal > 0 && (
                  <div className="flex flex-col justify-center pr-1 -ml-1">
                    <div className="text-[9px] text-cyan-400/60 whitespace-nowrap leading-tight">
                      <div>{currentNormal.toFixed(2)}"</div>
                      <div className="text-white/30">avg</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom row: Record + context */}
              <div className="flex items-center justify-between px-1 text-[9px] text-white/30">
                {historicalHigh && historicalHigh.year && (
                  <span>Record: {historicalHigh.value}" ({historicalHigh.year})</span>
                )}
                {currentNormal > 0 && actualMtd > 0 && (
                  <span className={actualMtd >= currentNormal ? 'text-cyan-400/50' : 'text-white/30'}>
                    {actualMtd >= currentNormal ? '+' : ''}{((actualMtd / currentNormal - 1) * 100).toFixed(0)}% of avg
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'rain' ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 border-t border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <Droplets className="w-2.5 h-2.5" />
              <span>Monthly normals</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/30" />
          </button>
        ) : (
          <div className="px-3 py-1.5 border-t border-white/10 text-[10px] text-white/30 text-center">
            Source: IEM Climate Data
          </div>
        )}
      </div>

      {/* History Modal */}
      <RainHistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        cityName={cityName}
        monthlyNormals={monthlyNormals}
        annualNormal={annualNormal}
        stationName={normalsStation}
      />
    </>
  );
}

RainWidget.propTypes = {
  citySlug: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
};
