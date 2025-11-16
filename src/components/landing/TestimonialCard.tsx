/**
 * TestimonialCard Component
 *
 * Reusable testimonial card component for displaying user reviews
 * with Fallout-themed styling.
 *
 * Features:
 * - User avatar (Fallout character PixelIcon)
 * - Username display
 * - Rating stars (0-5, filled vs empty)
 * - Review text
 * - PipBoyCard base container with Pip-Boy themed styling
 *
 * Requirements: 4.2, 4.7, 4.9, 4.10, 10.2, 12.10
 */

'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';

export interface TestimonialCardProps {
  /**
   * Avatar icon (PixelIcon name)
   * @example "user-3", "user-6", "skull", "shield"
   */
  avatar: string;

  /**
   * Username (Fallout themed)
   * @example "�@111_X"
   */
  username: string;

  /**
   * Rating (0-5)
   * @example 5
   */
  rating: number;

  /**
   * Review text (Traditional Chinese)
   * @example "s�� AI `\�0�..."
   */
  review: string;
}

/**
 * TestimonialCard Component
 * User review card with avatar, rating stars, and testimonial text
 */
export const TestimonialCard = React.memo<TestimonialCardProps>(
  ({ avatar, username, rating, review }) => {
    // Clamp rating between 0 and 5
    const clampedRating = Math.max(0, Math.min(5, Math.floor(rating)));

    // Generate star icons (0-5 stars)
    const stars = Array.from({ length: 5 }, (_, i) => {
      const isFilled = i < clampedRating;

      return (
        <PixelIcon
          key={i}
          name={isFilled ? 'star-fill' : 'star'}
          variant={isFilled ? 'primary' : 'muted'}
          sizePreset="xs"
          decorative
        />
      );
    });

    return (
      <PipBoyCard variant="default" padding="lg">
        <PipBoyCardContent>
          {/* Header: Avatar + Username + Rating */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar Icon */}
            <div className="flex-shrink-0">
              <PixelIcon name={avatar} sizePreset="md" decorative />
            </div>

            {/* Username and Rating */}
            <div className="flex-1 min-w-0">
              {/* Username */}
              <div className="font-semibold text-pip-boy-green mb-2">
                {username}
              </div>

              {/* Rating Stars */}
              <div className="flex items-center gap-1">{stars}</div>
            </div>
          </div>

          {/* Review Text */}
          <p className="text-pip-boy-green/60 text-sm leading-relaxed">
            {review}
          </p>
        </PipBoyCardContent>
      </PipBoyCard>
    );
  }
);

TestimonialCard.displayName = 'TestimonialCard';
