/**
 * Usage Examples for usePrefersReducedMotion Hook
 *
 * This file demonstrates how to use the usePrefersReducedMotion hook
 * in various scenarios within the Wasteland Tarot application.
 *
 * This is for documentation purposes only - not imported by the app.
 */

'use client';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { motion, MotionConfig } from 'motion';

/**
 * Example 1: Basic Usage with Framer Motion
 *
 * Disable animations when user prefers reduced motion
 */
export function BasicAnimatedCard() {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut',
      }}
      className="tarot-card"
    >
      Card Content
    </motion.div>
  );
}

/**
 * Example 2: Global MotionConfig Integration
 *
 * Apply reduced motion preference to all Framer Motion animations
 */
export function AppWithMotionConfig({ children }: { children: React.ReactNode }) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
      {children}
    </MotionConfig>
  );
}

/**
 * Example 3: Conditional Animation with Loading State
 *
 * Show loading state while preference is being determined
 */
export function CardWithLoadingState() {
  const { prefersReducedMotion, isLoading } = usePrefersReducedMotion();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      animate={{
        scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
      }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        repeat: prefersReducedMotion ? 0 : Infinity,
      }}
    >
      Pulsing Card
    </motion.div>
  );
}

/**
 * Example 4: Custom CSS Animations
 *
 * Control CSS animations based on user preference
 */
export function CardWithCSSAnimation() {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <div
      className="card"
      style={{
        animation: prefersReducedMotion ? 'none' : 'slideIn 0.3s ease-out',
      }}
    >
      Card with CSS Animation
    </div>
  );
}

/**
 * Example 5: Shuffle Animation with Reduced Motion
 *
 * Simplified shuffle animation when reduced motion is preferred
 */
export function ShuffleAnimation({ cards }: { cards: any[] }) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <div className="card-deck">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.3,
            delay: prefersReducedMotion ? 0 : index * 0.05,
          }}
        >
          {card.name}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Example 6: Pip-Boy Screen Scan Effect
 *
 * Disable scan line animation when reduced motion is preferred
 */
export function PipBoyScreen({ children }: { children: React.ReactNode }) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <div className="pip-boy-screen">
      {!prefersReducedMotion && (
        <motion.div
          className="scan-line"
          animate={{ y: ['0%', '100%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Example 7: Geiger Counter Effect
 *
 * Disable particle effects when reduced motion is preferred
 */
export function GeigerCounterEffect() {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    // Static indicator instead of animated particles
    return <div className="static-radiation-indicator">☢️</div>;
  }

  return (
    <div className="radiation-particles">
      {/* Animated particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Integration Guidelines:
 *
 * 1. **Always respect user preferences**: Never override reduced motion preference
 * 2. **Graceful degradation**: Provide static alternative for all animations
 * 3. **Loading state handling**: Show loading UI during SSR hydration if needed
 * 4. **Performance**: Hook returns stable references, safe for dependency arrays
 * 5. **Accessibility**: This is an accessibility feature - treat it seriously
 *
 * Browser Support:
 * - Modern browsers: Full support
 * - Legacy browsers: Falls back to safe default (no animations)
 * - SSR: Safe (defaults to reduced motion during server render)
 */
