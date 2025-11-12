/**
 * DeckStack Component
 *
 * Visual representation of a 78-card tarot deck stack with:
 * - CSS 3D layered card effect
 * - Fallout Pip-Boy aesthetic
 * - Hover radiation glow effect
 * - Click interaction to trigger shuffle
 * - GPU acceleration and reduced motion support
 *
 * Requirements: AC1, AC2
 */

'use client';

import React from 'react';
import * as m from 'framer-motion/m';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { PixelIcon } from '@/components/ui/icons';

// Create motion alias for cleaner JSX
const motion = { div: m.div };

/**
 * Props for DeckStack component
 */
export interface DeckStackProps {
  /** Callback when deck is clicked */
  onClick: () => void;

  /** Whether the deck is disabled (cannot be clicked) */
  isDisabled?: boolean;

  /** Number of cards in the deck (for display) */
  cardCount?: number;

  /** Additional CSS classes */
  className?: string;
}

/**
 * DeckStack Component
 *
 * Displays a visual stack of tarot cards with hover effects
 */
export function DeckStack({
  onClick,
  isDisabled = false,
  cardCount = 78,
  className = '',
}: DeckStackProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  // Disable animations if reduced motion is preferred
  const shouldAnimate = !prefersReducedMotion && !isDisabled;

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Instruction text */}
      <p className="text-sm text-pip-boy-green/70 font-mono text-center">
        點擊牌組開始抽牌
      </p>

      {/* Deck stack container with hover effect */}
      <motion.div
        data-testid="deck-stack"
        data-disabled={isDisabled}
        data-reduced-motion={prefersReducedMotion}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={`廢土塔羅牌組（${cardCount} 張）- 點擊開始抽牌`}
        className={`relative w-48 h-72 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onClick={isDisabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        // Hover animation: lift and scale
        whileHover={
          shouldAnimate
            ? {
                scale: 1.05,
                y: -10,
              }
            : undefined
        }
        // Tap animation: slight press down
        whileTap={
          shouldAnimate
            ? {
                scale: 0.98,
                y: 0,
              }
            : undefined
        }
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        style={{
          // GPU acceleration hint
          willChange: shouldAnimate ? 'transform' : 'auto',
        }}
      >
        {/* Radiation glow effect (visible on hover) */}
        {shouldAnimate && (
          <motion.div
            data-testid="radiation-glow"
            className="absolute inset-0 -z-10 rounded-lg"
            style={{
              background:
                'radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Card stack layers (5 layers for depth effect) */}
        {[0, 1, 2, 3, 4].map((layerIndex) => (
          <motion.div
            key={layerIndex}
            data-testid={`deck-layer-${layerIndex}`}
            className="absolute w-full h-full bg-black border-2 border-pip-boy-green rounded-lg"
            style={{
              top: `${layerIndex * 2}px`,
              left: `${layerIndex * 2}px`,
              zIndex: 5 - layerIndex,
              opacity: prefersReducedMotion ? 1 : 1 - layerIndex * 0.15,
              // GPU acceleration
              willChange: shouldAnimate ? 'transform, opacity' : 'auto',
              contain: 'layout style paint',
            }}
            // Subtle animation for layers (only if motion enabled)
            animate={
              shouldAnimate
                ? {
                    rotateZ: [layerIndex * 1, layerIndex * -1, layerIndex * 1],
                    opacity: [
                      1 - layerIndex * 0.15,
                      1 - layerIndex * 0.1,
                      1 - layerIndex * 0.15,
                    ],
                  }
                : undefined
            }
            transition={
              shouldAnimate
                ? {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: layerIndex * 0.2,
                  }
                : undefined
            }
          >
            {/* Card back pattern (only visible on top layer) */}
            {layerIndex === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                {/* Radiation symbol */}
                <div className="relative">
                  <PixelIcon
                    name="sparkles"
                    sizePreset="xxl"
                    variant="primary"
                    decorative
                  />

                  {/* Pulsing glow effect around icon */}
                  {shouldAnimate && (
                    <motion.div
                      className="absolute inset-0 -z-10"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <div className="w-full h-full bg-pip-boy-green/30 rounded-full blur-xl" />
                    </motion.div>
                  )}
                </div>

                {/* Deck info */}
                <div className="text-center">
                  <p className="text-xs text-pip-boy-green/70 font-mono uppercase tracking-wider">
                    Wasteland Tarot
                  </p>
                  <p className="text-lg font-bold text-pip-boy-green mt-1">
                    {cardCount} 張
                  </p>
                </div>

                {/* Decorative border */}
                <div className="absolute inset-4 border border-pip-boy-green/20 rounded-md pointer-events-none" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Disabled overlay */}
        {isDisabled && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-10">
            <p className="text-xs text-pip-boy-green/50 font-mono">
              洗牌中...
            </p>
          </div>
        )}
      </motion.div>

      {/* Card count label */}
      <div className="flex items-center gap-2 text-xs text-pip-boy-green/50 font-mono">
        <PixelIcon name="layers" sizePreset="xs" variant="muted" decorative />
        <span>完整塔羅牌組</span>
      </div>
    </div>
  );
}
