/**
 * BassSynthesizer - Bass 合成器
 * 需求 10.3: WHEN Bass 聲部播放時 THEN 系統 SHALL 使用 Sawtooth 或 Square 波形搭配 Lowpass Filter
 *
 * Bass 合成器負責生成低音聲部，使用鋸齒波或方波配合低通濾波器
 * 頻率範圍: 40Hz - 500Hz (典型 synthwave bass)
 */

import { ADSREnvelope, ADSR_PRESETS } from './ADSREnvelope';
import type { ADSRConfig } from './ADSREnvelope';

/**
 * Bass 合成器配置
 */
export interface BassSynthConfig {
  waveform: OscillatorType; // 'sawtooth' | 'square' | 'triangle'
  filterCutoff: number; // Hz (200 - 500)
  filterResonance: number; // Q factor (2 - 5)
  ampEnvelope: ADSRConfig;
  filterEnvelope?: ADSRConfig; // 濾波器包絡 (可選)
  filterEnvelopeAmount?: number; // 濾波器包絡調變量 (0 - 1000 Hz)
}

/**
 * 預定義的 Bass 音色配置
 */
export const BASS_PRESETS: Record<string, BassSynthConfig> = {
  // 經典 Synthwave Bass (肥厚、圓潤)
  synthwave_classic: {
    waveform: 'sawtooth',
    filterCutoff: 300,
    filterResonance: 1.8, // 降低共振避免 300Hz 附近音量峰值 (原 3.5)
    ampEnvelope: ADSR_PRESETS.bass_sustained,
    filterEnvelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.2,
    },
    filterEnvelopeAmount: 400,
  },

  // Pluck Bass (短促、打擊感)
  pluck: {
    waveform: 'square',
    filterCutoff: 500,
    filterResonance: 1.5, // 降低共振避免音量峰值 (原 2.0)
    ampEnvelope: ADSR_PRESETS.bass_pluck,
    filterEnvelope: {
      attack: 0.005,
      decay: 0.15,
      sustain: 0.0,
      release: 0.1,
    },
    filterEnvelopeAmount: 800,
  },

  // Sub Bass (深沉、低頻)
  sub: {
    waveform: 'sine',
    filterCutoff: 200,
    filterResonance: 1.0,
    ampEnvelope: ADSR_PRESETS.bass_sustained,
  },

  // Lofi Bass (溫暖、復古)
  lofi: {
    waveform: 'triangle',
    filterCutoff: 350,
    filterResonance: 1.5, // 降低共振保持溫暖音色 (原 2.5)
    ampEnvelope: {
      attack: 0.03,
      decay: 0.25,
      sustain: 0.6,
      release: 0.4,
    },
    filterEnvelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.4,
      release: 0.3,
    },
    filterEnvelopeAmount: 300,
  },
};

/**
 * Bass 合成器類別
 * 生成並控制 Bass 聲部的音色
 */
export class BassSynthesizer {
  private audioContext: AudioContext;
  private config: BassSynthConfig;
  private oscillator: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ampGain: GainNode | null = null;
  private ampEnvelope: ADSREnvelope;
  private filterEnvelope: ADSREnvelope | null = null;
  private destination: AudioNode;

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    config: BassSynthConfig = BASS_PRESETS.synthwave_classic
  ) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.config = config;

    // 建立振幅包絡
    this.ampEnvelope = new ADSREnvelope(audioContext, config.ampEnvelope);

    // 建立濾波器包絡 (如果配置)
    if (config.filterEnvelope) {
      this.filterEnvelope = new ADSREnvelope(audioContext, config.filterEnvelope);
    }
  }

  /**
   * 播放 Bass 音符
   * 需求 10.3: 使用 Sawtooth/Square 波形 + Lowpass Filter
   *
   * @param frequency - 音符頻率 (Hz)
   * @param startTime - 開始時間 (audioContext.currentTime)
   * @param duration - 持續時間 (秒)
   * @param velocity - 力度 (0.0 - 1.0)
   */
  playNote(
    frequency: number,
    startTime: number,
    duration: number,
    velocity: number = 0.8
  ): void {
    // DEBUG: 詳細日誌
    console.log('[BassSynthesizer] playNote called', {
      frequency,
      startTime,
      duration,
      velocity,
      audioContextTime: this.audioContext.currentTime,
      audioContextState: this.audioContext.state,
      waveform: this.config.waveform,
      filterCutoff: this.config.filterCutoff,
    });

    // 建立振盪器
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = this.config.waveform;
    this.oscillator.frequency.value = frequency;

    // 建立低通濾波器
    // 需求 10.3: Lowpass Filter (cutoff: 200-500Hz, resonance: 2-5)
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.config.filterCutoff;
    this.filter.Q.value = this.config.filterResonance;

    // 建立增益節點 (音量控制)
    this.ampGain = this.audioContext.createGain();

    // 連接音訊節點鏈: Oscillator → Filter → Gain → Destination
    this.oscillator.connect(this.filter);
    this.filter.connect(this.ampGain);
    this.ampGain.connect(this.destination);

    console.log('[BassSynthesizer] Nodes connected, oscillator starting at', startTime);

    // 套用振幅包絡
    const peakGain = velocity;
    this.ampEnvelope.applyToParam(this.ampGain.gain, startTime, peakGain);

    // 套用濾波器包絡 (如果有配置)
    if (this.filterEnvelope && this.config.filterEnvelopeAmount) {
      const baseCutoff = this.config.filterCutoff;
      const peakCutoff = baseCutoff + this.config.filterEnvelopeAmount;
      this.filterEnvelope.applyExponentialEnvelope(
        this.filter.frequency,
        startTime,
        peakCutoff,
        baseCutoff
      );
    }

    // 啟動振盪器
    this.oscillator.start(startTime);
    console.log('[BassSynthesizer] Oscillator started');

    // 排程 Release 階段和停止
    const releaseTime = startTime + duration;
    this.ampEnvelope.triggerRelease(this.ampGain.gain, releaseTime);

    if (this.filterEnvelope) {
      this.filterEnvelope.triggerExponentialRelease(this.filter.frequency, releaseTime);
    }

    const stopTime = releaseTime + this.ampEnvelope.releaseDuration;
    this.oscillator.stop(stopTime);

    console.log('[BassSynthesizer] Oscillator will stop at', stopTime);

    // 自動清理
    this.scheduleCleanup(stopTime);
  }

  /**
   * 排程資源清理
   */
  private scheduleCleanup(stopTime: number): void {
    const currentTime = this.audioContext.currentTime;
    const cleanupDelay = (stopTime - currentTime + 0.1) * 1000; // 轉換為毫秒並加 100ms 緩衝

    setTimeout(() => {
      this.cleanup();
    }, Math.max(0, cleanupDelay));
  }

  /**
   * 立即停止並清理資源
   */
  stop(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
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
    if (this.oscillator) {
      this.oscillator.disconnect();
      this.oscillator = null;
    }
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
  updateConfig(newConfig: Partial<BassSynthConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (newConfig.ampEnvelope) {
      this.ampEnvelope.updateConfig(newConfig.ampEnvelope);
    }

    if (newConfig.filterEnvelope) {
      if (!this.filterEnvelope) {
        this.filterEnvelope = new ADSREnvelope(
          this.audioContext,
          newConfig.filterEnvelope
        );
      } else {
        this.filterEnvelope.updateConfig(newConfig.filterEnvelope);
      }
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig(): BassSynthConfig {
    return { ...this.config };
  }
}

/**
 * 工廠函式：根據預設名稱建立 Bass 合成器
 */
export function createBassFromPreset(
  audioContext: AudioContext,
  destination: AudioNode,
  presetName: keyof typeof BASS_PRESETS
): BassSynthesizer {
  const preset = BASS_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown bass preset: ${presetName}`);
  }
  return new BassSynthesizer(audioContext, destination, preset);
}

/**
 * 頻率工具：MIDI 音符轉頻率
 * 用於音樂理論運算
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Bass 音域常用 MIDI 音符範圍
 * E1 (40) 到 C3 (48) 是典型 Synthwave Bass 範圍
 */
export const BASS_NOTE_RANGE = {
  E1: 40, // 41.20 Hz
  F1: 41,
  Gb1: 42,
  G1: 43,
  Ab1: 44,
  A1: 45,
  Bb1: 46,
  B1: 47,
  C2: 48, // 65.41 Hz
  Db2: 49,
  D2: 50,
  Eb2: 51,
  E2: 52,
  F2: 53,
  Gb2: 54,
  G2: 55,
  Ab2: 56,
  A2: 57,
  Bb2: 58,
  B2: 59,
  C3: 60, // 130.81 Hz
} as const;
