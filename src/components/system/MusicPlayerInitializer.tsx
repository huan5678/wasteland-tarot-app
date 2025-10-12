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
 * 修正: 新增 useMusicEngine Hook 以整合 ProceduralMusicEngine
 * 當 musicPlayerStore 的 currentMode 或 isPlaying 改變時，自動控制音訊播放
 */

'use client';

import { useMusicPlayerInitializer } from '@/hooks/useMusicPlayerInitializer';
import { useMusicEngine } from '@/hooks/audio/useMusicEngine';

/**
 * MusicPlayerInitializer
 *
 * 在應用啟動時自動初始化音樂播放器並恢復狀態
 * 同時整合 ProceduralMusicEngine 以實際播放音樂
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

  // Initialize and control ProceduralMusicEngine (實際音訊播放)
  useMusicEngine();

  // This component renders nothing
  return null;
}

MusicPlayerInitializer.displayName = 'MusicPlayerInitializer';
