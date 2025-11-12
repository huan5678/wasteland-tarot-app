/**
 * FanCard Component
 *
 * Individual tarot card in fan layout with:
 * - GPU-accelerated transforms (translate3d, rotate)
 * - Selection visual feedback (lift, glow, scale)
 * - CardThumbnail integration for consistent visual effects
 * - Performance optimization (React.memo, CSS containment)
 * - Accessibility support
 *
 * Requirements: Performance optimized for 78-card rendering
 * Security: Uses dummy card data (no real card info exposed to DOM)
 */

'use client';

import React, { useMemo } from 'react';
import * as m from 'framer-motion/m';
import { CardPosition } from '@/hooks/useFanLayout';
import { CardThumbnail } from '@/components/cards/CardThumbnail';
import type { TarotCard } from '@/types/api';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// Create motion alias
const motion = { div: m.div };

/**
 * Create a minimal dummy card for card back rendering
 * SECURITY: Does not contain real card data, only used for CardThumbnail styling
 */
function createDummyCard(index: number): TarotCard {
  return {
    id: `dummy-${index}`,
    name: 'Wasteland Tarot',
    suit: 'major_arcana',
    number: null,
    upright_meaning: '',
    reversed_meaning: '',
    metadata: {
      radiation_level: 0,
      threat_level: 1,
      vault_number: null,
    },
    character_voices: {},
    faction_meanings: {},
    visuals: {
      image_url: null,
      image_alt_text: null,
      background_image_url: null,
      audio_cue_url: null,
      geiger_sound_intensity: 0.1,
    },
    stats: {
      draw_frequency: 0,
      total_appearances: 0,
      last_drawn_at: null,
    },
    wasteland_story: null,
    created_at: '',
    updated_at: '',
  };
}

/**
 * Props for FanCard component
 * NOTE: Card does NOT receive actual card data to prevent DevTools snooping
 */
export interface FanCardProps {
  /** Card index in deck (0-77) */
  index: number;

  /** Calculated position in fan layout */
  position: CardPosition;

  /** Whether this card is selected */
  isSelected: boolean;

  /** Whether the card is disabled (e.g., during drag) */
  isDisabled?: boolean;

  /** Card dimensions */
  width: number;
  height: number;

  /** Card back image URL (for daily random card back) */
  cardBackUrl: string;

  /** Click handler */
  onClick?: () => void;
}

/**
 * FanCard Component
 *
 * Optimized for performance with React.memo and CSS transforms
 * Uses CardThumbnail for consistent visual effects
 * Shows only card back (dummy data) to prevent DevTools snooping
 */
export const FanCard = React.memo(function FanCard({
  index,
  position,
  isSelected,
  isDisabled = false,
  width,
  height,
  cardBackUrl,
  onClick,
}: FanCardProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const shouldAnimate = !prefersReducedMotion && !isDisabled;

  // Create dummy card (security: no real card data)
  const dummyCard = useMemo(() => createDummyCard(index), [index]);

  // Determine size preset based on width
  const sizePreset = useMemo(() => {
    if (width < 70) return 'small';
    if (width < 100) return 'medium';
    return 'large';
  }, [width]);

  // Calculate transform style (GPU-accelerated)
  const transformStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: `${width}px`,
      height: `${height}px`,
      // CRITICAL: translate to position, then rotate around center
      // Subtract half width/height to center the card at the target position
      transform: `
        translate3d(${position.x - width / 2}px, ${position.y - height / 2}px, 0)
        rotate(${position.rotation}deg)
        ${isSelected ? 'translateY(-20px) scale(1.15)' : ''}
      `,
      transformOrigin: 'center center',
      zIndex: isSelected ? 9999 : position.zIndex,
      // Performance hints
      willChange: shouldAnimate ? 'transform' : 'auto',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      // CSS containment for performance
      contain: 'layout style paint' as const,
      // Cursor
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      // Transition for smooth selection
      transition: prefersReducedMotion
        ? 'none'
        : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s',
    }),
    [position, isSelected, width, height, isDisabled, shouldAnimate, prefersReducedMotion]
  );

  // Motion variants for hover/tap
  const motionVariants = useMemo(
    () => ({
      hover: shouldAnimate
        ? {
            scale: isSelected ? 1.15 : 1.05,
            y: isSelected ? -20 : -10,
          }
        : undefined,
      tap: shouldAnimate
        ? {
            scale: isSelected ? 1.1 : 0.98,
          }
        : undefined,
    }),
    [shouldAnimate, isSelected]
  );

  return (
    <motion.div
      data-testid={`fan-card-${index}`}
      data-selected={isSelected}
      data-card-index={index}
      style={transformStyle}
      className="fan-card"
      onClick={isDisabled ? undefined : onClick}
      whileHover={motionVariants.hover}
      whileTap={motionVariants.tap}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`牌組第 ${index + 1} 張${isSelected ? ' (已選擇)' : ''}`}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Use CardThumbnail in flippable mode (card back only) */}
      <div
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          // Selection visual feedback
          filter: isSelected
            ? 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.6)) drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
            : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
          opacity: isDisabled ? 0.5 : 1,
          transition: prefersReducedMotion ? 'none' : 'filter 0.3s, opacity 0.3s',
        }}
      >
        <CardThumbnail
          card={dummyCard}
          size={sizePreset}
          flippable
          isRevealed={false}
          cardBackUrl={cardBackUrl}
          enable3DTilt={false} // Disable 3D tilt (handled by parent motion.div)
        />

        {/* Selection badge (checkmark) */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#00ff88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 255, 136, 0.6)',
              zIndex: 1,
            }}
          >
            <div style={{ width: '12px', height: '12px', color: '#000' }}>✓</div>
          </div>
        )}

        {/* Disabled overlay */}
        {isDisabled && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              borderRadius: '8px',
            }}
          />
        )}
      </div>
    </motion.div>
  );
});

FanCard.displayName = 'FanCard';
