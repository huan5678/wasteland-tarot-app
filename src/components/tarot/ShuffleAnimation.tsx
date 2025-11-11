/**
 * ShuffleAnimation Component
 *
 * Provides visual feedback during card shuffling with:
 * - Framer Motion animations (LazyMotion for bundle optimization)
 * - Pip-Boy style radiation effects
 * - Geiger counter sound effect
 * - Automatic performance degradation
 * - Full reduced motion support
 *
 * Requirements: 1.3, 1.4, 1.5
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as m from 'framer-motion/m';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { PixelIcon } from '@/components/ui/icons';

// Create motion aliases for cleaner JSX
const motion = { div: m.div, p: m.p };

/**
 * Props for ShuffleAnimation component
 */
export interface ShuffleAnimationProps {
  /** Whether the shuffle animation is currently playing */
  isShuffling: boolean;

  /** Animation duration in seconds (default: 1.5s) */
  duration?: number;

  /** Callback when animation completes */
  onComplete?: (duration: number) => void;

  /** Whether to play sound effects (default: true) */
  playSound?: boolean;
}

/**
 * ShuffleAnimation Component
 *
 * Displays an animated shuffle effect with Fallout-themed visuals.
 * Automatically degrades to simple fade if performance is poor.
 */
export function ShuffleAnimation({
  isShuffling,
  duration = 1.5,
  onComplete,
  playSound = true,
}: ShuffleAnimationProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const [isPerformanceDegraded, setIsPerformanceDegraded] = useState(false);
  const animationStartRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Monitor performance: check FPS during animation
  useEffect(() => {
    if (!isShuffling || prefersReducedMotion) {
      return;
    }

    animationStartRef.current = performance.now();
    frameCountRef.current = 0;

    let rafId: number;
    const checkPerformance = () => {
      frameCountRef.current++;
      const elapsed = (performance.now() - animationStartRef.current) / 1000;

      // Check FPS after 0.5 seconds
      if (elapsed > 0.5) {
        const fps = frameCountRef.current / elapsed;

        // Degrade if FPS < 30
        if (fps < 30) {
          setIsPerformanceDegraded(true);
          return; // Stop monitoring
        }
      }

      // Continue monitoring if still shuffling
      if (isShuffling && elapsed < duration) {
        rafId = requestAnimationFrame(checkPerformance);
      }
    };

    rafId = requestAnimationFrame(checkPerformance);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isShuffling, duration, prefersReducedMotion]);

  // Call onComplete callback when animation finishes
  useEffect(() => {
    if (!isShuffling) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onComplete?.(duration);
    }, duration * 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isShuffling, duration, onComplete]);

  // Play Geiger counter sound effect
  useEffect(() => {
    if (!isShuffling || !playSound || prefersReducedMotion) {
      return;
    }

    // TODO: Integrate with audio system
    // audioSystem.play('geiger_counter');

    return () => {
      // audioSystem.stop('geiger_counter');
    };
  }, [isShuffling, playSound, prefersReducedMotion]);

  // Don't render if not shuffling
  if (!isShuffling) {
    return null;
  }

  // Use simplified animation if reduced motion or performance degraded
  const shouldSimplify = prefersReducedMotion || isPerformanceDegraded;

  return (
    <motion.div
        data-testid="shuffle-animation"
        data-duration={duration}
        data-reduced-motion={shouldSimplify}
        role="status"
        aria-live="polite"
        aria-label={shouldSimplify ? '正在洗牌（簡化模式）' : '正在洗牌'}
        className="flex flex-col items-center justify-center gap-4 p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: shouldSimplify ? 0 : 0.3,
          ease: 'easeOut',
        }}
      >
        {/* Simplified animation for reduced motion or poor performance */}
        {shouldSimplify ? (
          <div data-testid="shuffle-simplified" className="text-center">
            <PixelIcon
              name="loader"
              sizePreset="xxl"
              variant="primary"
              decorative
            />
            <p className="mt-4 text-sm text-pip-boy-green/70">洗牌中...</p>
          </div>
        ) : (
          // Full animation with radiation effects
          <>
            {/* Radiation glow effect */}
            <motion.div
              data-testid="radiation-effect"
              className="relative"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-pip-boy-green/20 blur-xl" />

              {/* Card stack with shuffle effect */}
              <motion.div
                className="relative"
                animate={{
                  rotateZ: [-5, 5, -5],
                  x: [-10, 10, -10],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Multiple card layers to simulate deck */}
                {[0, 1, 2, 3, 4].map((index) => (
                  <motion.div
                    key={index}
                    className="absolute w-32 h-48 bg-black border-2 border-pip-boy-green rounded-lg"
                    style={{
                      top: `${index * 2}px`,
                      left: `${index * 2}px`,
                      zIndex: 5 - index,
                    }}
                    initial={{
                      opacity: 1 - index * 0.15,
                      rotateZ: index * 2,
                    }}
                    animate={{
                      opacity: [
                        1 - index * 0.15,
                        1 - index * 0.1,
                        1 - index * 0.15,
                      ],
                      rotateZ: [index * 2, index * -2, index * 2],
                      x: [0, (index - 2) * 5, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.1,
                    }}
                  >
                    {/* Card back pattern */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PixelIcon
                        name="sparkles"
                        sizePreset="lg"
                        variant="primary"
                        decorative
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Status text */}
            <motion.p
              className="text-sm text-pip-boy-green/70 font-mono"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.0,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              洗牌中...
            </motion.p>

            {/* Performance warning (if degraded during animation) */}
            {isPerformanceDegraded && (
              <motion.p
                className="text-xs text-amber-400/70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                已切換至簡化模式以提升效能
              </motion.p>
            )}
          </>
        )}
      </motion.div>
  );
}
