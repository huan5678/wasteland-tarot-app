/**
 * MusicGenerator - Synthwave Lofi 音樂生成器
 * 需求 3, 7, 10, 11: 使用 ProceduralMusicEngine 生成實時 Synthwave Lofi 音樂
 *
 * 注意：此檔案已重構為使用新的 ProceduralMusicEngine
 * 舊的基礎音樂生成函數已移除，改用進階的合成器系統
 */

import { ProceduralMusicEngine, type MusicMode, type ComplexityLevel } from './ProceduralMusicEngine';
import { logger } from '../logger';

/**
 * 音樂生成器類別
 * 封裝 ProceduralMusicEngine 提供簡化的介面
 */
export class MusicGenerator {
  private engine: ProceduralMusicEngine;
  private audioContext: AudioContext;
  private isPlaying: boolean = false;

  constructor(audioContext: AudioContext, destination: AudioNode) {
    this.audioContext = audioContext;
    this.engine = new ProceduralMusicEngine(audioContext, destination, 'synthwave');
  }

  /**
   * 開始播放音樂
   * @param mode - 音樂模式 ('lofi' | 'synthwave' | 'ambient' | 'divination')
   * @param complexity - 複雜度 ('simple' | 'standard' | 'rich')
   */
  start(mode: MusicMode = 'synthwave', complexity: ComplexityLevel = 'standard'): void {
    if (this.isPlaying) {
      logger.warn('[MusicGenerator] Already playing, stopping first');
      this.stop();
    }

    this.engine.switchMode(mode, complexity);
    this.engine.start();
    this.isPlaying = true;
    logger.info(`[MusicGenerator] Started ${mode} music with ${complexity} complexity`);
  }

  /**
   * 停止播放音樂
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.engine.stop();
    this.isPlaying = false;
    logger.info('[MusicGenerator] Stopped music');
  }

  /**
   * 切換音樂模式
   * @param mode - 新的音樂模式
   * @param complexity - 複雜度（可選）
   */
  switchMode(mode: MusicMode, complexity?: ComplexityLevel): void {
    this.engine.switchMode(mode, complexity);
    logger.info(`[MusicGenerator] Switched to ${mode} mode`);
  }

  /**
   * 設定音量
   * @param volume - 音量 (0-1)
   */
  setVolume(volume: number): void {
    this.engine.setVolume(volume);
  }

  /**
   * 設定 BPM
   * @param bpm - BPM 值
   */
  setBPM(bpm: number): void {
    this.engine.setBPM(bpm);
  }

  /**
   * 檢查是否正在播放
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 取得當前模式
   */
  getCurrentMode(): MusicMode {
    return this.engine.getCurrentMode();
  }

  /**
   * 銷毀音樂生成器
   */
  dispose(): void {
    this.stop();
    this.engine.dispose();
  }
}

/**
 * Task 7.7: 移除自動場景音樂系統
 * 保留此映射表作為參考，但不再自動根據場景切換音樂
 * 所有音樂播放由使用者主動控制
 *
 * @deprecated 不再使用自動場景音樂
 */
export const SCENE_TO_MUSIC_MODE: Record<string, MusicMode> = {
  '/': 'synthwave',              // 主頁 - Synthwave
  '/readings/new': 'divination', // 占卜頁面 - Divination
  '/readings/quick': 'divination',
  '/dashboard': 'lofi',          // 控制面板 - Lofi
  '/profile': 'lofi',
  '/cards': 'ambient',           // 卡牌頁面 - Ambient
} as const;

/**
 * 根據場景路徑取得音樂模式
 * @deprecated 不再使用自動場景音樂，保留作為參考
 * @param scenePath - 場景路徑
 * @returns 對應的音樂模式
 */
export function getMusicModeForScene(scenePath: string): MusicMode {
  return SCENE_TO_MUSIC_MODE[scenePath] || 'synthwave';
}
