/**
 * MusicManager - 背景音樂管理器
 * 需求 3: 背景音樂管理系統
 */

import type { AudioEngine } from './AudioEngine';
import { CROSSFADE_DURATION, SCENE_MUSIC_MAP } from './constants';
import { logger } from '../logger';

export class MusicManager {
  private audioEngine: AudioEngine;
  private currentTrack: string | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private targetVolume: number = 0.5;
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
    const trackId = SCENE_MUSIC_MAP[sceneName] || SCENE_MUSIC_MAP['/'];

    // 如果已是當前音樂，不做任何事
    if (this.currentTrack === trackId) {
      logger.info(`[MusicManager] Already playing ${trackId}`);
      return;
    }

    logger.info(`[MusicManager] Switching to ${trackId}`);

    // 如果有當前音樂，執行 crossfade
    if (this.currentTrack && this.currentSource) {
      await this.crossfade(trackId);
    } else {
      // 沒有當前音樂，直接播放並淡入
      await this.play(trackId);
      await this.fadeIn(CROSSFADE_DURATION);
    }
  }

  /**
   * Crossfade 切換音樂
   */
  private async crossfade(newTrackId: string): Promise<void> {
    const oldSource = this.currentSource;
    const oldGainNode = this.gainNode;

    // 並行執行：淡出舊音樂 + 載入新音樂
    const [_, newBuffer] = await Promise.all([
      this.fadeOut(CROSSFADE_DURATION, oldGainNode),
      this.loadMusicBuffer(newTrackId),
    ]);

    // 停止並釋放舊音樂
    if (oldSource) {
      try {
        oldSource.stop();
        oldSource.disconnect();
      } catch (e) {
        // 忽略已停止的錯誤
      }
    }
    if (oldGainNode) {
      oldGainNode.disconnect();
    }

    // 播放新音樂（從 0 音量開始）
    await this.playBuffer(newTrackId, newBuffer, 0);

    // 淡入新音樂
    await this.fadeIn(CROSSFADE_DURATION);
  }

  /**
   * 播放音樂（循環）
   * 需求 3.1: WHEN 使用者進入主頁面 THEN 系統 SHALL 播放循環背景音樂
   * 需求 3.4: WHILE 背景音樂播放中 THE 系統 SHALL 支援無縫循環
   */
  async play(trackId: string): Promise<void> {
    const buffer = await this.loadMusicBuffer(trackId);
    await this.playBuffer(trackId, buffer, this.targetVolume);
  }

  /**
   * 載入音樂緩衝區
   */
  private async loadMusicBuffer(trackId: string): Promise<AudioBuffer> {
    const context = this.audioEngine.getContext();
    if (!context) {
      throw new Error('AudioContext not initialized');
    }

    // 嘗試從快取獲取
    const cached = (this.audioEngine as any).audioBuffers.get(trackId);
    if (cached) {
      return cached.buffer;
    }

    // 載入新音樂
    const url = `/sounds/music/${trackId}.mp3`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load music: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    // 快取音樂
    (this.audioEngine as any).audioBuffers.set(trackId, {
      buffer: audioBuffer,
      priority: 'normal',
      lastUsed: Date.now(),
      size: audioBuffer.length * audioBuffer.numberOfChannels * 4,
    });

    return audioBuffer;
  }

  /**
   * 播放音訊緩衝區
   */
  private async playBuffer(trackId: string, buffer: AudioBuffer, initialVolume: number): Promise<void> {
    const context = this.audioEngine.getContext();
    if (!context) {
      throw new Error('AudioContext not initialized');
    }

    // 建立新的音源和增益節點
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true; // 循環播放

    const gainNode = context.createGain();
    gainNode.gain.value = initialVolume;

    // 連接節點
    source.connect(gainNode);
    gainNode.connect(context.destination);

    // 開始播放
    source.start(0);

    this.currentTrack = trackId;
    this.currentSource = source;
    this.gainNode = gainNode;

    logger.info(`[MusicManager] Playing ${trackId}`);
  }

  /**
   * 停止音樂
   * 需求 3.3: IF 使用者關閉背景音樂 THEN 系統 SHALL 停止所有背景音樂
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // 忽略已停止的錯誤
      }
      this.currentSource = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.currentTrack = null;
    logger.info('[MusicManager] Stopped');
  }

  /**
   * 淡出音樂
   */
  private async fadeOut(duration: number, targetGainNode?: GainNode | null): Promise<void> {
    const node = targetGainNode || this.gainNode;
    if (!node) return;

    this.isFading = true;

    const context = this.audioEngine.getContext();
    if (!context) return;

    const currentTime = context.currentTime;
    node.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);

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

    if (this.gainNode && !this.isFading) {
      this.gainNode.gain.value = this.targetVolume;
    }
  }

  /**
   * 取得當前播放的音樂
   */
  getCurrentTrack(): string | null {
    return this.currentTrack;
  }

  /**
   * 檢查是否正在播放
   */
  isPlaying(): boolean {
    return this.currentTrack !== null;
  }
}
