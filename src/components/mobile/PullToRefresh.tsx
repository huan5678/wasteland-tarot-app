/**
 * PullToRefresh - Pull-to-Refresh Component
 * Spec: mobile-native-app-layout
 * Phase 3: Advanced Interactions
 * 
 * Native-style pull-to-refresh with Pip-Boy themed loading indicator
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  className = ''
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Track if we're at scroll top
  useEffect(() => {
    const checkScrollTop = () => {
      if (containerRef.current) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        setCanPull(scrollTop === 0);
      }
    };

    window.addEventListener('scroll', checkScrollTop, { passive: true });
    checkScrollTop();

    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  // Pull indicator animation
  const [{ y, rotation, opacity }, api] = useSpring(() => ({
    y: 0,
    rotation: 0,
    opacity: 0,
    config: { tension: 300, friction: 30 }
  }));

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    triggerHaptic('medium');

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      // Spring back animation
      api.start({
        y: 0,
        rotation: 0,
        opacity: 0
      });
    }
  }, [onRefresh, api, triggerHaptic]);

  // Gesture binding for pull detection
  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], last, cancel }) => {
      if (disabled || !canPull || isRefreshing) {
        return;
      }

      // Only allow downward pulls
      if (my < 0) {
        cancel();
        return;
      }

      // Apply damping physics for natural feel
      const dampedY = Math.min(my * 0.4, threshold * 1.5);
      const progress = Math.min(dampedY / threshold, 1);

      // Update indicator position and rotation
      api.start({
        y: dampedY,
        rotation: progress * 360,
        opacity: progress,
        immediate: !last
      });

      // Trigger refresh on release if threshold met
      if (last) {
        if (dampedY >= threshold || vy > 0.5) {
          // Threshold reached - trigger refresh
          handleRefresh();
        } else {
          // Spring back
          api.start({
            y: 0,
            rotation: 0,
            opacity: 0
          });
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      pointer: { touch: true }
    }
  );

  return (
    <div 
      ref={containerRef} 
      className={cn('relative', className)}
      {...bind()}
    >
      {/* Pull-to-Refresh Indicator */}
      <animated.div
        style={{
          y,
          opacity,
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50
        }}
        className="flex flex-col items-center justify-center"
      >
        {/* Pip-Boy Themed Loading Spinner */}
        <animated.div
          style={{ rotate: rotation }}
          className={cn(
            'w-12 h-12 border-4 border-pip-boy-green/30 rounded-full',
            'border-t-pip-boy-green',
            isRefreshing && 'animate-spin'
          )}
        />
        <p className="text-pip-boy-green text-xs mt-2 font-pixel">
          {isRefreshing ? '正在刷新...' : '下拉刷新'}
        </p>
      </animated.div>

      {/* Content */}
      <div className={cn(isRefreshing && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}
