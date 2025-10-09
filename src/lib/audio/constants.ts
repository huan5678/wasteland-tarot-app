/**
 * Web Audio System Constants
 * 音訊系統常數定義
 */

import type { CharacterVoice, VoiceConfig } from './types';

/**
 * 最大並發音效數
 * 需求 9.2: 限制最大並發播放數為 8 個
 */
export const MAX_CONCURRENT_SOUNDS = 8;

/**
 * 最大記憶體使用量 (MB)
 * 需求 9.1, 5.3: 記憶體使用不超過 50MB
 */
export const MAX_MEMORY_MB = 50;

/**
 * 行動裝置最大並發音效數
 * 需求 6.5: 行動裝置降低並發數
 */
export const MAX_CONCURRENT_SOUNDS_MOBILE = 4;

/**
 * 預設音量
 * 需求 4.1: 預設音量設定
 */
export const DEFAULT_VOLUMES = {
  sfx: 0.7,
  music: 0.5,
  voice: 0.8,
} as const;

/**
 * localStorage 儲存鍵
 * 需求 4.6: 音量持久化
 */
export const STORAGE_KEY = 'wasteland-tarot-audio';

/**
 * 音訊清單 URL
 * 需求 5.1: 載入音訊清單
 */
export const AUDIO_MANIFEST_URL = '/sounds/manifest.json';

/**
 * Crossfade 淡入淡出時間 (ms)
 * 需求 3.5: 背景音樂切換在 2 秒內完成
 */
export const CROSSFADE_DURATION = 2000;

/**
 * 音效載入重試次數
 * 需求 8.5: 重試最多 3 次
 */
export const MAX_LOAD_RETRIES = 3;

/**
 * 錯誤率閾值
 * 需求 8.6: 錯誤率超過 30% 停用音效
 */
export const ERROR_RATE_THRESHOLD = 0.3;

/**
 * 播放延遲目標 (ms)
 * 效能需求: 播放延遲 <100ms
 */
export const PLAYBACK_LATENCY_TARGET = 100;

/**
 * 低電量音樂音量
 * 需求 6.6: 電池低於 20% 降低背景音樂音量至 30%
 */
export const LOW_BATTERY_MUSIC_VOLUME = 0.3;

/**
 * 低電量閾值
 */
export const LOW_BATTERY_THRESHOLD = 0.2;

/**
 * 並行載入數
 * 需求 5.1: 預載時並行載入控制
 */
export const CONCURRENT_LOAD_LIMIT = 3;

/**
 * 角色語音預設配置
 * 需求 2.3: 角色語音參數預設值
 */
export const DEFAULT_VOICE_CONFIGS: Record<CharacterVoice, Omit<VoiceConfig, 'character'>> = {
  pip_boy: {
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    effects: ['radio'],
  },
  mr_handy: {
    pitch: 1.5,
    rate: 1.2,
    volume: 1.0,
    effects: ['radio', 'distortion'],
  },
  brotherhood_scribe: {
    pitch: 0.9,
    rate: 0.95,
    volume: 1.0,
    effects: ['radio'],
  },
  vault_overseer: {
    pitch: 1.1,
    rate: 0.9,
    volume: 1.0,
    effects: [],
  },
  wasteland_wanderer: {
    pitch: 0.95,
    rate: 1.0,
    volume: 1.0,
    effects: ['reverb'],
  },
} as const;

/**
 * 場景音樂映射
 * 需求 3.1-3.2: 場景音樂配置
 */
export const SCENE_MUSIC_MAP: Record<string, string> = {
  '/': 'wasteland-ambient',
  '/readings/new': 'divination-theme',
  '/dashboard': 'vault-theme',
  '/profile': 'vault-theme',
  '/cards': 'wasteland-ambient',
} as const;

/**
 * FPS 降級閾值
 * 需求 9.3: FPS 低於 30 時降級
 */
export const FPS_DEGRADATION_THRESHOLD = 30;

/**
 * 記憶體監控間隔 (ms)
 * 需求 9.5: 定期檢查記憶體洩漏
 */
export const MEMORY_CHECK_INTERVAL = 10000; // 10 seconds

/**
 * 閒置時間閾值 (ms)
 * 需求 5.4: 頁面閒置超過 5 分鐘釋放快取
 */
export const IDLE_TIMEOUT = 300000; // 5 minutes

/**
 * 音訊檔案路徑
 */
export const AUDIO_PATHS = {
  SFX: '/sounds/sfx',
  MUSIC: '/sounds/music',
} as const;

/**
 * Web Audio 音效生成器配置
 * 需求 3.1, 3.9: 音效 ID 對應生成器函數與預設參數
 */
export interface SoundGeneratorConfig {
  id: string;
  type: 'sfx' | 'music' | 'voice';
  priority: 'critical' | 'normal' | 'low';
  generator: 'button-click' | 'card-flip' | 'pip-boy-beep' | 'terminal-type' | 'vault-door' | 'shuffle' | 'reveal';
  params: {
    frequency?: number;
    duration?: number;
    volume?: number;
    waveType?: OscillatorType;
    startFrequency?: number;
    endFrequency?: number;
  };
}

/**
 * 預設音效配置
 * 需求 3.1: 定義所有音效的生成器與參數
 */
export const SOUND_CONFIGS: Record<string, SoundGeneratorConfig> = {
  'button-click': {
    id: 'button-click',
    type: 'sfx',
    priority: 'critical',
    generator: 'button-click',
    params: {
      frequency: 800,
      duration: 0.1,
      volume: 0.7,
      waveType: 'sine',
    },
  },
  'card-flip': {
    id: 'card-flip',
    type: 'sfx',
    priority: 'normal',
    generator: 'card-flip',
    params: {
      duration: 0.25,
      volume: 0.6,
    },
  },
  'card-shuffle': {
    id: 'card-shuffle',
    type: 'sfx',
    priority: 'normal',
    generator: 'shuffle',
    params: {
      duration: 0.4,
      volume: 0.5,
    },
  },
  'card-reveal': {
    id: 'card-reveal',
    type: 'sfx',
    priority: 'normal',
    generator: 'reveal',
    params: {
      startFrequency: 200,
      endFrequency: 800,
      duration: 0.8,
      volume: 0.6,
    },
  },
  'pip-boy-beep': {
    id: 'pip-boy-beep',
    type: 'sfx',
    priority: 'critical',
    generator: 'pip-boy-beep',
    params: {
      frequency: 1000,
      duration: 0.15,
      volume: 0.8,
      waveType: 'square',
    },
  },
  'terminal-type': {
    id: 'terminal-type',
    type: 'sfx',
    priority: 'low',
    generator: 'terminal-type',
    params: {
      frequency: 1500,
      duration: 0.05,
      volume: 0.5,
      waveType: 'square',
    },
  },
  'vault-door': {
    id: 'vault-door',
    type: 'sfx',
    priority: 'normal',
    generator: 'vault-door',
    params: {
      startFrequency: 80,
      endFrequency: 40,
      duration: 2.0,
      volume: 0.7,
    },
  },
} as const;
