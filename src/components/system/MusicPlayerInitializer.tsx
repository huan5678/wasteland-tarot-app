/**
 * MusicPlayerInitializer - Music Player Initialization Component
 * 音樂播放器初始化元件
 *
 * Task 24: 整合 MusicPlayerDrawer 到全域佈局
 * Requirements 6.1, 6.2: 應用啟動時恢復狀態
 *
 * This component wraps the useMusicPlayerInitializer hook
 * to provide initialization logic at the app level.
 */

'use client';

import { useMusicPlayerInitializer } from '@/hooks/useMusicPlayerInitializer';

/**
 * MusicPlayerInitializer
 *
 * 在應用啟動時自動初始化音樂播放器並恢復狀態
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
  // Initialize music player on mount
  useMusicPlayerInitializer();

  // This component renders nothing
  return null;
}

MusicPlayerInitializer.displayName = 'MusicPlayerInitializer';
