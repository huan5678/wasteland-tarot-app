/**
 * useRateLimiting Hook
 *
 * Implements rate limiting protection for user actions to prevent abuse
 * and improve system stability.
 *
 * Features:
 * - Sliding window algorithm to track action timestamps
 * - Configurable rate limit and time window
 * - Cooldown mechanism after exceeding limit
 * - User-friendly zh-TW error messages
 * - Visual feedback for disabled state
 * - Per-action-type or global rate limiting
 *
 * Requirements: 9.6
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseRateLimitingOptions {
  maxActions: number;      // Maximum actions allowed in window
  windowMs: number;        // Time window in milliseconds
  cooldownMs?: number;     // Cooldown period after exceeding limit (default: 2000ms)
  perActionType?: boolean; // Track separately per action type (default: false)
}

export interface UseRateLimitingReturn {
  // State
  isRateLimited: boolean;
  isInCooldown: boolean;
  canPerformAction: boolean;
  shouldDisableAction: boolean;
  actionCount: number;
  remainingActions: number;
  cooldownRemaining: number;
  message: string;

  // Methods
  trackAction: (actionType?: string) => void;
  reset: () => void;
  getCooldownMessage: () => string;
}

interface ActionTimestamp {
  timestamp: number;
  type?: string;
}

export function useRateLimiting(options: UseRateLimitingOptions): UseRateLimitingReturn {
  const {
    maxActions,
    windowMs,
    cooldownMs = 2000,
    perActionType = false,
  } = options;

  // Validate and normalize options
  const normalizedMaxActions = Math.max(0, maxActions);
  const normalizedWindowMs = Math.max(0, windowMs || 1000);
  const normalizedCooldownMs = Math.max(0, cooldownMs);

  // State
  const [actions, setActions] = useState<ActionTimestamp[]>([]);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Refs
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownStartTimeRef = useRef<number | null>(null);

  /**
   * Clear expired actions from sliding window
   */
  const clearExpiredActions = useCallback((currentTime: number, actionsList: ActionTimestamp[]) => {
    const cutoffTime = currentTime - normalizedWindowMs;
    return actionsList.filter(action => action.timestamp > cutoffTime);
  }, [normalizedWindowMs]);

  /**
   * Track a new action
   */
  const trackAction = useCallback((actionType?: string) => {
    const now = Date.now();

    setActions(prevActions => {
      // Clear expired actions
      const validActions = clearExpiredActions(now, prevActions);

      // Add new action
      const newActions = [...validActions, { timestamp: now, type: actionType }];

      // Check if rate limit exceeded
      let relevantActions = newActions;
      if (perActionType && actionType) {
        relevantActions = newActions.filter(a => a.type === actionType);
      }

      if (relevantActions.length > normalizedMaxActions) {
        // Start cooldown
        if (!isInCooldown) {
          setIsInCooldown(true);
          cooldownStartTimeRef.current = now;
          setCooldownRemaining(normalizedCooldownMs);

          // Cooldown timer
          cooldownTimerRef.current = setTimeout(() => {
            setIsInCooldown(false);
            setCooldownRemaining(0);
            cooldownStartTimeRef.current = null;

            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
            }
          }, normalizedCooldownMs);

          // Update cooldownRemaining every 100ms
          cooldownIntervalRef.current = setInterval(() => {
            if (cooldownStartTimeRef.current) {
              const elapsed = Date.now() - cooldownStartTimeRef.current;
              const remaining = Math.max(0, normalizedCooldownMs - elapsed);
              setCooldownRemaining(remaining);

              if (remaining === 0 && cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
              }
            }
          }, 100);
        }
      }

      return newActions;
    });
  }, [normalizedMaxActions, normalizedCooldownMs, perActionType, clearExpiredActions, isInCooldown]);

  /**
   * Reset rate limit state
   */
  const reset = useCallback(() => {
    setActions([]);
    setIsInCooldown(false);
    setCooldownRemaining(0);
    cooldownStartTimeRef.current = null;

    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  }, []);

  /**
   * Get formatted cooldown message
   */
  const getCooldownMessage = useCallback((): string => {
    if (!isInCooldown) return '';
    const secondsRemaining = Math.ceil(cooldownRemaining / 1000);
    return `請稍候 ${secondsRemaining} 秒後再試`;
  }, [isInCooldown, cooldownRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Periodically clear expired actions
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      setActions(prevActions => clearExpiredActions(now, prevActions));
    }, Math.min(normalizedWindowMs / 2, 5000)); // Check every half window or 5s, whichever is smaller

    return () => clearInterval(intervalId);
  }, [normalizedWindowMs, clearExpiredActions]);

  // Compute derived state
  const actionCount = actions.length;
  const remainingActions = Math.max(0, normalizedMaxActions - actionCount);
  const isRateLimited = actionCount > normalizedMaxActions || isInCooldown;
  const canPerformAction = !isRateLimited;
  const shouldDisableAction = isRateLimited;
  const message = isRateLimited ? '請稍候再試一次' : '';

  return {
    // State
    isRateLimited,
    isInCooldown,
    canPerformAction,
    shouldDisableAction,
    actionCount,
    remainingActions,
    cooldownRemaining,
    message,

    // Methods
    trackAction,
    reset,
    getCooldownMessage,
  };
}
