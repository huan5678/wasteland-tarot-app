/**
 * useTypewriter Hook
 * Pure client-side typewriter effect for displaying text character by character
 *
 * Designed for AI interpretation display with stable, predictable animation.
 * Uses interval-based timing for consistent character-per-second speed.
 *
 * Features:
 * - Configurable typing speed (characters per second)
 * - Pause/Resume functionality
 * - Skip to complete text
 * - Speed multiplier (1x, 2x, etc.)
 * - Optional typing sound effects
 * - Completion callback
 * - Auto-start support
 *
 * Usage:
 * ```tsx
 * const { displayedText, isTyping, skip, pause, resume } = useTypewriter({
 *   text: "Your full text here...",
 *   speed: 40,
 *   autoStart: true,
 *   onComplete: () => console.log('Done!')
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

export interface UseTypewriterOptions {
  /** The complete text to display with typewriter effect */
  text: string;

  /** Characters per second (default: 40) */
  speed?: number;

  /** Auto-start typing when text changes (default: true) */
  autoStart?: boolean;

  /** Enable typing sound effect (default: false) */
  enableSound?: boolean;

  /** Typing sound volume (0.0 - 1.0, default: 0.3) */
  soundVolume?: number;

  /** Sound throttle interval in ms (default: 50) */
  soundThrottle?: number;

  /** Callback when typing completes */
  onComplete?: (text: string) => void;

  /** Callback when typing starts */
  onStart?: () => void;
}

export interface UseTypewriterReturn {
  /** Currently displayed text */
  displayedText: string;

  /** Whether currently typing */
  isTyping: boolean;

  /** Whether typing is paused */
  isPaused: boolean;

  /** Whether typing has completed */
  isComplete: boolean;

  /** Current typing progress (0.0 - 1.0) */
  progress: number;

  /** Current speed multiplier */
  currentSpeed: number;

  /** Skip to full text immediately */
  skip: () => void;

  /** Pause typing */
  pause: () => void;

  /** Resume typing */
  resume: () => void;

  /** Toggle pause/resume */
  togglePause: () => void;

  /** Set speed multiplier (1 = normal, 2 = 2x speed) */
  setSpeed: (multiplier: number) => void;

  /** Restart typing from beginning */
  restart: () => void;
}

export function useTypewriter({
  text,
  speed = 40,
  autoStart = true,
  enableSound = false,
  soundVolume = 0.3,
  soundThrottle = 50,
  onComplete,
  onStart,
}: UseTypewriterOptions): UseTypewriterReturn {
  // State
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Refs for stable access in intervals
  const textRef = useRef(text);
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(speed);
  const speedMultiplierRef = useRef(speedMultiplier);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Typing sound effect
  const { play: playTypingSound } = useAudioEffect({
    soundId: 'typing-effect',
    enabled: enableSound,
    throttle: soundThrottle,
    volume: soundVolume,
  });

  // Computed values
  const isComplete = displayedText === text && text.length > 0;
  const progress = text.length > 0 ? displayedText.length / text.length : 0;

  /**
   * Clear typing interval
   */
  const clearTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Start typing effect
   */
  const startTyping = useCallback(() => {
    if (textRef.current.length === 0) return;

    // Call onStart callback (only once)
    if (!hasStartedRef.current && onStart) {
      onStart();
      hasStartedRef.current = true;
    }

    setIsTyping(true);
    setIsPaused(false);

    // Clear any existing interval
    clearTyping();

    // Calculate interval based on speed and multiplier
    const charsPerSecond = speedRef.current * speedMultiplierRef.current;
    const intervalMs = 1000 / charsPerSecond;

    intervalRef.current = setInterval(() => {
      const currentIndex = indexRef.current;
      const fullText = textRef.current;

      if (currentIndex >= fullText.length) {
        // Typing complete
        clearTyping();
        setIsTyping(false);

        // Call onComplete callback (only once)
        if (!hasCompletedRef.current && onComplete) {
          hasCompletedRef.current = true;
          onComplete(fullText);
        }
        return;
      }

      // Type next character
      indexRef.current = currentIndex + 1;
      const nextText = fullText.slice(0, currentIndex + 1);
      setDisplayedText(nextText);

      // Play typing sound
      if (enableSound) {
        playTypingSound();
      }
    }, intervalMs);
  }, [clearTyping, enableSound, playTypingSound, onComplete, onStart]);

  /**
   * Skip to full text immediately
   */
  const skip = useCallback(() => {
    clearTyping();
    setIsTyping(false);
    setIsPaused(false);
    indexRef.current = textRef.current.length;
    setDisplayedText(textRef.current);

    // Call onComplete callback
    if (!hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      onComplete(textRef.current);
    }
  }, [clearTyping, onComplete]);

  /**
   * Pause typing
   */
  const pause = useCallback(() => {
    if (isTyping && !isPaused) {
      clearTyping();
      setIsPaused(true);
    }
  }, [isTyping, isPaused, clearTyping]);

  /**
   * Resume typing
   */
  const resume = useCallback(() => {
    if (isPaused) {
      startTyping();
    }
  }, [isPaused, startTyping]);

  /**
   * Toggle pause/resume
   */
  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else if (isTyping) {
      pause();
    }
  }, [isPaused, isTyping, pause, resume]);

  /**
   * Set speed multiplier
   */
  const setSpeed = useCallback((multiplier: number) => {
    setSpeedMultiplier(multiplier);

    // Restart typing with new speed if currently typing
    if (isTyping && !isPaused) {
      clearTyping();
      // Use requestAnimationFrame to avoid state update conflicts
      requestAnimationFrame(() => {
        startTyping();
      });
    }
  }, [isTyping, isPaused, clearTyping, startTyping]);

  /**
   * Restart typing from beginning
   */
  const restart = useCallback(() => {
    clearTyping();
    indexRef.current = 0;
    hasStartedRef.current = false;
    hasCompletedRef.current = false;
    setDisplayedText('');
    setIsTyping(false);
    setIsPaused(false);

    if (autoStart) {
      // Use setTimeout to avoid immediate re-trigger
      setTimeout(() => startTyping(), 0);
    }
  }, [clearTyping, autoStart, startTyping]);

  /**
   * Auto-start typing when text changes
   * 🔧 FIX: Only reset if text content actually changed (not just reference)
   */
  useEffect(() => {
    if (text && text.length > 0 && autoStart) {
      // 🔧 FIX: Check if text content is different from what we've already typed
      // This prevents unnecessary resets when parent re-renders with same text
      const currentlyDisplayed = displayedText;
      const isNewText = text !== textRef.current || (currentlyDisplayed.length === 0 && !hasStartedRef.current);

      if (isNewText) {
        // Reset state when text actually changes
        indexRef.current = 0;
        hasStartedRef.current = false;
        hasCompletedRef.current = false;
        setDisplayedText('');

        // Start typing after a short delay
        const timer = setTimeout(() => {
          startTyping();
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [text, autoStart, startTyping, displayedText]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTyping();
    };
  }, [clearTyping]);

  return {
    displayedText,
    isTyping,
    isPaused,
    isComplete,
    progress,
    currentSpeed: speedMultiplier,
    skip,
    pause,
    resume,
    togglePause,
    setSpeed,
    restart,
  };
}
