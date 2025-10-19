/**
 * AsciiLoading Component
 *
 * Unified ASCII loading screen with multiple animation types.
 * Supports both donut and Nuka-Cola bottle animations with progress bar.
 *
 * @example
 * ```tsx
 * // Donut animation with progress
 * <AsciiLoading
 *   type="donut"
 *   message="Loading..."
 *   progress={50}
 * />
 *
 * // Nuka-Cola bottle animation with progress
 * <AsciiLoading
 *   type="bottle"
 *   message="Initializing..."
 *   progress={75}
 * />
 * ```
 */

'use client';

import React from 'react';
import { AsciiDonutAnimation } from './AsciiDonutAnimation';
import { AsciiNukaColaAnimation } from './AsciiNukaColaAnimation';
import { LoadingProgressBar } from './LoadingProgressBar';

export type AsciiLoadingType = 'donut' | 'bottle';

export interface AsciiLoadingProps {
  /** Animation type to display */
  type?: AsciiLoadingType;
  /** Loading message text */
  message?: string;
  /** Progress value (0-100) */
  progress?: number;
  /** Force static fallback mode */
  forceFallback?: boolean;
  /** Use WebGL renderer (default: true) */
  useWebGL?: boolean;
}

/**
 * AsciiLoading - Unified loading component
 *
 * Combines ASCII animation with progress bar and message
 */
export function AsciiLoading({
  type = 'bottle',
  message = 'LOADING...',
  progress = 0,
  forceFallback = false,
  useWebGL = true,
}: AsciiLoadingProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
      role="status"
      aria-live="polite"
      suppressHydrationWarning
    >
      {/* ASCII Animation */}
      <div className="flex-shrink-0" suppressHydrationWarning>
        {type === 'donut' ? (
          <AsciiDonutAnimation
            forceFallback={forceFallback}
            useWebGL={useWebGL}
          />
        ) : (
          <AsciiNukaColaAnimation
            forceFallback={forceFallback}
            useWebGL={useWebGL}
          />
        )}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <LoadingProgressBar progress={progress} />
      )}

      {/* Loading Message */}
      <p
        className="text-pip-boy-green/80 text-sm mt-4"
        suppressHydrationWarning
      >
        {message}
      </p>
    </div>
  );
}
