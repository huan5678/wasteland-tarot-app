/**
 * Web Audio System Type Definitions
 * 音訊系統類型定義
 */

/**
 * 音訊類型
 */
export type AudioType = 'sfx' | 'music' | 'voice';

/**
 * 音訊效果類型
 */
export type AudioEffect = 'reverb' | '8bit' | 'radio' | 'distortion';

/**
 * 角色語音類型
 * 支援全部 14 個 Fallout 角色
 */
export type CharacterVoice =
  // 通用角色
  | 'pip_boy'
  | 'vault_dweller'
  | 'wasteland_trader'
  | 'codsworth'
  // 廢土生物與掠奪者
  | 'super_mutant'
  | 'ghoul'
  | 'raider'
  // 鋼鐵兄弟會
  | 'brotherhood_scribe'
  | 'brotherhood_paladin'
  // NCR
  | 'ncr_ranger'
  // 凱薩軍團
  | 'legion_centurion'
  // Fallout 4 陣營角色
  | 'minuteman'
  | 'railroad_agent'
  | 'institute_scientist';

/**
 * 音效優先級
 */
export type SoundPriority = 'critical' | 'normal' | 'low';

/**
 * 音效配置
 * 需求 5.1: 音效預載系統
 */
export interface SoundConfig {
  id: string;
  url: string;
  type: AudioType;
  priority: SoundPriority;
  size?: number; // bytes
}

/**
 * 音效播放選項
 * 需求 1.1-1.7: 音效播放系統
 */
export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  fadeDuration?: number;
  effectsChain?: AudioEffect[];
  onComplete?: () => void;
}

/**
 * 語音合成選項
 * 需求 2.1-2.7: TTS 系統
 */
export interface SpeechOptions {
  voice?: CharacterVoice;
  volume?: number;
  onProgress?: (charIndex: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 角色語音配置
 * 需求 2.3: 角色語音參數調整
 */
export interface VoiceConfig {
  character: CharacterVoice;
  pitch: number; // 0.0 - 2.0
  rate: number; // 0.1 - 10.0
  volume: number; // 0.0 - 1.0
  voiceName?: string;
  effects?: AudioEffect[];
}

/**
 * 音效檔案
 */
export interface SoundEffect {
  id: string;
  url: string;
  type: AudioType;
  priority: SoundPriority;
  size: number;
  buffer?: AudioBuffer;
  lastUsed?: number; // timestamp for LRU
}

/**
 * 音樂軌道
 * 需求 3.1-3.6: 背景音樂系統
 */
export interface MusicTrack {
  id: string;
  url: string;
  scene: string;
  size: number;
  duration?: number;
  buffer?: AudioBuffer;
}

/**
 * 音訊清單配置
 * 需求 5.1: 音效清單載入
 */
export interface AudioManifest {
  version: string;
  sounds: SoundEffect[];
  music: MusicTrack[];
  lastUpdated: string;
}

/**
 * 音訊設定 (儲存至 localStorage)
 * 需求 4.6: 音量持久化
 */
export interface AudioSettings {
  volumes: {
    sfx: number;
    music: number;
    voice: number;
  };
  muted: {
    sfx: boolean;
    music: boolean;
    voice: boolean;
  };
  selectedVoice: CharacterVoice;
  isAudioEnabled: boolean;
  prefersReducedMotion: boolean; // 需求 10.1
}

/**
 * 快取的音訊緩衝區
 * 需求 5.2-5.3: 快取管理
 */
export interface CachedBuffer {
  buffer: AudioBuffer;
  priority: SoundPriority;
  lastUsed: number;
  size: number;
}

/**
 * 音訊狀態 (Zustand Store)
 */
export interface AudioState {
  // 音量狀態
  volumes: {
    sfx: number;
    music: number;
    voice: number;
  };
  muted: {
    sfx: boolean;
    music: boolean;
    voice: boolean;
  };

  // 播放狀態
  isPlaying: {
    music: boolean;
    voice: boolean;
  };
  currentTrack: string | null;
  speechProgress: number;

  // 音樂播放器專用狀態 (Task 1)
  // Requirements 1.1, 1.2, 2.1, 6.1
  currentMusicMode: string | null; // 當前播放的音樂模式 (synthwave, divination, lofi, ambient)
  musicPlayerInitialized: boolean; // 音樂播放器初始化狀態

  // 設定
  isAudioEnabled: boolean;
  isSilentMode: boolean;
  selectedVoice: CharacterVoice;
  prefersReducedMotion: boolean;

  // 效能監控
  memoryUsage: number;
  activeSoundsCount: number;

  // Actions
  setVolume: (type: AudioType, volume: number) => void;
  setMute: (type: AudioType, muted: boolean) => void;
  toggleMute: (type: AudioType) => void;
  setCurrentTrack: (trackId: string | null) => void;
  setSpeechProgress: (progress: number) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setSilentMode: (silent: boolean) => void;
  setSelectedVoice: (voice: CharacterVoice) => void;
  setPrefersReducedMotion: (prefers: boolean) => void;
  updateMetrics: (usage: number, count: number) => void;

  // 音樂播放器 Actions (Task 1)
  setCurrentMusicMode: (mode: string | null) => void;
  setMusicPlayerInitialized: (initialized: boolean) => void;
  setIsPlaying: (type: 'music' | 'voice', playing: boolean) => void;
}
