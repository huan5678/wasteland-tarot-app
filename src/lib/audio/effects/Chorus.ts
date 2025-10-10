/**
 * Chorus Effect
 * 增加音色寬度和溫暖感 - 使用 DelayNode + LFO (OscillatorNode 調變延遲時間)
 *
 * 需求 7.3: Chorus 效果增加音色寬度和溫暖感
 * 參數: Rate, Depth, Voices (2-4 個), Mix
 *
 * 使用範例:
 * ```ts
 * const chorus = new Chorus(audioContext);
 * chorus.setRate(1.0);       // LFO rate in Hz
 * chorus.setDepth(7);        // Depth in ms
 * chorus.setVoices(3);       // Number of voices
 * chorus.setMix(0.5);        // Wet/dry mix (0-1)
 *
 * source.connect(chorus.input);
 * chorus.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface ChorusParams {
  /** LFO rate in Hz (預設: 1.0Hz) */
  rate?: number;
  /** Modulation depth in milliseconds (預設: 7ms) */
  depth?: number;
  /** Number of chorus voices (預設: 3, 範圍: 2-4) */
  voices?: number;
  /** Wet/Dry mix (預設: 0.5) */
  mix?: number;
  /** Base delay time in milliseconds (預設: 20ms) */
  baseDelay?: number;
}

interface ChorusVoice {
  delay: DelayNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  detune: number; // Phase offset in degrees
}

export class Chorus {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private voiceMixer: GainNode;

  // Chorus voices
  private voices: ChorusVoice[] = [];

  // Parameters
  private rate: number;
  private depth: number;
  private numVoices: number;
  private mix: number;
  private baseDelay: number;
  private isStarted: boolean = false;

  constructor(audioContext: AudioContext, params: ChorusParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.rate = params.rate ?? 1.0;
    this.depth = params.depth ?? 7;
    this.numVoices = Math.max(2, Math.min(4, params.voices ?? 3));
    this.mix = params.mix ?? 0.5;
    this.baseDelay = params.baseDelay ?? 20;

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.voiceMixer = this.audioContext.createGain();

    // Setup effect chain
    this.setupEffectChain();
    this.updateMix();

    logger.info('[Chorus] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow:
   * Input → (Dry + Wet) → Output
   * Wet Path:
   *   Input → [Voice1, Voice2, Voice3, Voice4] → VoiceMixer → WetGain
   * Each Voice:
   *   Delay (modulated by LFO)
   */
  private setupEffectChain(): void {
    // Dry path (bypass)
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Create chorus voices with phase-shifted LFOs
    for (let i = 0; i < this.numVoices; i++) {
      const voice = this.createChorusVoice(i);
      this.voices.push(voice);

      // Connect input to each voice's delay
      this.inputNode.connect(voice.delay);
      voice.delay.connect(this.voiceMixer);
    }

    // Normalize voice mixer gain to prevent clipping
    this.voiceMixer.gain.value = 1 / this.numVoices;

    // Wet output
    this.voiceMixer.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);
  }

  /**
   * Create a chorus voice with LFO-modulated delay
   * @param index Voice index (0-3)
   */
  private createChorusVoice(index: number): ChorusVoice {
    // Create delay node
    const delay = this.audioContext.createDelay(0.1); // Max 100ms delay
    const baseDelaySeconds = this.baseDelay / 1000;
    delay.delayTime.value = baseDelaySeconds;

    // Create LFO (Low Frequency Oscillator)
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = this.rate;

    // Create LFO gain to control modulation depth
    const lfoGain = this.audioContext.createGain();
    const depthSeconds = this.depth / 1000;
    lfoGain.gain.value = depthSeconds;

    // Connect LFO to delay time modulation
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);

    // Calculate phase offset for voice (spread evenly across 360 degrees)
    const detune = (360 / this.numVoices) * index;

    return {
      delay,
      lfo,
      lfoGain,
      detune,
    };
  }

  /**
   * Start all LFOs
   */
  start(): void {
    if (this.isStarted) return;

    const now = this.audioContext.currentTime;

    // Start each LFO with phase offset
    this.voices.forEach((voice) => {
      // Phase offset: convert degrees to time offset based on LFO frequency
      const phaseOffsetSeconds = (voice.detune / 360) / this.rate;
      voice.lfo.start(now + phaseOffsetSeconds);
    });

    this.isStarted = true;
    logger.info('[Chorus] Started LFOs');
  }

  /**
   * Stop all LFOs
   */
  stop(): void {
    if (!this.isStarted) return;

    const now = this.audioContext.currentTime;

    this.voices.forEach((voice) => {
      try {
        voice.lfo.stop(now);
      } catch (e) {
        // Already stopped
      }
    });

    this.isStarted = false;
    logger.info('[Chorus] Stopped LFOs');
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
   * Set LFO rate in Hz
   * @param value Rate (0.1-10 Hz)
   */
  setRate(value: number): void {
    this.rate = Math.max(0.1, Math.min(10, value));

    this.voices.forEach((voice) => {
      voice.lfo.frequency.setValueAtTime(this.rate, this.audioContext.currentTime);
    });

    logger.debug(`[Chorus] Rate set to ${this.rate}Hz`);
  }

  /**
   * Set modulation depth in milliseconds
   * @param value Depth (1-20 ms)
   */
  setDepth(value: number): void {
    this.depth = Math.max(1, Math.min(20, value));
    const depthSeconds = this.depth / 1000;

    this.voices.forEach((voice) => {
      voice.lfoGain.gain.setValueAtTime(depthSeconds, this.audioContext.currentTime);
    });

    logger.debug(`[Chorus] Depth set to ${this.depth}ms`);
  }

  /**
   * Set number of chorus voices
   * Note: Requires recreation of effect chain
   * @param value Number of voices (2-4)
   */
  setVoices(value: number): void {
    const newVoices = Math.max(2, Math.min(4, value));
    if (newVoices === this.numVoices) return;

    logger.info(`[Chorus] Changing voices from ${this.numVoices} to ${newVoices}`);

    // Stop and disconnect old voices
    this.stop();
    this.voices.forEach((voice) => {
      voice.delay.disconnect();
      voice.lfo.disconnect();
      voice.lfoGain.disconnect();
    });
    this.voices = [];

    // Update voice count
    this.numVoices = newVoices;

    // Recreate voices
    for (let i = 0; i < this.numVoices; i++) {
      const voice = this.createChorusVoice(i);
      this.voices.push(voice);

      this.inputNode.connect(voice.delay);
      voice.delay.connect(this.voiceMixer);
    }

    // Update mixer gain
    this.voiceMixer.gain.value = 1 / this.numVoices;

    // Restart if was playing
    this.start();
  }

  /**
   * Set wet/dry mix
   * @param value Mix amount (0-1, where 0=dry, 1=wet)
   */
  setMix(value: number): void {
    this.mix = Math.max(0, Math.min(1, value));
    this.updateMix();
    logger.debug(`[Chorus] Mix set to ${this.mix}`);
  }

  /**
   * Set base delay time in milliseconds
   * @param value Base delay (10-50 ms)
   */
  setBaseDelay(value: number): void {
    this.baseDelay = Math.max(10, Math.min(50, value));
    const baseDelaySeconds = this.baseDelay / 1000;

    this.voices.forEach((voice) => {
      voice.delay.delayTime.setValueAtTime(baseDelaySeconds, this.audioContext.currentTime);
    });

    logger.debug(`[Chorus] Base delay set to ${this.baseDelay}ms`);
  }

  /**
   * Enable/disable bypass
   * @param bypass True to bypass effect
   */
  setBypass(bypass: boolean): void {
    if (bypass) {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
      this.stop();
    } else {
      this.updateMix();
      this.start();
    }
    logger.debug(`[Chorus] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): ChorusParams {
    return {
      rate: this.rate,
      depth: this.depth,
      voices: this.numVoices,
      mix: this.mix,
      baseDelay: this.baseDelay,
    };
  }

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void {
    try {
      this.stop();

      this.voices.forEach((voice) => {
        voice.delay.disconnect();
        voice.lfo.disconnect();
        voice.lfoGain.disconnect();
      });

      this.inputNode.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.voiceMixer.disconnect();
      this.outputNode.disconnect();

      this.voices = [];

      logger.info('[Chorus] Disposed');
    } catch (e) {
      logger.warn('[Chorus] Error during disposal:', e);
    }
  }
}
