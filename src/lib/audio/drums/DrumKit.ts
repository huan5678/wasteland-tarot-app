/**
 * DrumKit - 程序式鼓組整合類別
 *
 * 功能：
 * - 整合 KickDrum, SnareDrum, HiHat
 * - 提供統一的觸發介面
 * - 支援音量控制和混音
 * - 支援 Synthwave Lofi 效果（Gated Reverb, Tape Saturation）
 *
 * 需求：11.1 - 節奏引擎初始化，程序式生成鼓組音色
 * 需求：11.6 - Synthwave 模式 Gated Reverb
 * 需求：11.7 - Lofi 模式 Tape Saturation
 */

import { KickDrum, KickDrumOptions } from './KickDrum';
import { SnareDrum, SnareDrumOptions } from './SnareDrum';
import { HiHat, HiHatOptions } from './HiHat';

export type DrumType = 'kick' | 'snare' | 'hihat';

export interface DrumKitOptions {
  masterVolume?: number;     // 主音量 (0-1)
  synthwaveMode?: boolean;   // 啟用 Synthwave 效果
  lofiMode?: boolean;        // 啟用 Lofi 效果
}

export class DrumKit {
  private audioContext: AudioContext;
  private kickDrum: KickDrum;
  private snareDrum: SnareDrum;
  private hiHat: HiHat;

  private masterGain: GainNode;
  private drumBus: GainNode;

  private options: Required<DrumKitOptions>;

  constructor(audioContext: AudioContext, options: DrumKitOptions = {}) {
    this.audioContext = audioContext;

    // 合併預設選項
    this.options = {
      masterVolume: options.masterVolume ?? 0.8,
      synthwaveMode: options.synthwaveMode ?? false,
      lofiMode: options.lofiMode ?? false,
    };

    // 建立鼓聲生成器
    this.kickDrum = new KickDrum(audioContext);
    this.snareDrum = new SnareDrum(audioContext);
    this.hiHat = new HiHat(audioContext);

    // 建立音訊節點
    this.drumBus = audioContext.createGain();
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.options.masterVolume;

    // 連接：drumBus → masterGain → destination
    this.drumBus.connect(this.masterGain);
    this.masterGain.connect(audioContext.destination);
  }

  /**
   * 觸發 Kick Drum
   * @param options - Kick Drum 選項
   * @param startTime - 開始時間（預設為立即播放）
   * @param velocity - 力度 (0-1)
   */
  triggerKick(
    options: KickDrumOptions = {},
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    const volume = (options.volume ?? 1.0) * velocity;
    const effectiveOptions = { ...options, volume };

    this.kickDrum.trigger(effectiveOptions, this.drumBus, startTime);
  }

  /**
   * 觸發 Snare Drum
   * @param options - Snare Drum 選項
   * @param startTime - 開始時間（預設為立即播放）
   * @param velocity - 力度 (0-1)
   */
  triggerSnare(
    options: SnareDrumOptions = {},
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    const volume = (options.volume ?? 1.0) * velocity;
    const effectiveOptions = { ...options, volume };

    // Synthwave 模式：在 Snare 上套用 Gated Reverb
    // 需求 11.6
    if (this.options.synthwaveMode) {
      // TODO: 實作 Gated Reverb（未來由 EffectsProcessor 提供）
      // 目前使用標準 Snare
    }

    this.snareDrum.trigger(effectiveOptions, this.drumBus, startTime);
  }

  /**
   * 觸發 Hi-hat
   * @param options - Hi-hat 選項
   * @param startTime - 開始時間（預設為立即播放）
   * @param velocity - 力度 (0-1)
   */
  triggerHiHat(
    options: HiHatOptions = {},
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    const volume = (options.volume ?? 1.0) * velocity;
    const effectiveOptions = { ...options, volume };

    this.hiHat.trigger(effectiveOptions, this.drumBus, startTime);
  }

  /**
   * 觸發 Closed Hi-hat（快捷方法）
   */
  triggerClosedHiHat(
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    this.hiHat.triggerClosed({ volume: velocity }, this.drumBus, startTime);
  }

  /**
   * 觸發 Open Hi-hat（快捷方法）
   */
  triggerOpenHiHat(
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    this.hiHat.triggerOpen({ volume: velocity }, this.drumBus, startTime);
  }

  /**
   * 根據鼓聲類型觸發音效（通用介面）
   * @param drumType - 鼓聲類型
   * @param startTime - 開始時間
   * @param velocity - 力度 (0-1)
   */
  trigger(
    drumType: DrumType,
    startTime: number = this.audioContext.currentTime,
    velocity: number = 1.0
  ): void {
    switch (drumType) {
      case 'kick':
        this.triggerKick({}, startTime, velocity);
        break;
      case 'snare':
        this.triggerSnare({}, startTime, velocity);
        break;
      case 'hihat':
        this.triggerHiHat({}, startTime, velocity);
        break;
    }
  }

  /**
   * 設定主音量
   * @param volume - 音量 (0-1)
   */
  setMasterVolume(volume: number): void {
    this.options.masterVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = this.options.masterVolume;
  }

  /**
   * 取得主音量
   */
  getMasterVolume(): number {
    return this.options.masterVolume;
  }

  /**
   * 啟用/停用 Synthwave 模式
   * 需求 11.6 - Synthwave 模式在 Snare 上套用 Gated Reverb
   */
  setSynthwaveMode(enabled: boolean): void {
    this.options.synthwaveMode = enabled;
  }

  /**
   * 啟用/停用 Lofi 模式
   * 需求 11.7 - Lofi 模式降低鼓組音量並增加 Tape Saturation
   */
  setLofiMode(enabled: boolean): void {
    this.options.lofiMode = enabled;

    if (enabled) {
      // 降低鼓組音量 -3 到 -6dB（約 0.5-0.7 倍）
      this.drumBus.gain.value = 0.6;
      // TODO: 增加 Tape Saturation（未來由 EffectsProcessor 提供）
    } else {
      this.drumBus.gain.value = 1.0;
    }
  }

  /**
   * 取得鼓聲生成器實例（進階控制）
   */
  getKickDrum(): KickDrum {
    return this.kickDrum;
  }

  getSnareDrum(): SnareDrum {
    return this.snareDrum;
  }

  getHiHat(): HiHat {
    return this.hiHat;
  }

  /**
   * 清理資源
   */
  dispose(): void {
    this.drumBus.disconnect();
    this.masterGain.disconnect();
  }
}
