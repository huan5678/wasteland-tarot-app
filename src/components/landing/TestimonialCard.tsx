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
 * - Hover animation (scale 1.02 + shadow enhancement)
 * - Image load detection (prevents content flashing)
 *
 * Requirements: 4.2, 4.7, 4.9, 4.10, 10.1, 10.2, 10.3, 12.10
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
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
 * Task 10.2: Hover effect (scale 1.02 + shadow enhancement)
 * Task 10.3: Image load detection
 */
export const TestimonialCard = React.memo<TestimonialCardProps>(
  ({ avatar, username, rating, review }) => {
    // Task 10.3: Track image load state
    const [imageLoaded, setImageLoaded] = useState(false);

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

    // Task 10.2: Hover animation variants
    const hoverVariants = {
      scale: 1.02,
      boxShadow: '0 0 15px rgba(0, 255, 136, 0.4), 0 0 30px rgba(0, 255, 136, 0.2)',
      transition: { duration: 0.3, ease: 'easeOut' },
    };

    return (
      <motion.div
        className="testimonial-card"
        whileHover={hoverVariants}
        data-image-loaded={imageLoaded}
        style={{ opacity: imageLoaded ? 1 : 0 }}
      >
        <PipBoyCard variant="default" padding="lg">
          <PipBoyCardContent>
            {/* Header: Avatar + Username + Rating */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar Icon */}
              <div className="flex-shrink-0">
                <div
                  data-testid="avatar-icon"
                  onLoad={() => setImageLoaded(true)}
                >
                  <PixelIcon
                    name={avatar}
                    sizePreset="md"
                    decorative
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
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
      </motion.div>
    );
  }
);

TestimonialCard.displayName = 'TestimonialCard';
