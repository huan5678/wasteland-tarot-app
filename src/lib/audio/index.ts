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

// Generators
export * from './SoundGenerator';
export * from './MusicGenerator';

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

// ============================================
// Music Player System - Rhythm Audio Synthesizers
// ============================================

// RhythmAudioSynthesizer（播放器專用）
export {
  RhythmAudioSynthesizer,
  type Pattern,
  type RhythmAudioSynthesizerConfig,
  type RhythmAudioSynthesizerState,
  type OnPatternCompleteCallback,
} from './RhythmAudioSynthesizer';

// EditorAudioSynthesizer（編輯器專用）
export {
  EditorAudioSynthesizer,
  type EditorAudioSynthesizerConfig,
  type InstrumentType,
} from './EditorAudioSynthesizer';
