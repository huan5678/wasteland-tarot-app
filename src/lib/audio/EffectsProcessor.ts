/**
 * EffectsProcessor - 音訊效果處理器
 * 需求 7: Fallout 主題音訊效果處理
 */

import type { AudioEffect } from './types';
import { logger } from '../logger';

export class EffectsProcessor {
  private audioContext: AudioContext;
  private effectsCache: Map<AudioEffect, AudioNode> = new Map();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * 建立效果鏈
   * 需求 7.1: WHEN 播放角色語音 THEN 系統 SHALL 套用對應濾鏡
   */
  createEffectsChain(effects: AudioEffect[]): AudioNode[] {
    const nodes: AudioNode[] = [];

    for (const effect of effects) {
      let node: AudioNode;

      // 嘗試從快取獲取
      const cached = this.effectsCache.get(effect);
      if (cached) {
        node = cached;
      } else {
        // 建立新效果節點
        switch (effect) {
          case 'reverb':
            node = this.createReverb();
            break;
          case '8bit':
            node = this.create8BitEffect();
            break;
          case 'radio':
            node = this.createRadioEffect();
            break;
          case 'distortion':
            node = this.createDistortion();
            break;
          default:
            logger.warn(`[EffectsProcessor] Unknown effect: ${effect}`);
            continue;
        }

        // 快取效果節點
        this.effectsCache.set(effect, node);
      }

      nodes.push(node);
    }

    return nodes;
  }

  /**
   * 建立 Reverb（迴響）效果
   * 需求 7.2: WHEN 使用者在 Vault 場景 THEN 系統 SHALL 套用迴響
   */
  private createReverb(): ConvolverNode {
    const convolver = this.audioContext.createConvolver();

    // 產生脈衝響應（impulse response）
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2; // 2 秒迴響
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // 指數衰減的白噪音
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolver.buffer = impulse;
    logger.info('[EffectsProcessor] Created reverb effect');
    return convolver;
  }

  /**
   * 建立 8-bit 降採樣效果
   * 需求 7.4: IF 使用者啟用經典模式 THEN 系統 SHALL 套用 8-bit 濾鏡
   */
  private create8BitEffect(): WaveShaperNode {
    const shaper = this.audioContext.createWaveShaper();

    // 建立降採樣曲線（模擬 8-bit 音質）
    const samples = 256;
    const curve = new Float32Array(samples);
    const bits = 4; // 4-bit 深度

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // 量化到 bits 位元
      const quantized = Math.round(x * Math.pow(2, bits)) / Math.pow(2, bits);
      curve[i] = quantized;
    }

    shaper.curve = curve;
    logger.info('[EffectsProcessor] Created 8-bit effect');
    return shaper;
  }

  /**
   * 建立無線電效果
   * 需求 7.1: 機械音、無線電效果
   */
  private createRadioEffect(): BiquadFilterNode {
    const filter = this.audioContext.createBiquadFilter();

    // 帶通濾波器模擬無線電頻率響應
    filter.type = 'bandpass';
    filter.frequency.value = 1000; // 中心頻率 1kHz
    filter.Q.value = 1.5; // 品質因數

    logger.info('[EffectsProcessor] Created radio effect');
    return filter;
  }

  /**
   * 建立類比失真效果
   * 需求 7.5: WHEN 終端機音效 THEN 系統 SHALL 套用類比失真
   */
  private createDistortion(): WaveShaperNode {
    const shaper = this.audioContext.createWaveShaper();

    // 建立失真曲線（sigmoid）
    const samples = 256;
    const curve = new Float32Array(samples);
    const amount = 50; // 失真量

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) /
                 (Math.PI + amount * Math.abs(x));
    }

    shaper.curve = curve;
    shaper.oversample = '4x'; // 過採樣減少失真

    logger.info('[EffectsProcessor] Created distortion effect');
    return shaper;
  }

  /**
   * 連接效果鏈
   * 需求 7.1: 效果節點連接順序管理
   */
  connectEffects(
    source: AudioNode,
    effects: AudioNode[],
    destination: AudioNode
  ): void {
    if (effects.length === 0) {
      source.connect(destination);
      return;
    }

    // 連接效果鏈：source → effect1 → effect2 → ... → destination
    let currentNode: AudioNode = source;

    for (const effect of effects) {
      currentNode.connect(effect);
      currentNode = effect;
    }

    currentNode.connect(destination);
  }

  /**
   * 套用效果到音源
   * 整合效果處理到播放流程
   */
  applyEffects(
    source: AudioBufferSourceNode,
    effectsChain: AudioEffect[],
    destination: AudioNode
  ): void {
    if (effectsChain.length === 0) {
      source.connect(destination);
      return;
    }

    const effectNodes = this.createEffectsChain(effectsChain);
    this.connectEffects(source, effectNodes, destination);

    logger.info(`[EffectsProcessor] Applied ${effectsChain.length} effects`);
  }

  /**
   * 清理效果節點
   */
  cleanup(): void {
    this.effectsCache.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {
        // 已斷開，忽略錯誤
      }
    });
    this.effectsCache.clear();
    logger.info('[EffectsProcessor] Cleaned up effects');
  }

  /**
   * 檢查效果是否支援
   */
  isEffectSupported(effect: AudioEffect): boolean {
    try {
      switch (effect) {
        case 'reverb':
          return 'createConvolver' in this.audioContext;
        case '8bit':
        case 'distortion':
          return 'createWaveShaper' in this.audioContext;
        case 'radio':
          return 'createBiquadFilter' in this.audioContext;
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  }
}
