'use client';

/**
 * AudioVisualizer - 語音播放視覺指示器
 * 需求 2.7, 10.3: 視覺指示器和無障礙
 */

import React from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';

interface AudioVisualizerProps {
  isPlaying?: boolean;
  type?: 'wave' | 'pulse';
}

export function AudioVisualizer({ isPlaying, type = 'pulse' }: AudioVisualizerProps) {
  const { speechProgress } = useAudioStore();
  const progress = Math.min(100, Math.max(0, speechProgress / 10)); // 簡化進度計算

  if (!isPlaying) {
    return null;
  }

  return (
    <div
      className="audio-visualizer"
      role="status"
      aria-live="polite"
      aria-label={`語音播放中，進度 ${Math.round(progress)}%`}
      data-testid="speech-visualizer"
    >
      {type === 'pulse' ? (
        <div className="audio-visualizer__pulse">
          <div className="audio-visualizer__pulse-dot" />
          <div className="audio-visualizer__pulse-ring" />
          <div className="audio-visualizer__pulse-ring audio-visualizer__pulse-ring--delayed" />
        </div>
      ) : (
        <div className="audio-visualizer__wave">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="audio-visualizer__wave-bar"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      )}
      <span className="sr-only">語音播放中</span>
    </div>
  );
}
