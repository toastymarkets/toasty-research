import { useState, useEffect, useMemo } from 'react';
import { useMultiModelForecast, CITY_COORDS } from './useMultiModelForecast';

/**
 * Generate market bracket data based on forecast model consensus
 * Simulates Kalshi-style temperature brackets with implied probabilities
 */
export function useMarketBrackets(citySlug) {
  const { forecasts, loading, error } = useMultiModelForecast(citySlug);
  const [volume, setVolume] = useState(null);

  // Generate random but consistent volume for this city
  useEffect(() => {
    if (citySlug) {
      // Use city name as seed for consistent "random" volume
      const seed = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const baseVolume = 20000 + (seed * 1337) % 150000;
      setVolume(baseVolume);
    }
  }, [citySlug]);

  // Calculate brackets based on model consensus
  const brackets = useMemo(() => {
    if (!forecasts || forecasts.models.length === 0) return null;

    // Get today's high forecasts from all models
    const todayHighs = forecasts.models
      .map(m => m.daily[0]?.high)
      .filter(h => h != null);

    if (todayHighs.length === 0) return null;

    // Calculate mean and standard deviation
    const mean = todayHighs.reduce((a, b) => a + b, 0) / todayHighs.length;
    const variance = todayHighs.reduce((a, h) => a + Math.pow(h - mean, 2), 0) / todayHighs.length;
    const stdDev = Math.sqrt(variance) || 1;

    // Generate bracket probabilities using normal distribution approximation
    const generateBrackets = () => {
      const brackets = [];
      const roundedMean = Math.round(mean);

      // Create brackets around the mean (-4 to +4 degrees)
      for (let offset = -4; offset <= 4; offset++) {
        const low = roundedMean + offset;
        const high = low + 1;

        // Calculate probability using distance from mean
        const distFromMean = Math.abs(offset + 0.5);
        const probability = Math.exp(-0.5 * Math.pow(distFromMean / (stdDev || 1), 2));

        brackets.push({
          low,
          high,
          label: `${low}° to ${high}°`,
          probability: probability,
        });
      }

      // Add "or above" bracket
      const aboveTemp = roundedMean + 5;
      brackets.push({
        low: aboveTemp,
        high: null,
        label: `${aboveTemp}° or above`,
        probability: 0.05,
      });

      // Add "or below" bracket
      const belowTemp = roundedMean - 5;
      brackets.unshift({
        low: null,
        high: belowTemp,
        label: `${belowTemp}° or below`,
        probability: 0.05,
      });

      // Normalize probabilities to sum to 1
      const totalProb = brackets.reduce((a, b) => a + b.probability, 0);
      brackets.forEach(b => {
        b.probability = b.probability / totalProb;
        b.yesPrice = Math.round(b.probability * 100);
        b.noPrice = 100 - b.yesPrice;
      });

      // Sort by probability (highest first)
      brackets.sort((a, b) => b.probability - a.probability);

      return brackets;
    };

    return generateBrackets();
  }, [forecasts]);

  // Get top 2 brackets for display
  const topBrackets = useMemo(() => {
    if (!brackets) return [];
    return brackets.slice(0, 2);
  }, [brackets]);

  // Calculate time until market closes (end of day in city timezone)
  const timeRemaining = useMemo(() => {
    const now = new Date();
    // Market closes at end of day - simplified to 11:59 PM local
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const diff = endOfDay.getTime() - now.getTime();
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, formatted: `${hours}h ${minutes}m ${seconds}s` };
  }, []);

  return {
    brackets,
    topBrackets,
    volume,
    timeRemaining,
    loading,
    error,
    consensusHigh: forecasts?.models?.length > 0
      ? Math.round(forecasts.models.map(m => m.daily[0]?.high).filter(h => h != null).reduce((a, b) => a + b, 0) / forecasts.models.length)
      : null,
  };
}

export default useMarketBrackets;
