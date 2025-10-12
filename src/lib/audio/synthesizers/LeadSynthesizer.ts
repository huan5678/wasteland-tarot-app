/**
 * LeadSynthesizer - Lead 合成器
 * 需求 10.5: WHEN Lead 聲部播放時 THEN 系統 SHALL 使用 Pulse Wave 或 Triangle Wave 搭配 LFO 調變濾波器
 *
 * Lead 合成器負責生成主旋律聲部，使用 LFO (Low Frequency Oscillator) 調變濾波器創造動態音色
 */

import { ADSREnvelope, ADSR_PRESETS } from './ADSREnvelope';
import type { ADSRConfig } from './ADSREnvelope';

/**
 * LFO (Low Frequency Oscillator) 配置
 * 用於調變濾波器頻率或音量，創造顫音效果
 */
export interface LFOConfig {
  frequency: number; // LFO 頻率 (Hz) 通常 0.1 - 10 Hz
  depth: number; // 調變深度 (0.0 - 1.0)
  waveform: OscillatorType; // 'sine' | 'triangle' | 'square'
  target: 'filter' | 'amplitude' | 'both'; // 調變目標
}

/**
 * Lead 合成器配置
 */
export interface LeadSynthConfig {
  waveform: OscillatorType; // 'square' | 'triangle' | 'sawtooth'
  pulseWidth?: number; // Pulse Wave 脈寬 (僅 PWM 模式)
  filterCutoff: number; // Hz (500 - 5000)
  filterResonance: number; // Q factor (1 - 10)
  ampEnvelope: ADSRConfig;
  filterEnvelope?: ADSRConfig;
  filterEnvelopeAmount?: number; // 濾波器包絡調變量 (Hz)
  lfo?: LFOConfig; // LFO 配置
  portamento?: number; // 滑音時間 (秒)
}

/**
 * 預定義的 Lead 音色配置
 */
export const LEAD_PRESETS: Record<string, LeadSynthConfig> = {
  // 明亮 Lead (需求 10.5 範例)
  bright: {
    waveform: 'square',
    filterCutoff: 2000,
    filterResonance: 2.5, // 降低共振避免音量峰值 (原 5.0)
    ampEnvelope: ADSR_PRESETS.lead_bright,
    filterEnvelope: {
      attack: 0.015,
      decay: 0.2,
      sustain: 0.4,
      release: 0.25,
    },
    filterEnvelopeAmount: 1500,
    lfo: {
      frequency: 5.0,
      depth: 0.3,
      waveform: 'triangle',
      target: 'filter',
    },
  },

  // Synthwave Lead (經典 synthwave 主音)
  synthwave: {
    waveform: 'sawtooth',
    filterCutoff: 1800,
    filterResonance: 2.5, // 降低共振避免 1800Hz 附近音量峰值 (原 7.0)
    ampEnvelope: {
      attack: 0.02,
      decay: 0.18,
      sustain: 0.6,
      release: 0.3,
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0.5,
      release: 0.2,
    },
    filterEnvelopeAmount: 2000,
    lfo: {
      frequency: 6.0,
      depth: 0.4,
      waveform: 'sine',
      target: 'filter',
    },
  },

  // Punchy Lead (短促、打擊感)
  punchy: {
    waveform: 'square',
    filterCutoff: 2500,
    filterResonance: 2.8, // 降低共振但保留打擊感 (原 6.0)
    ampEnvelope: ADSR_PRESETS.lead_punchy,
    filterEnvelope: {
      attack: 0.002,
      decay: 0.08,
      sustain: 0.2,
      release: 0.15,
    },
    filterEnvelopeAmount: 1800,
  },

  // Smooth Lead (柔和、連續)
  smooth: {
    waveform: 'triangle',
    filterCutoff: 1500,
    filterResonance: 1.5, // 降低共振保持柔和音色 (原 3.0)
    ampEnvelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.7,
      release: 0.4,
    },
    filterEnvelope: {
      attack: 0.04,
      decay: 0.25,
      sustain: 0.6,
      release: 0.35,
    },
    filterEnvelopeAmount: 1200,
    lfo: {
      frequency: 4.5,
      depth: 0.2,
      waveform: 'sine',
      target: 'filter',
    },
    portamento: 0.05, // 50ms 滑音
  },

  // Lofi Lead (復古、溫暖)
  lofi: {
    waveform: 'triangle',
    filterCutoff: 1200,
    filterResonance: 1.5, // 降低共振保留溫暖感 (原 2.5)
    ampEnvelope: {
      attack: 0.03,
      decay: 0.15,
      sustain: 0.55,
      release: 0.3,
    },
    filterEnvelope: {
      attack: 0.025,
      decay: 0.18,
      sustain: 0.45,
      release: 0.28,
    },
    filterEnvelopeAmount: 800,
    lfo: {
      frequency: 3.0,
      depth: 0.15,
      waveform: 'triangle',
      target: 'both',
    },
  },
};

/**
 * Lead 合成器類別
 * 使用 LFO 調變濾波器創造動態主音色
 */
export class LeadSynthesizer {
  private audioContext: AudioContext;
  private config: LeadSynthConfig;
  private oscillator: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ampGain: GainNode | null = null;
  private lfoOscillator: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private ampEnvelope: ADSREnvelope;
  private filterEnvelope: ADSREnvelope | null = null;
  private destination: AudioNode;
  private lastFrequency: number = 0; // 用於 portamento

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    config: LeadSynthConfig = LEAD_PRESETS.bright
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
   * 播放 Lead 音符
   * 需求 10.5: 使用 Pulse/Triangle Wave + LFO 調變濾波器
   *
   * @param frequency - 音符頻率 (Hz)
   * @param startTime - 開始時間
   * @param duration - 持續時間
   * @param velocity - 力度 (0.0 - 1.0)
   */
  playNote(
    frequency: number,
    startTime: number,
    duration: number,
    velocity: number = 0.8
  ): void {
    const { waveform, filterCutoff, filterResonance, lfo, portamento } = this.config;

    // 建立振盪器
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = waveform;

    // Portamento (滑音)
    if (portamento && this.lastFrequency > 0) {
      this.oscillator.frequency.setValueAtTime(this.lastFrequency, startTime);
      this.oscillator.frequency.exponentialRampToValueAtTime(
        frequency,
        startTime + portamento
      );
    } else {
      this.oscillator.frequency.value = frequency;
    }

    this.lastFrequency = frequency;

    // 建立濾波器
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = filterCutoff;
    this.filter.Q.value = filterResonance;

    // 建立增益節點
    this.ampGain = this.audioContext.createGain();

    // 建立 LFO (如果配置)
    // 需求 10.5: LFO 調變濾波器
    if (lfo) {
      this.setupLFO(lfo, startTime, duration);
    }

    // 連接音訊節點鏈: Oscillator → Filter → Gain → Destination
    this.oscillator.connect(this.filter);
    this.filter.connect(this.ampGain);
    this.ampGain.connect(this.destination);

    // 套用振幅包絡
    const peakGain = velocity;
    this.ampEnvelope.applyToParam(this.ampGain.gain, startTime, peakGain);

    // 套用濾波器包絡 (如果有配置)
    if (this.filterEnvelope && this.config.filterEnvelopeAmount) {
      const peakCutoff = filterCutoff + this.config.filterEnvelopeAmount;
      this.filterEnvelope.applyExponentialEnvelope(
        this.filter.frequency,
        startTime,
        peakCutoff,
        filterCutoff
      );
    }

    // 啟動振盪器
    this.oscillator.start(startTime);

    // 排程 Release 階段和停止
    const releaseTime = startTime + duration;
    this.ampEnvelope.triggerRelease(this.ampGain.gain, releaseTime);

    if (this.filterEnvelope) {
      this.filterEnvelope.triggerExponentialRelease(this.filter.frequency, releaseTime);
    }

    const stopTime = releaseTime + this.ampEnvelope.releaseDuration;
    this.oscillator.stop(stopTime);

    if (this.lfoOscillator) {
      this.lfoOscillator.stop(stopTime);
    }

    // 自動清理
    this.scheduleCleanup(stopTime);
  }

  /**
   * 設定 LFO (Low Frequency Oscillator) 調變
   * 需求 10.5: LFO 調變濾波器創造動態音色
   */
  private setupLFO(lfo: LFOConfig, startTime: number, duration: number): void {
    if (!this.filter || !this.ampGain) return;

    // 建立 LFO 振盪器
    this.lfoOscillator = this.audioContext.createOscillator();
    this.lfoOscillator.type = lfo.waveform;
    this.lfoOscillator.frequency.value = lfo.frequency;

    // 建立 LFO 增益節點 (控制調變深度)
    this.lfoGain = this.audioContext.createGain();

    // 連接 LFO
    this.lfoOscillator.connect(this.lfoGain);

    // 根據 target 連接到不同參數
    if (lfo.target === 'filter' || lfo.target === 'both') {
      // 調變濾波器頻率
      const modulationAmount = this.config.filterCutoff * lfo.depth;
      this.lfoGain.gain.value = modulationAmount;
      this.lfoGain.connect(this.filter.frequency);
    }

    if (lfo.target === 'amplitude' || lfo.target === 'both') {
      // 調變音量 (顫音效果)
      const ampModGain = this.audioContext.createGain();
      ampModGain.gain.value = lfo.depth * 0.5; // 音量調變通常較小
      this.lfoOscillator.connect(ampModGain);
      ampModGain.connect(this.ampGain.gain);
    }

    // 啟動 LFO
    this.lfoOscillator.start(startTime);
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
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // 已停止，忽略錯誤
      }
    }
    if (this.lfoOscillator) {
      try {
        this.lfoOscillator.stop();
      } catch (e) {
        // 已停止
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
    if (this.lfoOscillator) {
      this.lfoOscillator.disconnect();
      this.lfoOscillator = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
    }
  }

  /**
   * 重置 portamento (滑音)
   */
  resetPortamento(): void {
    this.lastFrequency = 0;
  }

  /**
   * 更新合成器配置
   */
  updateConfig(newConfig: Partial<LeadSynthConfig>): void {
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
  getConfig(): LeadSynthConfig {
    return { ...this.config };
  }
}

/**
 * 工廠函式：根據預設名稱建立 Lead 合成器
 */
export function createLeadFromPreset(
  audioContext: AudioContext,
  destination: AudioNode,
  presetName: keyof typeof LEAD_PRESETS
): LeadSynthesizer {
  const preset = LEAD_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown lead preset: ${presetName}`);
  }
  return new LeadSynthesizer(audioContext, destination, preset);
}

/**
 * MIDI 音符轉頻率
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Lead 音域常用 MIDI 音符範圍
 * C4 (60) 到 C6 (84) 是典型 Lead 範圍
 */
export const LEAD_NOTE_RANGE = {
  C4: 60, // Middle C (261.63 Hz)
  C5: 72, // 523.25 Hz
  C6: 84, // 1046.50 Hz
} as const;
