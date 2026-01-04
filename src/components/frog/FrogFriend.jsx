import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './frog.css';

/**
 * FrogFriend - Interactive mascot that lives in the dashboard
 * Blue-themed frog with idle animations, weather reactions, and click interactions
 */
export default function FrogFriend({ condition, className = '' }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [eyeDirection, setEyeDirection] = useState({ x: 0, y: 0 });
  const [showRibbit, setShowRibbit] = useState(false);

  // Determine weather state
  const getWeatherState = useCallback(() => {
    if (!condition) return 'normal';
    const cond = condition.toLowerCase();

    if (cond.includes('thunder') || cond.includes('lightning') || cond.includes('storm')) return 'scared';
    if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) return 'rain';
    if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) return 'snow';
    if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return 'fog';
    if (cond.includes('clear') || cond.includes('sunny') || cond.includes('fair')) return 'sunny';
    return 'normal';
  }, [condition]);

  const weatherState = getWeatherState();

  // Random blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      const randomDelay = 4000 + Math.random() * 3000; // 4-7 seconds
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }, randomDelay);
    }, 5000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Random eye movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      const shouldMove = Math.random() > 0.6;
      if (shouldMove) {
        setEyeDirection({
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2,
        });
        // Return to center after a bit
        setTimeout(() => setEyeDirection({ x: 0, y: 0 }), 1500);
      }
    }, 3000);

    return () => clearInterval(moveInterval);
  }, []);

  // Click handler
  const handleClick = () => {
    // Hop animation
    setIsHopping(true);
    setTimeout(() => setIsHopping(false), 400);

    // Show ribbit
    setShowRibbit(true);
    setTimeout(() => setShowRibbit(false), 800);
  };

  return (
    <div
      className={`frog-container ${className} ${isHopping ? 'frog-hopping' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label="Frog friend - click to interact"
    >
      {/* Ribbit text */}
      {showRibbit && (
        <div className="frog-ribbit">ribbit!</div>
      )}

      <svg
        viewBox="0 0 24 28"
        className="frog-svg"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* Standing frog - 24x28 grid, vertical pose */}

        {/* Back feet */}
        <rect x="2" y="26" width="4" height="2" fill="#5a9a3a" />
        <rect x="18" y="26" width="4" height="2" fill="#5a9a3a" />

        {/* Back legs */}
        <rect x="3" y="24" width="3" height="2" fill="#6aaa4a" />
        <rect x="18" y="24" width="3" height="2" fill="#6aaa4a" />

        {/* Body - pear/triangular shape, wide at bottom */}
        <rect x="4" y="22" width="16" height="2" fill="#6aaa4a" />
        <rect x="3" y="20" width="18" height="2" fill="#7aba5a" />
        <rect x="4" y="18" width="16" height="2" fill="#7aba5a" />
        <rect x="5" y="16" width="14" height="2" fill="#8aca6a" />
        <rect x="6" y="14" width="12" height="2" fill="#8aca6a" />
        <rect x="7" y="12" width="10" height="2" fill="#7aba5a" />

        {/* Front legs hanging down */}
        <rect x="4" y="20" width="2" height="6" fill="#6aaa4a" />
        <rect x="18" y="20" width="2" height="6" fill="#6aaa4a" />
        <rect x="3" y="25" width="3" height="2" fill="#5a9a3a" />
        <rect x="18" y="25" width="3" height="2" fill="#5a9a3a" />

        {/* Belly - lighter center */}
        <rect x="8" y="16" width="8" height="6" fill="#a8da7a" />
        <rect x="9" y="22" width="6" height="2" fill="#b8ea8a" />

        {/* Head area */}
        <rect x="8" y="10" width="8" height="2" fill="#7aba5a" />

        {/* Left eye - golden, bulging on top */}
        {!isBlinking ? (
          <>
            {/* Eye outer - golden */}
            <rect x="4" y="6" width="6" height="5" fill="#d4a020" />
            <rect x="5" y="5" width="4" height="1" fill="#d4a020" />
            {/* Eye inner - lighter gold */}
            <rect x="5" y="7" width="4" height="3" fill="#e8c040" />
            {/* Pupil */}
            <rect x={6 + Math.round(eyeDirection.x * 0.5)} y="8" width="2" height="2" fill="#1a1a1a" />
          </>
        ) : (
          <rect x="5" y="8" width="4" height="1" fill="#d4a020" />
        )}

        {/* Right eye - golden, bulging on top */}
        {!isBlinking ? (
          <>
            {/* Eye outer - golden */}
            <rect x="14" y="6" width="6" height="5" fill="#d4a020" />
            <rect x="15" y="5" width="4" height="1" fill="#d4a020" />
            {/* Eye inner - lighter gold */}
            <rect x="15" y="7" width="4" height="3" fill="#e8c040" />
            {/* Pupil */}
            <rect x={16 + Math.round(eyeDirection.x * 0.5)} y="8" width="2" height="2" fill="#1a1a1a" />
          </>
        ) : (
          <rect x="15" y="8" width="4" height="1" fill="#d4a020" />
        )}

        {/* Nose/face details */}
        <rect x="10" y="10" width="4" height="1" fill="#6aaa4a" />

        {/* Mouth */}
        {weatherState === 'scared' ? (
          <rect x="10" y="12" width="4" height="2" fill="#4a8a3a" />
        ) : (
          <>
            <rect x="9" y="13" width="2" height="1" fill="#4a8a3a" />
            <rect x="13" y="13" width="2" height="1" fill="#4a8a3a" />
          </>
        )}

        {/* Dark outline accents */}
        <rect x="3" y="20" width="1" height="4" fill="#4a8a3a" />
        <rect x="20" y="20" width="1" height="4" fill="#4a8a3a" />

        {/* Weather accessories */}
        {weatherState === 'sunny' && (
          <g className="frog-accessory">
            <rect x="3" y="6" width="8" height="5" fill="#1a1a2e" />
            <rect x="13" y="6" width="8" height="5" fill="#1a1a2e" />
            <rect x="11" y="8" width="2" height="2" fill="#1a1a2e" />
            <rect x="5" y="7" width="2" height="1" fill="#3a3a5e" />
            <rect x="15" y="7" width="2" height="1" fill="#3a3a5e" />
          </g>
        )}

        {weatherState === 'rain' && (
          <g className="frog-accessory frog-umbrella">
            <rect x="6" y="0" width="12" height="2" fill="#6a9eca" />
            <rect x="4" y="2" width="16" height="2" fill="#5a8eba" />
            <rect x="11" y="4" width="2" height="4" fill="#8b5a2b" />
          </g>
        )}

        {weatherState === 'snow' && (
          <g className="frog-accessory">
            <rect x="5" y="11" width="14" height="2" fill="#e74c3c" />
            <rect x="17" y="13" width="3" height="4" fill="#e74c3c" />
            <rect x="7" y="11" width="2" height="2" fill="#c0392b" />
            <rect x="11" y="11" width="2" height="2" fill="#c0392b" />
            <rect x="15" y="11" width="2" height="2" fill="#c0392b" />
          </g>
        )}

        {weatherState === 'fog' && (
          <>
            <rect x="5" y="7" width="4" height="2" fill="#e8c040" />
            <rect x="15" y="7" width="4" height="2" fill="#e8c040" />
            <rect x="5" y="6" width="4" height="1" fill="#d4a020" />
            <rect x="15" y="6" width="4" height="1" fill="#d4a020" />
            <rect x="5" y="9" width="4" height="1" fill="#d4a020" />
            <rect x="15" y="9" width="4" height="1" fill="#d4a020" />
            <rect x={6 + Math.round(eyeDirection.x * 0.5)} y="7" width="2" height="1" fill="#1a1a1a" />
            <rect x={16 + Math.round(eyeDirection.x * 0.5)} y="7" width="2" height="1" fill="#1a1a1a" />
          </>
        )}

        {weatherState === 'scared' && (
          <>
            <rect x="21" y="6" width="2" height="1" fill="#7ac8f8" />
            <rect x="21" y="7" width="2" height="3" fill="#5ab8f0" />
          </>
        )}
      </svg>
    </div>
  );
}

FrogFriend.propTypes = {
  condition: PropTypes.string,
  className: PropTypes.string,
};
