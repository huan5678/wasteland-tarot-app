'use client';

/**
 * AudioControls - 音量控制組件
 * 需求 4.1-4.5: 音量控制 UI
 */

import React from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import type { AudioType } from '@/lib/audio/types';import { Button } from "@/components/ui/button";

interface AudioControlsProps {
  type: AudioType;
  label: string;
}

export function AudioControls({ type, label }: AudioControlsProps) {
  const { volumes, muted, setVolume, setMute } = useAudioStore();

  const currentVolume = volumes[type];
  const isMuted = muted[type];

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(type, newVolume);
  };

  const toggleMute = () => {
    setMute(type, !isMuted);
  };

  return (
    <div className="audio-control">
      <label className="audio-control__label">
        {label}
      </label>
      <div className="audio-control__slider">
        <Button size="icon" variant="default"
        onClick={toggleMute}
        className="audio-control__mute-btn"
        aria-label={`${isMuted ? 'Unmute' : 'Mute'} ${label}`}>

          {isMuted ? '🔇' : '🔊'}
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleVolumeChange}
          disabled={isMuted}
          aria-label={`${label} volume`}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={currentVolume}
          className="audio-control__range" />

        <span className="audio-control__value">
          {Math.round(currentVolume * 100)}%
        </span>
      </div>
    </div>);

}