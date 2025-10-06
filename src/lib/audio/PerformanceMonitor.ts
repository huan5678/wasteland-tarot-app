/**
 * PerformanceMonitor - 效能監控和自動降級
 * 需求 9.3, 9.5: FPS 監控和記憶體洩漏偵測
 */

import { AudioEngine } from './AudioEngine';
import { logger } from '../logger';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  audioMemory: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring: boolean = false;
  private fps: number = 60;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private rafId: number | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private isDegraded: boolean = false;

  private readonly FPS_THRESHOLD = 30;
  private readonly FPS_HISTORY_SIZE = 60; // 1秒的歷史（假設60fps）
  private readonly MEMORY_CHECK_INTERVAL = 5000; // 5秒檢查一次
  private readonly MEMORY_LEAK_THRESHOLD = 100 * 1024 * 1024; // 100MB

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 開始監控效能
   * 需求 9.3: WHEN FPS 低於 30 THEN 系統 SHALL 自動降級
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.monitorFPS();
    this.monitorMemory();

    logger.info('[PerformanceMonitor] Started monitoring');
  }

  /**
   * 停止監控
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.memoryCheckInterval !== null) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    logger.info('[PerformanceMonitor] Stopped monitoring');
  }

  /**
   * 監控 FPS
   */
  private monitorFPS(): void {
    const measure = (timestamp: number) => {
      if (!this.isMonitoring) return;

      this.frameCount++;

      // 每秒計算一次 FPS
      if (timestamp - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFrameTime));
        this.fpsHistory.push(this.fps);

        // 保持歷史記錄大小
        if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
          this.fpsHistory.shift();
        }

        // 檢查是否需要降級
        this.checkPerformanceDegradation();

        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      this.rafId = requestAnimationFrame(measure);
    };

    this.rafId = requestAnimationFrame(measure);
  }

  /**
   * 監控記憶體
   * 需求 9.5: 記憶體洩漏偵測和恢復
   */
  private monitorMemory(): void {
    this.memoryCheckInterval = setInterval(() => {
      if (!this.isMonitoring) return;

      const audioEngine = AudioEngine.getInstance();
      const audioMemory = audioEngine.getMemoryUsage();

      // 記錄音訊記憶體使用
      this.memoryHistory.push(audioMemory);

      // 保持最近 12 個記錄（1分鐘）
      if (this.memoryHistory.length > 12) {
        this.memoryHistory.shift();
      }

      // 檢測記憶體洩漏
      this.detectMemoryLeak();

      // 取得瀏覽器記憶體（如果支援）
      if ('memory' in performance) {
        const browserMemory = (performance as any).memory.usedJSHeapSize;
        logger.debug(`[PerformanceMonitor] Memory: ${(browserMemory / 1024 / 1024).toFixed(2)}MB (browser), ${(audioMemory / 1024 / 1024).toFixed(2)}MB (audio)`);
      }
    }, this.MEMORY_CHECK_INTERVAL);
  }

  /**
   * 檢查效能降級
   */
  private checkPerformanceDegradation(): void {
    // 計算平均 FPS
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;

    if (avgFPS < this.FPS_THRESHOLD && !this.isDegraded) {
      logger.warn(`[PerformanceMonitor] Low FPS detected (${avgFPS.toFixed(1)}), applying degradation`);
      this.applyDegradation();
    } else if (avgFPS >= this.FPS_THRESHOLD + 10 && this.isDegraded) {
      logger.info(`[PerformanceMonitor] FPS recovered (${avgFPS.toFixed(1)}), removing degradation`);
      this.removeDegradation();
    }
  }

  /**
   * 應用效能降級
   * 需求 9.3: 降級策略包含降低音效品質、關閉效果處理、減少並發數
   */
  private applyDegradation(): void {
    this.isDegraded = true;

    const audioEngine = AudioEngine.getInstance();

    // 停止所有非關鍵音效
    audioEngine.stopAll();

    // 降低背景音樂音量
    audioEngine.setVolume('music', 0.3);

    // 清除非關鍵快取
    audioEngine.clearCache('lru');

    logger.info('[PerformanceMonitor] Degradation applied');
  }

  /**
   * 移除效能降級
   */
  private removeDegradation(): void {
    this.isDegraded = false;

    const audioEngine = AudioEngine.getInstance();

    // 恢復背景音樂音量（這應該從 AudioStore 讀取使用者設定）
    audioEngine.setVolume('music', 0.5);

    logger.info('[PerformanceMonitor] Degradation removed');
  }

  /**
   * 偵測記憶體洩漏
   */
  private detectMemoryLeak(): void {
    if (this.memoryHistory.length < 6) return; // 至少需要 30 秒的資料

    // 檢查記憶體是否持續增長
    const recent = this.memoryHistory.slice(-6); // 最近 30 秒
    const isIncreasing = recent.every((val, idx) => {
      if (idx === 0) return true;
      return val >= recent[idx - 1];
    });

    const currentMemory = recent[recent.length - 1];
    const growthRate = (currentMemory - recent[0]) / recent[0];

    if (isIncreasing && growthRate > 0.5 && currentMemory > this.MEMORY_LEAK_THRESHOLD) {
      logger.error('[PerformanceMonitor] Memory leak detected, attempting recovery');
      this.recoverFromMemoryLeak();
    }
  }

  /**
   * 從記憶體洩漏恢復
   * 需求 9.5: 實作 AudioContext 重新初始化邏輯
   */
  private async recoverFromMemoryLeak(): Promise<void> {
    try {
      const audioEngine = AudioEngine.getInstance();

      // 清除所有快取
      audioEngine.clearCache('all');

      // 停止所有音效
      audioEngine.stopAll();

      // 重新初始化（這需要 AudioEngine 支援）
      logger.info('[PerformanceMonitor] Cleared audio cache to recover from memory leak');

      // 重置記憶體歷史
      this.memoryHistory = [];
    } catch (error) {
      logger.error('[PerformanceMonitor] Failed to recover from memory leak', error);
    }
  }

  /**
   * 取得當前效能指標
   */
  getMetrics(): PerformanceMetrics {
    const audioEngine = AudioEngine.getInstance();

    return {
      fps: this.fps,
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
      audioMemory: audioEngine.getMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * 檢查是否已降級
   */
  isDegradedMode(): boolean {
    return this.isDegraded;
  }

  /**
   * 取得當前 FPS
   */
  getCurrentFPS(): number {
    return this.fps;
  }
}
