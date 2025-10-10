/**
 * SnareDrum - 程序式 Snare Drum 生成器
 *
 * 技術：
 * - 白噪音 (White Noise) + 短促的音調 (200-300Hz)
 * - 使用 Highpass Filter (200Hz) 過濾噪音
 * - 音調部分使用 Triangle/Square Wave
 * - Attack: <5ms, Decay: 80-150ms
 *
 * 需求：11.3 - Snare Drum 合成
 * 參考：requirements.md 附錄 C - ADSR Envelope 參考值
 */

import { NoiseGenerator } from './NoiseGenerator';

export type SnareDrumPreset = 'tight' | 'fat' | 'clap' | 'lofi';

export interface SnareDrumOptions {
  preset?: SnareDrumPreset;
  toneFreq?: number;         // 音調頻率 (200-300Hz)
  toneType?: OscillatorType; // 音調波形 ('triangle' | 'square')
  noiseFilter?: number;      // 噪音濾波器截止頻率 (Hz)
  attack?: number;           // Attack 時間 (ms)
  decay?: number;            // Decay 時間 (ms)
  noiseMix?: number;         // 噪音混合比例 (0-1, 1 為全噪音)
  volume?: number;           // 音量 (0-1)
}

export class SnareDrum {
  private audioContext: AudioContext;
  private noiseGenerator: NoiseGenerator;

  // 預設配置
  private presets: Record<SnareDrumPreset, Required<Omit<SnareDrumOptions, 'preset'>>> = {
    tight: {
      toneFreq: 200,
      toneType: 'triangle',
      noiseFilter: 3000,
      attack: 2,
      decay: 80,
      noiseMix: 0.6,
      volume: 1.0,
    },
    fat: {
      toneFreq: 250,
      toneType: 'square',
      noiseFilter: 2500,
      attack: 5,
      decay: 120,
      noiseMix: 0.5,
      volume: 1.0,
    },
    clap: {
      toneFreq: 220,
      toneType: 'triangle',
      noiseFilter: 4000,
      attack: 3,
      decay: 100,
      noiseMix: 0.8,
      volume: 0.9,
    },
    lofi: {
      toneFreq: 280,
      toneType: 'square',
      noiseFilter: 2000,
      attack: 4,
      decay: 140,
      noiseMix: 0.55,
      volume: 0.85,
    },
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.noiseGenerator = new NoiseGenerator(audioContext);
  }

  /**
   * 觸發 Snare Drum 音效
   * @param options - Snare Drum 選項
   * @param destination - 目標音訊節點（預設為 audioContext.destination）
   * @param startTime - 開始時間（預設為立即播放）
   */
  trigger(
    options: SnareDrumOptions = {},
    destination: AudioNode = this.audioContext.destination,
    startTime: number = this.audioContext.currentTime
  ): void {
    // 合併預設配置和使用者選項
    const preset = options.preset || 'tight';
    const config = { ...this.presets[preset], ...options };

    const now = startTime;
    const attackTime = config.attack / 1000;
    const decayTime = config.decay / 1000;
    const totalDuration = attackTime + decayTime;

    // 建立混合器
    const mixer = this.audioContext.createGain();
    mixer.connect(destination);

    // 1. 音調部分（Triangle/Square Wave）
    this.createToneComponent(mixer, config, now, attackTime, decayTime, totalDuration);

    // 2. 噪音部分（Highpass Filtered White Noise）
    this.createNoiseComponent(mixer, config, now, attackTime, decayTime, totalDuration);
  }

  /**
   * 建立音調組件（響線）
   * @private
   */
  private createToneComponent(
    destination: AudioNode,
    config: Required<Omit<SnareDrumOptions, 'preset'>>,
    startTime: number,
    attackTime: number,
    decayTime: number,
    totalDuration: number
  ): void {
    // 建立振盪器
    const osc = this.audioContext.createOscillator();
    osc.type = config.toneType;
    osc.frequency.value = config.toneFreq;

    // 建立 Gain 節點
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    // ADSR Envelope（音調比噪音快速衰減）
    const toneVolume = config.volume * (1 - config.noiseMix);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(toneVolume, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + totalDuration * 0.6);

    // 連接
    osc.connect(gain);
    gain.connect(destination);

    // 播放
    osc.start(startTime);
    osc.stop(startTime + totalDuration);
  }

  /**
   * 建立噪音組件（鼓皮）
   * @private
   */
  private createNoiseComponent(
    destination: AudioNode,
    config: Required<Omit<SnareDrumOptions, 'preset'>>,
    startTime: number,
    attackTime: number,
    decayTime: number,
    totalDuration: number
  ): void {
    // 建立高通濾波噪音
    const { source, filter, gain } = this.noiseGenerator.createHighpassNoise(
      totalDuration,
      config.noiseFilter,
      'white'
    );

    // ADSR Envelope
    const noiseVolume = config.volume * config.noiseMix;
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(noiseVolume, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + totalDuration);

    // 連接
    gain.connect(destination);

    // 播放
    source.start(startTime);
    source.stop(startTime + totalDuration);
  }

  /**
   * 取得可用的音色預設列表
   */
  getPresets(): SnareDrumPreset[] {
    return Object.keys(this.presets) as SnareDrumPreset[];
  }

  /**
   * 取得特定音色預設的配置
   */
  getPresetConfig(preset: SnareDrumPreset): Required<Omit<SnareDrumOptions, 'preset'>> {
    return { ...this.presets[preset] };
  }
}
