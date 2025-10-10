/**
 * Gated Reverb Effect
 * Synthwave 標誌性音效處理器 - 使用 ConvolverNode (Reverb) + DynamicsCompressorNode (Gate)
 *
 * 需求 7.1, 11.6: Synthwave Gated Reverb 效果
 * 參數: Gate Threshold, Attack/Release Time, Reverb Size, Decay Time
 *
 * 使用範例:
 * ```ts
 * const gatedReverb = new GatedReverb(audioContext);
 * gatedReverb.setThreshold(-30); // Gate threshold in dB
 * gatedReverb.setAttackTime(5);   // Attack time in ms
 * gatedReverb.setReleaseTime(100); // Release time in ms
 * gatedReverb.setReverbSize(2.5);  // Reverb size in seconds
 *
 * source.connect(gatedReverb.input);
 * gatedReverb.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface GatedReverbParams {
  /** Gate threshold in dB (預設: -30dB) */
  threshold?: number;
  /** Attack time in milliseconds (預設: 5ms) */
  attackTime?: number;
  /** Release time in milliseconds (預設: 100ms) */
  releaseTime?: number;
  /** Reverb size in seconds (預設: 2.5s) */
  reverbSize?: number;
  /** Decay time in seconds (預設: 3s) */
  decayTime?: number;
  /** Wet/Dry mix (0-1, 預設: 0.5) */
  mix?: number;
}

export class GatedReverb {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private convolver: ConvolverNode;
  private compressor: DynamicsCompressorNode;

  // Parameters
  private threshold: number;
  private attackTime: number;
  private releaseTime: number;
  private reverbSize: number;
  private decayTime: number;
  private mix: number;

  constructor(audioContext: AudioContext, params: GatedReverbParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.threshold = params.threshold ?? -30;
    this.attackTime = params.attackTime ?? 5;
    this.releaseTime = params.releaseTime ?? 100;
    this.reverbSize = params.reverbSize ?? 2.5;
    this.decayTime = params.decayTime ?? 3;
    this.mix = params.mix ?? 0.5;

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.convolver = this.audioContext.createConvolver();
    this.compressor = this.audioContext.createDynamicsCompressor();

    // Setup effect chain
    this.setupEffectChain();
    this.updateMix();

    logger.info('[GatedReverb] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow: Input → (Dry + Wet) → Output
   * Wet Path: Convolver → Compressor (Gate) → Wet Gain
   */
  private setupEffectChain(): void {
    // Dry path (bypass)
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Wet path (reverb + gate)
    this.inputNode.connect(this.convolver);
    this.convolver.connect(this.compressor);
    this.compressor.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);

    // Generate impulse response for reverb
    this.generateImpulseResponse();

    // Configure compressor as gate
    this.configureGate();
  }

  /**
   * Generate impulse response buffer for ConvolverNode
   * Creates a realistic reverb effect with exponential decay
   */
  private generateImpulseResponse(): void {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * this.decayTime);
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    const reverbSizeInSamples = Math.floor(sampleRate * this.reverbSize);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        // Early reflections (first reverbSize seconds)
        if (i < reverbSizeInSamples) {
          // Sparse reflections with exponential decay
          const reflectionDecay = Math.pow(1 - i / reverbSizeInSamples, 3);
          channelData[i] = (Math.random() * 2 - 1) * reflectionDecay;
        } else {
          // Late reverb tail
          const tailDecay = Math.pow(1 - (i - reverbSizeInSamples) / (length - reverbSizeInSamples), 4);
          channelData[i] = (Math.random() * 2 - 1) * tailDecay * 0.3;
        }
      }
    }

    this.convolver.buffer = impulse;
    logger.info(`[GatedReverb] Generated impulse response: ${this.reverbSize}s size, ${this.decayTime}s decay`);
  }

  /**
   * Configure compressor to act as a gate
   * Gate closes when signal falls below threshold
   */
  private configureGate(): void {
    // Compressor parameters for gating effect
    this.compressor.threshold.value = this.threshold; // dB
    this.compressor.knee.value = 0; // Hard knee for gate effect
    this.compressor.ratio.value = 20; // High ratio for gate
    this.compressor.attack.value = this.attackTime / 1000; // Convert ms to seconds
    this.compressor.release.value = this.releaseTime / 1000; // Convert ms to seconds

    logger.info(`[GatedReverb] Gate configured: threshold=${this.threshold}dB, attack=${this.attackTime}ms, release=${this.releaseTime}ms`);
  }

  /**
   * Update wet/dry mix
   */
  private updateMix(): void {
    this.wetGain.gain.value = this.mix;
    this.dryGain.gain.value = 1 - this.mix;
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
   * Set gate threshold in dB
   * @param value Threshold (-100 to 0 dB)
   */
  setThreshold(value: number): void {
    this.threshold = Math.max(-100, Math.min(0, value));
    this.compressor.threshold.value = this.threshold;
    logger.debug(`[GatedReverb] Threshold set to ${this.threshold}dB`);
  }

  /**
   * Set attack time in milliseconds
   * @param value Attack time (0-1000 ms)
   */
  setAttackTime(value: number): void {
    this.attackTime = Math.max(0, Math.min(1000, value));
    this.compressor.attack.value = this.attackTime / 1000;
    logger.debug(`[GatedReverb] Attack time set to ${this.attackTime}ms`);
  }

  /**
   * Set release time in milliseconds
   * @param value Release time (0-1000 ms)
   */
  setReleaseTime(value: number): void {
    this.releaseTime = Math.max(0, Math.min(1000, value));
    this.compressor.release.value = this.releaseTime / 1000;
    logger.debug(`[GatedReverb] Release time set to ${this.releaseTime}ms`);
  }

  /**
   * Set reverb size in seconds
   * @param value Reverb size (0.5-5 seconds)
   */
  setReverbSize(value: number): void {
    this.reverbSize = Math.max(0.5, Math.min(5, value));
    this.generateImpulseResponse(); // Regenerate impulse response
    logger.debug(`[GatedReverb] Reverb size set to ${this.reverbSize}s`);
  }

  /**
   * Set decay time in seconds
   * @param value Decay time (1-10 seconds)
   */
  setDecayTime(value: number): void {
    this.decayTime = Math.max(1, Math.min(10, value));
    this.generateImpulseResponse(); // Regenerate impulse response
    logger.debug(`[GatedReverb] Decay time set to ${this.decayTime}s`);
  }

  /**
   * Set wet/dry mix
   * @param value Mix amount (0-1, where 0=dry, 1=wet)
   */
  setMix(value: number): void {
    this.mix = Math.max(0, Math.min(1, value));
    this.updateMix();
    logger.debug(`[GatedReverb] Mix set to ${this.mix}`);
  }

  /**
   * Enable/disable bypass
   * @param bypass True to bypass effect
   */
  setBypass(bypass: boolean): void {
    if (bypass) {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
    } else {
      this.updateMix();
    }
    logger.debug(`[GatedReverb] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): GatedReverbParams {
    return {
      threshold: this.threshold,
      attackTime: this.attackTime,
      releaseTime: this.releaseTime,
      reverbSize: this.reverbSize,
      decayTime: this.decayTime,
      mix: this.mix,
    };
  }

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void {
    try {
      this.inputNode.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.convolver.disconnect();
      this.compressor.disconnect();
      this.outputNode.disconnect();
      logger.info('[GatedReverb] Disposed');
    } catch (e) {
      logger.warn('[GatedReverb] Error during disposal:', e);
    }
  }
}
