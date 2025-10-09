/**
 * AudioErrorHandler - 音訊錯誤處理器
 * 需求 8: 錯誤處理和降級策略
 */

import { logger } from '../logger';
import type { AudioEngine } from './AudioEngine';
import { ERROR_RATE_THRESHOLD, MAX_LOAD_RETRIES } from './constants';

export class AudioErrorHandler {
  private errorCount: Map<string, number> = new Map();
  private totalAttempts: number = 0;
  private audioEngine: AudioEngine | null = null;

  constructor(audioEngine?: AudioEngine) {
    this.audioEngine = audioEngine || null;
  }

  /**
   * 處理 AudioContext 初始化錯誤
   * 需求 8.1: IF 瀏覽器不支援 Web Audio API THEN 降級使用 HTML5 Audio
   */
  handleInitializationError(error: Error): void {
    logger.error('[AudioErrorHandler] Initialization failed', error);

    if (!this.isWebAudioSupported()) {
      logger.warn('[AudioErrorHandler] Web Audio API not supported, falling back to HTML5 Audio');
      this.showUserFriendlyError('您的瀏覽器不支援進階音效功能，將使用基本音效');
    } else {
      this.showUserFriendlyError('音訊系統初始化失敗，請重新整理頁面');
    }
  }

  /**
   * 處理音效載入錯誤
   * 需求 8.5: WHEN 音訊檔案 404 THEN 重試最多 3 次
   */
  async handleLoadError(soundId: string, error: Error, retryFn: () => Promise<void>): Promise<void> {
    const retryCount = this.errorCount.get(soundId) || 0;
    this.totalAttempts++;

    if (retryCount < MAX_LOAD_RETRIES) {
      this.errorCount.set(soundId, retryCount + 1);
      logger.warn(`[AudioErrorHandler] Retrying load for ${soundId} (${retryCount + 1}/${MAX_LOAD_RETRIES})`);

      try {
        await retryFn();
        // 成功後重置錯誤計數
        this.errorCount.delete(soundId);
      } catch (retryError) {
        logger.error(`[AudioErrorHandler] Retry failed for ${soundId}`, retryError);
        if (retryCount + 1 >= MAX_LOAD_RETRIES) {
          this.handleMaxRetriesExceeded(soundId);
        }
      }
    } else {
      this.handleMaxRetriesExceeded(soundId);
    }
  }

  /**
   * 處理超過最大重試次數
   */
  private handleMaxRetriesExceeded(soundId: string): void {
    logger.error(`[AudioErrorHandler] Failed to load ${soundId} after ${MAX_LOAD_RETRIES} retries`);
    this.errorCount.delete(soundId);
    // 跳過該音效，繼續運作
  }

  /**
   * 處理播放錯誤
   * 需求 8.3: WHEN 音訊初始化失敗 THEN 記錄並顯示友善訊息
   * 需求 8.6: IF 錯誤率超過 30% THEN 自動停用音效系統
   */
  handlePlaybackError(soundId: string, error: Error): void {
    logger.error(`[AudioErrorHandler] Playback error for ${soundId}`, error);
    this.totalAttempts++;

    const currentCount = this.errorCount.get('playback') || 0;
    this.errorCount.set('playback', currentCount + 1);

    // 計算錯誤率
    const errorRate = this.calculateErrorRate();

    if (errorRate > ERROR_RATE_THRESHOLD) {
      logger.error(`[AudioErrorHandler] Error rate ${(errorRate * 100).toFixed(1)}% exceeded threshold, disabling audio`);
      this.disableAudioSystem();
      this.showUserFriendlyError('音效系統遇到問題，已暫時停用');
    }
  }

  /**
   * 處理 Web Speech API 不支援
   * 需求 8.2: IF 瀏覽器不支援 Web Speech API THEN 隱藏語音功能
   */
  handleSpeechAPINotSupported(): void {
    logger.warn('[AudioErrorHandler] Web Speech API not supported');
    // UI 組件會自動隱藏語音控制按鈕
  }

  /**
   * 處理使用者拒絕音訊權限
   * 需求 8.4: IF 使用者拒絕音訊權限 THEN 靜默運作
   */
  handlePermissionDenied(): void {
    logger.info('[AudioErrorHandler] User denied audio permission');
    // 靜默運作，不再嘗試播放
  }

  /**
   * 檢查 Web Audio API 支援
   */
  isWebAudioSupported(): boolean {
    return 'AudioContext' in window || 'webkitAudioContext' in window;
  }

  /**
   * 檢查 Web Speech API 支援
   */
  isSpeechAPISupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * 計算錯誤率
   */
  private calculateErrorRate(): number {
    if (this.totalAttempts === 0) return 0;

    const totalErrors = Array.from(this.errorCount.values())
      .reduce((sum, count) => sum + count, 0);

    return totalErrors / this.totalAttempts;
  }

  /**
   * 停用音效系統
   */
  private disableAudioSystem(): void {
    if (this.audioEngine) {
      this.audioEngine.stopAll();
    }
    // 通知狀態管理停用音效
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('audio:disabled'));
    }
  }

  /**
   * 顯示友善錯誤訊息
   */
  private showUserFriendlyError(message: string): void {
    // 使用 UI store 顯示通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('audio:error', { detail: { message } }));
    }
  }

  /**
   * 重置錯誤計數
   */
  reset(): void {
    this.errorCount.clear();
    this.totalAttempts = 0;
  }

  /**
   * 取得錯誤統計
   */
  getErrorStats(): { totalErrors: number; totalAttempts: number; errorRate: number } {
    const totalErrors = Array.from(this.errorCount.values())
      .reduce((sum, count) => sum + count, 0);

    return {
      totalErrors,
      totalAttempts: this.totalAttempts,
      errorRate: this.calculateErrorRate(),
    };
  }
}

/**
 * 自訂錯誤類型
 */
export class AudioInitializationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AudioInitializationError';
  }
}

export class SoundLoadError extends Error {
  constructor(
    message: string,
    public readonly soundId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SoundLoadError';
  }
}

export class PlaybackError extends Error {
  constructor(
    message: string,
    public readonly soundId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PlaybackError';
  }
}
