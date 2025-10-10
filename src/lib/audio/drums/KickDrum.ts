/**
 * KickDrum - 程序式 Kick Drum 生成器
 *
 * 技術：
 * - 使用低頻正弦波 (50-80Hz) + Pitch Envelope
 * - Pitch Envelope: 起始頻率 150Hz → 快速衰減至 50-60Hz
 * - Attack: <10ms, Decay: 100-200ms
 * - 可選加入 Noise Burst (點擊感)
 *
 * 需求：11.2 - Kick Drum 合成
 * 參考：requirements.md 附錄 C - ADSR Envelope 參考值
 */

import { NoiseGenerator } from './NoiseGenerator';

export type KickDrumPreset = 'deep' | 'punchy' | '808' | 'lofi';

export interface KickDrumOptions {
  preset?: KickDrumPreset;
  baseFreq?: number;        // 基礎頻率 (50-80Hz)
  pitchStart?: number;      // Pitch Envelope 起始頻率 (150Hz)
  pitchDecay?: number;      // Pitch Envelope 衰減時間 (ms)
  attack?: number;          // Attack 時間 (ms)
  decay?: number;           // Decay 時間 (ms)
  addNoiseBurst?: boolean;  // 是否加入 Noise Burst
  volume?: number;          // 音量 (0-1)
}

export class KickDrum {
  private audioContext: AudioContext;
  private noiseGenerator: NoiseGenerator;

  // 預設配置
  private presets: Record<KickDrumPreset, Required<Omit<KickDrumOptions, 'preset'>>> = {
    deep: {
      baseFreq: 50,
      pitchStart: 150,
      pitchDecay: 50,
      attack: 5,
      decay: 200,
      addNoiseBurst: false,
      volume: 1.0,
    },
    punchy: {
      baseFreq: 60,
      pitchStart: 150,
      pitchDecay: 40,
      attack: 2,
      decay: 150,
      addNoiseBurst: true,
      volume: 1.0,
    },
    '808': {
      baseFreq: 55,
      pitchStart: 150,
      pitchDecay: 60,
      attack: 5,
      decay: 180,
      addNoiseBurst: false,
      volume: 1.0,
    },
    lofi: {
      baseFreq: 65,
      pitchStart: 120,
      pitchDecay: 70,
      attack: 8,
      decay: 160,
      addNoiseBurst: true,
      volume: 0.85,
    },
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.noiseGenerator = new NoiseGenerator(audioContext);
  }

  /**
   * 觸發 Kick Drum 音效
   * @param options - Kick Drum 選項
   * @param destination - 目標音訊節點（預設為 audioContext.destination）
   * @param startTime - 開始時間（預設為立即播放）
   */
  trigger(
    options: KickDrumOptions = {},
    destination: AudioNode = this.audioContext.destination,
    startTime: number = this.audioContext.currentTime
  ): void {
    // 合併預設配置和使用者選項
    const preset = options.preset || 'punchy';
    const config = { ...this.presets[preset], ...options };

    const now = startTime;
    const attackTime = config.attack / 1000;
    const decayTime = config.decay / 1000;
    const pitchDecayTime = config.pitchDecay / 1000;
    const totalDuration = attackTime + decayTime;

    // 建立主要正弦波振盪器
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = config.pitchStart;

    // Pitch Envelope: 從 pitchStart 快速衰減到 baseFreq
    osc.frequency.setValueAtTime(config.pitchStart, now);
    osc.frequency.exponentialRampToValueAtTime(
      config.baseFreq,
      now + pitchDecayTime
    );

    // 建立 Gain 節點控制振幅 ADSR
    const oscGain = this.audioContext.createGain();
    oscGain.gain.value = 0;

    // ADSR Envelope
    // Attack
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(config.volume, now + attackTime);

    // Decay to zero
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + totalDuration);

    // 連接振盪器
    osc.connect(oscGain);
    oscGain.connect(destination);

    // 啟動和停止振盪器
    osc.start(now);
    osc.stop(now + totalDuration + 0.1);

    // 加入 Noise Burst（點擊感）
    if (config.addNoiseBurst) {
      this.addNoiseBurst(destination, now, attackTime, config.volume);
    }
  }

  /**
   * 加入 Noise Burst 提供點擊感
   * @private
   */
  private addNoiseBurst(
    destination: AudioNode,
    startTime: number,
    duration: number,
    volume: number
  ): void {
    // 建立短促的高頻噪音
    const noiseDuration = Math.min(duration, 0.02); // 最多 20ms
    const { source, filter, gain } = this.noiseGenerator.createHighpassNoise(
      noiseDuration,
      2000, // 2kHz 高通濾波
      'white'
    );

    // 快速衰減的 Envelope
    gain.gain.value = 0;
    gain.gain.setValueAtTime(volume * 0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + noiseDuration);

    // 連接到目標
    gain.connect(destination);

    // 播放
    source.start(startTime);
    source.stop(startTime + noiseDuration);
  }

  /**
   * 取得可用的音色預設列表
   */
  getPresets(): KickDrumPreset[] {
    return Object.keys(this.presets) as KickDrumPreset[];
  }

  /**
   * 取得特定音色預設的配置
   */
  getPresetConfig(preset: KickDrumPreset): Required<Omit<KickDrumOptions, 'preset'>> {
    return { ...this.presets[preset] };
  }
}
