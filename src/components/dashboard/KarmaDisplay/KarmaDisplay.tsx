/**
 * KarmaDisplay Component
 * Displays user's Karma summary with Pip-Boy terminal styling
 *
 * Features:
 * - Total Karma with glowing effect
 * - Current level and title
 * - Global rank (if available)
 * - Today's earned Karma
 */

'use client';

import React from 'react';
import { useKarmaStore } from '@/stores/karmaStore';

export function KarmaDisplay() {
  const { summary, isLoading, error } = useKarmaStore();

  // Loading state
  if (isLoading && !summary) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-6 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-pip-boy-green/20 rounded w-1/2"></div>
          <div className="h-24 bg-pip-boy-green/20 rounded"></div>
          <div className="h-6 bg-pip-boy-green/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-red-500 p-6 rounded-lg">
        <div className="text-red-500 font-mono">
          <div className="text-lg font-bold mb-2">[ ERROR ]</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // No data state
  if (!summary) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green/50 p-6 rounded-lg">
        <div className="text-pip-boy-green/50 font-mono text-center">
          <div className="text-lg">[ NO DATA ]</div>
          <div className="text-sm mt-2">未載入 Karma 資料</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-pip-boy-green/30 pb-3 mb-4">
        <h2 className="text-pip-boy-green font-mono text-xl font-bold tracking-wide">
          [ KARMA STATUS ]
        </h2>
      </div>

      {/* Main Karma Display */}
      <div className="space-y-6">
        {/* Total Karma - Large glowing number */}
        <div className="text-center">
          <div className="text-xs text-pip-boy-green/70 font-mono uppercase mb-1">
            Total Karma
          </div>
          <div
            className="text-6xl font-bold font-mono text-pip-boy-green transition-all duration-300"
            style={{
              textShadow: '0 0 20px rgba(0, 255, 136, 0.7), 0 0 40px rgba(0, 255, 136, 0.4)',
            }}
          >
            {summary.total_karma.toLocaleString()}
          </div>
        </div>

        {/* Level and Title */}
        <div className="bg-pip-boy-green/10 border border-pip-boy-green/30 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-pip-boy-green/70 font-mono uppercase mb-1">
                Level
              </div>
              <div className="text-2xl font-bold text-pip-boy-green font-mono">
                {summary.current_level}
              </div>
            </div>
            <div>
              <div className="text-xs text-pip-boy-green/70 font-mono uppercase mb-1">
                Title
              </div>
              <div className="text-sm text-pip-boy-green font-mono leading-tight">
                {summary.level_title}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Rank (if available) */}
          {summary.rank !== null && (
            <div className="bg-black/50 border border-pip-boy-green/20 p-3 rounded">
              <div className="text-xs text-pip-boy-green/70 font-mono uppercase mb-1">
                Rank
              </div>
              <div className="text-xl font-bold text-pip-boy-green font-mono">
                #{summary.rank}
              </div>
            </div>
          )}

          {/* Today's Karma */}
          <div className="bg-black/50 border border-pip-boy-green/20 p-3 rounded">
            <div className="text-xs text-pip-boy-green/70 font-mono uppercase mb-1">
              Today
            </div>
            <div className="text-xl font-bold text-pip-boy-green font-mono">
              +{summary.today_earned}
            </div>
          </div>
        </div>

        {/* Scanline effect overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.1) 2px, rgba(0, 255, 136, 0.1) 4px)',
          }}
        />
      </div>
    </div>
  );
}
