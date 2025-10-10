/**
 * Pitch Warble Effect
 * Lofi 音色特徵 - 模擬磁帶不穩定效果
 * 使用超低頻 LFO 調變音高，加入隨機擾動模擬機械不穩定
 *
 * 需求 7.4: Lofi Pitch Warble 效果
 * 參數: Rate, Depth, Randomness
 *
 * 使用範例:
 * ```ts
 * const pitchWarble = new PitchWarble(audioContext);
 * pitchWarble.setRate(0.3);         // LFO rate in Hz
 * pitchWarble.setDepth(10);         // Depth in cents
 * pitchWarble.setRandomness(0.2);   // Randomness amount (0-1)
 *
 * source.connect(pitchWarble.input);
 * pitchWarble.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface PitchWarbleParams {
  /** LFO rate in Hz (預設: 0.3Hz) */
  rate?: number;
  /** Pitch modulation depth in cents (預設: 10 cents) */
  depth?: number;
  /** Randomness amount 0-1 (預設: 0.2) */
  randomness?: number;
  /** Update interval for random wobble in ms (預設: 200ms) */
  updateInterval?: number;
}

export class PitchWarble {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private delayNode: DelayNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  // Random wobble
  private randomLfo: OscillatorNode | null = null;
  private randomLfoGain: GainNode;
  private randomInterval: number | null = null;

  // Parameters
  private rate: number;
  private depth: number;
  private randomness: number;
  private updateInterval: number;
  private isStarted: boolean = false;

  constructor(audioContext: AudioContext, params: PitchWarbleParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.rate = params.rate ?? 0.3;
    this.depth = params.depth ?? 10;
    this.randomness = params.randomness ?? 0.2;
    this.updateInterval = params.updateInterval ?? 200;

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();

    // Delay node for pitch shifting via delay time modulation
    this.delayNode = this.audioContext.createDelay(0.1); // Max 100ms
    this.delayNode.delayTime.value = 0.02; // Base delay 20ms

    // Main LFO for warble
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.rate;

    // LFO gain for depth control
    this.lfoGain = this.audioContext.createGain();
    this.updateDepth();

    // Random LFO gain
    this.randomLfoGain = this.audioContext.createGain();
    this.randomLfoGain.gain.value = 0;

    // Setup effect chain
    this.setupEffectChain();

    logger.info('[PitchWarble] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow:
   * Input → Delay (modulated by LFO + Random) → Output
   * LFO modulates delay time to create pitch variation
   */
  private setupEffectChain(): void {
    // Connect audio path
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.outputNode);

    // Connect main LFO to delay time modulation
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);

    // Connect random LFO to delay time modulation
    this.randomLfoGain.connect(this.delayNode.delayTime);
  }

  /**
   * Update depth parameter
   * Converts cents to delay time variation
   */
  private updateDepth(): void {
    // Convert cents to delay time modulation
    // Formula: cents ≈ 1200 * log2(f2/f1)
    // For small variations: delay modulation ≈ (cents / 1200) * base_delay
    const depthSeconds = (this.depth / 1200) * 0.02; // Base delay 20ms
    this.lfoGain.gain.value = depthSeconds;
  }

  /**
   * Start LFO and random wobble
   */
  start(): void {
    if (this.isStarted) return;

    const now = this.audioContext.currentTime;

    // Start main LFO
    this.lfo.start(now);

    // Start random wobble
    this.startRandomWobble();

    this.isStarted = true;
    logger.info('[PitchWarble] Started');
  }

  /**
   * Start random wobble effect
   * Creates random pitch variations to simulate mechanical instability
   */
  private startRandomWobble(): void {
    if (this.randomness === 0) return;

    // Clear existing interval
    if (this.randomInterval !== null) {
      clearInterval(this.randomInterval);
    }

    // Create interval for random wobble updates
    this.randomInterval = window.setInterval(() => {
      if (!this.isStarted) return;

      const now = this.audioContext.currentTime;

      // Generate random frequency between -randomness and +randomness Hz
      const randomFreq = (Math.random() * 2 - 1) * this.randomness * 10;

      // Create new random LFO if needed
      if (this.randomLfo) {
        try {
          this.randomLfo.stop(now);
          this.randomLfo.disconnect();
        } catch (e) {
          // Already stopped
        }
      }

      this.randomLfo = this.audioContext.createOscillator();
      this.randomLfo.type = 'sine';
      this.randomLfo.frequency.value = Math.abs(randomFreq) + 0.1;

      // Random depth
      const randomDepth = Math.random() * this.randomness * (this.depth / 1200) * 0.01;
      this.randomLfoGain.gain.setValueAtTime(randomDepth, now);

      this.randomLfo.connect(this.randomLfoGain);
      this.randomLfo.start(now);

    }, this.updateInterval);

    logger.debug('[PitchWarble] Started random wobble');
  }

  /**
   * Stop LFO and random wobble
   */
  stop(): void {
    if (!this.isStarted) return;

    const now = this.audioContext.currentTime;

    try {
      this.lfo.stop(now);
    } catch (e) {
      // Already stopped
    }

    if (this.randomLfo) {
      try {
        this.randomLfo.stop(now);
      } catch (e) {
        // Already stopped
      }
    }

    if (this.randomInterval !== null) {
      clearInterval(this.randomInterval);
      this.randomInterval = null;
    }

    this.isStarted = false;
    logger.info('[PitchWarble] Stopped');
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
   * @param value Rate (0.05-1.0 Hz for subtle warble)
   */
  setRate(value: number): void {
    this.rate = Math.max(0.05, Math.min(1.0, value));
    this.lfo.frequency.setValueAtTime(this.rate, this.audioContext.currentTime);
    logger.debug(`[PitchWarble] Rate set to ${this.rate}Hz`);
  }

  /**
   * Set pitch modulation depth in cents
   * @param value Depth (1-30 cents)
   */
  setDepth(value: number): void {
    this.depth = Math.max(1, Math.min(30, value));
    this.updateDepth();
    logger.debug(`[PitchWarble] Depth set to ${this.depth} cents`);
  }

  /**
   * Set randomness amount
   * @param value Randomness (0-1)
   */
  setRandomness(value: number): void {
    this.randomness = Math.max(0, Math.min(1, value));

    if (this.isStarted) {
      // Restart random wobble with new randomness
      if (this.randomInterval !== null) {
        clearInterval(this.randomInterval);
        this.randomInterval = null;
      }

      if (this.randomness > 0) {
        this.startRandomWobble();
      }
    }

    logger.debug(`[PitchWarble] Randomness set to ${this.randomness}`);
  }

  /**
   * Set random wobble update interval
   * @param value Interval in milliseconds (50-1000 ms)
   */
  setUpdateInterval(value: number): void {
    this.updateInterval = Math.max(50, Math.min(1000, value));

    if (this.isStarted && this.randomness > 0) {
      // Restart random wobble with new interval
      if (this.randomInterval !== null) {
        clearInterval(this.randomInterval);
        this.randomInterval = null;
      }
      this.startRandomWobble();
    }

    logger.debug(`[PitchWarble] Update interval set to ${this.updateInterval}ms`);
  }

  /**
   * Enable/disable bypass
   * @param bypass True to bypass effect
   */
  setBypass(bypass: boolean): void {
    if (bypass) {
      this.stop();
      // Disconnect delay node, connect input directly to output
      this.inputNode.disconnect();
      this.delayNode.disconnect();
      this.inputNode.connect(this.outputNode);
    } else {
      // Reconnect delay node
      this.inputNode.disconnect();
      this.inputNode.connect(this.delayNode);
      this.delayNode.connect(this.outputNode);
      this.start();
    }
    logger.debug(`[PitchWarble] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): PitchWarbleParams {
    return {
      rate: this.rate,
      depth: this.depth,
      randomness: this.randomness,
      updateInterval: this.updateInterval,
    };
  }

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void {
    try {
      this.stop();

      this.inputNode.disconnect();
      this.delayNode.disconnect();
      this.lfo.disconnect();
      this.lfoGain.disconnect();
      this.randomLfoGain.disconnect();
      this.outputNode.disconnect();

      if (this.randomLfo) {
        this.randomLfo.disconnect();
      }

      logger.info('[PitchWarble] Disposed');
    } catch (e) {
      logger.warn('[PitchWarble] Error during disposal:', e);
    }
  }
}
