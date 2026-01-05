import { useState, useRef, useCallback, useEffect } from 'react';

// Physics constants - tuned for pixel art character
const PHYSICS = {
  GRAVITY: 800,           // px/s^2 - snappy fall
  JUMP_VELOCITY: -350,    // Initial upward velocity (negative = up)
  HOP_VELOCITY_X: 150,    // Horizontal hop speed
  GROUND_FRICTION: 0.92,  // Slows when grounded
  AIR_RESISTANCE: 0.995,  // Minimal air drag
  BOUNCE_FACTOR: 0.2,     // Small bounce on land
  BOUNCE_THRESHOLD: 50,   // Stop bouncing below this velocity
};

// Frog dimensions
const FROG_WIDTH = 36;
const FROG_HEIGHT = 29;

/**
 * Calculate dynamic boundaries based on viewport and layout
 * @param {HTMLElement|null} heroElement - Reference to hero section for floor calculation
 * @returns {Object} Boundary coordinates
 */
function calculateBoundaries(heroElement) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 768;
  const hasNotesSidebar = viewportWidth >= 1024;

  // Left boundary: left sidebar edge (or screen edge on mobile)
  const leftBound = isMobile ? 16 : 12;

  // Right boundary: before notes sidebar or screen edge
  const rightBound = hasNotesSidebar
    ? viewportWidth - 332 - FROG_WIDTH // Notes sidebar (320px + 12px margin) + frog width
    : viewportWidth - 50;

  // Floor: bottom of hero section (tracks with scroll)
  let floor = viewportHeight - 100;
  let ceiling = 60;

  if (heroElement) {
    const rect = heroElement.getBoundingClientRect();
    floor = rect.bottom - FROG_HEIGHT;
    ceiling = rect.top + 20; // Stay within hero area

    // If hero is scrolled off screen, clamp to reasonable bounds
    if (floor < 0) {
      floor = -FROG_HEIGHT; // Allow frog to go just off top of screen
    }
    if (floor > viewportHeight) {
      floor = viewportHeight - FROG_HEIGHT;
    }
  }

  return { leftBound, rightBound, floor, ceiling };
}

/**
 * Custom hook for physics-based frog movement
 * @param {Object} options - Configuration options
 * @param {Function} options.onHopStart - Callback when hop begins
 * @param {Function} options.onLand - Callback when frog lands
 * @param {boolean} options.isSleeping - Whether frog is sleeping (disables hopping)
 * @param {React.RefObject} options.heroRef - Reference to hero element for floor calculation
 */
export function useFrogPhysics(options = {}) {
  const {
    onHopStart,
    onLand,
    isSleeping = false,
    heroRef,
  } = options;

  // React state for rendering
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for physics state (avoid re-renders during simulation)
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const groundedRef = useRef(true);
  const frameIdRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Initialize position - place frog at hero bottom right
  useEffect(() => {
    if (isInitialized) return;

    const initPosition = () => {
      const heroElement = heroRef?.current;
      const bounds = calculateBoundaries(heroElement);

      // Start at right side of main content area, on the floor
      // Position near the hero section
      const startX = Math.min(bounds.rightBound - 100, window.innerWidth - 200);
      const startY = Math.min(bounds.floor, window.innerHeight - 100);

      positionRef.current = { x: startX, y: startY };
      setPosition({ x: startX, y: startY });
      setIsInitialized(true);
    };

    // Try to initialize, retry if hero not available yet
    const tryInit = () => {
      const heroElement = heroRef?.current;
      if (heroElement) {
        initPosition();
      } else {
        // Retry after a short delay
        setTimeout(tryInit, 100);
      }
    };

    // Start trying after initial render
    const timeout = setTimeout(tryInit, 50);
    return () => clearTimeout(timeout);
  }, [heroRef, isInitialized]);

  // Hop function - applies impulse
  const hop = useCallback((direction = 'random') => {
    if (!groundedRef.current || isSleeping) return;

    const heroElement = heroRef?.current;
    const bounds = calculateBoundaries(heroElement);
    let hopDirectionX = 0;

    if (direction === 'random') {
      // Bias toward center of playable area
      const currentX = positionRef.current.x;
      const centerX = (bounds.leftBound + bounds.rightBound) / 2;
      const bias = currentX < centerX ? 0.6 : 0.4;
      hopDirectionX = Math.random() < bias ? 1 : -1;
    } else {
      hopDirectionX = direction === 'left' ? -1 : 1;
    }

    // Update facing direction
    setFacingLeft(hopDirectionX < 0);

    // Apply impulse with some randomness
    velocityRef.current = {
      vx: hopDirectionX * PHYSICS.HOP_VELOCITY_X * (0.8 + Math.random() * 0.4),
      vy: PHYSICS.JUMP_VELOCITY * (0.9 + Math.random() * 0.2),
    };

    groundedRef.current = false;
    setIsGrounded(false);
    onHopStart?.();
  }, [isSleeping, onHopStart, heroRef]);

  // Physics update loop
  const updatePhysics = useCallback((timestamp) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    // Calculate delta time, cap at 100ms to prevent large jumps
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    const heroElement = heroRef?.current;
    const bounds = calculateBoundaries(heroElement);
    const pos = positionRef.current;
    const vel = velocityRef.current;

    if (!groundedRef.current) {
      // Apply gravity
      vel.vy += PHYSICS.GRAVITY * deltaTime;

      // Apply air resistance
      vel.vx *= PHYSICS.AIR_RESISTANCE;
      vel.vy *= PHYSICS.AIR_RESISTANCE;

      // Update position
      let newX = pos.x + vel.vx * deltaTime;
      let newY = pos.y + vel.vy * deltaTime;

      // Horizontal boundaries (bounce off walls)
      if (newX < bounds.leftBound) {
        newX = bounds.leftBound;
        vel.vx = -vel.vx * 0.5;
        setFacingLeft(false);
      } else if (newX > bounds.rightBound) {
        newX = bounds.rightBound;
        vel.vx = -vel.vx * 0.5;
        setFacingLeft(true);
      }

      // Ceiling collision
      if (newY < bounds.ceiling) {
        newY = bounds.ceiling;
        vel.vy = Math.abs(vel.vy) * 0.3;
      }

      // Floor collision
      if (newY >= bounds.floor) {
        newY = bounds.floor;

        if (Math.abs(vel.vy) > PHYSICS.BOUNCE_THRESHOLD) {
          // Bounce
          vel.vy = -vel.vy * PHYSICS.BOUNCE_FACTOR;
        } else {
          // Land
          vel.vy = 0;
          groundedRef.current = true;
          setIsGrounded(true);
          onLand?.();
        }
      }

      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });
    } else {
      // Apply ground friction when grounded
      vel.vx *= PHYSICS.GROUND_FRICTION;
      if (Math.abs(vel.vx) < 1) vel.vx = 0;

      // Small position update if still sliding
      if (Math.abs(vel.vx) > 0.1) {
        let newX = pos.x + vel.vx * deltaTime;
        newX = Math.max(bounds.leftBound, Math.min(newX, bounds.rightBound));
        positionRef.current.x = newX;
        setPosition(p => ({ ...p, x: newX }));
      }
    }

    frameIdRef.current = requestAnimationFrame(updatePhysics);
  }, [heroRef, onLand]);

  // Start physics loop
  useEffect(() => {
    if (!isInitialized) return;

    frameIdRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [updatePhysics, isInitialized]);

  // Handle window resize and scroll - keep frog on the floor
  useEffect(() => {
    const handleResizeOrScroll = () => {
      const heroElement = heroRef?.current;
      const bounds = calculateBoundaries(heroElement);
      const pos = positionRef.current;

      // Clamp to new boundaries - keep frog on floor when scrolling
      const clampedX = Math.max(bounds.leftBound, Math.min(pos.x, bounds.rightBound));
      // If grounded, stick to floor; if airborne, just clamp
      const clampedY = groundedRef.current
        ? bounds.floor
        : Math.max(bounds.ceiling, Math.min(pos.y, bounds.floor));

      if (clampedX !== pos.x || clampedY !== pos.y) {
        positionRef.current = { x: clampedX, y: clampedY };
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [heroRef]);

  return {
    position,
    isGrounded,
    facingLeft,
    hop,
    isInitialized,
  };
}
