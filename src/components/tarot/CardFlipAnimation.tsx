/**
 * CardFlipAnimation Component
 *
 * Provides card flip animation with:
 * - CSS rotateY transform for 3D flip effect
 * - 0.5s flip duration with perspective
 * - Geiger counter sound effect
 * - Click and keyboard interaction support
 * - Full reduced motion and accessibility support
 *
 * Requirements: 1.7, 1.8, 1.9, 1.11
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as m from 'framer-motion/m';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CardWithPosition } from './InteractiveCardDraw';
import Image from 'next/image';

// Create motion alias for cleaner JSX
const motion = { div: m.div };

/**
 * Props for CardFlipAnimation component
 */
export interface CardFlipAnimationProps {
  /** Card to display */
  card: CardWithPosition;

  /** Whether the card is revealed (front side visible) */
  isRevealed: boolean;

  /** Callback when flip animation completes */
  onFlipComplete: (card: CardWithPosition) => void;

  /** Allow clicking on card to trigger flip */
  allowClickToFlip?: boolean;

  /** Whether the card is disabled (cannot be clicked) */
  isDisabled?: boolean;

  /** Flip animation duration in seconds */
  flipDuration?: number;

  /** Whether to play sound effects */
  playSound?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * CardFlipAnimation Component
 *
 * Main component for individual card flip animation
 */
export function CardFlipAnimation({
  card,
  isRevealed,
  onFlipComplete,
  allowClickToFlip = false,
  isDisabled = false,
  flipDuration = 0.5,
  playSound = true,
  className = '',
}: CardFlipAnimationProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const [isFlipping, setIsFlipping] = useState(false);
  const [showFront, setShowFront] = useState(isRevealed);
  const hasFlippedRef = useRef(false);

  // Handle flip animation
  useEffect(() => {
    if (isRevealed && !hasFlippedRef.current) {
      hasFlippedRef.current = true;
      setIsFlipping(true);

      // Play Geiger counter sound
      if (playSound && !prefersReducedMotion) {
        // TODO: Integrate with audio system
        // audioSystem.play('geiger_counter_short');
      }

      // Wait for flip animation duration
      const duration = prefersReducedMotion ? 0 : flipDuration * 1000;
      const timer = setTimeout(() => {
        setShowFront(true);
        setIsFlipping(false);
        onFlipComplete(card);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isRevealed, card, onFlipComplete, flipDuration, playSound, prefersReducedMotion]);

  // Handle click to flip
  const handleClick = useCallback(() => {
    if (!allowClickToFlip || isDisabled || isFlipping || hasFlippedRef.current) {
      return;
    }

    hasFlippedRef.current = true;
    setIsFlipping(true);

    // Play Geiger counter sound
    if (playSound && !prefersReducedMotion) {
      // TODO: Integrate with audio system
      // audioSystem.play('geiger_counter_short');
    }

    // Wait for flip animation duration
    const duration = prefersReducedMotion ? 0 : flipDuration * 1000;
    const timer = setTimeout(() => {
      setShowFront(true);
      setIsFlipping(false);
      onFlipComplete(card);
    }, duration);

    return () => clearTimeout(timer);
  }, [
    allowClickToFlip,
    isDisabled,
    isFlipping,
    card,
    onFlipComplete,
    flipDuration,
    playSound,
    prefersReducedMotion,
  ]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Determine rotation angle
  const rotateY = showFront ? 180 : 0;

  // ARIA label
  const ariaLabel = showFront
    ? `${card.positionLabel || '卡片'}: ${card.name} (${
        card.position === 'upright' ? '正位' : '逆位'
      })（已翻開）`
    : `${card.positionLabel || '卡片'}: 點擊以翻開`;

  return (
    <motion.div
      data-testid="card-flip-animation"
      data-is-revealed={isRevealed || showFront}
      data-is-disabled={isDisabled}
      data-flip-duration={flipDuration}
      data-reduced-motion={prefersReducedMotion}
      data-card-position={card.position}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={ariaLabel}
      className={`relative w-40 h-60 cursor-pointer perspective-1000 ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Card container with flip animation */}
      <motion.div
        className="relative w-full h-full transition-transform preserve-3d"
        animate={{
          rotateY,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : flipDuration,
          ease: 'easeInOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card Back */}
        <div
          data-testid="card-back"
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="w-full h-full bg-black border-2 border-pip-boy-green rounded-lg overflow-hidden">
            {/* Position label */}
            {card.positionLabel && (
              <div className="absolute top-2 left-2 right-2 text-xs text-center text-pip-boy-green/70 font-mono bg-black/80 px-2 py-1 rounded z-10">
                {card.positionLabel}
              </div>
            )}

            {/* Card back pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-52 border border-pip-boy-green/30 rounded flex flex-col items-center justify-center gap-4 p-4">
                {/* Radiation symbol (placeholder) */}
                <div className="w-16 h-16 border-2 border-pip-boy-green/50 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border border-pip-boy-green/30 rounded-full" />
                </div>

                <span className="text-xs text-pip-boy-green/50 font-mono">
                  WASTELAND
                  <br />
                  TAROT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Front */}
        <div
          data-testid="card-front"
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            className={`w-full h-full bg-black border-2 border-pip-boy-green rounded-lg overflow-hidden ${
              card.position === 'reversed' ? 'rotate-180' : ''
            }`}
          >
            {/* Card image */}
            <div className="relative w-full h-full">
              <Image
                src={card.image_url || '/images/cards/placeholder.png'}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 160px"
              />

              {/* Card name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                <p className="text-sm font-bold text-pip-boy-green text-center">
                  {card.name}
                </p>
                <p className="text-xs text-pip-boy-green/70 text-center mt-1">
                  {card.position === 'upright' ? '正位' : '逆位'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hover glow effect (only when not flipping) */}
      {!isFlipping && !isDisabled && !prefersReducedMotion && (
        <div className="absolute inset-0 rounded-lg pointer-events-none transition-opacity opacity-0 hover:opacity-100">
          <div className="absolute inset-0 bg-pip-boy-green/10 rounded-lg blur-sm" />
        </div>
      )}

      {/* Disabled overlay */}
      {isDisabled && (
        <div className="absolute inset-0 bg-black/50 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  );
}
