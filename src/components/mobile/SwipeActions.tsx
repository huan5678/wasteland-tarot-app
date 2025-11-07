/**
 * SwipeActions - Swipe Actions Component
 * Spec: mobile-native-app-layout
 * Phase 3: Advanced Interactions
 * 
 * iOS/Android style swipe-to-reveal actions for list items
 */

'use client';

import React, { useRef } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: IconName;
  color: string;
  onAction: () => void;
}

interface SwipeActionsProps {
  actions: SwipeAction[];
  children: React.ReactNode;
  autoExecuteThreshold?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeActions({
  actions,
  children,
  autoExecuteThreshold = 0.7,
  disabled = false,
  className = ''
}: SwipeActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Calculate action button width
  const actionWidth = 80;
  const maxSwipe = actions.length * actionWidth;
  const autoExecutePoint = maxSwipe * autoExecuteThreshold;

  // Swipe animation
  const [{ x }, api] = useSpring(() => ({
    x: 0,
    config: { tension: 300, friction: 30, mass: 0.8 }
  }));

  const executeAction = (action: SwipeAction) => {
    triggerHaptic('heavy');
    action.onAction();
    
    // Spring back after action
    api.start({ x: 0 });
  };

  // Gesture binding for swipe
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last, cancel }) => {
      if (disabled) {
        cancel();
        return;
      }

      // Only allow left swipe (reveal actions on right)
      if (mx > 0) {
        cancel();
        return;
      }

      // Clamp swipe to max action width
      const clampedX = Math.max(mx, -maxSwipe);

      if (last) {
        // On release, check if threshold met
        const swipeAmount = Math.abs(clampedX);
        
        if (swipeAmount >= autoExecutePoint || Math.abs(vx) > 0.8) {
          // Auto-execute first action (usually delete)
          triggerHaptic('warning');
          executeAction(actions[0]);
        } else if (swipeAmount > actionWidth * 0.3) {
          // Show actions if partially swiped
          api.start({ x: -maxSwipe });
        } else {
          // Spring back if not enough swipe
          api.start({ x: 0 });
        }
      } else {
        // Update position during drag
        api.start({ x: clampedX, immediate: true });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true }
    }
  );

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Action Buttons (behind content) */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{ width: maxSwipe }}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => executeAction(action)}
            className={cn(
              'h-full flex flex-col items-center justify-center gap-1',
              'text-white font-pixel text-xs transition-all',
              'active:scale-95'
            )}
            style={{
              width: actionWidth,
              backgroundColor: action.color
            }}
          >
            {action.icon && (
              <PixelIcon name={action.icon} size={24} decorative />
            )}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable Content */}
      <animated.div
        {...bind()}
        style={{ x }}
        className="relative bg-black z-10 touch-manipulation"
      >
        {children}
      </animated.div>
    </div>
  );
}
