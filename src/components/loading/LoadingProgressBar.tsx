/**
 * LoadingProgressBar Component
 *
 * Reusable progress bar for loading screens.
 * Features Pip-Boy styled progress indicator with percentage display.
 */

'use client';

import React from 'react';

export interface LoadingProgressBarProps {
  /** Progress value (0-100) */
  progress: number;
  /** Optional custom className for the container */
  className?: string;
}

/**
 * LoadingProgressBar
 *
 * Displays a Pip-Boy styled progress bar with percentage
 */
export function LoadingProgressBar({
  progress,
  className = '',
}: LoadingProgressBarProps) {
  return (
    <div
      className={`w-full max-w-md px-4 mt-6 ${className}`}
      suppressHydrationWarning
    >
      <div
        className="relative h-1.5 bg-pip-boy-green/20 rounded-full overflow-hidden"
        suppressHydrationWarning
      >
        {/* Progress Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-pip-boy-green rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          suppressHydrationWarning
        />
      </div>
      {/* Progress Percentage */}
      <p
        className="text-pip-boy-green/60 text-xs text-center mt-2"
        suppressHydrationWarning
      >
        {Math.round(progress)}%
      </p>
    </div>
  );
}
