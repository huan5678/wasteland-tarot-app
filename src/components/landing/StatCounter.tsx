'use client';

/**
 * StatCounter Component
 *
 * Animated number counter component using GSAP with ScrollTrigger integration.
 * Features background pulse effect via Framer Motion.
 *
 * Features:
 * - GSAP-based number scrolling animation (0 → target value)
 * - Intl.NumberFormat for thousand separators
 * - Framer Motion background pulse during animation
 * - ScrollTrigger integration (animates when entering viewport)
 * - Reduced motion support
 * - PixelIcon integration
 *
 * @module StatCounter
 */

import React, { useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from '@/components/ui/icons';
import { useCounterAnimation } from '@/lib/animations/useCounterAnimation';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

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

  /**
   * Scroller element (預設 window，傳入 '#main-content' 使用 main content scrollbar)
   */
  scroller?: string | HTMLElement;
}

/**
 * StatCounter Component
 *
 * Displays an animated statistic counter with icon and label.
 * Uses GSAP for number scrolling and Framer Motion for background pulse.
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
  scroller,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // ✅ Stabilize config objects to prevent re-initialization
  const formatOptions = useMemo(() => ({
    useGrouping: true, // Enable thousand separators
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    locale: 'zh-TW',
  }), []);

  // ✅ Empty config - all defaults from gsapConfig.scrollTrigger
  // No need to pass anything, useCounterAnimation will use gsapConfig defaults
  const scrollTriggerConfig = useMemo(() => ({}), []);

  // Use GSAP counter animation with ScrollTrigger
  const { formattedValue, isComplete } = useCounterAnimation({
    triggerRef,
    targetValue: value,
    formatOptions,
    scrollTriggerConfig,
    scroller, // ✅ Pass scroller parameter
  });

  // Background pulse animation variants
  const pulseVariants = {
    idle: {
      backgroundColor: 'rgba(0, 255, 136, 0.05)',
    },
    animating: {
      backgroundColor: [
        'rgba(0, 255, 136, 0.05)',
        'rgba(0, 255, 136, 0.15)',
        'rgba(0, 255, 136, 0.05)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      ref={triggerRef}
      data-testid="stat-counter-pulse"
      className="flex flex-col items-center justify-center text-center space-y-2 p-4 rounded-lg"
      variants={pulseVariants}
      initial="idle"
      animate={isComplete || prefersReducedMotion ? 'idle' : 'animating'}
    >
      {/* Icon */}
      <PixelIcon
        name={icon}
        sizePreset="md"
        variant="primary"
        decorative
      />

      {/* Number with suffix */}
      <div className="text-4xl font-bold text-pip-boy-green">
        {formattedValue}{suffix}
      </div>

      {/* Label */}
      <div className="text-sm text-pip-boy-green/70 uppercase tracking-wide">
        {label}
      </div>
    </motion.div>
  );
};

/**
 * Memoized StatCounter Component
 *
 * Prevents unnecessary re-renders when parent component re-renders
 * with the same props.
 */
export const StatCounter = React.memo(StatCounterComponent);

StatCounter.displayName = 'StatCounter';
