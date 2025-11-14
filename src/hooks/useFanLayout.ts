/**
 * useFanLayout Hook
 *
 * Provides polar coordinate calculations for 78-card tarot fan layout:
 * - Desktop: 180° horizontal semi-circle at bottom
 * - Mobile: 90° vertical quarter-circle on right side
 * - Dynamic z-index sorting (center cards on top)
 * - Responsive radius and positioning
 *
 * Mathematical Foundation: Polar to Cartesian conversion
 * x = cos(θ) * r
 * y = sin(θ) * r
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Fan layout configuration
 */
export interface FanConfig {
  /** Fan position on screen */
  position: 'bottom-center' | 'right-side';

  /** Total fan angle in degrees (180 for desktop, 90 for mobile) */
  fanAngle: number;

  /** Radius of the fan in pixels */
  radius: number;

  /** Number of cards visible in viewport */
  visibleCards: number;

  /** Card dimensions */
  cardWidth: number;
  cardHeight: number;

  /** Overlap percentage (0-1, e.g., 0.85 = 85% overlap) */
  overlap: number;

  /** Starting angle offset (degrees) */
  startAngle: number;
}

/**
 * Calculated card position in 2D space
 */
export interface CardPosition {
  /** X coordinate relative to fan center */
  x: number;

  /** Y coordinate relative to fan center */
  y: number;

  /** Card rotation angle in degrees */
  rotation: number;

  /** Z-index for depth sorting */
  zIndex: number;

  /** Original card index in deck */
  index: number;
}

/**
 * Breakpoints for responsive design
 */
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

/**
 * Predefined fan configurations
 *
 * KEY CHANGE: All 78 cards are arranged in a complete 360° circle (donut shape)
 * Only the visible portion is rendered based on viewport position
 */
const FAN_CONFIGS: Record<'desktop' | 'mobile', FanConfig> = {
  desktop: {
    position: 'bottom-center',
    fanAngle: 360, // FULL CIRCLE: All 78 cards arranged in 360°
    radius: 380, // Adjusted radius for 62vh container
    visibleCards: 25, // Number of cards visible in bottom viewport at once
    cardWidth: 120, // Much larger cards (was 100)
    cardHeight: 180, // Much larger cards (was 150)
    overlap: 0.45, // Show more than half of each card
    startAngle: 0, // Start from 0° (rightmost), full 360° rotation
  },
  mobile: {
    position: 'bottom-center',
    fanAngle: 360, // FULL CIRCLE: All 78 cards arranged in 360°
    radius: 320, // Adjusted radius for 56vh container
    visibleCards: 12, // Fewer cards for easier interaction
    cardWidth: 110, // Much larger cards (was 90)
    cardHeight: 165, // Much larger cards (was 135)
    overlap: 0.3, // Show more than half of each card (0.5 = exactly half)
    startAngle: 0, // Start from 0° (rightmost), full 360° rotation
  },
};

/**
 * Calculate polar coordinates for a single card
 *
 * @param index - Card index in deck (0-77)
 * @param totalCards - Total number of cards (78)
 * @param config - Fan configuration
 * @param containerSize - Container dimensions for coordinate offset
 * @returns Card position with x, y coordinates relative to container top-left
 */
function calculateCardPosition(
  index: number,
  totalCards: number,
  config: FanConfig,
  containerSize: { width: number; height: number }
): CardPosition {
  // Calculate angle for this card
  const angleStep = config.fanAngle / (totalCards - 1);
  const currentAngle = config.startAngle + index * angleStep;

  // Convert to radians
  const radians = (currentAngle * Math.PI) / 180;

  // Polar to Cartesian conversion (relative to circle center)
  const xFromCenter = Math.cos(radians) * config.radius;
  const yFromCenter = Math.sin(radians) * config.radius;

  // Convert to container coordinates (top-left origin)
  // Add container center offset to make coordinates relative to top-left corner
  const x = xFromCenter + containerSize.width / 2;
  const y = yFromCenter + containerSize.height / 2;

  // Card rotation (perpendicular to radius line)
  // For bottom fan: cards point inward toward center
  // For side fan: cards point toward center
  const rotation = currentAngle - 90;

  // Z-index calculation: center cards appear on top
  const centerIndex = totalCards / 2;
  const distanceFromCenter = Math.abs(index - centerIndex);
  const zIndex = totalCards - Math.floor(distanceFromCenter);

  return {
    x,
    y,
    rotation,
    zIndex,
    index,
  };
}

/**
 * Detect current device type based on viewport width
 */
function useDeviceType(): 'desktop' | 'mobile' {
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      setDeviceType(width >= BREAKPOINTS.tablet ? 'desktop' : 'mobile');
    };

    // Initial detection
    updateDeviceType();

    // Listen for resize
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
}

/**
 * Calculate responsive radius based on viewport size
 */
function useResponsiveRadius(baseRadius: number, deviceType: 'desktop' | 'mobile'): number {
  const [radius, setRadius] = useState(baseRadius);

  useEffect(() => {
    const updateRadius = () => {
      if (deviceType === 'desktop') {
        // Desktop: scale based on viewport width for 62vh container
        const vw = window.innerWidth;
        const scaledRadius = Math.min(480, Math.max(320, vw * 0.32));
        setRadius(scaledRadius);
      } else {
        // Mobile: scale based on viewport width for 56vh container
        const vw = window.innerWidth;
        const scaledRadius = Math.min(380, Math.max(280, vw * 0.45));
        setRadius(scaledRadius);
      }
    };

    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, [deviceType]);

  return radius;
}

/**
 * Main hook: Provides fan layout configuration and card positions
 */
export function useFanLayout(totalCards: number = 78) {
  // Detect device type
  const deviceType = useDeviceType();

  // Get base configuration
  const baseConfig = FAN_CONFIGS[deviceType];

  // Calculate responsive radius
  const radius = useResponsiveRadius(baseConfig.radius, deviceType);

  // Final configuration with responsive radius
  const config: FanConfig = useMemo(
    () => ({
      ...baseConfig,
      radius,
    }),
    [baseConfig, radius]
  );

  // Calculate container size (diameter of circle)
  const containerSize = useMemo(
    () => ({
      width: radius * 2,
      height: radius * 2,
    }),
    [radius]
  );

  // Calculate all card positions (memoized)
  const cardPositions = useMemo(() => {
    return Array.from({ length: totalCards }, (_, index) =>
      calculateCardPosition(index, totalCards, config, containerSize)
    );
  }, [totalCards, config, containerSize]);

  // Calculate visible range based on rotation angle
  const calculateVisibleIndices = useCallback((rotationAngle: number = 0): number[] => {
    // All 78 cards are arranged in a full 360° circle
    // We need to determine which cards are visible in the viewport based on:
    // 1. Container rotation angle
    // 2. Device-specific viewport visible range

    const anglePerCard = config.fanAngle / totalCards; // ~4.6° per card (360° / 78)

    // Define viewport visible range (in degrees) based on device type
    let viewportStartAngle: number;
    let viewportEndAngle: number;

    // Both desktop and mobile: bottom semi-circle visible (180° - 360° range)
    // When rotated, this range shifts
    viewportStartAngle = 180 - rotationAngle;
    viewportEndAngle = 360 - rotationAngle;

    // Normalize angles to 0-360 range
    const normalizeAngle = (angle: number): number => {
      const normalized = angle % 360;
      return normalized < 0 ? normalized + 360 : normalized;
    };

    viewportStartAngle = normalizeAngle(viewportStartAngle);
    viewportEndAngle = normalizeAngle(viewportEndAngle);

    // Check if an angle is within viewport range (handling wraparound at 0°/360°)
    const isInViewport = (cardAngle: number): boolean => {
      const normalized = normalizeAngle(cardAngle);

      if (viewportEndAngle > viewportStartAngle) {
        // Normal case: start < end (e.g., 180° - 360°)
        return normalized >= viewportStartAngle && normalized <= viewportEndAngle;
      } else {
        // Wraparound case: end < start (e.g., 315° - 45°, crossing 0°)
        return normalized >= viewportStartAngle || normalized <= viewportEndAngle;
      }
    };

    // Find all cards within viewport
    const visibleIndices: number[] = [];
    for (let i = 0; i < totalCards; i++) {
      const cardAngle = config.startAngle + i * anglePerCard;
      if (isInViewport(cardAngle)) {
        visibleIndices.push(i);
      }
    }

    console.log(
      `[useFanLayout] Rotation: ${rotationAngle.toFixed(1)}°, ` +
      `Viewport: ${viewportStartAngle.toFixed(1)}° - ${viewportEndAngle.toFixed(1)}°, ` +
      `Visible: ${visibleIndices.length} cards (indices ${visibleIndices[0]}-${visibleIndices[visibleIndices.length - 1]})`
    );

    return visibleIndices;
  }, [config, totalCards, deviceType]);

  return {
    /** Current fan configuration */
    config,

    /** Container dimensions (width and height) */
    containerSize,

    /** All card positions (78 items) */
    cardPositions,

    /** Calculate which cards should be rendered based on rotation */
    calculateVisibleIndices,

    /** Current device type */
    deviceType,

    /** Total number of cards */
    totalCards,
  };
}

/**
 * Utility: Get card position by index
 */
export function getCardPositionByIndex(
  index: number,
  positions: CardPosition[]
): CardPosition | undefined {
  return positions.find((pos) => pos.index === index);
}

/**
 * Utility: Calculate rotation bounds for drag gestures
 *
 * With full 360° circle, we can rotate infinitely or limit to 360°
 */
export function calculateRotationBounds(
  totalCards: number,
  visibleCards: number
): { min: number; max: number } {
  // Since all 78 cards are arranged in a full 360° circle,
  // we can allow rotation through the entire circle
  // Allow slight negative buffer and full 360° rotation
  return {
    min: -10, // Small negative buffer
    max: 360, // Full circle rotation
  };
}
