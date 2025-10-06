/**
 * SpeechEngine - 語音合成引擎 (Singleton)
 * 需求 2: 語音合成系統 (TTS)
 */

import type { CharacterVoice, SpeechOptions, VoiceConfig } from './types';
import { DEFAULT_VOICE_CONFIGS } from './constants';
import { logger } from '../logger';

export class SpeechEngine {
  private static instance: SpeechEngine;
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceConfigs: Map<CharacterVoice, VoiceConfig> = new Map();
  private isSupported: boolean = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    this.initializeVoiceConfigs();
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): SpeechEngine {
    if (!SpeechEngine.instance) {
      SpeechEngine.instance = new SpeechEngine();
    }
    return SpeechEngine.instance;
  }

  /**
   * 初始化語音合成
   * 需求 2.6: IF 瀏覽器不支援 THEN 系統 SHALL 顯示錯誤並隱藏按鈕
   */
  initialize(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      logger.warn('[SpeechEngine] Web Speech API not supported');
      this.isSupported = false;
      return false;
    }

    this.synthesis = window.speechSynthesis;
    this.isSupported = true;

    // 載入可用語音
    this.loadVoices();

    // 監聽語音列表變化（某些瀏覽器異步載入）
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }

    logger.info('[SpeechEngine] Initialized successfully');
    return true;
  }

  /**
   * 載入可用語音
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    this.availableVoices = this.synthesis.getVoices();
    logger.info(`[SpeechEngine] Loaded ${this.availableVoices.length} voices`);
  }

  /**
   * 初始化角色語音配置
   * 需求 2.3: 角色語音預設配置
   */
  private initializeVoiceConfigs(): void {
    Object.entries(DEFAULT_VOICE_CONFIGS).forEach(([character, config]) => {
      this.voiceConfigs.set(character as CharacterVoice, {
        character: character as CharacterVoice,
        ...config,
      });
    });
  }

  /**
   * 合成並播放語音
   * 需求 2.1: WHEN 使用者啟用語音播放 THEN 系統 SHALL 朗讀文字
   * 需求 2.3: IF 使用者選擇特定角色語音 THEN 系統 SHALL 調整參數
   */
  speak(text: string, options: SpeechOptions = {}): void {
    if (!this.isSupported || !this.synthesis) {
      logger.warn('[SpeechEngine] Speech synthesis not supported');
      options.onError?.(new Error('Speech synthesis not supported'));
      return;
    }

    // 停止當前播放
    if (this.currentUtterance) {
      this.stop();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceConfig = options.voice
        ? this.voiceConfigs.get(options.voice)
        : this.voiceConfigs.get('pip_boy');

      if (voiceConfig) {
        utterance.pitch = voiceConfig.pitch;
        utterance.rate = voiceConfig.rate;
        utterance.volume = options.volume ?? voiceConfig.volume;

        // 嘗試匹配指定的語音
        if (voiceConfig.voiceName) {
          const voice = this.availableVoices.find(v =>
            v.name.includes(voiceConfig.voiceName!)
          );
          if (voice) {
            utterance.voice = voice;
          }
        }
      } else {
        utterance.volume = options.volume ?? 1.0;
      }

      // 進度追蹤
      // 需求 2.7: WHILE 語音播放中 THE 系統 SHALL 顯示視覺指示器
      if (options.onProgress) {
        utterance.onboundary = (event) => {
          options.onProgress!(event.charIndex);
        };
      }

      // 完成回調
      utterance.onend = () => {
        this.currentUtterance = null;
        options.onComplete?.();
      };

      // 錯誤處理
      utterance.onerror = (event) => {
        logger.error('[SpeechEngine] Speech error', event);
        this.currentUtterance = null;
        options.onError?.(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);

      logger.info(`[SpeechEngine] Speaking with voice: ${options.voice || 'pip_boy'}`);
    } catch (error) {
      logger.error('[SpeechEngine] Failed to speak', error);
      options.onError?.(error as Error);
    }
  }

  /**
   * 暫停語音播放
   * 需求 2.4: WHEN 點擊暫停 THEN 系統 SHALL 立即暫停
   */
  pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
      logger.info('[SpeechEngine] Paused');
    }
  }

  /**
   * 恢復語音播放
   */
  resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
      logger.info('[SpeechEngine] Resumed');
    }
  }

  /**
   * 停止語音播放
   * 需求 2.5: WHEN 點擊停止 THEN 系統 SHALL 停止並重置位置
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      logger.info('[SpeechEngine] Stopped');
    }
  }

  /**
   * 設定語音音量
   * 需求 4.4: WHEN 使用者調整語音音量 THEN 系統 SHALL 即時調整
   */
  setVolume(volume: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 獲取可用語音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * 設定角色語音配置
   * 需求 2.3: 自訂角色語音參數
   */
  setVoiceConfig(character: CharacterVoice, config: Partial<VoiceConfig>): void {
    const existing = this.voiceConfigs.get(character) || {
      character,
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
    };

    this.voiceConfigs.set(character, {
      ...existing,
      ...config,
    });

    logger.info(`[SpeechEngine] Updated voice config for ${character}`);
  }

  /**
   * 取得角色語音配置
   */
  getVoiceConfig(character: CharacterVoice): VoiceConfig | undefined {
    return this.voiceConfigs.get(character);
  }

  /**
   * 檢查是否支援
   */
  isSpeechSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 檢查是否正在播放
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }

  /**
   * 檢查是否暫停
   */
  isPaused(): boolean {
    return this.synthesis?.paused || false;
  }
}
