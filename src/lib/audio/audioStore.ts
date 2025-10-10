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

      // 音樂播放器專用狀態 (Task 1)
      currentMusicMode: null,
      musicPlayerInitialized: false,

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

      toggleMute: (type: AudioType) =>
        set((state) => ({
          muted: {
            ...state.muted,
            [type]: !state.muted[type],
          },
        })),

      setCurrentTrack: (trackId: string | null) =>
        set((state) => ({
          currentTrack: trackId,
          isPlaying: {
            ...state.isPlaying,
            music: trackId !== null,
          },
        })),

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

      // 音樂播放器 Actions (Task 1)
      // Requirements 1.1, 1.2, 2.1, 6.1
      setCurrentMusicMode: (mode: string | null) =>
        set({ currentMusicMode: mode }),

      setMusicPlayerInitialized: (initialized: boolean) =>
        set({ musicPlayerInitialized: initialized }),

      setIsPlaying: (type: 'music' | 'voice', playing: boolean) =>
        set((state) => ({
          isPlaying: {
            ...state.isPlaying,
            [type]: playing,
          },
          // 當音樂播放狀態變更時，如果 type 是 'music' 則同步更新音樂播放器狀態
          // Requirements 2.1: 同步更新音樂播放器狀態
          ...(type === 'music' && !playing ? { currentMusicMode: null } : {}),
        })),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      // Task 1: 新增 currentMusicMode 到持久化欄位
      partialize: (state) => ({
        volumes: state.volumes,
        muted: state.muted,
        selectedVoice: state.selectedVoice,
        isAudioEnabled: state.isAudioEnabled,
        isSilentMode: state.isSilentMode,
        currentMusicMode: state.currentMusicMode, // 持久化當前音樂模式
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
