/**
 * VolumeController - 音量控制器
 * 需求 4: 獨立音量控制和持久化
 */

import type { AudioType } from './types';
import { DEFAULT_VOLUMES, STORAGE_KEY } from './constants';
import { logger } from '../logger';

export class VolumeController {
  private volumes: Map<AudioType, number> = new Map();
  private muted: Map<AudioType, boolean> = new Map();
  private previousVolumes: Map<AudioType, number> = new Map();
  private readonly storageKey = `${STORAGE_KEY}-volumes`;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化（從 localStorage 載入）
   * 需求 4.6: WHEN 使用者調整音量 THEN 系統 SHALL 將設定儲存至 localStorage
   */
  initialize(): void {
    this.load();

    // 如果沒有儲存的設定，使用預設值
    if (this.volumes.size === 0) {
      this.volumes.set('sfx', DEFAULT_VOLUMES.sfx);
      this.volumes.set('music', DEFAULT_VOLUMES.music);
      this.volumes.set('voice', DEFAULT_VOLUMES.voice);

      this.muted.set('sfx', false);
      this.muted.set('music', false);
      this.muted.set('voice', false);

      this.save();
    }

    logger.info('[VolumeController] Initialized');
  }

  /**
   * 設定音量
   * 需求 4.2-4.4: 即時調整各類別音量
   */
  setVolume(type: AudioType, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volumes.set(type, clampedVolume);

    // 儲存至 localStorage
    this.save();

    logger.info(`[VolumeController] Set ${type} volume to ${clampedVolume.toFixed(2)}`);
  }

  /**
   * 獲取音量
   */
  getVolume(type: AudioType): number {
    return this.volumes.get(type) ?? DEFAULT_VOLUMES[type];
  }

  /**
   * 靜音/取消靜音
   * 需求 4.5: IF 使用者將音量設為 0 THEN 系統 SHALL 靜音該類別
   */
  setMute(type: AudioType, muted: boolean): void {
    this.muted.set(type, muted);

    if (muted) {
      // 儲存當前音量，然後設為 0
      const currentVolume = this.getVolume(type);
      this.previousVolumes.set(type, currentVolume);
    } else {
      // 恢復之前的音量
      const previousVolume = this.previousVolumes.get(type);
      if (previousVolume !== undefined) {
        this.volumes.set(type, previousVolume);
      }
    }

    this.save();
    logger.info(`[VolumeController] ${muted ? 'Muted' : 'Unmuted'} ${type}`);
  }

  /**
   * 切換靜音狀態
   */
  toggleMute(type: AudioType): void {
    const currentMuted = this.isMuted(type);
    this.setMute(type, !currentMuted);
  }

  /**
   * 檢查是否靜音
   */
  isMuted(type: AudioType): boolean {
    return this.muted.get(type) ?? false;
  }

  /**
   * 獲取實際音量（考慮靜音）
   */
  getEffectiveVolume(type: AudioType): number {
    if (this.isMuted(type)) {
      return 0;
    }
    return this.getVolume(type);
  }

  /**
   * 儲存至 localStorage
   */
  private save(): void {
    try {
      const data = {
        volumes: {
          sfx: this.volumes.get('sfx') ?? DEFAULT_VOLUMES.sfx,
          music: this.volumes.get('music') ?? DEFAULT_VOLUMES.music,
          voice: this.volumes.get('voice') ?? DEFAULT_VOLUMES.voice,
        },
        muted: {
          sfx: this.muted.get('sfx') ?? false,
          music: this.muted.get('music') ?? false,
          voice: this.muted.get('voice') ?? false,
        },
        version: 1,
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('[VolumeController] Failed to save to localStorage', error);
    }
  }

  /**
   * 從 localStorage 載入
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.volumes) {
        this.volumes.set('sfx', data.volumes.sfx ?? DEFAULT_VOLUMES.sfx);
        this.volumes.set('music', data.volumes.music ?? DEFAULT_VOLUMES.music);
        this.volumes.set('voice', data.volumes.voice ?? DEFAULT_VOLUMES.voice);
      }

      if (data.muted) {
        this.muted.set('sfx', data.muted.sfx ?? false);
        this.muted.set('music', data.muted.music ?? false);
        this.muted.set('voice', data.muted.voice ?? false);
      }

      logger.info('[VolumeController] Loaded from localStorage');
    } catch (error) {
      logger.error('[VolumeController] Failed to load from localStorage', error);
      // 使用預設值
    }
  }

  /**
   * 重置為預設值
   */
  reset(): void {
    this.volumes.clear();
    this.muted.clear();
    this.previousVolumes.clear();
    this.initialize();
  }

  /**
   * 取得所有音量設定
   */
  getAllVolumes(): Record<AudioType, number> {
    return {
      sfx: this.getVolume('sfx'),
      music: this.getVolume('music'),
      voice: this.getVolume('voice'),
    };
  }

  /**
   * 取得所有靜音狀態
   */
  getAllMuted(): Record<AudioType, boolean> {
    return {
      sfx: this.isMuted('sfx'),
      music: this.isMuted('music'),
      voice: this.isMuted('voice'),
    };
  }
}
