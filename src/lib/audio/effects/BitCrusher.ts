/**
 * Bit Crusher Effect
 * Lofi 數位失真 - 使用 AudioWorkletNode 或 ScriptProcessorNode
 * 量化音訊樣本模擬低位元深度
 *
 * 需求 7.6: Bit Crushing 效果 - Lofi 數位失真
 * 參數: Bit Depth (4-16 bit), Sample Rate Reduction
 *
 * 使用範例:
 * ```ts
 * const bitCrusher = new BitCrusher(audioContext);
 * bitCrusher.setBitDepth(10);          // Bit depth (4-16)
 * bitCrusher.setSampleRateReduction(4); // Sample rate reduction factor
 * bitCrusher.setMix(0.7);              // Wet/dry mix (0-1)
 *
 * source.connect(bitCrusher.input);
 * bitCrusher.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface BitCrusherParams {
  /** Bit depth (預設: 10, 範圍: 4-16) */
  bitDepth?: number;
  /** Sample rate reduction factor (預設: 4, 範圍: 1-20) */
  sampleRateReduction?: number;
  /** Wet/Dry mix (預設: 0.7) */
  mix?: number;
}

export class BitCrusher {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private processor: ScriptProcessorNode | null = null;

  // Parameters
  private bitDepth: number;
  private sampleRateReduction: number;
  private mix: number;

  // Processing state
  private phaseAccumulator: number = 0;
  private lastSampleLeft: number = 0;
  private lastSampleRight: number = 0;

  constructor(audioContext: AudioContext, params: BitCrusherParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.bitDepth = params.bitDepth ?? 10;
    this.sampleRateReduction = params.sampleRateReduction ?? 4;
    this.mix = params.mix ?? 0.7;

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    // Create script processor
    // Buffer size 4096 for balance between latency and performance
    this.processor = this.audioContext.createScriptProcessor(4096, 2, 2);
    this.processor.onaudioprocess = this.processAudio.bind(this);

    // Setup effect chain
    this.setupEffectChain();
    this.updateMix();

    logger.info('[BitCrusher] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow:
   * Input → (Dry + Wet) → Output
   * Wet Path:
   *   Input → ScriptProcessor (bit crushing) → WetGain
   */
  private setupEffectChain(): void {
    // Dry path (bypass)
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Wet path (bit crushing)
    if (this.processor) {
      this.inputNode.connect(this.processor);
      this.processor.connect(this.wetGain);
      this.wetGain.connect(this.outputNode);
    }
  }

  /**
   * Audio processing callback
   * Applies bit depth reduction and sample rate reduction
   */
  private processAudio(event: AudioProcessingEvent): void {
    const inputL = event.inputBuffer.getChannelData(0);
    const inputR = event.inputBuffer.getChannelData(1);
    const outputL = event.outputBuffer.getChannelData(0);
    const outputR = event.outputBuffer.getChannelData(1);

    const bufferSize = inputL.length;

    // Calculate quantization step size based on bit depth
    const levels = Math.pow(2, this.bitDepth);
    const step = 2 / levels;

    for (let i = 0; i < bufferSize; i++) {
      // Sample rate reduction
      // Only process every Nth sample, hold the value for the rest
      this.phaseAccumulator++;

      if (this.phaseAccumulator >= this.sampleRateReduction) {
        this.phaseAccumulator = 0;

        // Bit depth reduction (quantization)
        // Map input range [-1, 1] to quantized levels
        this.lastSampleLeft = this.quantize(inputL[i], step);
        this.lastSampleRight = this.quantize(inputR[i], step);
      }

      // Output the held sample (creates sample rate reduction effect)
      outputL[i] = this.lastSampleLeft;
      outputR[i] = this.lastSampleRight;
    }
  }

  /**
   * Quantize a sample to the specified bit depth
   * @param sample Input sample (-1 to 1)
   * @param step Quantization step size
   */
  private quantize(sample: number, step: number): number {
    // Clamp input to [-1, 1]
    const clamped = Math.max(-1, Math.min(1, sample));

    // Quantize to nearest step
    const quantized = Math.round(clamped / step) * step;

    return quantized;
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
   * Set bit depth
   * @param value Bit depth (4-16, where 4=extreme lo-fi, 16=minimal effect)
   */
  setBitDepth(value: number): void {
    this.bitDepth = Math.max(4, Math.min(16, Math.floor(value)));
    logger.debug(`[BitCrusher] Bit depth set to ${this.bitDepth}`);
  }

  /**
   * Set sample rate reduction factor
   * @param value Reduction factor (1-20, where 1=no reduction, 20=extreme)
   */
  setSampleRateReduction(value: number): void {
    this.sampleRateReduction = Math.max(1, Math.min(20, Math.floor(value)));
    this.phaseAccumulator = 0; // Reset phase
    logger.debug(`[BitCrusher] Sample rate reduction set to ${this.sampleRateReduction}`);
  }

  /**
   * Set wet/dry mix
   * @param value Mix amount (0-1, where 0=dry, 1=wet)
   */
  setMix(value: number): void {
    this.mix = Math.max(0, Math.min(1, value));
    this.updateMix();
    logger.debug(`[BitCrusher] Mix set to ${this.mix}`);
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
    logger.debug(`[BitCrusher] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): BitCrusherParams {
    return {
      bitDepth: this.bitDepth,
      sampleRateReduction: this.sampleRateReduction,
      mix: this.mix,
    };
  }

  /**
   * Get effective sample rate after reduction
   */
  getEffectiveSampleRate(): number {
    return this.audioContext.sampleRate / this.sampleRateReduction;
  }

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void {
    try {
      this.inputNode.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();

      if (this.processor) {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
        this.processor = null;
      }

      this.outputNode.disconnect();

      logger.info('[BitCrusher] Disposed');
    } catch (e) {
      logger.warn('[BitCrusher] Error during disposal:', e);
    }
  }
}
