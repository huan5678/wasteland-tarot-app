/**
 * EditorAudioSynthesizer - 編輯器專用音訊合成器
 *
 * 基於 Web Audio API 實現即時音效預覽
 * 支援 5 種樂器：Kick, Snare, HiHat, OpenHat, Clap
 * 獨立 AudioContext，不干擾播放器
 *
 * @example
 * const editorSynthesizer = new EditorAudioSynthesizer({
 *   audioContext: new AudioContext(),
 *   tempo: 120
 * });
 *
 * // 單步驟音效測試
 * editorSynthesizer.playInstrument('kick');
 *
 * // 預覽完整 Pattern
 * editorSynthesizer.previewPattern(myPattern);
 */

import type { Pattern } from './RhythmAudioSynthesizer';

/**
 * EditorAudioSynthesizer 配置介面
 */
export interface EditorAudioSynthesizerConfig {
  audioContext: AudioContext;
  tempo: number;            // BPM（預設 120）
}

/**
 * 樂器類型
 */
export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap';

/**
 * EditorAudioSynthesizer 類別
 *
 * 職責：
 * - 即時預覽音效（編輯器播放按鈕）
 * - 單步驟音效測試（點擊步驟格子時播放）
 * - 獨立 AudioContext（不干擾播放器）
 */
export class EditorAudioSynthesizer {
  private audioContext: AudioContext;
  private tempo: number;

  // 白噪音 Buffer（預先生成）
  private noiseBuffer: AudioBuffer | null = null;

  // 預覽播放狀態
  private isPreviewPlaying: boolean = false;
  private currentPreviewStep: number = 0;
  private previewTimerID: number | null = null;
  private currentPreviewPattern: Pattern | null = null;
  private nextPreviewStepTime: number = 0;

  /**
   * 建構子
   * @param config - EditorAudioSynthesizer 配置
   */
  constructor(config: EditorAudioSynthesizerConfig) {
    this.audioContext = config.audioContext;
    this.tempo = config.tempo;

    // 預先生成白噪音 Buffer
    this.noiseBuffer = this.createNoiseBuffer();
  }

  /**
   * 設定速度（BPM）
   * @param bpm - 速度（60-180 BPM）
   */
  public setTempo(bpm: number): void {
    this.tempo = Math.max(60, Math.min(180, bpm));
  }

  /**
   * 播放單一樂器音效（即時預覽）
   *
   * 用於點擊步驟格子時測試音效
   *
   * @param instrument - 樂器類型
   */
  public playInstrument(instrument: InstrumentType): void {
    const time = this.audioContext.currentTime;

    switch (instrument) {
      case 'kick':
        this.playKick(time);
        break;
      case 'snare':
        this.playSnare(time);
        break;
      case 'hihat':
        this.playHiHat(time);
        break;
      case 'openhat':
        this.playOpenHat(time);
        break;
      case 'clap':
        this.playClap(time);
        break;
    }
  }

  /**
   * 預覽完整 Pattern（16 步驟循環一次）
   *
   * 用於編輯器播放按鈕
   *
   * @param pattern - Pattern 物件
   */
  public previewPattern(pattern: Pattern): void {
    if (this.isPreviewPlaying) {
      this.stopPreview();
    }

    this.currentPreviewPattern = pattern;
    this.isPreviewPlaying = true;
    this.currentPreviewStep = 0;
    this.nextPreviewStepTime = this.audioContext.currentTime;

    this.schedulePreviewStep();
  }

  /**
   * 停止預覽
   */
  public stopPreview(): void {
    this.isPreviewPlaying = false;

    if (this.previewTimerID !== null) {
      globalThis.clearTimeout(this.previewTimerID);
      this.previewTimerID = null;
    }

    this.currentPreviewStep = 0;
    this.currentPreviewPattern = null;
  }

  /**
   * 檢查是否正在預覽
   * @returns 是否正在預覽
   */
  public isPreviewingPattern(): boolean {
    return this.isPreviewPlaying;
  }

  // ===========================================
  // 音效合成方法（與 RhythmAudioSynthesizer 相同）
  // ===========================================

  /**
   * 播放 Kick Drum 音效
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
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  /**
   * 播放 Snare Drum 音效
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
    noiseGain.connect(this.audioContext.destination);

    // Triangle Wave 部分
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 180;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.audioContext.destination);

    noise.start(time);
    noise.stop(time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * 播放 Hi-Hat 音效
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
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * 播放 Open Hi-Hat 音效
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
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * 播放 Clap 音效
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
    gain.connect(this.audioContext.destination);

    noise.start(time);
    noise.stop(time + 0.1);
  }

  /**
   * 建立白噪音 Buffer
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
      output[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  // ===========================================
  // 預覽播放邏輯
  // ===========================================

  /**
   * 排程預覽步驟
   */
  private schedulePreviewStep(): void {
    if (!this.currentPreviewPattern || !this.isPreviewPlaying) return;

    const stepDuration = (60 / this.tempo) / 4;
    const scheduleAheadTime = 0.1;

    while (this.nextPreviewStepTime < this.audioContext.currentTime + scheduleAheadTime) {
      this.playPreviewStep(this.currentPreviewStep, this.nextPreviewStepTime);

      this.nextPreviewStepTime += stepDuration;
      this.currentPreviewStep++;

      // 完成 16 步驟後停止
      if (this.currentPreviewStep >= 16) {
        this.stopPreview();
        return;
      }
    }

    // 繼續排程
    if (this.isPreviewPlaying) {
      this.previewTimerID = globalThis.setTimeout(() => {
        this.schedulePreviewStep();
      }, 25) as unknown as number;
    }
  }

  /**
   * 播放預覽步驟
   * @param step - 步驟索引（0-15）
   * @param time - Web Audio API 時間戳
   */
  private playPreviewStep(step: number, time: number): void {
    if (!this.currentPreviewPattern) return;

    if (this.currentPreviewPattern.kick[step]) this.playKick(time);
    if (this.currentPreviewPattern.snare[step]) this.playSnare(time);
    if (this.currentPreviewPattern.hihat[step]) this.playHiHat(time);
    if (this.currentPreviewPattern.openhat[step]) this.playOpenHat(time);
    if (this.currentPreviewPattern.clap[step]) this.playClap(time);
  }

  /**
   * 釋放資源
   */
  public destroy(): void {
    this.stopPreview();
  }
}
