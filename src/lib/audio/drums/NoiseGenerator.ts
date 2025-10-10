/**
 * NoiseGenerator - 程序式噪音生成器
 *
 * 功能：
 * - 生成白噪音 (White Noise) - 所有頻率均等能量
 * - 生成粉紅噪音 (Pink Noise) - 低頻能量較強
 * - 支援 Bandpass/Highpass/Lowpass 濾波器
 *
 * 需求：11.3, 11.4 - Snare 和 Hi-hat 需要噪音源
 */

export class NoiseGenerator {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * 生成白噪音緩衝區
   * @param duration - 音訊持續時間（秒）
   * @returns AudioBuffer 白噪音緩衝區
   */
  createWhiteNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成隨機白噪音 (-1 到 1)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * 生成粉紅噪音緩衝區（Voss-McCartney 演算法）
   * @param duration - 音訊持續時間（秒）
   * @returns AudioBuffer 粉紅噪音緩衝區
   */
  createPinkNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Voss-McCartney 演算法生成粉紅噪音
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;

      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      // 正規化到 -1 到 1
      data[i] = pink * 0.11;
    }

    return buffer;
  }

  /**
   * 建立帶通濾波噪音源
   * @param duration - 持續時間（秒）
   * @param centerFreq - 中心頻率（Hz）
   * @param Q - 濾波器品質因子（預設 1.0）
   * @param noiseType - 噪音類型 ('white' | 'pink')
   * @returns 連接好濾波器的噪音源節點和 GainNode
   */
  createBandpassNoise(
    duration: number,
    centerFreq: number,
    Q: number = 1.0,
    noiseType: 'white' | 'pink' = 'white'
  ): { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } {
    // 建立噪音源
    const buffer = noiseType === 'white'
      ? this.createWhiteNoiseBuffer(duration)
      : this.createPinkNoiseBuffer(duration);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // 建立帶通濾波器
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = Q;

    // 建立音量節點
    const gain = this.audioContext.createGain();

    // 連接：source → filter → gain
    source.connect(filter);
    filter.connect(gain);

    return { source, filter, gain };
  }

  /**
   * 建立高通濾波噪音源
   * @param duration - 持續時間（秒）
   * @param cutoffFreq - 截止頻率（Hz）
   * @param noiseType - 噪音類型 ('white' | 'pink')
   * @returns 連接好濾波器的噪音源節點和 GainNode
   */
  createHighpassNoise(
    duration: number,
    cutoffFreq: number,
    noiseType: 'white' | 'pink' = 'white'
  ): { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } {
    const buffer = noiseType === 'white'
      ? this.createWhiteNoiseBuffer(duration)
      : this.createPinkNoiseBuffer(duration);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = cutoffFreq;

    const gain = this.audioContext.createGain();

    source.connect(filter);
    filter.connect(gain);

    return { source, filter, gain };
  }

  /**
   * 建立低通濾波噪音源
   * @param duration - 持續時間（秒）
   * @param cutoffFreq - 截止頻率（Hz）
   * @param noiseType - 噪音類型 ('white' | 'pink')
   * @returns 連接好濾波器的噪音源節點和 GainNode
   */
  createLowpassNoise(
    duration: number,
    cutoffFreq: number,
    noiseType: 'white' | 'pink' = 'white'
  ): { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } {
    const buffer = noiseType === 'white'
      ? this.createWhiteNoiseBuffer(duration)
      : this.createPinkNoiseBuffer(duration);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoffFreq;

    const gain = this.audioContext.createGain();

    source.connect(filter);
    filter.connect(gain);

    return { source, filter, gain };
  }
}
