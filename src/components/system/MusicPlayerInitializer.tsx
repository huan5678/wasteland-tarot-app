/**
 * MusicPlayerInitializer - Music Player Initialization Component
 * 音樂播放器初始化元件
 *
 * Task 24: 整合 MusicPlayerDrawer 到全域佈局
 * Requirements 6.1, 6.2: 應用啟動時恢復狀態
 *
 * This component wraps the useMusicPlayerInitializer hook
 * to provide initialization logic at the app level.
 *
 * 修正: 新增 useRhythmMusicEngine Hook 以整合 RhythmAudioSynthesizer
 * 從資料庫載入系統預設 Pattern 並播放節奏音樂
 */

'use client';

import { useMusicPlayerInitializer } from '@/hooks/useMusicPlayerInitializer';
// import { useMusicEngine } from '@/hooks/audio/useMusicEngine'; // 舊的 ProceduralMusicEngine
import { useRhythmMusicEngine } from '@/hooks/audio/useRhythmMusicEngine';

/**
 * MusicPlayerInitializer
 *
 * 在應用啟動時自動初始化音樂播放器並恢復狀態
 * 同時整合 RhythmAudioSynthesizer 以播放資料庫的節奏 Pattern
 *
 * Usage:
 * Place this component near the root of your app (in layout.tsx)
 *
 * @example
 * ```tsx
 * <MusicPlayerInitializer />
 * ```
 */
export function MusicPlayerInitializer() {
  // Initialize music player state on mount (恢復播放清單、狀態等)
  useMusicPlayerInitializer();

  // Initialize and control RhythmAudioSynthesizer (實際音訊播放 - 使用資料庫 Pattern)
  useRhythmMusicEngine();

  // 如果要保留舊的 ProceduralMusicEngine，可以加入開關：
  // const useRhythmMode = true; // 或從設定中讀取
  // if (useRhythmMode) {
  //   useRhythmMusicEngine();
  // } else {
  //   useMusicEngine();
  // }

  // This component renders nothing
  return null;
}

MusicPlayerInitializer.displayName = 'MusicPlayerInitializer';
