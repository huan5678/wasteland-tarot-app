/**
 * Audio System - Public API
 * 音訊系統公開接口
 */

// Manager (推薦使用)
export { AudioManager, audioManager } from './AudioManager';

// Core Engines
export { AudioEngine } from './AudioEngine';
export { SpeechEngine } from './SpeechEngine';
export { MusicManager } from './MusicManager';
export { VolumeController } from './VolumeController';
export { EffectsProcessor } from './EffectsProcessor';

// Error Handling
export { AudioErrorHandler, AudioInitializationError, SoundLoadError, PlaybackError } from './AudioErrorHandler';

// Manifest
export { fetchAudioManifest, getCriticalSounds, getNonCriticalSounds, getMusicByScene } from './manifest';

// Store
export { useAudioStore, useSfxVolume, useMusicVolume, useVoiceVolume } from './audioStore';

// Types
export type {
  AudioType,
  AudioEffect,
  CharacterVoice,
  SoundPriority,
  SoundConfig,
  PlayOptions,
  SpeechOptions,
  VoiceConfig,
  SoundEffect,
  MusicTrack,
  AudioManifest,
  AudioSettings,
  CachedBuffer,
  AudioState,
} from './types';

// Constants
export * from './constants';
