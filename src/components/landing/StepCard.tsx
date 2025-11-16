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
 * - Pip-Boy themed styling (border-2 border-pip-boy-green)
 * - Responsive layout (desktop 4 columns, mobile 1 column)
 *
 * Requirements: 2.2, 2.7, 2.8, 2.9, 10.2
 */

'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';

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
 */
export const StepCard = React.memo<StepCardProps>(
  ({ stepNumber, icon, title, description }) => {
    return (
      <PipBoyCard
        variant="default"
        padding="lg"
        className="text-center hover:scale-105 transition-transform duration-300"
        role="article"
      >
        <PipBoyCardContent>
          {/* Step Number Badge */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-pip-boy-green bg-black/60 text-2xl font-bold text-pip-boy-green mb-4 mx-auto">
            {stepNumber}
          </div>

          {/* Step Icon */}
          <PixelIcon name={icon} size={40} className="mb-4 mx-auto text-pip-boy-green" decorative />

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
