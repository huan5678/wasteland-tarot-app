/**
 * usePrefersReducedMotion Hook
 *
 * Detects the user's `prefers-reduced-motion` system setting.
 * This is critical for accessibility, as users with vestibular disorders
 * or motion sensitivity need to disable animations.
 *
 * According to research, ~35% of adults over 40 may be affected by
 * vestibular disorders that cause motion sickness from animations.
 *
 * SSR Safety: Always defaults to `true` during server-side rendering
 * to ensure a conservative approach (no animations until client confirms).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @see https://www.joshwcomeau.com/react/prefers-reduced-motion/
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Return type for usePrefersReducedMotion hook
 */
export interface UsePrefersReducedMotionReturn {
  /**
   * Whether the user prefers reduced motion
   * - `true`: User has enabled "reduce motion" in system settings
   * - `false`: User has no preference or prefers standard motion
   */
  prefersReducedMotion: boolean;

  /**
   * Whether the hook is still determining the user's preference
   * - `true`: During SSR or initial client hydration
   * - `false`: Preference has been determined
   */
  isLoading: boolean;
}

/**
 * Custom hook to detect user's motion preference from system settings.
 *
 * **SSR Safety**:
 * - Returns `prefersReducedMotion: true` and `isLoading: true` during SSR
 * - Updates to actual preference after client-side hydration
 *
 * **Dynamic Updates**:
 * - Listens for changes to system settings
 * - Automatically updates when user changes their preference
 *
 * **Browser Compatibility**:
 * - Falls back to deprecated `addListener` API if `addEventListener` unavailable
 * - Returns `true` if `window.matchMedia` is not supported (safe default)
 *
 * @example
 * ```tsx
 * import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
 * import { motion } from 'framer-motion';
 *
 * function AnimatedComponent() {
 *   const { prefersReducedMotion, isLoading } = usePrefersReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ opacity: 1 }}
 *       transition={{
 *         duration: prefersReducedMotion ? 0 : 0.3,
 *       }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with Framer Motion MotionConfig
 * import { MotionConfig } from 'framer-motion';
 *
 * function App() {
 *   const { prefersReducedMotion } = usePrefersReducedMotion();
 *
 *   return (
 *     <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
 *       {children}
 *     </MotionConfig>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): UsePrefersReducedMotionReturn {
  // SSR-safe default: assume reduced motion during server-side rendering
  // This is a conservative approach to ensure accessibility
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if window.matchMedia is available
    // (might not be in older browsers or during SSR)
    if (typeof window === 'undefined' || !window.matchMedia) {
      // Keep default value (true) for safety
      setIsLoading(false);
      return;
    }

    // Query for the reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Check if mediaQuery is valid
    if (!mediaQuery) {
      // Keep default value (true) for safety
      setIsLoading(false);
      return;
    }

    // Set initial value based on current preference
    setPrefersReducedMotion(mediaQuery.matches);
    setIsLoading(false);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers: addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);

      // Cleanup function
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    // Legacy browsers: addListener (deprecated but still supported)
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);

      // Cleanup function for legacy API
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }

    // If neither API is available, no cleanup needed
    return undefined;
  }, []);

  // Return stable object reference
  // Note: We don't use useMemo here because the values change rarely
  // and the object creation cost is negligible
  return {
    prefersReducedMotion,
    isLoading,
  };
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use named export `usePrefersReducedMotion` instead
 */
export default usePrefersReducedMotion;
