/**
 * 系統預設節奏 Pattern
 * 暫時方案：前端內建資料，避免依賴後端 API
 *
 * 這些 Pattern 與資料庫中的系統預設保持一致
 */

import { Pattern } from '@/lib/stores/rhythmPlaylistStore';

export interface SystemPreset {
  id: string;
  userId: null;
  name: string;
  description: string;
  pattern: Pattern;
  isSystemPreset: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 5 個系統預設 Pattern（與資料庫一致）
 */
export const SYSTEM_PRESETS: SystemPreset[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    userId: null,
    name: 'Techno',
    description: '經典 Techno 四四拍節奏，強勁的 Kick 和規律的 Hi-Hat',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
      clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    isSystemPreset: true,
    isPublic: true,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    userId: null,
    name: 'House',
    description: 'House 音樂節奏，持續的四四拍 Kick 和活潑的 Hi-Hat',
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    isSystemPreset: true,
    isPublic: true,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    userId: null,
    name: 'Trap',
    description: 'Trap 風格節奏，重低音 Kick 和快速的 Hi-Hat roll',
    pattern: {
      kick: [true, false, false, false, false, false, true, false, false, true, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, true, false, false, true, true, false, false, true, true, false, false, true, true],
      openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    isSystemPreset: true,
    isPublic: true,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    userId: null,
    name: 'Breakbeat',
    description: 'Breakbeat 碎拍節奏，不規則的 Kick 和 Snare 組合',
    pattern: {
      kick: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false],
      snare: [false, false, true, false, false, false, false, false, true, false, true, false, false, false, true, false],
      hihat: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
      clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    isSystemPreset: true,
    isPublic: true,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    userId: null,
    name: 'Minimal',
    description: 'Minimal 極簡節奏，稀疏的鼓點和空間感',
    pattern: {
      kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    isSystemPreset: true,
    isPublic: true,
    createdAt: '2025-01-13T00:00:00Z',
    updatedAt: '2025-01-13T00:00:00Z',
  },
];

/**
 * 根據 ID 查找系統預設
 */
export function getSystemPresetById(id: string): SystemPreset | undefined {
  return SYSTEM_PRESETS.find(preset => preset.id === id);
}

/**
 * 根據名稱查找系統預設
 */
export function getSystemPresetByName(name: string): SystemPreset | undefined {
  return SYSTEM_PRESETS.find(preset => preset.name === name);
}
