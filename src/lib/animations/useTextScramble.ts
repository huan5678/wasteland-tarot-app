import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface UseTextScrambleOptions {
  /** The final text to display */
  text: string;
  /** Duration of the scramble effect in seconds (default: 1.5) */
  duration?: number;
  /** Speed of character changes in ms (default: 50) */
  speed?: number;
  /** Characters to use for scrambling (default: uppercase alphanumeric + symbols) */
  chars?: string;
  /** Delay before starting the animation in seconds (default: 0) */
  delay?: number;
  /** Whether to start the animation automatically (default: true) */
  autoStart?: boolean;
  /** Animation mode: 'typewriter' (char by char) or 'scramble' (decode effect) (default: 'typewriter') */
  mode?: 'typewriter' | 'scramble';
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * useTextScramble Hook
 * Creates a "decoding" text effect commonly seen in sci-fi/Fallout interfaces.
 */
export function useTextScramble({
  text,
  duration = 1.5,
  speed = 50,
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
  delay = 0,
  autoStart = true,
  mode = 'typewriter', // ✅ Default to typewriter mode
  onComplete,
}: UseTextScrambleOptions) {
  const [displayText, setDisplayText] = useState(autoStart ? '' : text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCursor, setShowCursor] = useState(false); // ✅ Track cursor visibility
  const prefersReducedMotion = useReducedMotion();

  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTextRef = useRef<string>(text); // Track previous text for reverse animation

  const start = () => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      setShowCursor(false); // No cursor in reduced motion mode
      onComplete?.();
      return;
    }

    setIsAnimating(true);
    setShowCursor(true); // ✅ Show cursor during animation
    startTimeRef.current = Date.now();

    // Clear any existing animation
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // ✅ Detect reverse animation (deleting text like backspace)
    const isReverse = text === '' && previousTextRef.current !== '';
    const sourceText = isReverse ? previousTextRef.current : text;

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) {
        setDisplayText(text);
        setIsAnimating(false);
        setShowCursor(false); // ✅ Hide cursor after animation (simulates moving to next line)
        onComplete?.();
        return;
      }

      if (isReverse) {
        // ✅ Reverse animation: Delete characters from right to left (backspace effect)
        const deleteLength = Math.floor(sourceText.length * (1 - progress));

        let result = '';
        for (let i = 0; i < deleteLength; i++) {
          if (i < deleteLength - Math.floor(deleteLength * progress * 0.3)) {
            // Keep original characters
            result += sourceText[i];
          } else {
            // Scramble characters before deletion
            const randomChar = chars[Math.floor(Math.random() * chars.length)];
            result += randomChar;
          }
        }

        setDisplayText(result);
      } else {
        // ✅ Forward animation
        if (mode === 'typewriter') {
          // 🎯 Typewriter mode: Characters appear one by one (no scramble)
          const revealLength = Math.floor(sourceText.length * progress);
          const result = sourceText.substring(0, revealLength);
          setDisplayText(result);
        } else {
          // 🌀 Scramble mode: Reveal characters from left to right with scramble effect
          const revealLength = Math.floor(sourceText.length * progress);

          let result = '';
          for (let i = 0; i < sourceText.length; i++) {
            if (i < revealLength) {
              // Revealed character
              result += sourceText[i];
            } else {
              // Scrambled character
              const randomChar = chars[Math.floor(Math.random() * chars.length)];
              result += randomChar;
            }
          }

          setDisplayText(result);
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        frameRef.current = requestAnimationFrame(animate);
      }, delay * 1000);
    } else {
      frameRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }

    // ✅ Update previousText ref after animation starts
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Update previousText when text changes
      previousTextRef.current = text;
    };
  }, [text, autoStart, delay, duration, prefersReducedMotion]);

  return { displayText, isAnimating, showCursor, replay: start };
}
