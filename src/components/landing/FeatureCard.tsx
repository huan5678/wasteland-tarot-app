/**
 * FeatureCard Component
 * Feature card with entrance animation and icon hover effects
 * Integrates GSAP scroll animation and Framer Motion hover interactions
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
import { featureIconHoverVariants } from '@/lib/animations/motionVariants';
import type { IconName } from '@/components/ui/icons/iconMapping';

export interface FeatureCardProps {
  /** Icon name from RemixIcon set */
  icon: IconName;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * FeatureCard - Feature display card with entrance and hover animations
 *
 * Features:
 * - GSAP scroll-triggered entrance animation (scale 0.9 → 1)
 * - Framer Motion icon hover animation (360° rotation + Pip-Boy Green)
 * - Reduced motion support (disables rotation, keeps color change)
 * - Accessibility compliance (ARIA attributes)
 *
 * @example
 * ```tsx
 * <FeatureCard
 *   icon="zap"
 *   title="量子占卜"
 *   description="先進演算法處理"
 * />
 * ```
 */
export function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Create hover-aware variants that respect reduced motion
  const iconVariants = {
    rest: { rotate: 0, color: '#00ff88' },
    hover: {
      rotate: prefersReducedMotion ? 0 : 360, // Disable rotation if reduced motion
      color: '#00ff88', // Always apply Pip-Boy Green color
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div
      data-testid="feature-card"
      className={`feature-card border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] p-6 text-center ${className}`}
      role="article"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon with Framer Motion hover animation */}
      <motion.div
        initial="rest"
        animate={isHovered ? 'hover' : 'rest'}
        variants={iconVariants}
        data-motion-icon
        data-motion-state={isHovered ? 'hover' : 'rest'}
        data-reduced-motion={prefersReducedMotion}
        className="mb-4 mx-auto inline-block"
      >
        <PixelIcon
          name={icon}
          sizePreset="lg"
          className="text-pip-boy-green"
          aria-hidden="true"
        />
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-bold text-pip-boy-green mb-2">{title}</h3>

      {/* Description */}
      <p className="text-pip-boy-green/60 text-sm">{description}</p>
    </div>
  );
}
