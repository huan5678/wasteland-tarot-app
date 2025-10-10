/**
 * MusicManager - 背景音樂管理器 (重構版)
 * 需求 3, 7, 10, 11: 使用 ProceduralMusicEngine 管理 Synthwave Lofi 背景音樂
 */

import type { AudioEngine } from './AudioEngine';
import { MusicGenerator, getMusicModeForScene } from './MusicGenerator';
import { CROSSFADE_DURATION } from './constants';
import { logger } from '../logger';
import type { MusicMode } from './ProceduralMusicEngine';

export class MusicManager {
  private audioEngine: AudioEngine;
  private musicGenerator: MusicGenerator | null = null;
  private currentMode: MusicMode | null = null;
  private targetVolume: number = 0.5;
  private gainNode: GainNode | null = null;
  private isFading: boolean = false;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  /**
   * 切換場景音樂
   * 需求 3.2: WHEN 使用者開始占卜 THEN 系統 SHALL 切換至占卜音樂
   * 需求 3.5: WHEN 背景音樂切換時 THEN 系統 SHALL 在 2 秒內完成 crossfade
   */
  async switchScene(sceneName: string): Promise<void> {
    const newMode = getMusicModeForScene(sceneName);

    // 如果已是當前音樂模式，不做任何事
    if (this.currentMode === newMode && this.musicGenerator?.isCurrentlyPlaying()) {
      logger.info(`[MusicManager] Already playing ${newMode} mode`);
      return;
    }

    logger.info(`[MusicManager] Switching to ${newMode} mode`);

    const context = this.audioEngine.getContext();
    if (!context) {
      logger.warn('[MusicManager] AudioContext not initialized');
      return;
    }

    // 初始化音樂生成器（如果尚未初始化）
    if (!this.musicGenerator) {
      // 建立 GainNode 用於音量控制
      if (!this.gainNode) {
        this.gainNode = context.createGain();
        this.gainNode.gain.value = this.targetVolume;
        this.gainNode.connect(context.destination);
      }

      this.musicGenerator = new MusicGenerator(context, this.gainNode);
    }

    // 如果有當前音樂，執行 crossfade
    if (this.currentMode && this.musicGenerator.isCurrentlyPlaying()) {
      await this.crossfade(newMode);
    } else {
      // 沒有當前音樂，直接播放並淡入
      this.musicGenerator.start(newMode, 'standard');
      this.currentMode = newMode;
      await this.fadeIn(CROSSFADE_DURATION);
    }
  }

  /**
   * Crossfade 切換音樂
   */
  private async crossfade(newMode: MusicMode): Promise<void> {
    if (!this.musicGenerator || !this.gainNode) return;

    // 淡出當前音樂
    await this.fadeOut(CROSSFADE_DURATION);

    // 切換到新模式
    this.musicGenerator.switchMode(newMode);
    this.currentMode = newMode;

    // 淡入新音樂
    await this.fadeIn(CROSSFADE_DURATION);

    logger.info(`[MusicManager] Crossfade to ${newMode} completed`);
  }

  /**
   * 停止音樂
   * 需求 3.3: IF 使用者關閉背景音樂 THEN 系統 SHALL 停止所有背景音樂
   */
  stop(): void {
    if (this.musicGenerator) {
      this.musicGenerator.stop();
      this.currentMode = null;
    }

    logger.info('[MusicManager] Stopped');
  }

  /**
   * 淡出音樂
   */
  private async fadeOut(duration: number): Promise<void> {
    if (!this.gainNode) return;

    this.isFading = true;

    const context = this.audioEngine.getContext();
    if (!context) return;

    const currentTime = context.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);

    // 等待淡出完成
    await new Promise(resolve => setTimeout(resolve, duration));
    this.isFading = false;
  }

  /**
   * 淡入音樂
   */
  private async fadeIn(duration: number): Promise<void> {
    if (!this.gainNode) return;

    this.isFading = true;

    const context = this.audioEngine.getContext();
    if (!context) return;

    const currentTime = context.currentTime;
    this.gainNode.gain.value = 0;
    this.gainNode.gain.linearRampToValueAtTime(this.targetVolume, currentTime + duration / 1000);

    // 等待淡入完成
    await new Promise(resolve => setTimeout(resolve, duration));
    this.isFading = false;
  }

  /**
   * 設定音樂音量
   * 需求 4.3: WHEN 使用者調整音樂音量 THEN 系統 SHALL 即時調整
   */
  setVolume(volume: number): void {
    this.targetVolume = Math.max(0, Math.min(1, volume));

    if (this.musicGenerator) {
      this.musicGenerator.setVolume(this.targetVolume);
    }

    if (this.gainNode && !this.isFading) {
      this.gainNode.gain.value = this.targetVolume;
    }
  }

  /**
   * 取得當前播放的音樂模式
   */
  getCurrentTrack(): string | null {
    return this.currentMode;
  }

  /**
   * 檢查是否正在播放
   */
  isPlaying(): boolean {
    return this.musicGenerator?.isCurrentlyPlaying() ?? false;
  }
}
