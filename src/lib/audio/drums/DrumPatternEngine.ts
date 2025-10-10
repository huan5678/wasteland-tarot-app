/**
 * DrumPatternEngine - 程序式節奏模式引擎
 *
 * 功能：
 * - 根據預定義節奏模式觸發鼓組
 * - 支援 4/4, 3/4, 6/8 拍號
 * - 支援 Swing/Shuffle (延遲偶數拍 10-20%)
 * - 支援動態音量變化 (Velocity: 0.5-1.0)
 * - 可調 BPM (60-140)
 * - 使用 Web Audio Clock 精準計時
 *
 * 需求：11.5 - 根據預定義節奏模式觸發鼓組
 * 需求：11.8 - 占卜模式簡化節奏並降低 BPM
 */

import { DrumKit, DrumType } from './DrumKit';

export type TimeSignature = '4/4' | '3/4' | '6/8';
export type PatternName = 'basic_lofi' | 'synthwave_groove' | 'downtempo' | 'divination';

// 節奏模式定義：每個步進 (step) 記錄要觸發的鼓聲和力度
export interface DrumHit {
  drum: DrumType;
  velocity: number;
}

export interface DrumPattern {
  name: PatternName;
  timeSignature: TimeSignature;
  steps: number;                    // 總步數 (如 16 步 = 4/4 拍的 16 分音符)
  pattern: (DrumHit[] | null)[];    // 每個步進的鼓聲事件（null 為靜音）
  defaultBPM: number;
  description: string;
}

export interface DrumPatternEngineOptions {
  bpm?: number;                     // Beats Per Minute (60-140)
  swing?: number;                   // Swing 百分比 (0-20)
  velocityVariation?: number;       // 力度變化範圍 (0-0.2)
  pattern?: PatternName;            // 預設節奏模式
}

export class DrumPatternEngine {
  private audioContext: AudioContext;
  private drumKit: DrumKit;

  private bpm: number = 90;
  private swing: number = 0;
  private velocityVariation: number = 0.1;
  private currentPattern: DrumPattern;

  private isPlaying: boolean = false;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private schedulerTimerId: number | null = null;

  // 預定義節奏模式
  private patterns: Record<PatternName, DrumPattern> = {
    /**
     * basic_lofi: 簡單四拍
     * Kick: 1, 3 (拍 1 和拍 3)
     * Snare: 2, 4 (拍 2 和拍 4)
     * Hi-hat: offbeat (每個 8 分音符)
     */
    basic_lofi: {
      name: 'basic_lofi',
      timeSignature: '4/4',
      steps: 16,
      defaultBPM: 85,
      description: 'Basic Lofi - Kick on 1,3, Snare on 2,4, Hi-hat offbeat',
      pattern: this.createBasicLofiPattern(),
    },

    /**
     * synthwave_groove: Synthwave 律動
     * Kick: 1, 3.5 (拍 1 和拍 3 的後半)
     * Snare: 2, 4
     * Hi-hat: 8th notes (每個 8 分音符)
     */
    synthwave_groove: {
      name: 'synthwave_groove',
      timeSignature: '4/4',
      steps: 16,
      defaultBPM: 110,
      description: 'Synthwave Groove - Syncopated kick, 8th note hi-hats',
      pattern: this.createSynthwaveGroovePattern(),
    },

    /**
     * downtempo: 慢節奏
     * Kick: 1, 4 (拍 1 和拍 4)
     * Snare: 3
     * Hi-hat: triplets (三連音，近似）
     */
    downtempo: {
      name: 'downtempo',
      timeSignature: '4/4',
      steps: 16,
      defaultBPM: 70,
      description: 'Downtempo - Sparse kick, triplet hi-hats',
      pattern: this.createDowntempoPattern(),
    },

    /**
     * divination: 占卜模式
     * 需求 11.8: 簡化節奏模式（移除部分 hi-hat）並降低 BPM 至 60-70
     * Kick: 1, 3
     * Snare: 2, 4
     * Hi-hat: 簡化（只在拍點）
     */
    divination: {
      name: 'divination',
      timeSignature: '4/4',
      steps: 16,
      defaultBPM: 65,
      description: 'Divination Mode - Simplified, meditative rhythm',
      pattern: this.createDivinationPattern(),
    },
  };

  constructor(
    audioContext: AudioContext,
    drumKit: DrumKit,
    options: DrumPatternEngineOptions = {}
  ) {
    this.audioContext = audioContext;
    this.drumKit = drumKit;

    const patternName = options.pattern || 'basic_lofi';
    this.currentPattern = this.patterns[patternName];
    this.bpm = options.bpm ?? this.currentPattern.defaultBPM;
    this.swing = options.swing ?? 0;
    this.velocityVariation = options.velocityVariation ?? 0.1;
  }

  /**
   * 開始播放節奏模式
   */
  start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime;

    this.scheduleNextStep();
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    if (this.schedulerTimerId !== null) {
      clearTimeout(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
  }

  /**
   * 排程下一個步進
   * 使用 Web Audio Clock 精準計時（需求 11.5）
   * @private
   */
  private scheduleNextStep(): void {
    if (!this.isPlaying) return;

    const secondsPerBeat = 60 / this.bpm;
    const secondsPerStep = secondsPerBeat / (this.currentPattern.steps / 4); // 4/4 拍，16 步 = 每拍 4 步

    // 計算當前步進的時間（考慮 Swing）
    let stepTime = this.nextStepTime;
    if (this.swing > 0 && this.currentStep % 2 === 1) {
      // 延遲奇數步進（Swing）
      const swingDelay = secondsPerStep * (this.swing / 100);
      stepTime += swingDelay;
    }

    // 觸發當前步進的鼓聲
    const hits = this.currentPattern.pattern[this.currentStep];
    if (hits !== null) {
      for (const hit of hits) {
        // 加入力度變化（需求 11.5 - Velocity Variation ±10-20%）
        const velocity = this.applyVelocityVariation(hit.velocity);
        this.drumKit.trigger(hit.drum, stepTime, velocity);
      }
    }

    // 前進到下一個步進
    this.currentStep = (this.currentStep + 1) % this.currentPattern.steps;
    this.nextStepTime += secondsPerStep;

    // 排程下一次執行（提前 25ms 排程以確保精準）
    const lookahead = 0.025; // 25ms lookahead
    const timeout = (this.nextStepTime - this.audioContext.currentTime - lookahead) * 1000;

    this.schedulerTimerId = window.setTimeout(() => {
      this.scheduleNextStep();
    }, Math.max(0, timeout));
  }

  /**
   * 應用力度變化（人性化）
   * @private
   */
  private applyVelocityVariation(baseVelocity: number): number {
    const variation = (Math.random() - 0.5) * 2 * this.velocityVariation;
    return Math.max(0.5, Math.min(1.0, baseVelocity + variation));
  }

  /**
   * 設定 BPM
   * @param bpm - Beats Per Minute (60-140)
   */
  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(140, bpm));
  }

  /**
   * 取得當前 BPM
   */
  getBPM(): number {
    return this.bpm;
  }

  /**
   * 設定 Swing 百分比
   * @param swing - Swing 百分比 (0-20)
   */
  setSwing(swing: number): void {
    this.swing = Math.max(0, Math.min(20, swing));
  }

  /**
   * 切換節奏模式
   * @param patternName - 節奏模式名稱
   */
  setPattern(patternName: PatternName): void {
    const wasPlaying = this.isPlaying;
    this.stop();

    this.currentPattern = this.patterns[patternName];
    this.bpm = this.currentPattern.defaultBPM;
    this.currentStep = 0;

    if (wasPlaying) {
      this.start();
    }
  }

  /**
   * 取得可用的節奏模式列表
   */
  getAvailablePatterns(): PatternName[] {
    return Object.keys(this.patterns) as PatternName[];
  }

  /**
   * 取得節奏模式資訊
   */
  getPatternInfo(patternName: PatternName): DrumPattern {
    return { ...this.patterns[patternName] };
  }

  // ========== 節奏模式建立方法 ==========

  /**
   * 建立 Basic Lofi 節奏模式
   * @private
   */
  private createBasicLofiPattern(): (DrumHit[] | null)[] {
    const pattern: (DrumHit[] | null)[] = new Array(16).fill(null);

    // Kick: 拍 1 (step 0) 和 拍 3 (step 8)
    pattern[0] = [{ drum: 'kick', velocity: 1.0 }];
    pattern[8] = [{ drum: 'kick', velocity: 0.95 }];

    // Snare: 拍 2 (step 4) 和 拍 4 (step 12)
    pattern[4] = [{ drum: 'snare', velocity: 0.9 }];
    pattern[12] = [{ drum: 'snare', velocity: 0.9 }];

    // Hi-hat: 每個 8 分音符 (steps 0, 2, 4, 6, 8, 10, 12, 14)
    for (let i = 0; i < 16; i += 2) {
      if (!pattern[i]) pattern[i] = [];
      pattern[i]!.push({ drum: 'hihat', velocity: i % 4 === 0 ? 0.8 : 0.6 });
    }

    return pattern;
  }

  /**
   * 建立 Synthwave Groove 節奏模式
   * @private
   */
  private createSynthwaveGroovePattern(): (DrumHit[] | null)[] {
    const pattern: (DrumHit[] | null)[] = new Array(16).fill(null);

    // Kick: 拍 1 (step 0) 和 拍 3.5 (step 10)
    pattern[0] = [{ drum: 'kick', velocity: 1.0 }];
    pattern[10] = [{ drum: 'kick', velocity: 0.9 }];

    // Snare: 拍 2 (step 4) 和 拍 4 (step 12)
    pattern[4] = [{ drum: 'snare', velocity: 0.95 }];
    pattern[12] = [{ drum: 'snare', velocity: 0.95 }];

    // Hi-hat: 8th notes (每個 8 分音符)
    for (let i = 0; i < 16; i += 2) {
      if (!pattern[i]) pattern[i] = [];
      pattern[i]!.push({ drum: 'hihat', velocity: 0.7 });
    }

    return pattern;
  }

  /**
   * 建立 Downtempo 節奏模式
   * @private
   */
  private createDowntempoPattern(): (DrumHit[] | null)[] {
    const pattern: (DrumHit[] | null)[] = new Array(16).fill(null);

    // Kick: 拍 1 (step 0) 和 拍 4 (step 12)
    pattern[0] = [{ drum: 'kick', velocity: 1.0 }];
    pattern[12] = [{ drum: 'kick', velocity: 0.85 }];

    // Snare: 拍 3 (step 8)
    pattern[8] = [{ drum: 'snare', velocity: 0.9 }];

    // Hi-hat: Triplets 近似（steps 0, 3, 5, 8, 11, 13）
    [0, 3, 5, 8, 11, 13].forEach((step) => {
      if (!pattern[step]) pattern[step] = [];
      pattern[step]!.push({ drum: 'hihat', velocity: 0.5 });
    });

    return pattern;
  }

  /**
   * 建立 Divination (占卜模式) 節奏模式
   * 需求 11.8 - 簡化節奏並降低 BPM
   * @private
   */
  private createDivinationPattern(): (DrumHit[] | null)[] {
    const pattern: (DrumHit[] | null)[] = new Array(16).fill(null);

    // Kick: 拍 1 (step 0) 和 拍 3 (step 8)
    pattern[0] = [{ drum: 'kick', velocity: 0.85 }];
    pattern[8] = [{ drum: 'kick', velocity: 0.8 }];

    // Snare: 拍 2 (step 4) 和 拍 4 (step 12)
    pattern[4] = [{ drum: 'snare', velocity: 0.75 }];
    pattern[12] = [{ drum: 'snare', velocity: 0.75 }];

    // Hi-hat: 簡化（只在拍點，steps 0, 4, 8, 12）
    [0, 4, 8, 12].forEach((step) => {
      if (!pattern[step]) pattern[step] = [];
      pattern[step]!.push({ drum: 'hihat', velocity: 0.5 });
    });

    return pattern;
  }

  /**
   * 清理資源
   */
  dispose(): void {
    this.stop();
  }
}
