/**
 * Effect Chain Manager
 * 管理音效處理器的串接和順序
 *
 * 支援的效果處理器:
 * - Gated Reverb (Synthwave 標誌性音效)
 * - Ping-pong Delay (立體聲延遲)
 * - Chorus (音色寬度增強)
 * - Pitch Warble (Lofi 音高不穩定)
 * - Tape Saturation (類比溫暖感)
 * - Bit Crusher (Lofi 數位失真)
 *
 * 使用範例:
 * ```ts
 * const chain = new EffectChain(audioContext);
 *
 * // 建立 Synthwave Lofi 效果鏈
 * chain.addEffect('tapeSaturation', { drive: 2.5, tone: 6000, mix: 0.6 });
 * chain.addEffect('chorus', { rate: 1.0, depth: 7, voices: 3, mix: 0.5 });
 * chain.addEffect('pitchWarble', { rate: 0.3, depth: 10, randomness: 0.2 });
 * chain.addEffect('gatedReverb', { threshold: -30, reverbSize: 2.5, mix: 0.4 });
 *
 * source.connect(chain.input);
 * chain.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';
import { GatedReverb, GatedReverbParams } from './GatedReverb';
import { PingPongDelay, PingPongDelayParams } from './PingPongDelay';
import { Chorus, ChorusParams } from './Chorus';
import { PitchWarble, PitchWarbleParams } from './PitchWarble';
import { TapeSaturation, TapeSaturationParams } from './TapeSaturation';
import { BitCrusher, BitCrusherParams } from './BitCrusher';

export type EffectType =
  | 'gatedReverb'
  | 'pingPongDelay'
  | 'chorus'
  | 'pitchWarble'
  | 'tapeSaturation'
  | 'bitCrusher';

export type EffectParams =
  | GatedReverbParams
  | PingPongDelayParams
  | ChorusParams
  | PitchWarbleParams
  | TapeSaturationParams
  | BitCrusherParams;

export type EffectInstance =
  | GatedReverb
  | PingPongDelay
  | Chorus
  | PitchWarble
  | TapeSaturation
  | BitCrusher;

export interface EffectConfig {
  type: EffectType;
  params?: EffectParams;
  bypass?: boolean;
}

/**
 * 推薦的效果處理順序 (Signal Flow)
 * 根據需求文件附錄 E
 */
export const RECOMMENDED_ORDER: EffectType[] = [
  'tapeSaturation',    // 1. Distortion/Saturation
  'chorus',            // 2. Modulation Effects
  'pitchWarble',       // 3. Pitch Effects
  'pingPongDelay',     // 4. Delay
  'gatedReverb',       // 5. Reverb
  'bitCrusher',        // 6. Final degradation (optional)
];

export class EffectChain {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;

  // Effect instances
  private effects: Map<EffectType, EffectInstance> = new Map();
  private effectOrder: EffectType[] = [];

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;

    // Create input and output nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();

    // Initially connect input directly to output (empty chain)
    this.inputNode.connect(this.outputNode);

    logger.info('[EffectChain] Initialized');
  }

  /**
   * Add an effect to the chain
   * Effects are automatically ordered according to recommended signal flow
   * @param type Effect type
   * @param params Effect parameters
   */
  addEffect(type: EffectType, params?: EffectParams): void {
    // Remove existing effect of same type
    if (this.effects.has(type)) {
      this.removeEffect(type);
    }

    // Create effect instance
    const effect = this.createEffect(type, params);
    this.effects.set(type, effect);

    // Add to order and sort by recommended order
    this.effectOrder.push(type);
    this.sortEffectOrder();

    // Reconnect chain
    this.reconnectChain();

    logger.info(`[EffectChain] Added effect: ${type}`, params);
  }

  /**
   * Remove an effect from the chain
   * @param type Effect type to remove
   */
  removeEffect(type: EffectType): void {
    const effect = this.effects.get(type);
    if (!effect) return;

    // Dispose effect
    effect.dispose();

    // Remove from maps
    this.effects.delete(type);
    this.effectOrder = this.effectOrder.filter(t => t !== type);

    // Reconnect chain
    this.reconnectChain();

    logger.info(`[EffectChain] Removed effect: ${type}`);
  }

  /**
   * Get an effect instance by type
   * @param type Effect type
   */
  getEffect<T extends EffectInstance>(type: EffectType): T | undefined {
    return this.effects.get(type) as T | undefined;
  }

  /**
   * Clear all effects from the chain
   */
  clearEffects(): void {
    this.effects.forEach((effect) => {
      effect.dispose();
    });

    this.effects.clear();
    this.effectOrder = [];

    // Reconnect (empty chain)
    this.reconnectChain();

    logger.info('[EffectChain] Cleared all effects');
  }

  /**
   * Bypass a specific effect without removing it
   * @param type Effect type
   * @param bypass True to bypass
   */
  bypassEffect(type: EffectType, bypass: boolean): void {
    const effect = this.effects.get(type);
    if (!effect) {
      logger.warn(`[EffectChain] Effect not found: ${type}`);
      return;
    }

    effect.setBypass(bypass);
    logger.debug(`[EffectChain] ${type} bypass: ${bypass}`);
  }

  /**
   * Bypass entire effect chain
   * @param bypass True to bypass all effects
   */
  bypassAll(bypass: boolean): void {
    this.effects.forEach((effect, type) => {
      effect.setBypass(bypass);
    });
    logger.info(`[EffectChain] Bypass all: ${bypass}`);
  }

  /**
   * Load a preset configuration
   * @param configs Array of effect configurations
   */
  loadPreset(configs: EffectConfig[]): void {
    this.clearEffects();

    configs.forEach(({ type, params, bypass }) => {
      this.addEffect(type, params);
      if (bypass !== undefined) {
        this.bypassEffect(type, bypass);
      }
    });

    logger.info('[EffectChain] Loaded preset with', configs.length, 'effects');
  }

  /**
   * Get current chain configuration
   */
  getChainConfig(): EffectConfig[] {
    return this.effectOrder.map((type) => {
      const effect = this.effects.get(type)!;
      return {
        type,
        params: effect.getParams(),
      };
    });
  }

  /**
   * Create effect instance based on type
   */
  private createEffect(type: EffectType, params?: EffectParams): EffectInstance {
    switch (type) {
      case 'gatedReverb':
        return new GatedReverb(this.audioContext, params as GatedReverbParams);
      case 'pingPongDelay':
        return new PingPongDelay(this.audioContext, params as PingPongDelayParams);
      case 'chorus':
        return new Chorus(this.audioContext, params as ChorusParams);
      case 'pitchWarble':
        return new PitchWarble(this.audioContext, params as PitchWarbleParams);
      case 'tapeSaturation':
        return new TapeSaturation(this.audioContext, params as TapeSaturationParams);
      case 'bitCrusher':
        return new BitCrusher(this.audioContext, params as BitCrusherParams);
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
  }

  /**
   * Sort effect order according to recommended signal flow
   */
  private sortEffectOrder(): void {
    this.effectOrder.sort((a, b) => {
      const indexA = RECOMMENDED_ORDER.indexOf(a);
      const indexB = RECOMMENDED_ORDER.indexOf(b);
      return indexA - indexB;
    });
  }

  /**
   * Reconnect all effects in the correct order
   */
  private reconnectChain(): void {
    // Disconnect all nodes first
    try {
      this.inputNode.disconnect();
      this.effects.forEach((effect) => {
        effect.output.disconnect();
      });
    } catch (e) {
      // Already disconnected
    }

    // If no effects, connect input directly to output
    if (this.effectOrder.length === 0) {
      this.inputNode.connect(this.outputNode);
      logger.debug('[EffectChain] Empty chain: input → output');
      return;
    }

    // Connect effects in order
    let currentNode: AudioNode = this.inputNode;

    this.effectOrder.forEach((type, index) => {
      const effect = this.effects.get(type)!;

      currentNode.connect(effect.input);
      currentNode = effect.output;

      logger.debug(`[EffectChain] Connected: ${index === 0 ? 'input' : this.effectOrder[index - 1]} → ${type}`);
    });

    // Connect last effect to output
    currentNode.connect(this.outputNode);
    logger.debug(`[EffectChain] Connected: ${this.effectOrder[this.effectOrder.length - 1]} → output`);
  }

  /**
   * Start all effects that require initialization (e.g., LFOs in Chorus, PitchWarble)
   */
  startEffects(): void {
    this.effects.forEach((effect, type) => {
      if ('start' in effect && typeof effect.start === 'function') {
        effect.start();
        logger.debug(`[EffectChain] Started effect: ${type}`);
      }
    });
  }

  /**
   * Stop all effects
   */
  stopEffects(): void {
    this.effects.forEach((effect, type) => {
      if ('stop' in effect && typeof effect.stop === 'function') {
        effect.stop();
        logger.debug(`[EffectChain] Stopped effect: ${type}`);
      }
    });
  }

  // === Public API ===

  /**
   * Get input node for connecting audio source
   */
  get input(): AudioNode {
    return this.inputNode;
  }

  /**
   * Get output node for connecting to destination
   */
  get output(): AudioNode {
    return this.outputNode;
  }

  /**
   * Get number of effects in chain
   */
  get effectCount(): number {
    return this.effects.size;
  }

  /**
   * Get effect order
   */
  get order(): EffectType[] {
    return [...this.effectOrder];
  }

  /**
   * Cleanup and dispose all effects
   */
  dispose(): void {
    try {
      this.stopEffects();
      this.clearEffects();

      this.inputNode.disconnect();
      this.outputNode.disconnect();

      logger.info('[EffectChain] Disposed');
    } catch (e) {
      logger.warn('[EffectChain] Error during disposal:', e);
    }
  }
}

/**
 * Synthwave Lofi 預設效果鏈配置
 */
export const SYNTHWAVE_LOFI_PRESET: EffectConfig[] = [
  {
    type: 'tapeSaturation',
    params: {
      drive: 2.0,
      tone: 6000,
      mix: 0.6,
      curveType: 'tanh',
    },
  },
  {
    type: 'chorus',
    params: {
      rate: 1.0,
      depth: 7,
      voices: 3,
      mix: 0.5,
    },
  },
  {
    type: 'pitchWarble',
    params: {
      rate: 0.3,
      depth: 10,
      randomness: 0.2,
    },
  },
  {
    type: 'gatedReverb',
    params: {
      threshold: -30,
      attackTime: 5,
      releaseTime: 100,
      reverbSize: 2.5,
      mix: 0.3,
    },
  },
];

/**
 * Synthwave 預設效果鏈配置 (較明亮)
 */
export const SYNTHWAVE_PRESET: EffectConfig[] = [
  {
    type: 'chorus',
    params: {
      rate: 1.5,
      depth: 5,
      voices: 3,
      mix: 0.4,
    },
  },
  {
    type: 'pingPongDelay',
    params: {
      delayTime: 375,
      feedback: 0.5,
      mix: 0.3,
    },
  },
  {
    type: 'gatedReverb',
    params: {
      threshold: -25,
      attackTime: 5,
      releaseTime: 80,
      reverbSize: 2.0,
      mix: 0.4,
    },
  },
];

/**
 * Heavy Lofi 預設效果鏈配置
 */
export const HEAVY_LOFI_PRESET: EffectConfig[] = [
  {
    type: 'bitCrusher',
    params: {
      bitDepth: 8,
      sampleRateReduction: 4,
      mix: 0.8,
    },
  },
  {
    type: 'tapeSaturation',
    params: {
      drive: 3.0,
      tone: 5000,
      mix: 0.7,
    },
  },
  {
    type: 'pitchWarble',
    params: {
      rate: 0.2,
      depth: 15,
      randomness: 0.3,
    },
  },
];
