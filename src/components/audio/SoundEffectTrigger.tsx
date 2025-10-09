'use client';

/**
 * SoundEffectTrigger - 音效觸發包裝組件
 * 需求 1.1: 簡化音效觸發
 */

import React from 'react';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';
import type { PlayOptions } from '@/lib/audio/types';

interface SoundEffectTriggerProps {
  soundId: string;
  trigger?: 'click' | 'hover';
  options?: PlayOptions;
  children: React.ReactNode;
}

export function SoundEffectTrigger({
  soundId,
  trigger = 'click',
  options,
  children,
}: SoundEffectTriggerProps) {
  const { playSound } = useAudioEffect();

  const handleTrigger = () => {
    playSound(soundId, options);
  };

  const triggerProps = {
    [trigger === 'click' ? 'onClick' : 'onMouseEnter']: handleTrigger,
  };

  return <div {...triggerProps}>{children}</div>;
}
