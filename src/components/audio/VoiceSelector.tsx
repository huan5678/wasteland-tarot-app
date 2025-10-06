'use client';

/**
 * VoiceSelector - 角色語音選擇器
 * 需求 2.3: 角色語音選擇
 */

import React from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import type { CharacterVoice } from '@/lib/audio/types';

const VOICE_OPTIONS: { value: CharacterVoice; label: string; description: string }[] = [
  { value: 'pip_boy', label: 'Pip-Boy', description: '標準 Pip-Boy 介面語音' },
  { value: 'mr_handy', label: 'Mr. Handy', description: '機械管家語音（高音調）' },
  { value: 'brotherhood_scribe', label: 'Brotherhood Scribe', description: '鋼鐵兄弟會書記官語音' },
  { value: 'vault_overseer', label: 'Vault Overseer', description: 'Vault 監督語音' },
  { value: 'wasteland_wanderer', label: 'Wasteland Wanderer', description: '廢土流浪者語音' },
];

export function VoiceSelector() {
  const { selectedVoice, setSelectedVoice } = useAudioStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value as CharacterVoice);
  };

  return (
    <div className="voice-selector">
      <label htmlFor="voice-select" className="voice-selector__label">
        角色語音
      </label>
      <select
        id="voice-select"
        value={selectedVoice}
        onChange={handleChange}
        className="voice-selector__select"
        aria-label="選擇角色語音"
      >
        {VOICE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="voice-selector__description">
        {VOICE_OPTIONS.find((v) => v.value === selectedVoice)?.description}
      </p>
    </div>
  );
}
