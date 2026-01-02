/**
 * NWS Data Release Schedule Configuration
 *
 * Times are in UTC. CLI is the official resolution source for Kalshi temperature markets.
 *
 * Data Types:
 * - CLI Report: Daily climatological summary (settlement data)
 * - 24hr High: METAR with max temp
 * - METAR: Hourly observations at specified minute past the hour
 * - DSM: Daily Summary Message (interim data, not for settlement)
 * - 6-Hour High/Low: Reports at 05:53, 11:53, 17:53, 23:53 UTC
 */

export const DATA_SCHEDULE = {
  // Atlanta, GA
  KATL: {
    name: 'Atlanta',
    city: 'Atlanta, GA',
    cliTime: '09:17',
    cliVariability: 35, // ±35 minutes
    highTime24h: '04:52',
    metarMinute: 52,
    dsmCount: 2,
  },
  // Austin, TX
  KAUS: {
    name: 'Austin',
    city: 'Austin, TX',
    cliTime: '08:01',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Boston, MA
  KBOS: {
    name: 'Boston',
    city: 'Boston, MA',
    cliTime: '05:30',
    cliVariability: 35,
    highTime24h: '04:54',
    metarMinute: 54,
    dsmCount: 3,
  },
  // Charlotte, NC
  KCLT: {
    name: 'Charlotte',
    city: 'Charlotte, NC',
    cliTime: '07:26',
    cliVariability: 35,
    highTime24h: '04:52',
    metarMinute: 52,
    dsmCount: 3,
  },
  // Chicago, IL (Midway)
  KMDW: {
    name: 'Chicago',
    city: 'Chicago, IL',
    cliTime: '06:46',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 2,
  },
  // Dallas, TX (DFW)
  KDFW: {
    name: 'Dallas',
    city: 'Dallas, TX',
    cliTime: '06:40',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Dallas Love Field, TX
  KDAL: {
    name: 'Dallas Love Field',
    city: 'Dallas Love Field, TX',
    cliTime: null, // No CLI
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Denver, CO
  KDEN: {
    name: 'Denver',
    city: 'Denver, CO',
    cliTime: '07:31',
    cliVariability: 35,
    highTime24h: '06:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Detroit, MI
  KDTW: {
    name: 'Detroit',
    city: 'Detroit, MI',
    cliTime: '06:40',
    cliVariability: 35,
    highTime24h: '04:53',
    metarMinute: 53,
    dsmCount: null, // No DSM count provided
  },
  // Houston, TX (Hobby)
  KHOU: {
    name: 'Houston',
    city: 'Houston, TX',
    cliTime: '06:29',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 4,
  },
  // Jacksonville, FL
  KJAX: {
    name: 'Jacksonville',
    city: 'Jacksonville, FL',
    cliTime: '06:32',
    cliVariability: 35,
    highTime24h: '04:56',
    metarMinute: 56,
    dsmCount: 2,
  },
  // LaGuardia, NY
  KLGA: {
    name: 'LaGuardia',
    city: 'LaGuardia, NY',
    cliTime: '06:18',
    cliVariability: 35,
    highTime24h: '04:51',
    metarMinute: 51,
    dsmCount: 3,
  },
  // Las Vegas, NV
  KLAS: {
    name: 'Las Vegas',
    city: 'Las Vegas, NV',
    cliTime: '08:44',
    cliVariability: 35,
    highTime24h: null, // No 24hr high time provided
    metarMinute: 56,
    dsmCount: null,
  },
  // Los Angeles, CA (LAX)
  KLAX: {
    name: 'Los Angeles',
    city: 'Los Angeles, CA',
    cliTime: '09:28',
    cliVariability: 35,
    highTime24h: '07:53',
    metarMinute: 53,
    dsmCount: 2,
  },
  // Miami, FL
  KMIA: {
    name: 'Miami',
    city: 'Miami, FL',
    cliTime: '09:22',
    cliVariability: 35,
    highTime24h: '04:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Minneapolis, MN
  KMSP: {
    name: 'Minneapolis',
    city: 'Minneapolis, MN',
    cliTime: '07:12',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: null,
  },
  // Nashville, TN
  KBNA: {
    name: 'Nashville',
    city: 'Nashville, TN',
    cliTime: '07:01',
    cliVariability: 35,
    highTime24h: '05:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // New York, NY (Central Park)
  KNYC: {
    name: 'New York',
    city: 'New York, NY',
    cliTime: '06:18',
    cliVariability: 35,
    highTime24h: '04:51',
    metarMinute: 51,
    dsmCount: 2,
  },
  // Oklahoma City, OK
  KOKC: {
    name: 'Oklahoma City',
    city: 'Oklahoma City, OK',
    cliTime: '07:28',
    cliVariability: 35,
    highTime24h: '05:52',
    metarMinute: 52,
    dsmCount: 3,
  },
  // Philadelphia, PA
  KPHL: {
    name: 'Philadelphia',
    city: 'Philadelphia, PA',
    cliTime: '05:55',
    cliVariability: 35,
    highTime24h: '04:54',
    metarMinute: 54,
    dsmCount: 2,
  },
  // Phoenix, AZ
  KPHX: {
    name: 'Phoenix',
    city: 'Phoenix, AZ',
    cliTime: '08:16',
    cliVariability: 35,
    highTime24h: '06:51',
    metarMinute: 51,
    dsmCount: 3,
  },
  // San Antonio, TX
  KSAT: {
    name: 'San Antonio',
    city: 'San Antonio, TX',
    cliTime: '08:01',
    cliVariability: 35,
    highTime24h: '05:51',
    metarMinute: 51,
    dsmCount: 3,
  },
  // San Francisco, CA
  KSFO: {
    name: 'San Francisco',
    city: 'San Francisco, CA',
    cliTime: '08:51',
    cliVariability: 35,
    highTime24h: '07:56',
    metarMinute: 56,
    dsmCount: 2,
  },
  // Seattle, WA
  KSEA: {
    name: 'Seattle',
    city: 'Seattle, WA',
    cliTime: '09:33',
    cliVariability: 35,
    highTime24h: '07:53',
    metarMinute: 53,
    dsmCount: 2,
  },
  // Tampa, FL
  KTPA: {
    name: 'Tampa',
    city: 'Tampa, FL',
    cliTime: '09:27',
    cliVariability: 35,
    highTime24h: '04:53',
    metarMinute: 53,
    dsmCount: 3,
  },
  // Washington D.C.
  KDCA: {
    name: 'Washington DC',
    city: 'Washington D.C., DC',
    cliTime: '07:32',
    cliVariability: 35,
    highTime24h: '04:52',
    metarMinute: 52,
    dsmCount: 1,
  },
  // Salt Lake City (from cities config, not in user's table)
  KSLC: {
    name: 'Salt Lake City',
    city: 'Salt Lake City, UT',
    cliTime: '08:00',
    cliVariability: 35,
    highTime24h: '06:53',
    metarMinute: 53,
    dsmCount: 2,
  },
};

/**
 * 6-Hour High/Low observation times (UTC)
 * These METARs include 6-hour maximum and minimum temperatures
 */
export const SIX_HOUR_OBSERVATION_TIMES = [
  { utc: '05:53', label: '00Z+6h', description: 'Overnight period' },
  { utc: '11:53', label: '06Z+6h', description: 'Morning period' },
  { utc: '17:53', label: '12Z+6h', description: 'Afternoon period' },
  { utc: '23:53', label: '18Z+6h', description: 'Evening period' },
];

/**
 * Get the next CLI release time for a station
 * @param {string} stationId - Station ID (e.g., 'KNYC')
 * @returns {Date|null} - Next CLI release time or null if not available
 */
export function getNextCliRelease(stationId) {
  const schedule = DATA_SCHEDULE[stationId];
  if (!schedule?.cliTime) return null;

  const now = new Date();
  const [hours, minutes] = schedule.cliTime.split(':').map(Number);

  const target = new Date(now);
  target.setUTCHours(hours, minutes, 0, 0);

  // If past today's release, get tomorrow's
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Get the next 6-hour high/low observation time
 * @returns {{ target: Date, label: string, description: string }}
 */
export function getNextSixHourRelease() {
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  for (const time of SIX_HOUR_OBSERVATION_TIMES) {
    const [h, m] = time.utc.split(':').map(Number);
    const targetMinutes = h * 60 + m;

    if (targetMinutes > currentMinutes) {
      const target = new Date(now);
      target.setUTCHours(h, m, 0, 0);
      return { target, label: time.label, description: time.description };
    }
  }

  // Wrap to tomorrow's first release
  const [h, m] = SIX_HOUR_OBSERVATION_TIMES[0].utc.split(':').map(Number);
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setUTCHours(h, m, 0, 0);
  return {
    target,
    label: SIX_HOUR_OBSERVATION_TIMES[0].label,
    description: SIX_HOUR_OBSERVATION_TIMES[0].description,
  };
}

/**
 * Get the next METAR observation time for a station
 * @param {string} stationId - Station ID (e.g., 'KNYC')
 * @returns {Date|null} - Next METAR time or null if not available
 */
export function getNextMetarRelease(stationId) {
  const schedule = DATA_SCHEDULE[stationId];
  if (!schedule?.metarMinute) return null;

  const now = new Date();
  const target = new Date(now);

  // Set to the METAR minute of the current hour
  target.setUTCMinutes(schedule.metarMinute, 0, 0);

  // If past this hour's METAR, get next hour's
  if (target <= now) {
    target.setUTCHours(target.getUTCHours() + 1);
  }

  return target;
}

/**
 * Format a countdown duration
 * @param {number} diffMs - Difference in milliseconds
 * @returns {{ formatted: string, hours: number, minutes: number, seconds: number }}
 */
export function formatCountdown(diffMs) {
  if (diffMs <= 0) {
    return { formatted: 'Now', hours: 0, minutes: 0, seconds: 0, isNow: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, hours, minutes, seconds, isNow: false };
}

/**
 * Convert UTC time string to local time for a timezone
 * @param {string} utcTime - Time in 'HH:MM' format (UTC)
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Local time string
 */
export function utcToLocalTime(utcTime, timezone) {
  if (!utcTime) return '--';

  const [hours, minutes] = utcTime.split(':').map(Number);

  // Create a date with the UTC time
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get external resource links for a station
 * @param {string} stationId - Station ID (e.g., 'KNYC')
 * @returns {Object} - Object with resource URLs
 */
export function getStationResources(stationId) {
  const station = stationId.replace('K', ''); // Remove K prefix for some URLs

  return {
    nwsTimeSeries: `https://www.weather.gov/wrh/timeseries?site=${stationId}`,
    cliReport: `https://mesonet.agron.iastate.edu/wx/afos/list.phtml?source=K${station.slice(0, 3)}&pil=CLI${station}`,
    pointForecast: `https://forecast.weather.gov/`,
    hourlyForecast: `https://forecast.weather.gov/`,
    iemAsos: `https://mesonet.agron.iastate.edu/request/download.phtml?network=ASOS`,
    iemDsm: `https://mesonet.agron.iastate.edu/request/daily.phtml`,
  };
}
