import { useRef, useEffect, useState, useCallback } from 'react';

interface TouchInteractionOptions {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  longPressDuration?: number;
  doubleTapDelay?: number;
  preventDefault?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
  moved: boolean;
}

export function useTouchInteraction(options: TouchInteractionOptions = {}) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    swipeThreshold = 50,
    longPressDuration = 500,
    doubleTapDelay = 300,
    preventDefault = false,
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    moved: false,
  });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (preventDefault && e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        lastTapTime: touchState.current.lastTapTime,
        moved: false,
      };

      setIsTouching(true);

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          if (!touchState.current.moved) {
            onLongPress();
          }
        }, longPressDuration);
      }
    },
    [onLongPress, longPressDuration, preventDefault]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (preventDefault && e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchState.current.startX);
      const deltaY = Math.abs(touch.clientY - touchState.current.startY);

      if (deltaX > 10 || deltaY > 10) {
        touchState.current.moved = true;

        // Cancel long press if moved
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    },
    [preventDefault]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (preventDefault && e.cancelable) {
        e.preventDefault();
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      setIsTouching(false);

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Check for swipe
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
        return;
      }

      // Check for tap/double tap (if not moved significantly)
      if (!touchState.current.moved && deltaTime < 300) {
        const timeSinceLastTap = Date.now() - touchState.current.lastTapTime;

        if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
          // Double tap detected
          onDoubleTap();
          touchState.current.lastTapTime = 0; // Reset to prevent triple tap
        } else {
          // Single tap
          touchState.current.lastTapTime = Date.now();
          if (onTap) {
            // Delay single tap to wait for potential double tap
            setTimeout(() => {
              const timeSinceThisTap = Date.now() - touchState.current.lastTapTime;
              if (timeSinceThisTap >= doubleTapDelay - 50) {
                onTap();
              }
            }, doubleTapDelay);
          }
        }
      }
    },
    [
      onTap,
      onDoubleTap,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      swipeThreshold,
      doubleTapDelay,
      preventDefault,
    ]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return {
    ref,
    isTouching,
  };
}
