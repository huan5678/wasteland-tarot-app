/**
 * AudioEngine - 音效引擎核心類別 (Singleton)
 * 需求 1, 5, 6, 8, 9: 音效播放、快取、行動優化、錯誤處理、效能管理
 * 需求 3.1: 使用 Web Audio API 即時生成音效，移除音檔依賴
 */

import type { AudioType, PlayOptions, SoundConfig, CachedBuffer } from './types';
import {
  MAX_CONCURRENT_SOUNDS,
  MAX_CONCURRENT_SOUNDS_MOBILE,
  MAX_MEMORY_MB,
  CONCURRENT_LOAD_LIMIT,
  PLAYBACK_LATENCY_TARGET,
  SOUND_CONFIGS,
} from './constants';
import { logger } from '../logger';
import * as SoundGenerator from './SoundGenerator';

export class AudioEngine {
  private static instance: AudioEngine;
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, CachedBuffer> = new Map();
  private activeSourceNodes: Map<string, AudioBufferSourceNode[]> = new Map();
  private gainNodes: Map<AudioType, GainNode> = new Map();
  private isUnlocked: boolean = false;
  private isMobile: boolean = false;
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  private batteryManager: any = null;
  private isLowBattery: boolean = false;
  private isIOSDevice: boolean = false;
  private fpsMonitorId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private currentFPS: number = 60;
  private memoryCheckInterval: number | null = null;
  private lastMemoryUsage: number = 0;
  private memoryIncreaseCount: number = 0;
  private isLowQualityMode: boolean = false;
  private visibilityChangeListener: (() => void) | null = null;
  private playbackStateBeforeBackground: Map<string, boolean> = new Map();
  private isSilentMode: boolean = false;

  private constructor() {
    this.isMobile = this.detectMobile();
    this.isIOSDevice = this.detectIOS();
    if (this.isMobile) {
      this.optimizeForMobile();
    }
    this.setupVisibilityControl();
    this.detectSilentMode();
  }

  /**
   * 獲取 AudioEngine 單例實例
   * @returns {AudioEngine} AudioEngine 單例實例
   * @example
   * const audioEngine = AudioEngine.getInstance();
   * await audioEngine.initialize();
   */
  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * 初始化 AudioContext（需使用者互動後呼叫）
   * 需求 6.1: WHEN 使用者在行動裝置上首次互動
   */
  async initialize(): Promise<void> {
    if (this.isUnlocked) {
      return;
    }

    try {
      // 檢查 window 是否存在（非瀏覽器環境）
      if (typeof window === 'undefined') {
        logger.warn('[AudioEngine] Not in browser environment, skipping initialization');
        return;
      }

      // 建立 AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        logger.warn('[AudioEngine] Web Audio API not supported, gracefully degrading');
        return;
      }

      this.audioContext = new AudioContextClass();

      // 解鎖 AudioContext (處理自動播放政策)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // iOS Safari 需要播放靜音音訊來解鎖
      if (this.isMobile) {
        await this.unlockAudioContextiOS();
      }

      // 建立各類型的 GainNode
      this.gainNodes.set('sfx', this.audioContext.createGain());
      this.gainNodes.set('music', this.audioContext.createGain());
      this.gainNodes.set('voice', this.audioContext.createGain());

      // 連接所有 GainNode 到 destination
      this.gainNodes.forEach((node) => {
        node.connect(this.audioContext!.destination);
      });

      this.isUnlocked = true;
      logger.info('[AudioEngine] Initialized successfully');
    } catch (error) {
      // 需求 3.4, 3.5: 靜默失敗，不拋出例外，不顯示錯誤 toast
      logger.error('[AudioEngine] Initialization failed', error);
      // 不再拋出錯誤，優雅降級
    }
  }

  /**
   * iOS Safari 解鎖邏輯
   * 需求 6.5: iOS 特定優化
   */
  private async unlockAudioContextiOS(): Promise<void> {
    if (!this.audioContext) return;

    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  /**
   * 偵測行動裝置
   */
  private detectMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  /**
   * 偵測 iOS 裝置
   */
  private detectIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * 行動裝置優化
   * 需求 6.5, 6.6: 行動裝置特定優化和電池管理
   */
  private async optimizeForMobile(): Promise<void> {
    // 初始化電池 API
    if ('getBattery' in navigator) {
      try {
        this.batteryManager = await (navigator as any).getBattery();
        this.batteryManager.addEventListener('levelchange', () => {
          this.checkBatteryLevel();
        });
        this.batteryManager.addEventListener('chargingchange', () => {
          this.checkBatteryLevel();
        });
        this.checkBatteryLevel();
      } catch (error) {
        logger.warn('[AudioEngine] Battery API not available', error);
      }
    }

    // iOS 低電量模式偵測
    if (this.isIOSDevice) {
      this.detectIOSLowPowerMode();
    }
  }

  /**
   * 檢查電池電量
   * 需求 6.6: WHEN 裝置電池低於 20% THEN 系統 SHALL 降低背景音樂音量至 30%
   */
  private checkBatteryLevel(): void {
    if (!this.batteryManager) return;

    const level = this.batteryManager.level;
    const isCharging = this.batteryManager.charging;

    // 低電量且未充電
    if (level < 0.2 && !isCharging) {
      if (!this.isLowBattery) {
        this.isLowBattery = true;
        logger.info('[AudioEngine] Low battery detected, reducing music volume');

        // 降低背景音樂音量至 30%
        const musicGain = this.gainNodes.get('music');
        if (musicGain) {
          const currentVolume = musicGain.gain.value;
          musicGain.gain.value = Math.min(currentVolume, 0.3);
        }
      }
    } else {
      this.isLowBattery = false;
    }
  }

  /**
   * iOS 低電量模式偵測
   * 需求 6.5: iOS 特定優化
   */
  private detectIOSLowPowerMode(): void {
    // iOS 低電量模式會降低 AudioContext 採樣率
    if (this.audioContext) {
      const sampleRate = this.audioContext.sampleRate;
      // 正常採樣率通常是 44100 或 48000
      // 低電量模式可能降至 24000 或更低
      if (sampleRate < 40000) {
        logger.info('[AudioEngine] iOS Low Power Mode detected');
        this.isLowBattery = true;
      }
    }
  }

  /**
   * 取得當前電池狀態
   */
  getBatteryStatus(): { level: number; charging: boolean; lowBattery: boolean } | null {
    if (!this.batteryManager) return null;

    return {
      level: this.batteryManager.level,
      charging: this.batteryManager.charging,
      lowBattery: this.isLowBattery,
    };
  }

  /**
   * 預載音效列表
   * 需求 5.1: WHEN 應用程式初始化時 THEN 系統 SHALL 預載所有關鍵音效
   */
  async preloadSounds(soundList: SoundConfig[]): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    // 按優先級排序
    const sorted = [...soundList].sort((a, b) => {
      const priorityOrder = { critical: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 分批載入，控制並發數
    for (let i = 0; i < sorted.length; i += CONCURRENT_LOAD_LIMIT) {
      const batch = sorted.slice(i, i + CONCURRENT_LOAD_LIMIT);
      await Promise.allSettled(
        batch.map((sound) => this.loadSound(sound))
      );
    }

    logger.info(`[AudioEngine] Preloaded ${soundList.length} sounds`);
  }

  /**
   * 預載關鍵音效
   * 需求 5.1, 5.6: 優先載入 critical 音效
   * 任務 38: 實作音效預載優先級管理
   */
  async preloadCriticalSounds(): Promise<void> {
    try {
      const { getCriticalSounds } = await import('./manifest');
      const criticalSounds = await getCriticalSounds();

      logger.info(`[AudioEngine] Preloading ${criticalSounds.length} critical sounds`);

      // 並行載入關鍵音效，最多 3 個同時載入
      const CRITICAL_CONCURRENCY = 3;
      for (let i = 0; i < criticalSounds.length; i += CRITICAL_CONCURRENCY) {
        const batch = criticalSounds.slice(i, i + CRITICAL_CONCURRENCY);
        await Promise.allSettled(
          batch.map((sound) => this.loadSound(sound))
        );
      }

      logger.info('[AudioEngine] Critical sounds preloaded successfully');
    } catch (error) {
      logger.error('[AudioEngine] Failed to preload critical sounds', error);
    }
  }

  /**
   * 延遲載入非關鍵音效
   * 需求 5.4: 在瀏覽器閒置時載入非關鍵音效
   * 任務 39: 實作延遲載入非關鍵音效
   */
  lazyLoadNonCriticalSounds(): void {
    // 使用 requestIdleCallback 在瀏覽器閒置時載入
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(async () => {
        try {
          const { getNonCriticalSounds } = await import('./manifest');
          const nonCriticalSounds = await getNonCriticalSounds();

          logger.info(`[AudioEngine] Lazy loading ${nonCriticalSounds.length} non-critical sounds`);

          // 慢速載入，避免影響效能
          for (const sound of nonCriticalSounds) {
            await this.loadSound(sound);
            // 每個音效載入後暫停一下，讓出主執行緒
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          logger.info('[AudioEngine] Non-critical sounds loaded successfully');
        } catch (error) {
          logger.error('[AudioEngine] Failed to lazy load non-critical sounds', error);
        }
      }, { timeout: 5000 });
    } else {
      // 降級：使用 setTimeout
      setTimeout(async () => {
        try {
          const { getNonCriticalSounds } = await import('./manifest');
          const nonCriticalSounds = await getNonCriticalSounds();
          await this.preloadSounds(nonCriticalSounds);
        } catch (error) {
          logger.error('[AudioEngine] Failed to lazy load non-critical sounds (fallback)', error);
        }
      }, 3000);
    }
  }

  /**
   * 載入單個音效
   * 需求 3.1-3.9: 使用 Web Audio API 即時生成音效，替代載入外部音檔
   * 需求 5.2: 生成完成後快取至記憶體
   */
  private async loadSound(config: SoundConfig): Promise<AudioBuffer> {
    // 避免重複載入
    if (this.audioBuffers.has(config.id)) {
      const cached = this.audioBuffers.get(config.id)!;
      cached.lastUsed = Date.now();
      return cached.buffer;
    }

    // 如果正在載入，返回現有的 Promise
    if (this.loadingPromises.has(config.id)) {
      return this.loadingPromises.get(config.id)!;
    }

    const loadPromise = (async () => {
      try {
        if (!this.audioContext) {
          throw new Error('AudioContext not initialized');
        }

        // 使用 SoundGenerator 即時生成音效（替代 fetch）
        const audioBuffer = await this.generateSound(config.id, this.audioContext, this.audioContext.destination);

        // 檢查記憶體使用
        const bufferSize = audioBuffer.length * audioBuffer.numberOfChannels * 4;
        if (this.getMemoryUsage() + bufferSize > MAX_MEMORY_MB * 1024 * 1024) {
          this.evictLRU();
        }

        // 快取音效
        this.audioBuffers.set(config.id, {
          buffer: audioBuffer,
          priority: config.priority,
          lastUsed: Date.now(),
          size: bufferSize,
        });

        logger.info(`[AudioEngine] Generated and cached ${config.id}`);
        return audioBuffer;
      } catch (error) {
        logger.error(`[AudioEngine] Failed to generate ${config.id}`, error);
        // 靜默失敗 - 不拋出錯誤，避免中斷用戶體驗
        // 返回一個空的 buffer 作為後備
        const emptyBuffer = this.audioContext!.createBuffer(1, 1, this.audioContext!.sampleRate);
        return emptyBuffer;
      } finally {
        this.loadingPromises.delete(config.id);
      }
    })();

    this.loadingPromises.set(config.id, loadPromise);
    return loadPromise;
  }

  /**
   * 根據音效 ID 生成音效
   * 需求 3.1-3.5: 映射音效 ID 到對應的生成器函數
   */
  private async generateSound(soundId: string, audioContext: AudioContext, destination: AudioNode): Promise<AudioBuffer> {
    // 從配置中查找音效
    const config = SOUND_CONFIGS[soundId];

    if (config) {
      // 使用配置的生成器與參數
      switch (config.generator) {
        case 'button-click':
          return SoundGenerator.generateButtonClick(audioContext, destination, config.params);
        case 'card-flip':
          return SoundGenerator.generateCardFlip(audioContext, destination, config.params);
        case 'shuffle':
          return SoundGenerator.generateShuffle(audioContext, destination, config.params);
        case 'reveal':
          return SoundGenerator.generateReveal(audioContext, destination, config.params);
        case 'pip-boy-beep':
          return SoundGenerator.generatePipBoyBeep(audioContext, destination, config.params);
        case 'terminal-type':
          return SoundGenerator.generateTerminalType(audioContext, destination, config.params);
        case 'vault-door':
          return SoundGenerator.generateVaultDoor(audioContext, destination, config.params);
        case 'ui-hover':
          return SoundGenerator.generateUIHover(audioContext, destination, config.params);
        default:
          logger.warn(`[AudioEngine] Unknown generator '${config.generator}', using button-click as fallback`);
          return SoundGenerator.generateButtonClick(audioContext, destination);
      }
    }

    // 回退：使用字串匹配（向後兼容）
    const soundIdLower = soundId.toLowerCase();

    if (soundIdLower.includes('click') || soundIdLower.includes('button')) {
      return SoundGenerator.generateButtonClick(audioContext, destination);
    } else if (soundIdLower.includes('card-flip') || soundIdLower.includes('flip')) {
      return SoundGenerator.generateCardFlip(audioContext, destination);
    } else if (soundIdLower.includes('shuffle')) {
      return SoundGenerator.generateShuffle(audioContext, destination);
    } else if (soundIdLower.includes('reveal')) {
      return SoundGenerator.generateReveal(audioContext, destination);
    } else if (soundIdLower.includes('pip-boy') || soundIdLower.includes('beep')) {
      return SoundGenerator.generatePipBoyBeep(audioContext, destination);
    } else if (soundIdLower.includes('terminal') || soundIdLower.includes('type')) {
      return SoundGenerator.generateTerminalType(audioContext, destination);
    } else if (soundIdLower.includes('vault') || soundIdLower.includes('door')) {
      return SoundGenerator.generateVaultDoor(audioContext, destination);
    } else {
      // 預設使用按鈕點擊音
      logger.warn(`[AudioEngine] Unknown sound ID '${soundId}', using button-click as fallback`);
      return SoundGenerator.generateButtonClick(audioContext, destination);
    }
  }

  /**
   * 播放音效
   * 需求 1.1: WHEN 使用者點擊按鈕 THEN 系統 SHALL 播放對應音效
   * 需求 1.7: WHERE 音效已預載 THE 系統 SHALL 在 100ms 內開始播放
   * 需求 9.2: 限制最大並發播放數
   */
  async play(soundId: string, options: PlayOptions = {}): Promise<void> {
    if (!this.audioContext || !this.isUnlocked) {
      logger.warn('[AudioEngine] Not initialized, call initialize() first');
      return;
    }

    const startTime = performance.now();

    try {
      // 獲取音效緩衝區
      let buffer: AudioBuffer;
      const cached = this.audioBuffers.get(soundId);

      if (cached) {
        buffer = cached.buffer;
        cached.lastUsed = Date.now();
      } else {
        // 音效未預載，嘗試從 loading promises 獲取
        if (this.loadingPromises.has(soundId)) {
          buffer = await this.loadingPromises.get(soundId)!;
        } else {
          logger.warn(`[AudioEngine] Sound ${soundId} not preloaded`);
          return;
        }
      }

      // 檢查並發數限制
      const maxConcurrent = this.isMobile ? MAX_CONCURRENT_SOUNDS_MOBILE : MAX_CONCURRENT_SOUNDS;
      const totalActive = Array.from(this.activeSourceNodes.values())
        .reduce((sum, nodes) => sum + nodes.length, 0);

      if (totalActive >= maxConcurrent) {
        logger.warn(`[AudioEngine] Max concurrent sounds reached (${maxConcurrent})`);
        // 停止最舊的音效
        const oldestKey = Array.from(this.activeSourceNodes.keys())[0];
        this.stop(oldestKey);
      }

      // 建立音效源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = options.loop || false;

      // 連接到對應類型的 GainNode
      const type = this.getAudioType(soundId);
      const gainNode = this.gainNodes.get(type)!;

      if (options.volume !== undefined) {
        const volumeGain = this.audioContext.createGain();
        volumeGain.gain.value = options.volume;
        source.connect(volumeGain);
        volumeGain.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      // 追蹤活動音效
      if (!this.activeSourceNodes.has(soundId)) {
        this.activeSourceNodes.set(soundId, []);
      }
      this.activeSourceNodes.get(soundId)!.push(source);

      // 播放完成後清理
      source.onended = () => {
        const nodes = this.activeSourceNodes.get(soundId);
        if (nodes) {
          const index = nodes.indexOf(source);
          if (index > -1) {
            nodes.splice(index, 1);
          }
          if (nodes.length === 0) {
            this.activeSourceNodes.delete(soundId);
          }
        }
        options.onComplete?.();
      };

      // 開始播放
      source.start(0);

      const duration = performance.now() - startTime;
      if (duration > PLAYBACK_LATENCY_TARGET) {
        logger.warn(`[AudioEngine] Playback latency ${duration}ms exceeds target`);
      }
    } catch (error) {
      logger.error(`[AudioEngine] Failed to play ${soundId}`, error);
    }
  }

  /**
   * 停止特定音效的所有實例
   * @param {string} soundId - 要停止的音效 ID
   * @example
   * audioEngine.stop('background-music');
   */
  stop(soundId: string): void {
    const nodes = this.activeSourceNodes.get(soundId);
    if (nodes) {
      nodes.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {
          // 已停止，忽略錯誤
        }
      });
      this.activeSourceNodes.delete(soundId);
    }
  }

  /**
   * 停止所有正在播放的音效
   * @example
   * audioEngine.stopAll();
   */
  stopAll(): void {
    this.activeSourceNodes.forEach((_, soundId) => {
      this.stop(soundId);
    });
  }

  /**
   * 設定特定類型的音量
   * 需求 4.2-4.4: 即時調整音量
   *
   * @param {AudioType} type - 音訊類型（'sfx' | 'music' | 'voice'）
   * @param {number} volume - 音量值（0-1 之間）
   *
   * @example
   * audioEngine.setVolume('music', 0.5); // 設定音樂音量為 50%
   */
  setVolume(type: AudioType, volume: number): void {
    const gainNode = this.gainNodes.get(type);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 清除快取
   * 需求 5.3: IF 記憶體使用超過 50MB THEN 系統 SHALL 清除快取
   */
  clearCache(strategy: 'lru' | 'all'): void {
    if (strategy === 'all') {
      this.audioBuffers.clear();
      logger.info('[AudioEngine] Cleared all cache');
    } else if (strategy === 'lru') {
      this.evictLRU();
    }
  }

  /**
   * LRU 快取清除
   */
  private evictLRU(): void {
    const entries = Array.from(this.audioBuffers.entries())
      .filter(([_, cached]) => cached.priority !== 'critical')
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    let freedMemory = 0;
    const targetMemory = 40 * 1024 * 1024; // 釋放到 40MB

    for (const [id, cached] of entries) {
      this.audioBuffers.delete(id);
      freedMemory += cached.size;

      if (this.getMemoryUsage() < targetMemory) {
        break;
      }
    }

    logger.info(`[AudioEngine] Evicted ${(freedMemory / 1024 / 1024).toFixed(2)}MB from cache`);
  }

  /**
   * 獲取音訊系統當前記憶體使用量
   * @returns {number} 記憶體使用量（bytes）
   * @example
   * const memoryMB = audioEngine.getMemoryUsage() / 1024 / 1024;
   * console.log(`音訊記憶體: ${memoryMB.toFixed(2)}MB`);
   */
  getMemoryUsage(): number {
    let total = 0;
    this.audioBuffers.forEach((cached) => {
      total += cached.size;
    });
    return total;
  }

  /**
   * 獲取活動音效數量
   */
  getActiveSoundsCount(): number {
    return Array.from(this.activeSourceNodes.values())
      .reduce((sum, nodes) => sum + nodes.length, 0);
  }

  /**
   * 取得 AudioContext
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * 判斷音效類型 (從 soundId 推斷)
   */
  private getAudioType(soundId: string): AudioType {
    if (soundId.includes('music') || soundId.includes('ambient') || soundId.includes('theme')) {
      return 'music';
    }
    if (soundId.includes('voice') || soundId.includes('speech')) {
      return 'voice';
    }
    return 'sfx';
  }

  /**
   * 檢查是否已解鎖
   */
  isInitialized(): boolean {
    return this.isUnlocked;
  }

  /**
   * 開始 FPS 監控
   * 需求 9.3: 當 FPS 低於 30 時觸發降級
   * 任務 40: 實作 FPS 監控和自動降級
   */
  startFPSMonitoring(): void {
    if (this.fpsMonitorId !== null) return; // 已經在監控中

    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    const monitorFrame = () => {
      const now = performance.now();
      this.frameCount++;

      // 每秒計算一次 FPS
      if (now >= this.lastFrameTime + 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;

        // 檢查是否需要降級
        if (this.currentFPS < 30 && !this.isLowQualityMode) {
          logger.warn(`[AudioEngine] Low FPS detected (${this.currentFPS}), degrading audio quality`);
          this.degradeAudioQuality();
        } else if (this.currentFPS >= 50 && this.isLowQualityMode) {
          logger.info(`[AudioEngine] FPS recovered (${this.currentFPS}), restoring audio quality`);
          this.restoreAudioQuality();
        }
      }

      this.fpsMonitorId = requestAnimationFrame(monitorFrame);
    };

    this.fpsMonitorId = requestAnimationFrame(monitorFrame);
    logger.info('[AudioEngine] FPS monitoring started');
  }

  /**
   * 停止 FPS 監控
   */
  stopFPSMonitoring(): void {
    if (this.fpsMonitorId !== null) {
      cancelAnimationFrame(this.fpsMonitorId);
      this.fpsMonitorId = null;
      logger.info('[AudioEngine] FPS monitoring stopped');
    }
  }

  /**
   * 降級音訊品質
   * 需求 9.3: 降級策略 - 降低音效品質、關閉效果處理、減少並發數
   */
  private degradeAudioQuality(): void {
    this.isLowQualityMode = true;

    // 降低並發播放數
    const maxConcurrent = this.isMobile ? 2 : 4;

    // 停止非關鍵音效
    const criticalSoundIds = Array.from(this.audioBuffers.entries())
      .filter(([_, cached]) => cached.priority === 'critical')
      .map(([id]) => id);

    this.activeSourceNodes.forEach((_, soundId) => {
      if (!criticalSoundIds.includes(soundId)) {
        this.stop(soundId);
      }
    });

    // 降低音效音量
    const sfxGain = this.gainNodes.get('sfx');
    if (sfxGain) {
      sfxGain.gain.value = Math.min(sfxGain.gain.value, 0.5);
    }

    logger.info('[AudioEngine] Audio quality degraded due to low FPS');
  }

  /**
   * 恢復音訊品質
   */
  private restoreAudioQuality(): void {
    this.isLowQualityMode = false;
    logger.info('[AudioEngine] Audio quality restored');
  }

  /**
   * 獲取當前 FPS
   */
  getCurrentFPS(): number {
    return this.currentFPS;
  }

  /**
   * 開始記憶體洩漏偵測
   * 需求 9.5: 偵測記憶體持續增長並重新初始化 AudioContext
   * 任務 41: 實作記憶體洩漏偵測和恢復
   */
  startMemoryLeakDetection(): void {
    if (this.memoryCheckInterval !== null) return; // 已經在偵測中

    // 每 10 秒檢查一次記憶體
    this.memoryCheckInterval = window.setInterval(() => {
      const currentMemory = this.getMemoryUsage();

      // 檢查記憶體是否持續增長
      if (currentMemory > this.lastMemoryUsage) {
        this.memoryIncreaseCount++;

        // 如果連續 3 次檢查記憶體都在增長，視為洩漏徵兆
        if (this.memoryIncreaseCount >= 3) {
          const memoryMB = currentMemory / 1024 / 1024;
          logger.warn(`[AudioEngine] Potential memory leak detected (${memoryMB.toFixed(2)}MB)`);

          // 如果記憶體超過 80MB，執行恢復
          if (memoryMB > 80) {
            logger.error('[AudioEngine] Memory usage exceeded 80MB, reinitializing AudioContext');
            this.recoverFromMemoryLeak();
          }
        }
      } else {
        // 記憶體沒有增長，重置計數器
        this.memoryIncreaseCount = 0;
      }

      this.lastMemoryUsage = currentMemory;
    }, 10000); // 每 10 秒檢查一次

    logger.info('[AudioEngine] Memory leak detection started');
  }

  /**
   * 停止記憶體洩漏偵測
   */
  stopMemoryLeakDetection(): void {
    if (this.memoryCheckInterval !== null) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
      logger.info('[AudioEngine] Memory leak detection stopped');
    }
  }

  /**
   * 從記憶體洩漏中恢復
   * 需求 9.5: 重新初始化 AudioContext
   */
  private async recoverFromMemoryLeak(): Promise<void> {
    try {
      logger.info('[AudioEngine] Starting memory leak recovery');

      // 保存當前狀態
      const volumes = new Map<AudioType, number>();
      this.gainNodes.forEach((node, type) => {
        volumes.set(type, node.gain.value);
      });

      // 停止所有音效
      this.stopAll();

      // 清除所有快取
      this.clearCache('all');

      // 關閉舊的 AudioContext
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // 重新初始化
      this.isUnlocked = false;
      await this.initialize();

      // 恢復音量設定
      volumes.forEach((volume, type) => {
        this.setVolume(type, volume);
      });

      // 重新載入關鍵音效
      await this.preloadCriticalSounds();

      // 重置記憶體監控計數器
      this.memoryIncreaseCount = 0;
      this.lastMemoryUsage = 0;

      logger.info('[AudioEngine] Memory leak recovery completed');
    } catch (error) {
      logger.error('[AudioEngine] Failed to recover from memory leak', error);
    }
  }

  /**
   * 獲取詳細的效能指標
   */
  getPerformanceMetrics(): {
    fps: number;
    memoryMB: number;
    activeSounds: number;
    cachedSounds: number;
    isLowQuality: boolean;
    isLowBattery: boolean;
  } {
    return {
      fps: this.currentFPS,
      memoryMB: this.getMemoryUsage() / 1024 / 1024,
      activeSounds: this.getActiveSoundsCount(),
      cachedSounds: this.audioBuffers.size,
      isLowQuality: this.isLowQualityMode,
      isLowBattery: this.isLowBattery,
    };
  }

  /**
   * 設定頁面可見性控制
   * 需求 6.3, 6.4: 當應用程式進入背景時暫停音訊，回到前景時恢復
   * 任務 36: 實作背景/前景狀態管理
   */
  private setupVisibilityControl(): void {
    if (typeof document === 'undefined') return;

    this.visibilityChangeListener = () => {
      if (document.hidden) {
        // 應用程式進入背景
        this.handleAppBackground();
      } else {
        // 應用程式回到前景
        this.handleAppForeground();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeListener);
    logger.info('[AudioEngine] Visibility control setup completed');
  }

  /**
   * 處理應用程式進入背景
   * 需求 6.3: WHEN 應用程式進入背景 THEN 暫停所有音訊播放
   */
  private handleAppBackground(): void {
    logger.info('[AudioEngine] App went to background, pausing audio');

    // 保存當前播放狀態
    this.playbackStateBeforeBackground.clear();
    this.activeSourceNodes.forEach((_, soundId) => {
      this.playbackStateBeforeBackground.set(soundId, true);
    });

    // 暫停 AudioContext
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }

    // 停止所有活動音效（但保存狀態）
    // 注意：不呼叫 stopAll()，因為那會清除 activeSourceNodes
  }

  /**
   * 處理應用程式回到前景
   * 需求 6.4: WHEN 應用程式回到前景 THEN 恢復之前的播放狀態
   */
  private handleAppForeground(): void {
    logger.info('[AudioEngine] App returned to foreground, resuming audio');

    // 恢復 AudioContext
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 注意：由於 AudioBufferSourceNode 一旦停止就無法重新啟動
    // 我們只能恢復 AudioContext 的運行狀態
    // 實際的音效播放需要由上層應用決定是否重新播放
  }

  /**
   * 清理可見性監聽器
   */
  private cleanupVisibilityControl(): void {
    if (this.visibilityChangeListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener);
      this.visibilityChangeListener = null;
    }
  }

  /**
   * 偵測裝置靜音模式
   * 需求 6.2: IF 裝置處於靜音模式 THEN 偵測並在 UI 顯示靜音提示
   * 任務 37: 實作靜音模式偵測（行動裝置）
   */
  private detectSilentMode(): void {
    if (!this.isMobile || typeof window === 'undefined') return;

    // iOS 靜音模式偵測：嘗試播放極短的音訊並測量持續時間
    // 如果裝置靜音，播放會被抑制，持續時間會明顯不同
    setTimeout(async () => {
      if (!this.audioContext) return;

      try {
        const audioContext = this.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        gainNode.gain.value = 0.001; // 極小音量
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const startTime = audioContext.currentTime;
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.01); // 10ms 後停止

        // 監聽播放完成
        oscillator.onended = () => {
          const actualDuration = audioContext.currentTime - startTime;
          // 如果實際持續時間與預期差異很大，可能是靜音模式
          if (actualDuration < 0.005) {
            this.isSilentMode = true;
            logger.warn('[AudioEngine] Silent mode detected on device');
          }
        };
      } catch (error) {
        logger.error('[AudioEngine] Failed to detect silent mode', error);
      }
    }, 2000); // 延遲 2 秒後偵測，確保 AudioContext 已初始化
  }

  /**
   * 檢查裝置是否處於靜音模式
   */
  isSilentModeDetected(): boolean {
    return this.isSilentMode;
  }

  /**
   * 取得裝置資訊
   * 任務 34: 實作行動裝置偵測和優化邏輯
   */
  getDeviceInfo(): {
    isMobile: boolean;
    isIOS: boolean;
    isLowBattery: boolean;
    isSilentMode: boolean;
    batteryLevel: number | null;
  } {
    return {
      isMobile: this.isMobile,
      isIOS: this.isIOSDevice,
      isLowBattery: this.isLowBattery,
      isSilentMode: this.isSilentMode,
      batteryLevel: this.batteryManager?.level ?? null,
    };
  }

  /**
   * 銷毀 AudioEngine（清理資源）
   */
  async destroy(): Promise<void> {
    logger.info('[AudioEngine] Destroying AudioEngine');

    // 停止監控
    this.stopFPSMonitoring();
    this.stopMemoryLeakDetection();
    this.cleanupVisibilityControl();

    // 停止所有音效
    this.stopAll();

    // 清除快取
    this.clearCache('all');

    // 關閉 AudioContext
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.isUnlocked = false;
    logger.info('[AudioEngine] AudioEngine destroyed');
  }
}
