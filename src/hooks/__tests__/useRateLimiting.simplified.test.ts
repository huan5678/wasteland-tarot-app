/**
 * Simplified tests for useRateLimiting hook - Rate limiting protection for user actions
 *
 * Requirements:
 * - Detect >10 clicks in 1 second (sliding window)
 * - Disable actions when rate limit exceeded
 * - Show zh-TW message: "請稍候再試一次"
 * - Implement cooldown period (2-3 seconds)
 * - Visual feedback (button disabled state)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRateLimiting } from '../useRateLimiting';

describe('useRateLimiting (Simplified)', () => {
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

    it('should detect >10 clicks', () => {
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
  });
});
