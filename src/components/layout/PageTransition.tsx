/**
 * PageTransition - Page Transition Animations
 * Spec: mobile-native-app-layout
 * Phase 2: Page Transition Animations
 * 
 * Provides smooth page transitions with direction-aware animations
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigationState } from '@/hooks/useNavigationState';
import { usePrefersReducedMotion, useIsMobile } from '@/hooks/useMediaQuery';
import { useAnimationQuality, useGPUAcceleration } from '@/hooks/useFrameRate';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page transition wrapper component
 * Animates page changes based on navigation direction
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { direction, isTabSwitch, currentRoute } = useNavigationState();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const { quality, settings, shouldReduceMotion } = useAnimationQuality();
  const { getAccelerationStyles } = useGPUAcceleration();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't animate on initial mount, if reduced motion is preferred, or on desktop
  if (!mounted || prefersReducedMotion || shouldReduceMotion || !isMobile) {
    return <>{children}</>;
  }

  // Animation variants
  const variants = {
    // Forward navigation (new page slides in from right)
    slideInRight: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-30%', opacity: 0 }
    },
    
    // Backward navigation (new page slides in from left)
    slideInLeft: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '30%', opacity: 0 }
    },
    
    // Tab switch (cross-fade)
    crossFade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    
    // No animation
    none: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 }
    }
  };

  // Select variant based on navigation state
  const variant = isTabSwitch ? 'crossFade' :
                  direction === 'forward' ? 'slideInRight' :
                  direction === 'backward' ? 'slideInLeft' : 'none';

  const selectedVariant = variants[variant];

  // Spring animation config - dynamic based on performance
  const transition = {
    type: 'spring',
    stiffness: settings.stiffness,
    damping: settings.damping,
    mass: 0.8
  };

  // For cross-fade, use simpler transition
  const fadeTransition = {
    duration: settings.duration,
    ease: 'easeOut'
  };

  // GPU acceleration styles
  const accelerationStyles = getAccelerationStyles();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={currentRoute}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={variant === 'crossFade' ? fadeTransition : transition}
        className="page-transition"
        style={accelerationStyles}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simpler version using View Transitions API (Chrome 111+)
 * Fallback to PageTransition component if not supported
 */
export function ViewTransition({ children }: PageTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [supportsViewTransitions, setSupportsViewTransitions] = useState(false);

  useEffect(() => {
    setSupportsViewTransitions('startViewTransition' in document);
  }, []);

  // Use PageTransition as fallback
  if (!supportsViewTransitions || prefersReducedMotion) {
    return <PageTransition>{children}</PageTransition>;
  }

  // View Transitions API will be handled by Next.js or browser
  return <>{children}</>;
}
