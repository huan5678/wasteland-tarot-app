/**
 * KarmaProgressBar Component
 * Displays progress towards next level with Pip-Boy styled progress bar
 *
 * Features:
 * - Green gradient progress bar with glow effect
 * - Percentage display
 * - "X Karma to next level" text
 * - Smooth animations
 */

'use client';

import React from 'react';
import { useKarmaStore } from '@/stores/karmaStore';

export function KarmaProgressBar() {
  const { summary, isLoading } = useKarmaStore();

  // Loading state
  if (isLoading && !summary) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-4 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-pip-boy-green/20 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-pip-boy-green/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  // Calculate progress percentage
  // Formula: (total_karma % 500) / 500 * 100
  const karmaInCurrentLevel = summary.total_karma % 500;
  const progressPercentage = (karmaInCurrentLevel / 500) * 100;

  return (
    <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-4 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-pip-boy-green font-mono text-sm uppercase">
          Level {summary.current_level} Progress
        </div>
        <div className="text-pip-boy-green font-mono text-sm">
          {progressPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-8 bg-black/50 border border-pip-boy-green/30 rounded overflow-hidden">
        {/* Progress Bar Fill */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-pip-boy-green/60 to-pip-boy-green transition-all duration-500 ease-out"
          style={{
            width: `${progressPercentage}%`,
            boxShadow: '0 0 15px rgba(0, 255, 136, 0.5), inset 0 0 10px rgba(0, 255, 136, 0.3)',
          }}
        >
          {/* Animated shine effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4) 50%, transparent)',
              animation: 'shine 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Progress Bar Border Glow */}
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 8px rgba(0, 255, 136, 0.2)',
          }}
        />

        {/* Scanline effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 255, 136, 0.1) 1px, rgba(0, 255, 136, 0.1) 2px)',
          }}
        />
      </div>

      {/* Karma needed text */}
      <div className="mt-3 text-center text-pip-boy-green/80 font-mono text-sm">
        {summary.karma_to_next_level > 0 ? (
          <span>
            還需 <span className="font-bold text-pip-boy-green">{summary.karma_to_next_level}</span>{' '}
            Karma 升級到 Level {summary.current_level + 1}
          </span>
        ) : (
          <span className="font-bold text-pip-boy-green">準備升級！</span>
        )}
      </div>

      {/* CSS for shine animation */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
