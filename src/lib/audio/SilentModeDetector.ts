/**
 * SilentModeDetector - 行動裝置靜音模式偵測
 * 需求 6.2: 靜音模式偵測和提示
 */

import { logger } from '../logger';

export class SilentModeDetector {
  private static instance: SilentModeDetector;
  private isSilentMode: boolean = false;
  private isDetected: boolean = false;

  private constructor() {}

  static getInstance(): SilentModeDetector {
    if (!SilentModeDetector.instance) {
      SilentModeDetector.instance = new SilentModeDetector();
    }
    return SilentModeDetector.instance;
  }

  /**
   * 偵測裝置是否處於靜音模式
   * 使用試探性播放測試
   */
  async detect(): Promise<boolean> {
    if (this.isDetected) {
      return this.isSilentMode;
    }

    try {
      // 建立一個短暫的振盪器來測試
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return false;
      }

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // 設定非常小的音量
      gainNode.gain.value = 0.001;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = 20000; // 人耳聽不到的頻率
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.01);

      // 等待播放
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 檢查 AudioContext 狀態
      if (context.state === 'suspended') {
        this.isSilentMode = true;
        logger.info('[SilentModeDetector] Silent mode detected');
      } else {
        this.isSilentMode = false;
        logger.info('[SilentModeDetector] Silent mode not detected');
      }

      // 清理
      await context.close();

      this.isDetected = true;
      return this.isSilentMode;
    } catch (error) {
      logger.warn('[SilentModeDetector] Detection failed', error);
      return false;
    }
  }

  /**
   * 取得靜音模式狀態
   */
  isSilent(): boolean {
    return this.isSilentMode;
  }

  /**
   * 重置偵測狀態（供重新偵測使用）
   */
  reset(): void {
    this.isDetected = false;
  }
}
