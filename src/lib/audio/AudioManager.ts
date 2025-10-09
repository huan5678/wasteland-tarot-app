/**
 * AudioManager - 高階音效管理器
 * 統一管理音效系統的初始化、載入、播放和錯誤處理
 */

import { AudioEngine } from './AudioEngine'
import { logger } from '../logger'
import type { SoundConfig } from './types'

export class AudioManager {
  private static instance: AudioManager
  private audioEngine: AudioEngine
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null
  private autoInitOnInteraction: boolean = true

  private constructor() {
    this.audioEngine = AudioEngine.getInstance()
    this.setupAutoInitialization()
  }

  /**
   * 獲取 AudioManager 單例
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * 設定自動初始化
   * 在用戶首次互動時自動初始化 AudioContext
   */
  private setupAutoInitialization(): void {
    if (typeof window === 'undefined') return

    const initOnInteraction = async () => {
      if (this.isInitialized || this.initializationPromise) return

      try {
        await this.initialize()
        logger.info('[AudioManager] Auto-initialized on user interaction')
      } catch (error) {
        logger.warn('[AudioManager] Auto-initialization failed, will retry on next interaction', error)
      }
    }

    // 監聽多種用戶互動事件
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      window.addEventListener(event, initOnInteraction, { once: true, passive: true })
    })
  }

  /**
   * 手動初始化音效系統
   * 應該在用戶互動後調用
   */
  async initialize(): Promise<void> {
    // 如果已經在初始化中，返回現有的 Promise
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // 如果已經初始化，直接返回
    if (this.isInitialized) {
      return Promise.resolve()
    }

    this.initializationPromise = (async () => {
      try {
        await this.audioEngine.initialize()
        this.isInitialized = true
        logger.info('[AudioManager] Initialized successfully')
      } catch (error) {
        logger.error('[AudioManager] Initialization failed', error)
        // 不拋出錯誤，使用靜默模式
        this.initializationPromise = null
      }
    })()

    return this.initializationPromise
  }

  /**
   * 預載音效列表
   */
  async preloadSounds(soundList: SoundConfig[]): Promise<void> {
    // 確保音效引擎已初始化
    if (!this.isInitialized) {
      logger.warn('[AudioManager] Not initialized, attempting to initialize...')
      try {
        await this.initialize()
      } catch (error) {
        logger.error('[AudioManager] Failed to initialize, sounds will not be preloaded')
        return
      }
    }

    try {
      await this.audioEngine.preloadSounds(soundList)
      logger.info(`[AudioManager] Preloaded ${soundList.length} sounds`)
    } catch (error) {
      logger.error('[AudioManager] Failed to preload sounds', error)
      // 不拋出錯誤，靜默失敗
    }
  }

  /**
   * 播放音效（安全模式）
   * 如果音效系統未初始化或發生錯誤，靜默失敗
   */
  async playSound(soundId: string, options: any = {}): Promise<void> {
    if (!this.isInitialized) {
      logger.warn(`[AudioManager] Cannot play sound '${soundId}': not initialized`)
      return
    }

    try {
      await this.audioEngine.play(soundId, options)
    } catch (error) {
      logger.warn(`[AudioManager] Failed to play sound '${soundId}'`, error)
      // 靜默失敗，不影響應用程式運行
    }
  }

  /**
   * 停止音效
   */
  stopSound(soundId: string): void {
    if (!this.isInitialized) {
      return
    }

    try {
      this.audioEngine.stop(soundId)
    } catch (error) {
      logger.warn(`[AudioManager] Failed to stop sound '${soundId}'`, error)
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    if (!this.isInitialized) {
      return
    }

    try {
      this.audioEngine.stopAll()
    } catch (error) {
      logger.warn('[AudioManager] Failed to stop all sounds', error)
    }
  }

  /**
   * 設定音量
   */
  setVolume(type: 'sfx' | 'music' | 'voice', volume: number): void {
    if (!this.isInitialized) {
      logger.warn('[AudioManager] Cannot set volume: not initialized')
      return
    }

    try {
      this.audioEngine.setVolume(type, volume)
    } catch (error) {
      logger.warn(`[AudioManager] Failed to set volume for ${type}`, error)
    }
  }

  /**
   * 取得初始化狀態
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * 取得音效引擎實例（進階使用）
   */
  getEngine(): AudioEngine {
    return this.audioEngine
  }

  /**
   * 清除快取
   */
  clearCache(strategy: 'lru' | 'all' = 'lru'): void {
    if (!this.isInitialized) {
      return
    }

    try {
      this.audioEngine.clearCache(strategy)
    } catch (error) {
      logger.warn('[AudioManager] Failed to clear cache', error)
    }
  }

  /**
   * 取得記憶體使用狀況
   */
  getMemoryUsage(): number {
    if (!this.isInitialized) {
      return 0
    }

    try {
      return this.audioEngine.getMemoryUsage()
    } catch (error) {
      logger.warn('[AudioManager] Failed to get memory usage', error)
      return 0
    }
  }

  /**
   * 取得電池狀態
   */
  getBatteryStatus(): { level: number; charging: boolean; lowBattery: boolean } | null {
    if (!this.isInitialized) {
      return null
    }

    try {
      return this.audioEngine.getBatteryStatus()
    } catch (error) {
      logger.warn('[AudioManager] Failed to get battery status', error)
      return null
    }
  }
}

// 導出單例實例
export const audioManager = AudioManager.getInstance()
