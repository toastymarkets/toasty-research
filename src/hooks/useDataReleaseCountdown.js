import { useState, useEffect, useCallback } from 'react';
import {
  DATA_SCHEDULE,
  getNextCliRelease,
  getNextSixHourRelease,
  getNextMetarRelease,
  formatCountdown,
} from '../config/dataSchedule';

/**
 * Hook to track countdown timers for NWS data releases
 *
 * Provides real-time countdowns to:
 * - Next CLI report release
 * - Next 6-hour high/low observation
 * - Next METAR observation
 *
 * @param {string} stationId - Station ID (e.g., 'KNYC')
 * @returns {Object} Countdown data for each release type
 */
export function useDataReleaseCountdown(stationId) {
  const [countdowns, setCountdowns] = useState({
    cli: null,
    sixHour: null,
    metar: null,
  });

  const calculateCountdowns = useCallback(() => {
    const schedule = DATA_SCHEDULE[stationId];

    if (!schedule) {
      setCountdowns({ cli: null, sixHour: null, metar: null });
      return;
    }

    const now = new Date();

    // CLI countdown
    const cliTarget = getNextCliRelease(stationId);
    const cliDiff = cliTarget ? cliTarget.getTime() - now.getTime() : 0;
    const cliCountdown = cliTarget
      ? {
          ...formatCountdown(cliDiff),
          target: cliTarget,
          time: schedule.cliTime,
          variability: schedule.cliVariability || 35,
        }
      : null;

    // 6-hour high/low countdown
    const sixHourInfo = getNextSixHourRelease();
    const sixHourDiff = sixHourInfo.target.getTime() - now.getTime();
    const sixHourCountdown = {
      ...formatCountdown(sixHourDiff),
      target: sixHourInfo.target,
      label: sixHourInfo.label,
      description: sixHourInfo.description,
    };

    // METAR countdown
    const metarTarget = getNextMetarRelease(stationId);
    const metarDiff = metarTarget ? metarTarget.getTime() - now.getTime() : 0;
    const metarCountdown = metarTarget
      ? {
          ...formatCountdown(metarDiff),
          target: metarTarget,
          minute: schedule.metarMinute,
        }
      : null;

    setCountdowns({
      cli: cliCountdown,
      sixHour: sixHourCountdown,
      metar: metarCountdown,
    });
  }, [stationId]);

  useEffect(() => {
    // Calculate immediately
    calculateCountdowns();

    // Update every second
    const interval = setInterval(calculateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [calculateCountdowns]);

  return countdowns;
}

/**
 * Hook to get just the CLI countdown (lighter version)
 * @param {string} stationId - Station ID
 * @returns {Object|null} CLI countdown data
 */
export function useCliCountdown(stationId) {
  const [countdown, setCountdown] = useState(null);

  const calculate = useCallback(() => {
    const schedule = DATA_SCHEDULE[stationId];
    if (!schedule?.cliTime) {
      setCountdown(null);
      return;
    }

    const now = new Date();
    const target = getNextCliRelease(stationId);

    if (!target) {
      setCountdown(null);
      return;
    }

    const diff = target.getTime() - now.getTime();
    setCountdown({
      ...formatCountdown(diff),
      target,
      time: schedule.cliTime,
    });
  }, [stationId]);

  useEffect(() => {
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return countdown;
}

export default useDataReleaseCountdown;
