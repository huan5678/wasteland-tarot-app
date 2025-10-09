/**
 * AudioStore - Zustand 音訊狀態管理
 * 需求 4.6, 9.6, 10.1-10.6: 狀態管理和持久化
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AudioState, AudioType, CharacterVoice } from './types';
import { DEFAULT_VOLUMES, STORAGE_KEY } from './constants';

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      // 音量狀態
      volumes: {
        sfx: DEFAULT_VOLUMES.sfx,
        music: DEFAULT_VOLUMES.music,
        voice: DEFAULT_VOLUMES.voice,
      },
      muted: {
        sfx: false,
        music: false,
        voice: false,
      },

      // 播放狀態
      isPlaying: {
        music: false,
        voice: false,
      },
      currentTrack: null,
      speechProgress: 0,

      // 設定
      isAudioEnabled: true,
      isSilentMode: false,
      selectedVoice: 'pip_boy',
      prefersReducedMotion: false,

      // 效能監控
      memoryUsage: 0,
      activeSoundsCount: 0,

      // Actions
      setVolume: (type: AudioType, volume: number) =>
        set((state) => ({
          volumes: {
            ...state.volumes,
            [type]: Math.max(0, Math.min(1, volume)),
          },
        })),

      setMute: (type: AudioType, muted: boolean) =>
        set((state) => ({
          muted: {
            ...state.muted,
            [type]: muted,
          },
        })),

      setCurrentTrack: (trackId: string | null) =>
        set({
          currentTrack: trackId,
          isPlaying: {
            ...get().isPlaying,
            music: trackId !== null,
          },
        }),

      setSpeechProgress: (progress: number) =>
        set({ speechProgress: progress }),

      setAudioEnabled: (enabled: boolean) =>
        set({ isAudioEnabled: enabled }),

      setSilentMode: (silent: boolean) =>
        set({
          isSilentMode: silent,
          muted: silent
            ? { sfx: true, music: true, voice: true }
            : { sfx: false, music: false, voice: false },
        }),

      setSelectedVoice: (voice: CharacterVoice) =>
        set({ selectedVoice: voice }),

      setPrefersReducedMotion: (prefers: boolean) =>
        set({
          prefersReducedMotion: prefers,
          isAudioEnabled: prefers ? false : get().isAudioEnabled,
        }),

      updateMetrics: (usage: number, count: number) =>
        set({
          memoryUsage: usage,
          activeSoundsCount: count,
        }),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      partialize: (state) => ({
        volumes: state.volumes,
        muted: state.muted,
        selectedVoice: state.selectedVoice,
        isAudioEnabled: state.isAudioEnabled,
        isSilentMode: state.isSilentMode,
      }),
    }
  )
);

/**
 * Hook: 取得音效音量
 */
export const useSfxVolume = () => useAudioStore((state) => ({
  volume: state.muted.sfx ? 0 : state.volumes.sfx,
  isMuted: state.muted.sfx,
}));

/**
 * Hook: 取得音樂音量
 */
export const useMusicVolume = () => useAudioStore((state) => ({
  volume: state.muted.music ? 0 : state.volumes.music,
  isMuted: state.muted.music,
}));

/**
 * Hook: 取得語音音量
 */
export const useVoiceVolume = () => useAudioStore((state) => ({
  volume: state.muted.voice ? 0 : state.volumes.voice,
  isMuted: state.muted.voice,
}));
