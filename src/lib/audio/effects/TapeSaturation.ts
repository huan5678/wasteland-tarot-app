/**
 * Tape Saturation Effect
 * 類比溫暖感和諧波失真 - 使用 WaveShaperNode (sigmoid/tanh 失真曲線)
 * 加入 BiquadFilterNode (Lowpass) 模擬磁帶高頻衰減
 *
 * 需求 7.5: Tape Saturation 效果 - 類比溫暖感
 * 參數: Drive, Tone, Mix
 *
 * 使用範例:
 * ```ts
 * const tapeSaturation = new TapeSaturation(audioContext);
 * tapeSaturation.setDrive(2.0);     // Drive amount (1-5)
 * tapeSaturation.setTone(6000);     // Tone (lowpass cutoff in Hz)
 * tapeSaturation.setMix(0.6);       // Wet/dry mix (0-1)
 *
 * source.connect(tapeSaturation.input);
 * tapeSaturation.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface TapeSaturationParams {
  /** Drive amount (預設: 2.0, 範圍: 1-5) */
  drive?: number;
  /** Tone (lowpass cutoff frequency in Hz, 預設: 6000Hz) */
  tone?: number;
  /** Wet/Dry mix (預設: 0.6) */
  mix?: number;
  /** Saturation curve type (預設: 'tanh') */
  curveType?: 'sigmoid' | 'tanh' | 'soft-clip';
}

export class TapeSaturation {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private preGain: GainNode;
  private postGain: GainNode;
  private shaper: WaveShaperNode;
  private toneFilter: BiquadFilterNode;

  // Parameters
  private drive: number;
  private tone: number;
  private mix: number;
  private curveType: 'sigmoid' | 'tanh' | 'soft-clip';

  constructor(audioContext: AudioContext, params: TapeSaturationParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.drive = params.drive ?? 2.0;
    this.tone = params.tone ?? 6000;
    this.mix = params.mix ?? 0.6;
    this.curveType = params.curveType ?? 'tanh';

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    // Pre-gain to boost signal before saturation
    this.preGain = this.audioContext.createGain();
    this.preGain.gain.value = this.drive;

    // Post-gain to compensate for saturation boost
    this.postGain = this.audioContext.createGain();
    this.updatePostGain();

    // Waveshaper for saturation
    this.shaper = this.audioContext.createWaveShaper();
    this.shaper.oversample = '4x'; // Reduce aliasing
    this.updateSaturationCurve();

    // Lowpass filter for tone control (simulates tape high-frequency rolloff)
    this.toneFilter = this.audioContext.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = this.tone;
    this.toneFilter.Q.value = 0.707; // Butterworth response

    // Setup effect chain
    this.setupEffectChain();
    this.updateMix();

    logger.info('[TapeSaturation] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow:
   * Input → (Dry + Wet) → Output
   * Wet Path:
   *   Input → PreGain → Shaper → ToneFilter → PostGain → WetGain
   */
  private setupEffectChain(): void {
    // Dry path (bypass)
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Wet path (saturation chain)
    this.inputNode.connect(this.preGain);
    this.preGain.connect(this.shaper);
    this.shaper.connect(this.toneFilter);
    this.toneFilter.connect(this.postGain);
    this.postGain.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);
  }

  /**
   * Update saturation curve based on curve type
   */
  private updateSaturationCurve(): void {
    const samples = 1024;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1; // -1 to 1

      switch (this.curveType) {
        case 'sigmoid':
          // Sigmoid saturation
          curve[i] = (2 / (1 + Math.exp(-this.drive * x))) - 1;
          break;

        case 'tanh':
          // Hyperbolic tangent (smooth tape-like saturation)
          curve[i] = Math.tanh(this.drive * x);
          break;

        case 'soft-clip':
          // Soft clipping
          const threshold = 1 / this.drive;
          if (Math.abs(x) < threshold) {
            curve[i] = this.drive * x;
          } else {
            curve[i] = Math.sign(x) * (threshold + (1 - threshold) * Math.tanh((Math.abs(x) - threshold) / (1 - threshold)));
          }
          break;
      }
    }

    this.shaper.curve = curve;
    logger.debug(`[TapeSaturation] Updated curve: ${this.curveType}, drive: ${this.drive}`);
  }

  /**
   * Update post-gain to compensate for drive boost
   * Higher drive = more gain reduction needed
   */
  private updatePostGain(): void {
    // Compensate for drive boost to maintain consistent output level
    this.postGain.gain.value = 1 / Math.sqrt(this.drive);
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
   * Set drive amount
   * @param value Drive (1-5, where 1=subtle, 5=heavy saturation)
   */
  setDrive(value: number): void {
    this.drive = Math.max(1, Math.min(5, value));
    this.preGain.gain.value = this.drive;
    this.updatePostGain();
    this.updateSaturationCurve();
    logger.debug(`[TapeSaturation] Drive set to ${this.drive}`);
  }

  /**
   * Set tone (lowpass cutoff frequency)
   * @param value Frequency in Hz (1000-10000)
   */
  setTone(value: number): void {
    this.tone = Math.max(1000, Math.min(10000, value));

    // Smooth parameter change
    const now = this.audioContext.currentTime;
    this.toneFilter.frequency.setValueAtTime(this.toneFilter.frequency.value, now);
    this.toneFilter.frequency.exponentialRampToValueAtTime(this.tone, now + 0.05);

    logger.debug(`[TapeSaturation] Tone set to ${this.tone}Hz`);
  }

  /**
   * Set wet/dry mix
   * @param value Mix amount (0-1, where 0=dry, 1=wet)
   */
  setMix(value: number): void {
    this.mix = Math.max(0, Math.min(1, value));
    this.updateMix();
    logger.debug(`[TapeSaturation] Mix set to ${this.mix}`);
  }

  /**
   * Set saturation curve type
   * @param type Curve type ('sigmoid', 'tanh', 'soft-clip')
   */
  setCurveType(type: 'sigmoid' | 'tanh' | 'soft-clip'): void {
    this.curveType = type;
    this.updateSaturationCurve();
    logger.debug(`[TapeSaturation] Curve type set to ${this.curveType}`);
  }

  /**
   * Set tone filter Q (resonance)
   * @param value Q value (0.1-10, 0.707=Butterworth)
   */
  setResonance(value: number): void {
    const q = Math.max(0.1, Math.min(10, value));
    this.toneFilter.Q.value = q;
    logger.debug(`[TapeSaturation] Resonance set to ${q}`);
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
    logger.debug(`[TapeSaturation] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): TapeSaturationParams {
    return {
      drive: this.drive,
      tone: this.tone,
      mix: this.mix,
      curveType: this.curveType,
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
      this.preGain.disconnect();
      this.postGain.disconnect();
      this.shaper.disconnect();
      this.toneFilter.disconnect();
      this.outputNode.disconnect();
      logger.info('[TapeSaturation] Disposed');
    } catch (e) {
      logger.warn('[TapeSaturation] Error during disposal:', e);
    }
  }
}
