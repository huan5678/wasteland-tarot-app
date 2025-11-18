/**
 * StepCard Component
 *
 * Reusable step card component for displaying usage flow steps
 * with Fallout-themed styling.
 *
 * Features:
 * - Step number badge (1-4)
 * - PixelIcon integration (40px size, decorative)
 * - Title and description text
 * - Hover effects (scale transform + glow)
 * - Icon rotation animation when card enters viewport (360° over 0.6s)
 * - Pip-Boy themed styling (border-2 border-pip-boy-green)
 * - Responsive layout (desktop 4 columns, mobile 1 column)
 * - Fixed height to prevent layout shift
 *
 * Requirements: 2.2, 2.7, 2.8, 2.9, 10.2, 8.2, 8.3
 */

'use client';

import React from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface StepCardProps {
  /**
   * Step number (1-4)
   */
  stepNumber: number;

  /**
   * RemixIcon icon name
   * @example "layout-grid", "shuffle", "hand", "cpu"
   */
  icon: string;

  /**
   * Step title (Traditional Chinese)
   * @example "選擇牌陣"
   */
  title: string;

  /**
   * Step description text (Traditional Chinese)
   * @example "從多種廢土主題牌陣中選擇適合的占卜方式"
   */
  description: string;
}

/**
 * StepCard Component
 * Reusable step card for How It Works section
 *
 * Integrates Framer Motion for icon rotation animation when card enters viewport
 */
export const StepCard = React.memo<StepCardProps>(
  ({ stepNumber, icon, title, description }) => {
    const prefersReducedMotion = useReducedMotion();

    // Icon rotation variant for whileInView animation
    const iconRotationVariant = {
      hidden: { rotate: 0 },
      visible: {
        rotate: 360,
        transition: {
          duration: prefersReducedMotion ? 0 : 0.6,
          ease: 'easeInOut',
        },
      },
    };

    return (
      <PipBoyCard
        variant="default"
        padding="lg"
        className="step-card text-center hover:scale-105 transition-transform duration-300 min-h-[280px]"
        role="article"
      >
        <PipBoyCardContent>
          {/* Step Number Badge */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-pip-boy-green bg-black/60 text-2xl font-bold text-pip-boy-green mb-4 mx-auto">
            {stepNumber}
          </div>

          {/* Step Icon with Rotation Animation */}
          <motion.div
            variants={iconRotationVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="mb-4"
          >
            <PixelIcon name={icon} size={40} className="mx-auto text-pip-boy-green" decorative />
          </motion.div>

          {/* Step Title */}
          <h3 className="text-lg font-bold text-pip-boy-green mb-2">
            {title}
          </h3>

          {/* Step Description */}
          <p className="text-pip-boy-green/60 text-sm leading-relaxed">
            {description}
          </p>
        </PipBoyCardContent>
      </PipBoyCard>
    );
  }
);

StepCard.displayName = 'StepCard';
