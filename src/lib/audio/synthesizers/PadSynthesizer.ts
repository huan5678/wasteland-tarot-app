/**
 * PadSynthesizer - Pad 合成器
 * 需求 10.4: WHEN Pad 聲部播放時 THEN 系統 SHALL 使用多個 detuned Sawtooth 振盪器
 *
 * Pad 合成器負責生成豐富的和弦墊音，使用多個去諧振盪器創造厚實音色
 * Detune 範圍: -7 到 +7 cents (requirements.md 需求 10.4)
 */

import { ADSREnvelope, ADSR_PRESETS } from './ADSREnvelope';
import type { ADSRConfig } from './ADSREnvelope';

/**
 * Pad 合成器配置
 */
export interface PadSynthConfig {
  oscillatorCount: number; // 去諧振盪器數量 (2-5)
  detuneAmount: number; // 去諧量 cents (-7 到 +7)
  waveform: OscillatorType; // 'sawtooth' | 'triangle' | 'sine'
  filterCutoff?: number; // 可選低通濾波器 (Hz)
  filterResonance?: number; // Q factor
  ampEnvelope: ADSRConfig;
  chorusEnabled?: boolean; // 是否啟用 Chorus 效果
}

/**
 * 預定義的 Pad 音色配置
 */
export const PAD_PRESETS: Record<string, PadSynthConfig> = {
  // 溫暖 Pad (需求 10.4 範例)
  warm: {
    oscillatorCount: 3,
    detuneAmount: 7,
    waveform: 'sawtooth',
    filterCutoff: 2000,
    filterResonance: 1.0,
    ampEnvelope: ADSR_PRESETS.pad_warm,
    chorusEnabled: true,
  },

  // 飄渺 Pad (更多振盪器、更長 attack)
  ethereal: {
    oscillatorCount: 5,
    detuneAmount: 5,
    waveform: 'triangle',
    filterCutoff: 3000,
    filterResonance: 0.5,
    ampEnvelope: ADSR_PRESETS.pad_ethereal,
    chorusEnabled: true,
  },

  // Synthwave Pad (經典肥厚音色)
  synthwave: {
    oscillatorCount: 4,
    detuneAmount: 7,
    waveform: 'sawtooth',
    filterCutoff: 2500,
    filterResonance: 1.5,
    ampEnvelope: {
      attack: 0.6,
      decay: 0.3,
      sustain: 0.65,
      release: 1.0,
    },
    chorusEnabled: true,
  },

  // Lofi Pad (溫暖復古)
  lofi: {
    oscillatorCount: 3,
    detuneAmount: 4,
    waveform: 'triangle',
    filterCutoff: 1800,
    filterResonance: 0.8,
    ampEnvelope: {
      attack: 0.8,
      decay: 0.4,
      sustain: 0.55,
      release: 1.2,
    },
    chorusEnabled: false,
  },

  // Bright Pad (明亮、通透)
  bright: {
    oscillatorCount: 4,
    detuneAmount: 6,
    waveform: 'sawtooth',
    filterCutoff: 4000,
    filterResonance: 2.0,
    ampEnvelope: {
      attack: 0.4,
      decay: 0.2,
      sustain: 0.7,
      release: 0.6,
    },
    chorusEnabled: true,
  },
};

/**
 * Pad 合成器類別
 * 使用多個去諧振盪器創造豐富音色
 */
export class PadSynthesizer {
  private audioContext: AudioContext;
  private config: PadSynthConfig;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private ampGain: GainNode | null = null;
  private ampEnvelope: ADSREnvelope;
  private destination: AudioNode;

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    config: PadSynthConfig = PAD_PRESETS.warm
  ) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.config = config;

    // 建立振幅包絡
    this.ampEnvelope = new ADSREnvelope(audioContext, config.ampEnvelope);
  }

  /**
   * 播放 Pad 和弦
   * 需求 10.4: 使用多個 detuned Sawtooth 振盪器 (detune: -7 到 +7 cents)
   *
   * @param frequencies - 和弦頻率陣列 (Hz)
   * @param startTime - 開始時間
   * @param duration - 持續時間
   * @param velocity - 力度 (0.0 - 1.0)
   */
  playChord(
    frequencies: number[],
    startTime: number,
    duration: number,
    velocity: number = 0.6
  ): void {
    const { oscillatorCount, detuneAmount, waveform } = this.config;

    // 建立增益節點
    this.ampGain = this.audioContext.createGain();

    // 建立濾波器 (如果配置)
    let currentNode: AudioNode = this.ampGain;

    if (this.config.filterCutoff) {
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = this.config.filterCutoff;
      this.filter.Q.value = this.config.filterResonance || 1.0;

      // 連接: Filter → Gain
      this.filter.connect(this.ampGain);
      currentNode = this.filter;
    }

    // 連接到目標
    this.ampGain.connect(this.destination);

    // 為每個和弦音符建立多個去諧振盪器
    // 需求 10.4: 多個 detuned Sawtooth 振盪器創造厚實音色
    for (const freq of frequencies) {
      for (let i = 0; i < oscillatorCount; i++) {
        const osc = this.audioContext.createOscillator();
        osc.type = waveform;
        osc.frequency.value = freq;

        // 計算去諧值 (-detuneAmount 到 +detuneAmount)
        // 分散振盪器在 detune 範圍內
        const detune = oscillatorCount > 1
          ? (i / (oscillatorCount - 1)) * 2 * detuneAmount - detuneAmount
          : 0;

        osc.detune.value = detune;

        // 連接到濾波器或增益節點
        osc.connect(currentNode);
        this.oscillators.push(osc);
      }
    }

    // 套用振幅包絡
    // 由於多個振盪器疊加，需降低個別振盪器音量
    const totalOscillators = frequencies.length * oscillatorCount;
    const peakGain = velocity / Math.sqrt(totalOscillators); // 使用平方根縮放避免削波

    this.ampEnvelope.applyToParam(this.ampGain.gain, startTime, peakGain);

    // 啟動所有振盪器
    for (const osc of this.oscillators) {
      osc.start(startTime);
    }

    // 排程 Release 階段和停止
    const releaseTime = startTime + duration;
    this.ampEnvelope.triggerRelease(this.ampGain.gain, releaseTime);

    const stopTime = releaseTime + this.ampEnvelope.releaseDuration;
    for (const osc of this.oscillators) {
      osc.stop(stopTime);
    }

    // 自動清理
    this.scheduleCleanup(stopTime);
  }

  /**
   * 播放單音符 (使用所有去諧振盪器)
   */
  playNote(
    frequency: number,
    startTime: number,
    duration: number,
    velocity: number = 0.6
  ): void {
    this.playChord([frequency], startTime, duration, velocity);
  }

  /**
   * 排程資源清理
   */
  private scheduleCleanup(stopTime: number): void {
    const currentTime = this.audioContext.currentTime;
    const cleanupDelay = (stopTime - currentTime + 0.1) * 1000;

    setTimeout(() => {
      this.cleanup();
    }, Math.max(0, cleanupDelay));
  }

  /**
   * 立即停止並清理資源
   */
  stop(): void {
    for (const osc of this.oscillators) {
      try {
        osc.stop();
      } catch (e) {
        // 已停止，忽略錯誤
      }
    }
    this.cleanup();
  }

  /**
   * 清理音訊節點
   */
  private cleanup(): void {
    for (const osc of this.oscillators) {
      osc.disconnect();
    }
    this.oscillators = [];

    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
    if (this.ampGain) {
      this.ampGain.disconnect();
      this.ampGain = null;
    }
  }

  /**
   * 更新合成器配置
   */
  updateConfig(newConfig: Partial<PadSynthConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (newConfig.ampEnvelope) {
      this.ampEnvelope.updateConfig(newConfig.ampEnvelope);
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig(): PadSynthConfig {
    return { ...this.config };
  }
}

/**
 * 工廠函式：根據預設名稱建立 Pad 合成器
 */
export function createPadFromPreset(
  audioContext: AudioContext,
  destination: AudioNode,
  presetName: keyof typeof PAD_PRESETS
): PadSynthesizer {
  const preset = PAD_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown pad preset: ${presetName}`);
  }
  return new PadSynthesizer(audioContext, destination, preset);
}

/**
 * 和弦工具：生成常用和弦的頻率陣列
 * 使用 MIDI 音符計算
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * 生成三和弦頻率
 */
export function generateTriadFrequencies(
  rootMidi: number,
  chordType: 'major' | 'minor' | 'diminished' | 'augmented' = 'minor'
): number[] {
  const intervals = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
  };

  const chordIntervals = intervals[chordType];
  return chordIntervals.map((interval) => midiToFrequency(rootMidi + interval));
}

/**
 * 生成七和弦頻率
 */
export function generateSeventhFrequencies(
  rootMidi: number,
  chordType: 'maj7' | 'min7' | 'dom7' = 'min7'
): number[] {
  const intervals = {
    maj7: [0, 4, 7, 11], // Major 7th
    min7: [0, 3, 7, 10], // Minor 7th
    dom7: [0, 4, 7, 10], // Dominant 7th
  };

  const chordIntervals = intervals[chordType];
  return chordIntervals.map((interval) => midiToFrequency(rootMidi + interval));
}
