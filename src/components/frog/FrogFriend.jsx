import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrogPhysics } from '../../hooks/useFrogPhysics';
import './frog.css';

/**
 * FrogFriend - Interactive mascot that lives in the dashboard
 * Pixel art frog with physics-based movement, weather reactions, and click interactions
 */
export default function FrogFriend({ condition, className = '', heroRef }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [emote, setEmote] = useState('idle'); // idle, happy, sad, angry, surprised, sleeping, eating, confused
  const [isSleeping, setIsSleeping] = useState(false);

  // Physics-based position and hopping
  const { position, isGrounded, facingLeft, hop, isInitialized } = useFrogPhysics({
    heroRef,
    isSleeping,
    onHopStart: () => {
      setEmote('happy');
    },
    onLand: () => {
      setEmote(getWeatherEmoteRef.current());
    },
  });

  // Determine weather-based emote
  const getWeatherEmote = useCallback(() => {
    if (!condition) return 'idle';
    const cond = condition.toLowerCase();

    if (cond.includes('thunder') || cond.includes('lightning') || cond.includes('storm')) return 'angry';
    if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) return 'sad';
    if (cond.includes('snow') || cond.includes('flurr') || cond.includes('blizzard')) return 'surprised';
    if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return 'confused';
    if (cond.includes('clear') || cond.includes('sunny') || cond.includes('fair')) return 'happy';
    return 'idle';
  }, [condition]);

  // Keep ref to getWeatherEmote for callbacks
  const getWeatherEmoteRef = useRef(getWeatherEmote);
  getWeatherEmoteRef.current = getWeatherEmote;

  // Set emote based on weather (when not overridden by interaction)
  useEffect(() => {
    if (!isSleeping && emote !== 'eating' && isGrounded) {
      setEmote(getWeatherEmote());
    }
  }, [condition, getWeatherEmote, isSleeping, emote, isGrounded]);

  // Random blink effect
  useEffect(() => {
    if (isSleeping) return;

    const blinkInterval = setInterval(() => {
      const randomDelay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }, randomDelay);
    }, 5000);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  // Track hop count for sleep cycles
  const hopCountRef = useRef(0);
  const maxHopsBeforeSleep = useRef(Math.floor(Math.random() * 4) + 2); // 2-5 hops

  // Sleep/wake cycle management
  useEffect(() => {
    if (!isInitialized) return;

    if (isSleeping) {
      // Wake up after random sleep duration (15-45 seconds)
      const sleepDuration = 15000 + Math.random() * 30000;
      const wakeTimeout = setTimeout(() => {
        setIsSleeping(false);
        setEmote('idle');
        hopCountRef.current = 0;
        maxHopsBeforeSleep.current = Math.floor(Math.random() * 4) + 2;
      }, sleepDuration);

      return () => clearTimeout(wakeTimeout);
    }
  }, [isSleeping, isInitialized]);

  // Random hopping with physics - more dormant behavior
  useEffect(() => {
    if (isSleeping || !isInitialized) return;

    const hopAround = () => {
      hopCountRef.current += 1;

      // Check if should go to sleep after this hop
      if (hopCountRef.current >= maxHopsBeforeSleep.current) {
        hop('random');
        // Go to sleep after landing
        setTimeout(() => {
          setIsSleeping(true);
          setEmote('sleeping');
        }, 1000);
      } else {
        hop('random');
      }
    };

    // Hop less frequently (8-15 seconds between hops)
    const getNextHopDelay = () => 8000 + Math.random() * 7000;

    let hopTimeout;
    const scheduleNextHop = () => {
      hopTimeout = setTimeout(() => {
        if (!isSleeping) {
          hopAround();
          scheduleNextHop();
        }
      }, getNextHopDelay());
    };

    // Initial hop after a short delay
    const initialHop = setTimeout(() => {
      hopAround();
      scheduleNextHop();
    }, 3000);

    return () => {
      clearTimeout(hopTimeout);
      clearTimeout(initialHop);
    };
  }, [isSleeping, hop, isInitialized]);

  // Click handler
  const handleClick = () => {
    // Wake up if sleeping
    if (isSleeping) {
      setIsSleeping(false);
      setEmote('surprised');
      hopCountRef.current = 0; // Reset hop count
      maxHopsBeforeSleep.current = Math.floor(Math.random() * 4) + 2;
      setTimeout(() => setEmote(getWeatherEmote()), 1000);
      return;
    }

    // Random action on click
    const actions = ['happy', 'eating', 'hop'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'hop' && isGrounded) {
      hop('random');
      hopCountRef.current += 1; // Count this hop
    } else if (action === 'eating') {
      setEmote('eating');
      setTimeout(() => setEmote(getWeatherEmote()), 1500);
    } else {
      setEmote('happy');
      setTimeout(() => setEmote(getWeatherEmote()), 1000);
    }
  };

  // Render eyes based on emote - positioned ON the eye bumps
  const renderEyes = () => {
    if (isBlinking || emote === 'sleeping') {
      // Closed eyes (sleeping or blinking) - horizontal lines
      return (
        <>
          <rect x="2" y="3" width="4" height="1" fill="#1a1a1a" />
          <rect x="14" y="3" width="4" height="1" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'angry') {
      // Angry red eyes with angry brows
      return (
        <>
          {/* Left eye - angry */}
          <rect x="2" y="2" width="4" height="3" fill="#ff6b6b" />
          <rect x="2" y="2" width="3" height="2" fill="#ffffff" />
          <rect x="3" y="2" width="2" height="2" fill="#1a1a1a" />
          {/* Angry brow - slanted */}
          <rect x="1" y="1" width="2" height="1" fill="#1a1a1a" />
          <rect x="3" y="0" width="2" height="1" fill="#1a1a1a" />
          {/* Right eye - angry */}
          <rect x="14" y="2" width="4" height="3" fill="#ff6b6b" />
          <rect x="15" y="2" width="3" height="2" fill="#ffffff" />
          <rect x="15" y="2" width="2" height="2" fill="#1a1a1a" />
          {/* Angry brow - slanted */}
          <rect x="17" y="1" width="2" height="1" fill="#1a1a1a" />
          <rect x="15" y="0" width="2" height="1" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'surprised') {
      // Wide surprised eyes - bigger circles
      return (
        <>
          {/* Left eye - wide */}
          <rect x="2" y="1" width="4" height="4" fill="#ffffff" />
          <rect x="3" y="2" width="2" height="2" fill="#1a1a1a" />
          {/* Right eye - wide */}
          <rect x="14" y="1" width="4" height="4" fill="#ffffff" />
          <rect x="15" y="2" width="2" height="2" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'sad') {
      // Sad droopy eyes with tear
      return (
        <>
          {/* Left eye - sad, droopy */}
          <rect x="2" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="3" y="3" width="2" height="2" fill="#1a1a1a" />
          {/* Sad eyelid */}
          <rect x="2" y="2" width="3" height="1" fill="#7aba7a" />
          {/* Right eye - sad */}
          <rect x="14" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="15" y="3" width="2" height="2" fill="#1a1a1a" />
          {/* Sad eyelid */}
          <rect x="15" y="2" width="3" height="1" fill="#7aba7a" />
          {/* Tear drop */}
          <rect x="1" y="5" width="1" height="2" fill="#7ac8f8" />
        </>
      );
    }

    if (emote === 'eating') {
      // Eating - normal eyes
      return (
        <>
          <rect x="2" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="3" y="3" width="2" height="2" fill="#1a1a1a" />
          <rect x="14" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="15" y="3" width="2" height="2" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'happy') {
      // Happy - normal eyes (same as idle)
      return (
        <>
          <rect x="2" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="3" y="3" width="2" height="2" fill="#1a1a1a" />
          <rect x="14" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="15" y="3" width="2" height="2" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'confused') {
      // Confused eyes - one higher than other
      return (
        <>
          {/* Left eye - normal position */}
          <rect x="2" y="2" width="4" height="3" fill="#ffffff" />
          <rect x="3" y="3" width="2" height="2" fill="#1a1a1a" />
          {/* Right eye - raised/confused */}
          <rect x="14" y="1" width="4" height="3" fill="#ffffff" />
          <rect x="15" y="2" width="2" height="2" fill="#1a1a1a" />
        </>
      );
    }

    // Default idle eyes - on the eye bumps
    return (
      <>
        {/* Left eye - white with pupil */}
        <rect x="2" y="2" width="4" height="3" fill="#ffffff" />
        <rect x="3" y="3" width="2" height="2" fill="#1a1a1a" />
        {/* Right eye - white with pupil */}
        <rect x="14" y="2" width="4" height="3" fill="#ffffff" />
        <rect x="15" y="3" width="2" height="2" fill="#1a1a1a" />
      </>
    );
  };

  // Render mouth based on emote - positioned in lower body area
  const renderMouth = () => {
    if (emote === 'eating') {
      // Tongue out catching fly
      return (
        <>
          <rect x="8" y="11" width="4" height="1" fill="#1a1a1a" />
          {/* Tongue extending left */}
          <rect x="7" y="11" width="1" height="1" fill="#e85a7a" />
          <rect x="5" y="10" width="2" height="1" fill="#e85a7a" />
          <rect x="3" y="9" width="2" height="1" fill="#e85a7a" />
          <rect x="1" y="8" width="2" height="1" fill="#e85a7a" />
          {/* Fly */}
          <rect x="-1" y="7" width="2" height="2" fill="#3a3a3a" />
          <rect x="-2" y="6" width="1" height="1" fill="#8a8a8a" />
          <rect x="1" y="6" width="1" height="1" fill="#8a8a8a" />
        </>
      );
    }

    if (emote === 'happy') {
      // Simple smile - no tongue
      return (
        <rect x="7" y="10" width="6" height="1" fill="#1a1a1a" />
      );
    }

    if (emote === 'angry') {
      // Frown
      return (
        <>
          <rect x="8" y="11" width="4" height="1" fill="#1a1a1a" />
          <rect x="7" y="10" width="1" height="1" fill="#1a1a1a" />
          <rect x="12" y="10" width="1" height="1" fill="#1a1a1a" />
        </>
      );
    }

    if (emote === 'surprised') {
      // Open mouth O
      return (
        <>
          <rect x="8" y="9" width="4" height="3" fill="#1a1a1a" />
          <rect x="9" y="10" width="2" height="1" fill="#e85a7a" />
        </>
      );
    }

    if (emote === 'sad') {
      // Wavy sad frown
      return (
        <>
          <rect x="8" y="11" width="4" height="1" fill="#1a1a1a" />
          <rect x="7" y="10" width="1" height="1" fill="#1a1a1a" />
          <rect x="12" y="10" width="1" height="1" fill="#1a1a1a" />
        </>
      );
    }

    // Default mouth - straight line
    return (
      <rect x="7" y="10" width="6" height="1" fill="#1a1a1a" />
    );
  };

  // Render extras (zzz, confusion marks, etc)
  const renderExtras = () => {
    if (emote === 'sleeping') {
      return (
        <g className="frog-zzz">
          <text x="17" y="2" fontSize="3" fill="#3a6a3a" fontFamily="monospace">z</text>
          <text x="19" y="0" fontSize="4" fill="#3a6a3a" fontFamily="monospace">z</text>
          <text x="21" y="-2" fontSize="5" fill="#3a6a3a" fontFamily="monospace">z</text>
        </g>
      );
    }

    if (emote === 'confused') {
      return (
        <g className="frog-confused">
          <rect x="8" y="-1" width="1" height="1" fill="#3a6a3a" />
          <rect x="10" y="-2" width="1" height="1" fill="#3a6a3a" />
          <rect x="12" y="-1" width="1" height="1" fill="#3a6a3a" />
        </g>
      );
    }

    return null;
  };

  // Don't render until physics is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <div
      className={`frog-container-physics ${className} ${!isGrounded ? 'frog-airborne' : ''} ${isSleeping ? 'frog-sleeping' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label="Frog friend - click to interact"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scaleX(${facingLeft ? -1 : 1})`,
      }}
    >
      <svg
        viewBox="0 0 20 16"
        className="frog-svg"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* Frog with raised eye bumps - matching sprite sheet */}

        {/* === EYE BUMPS (the key feature!) === */}
        {/* Left eye bump - outline */}
        <rect x="1" y="1" width="6" height="5" fill="#3a6a3a" />
        {/* Left eye bump - fill */}
        <rect x="2" y="2" width="4" height="3" fill="#5a9a5a" />

        {/* Right eye bump - outline */}
        <rect x="13" y="1" width="6" height="5" fill="#3a6a3a" />
        {/* Right eye bump - fill */}
        <rect x="14" y="2" width="4" height="3" fill="#5a9a5a" />

        {/* === HEAD CONNECTION (between bumps) === */}
        <rect x="5" y="4" width="10" height="3" fill="#3a6a3a" />
        <rect x="6" y="5" width="8" height="2" fill="#5a9a5a" />

        {/* === MAIN BODY === */}
        {/* Body outline - dark green */}
        <rect x="1" y="6" width="18" height="8" fill="#3a6a3a" />
        {/* Body fill - medium green */}
        <rect x="2" y="7" width="16" height="6" fill="#5a9a5a" />
        {/* Lighter body highlight */}
        <rect x="3" y="8" width="14" height="4" fill="#7aba7a" />

        {/* === BELLY === */}
        <rect x="5" y="9" width="10" height="3" fill="#aaea8a" />
        <rect x="6" y="8" width="8" height="1" fill="#c8f8a8" />

        {/* === FEET === */}
        <rect x="1" y="13" width="4" height="2" fill="#2a5a2a" />
        <rect x="15" y="13" width="4" height="2" fill="#2a5a2a" />
        {/* Toe details */}
        <rect x="0" y="14" width="2" height="1" fill="#2a5a2a" />
        <rect x="18" y="14" width="2" height="1" fill="#2a5a2a" />

        {/* Eyes */}
        {renderEyes()}

        {/* Mouth */}
        {renderMouth()}

        {/* Extras (zzz, confusion, etc) */}
        {renderExtras()}
      </svg>
    </div>
  );
}

FrogFriend.propTypes = {
  condition: PropTypes.string,
  className: PropTypes.string,
  heroRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
