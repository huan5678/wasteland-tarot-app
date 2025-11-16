'use client';

/**
 * StatCounter Component
 *
 * Animated number counter component that animates from 0 to target value
 * over 2 seconds using requestAnimationFrame for smooth 60fps animation.
 *
 * Features:
 * - EaseOutQuad easing function for natural deceleration
 * - PixelIcon integration for decorative icons
 * - Suffix support for units (e.g., "+", "張", "家")
 * - React.memo optimization to prevent unnecessary re-renders
 * - Pip-Boy themed styling
 *
 * Requirements Coverage: 5.3, 5.4, 5.6, 5.9, 5.10, 12.6, 12.10
 *
 * @module StatCounter
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PixelIcon } from '@/components/ui/icons';

/**
 * StatCounter Component Props
 */
export interface StatCounterProps {
  /**
   * RemixIcon icon name
   * @example "user", "file-list-2", "grid", "cpu"
   */
  icon: string;

  /**
   * Target numeric value to animate to
   * @example 1234
   */
  value: number;

  /**
   * Label text (Traditional Chinese)
   * @example "總用戶數"
   */
  label: string;

  /**
   * Optional suffix to append to the number
   * @example "+", "張", "家"
   */
  suffix?: string;
}

/**
 * EaseOutQuad easing function
 *
 * Provides smooth deceleration for counter animation.
 * Formula: t * (2 - t)
 *
 * @param t - Progress from 0 to 1
 * @returns Eased progress value
 */
const easeOutQuad = (t: number): number => t * (2 - t);

/**
 * StatCounter Component
 *
 * Displays an animated statistic counter with icon and label.
 * Animates from 0 to target value over 2 seconds using requestAnimationFrame.
 *
 * @component
 * @example
 * ```tsx
 * <StatCounter
 *   icon="user"
 *   value={1234}
 *   label="總用戶數"
 *   suffix="+"
 * />
 * ```
 */
const StatCounterComponent: React.FC<StatCounterProps> = ({
  icon,
  value,
  label,
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset to 0 when value changes
    setDisplayValue(0);
    startTimeRef.current = null;

    const duration = 2000; // 2 seconds animation duration

    const animate = (currentTime: number) => {
      // Initialize start time on first frame
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easeOutQuad easing
      const easedProgress = easeOutQuad(progress);

      // Calculate current value
      const currentValue = Math.floor(easedProgress * value);
      setDisplayValue(currentValue);

      // Continue animation if not complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or value change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2">
      {/* Icon */}
      <PixelIcon
        name={icon}
        sizePreset="md"
        variant="primary"
        decorative
      />

      {/* Number with suffix */}
      <div className="text-4xl font-bold text-pip-boy-green">
        {displayValue}{suffix}
      </div>

      {/* Label */}
      <div className="text-sm text-pip-boy-green/70 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
};

/**
 * Memoized StatCounter Component
 *
 * Prevents unnecessary re-renders when parent component re-renders
 * with the same props. Only re-renders when icon, value, label, or suffix changes.
 *
 * Requirements: 12.10
 */
export const StatCounter = React.memo(StatCounterComponent);

StatCounter.displayName = 'StatCounter';
