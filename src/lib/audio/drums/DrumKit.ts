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
import { EffectsProcessor } from '../effects/EffectsProcessor';

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

  // P2.3: 效果處理器
  private effectsProcessor: EffectsProcessor;
  private gatedReverbChain: { input: AudioNode; output: AudioNode } | null = null;
  private tapeSaturationChain: { input: AudioNode; output: AudioNode } | null = null;
  private snareBus: GainNode; // Snare 專用 bus（用於 Gated Reverb）

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

    // P2.3: 建立效果處理器
    this.effectsProcessor = new EffectsProcessor(audioContext);

    // 建立音訊節點
    this.drumBus = audioContext.createGain();
    this.snareBus = audioContext.createGain(); // Snare 專用 bus
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.options.masterVolume;

    // P2.3: 根據選項初始化效果鏈
    this._updateAudioGraph();
  }

  /**
   * P2.3: 更新音訊圖連接（效果鏈）
   * 根據 synthwaveMode 和 lofiMode 動態重新連接音訊圖
   */
  private _updateAudioGraph(): void {
    // 斷開所有現有連接
    this.drumBus.disconnect();
    this.snareBus.disconnect();
    if (this.gatedReverbChain) {
      this.gatedReverbChain.input.disconnect();
      this.gatedReverbChain.output.disconnect();
    }
    if (this.tapeSaturationChain) {
      this.tapeSaturationChain.input.disconnect();
      this.tapeSaturationChain.output.disconnect();
    }

    // 預設連接：drumBus -> masterGain
    let drumBusOutput: AudioNode = this.drumBus;
    let snareBusOutput: AudioNode = this.snareBus;

    // 1. Synthwave 模式：Snare 使用 Gated Reverb
    if (this.options.synthwaveMode) {
      if (!this.gatedReverbChain) {
        this.gatedReverbChain = this.effectsProcessor.createGatedReverb({
          roomSize: 0.8,
          decay: 0.5,
          gateThreshold: -40,
          gateRelease: 0.05,
          mix: 0.4,
        });
      }
      // 路由：snareBus -> gatedReverb -> drumBus
      this.snareBus.connect(this.gatedReverbChain.input);
      this.gatedReverbChain.output.connect(this.drumBus);
      snareBusOutput = this.snareBus; // Snare 專用
    } else {
      // 不使用 Gated Reverb：snareBus -> drumBus
      this.snareBus.connect(this.drumBus);
    }

    // 2. Lofi 模式：整體 drumBus 使用 Tape Saturation
    if (this.options.lofiMode) {
      if (!this.tapeSaturationChain) {
        this.tapeSaturationChain = this.effectsProcessor.createTapeSaturation({
          drive: 3,
          bias: 0.5,
          tone: 0.3,
          mix: 0.6,
        });
      }
      // 路由：drumBus -> tapeSaturation -> masterGain
      this.drumBus.connect(this.tapeSaturationChain.input);
      this.tapeSaturationChain.output.connect(this.masterGain);
      drumBusOutput = this.tapeSaturationChain.output;

      // 降低鼓組音量（需求 11.7）
      this.drumBus.gain.value = 0.6;
    } else {
      // 不使用 Tape Saturation：drumBus -> masterGain
      this.drumBus.connect(this.masterGain);
      this.drumBus.gain.value = 1.0;
    }

    // 3. Master 輸出到 destination
    this.masterGain.connect(this.audioContext.destination);
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

    // P2.3: Synthwave 模式：在 Snare 上套用 Gated Reverb（需求 11.6）
    // 輸出到 snareBus（會被 Gated Reverb 處理）
    const targetBus = this.options.synthwaveMode ? this.snareBus : this.drumBus;
    this.snareDrum.trigger(effectiveOptions, targetBus, startTime);
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
   * P2.3: 需求 11.6 - Synthwave 模式在 Snare 上套用 Gated Reverb
   */
  setSynthwaveMode(enabled: boolean): void {
    if (this.options.synthwaveMode === enabled) return; // 避免重複更新

    this.options.synthwaveMode = enabled;
    this._updateAudioGraph(); // 重新連接音訊圖
  }

  /**
   * 啟用/停用 Lofi 模式
   * P2.3: 需求 11.7 - Lofi 模式降低鼓組音量並增加 Tape Saturation
   */
  setLofiMode(enabled: boolean): void {
    if (this.options.lofiMode === enabled) return; // 避免重複更新

    this.options.lofiMode = enabled;
    this._updateAudioGraph(); // 重新連接音訊圖
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
    this.snareBus.disconnect();
    this.masterGain.disconnect();

    // P2.3: 清理效果鏈
    if (this.gatedReverbChain) {
      this.gatedReverbChain.input.disconnect();
      this.gatedReverbChain.output.disconnect();
    }
    if (this.tapeSaturationChain) {
      this.tapeSaturationChain.input.disconnect();
      this.tapeSaturationChain.output.disconnect();
    }
  }
}
