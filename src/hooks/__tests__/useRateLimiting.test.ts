/**
 * Tests for useRateLimiting hook - Rate limiting protection for user actions
 *
 * Requirements:
 * - Detect >10 clicks in 1 second (sliding window)
 * - Disable actions when rate limit exceeded
 * - Show zh-TW message: "請稍候再試一次"
 * - Implement cooldown period (2-3 seconds)
 * - Visual feedback (button disabled state)
 *
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRateLimiting } from '../useRateLimiting';

describe('useRateLimiting', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Rate Limit Detection', () => {
    it('should allow actions under rate limit', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 9 actions (under limit)
      for (let i = 0; i < 9; i++) {
        act(() => {
          result.current.trackAction('shuffle');
        });
      }

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.canPerformAction).toBe(true);
      expect(result.current.remainingActions).toBe(1);
    });

    it('should detect >10 clicks in 1 second', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 11 actions (exceed limit)
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.canPerformAction).toBe(false);
      expect(result.current.remainingActions).toBe(0);
    });

    it('should use sliding window to track actions', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 5 actions at t=0
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.trackAction('shuffle');
        }
      });

      // Advance time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Perform 5 more actions at t=500ms (total 10 in window)
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(false);

      // Perform 1 more action (exceed limit)
      act(() => {
        result.current.trackAction('shuffle');
      });

      expect(result.current.isRateLimited).toBe(true);
    });

    it('should clear old actions outside window', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 10 actions at t=0
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.remainingActions).toBe(0);

      // Advance time by 1100ms (actions expire)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Should allow actions again
      act(() => {
        result.current.trackAction('shuffle');
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.remainingActions).toBe(9);
    });
  });

  describe('Cooldown Mechanism', () => {
    it('should enforce cooldown period after rate limit', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 2000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.isInCooldown).toBe(true);
      expect(result.current.cooldownRemaining).toBeGreaterThan(0);

      // Advance time by 1900ms (still in cooldown)
      act(() => {
        jest.advanceTimersByTime(1900);
      });

      expect(result.current.isInCooldown).toBe(true);

      // Advance time by 200ms (cooldown ends)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isInCooldown).toBe(false);
      expect(result.current.cooldownRemaining).toBe(0);
    });

    it('should update cooldownRemaining every 100ms', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 2000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      const initialRemaining = result.current.cooldownRemaining;
      expect(initialRemaining).toBeGreaterThan(1800);

      // Advance time by 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const newRemaining = result.current.cooldownRemaining;
      expect(newRemaining).toBeLessThan(initialRemaining);
      expect(newRemaining).toBeGreaterThan(1700);
    });
  });

  describe('User-Friendly Messages', () => {
    it('should provide zh-TW message when rate limited', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.message).toBe('請稍候再試一次');
    });

    it('should clear message after cooldown', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 2000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.message).toBe('請稍候再試一次');

      // Advance time past cooldown
      act(() => {
        jest.advanceTimersByTime(2100);
      });

      expect(result.current.message).toBe('');
    });

    it('should provide cooldown message with remaining time', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 3000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      const message = result.current.getCooldownMessage();
      expect(message).toMatch(/請稍候 \d+ 秒後再試/);
    });
  });

  describe('Visual Feedback', () => {
    it('should provide disabled state flag', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      expect(result.current.shouldDisableAction).toBe(false);

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.shouldDisableAction).toBe(true);
    });

    it('should provide action count information', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 7 actions
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.actionCount).toBe(7);
      expect(result.current.remainingActions).toBe(3);
    });
  });

  describe('Action Types', () => {
    it('should track different action types separately', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, perActionType: true }));

      // Perform 10 shuffle actions
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackAction('shuffle');
        }
      });

      // Should still allow flip actions
      act(() => {
        result.current.trackAction('flip');
      });

      expect(result.current.canPerformAction).toBe(true);
      expect(result.current.isRateLimited).toBe(false);
    });

    it('should track all actions together by default', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Perform 5 shuffle actions
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.trackAction('shuffle');
        }
      });

      // Perform 6 flip actions (total 11)
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.trackAction('flip');
        }
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.actionCount).toBe(11);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset rate limit state manually', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isRateLimited).toBe(false);
      expect(result.current.actionCount).toBe(0);
      expect(result.current.remainingActions).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero maxActions gracefully', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 0, windowMs: 1000 }));

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.canPerformAction).toBe(false);
    });

    it('should handle negative windowMs gracefully', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: -1000 }));

      // Should fallback to default 1000ms
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(false);
    });

    it('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 2000 }));

      // Exceed rate limit to start cooldown timer
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isInCooldown).toBe(true);

      // Unmount should clear timers without errors
      unmount();

      // Advance timers to ensure no memory leaks
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });
  });

  describe('Configuration Options', () => {
    it('should support custom maxActions', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 5, windowMs: 1000 }));

      // Perform 6 actions (exceed custom limit)
      act(() => {
        for (let i = 0; i < 6; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.remainingActions).toBe(0);
    });

    it('should support custom windowMs', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 2000 }));

      // Perform 10 actions at t=0
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackAction('shuffle');
        }
      });

      // Advance time by 1500ms (still within 2000ms window)
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Should still be at limit
      act(() => {
        result.current.trackAction('shuffle');
      });

      expect(result.current.isRateLimited).toBe(true);

      // Advance time by 600ms (total 2100ms, actions expire)
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should allow actions again
      act(() => {
        result.current.trackAction('shuffle');
      });

      expect(result.current.isRateLimited).toBe(false);
    });

    it('should support custom cooldownMs', () => {
      const { result } = renderHook(() => useRateLimiting({ maxActions: 10, windowMs: 1000, cooldownMs: 5000 }));

      // Exceed rate limit
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.trackAction('shuffle');
        }
      });

      expect(result.current.isInCooldown).toBe(true);

      // Advance time by 4900ms (still in cooldown)
      act(() => {
        jest.advanceTimersByTime(4900);
      });

      expect(result.current.isInCooldown).toBe(true);

      // Advance time by 200ms (cooldown ends)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isInCooldown).toBe(false);
    });
  });
});
