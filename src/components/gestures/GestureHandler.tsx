'use client';

import React, { ReactNode } from 'react';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';

interface GestureHandlerProps {
  children: ReactNode | ((state: GestureState) => ReactNode);
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoom?: (scale: number) => void;
  onPullRefresh?: () => void;
  enablePinchZoom?: boolean;
  enablePullRefresh?: boolean;
  enableMomentum?: boolean;
  swipeThreshold?: number;
}

interface GestureState {
  isGesturing: boolean;
  gestureType?: 'swipe' | 'pinch' | 'pull' | null;
}

export function GestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchZoom,
  onPullRefresh,
  enablePinchZoom = false,
  enablePullRefresh = false,
  enableMomentum = false,
  swipeThreshold = 50,
}: GestureHandlerProps) {
  const touchHandler = useTouchInteraction({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    swipeThreshold,
  });

  const gestureState: GestureState = {
    isGesturing: touchHandler.isTouching,
    gestureType: touchHandler.isTouching ? 'swipe' : null,
  };

  const content = typeof children === 'function' ? children(gestureState) : children;

  return (
    <div
      ref={touchHandler.ref}
      className="gesture-handler w-full h-full"
      style={{
        touchAction: enablePinchZoom ? 'pinch-zoom' : 'pan-y',
        WebkitOverflowScrolling: enableMomentum ? 'touch' : 'auto',
      }}
    >
      {content}
    </div>
  );
}
