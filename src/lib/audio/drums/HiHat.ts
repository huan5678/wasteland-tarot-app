/**
 * HiHat - 程序式 Hi-hat 生成器
 *
 * 技術：
 * - 高頻噪音 (6kHz+) + Bandpass Filter
 * - Closed Hi-hat: Attack 2ms, Decay 50-100ms
 * - Open Hi-hat: Attack 2ms, Decay 200-400ms
 * - 使用 Highpass Filter (5-8kHz) 移除低頻
 *
 * 需求：11.4 - Hi-hat 合成
 * 參考：requirements.md 附錄 C - ADSR Envelope 參考值
 */

import { NoiseGenerator } from './NoiseGenerator';

export type HiHatPreset = 'metallic' | 'crisp' | 'lofi' | 'closed' | 'open';
export type HiHatType = 'closed' | 'open';

export interface HiHatOptions {
  preset?: HiHatPreset;
  type?: HiHatType;          // 'closed' 或 'open'
  centerFreq?: number;       // Bandpass 中心頻率 (6-12kHz)
  highpassFreq?: number;     // Highpass 截止頻率 (5-8kHz)
  Q?: number;                // Bandpass Q 值
  attack?: number;           // Attack 時間 (ms)
  decay?: number;            // Decay 時間 (ms)
  volume?: number;           // 音量 (0-1)
}

export class HiHat {
  private audioContext: AudioContext;
  private noiseGenerator: NoiseGenerator;

  // 預設配置
  private presets: Record<HiHatPreset, Required<Omit<HiHatOptions, 'preset'>>> = {
    metallic: {
      type: 'closed',
      centerFreq: 10000,
      highpassFreq: 7000,
      Q: 1.5,
      attack: 2,
      decay: 60,
      volume: 1.0,
    },
    crisp: {
      type: 'closed',
      centerFreq: 9000,
      highpassFreq: 6000,
      Q: 2.0,
      attack: 1,
      decay: 50,
      volume: 1.0,
    },
    lofi: {
      type: 'closed',
      centerFreq: 7000,
      highpassFreq: 5000,
      Q: 1.0,
      attack: 3,
      decay: 80,
      volume: 0.85,
    },
    closed: {
      type: 'closed',
      centerFreq: 8500,
      highpassFreq: 6000,
      Q: 1.5,
      attack: 2,
      decay: 70,
      volume: 0.9,
    },
    open: {
      type: 'open',
      centerFreq: 8000,
      highpassFreq: 5500,
      Q: 1.2,
      attack: 2,
      decay: 300,
      volume: 0.85,
    },
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.noiseGenerator = new NoiseGenerator(audioContext);
  }

  /**
   * 觸發 Hi-hat 音效
   * @param options - Hi-hat 選項
   * @param destination - 目標音訊節點（預設為 audioContext.destination）
   * @param startTime - 開始時間（預設為立即播放）
   */
  trigger(
    options: HiHatOptions = {},
    destination: AudioNode = this.audioContext.destination,
    startTime: number = this.audioContext.currentTime
  ): void {
    // 合併預設配置和使用者選項
    const preset = options.preset || 'closed';
    const config = { ...this.presets[preset], ...options };

    const now = startTime;
    const attackTime = config.attack / 1000;
    const decayTime = config.decay / 1000;
    const totalDuration = attackTime + decayTime;

    // 建立噪音源
    const noiseBuffer = this.noiseGenerator.createWhiteNoiseBuffer(totalDuration);
    const source = this.audioContext.createBufferSource();
    source.buffer = noiseBuffer;

    // 建立 Bandpass Filter（塑造金屬質感）
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = config.centerFreq;
    bandpass.Q.value = config.Q;

    // 建立 Highpass Filter（移除低頻雜音）
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = config.highpassFreq;

    // 建立 Gain 節點控制振幅
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    // ADSR Envelope
    // Attack
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(config.volume, now + attackTime);

    // Decay
    if (config.type === 'closed') {
      // Closed Hi-hat: 快速衰減
      gain.gain.exponentialRampToValueAtTime(0.01, now + totalDuration);
    } else {
      // Open Hi-hat: 較慢衰減，帶有尾音
      gain.gain.exponentialRampToValueAtTime(config.volume * 0.3, now + totalDuration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, now + totalDuration);
    }

    // 連接：source → bandpass → highpass → gain → destination
    source.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(destination);

    // 播放
    source.start(now);
    source.stop(now + totalDuration);
  }

  /**
   * 快捷方法：觸發 Closed Hi-hat
   */
  triggerClosed(
    options: Omit<HiHatOptions, 'type'> = {},
    destination?: AudioNode,
    startTime?: number
  ): void {
    this.trigger({ ...options, type: 'closed' }, destination, startTime);
  }

  /**
   * 快捷方法：觸發 Open Hi-hat
   */
  triggerOpen(
    options: Omit<HiHatOptions, 'type'> = {},
    destination?: AudioNode,
    startTime?: number
  ): void {
    this.trigger({ ...options, type: 'open' }, destination, startTime);
  }

  /**
   * 取得可用的音色預設列表
   */
  getPresets(): HiHatPreset[] {
    return Object.keys(this.presets) as HiHatPreset[];
  }

  /**
   * 取得特定音色預設的配置
   */
  getPresetConfig(preset: HiHatPreset): Required<Omit<HiHatOptions, 'preset'>> {
    return { ...this.presets[preset] };
  }
}
