/**
 * Ping-pong Delay Effect
 * 立體聲乒乓延遲效果 - 使用 DelayNode + StereoPannerNode
 *
 * 需求 7.1: Synthwave Ping-pong Delay 效果
 * 參數: Delay Time, Feedback, Wet/Dry Mix
 *
 * 使用範例:
 * ```ts
 * const pingPongDelay = new PingPongDelay(audioContext);
 * pingPongDelay.setDelayTime(250);  // Delay time in ms
 * pingPongDelay.setFeedback(0.5);   // Feedback amount (0-1)
 * pingPongDelay.setMix(0.3);        // Wet/dry mix (0-1)
 *
 * source.connect(pingPongDelay.input);
 * pingPongDelay.output.connect(audioContext.destination);
 * ```
 */

import { logger } from '@/lib/logger';

export interface PingPongDelayParams {
  /** Delay time in milliseconds (預設: 375ms) */
  delayTime?: number;
  /** Feedback amount 0-1 (預設: 0.5) */
  feedback?: number;
  /** Wet/Dry mix 0-1 (預設: 0.3) */
  mix?: number;
  /** Maximum delay time in seconds (預設: 2s) */
  maxDelayTime?: number;
}

export class PingPongDelay {
  private audioContext: AudioContext;

  // Audio Nodes
  private inputNode: GainNode;
  private outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private delayLeft: DelayNode;
  private delayRight: DelayNode;
  private feedbackLeft: GainNode;
  private feedbackRight: GainNode;
  private panLeft: StereoPannerNode;
  private panRight: StereoPannerNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;

  // Parameters
  private delayTime: number;
  private feedback: number;
  private mix: number;
  private maxDelayTime: number;

  constructor(audioContext: AudioContext, params: PingPongDelayParams = {}) {
    this.audioContext = audioContext;

    // Initialize parameters with defaults
    this.delayTime = params.delayTime ?? 375;
    this.feedback = params.feedback ?? 0.5;
    this.mix = params.mix ?? 0.3;
    this.maxDelayTime = params.maxDelayTime ?? 2;

    // Create nodes
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    // Delay nodes with max delay time
    this.delayLeft = this.audioContext.createDelay(this.maxDelayTime);
    this.delayRight = this.audioContext.createDelay(this.maxDelayTime);

    // Feedback gain nodes
    this.feedbackLeft = this.audioContext.createGain();
    this.feedbackRight = this.audioContext.createGain();

    // Stereo panner nodes for ping-pong effect
    this.panLeft = this.audioContext.createStereoPanner();
    this.panRight = this.audioContext.createStereoPanner();

    // Channel splitter and merger for stereo processing
    this.splitter = this.audioContext.createChannelSplitter(2);
    this.merger = this.audioContext.createChannelMerger(2);

    // Setup effect chain
    this.setupEffectChain();
    this.updateParameters();

    logger.info('[PingPongDelay] Initialized with params:', params);
  }

  /**
   * Setup the audio node connections
   * Signal Flow:
   * Input → (Dry + Wet) → Output
   * Wet Path:
   *   Input → Splitter → DelayLeft → PanLeft (-1) → Merger
   *                    → DelayRight → PanRight (+1) → Merger
   * Feedback:
   *   DelayLeft → FeedbackLeft → DelayRight
   *   DelayRight → FeedbackRight → DelayLeft
   */
  private setupEffectChain(): void {
    // Dry path (bypass)
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Wet path - split input to stereo
    this.inputNode.connect(this.splitter);

    // Left channel delay chain
    this.splitter.connect(this.delayLeft, 0); // Left channel to left delay
    this.delayLeft.connect(this.panLeft);
    this.panLeft.connect(this.merger, 0, 0); // Pan left (-1) to left output

    // Right channel delay chain
    this.splitter.connect(this.delayRight, 1); // Right channel to right delay
    this.delayRight.connect(this.panRight);
    this.panRight.connect(this.merger, 0, 1); // Pan right (+1) to right output

    // Cross-feedback for ping-pong effect
    this.delayLeft.connect(this.feedbackRight);
    this.feedbackRight.connect(this.delayRight);

    this.delayRight.connect(this.feedbackLeft);
    this.feedbackLeft.connect(this.delayLeft);

    // Wet output
    this.merger.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);
  }

  /**
   * Update all effect parameters
   */
  private updateParameters(): void {
    // Set delay times
    const delaySeconds = this.delayTime / 1000;
    this.delayLeft.delayTime.value = delaySeconds;
    this.delayRight.delayTime.value = delaySeconds;

    // Set feedback amounts
    this.feedbackLeft.gain.value = this.feedback;
    this.feedbackRight.gain.value = this.feedback;

    // Set stereo panning (-1 = full left, +1 = full right)
    this.panLeft.pan.value = -1;
    this.panRight.pan.value = 1;

    // Set wet/dry mix
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
   * Set delay time in milliseconds
   * @param value Delay time (10-2000 ms)
   */
  setDelayTime(value: number): void {
    this.delayTime = Math.max(10, Math.min(2000, value));
    const delaySeconds = this.delayTime / 1000;

    // Smooth parameter change
    const now = this.audioContext.currentTime;
    this.delayLeft.delayTime.setValueAtTime(this.delayLeft.delayTime.value, now);
    this.delayLeft.delayTime.linearRampToValueAtTime(delaySeconds, now + 0.05);

    this.delayRight.delayTime.setValueAtTime(this.delayRight.delayTime.value, now);
    this.delayRight.delayTime.linearRampToValueAtTime(delaySeconds, now + 0.05);

    logger.debug(`[PingPongDelay] Delay time set to ${this.delayTime}ms`);
  }

  /**
   * Set feedback amount
   * @param value Feedback (0-0.95, higher values = more repeats)
   */
  setFeedback(value: number): void {
    this.feedback = Math.max(0, Math.min(0.95, value)); // Limit to prevent runaway feedback
    this.feedbackLeft.gain.value = this.feedback;
    this.feedbackRight.gain.value = this.feedback;
    logger.debug(`[PingPongDelay] Feedback set to ${this.feedback}`);
  }

  /**
   * Set wet/dry mix
   * @param value Mix amount (0-1, where 0=dry, 1=wet)
   */
  setMix(value: number): void {
    this.mix = Math.max(0, Math.min(1, value));
    this.wetGain.gain.value = this.mix;
    this.dryGain.gain.value = 1 - this.mix;
    logger.debug(`[PingPongDelay] Mix set to ${this.mix}`);
  }

  /**
   * Set stereo width (adjusts panning amount)
   * @param value Width (0-1, where 0=mono, 1=full stereo)
   */
  setStereoWidth(value: number): void {
    const width = Math.max(0, Math.min(1, value));
    this.panLeft.pan.value = -width;
    this.panRight.pan.value = width;
    logger.debug(`[PingPongDelay] Stereo width set to ${width}`);
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
      this.wetGain.gain.value = this.mix;
      this.dryGain.gain.value = 1 - this.mix;
    }
    logger.debug(`[PingPongDelay] Bypass: ${bypass}`);
  }

  /**
   * Get current parameters
   */
  getParams(): PingPongDelayParams {
    return {
      delayTime: this.delayTime,
      feedback: this.feedback,
      mix: this.mix,
      maxDelayTime: this.maxDelayTime,
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
      this.delayLeft.disconnect();
      this.delayRight.disconnect();
      this.feedbackLeft.disconnect();
      this.feedbackRight.disconnect();
      this.panLeft.disconnect();
      this.panRight.disconnect();
      this.splitter.disconnect();
      this.merger.disconnect();
      this.outputNode.disconnect();
      logger.info('[PingPongDelay] Disposed');
    } catch (e) {
      logger.warn('[PingPongDelay] Error during disposal:', e);
    }
  }
}
