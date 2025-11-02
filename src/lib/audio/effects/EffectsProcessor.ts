/**
 * EffectsProcessor - 音訊效果處理器
 * P2.3: 實作 Gated Reverb 和 Tape Saturation 效果
 *
 * 支援的效果：
 * 1. Gated Reverb - 80 年代經典鼓聲效果（Phil Collins風格）
 * 2. Tape Saturation - 磁帶飽和失真效果（Lo-Fi 溫暖音色）
 */

/**
 * Gated Reverb 配置
 * 經典80年代鼓聲效果：大 Reverb + 快速噪音門
 */
export interface GatedReverbOptions {
  roomSize?: number;       // 空間大小 (0-1)，預設 0.8
  decay?: number;          // 衰減時間（秒），預設 0.5
  gateThreshold?: number;  // 噪音門閾值（dB），預設 -40
  gateRelease?: number;    // 噪音門釋放時間（秒），預設 0.05
  mix?: number;            // 乾濕比 (0-1)，預設 0.4
}

/**
 * Tape Saturation 配置
 * 磁帶飽和效果：溫暖失真 + 輕微壓縮
 */
export interface TapeSaturationOptions {
  drive?: number;      // 推力強度 (0-10)，預設 3
  bias?: number;       // 磁帶偏壓 (0-1)，預設 0.5
  tone?: number;       // 音色調整 (0-1)，0=暗, 1=亮，預設 0.3
  mix?: number;        // 乾濕比 (0-1)，預設 0.6
}

/**
 * EffectsProcessor 類
 * 提供專業音訊效果處理
 */
export class EffectsProcessor {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // ==================== Gated Reverb ====================

  /**
   * 創建 Gated Reverb 效果鏈
   *
   * 音訊圖拓撲:
   * input -> convolver (reverb) -> dynamics compressor (gate) -> output
   *
   * 原理：
   * 1. Convolver 創建大型 reverb 空間
   * 2. DynamicsCompressor 作為噪音門，快速切斷低於閾值的信號
   * 3. 產生經典的"短促、強烈"鼓聲效果
   *
   * @param options - Gated Reverb 配置選項
   * @returns 包含 input 和 output 節點的效果鏈
   */
  createGatedReverb(options: GatedReverbOptions = {}): {
    input: AudioNode;
    output: AudioNode;
  } {
    const {
      roomSize = 0.8,
      decay = 0.5,
      gateThreshold = -40,
      gateRelease = 0.05,
      mix = 0.4,
    } = options;

    // 1. 創建 Convolver (Reverb)
    const convolver = this.audioContext.createConvolver();
    convolver.buffer = this.createReverbImpulse(roomSize, decay);

    // 2. 創建 DynamicsCompressor (作為 Noise Gate)
    // Web Audio API 沒有內建 noise gate，使用 compressor 模擬
    const gate = this.audioContext.createDynamicsCompressor();
    gate.threshold.value = gateThreshold;       // 閾值（低於此值會壓縮）
    gate.ratio.value = 20;                      // 高比率（強烈壓縮 = 類似 gate）
    gate.attack.value = 0.001;                  // 快速 attack（1ms）
    gate.release.value = gateRelease;           // 可調整的 release

    // 3. 創建乾濕混合
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const output = this.audioContext.createGain();

    dryGain.gain.value = 1 - mix;  // 乾信號音量
    wetGain.gain.value = mix;       // 濕信號音量

    // 4. 創建 input 分流節點
    const input = this.audioContext.createGain();

    // 連接音訊圖:
    // input -> dryGain -> output (乾信號直通)
    // input -> convolver -> gate -> wetGain -> output (濕信號經過效果)
    input.connect(dryGain);
    dryGain.connect(output);

    input.connect(convolver);
    convolver.connect(gate);
    gate.connect(wetGain);
    wetGain.connect(output);

    return { input, output };
  }

  /**
   * 創建 Reverb Impulse Response Buffer
   * 用於 Convolver 的脈衝響應
   *
   * @param roomSize - 空間大小 (0-1)
   * @param decay - 衰減時間（秒）
   * @returns AudioBuffer 包含脈衝響應
   */
  private createReverbImpulse(roomSize: number, decay: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * decay; // 總長度（樣本數）
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        // 指數衰減曲線：y = e^(-t/τ)
        const t = i / sampleRate;
        const envelope = Math.exp(-t / decay);

        // 加入隨機噪音模擬空間反射
        const noise = (Math.random() * 2 - 1) * roomSize;

        channelData[i] = noise * envelope;
      }
    }

    return buffer;
  }

  // ==================== Tape Saturation ====================

  /**
   * 創建 Tape Saturation 效果鏈
   *
   * 音訊圖拓撲:
   * input -> pre-gain -> waveshaper (distortion) -> tone filter -> output
   *
   * 原理：
   * 1. Pre-gain 推升信號（模擬磁帶過載）
   * 2. WaveShaper 套用軟切削（soft clipping）失真曲線
   * 3. Tone filter 模擬磁帶高頻衰減
   * 4. 產生溫暖、略帶失真的 Lo-Fi 音色
   *
   * @param options - Tape Saturation 配置選項
   * @returns 包含 input 和 output 節點的效果鏈
   */
  createTapeSaturation(options: TapeSaturationOptions = {}): {
    input: AudioNode;
    output: AudioNode;
  } {
    const {
      drive = 3,
      bias = 0.5,
      tone = 0.3,
      mix = 0.6,
    } = options;

    // 1. 創建 Pre-Gain (推力)
    const preGain = this.audioContext.createGain();
    preGain.gain.value = 1 + (drive * 0.3); // Drive: 1.0 到 4.0

    // 2. 創建 WaveShaper (失真)
    const waveshaper = this.audioContext.createWaveShaper();
    waveshaper.curve = this.createSaturationCurve(drive, bias);
    waveshaper.oversample = '4x'; // 過採樣防止混疊失真

    // 3. 創建 Tone Filter (高頻衰減)
    const toneFilter = this.audioContext.createBiquadFilter();
    toneFilter.type = 'lowpass';
    // tone: 0=2kHz (暗), 1=8kHz (亮)
    toneFilter.frequency.value = 2000 + (tone * 6000);
    toneFilter.Q.value = 0.7;

    // 4. 創建 Post-Gain (補償音量)
    const postGain = this.audioContext.createGain();
    postGain.gain.value = 0.7 / (1 + drive * 0.1); // 補償失真增益

    // 5. 創建乾濕混合
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const output = this.audioContext.createGain();

    dryGain.gain.value = 1 - mix;
    wetGain.gain.value = mix;

    // 6. 創建 input 分流節點
    const input = this.audioContext.createGain();

    // 連接音訊圖:
    // input -> dryGain -> output (乾信號)
    // input -> preGain -> waveshaper -> toneFilter -> postGain -> wetGain -> output (濕信號)
    input.connect(dryGain);
    dryGain.connect(output);

    input.connect(preGain);
    preGain.connect(waveshaper);
    waveshaper.connect(toneFilter);
    toneFilter.connect(postGain);
    postGain.connect(wetGain);
    wetGain.connect(output);

    return { input, output };
  }

  /**
   * 創建 Saturation Curve (失真曲線)
   * 使用 tanh 函數實現軟切削（soft clipping）
   *
   * @param drive - 推力強度
   * @param bias - 磁帶偏壓（影響失真特性）
   * @returns Float32Array 包含失真曲線
   */
  private createSaturationCurve(drive: number, bias: number): Float32Array {
    const samples = 4096;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      // 將 i 映射到 -1 到 1
      const x = (i / (samples - 1)) * 2 - 1;

      // 套用 tanh 軟切削
      // tanh(x * drive) 產生 S 型失真曲線
      let y = Math.tanh(x * drive);

      // 加入偏壓（bias）產生不對稱失真（模擬磁帶特性）
      y = y + bias * x * (1 - Math.abs(y));

      // 限制在 -1 到 1
      curve[i] = Math.max(-1, Math.min(1, y));
    }

    return curve;
  }

  // ==================== 輔助方法 ====================

  /**
   * 創建簡單的直通效果（無處理）
   * 用於條件式效果啟用/停用
   */
  createBypass(): { input: AudioNode; output: AudioNode } {
    const node = this.audioContext.createGain();
    node.gain.value = 1;
    return { input: node, output: node };
  }
}
