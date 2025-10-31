/**
 * RhythmAudioSynthesizer - 播放器專用音訊合成器
 *
 * 基於 Web Audio API 實現 16 步驟節奏 Pattern 播放
 * 支援 5 種樂器：Kick, Snare, HiHat, OpenHat, Clap
 * 每個 Pattern 循環播放 4 次後自動切換下一首
 *
 * @example
 * const synthesizer = new RhythmAudioSynthesizer({
 *   audioContext: new AudioContext(),
 *   patterns: [technoPattern, housePattern],
 *   tempo: 120,
 *   loopCount: 4
 * });
 *
 * synthesizer.play();
 */

import { logger } from '../logger';

/**
 * 16 步驟節奏 Pattern
 * 每個軌道包含 16 個布林值，true 表示該步驟啟用
 */
export interface Pattern {
  kick: boolean[];      // Kick Drum（16 步驟）
  snare: boolean[];     // Snare Drum（16 步驟）
  hihat: boolean[];     // Hi-Hat（16 步驟）
  openhat: boolean[];   // Open Hi-Hat（16 步驟）
  clap: boolean[];      // Clap（16 步驟）
}

/**
 * RhythmAudioSynthesizer 配置介面
 */
export interface RhythmAudioSynthesizerConfig {
  audioContext: AudioContext;
  patterns: Pattern[];      // 播放清單中的所有 Pattern
  tempo: number;            // BPM（預設 120）
  loopCount: number;        // 每個 Pattern 循環次數（預設 4）
}

/**
 * RhythmAudioSynthesizer 狀態介面
 */
export interface RhythmAudioSynthesizerState {
  isPlaying: boolean;
  currentPatternIndex: number;
  currentStep: number;      // 0-15
  currentLoop: number;      // 1-4
}

/**
 * Pattern 完成回呼函式（4 次循環後觸發）
 */
export type OnPatternCompleteCallback = () => void;

/**
 * RhythmAudioSynthesizer 類別
 *
 * 職責：
 * - 播放 Pattern 音訊（Web Audio API）
 * - 循環播放 Pattern（每個 Pattern 循環 4 次）
 * - 管理播放清單切換
 */
export class RhythmAudioSynthesizer {
  private audioContext: AudioContext;
  private destination: AudioNode;
  private patterns: Pattern[];
  private tempo: number;
  private loopCountLimit: number;

  // 狀態管理
  private isPlaying: boolean = false;
  private currentPatternIndex: number = 0;
  private currentStep: number = 0;
  private currentLoop: number = 1;

  // 音量控制
  private masterGainNode: GainNode;
  private currentVolume: number = 0.7;

  // P3.4: AnalyserNode - 用於音訊視覺化
  private analyserNode: AnalyserNode | null = null;

  // 白噪音 Buffer（預先生成，避免重複計算）
  private noiseBuffer: AudioBuffer | null = null;

  // 排程相關
  private nextStepTime: number = 0;
  private scheduleAheadTime: number = 0.1; // 提前 0.1 秒排程
  private timerID: number | null = null;

  // 回呼函式
  private onPatternComplete: OnPatternCompleteCallback | null = null;

  /**
   * 建構子
   * @param audioContext - Web Audio API AudioContext
   * @param destination - 音訊輸出目標節點
   * @param config - 可選配置（BPM, volume, loopCount）
   */
  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    config?: { bpm?: number; volume?: number; loopCount?: number }
  ) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.patterns = [];
    this.tempo = config?.bpm || 120;
    this.loopCountLimit = config?.loopCount || 4;
    this.currentVolume = config?.volume ?? 0.7;

    // 創建 master gain node 用於音量控制
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = this.currentVolume;

    // P3.4: 建立 AnalyserNode 用於音訊視覺化
    // 插入在 masterGainNode 和 destination 之間
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 64; // 產生 32 個頻率 bins (適合 16 個柱狀圖)
    this.analyserNode.smoothingTimeConstant = 0.8; // 平滑度 (0-1)
    this.analyserNode.minDecibels = -90;
    this.analyserNode.maxDecibels = -10;

    // 連接音訊圖: masterGainNode -> analyserNode -> destination
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.destination);

    // 預先生成白噪音 Buffer
    this.noiseBuffer = this.createNoiseBuffer();
  }

  /**
   * 設定 Pattern 完成回呼函式
   * @param callback - 回呼函式
   */
  public setOnPatternComplete(callback: OnPatternCompleteCallback): void {
    this.onPatternComplete = callback;
  }

  /**
   * 獲取當前狀態
   * @returns 當前狀態物件
   */
  public getState(): RhythmAudioSynthesizerState {
    return {
      isPlaying: this.isPlaying,
      currentPatternIndex: this.currentPatternIndex,
      currentStep: this.currentStep,
      currentLoop: this.currentLoop,
    };
  }

  /**
   * P3.4: 取得 AnalyserNode 用於音訊視覺化
   * @returns AnalyserNode instance for real-time frequency analysis
   */
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * 設定播放清單
   * @param patterns - Pattern 陣列
   */
  public setPatterns(patterns: Pattern[]): void {
    this.patterns = patterns;
  }

  /**
   * 設定速度（BPM）
   * @param bpm - 速度（60-180 BPM）
   */
  public setTempo(bpm: number): void {
    // 限制 BPM 範圍
    this.tempo = Math.max(60, Math.min(180, bpm));
  }

  /**
   * 載入指定 Pattern（用於切換歌曲）
   * @param pattern - Pattern 物件
   */
  public loadPattern(pattern: Pattern): void {
    // 將單一 Pattern 載入為播放清單
    this.patterns = [pattern];
    this.currentPatternIndex = 0;
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 載入播放清單
   * @param patterns - Pattern 陣列
   * @param startIndex - 起始索引（預設 0）
   */
  public loadPlaylist(patterns: Pattern[], startIndex: number = 0): void {
    this.patterns = patterns;
    this.currentPatternIndex = Math.max(0, Math.min(startIndex, patterns.length - 1));
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 設定當前 Pattern 索引
   * @param index - Pattern 索引
   */
  public setCurrentPatternIndex(index: number): void {
    if (index < 0 || index >= this.patterns.length) {
      logger.warn(`[RhythmAudioSynthesizer] Invalid pattern index: ${index}`);
      return;
    }

    this.currentPatternIndex = index;
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 設定音量
   * @param volume - 音量值（0-1）
   */
  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.currentVolume;
    }
  }

  /**
   * 取得當前音量
   * @returns 當前音量（0-1）
   */
  public getVolume(): number {
    return this.currentVolume;
  }

  /**
   * 釋放資源（dispose 別名）
   */
  public dispose(): void {
    this.destroy();
  }

  // ===========================================
  // 音效合成方法（5 種樂器）
  // ===========================================

  /**
   * 播放 Kick Drum 音效
   *
   * 參數：
   * - 頻率：150 Hz → 0.01 Hz（exponential ramp 0.5s）
   * - 增益：1 → 0.01（exponential ramp 0.5s）
   *
   * @param time - Web Audio API 時間戳
   */
  private playKick(time: number): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  /**
   * 播放 Snare Drum 音效
   *
   * 參數：
   * - 白噪音：highpass @ 1000 Hz，decay 0.2s
   * - Triangle Wave：180 Hz，decay 0.1s
   *
   * @param time - Web Audio API 時間戳
   */
  private playSnare(time: number): void {
    if (!this.noiseBuffer) return;

    // 白噪音部分
    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGainNode);

    // Triangle Wave 部分
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 180;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGainNode);

    noise.start(time);
    noise.stop(time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * 播放 Hi-Hat 音效
   *
   * 參數：
   * - Square Wave：10000 Hz
   * - Highpass Filter：7000 Hz
   * - 增益：0.3 → 0.01（decay 0.05s）
   *
   * @param time - Web Audio API 時間戳
   */
  private playHiHat(time: number): void {
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 10000;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * 播放 Open Hi-Hat 音效
   *
   * 參數：
   * - Square Wave：10000 Hz
   * - Highpass Filter：7000 Hz
   * - 增益：0.3 → 0.01（decay 0.3s）
   *
   * @param time - Web Audio API 時間戳
   */
  private playOpenHat(time: number): void {
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 10000;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * 播放 Clap 音效
   *
   * 參數：
   * - 白噪音
   * - Bandpass Filter：1500 Hz
   * - 增益：1 → 0.01（decay 0.1s）
   *
   * @param time - Web Audio API 時間戳
   */
  private playClap(time: number): void {
    if (!this.noiseBuffer) return;

    const noise = this.audioContext.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noise.start(time);
    noise.stop(time + 0.1);
  }

  /**
   * 建立白噪音 Buffer
   *
   * 產生 0.5 秒的白噪音，用於 Snare 和 Clap
   *
   * @returns AudioBuffer
   */
  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // 範圍：-1 到 1
    }

    return buffer;
  }

  /**
   * 播放單一步驟的所有啟用樂器
   * @param step - 步驟索引（0-15）
   * @param time - Web Audio API 時間戳
   */
  private playStep(step: number, time: number): void {
    const pattern = this.patterns[this.currentPatternIndex];
    if (!pattern) return;

    // 檢查每個軌道的該步驟是否啟用
    if (pattern.kick[step]) this.playKick(time);
    if (pattern.snare[step]) this.playSnare(time);
    if (pattern.hihat[step]) this.playHiHat(time);
    if (pattern.openhat[step]) this.playOpenHat(time);
    if (pattern.clap[step]) this.playClap(time);
  }

  // ===========================================
  // Pattern 播放邏輯（16 步驟循環）
  // ===========================================

  /**
   * 排程下一個步驟
   *
   * 使用 Web Audio API 精準排程，確保節奏穩定
   * 每個步驟時間：60 / bpm / 4（16 分音符）
   */
  private scheduleNextStep(): void {
    // 計算步驟持續時間（秒）
    // 16 分音符 = 60 / BPM / 4
    const stepDuration = (60 / this.tempo) / 4;

    // 排程目前步驟的音效
    while (this.nextStepTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.playStep(this.currentStep, this.nextStepTime);

      // 更新下一步時間
      this.nextStepTime += stepDuration;

      // 前進到下一步
      this.currentStep++;

      // 檢查是否完成 16 步驟循環
      if (this.currentStep >= 16) {
        this.currentStep = 0;
        this.currentLoop++;

        // 檢查是否完成指定循環次數
        if (this.currentLoop > this.loopCountLimit) {
          this.handlePatternComplete();
        }
      }
    }

    // 繼續排程下一輪（使用 setTimeout 避免阻塞主執行緒）
    if (this.isPlaying) {
      this.timerID = globalThis.setTimeout(() => {
        this.scheduleNextStep();
      }, 25) as unknown as number; // 每 25ms 檢查一次
    }
  }

  /**
   * Pattern 完成處理（4 次循環後）
   */
  private handlePatternComplete(): void {
    // 重置循環計數器
    this.currentLoop = 1;

    // 切換到下一個 Pattern
    if (this.patterns.length > 1) {
      this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
    }

    // 觸發回呼（通知 UI 更新）
    if (this.onPatternComplete) {
      this.onPatternComplete();
    }
  }

  // ===========================================
  // 播放控制方法
  // ===========================================

  /**
   * 開始播放
   */
  public play(): void {
    if (this.isPlaying) return;
    if (this.patterns.length === 0) return;

    this.isPlaying = true;

    // 初始化時間（從當前時間開始）
    this.nextStepTime = this.audioContext.currentTime;

    // 開始排程
    this.scheduleNextStep();
  }

  /**
   * 暫停播放（保留位置）
   */
  public pause(): void {
    this.isPlaying = false;

    // 取消排程 timer
    if (this.timerID !== null) {
      globalThis.clearTimeout(this.timerID);
      this.timerID = null;
    }

    // 注意：不重置 currentStep 和 currentLoop，以便恢復播放
  }

  /**
   * 停止播放（重置到步驟 0）
   */
  public stop(): void {
    this.isPlaying = false;

    // 取消排程 timer
    if (this.timerID !== null) {
      globalThis.clearTimeout(this.timerID);
      this.timerID = null;
    }

    // 重置位置
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 下一個 Pattern
   */
  public next(): void {
    if (this.patterns.length === 0) return;

    this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 上一個 Pattern
   */
  public previous(): void {
    if (this.patterns.length === 0) return;

    this.currentPatternIndex = (this.currentPatternIndex - 1 + this.patterns.length) % this.patterns.length;
    this.currentStep = 0;
    this.currentLoop = 1;
  }

  /**
   * 釋放 AudioContext 資源
   */
  public destroy(): void {
    this.stop();

    // P3.4: 清理 AnalyserNode
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    // 清理 Master GainNode
    if (this.masterGainNode) {
      this.masterGainNode.disconnect();
    }

    // 注意：不關閉 AudioContext，因為它可能被其他組件共用
    // 如果需要完全釋放，由外部呼叫 audioContext.close()
  }
}
