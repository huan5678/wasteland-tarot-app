/**
 * ADSREnvelope - ADSR 包絡生成器
 * 需求 10.2: WHEN 合成器音色生成時 THEN 系統 SHALL 使用 ADSR Envelope
 *
 * ADSR (Attack-Decay-Sustain-Release) 是音色塑形的核心工具
 * - Attack: 音符觸發到達到最大音量的時間
 * - Decay: 從最大音量衰減到持續音量的時間
 * - Sustain: 按住音符時維持的音量等級 (0.0-1.0)
 * - Release: 釋放音符後聲音完全消失的時間
 */

/**
 * ADSR 參數配置
 * 參考 requirements.md 附錄 C: ADSR Envelope 參考值
 */
export interface ADSRConfig {
  attack: number; // 秒 (0.001 - 2.0)
  decay: number; // 秒 (0.001 - 2.0)
  sustain: number; // 音量等級 (0.0 - 1.0)
  release: number; // 秒 (0.001 - 5.0)
}

/**
 * 預定義的 ADSR 包絡配置
 * 基於 requirements.md 附錄 C 的參考值
 */
export const ADSR_PRESETS: Record<string, ADSRConfig> = {
  // Bass 音色
  bass_pluck: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.0,
    release: 0.2,
  },
  bass_sustained: {
    attack: 0.08, // 增加到 80ms 避免點擊聲 (原 0.02)
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
  },

  // Pad 音色
  pad_warm: {
    attack: 0.5,
    decay: 0.3,
    sustain: 0.6,
    release: 0.8,
  },
  pad_ethereal: {
    attack: 1.0,
    decay: 0.5,
    sustain: 0.5,
    release: 1.5,
  },

  // Lead 音色
  lead_bright: {
    attack: 0.05, // 增加到 50ms 避免點擊聲 (原 0.01)
    decay: 0.15,
    sustain: 0.5,
    release: 0.2,
  },
  lead_punchy: {
    attack: 0.03, // 增加到 30ms 避免點擊聲，保留打擊感 (原 0.002)
    decay: 0.05,
    sustain: 0.3,
    release: 0.1,
  },

  // 鼓組
  kick_drum: {
    attack: 0.002,
    decay: 0.15,
    sustain: 0.0,
    release: 0.05,
  },
  snare: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.0,
    release: 0.15,
  },
  hihat: {
    attack: 0.002,
    decay: 0.03,
    sustain: 0.0,
    release: 0.05,
  },
};

/**
 * ADSR 包絡生成器類別
 * 控制 AudioParam (如 gain.value 或 filter.frequency) 的包絡變化
 */
export class ADSREnvelope {
  private config: ADSRConfig;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext, config: ADSRConfig) {
    this.audioContext = audioContext;
    this.config = this.validateConfig(config);
  }

  /**
   * 驗證並修正 ADSR 配置參數
   */
  private validateConfig(config: ADSRConfig): ADSRConfig {
    return {
      attack: Math.max(0.001, Math.min(2.0, config.attack)),
      decay: Math.max(0.001, Math.min(2.0, config.decay)),
      sustain: Math.max(0.0, Math.min(1.0, config.sustain)),
      release: Math.max(0.001, Math.min(5.0, config.release)),
    };
  }

  /**
   * 套用 ADSR 包絡到 AudioParam (例如 GainNode.gain)
   * 需求 10.2: 使用 ADSR Envelope 控制音量和濾波器截止頻率
   *
   * @param param - AudioParam (如 gainNode.gain 或 filter.frequency)
   * @param startTime - 音符開始時間 (audioContext.currentTime)
   * @param peakValue - 攻擊階段的最大值
   * @param sustainValue - 持續階段的值 (通常是 peakValue * sustain)
   */
  applyToParam(
    param: AudioParam,
    startTime: number,
    peakValue: number,
    sustainValue?: number
  ): void {
    const { attack, decay, sustain, release } = this.config;
    const actualSustainValue = sustainValue ?? peakValue * sustain;

    // 改用指數型曲線，更自然且避免音量疊加削波
    // 清除現有的自動化排程
    param.cancelScheduledValues(startTime);

    // 確保值不為 0 (exponentialRampToValueAtTime 不接受 0)
    const minValue = 0.001;
    const safePeakValue = Math.max(minValue, peakValue);
    const safeSustainValue = Math.max(minValue, actualSustainValue);

    // Attack: 從極小值指數上升到 peakValue
    param.setValueAtTime(minValue, startTime);
    param.exponentialRampToValueAtTime(safePeakValue, startTime + attack);

    // Decay: 從 peakValue 指數下降到 sustainValue
    param.exponentialRampToValueAtTime(
      safeSustainValue,
      startTime + attack + decay
    );

    // Sustain: 維持在 sustainValue (由外部控制持續時間)
    // Release 階段由 triggerRelease() 方法單獨控制
  }

  /**
   * 觸發 Release 階段
   * 需求 10.2: Release 階段控制
   *
   * @param param - AudioParam
   * @param releaseTime - 釋放開始時間
   */
  triggerRelease(param: AudioParam, releaseTime: number): void {
    const { release } = this.config;
    const minValue = 0.001;

    // 改用指數衰減，更自然的 Release 效果
    param.cancelScheduledValues(releaseTime);
    param.setValueAtTime(Math.max(minValue, param.value), releaseTime);
    param.exponentialRampToValueAtTime(minValue, releaseTime + release);
  }

  /**
   * 套用指數型包絡 (更自然的聲音衰減)
   * 用於濾波器頻率調變或特定音色需求
   */
  applyExponentialEnvelope(
    param: AudioParam,
    startTime: number,
    peakValue: number,
    sustainValue?: number
  ): void {
    const { attack, decay, sustain } = this.config;
    const actualSustainValue = sustainValue ?? peakValue * sustain;

    // 確保值不為 0 (exponentialRampToValueAtTime 不接受 0)
    const minValue = 0.001;
    const safePeakValue = Math.max(minValue, peakValue);
    const safeSustainValue = Math.max(minValue, actualSustainValue);

    param.cancelScheduledValues(startTime);
    param.setValueAtTime(minValue, startTime);

    // 使用指數曲線 (更自然的音色變化)
    param.exponentialRampToValueAtTime(safePeakValue, startTime + attack);
    param.exponentialRampToValueAtTime(
      safeSustainValue,
      startTime + attack + decay
    );
  }

  /**
   * 觸發指數型 Release
   */
  triggerExponentialRelease(param: AudioParam, releaseTime: number): void {
    const { release } = this.config;
    const minValue = 0.001;

    param.cancelScheduledValues(releaseTime);
    param.setValueAtTime(Math.max(minValue, param.value), releaseTime);
    param.exponentialRampToValueAtTime(minValue, releaseTime + release);
  }

  /**
   * 獲取包絡總時長 (不包含 sustain，因 sustain 時長由外部控制)
   */
  get attackDecayDuration(): number {
    return this.config.attack + this.config.decay;
  }

  /**
   * 獲取 Release 時長
   */
  get releaseDuration(): number {
    return this.config.release;
  }

  /**
   * 獲取完整音符時長 (attack + decay + 最小 sustain + release)
   */
  getTotalDuration(sustainDuration: number = 0.5): number {
    return this.config.attack + this.config.decay + sustainDuration + this.config.release;
  }

  /**
   * 更新 ADSR 配置
   */
  updateConfig(newConfig: Partial<ADSRConfig>): void {
    this.config = this.validateConfig({
      ...this.config,
      ...newConfig,
    });
  }

  /**
   * 獲取當前配置
   */
  getConfig(): ADSRConfig {
    return { ...this.config };
  }
}

/**
 * 工廠函式：根據預設名稱建立 ADSR 包絡
 */
export function createADSRFromPreset(
  audioContext: AudioContext,
  presetName: keyof typeof ADSR_PRESETS
): ADSREnvelope {
  const preset = ADSR_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown ADSR preset: ${presetName}`);
  }
  return new ADSREnvelope(audioContext, preset);
}
