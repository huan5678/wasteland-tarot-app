/**
 * ProceduralMusicEngine - 程序式音樂生成引擎
 * 需求 10: 程序式音樂生成引擎
 *
 * 整合 Bass、Pad、Lead 合成器，使用和弦進行演算法生成 Synthwave Lofi 音樂
 * 支援動態 BPM、和弦進行、旋律生成和鼓組節奏
 */

import { BassSynthesizer, BASS_PRESETS, midiToFrequency } from './synthesizers/BassSynthesizer';
import { PadSynthesizer, PAD_PRESETS, generateTriadFrequencies } from './synthesizers/PadSynthesizer';
import { LeadSynthesizer, LEAD_PRESETS } from './synthesizers/LeadSynthesizer';
import { logger } from '../logger';

/**
 * 音樂模式
 * 需求 3.5: 不同模式對應不同 BPM 和音樂複雜度
 */
export type MusicMode = 'lofi' | 'synthwave' | 'ambient' | 'divination';

/**
 * 和弦進行配置
 * 需求 10.7: 從預定義的 synthwave 和弦模式中選擇
 * 參考 requirements.md 附錄 B: Synthwave 和弦進行範例
 */
export interface ChordProgression {
  name: string;
  chords: ChordDefinition[];
  mode: 'aeolian' | 'dorian' | 'phrygian'; // 調式
}

export interface ChordDefinition {
  root: number; // MIDI 音符
  type: 'major' | 'minor' | 'diminished' | 'augmented';
  duration: number; // 小節數
}

/**
 * 音樂引擎配置
 */
export interface MusicEngineConfig {
  mode: MusicMode;
  bpm: number; // 60-120
  key: number; // 主音 MIDI 音符 (例如 A=57, C=60)
  chordProgression?: string; // 和弦進行名稱
  volume: number; // 0.0-1.0
  complexity: 'simple' | 'standard' | 'rich'; // 需求 12.7: 音樂複雜度等級
  crossfadeDuration?: number; // Task 2: crossfade 時長 (ms)，預設 2000ms
}

/**
 * 預定義的 Synthwave 和弦進行
 * 基於 requirements.md 附錄 B
 */
export const CHORD_PROGRESSIONS: Record<string, ChordProgression> = {
  // Am - F - C - G (i - VI - III - VII)
  classic_synthwave: {
    name: 'Classic Synthwave',
    mode: 'aeolian',
    chords: [
      { root: 57, type: 'minor', duration: 2 }, // Am
      { root: 65, type: 'major', duration: 2 }, // F
      { root: 60, type: 'major', duration: 2 }, // C
      { root: 67, type: 'major', duration: 2 }, // G
    ],
  },

  // Am - Dm - G - F (i - iv - VII - VI)
  melancholic: {
    name: 'Melancholic',
    mode: 'aeolian',
    chords: [
      { root: 57, type: 'minor', duration: 2 }, // Am
      { root: 62, type: 'minor', duration: 2 }, // Dm
      { root: 67, type: 'major', duration: 2 }, // G
      { root: 65, type: 'major', duration: 2 }, // F
    ],
  },

  // Am - D - G - F (i - IV - VII - VI, Dorian)
  dorian_groove: {
    name: 'Dorian Groove',
    mode: 'dorian',
    chords: [
      { root: 57, type: 'minor', duration: 2 }, // Am
      { root: 62, type: 'major', duration: 2 }, // D
      { root: 67, type: 'major', duration: 2 }, // G
      { root: 65, type: 'major', duration: 2 }, // F
    ],
  },

  // 簡化版 (占卜模式使用)
  divination_simple: {
    name: 'Divination Simple',
    mode: 'phrygian',
    chords: [
      { root: 57, type: 'minor', duration: 4 }, // Am (持續)
      { root: 58, type: 'major', duration: 4 }, // Bb (♭II)
    ],
  },
};

/**
 * 模式預設配置
 */
const MODE_PRESETS: Record<MusicMode, Partial<MusicEngineConfig>> = {
  lofi: {
    bpm: 70,
    complexity: 'standard',
    chordProgression: 'melancholic',
  },
  synthwave: {
    bpm: 110,
    complexity: 'rich',
    chordProgression: 'classic_synthwave',
  },
  ambient: {
    bpm: 60,
    complexity: 'simple',
    chordProgression: 'dorian_groove',
  },
  divination: {
    bpm: 65,
    complexity: 'simple',
    chordProgression: 'divination_simple',
  },
};

/**
 * CrossfadeManager - 淡入淡出管理器
 * Task 2: 實作無縫淡入淡出切換功能
 * Requirements 1.4, 2.2: 無縫切換、淡入淡出效果
 */
class CrossfadeManager {
  private audioContext: AudioContext;
  private currentGainNode: GainNode | null = null;
  private nextGainNode: GainNode | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * 執行淡入淡出切換
   * @param fromVoices - 當前正在播放的 Voice Managers (將淡出)
   * @param toVoices - 新的 Voice Managers (將淡入)
   * @param duration - 淡入淡出時長 (秒)
   * @param masterVolume - 主音量
   */
  async crossfade(
    fromVoices: { bass: VoiceManager<BassSynthesizer>; pad: VoiceManager<PadSynthesizer>; lead: VoiceManager<LeadSynthesizer> },
    toVoices: { bass: VoiceManager<BassSynthesizer>; pad: VoiceManager<PadSynthesizer>; lead: VoiceManager<LeadSynthesizer> },
    duration: number,
    masterVolume: number
  ): Promise<void> {
    const now = this.audioContext.currentTime;

    // 建立淡出 GainNode (用於當前音樂)
    if (this.currentGainNode) {
      // 當前音樂從目前音量淡出至 0
      this.currentGainNode.gain.setValueAtTime(this.currentGainNode.gain.value, now);
      this.currentGainNode.gain.linearRampToValueAtTime(0, now + duration);
    }

    // 建立淡入 GainNode (用於新音樂)
    this.nextGainNode = this.audioContext.createGain();
    this.nextGainNode.gain.setValueAtTime(0, now);
    this.nextGainNode.gain.linearRampToValueAtTime(masterVolume, now + duration);

    // 等待淡入淡出完成
    return new Promise((resolve) => {
      setTimeout(() => {
        // 淡入淡出完成後，停止舊音樂
        if (fromVoices) {
          fromVoices.bass.stopAll();
          fromVoices.pad.stopAll();
          fromVoices.lead.stopAll();
        }

        // 更新 GainNode 引用
        this.currentGainNode = this.nextGainNode;
        this.nextGainNode = null;

        resolve();
      }, duration * 1000);
    });
  }

  /**
   * 取得當前 GainNode
   */
  getCurrentGainNode(): GainNode | null {
    return this.currentGainNode;
  }

  /**
   * 設定當前 GainNode
   */
  setCurrentGainNode(gainNode: GainNode): void {
    this.currentGainNode = gainNode;
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    if (this.currentGainNode) {
      this.currentGainNode.disconnect();
      this.currentGainNode = null;
    }
    if (this.nextGainNode) {
      this.nextGainNode.disconnect();
      this.nextGainNode = null;
    }
  }
}

/**
 * 程序式音樂生成引擎類別
 * 需求 10.1: 建立 Synthesizer Engine，包含 3 個多音合成器聲部
 */
export class ProceduralMusicEngine {
  private audioContext: AudioContext;
  private destination: AudioNode;
  private config: MusicEngineConfig;
  private isPlaying: boolean = false;
  private startTime: number = 0;

  // Master GainNode - 用於即時音量控制
  private masterGain: GainNode;

  // 合成器實例
  private bassManager: VoiceManager<BassSynthesizer>;
  private padManager: VoiceManager<PadSynthesizer>;
  private leadManager: VoiceManager<LeadSynthesizer>;

  // 當前和弦進行
  private currentProgression: ChordProgression;

  // Task 2: Crossfade 管理器
  private crossfadeManager: CrossfadeManager;
  private isCrossfading: boolean = false;

  // 追蹤音樂循環的 timeout ID，用於清理
  private loopTimeoutId: number | null = null;

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    config: Partial<MusicEngineConfig> = {}
  ) {
    this.audioContext = audioContext;
    this.destination = destination;

    // 合併預設配置
    const mode = config.mode || 'synthwave';
    this.config = {
      mode,
      bpm: config.bpm || MODE_PRESETS[mode].bpm || 100,
      key: config.key || 57, // 預設 A minor
      volume: config.volume ?? 0.5,
      complexity: config.complexity || MODE_PRESETS[mode].complexity || 'standard',
      chordProgression: config.chordProgression || MODE_PRESETS[mode].chordProgression,
      crossfadeDuration: config.crossfadeDuration ?? 2000, // Task 2: 預設 2000ms
    };

    // 建立 Master GainNode 用於即時音量控制
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.setValueAtTime(this.config.volume, audioContext.currentTime);
    this.masterGain.connect(destination);

    // 載入和弦進行
    this.currentProgression = this.loadChordProgression(this.config.chordProgression!);

    // Task 2: 初始化 CrossfadeManager
    this.crossfadeManager = new CrossfadeManager(audioContext);

    // 建立 Voice Manager (多音管理)
    // 注意：合成器現在連接到 masterGain 而不是直接連接到 destination
    this.bassManager = new VoiceManager(() =>
      new BassSynthesizer(audioContext, this.masterGain, BASS_PRESETS.synthwave_classic)
    );
    this.padManager = new VoiceManager(() =>
      new PadSynthesizer(audioContext, this.masterGain, PAD_PRESETS.synthwave)
    );
    this.leadManager = new VoiceManager(() =>
      new LeadSynthesizer(audioContext, this.masterGain, LEAD_PRESETS.synthwave)
    );

    logger.info('[ProceduralMusicEngine] Initialized with Master GainNode', this.config);
  }

  /**
   * 載入和弦進行
   */
  private loadChordProgression(progressionName: string): ChordProgression {
    const progression = CHORD_PROGRESSIONS[progressionName];
    if (!progression) {
      logger.warn(`[ProceduralMusicEngine] Unknown progression: ${progressionName}, using default`);
      return CHORD_PROGRESSIONS.classic_synthwave;
    }
    return progression;
  }

  /**
   * 開始播放音樂
   * 需求 10.6: 自動生成和弦進行並循環播放
   */
  start(): void {
    if (this.isPlaying) {
      logger.warn('[ProceduralMusicEngine] Already playing');
      return;
    }

    // 清理任何殘留的 timeout，確保乾淨的啟動
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
      logger.info('[ProceduralMusicEngine] Cleared residual loop timeout before start');
    }

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;

    // DEBUG: 詳細日誌
    console.log('[ProceduralMusicEngine] Starting playback', {
      mode: this.config.mode,
      bpm: this.config.bpm,
      volume: this.config.volume,
      audioContextState: this.audioContext.state,
      audioContextTime: this.audioContext.currentTime,
      progression: this.currentProgression.name,
      chordCount: this.currentProgression.chords.length,
    });

    // 開始和弦循環
    this.scheduleChordLoop();

    logger.info('[ProceduralMusicEngine] Started');
  }

  /**
   * 排程和弦循環
   * 需求 10.7: 生成和弦進行並循環播放
   */
  private scheduleChordLoop(): void {
    if (!this.isPlaying) return;

    const { chords } = this.currentProgression;
    const beatDuration = 60 / this.config.bpm; // 一拍的時長 (秒)
    let currentTime = this.audioContext.currentTime;

    // DEBUG: 排程循環開始
    console.log('[ProceduralMusicEngine] Scheduling chord loop', {
      chordCount: chords.length,
      beatDuration,
      startTime: currentTime,
    });

    // 循環播放和弦進行
    for (const chord of chords) {
      const chordDuration = chord.duration * 4 * beatDuration; // 小節數轉換為秒

      // DEBUG: 排程和弦
      console.log('[ProceduralMusicEngine] Scheduling chord', {
        root: chord.root,
        type: chord.type,
        duration: chordDuration,
        startTime: currentTime,
      });

      // 播放和弦
      this.playChord(chord, currentTime, chordDuration);

      // 播放 Bass 音符
      this.playBassLine(chord, currentTime, chordDuration);

      // 根據複雜度決定是否播放 Lead
      if (this.config.complexity !== 'simple') {
        this.playMelody(chord, currentTime, chordDuration);
      }

      currentTime += chordDuration;
    }

    // 計算總循環時長並排程下一次循環
    const loopDuration = chords.reduce(
      (sum, chord) => sum + chord.duration * 4 * beatDuration,
      0
    );

    console.log('[ProceduralMusicEngine] Loop scheduled, next loop in', loopDuration, 'seconds');

    // 儲存 timeout ID 以便後續清理
    this.loopTimeoutId = setTimeout(() => {
      this.scheduleChordLoop();
    }, loopDuration * 1000) as unknown as number;
  }

  /**
   * 播放和弦 (Pad)
   * 簡化版：每小節只播放一次短促和弦，避免連續音色
   */
  private playChord(
    chord: ChordDefinition,
    startTime: number,
    duration: number
  ): void {
    const frequencies = generateTriadFrequencies(chord.root, chord.type);
    const pad = this.padManager.getVoice();
    const beatDuration = 60 / this.config.bpm;

    // 簡化 Pad：只在每小節開始播放一次短促和弦
    // 而不是持續整個小節（避免 12 個振盪器長時間疊加）
    const chordDuration = beatDuration * 0.5; // 只持續半拍
    const velocity = this.config.volume * 0.03; // 再降低 (原 0.05)

    pad.playChord(frequencies, startTime, chordDuration, velocity);
  }

  /**
   * 播放 Bass Line
   * 需求 10.3: Bass 聲部使用 Sawtooth/Square + Lowpass Filter
   * 簡化版：四四拍節奏，短促音符，避免重疊
   */
  private playBassLine(
    chord: ChordDefinition,
    startTime: number,
    duration: number
  ): void {
    const bass = this.bassManager.getVoice();

    // Bass 音符頻率 (根音低八度)
    const bassFreq = midiToFrequency(chord.root - 12);
    const beatDuration = 60 / this.config.bpm;

    // 簡化 Bass 模式：四四拍，短促打擊（模仿 sample.html 的 Kick）
    // 每一拍播放一次（16分音符中的 1, 5, 9, 13）
    const beatsPerChord = Math.floor(duration / beatDuration);

    for (let i = 0; i < beatsPerChord; i++) {
      const noteStart = startTime + i * beatDuration;
      const noteDuration = beatDuration * 0.15; // 極短（15%），模仿 Kick drum
      const velocity = this.config.volume * 0.08; // 進一步降低 (原 0.12)

      bass.playNote(bassFreq, noteStart, noteDuration, velocity);
    }
  }

  /**
   * 播放旋律 (Lead)
   * 需求 10.5: Lead 使用 Pulse/Triangle Wave + LFO
   * 簡化版：稀疏旋律，只在重拍播放，避免音符重疊
   */
  private playMelody(
    chord: ChordDefinition,
    startTime: number,
    duration: number
  ): void {
    const lead = this.leadManager.getVoice();
    const beatDuration = 60 / this.config.bpm;

    // 簡化旋律生成：只在偶數拍播放（2和4拍，模仿 Snare 位置）
    const scale = this.getScaleNotes(chord.root, chord.type);
    const beatsPerChord = Math.floor(duration / beatDuration);

    for (let i = 0; i < beatsPerChord; i++) {
      // 只在偶數拍播放（降低密度 50%）
      if (i % 2 !== 0) {
        // 選擇和弦音（不再隨機，使用固定模式）
        const noteIndex = Math.floor(i / 2) % 3; // 輪流使用三和弦的三個音
        const midiNote = scale[noteIndex] + 12; // 高八度
        const freq = midiToFrequency(midiNote);

        const noteStart = startTime + i * beatDuration;
        const noteDuration = beatDuration * 0.3; // 更短（30%），確保無重疊
        const velocity = this.config.volume * 0.06; // 進一步降低 (原 0.08)

        lead.playNote(freq, noteStart, noteDuration, velocity);
      }
    }
  }

  /**
   * 獲取音階音符 (基於和弦)
   */
  private getScaleNotes(root: number, type: 'major' | 'minor' | 'diminished' | 'augmented'): number[] {
    const intervals = type === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return intervals.map((interval) => root + interval);
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // 清理音樂循環 timeout，防止重疊
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
      logger.info('[ProceduralMusicEngine] Cleared loop timeout');
    }

    // 停止所有合成器
    this.bassManager.stopAll();
    this.padManager.stopAll();
    this.leadManager.stopAll();

    logger.info('[ProceduralMusicEngine] Stopped');
  }

  /**
   * 切換模式
   * Task 2: 使用 crossfade 平滑切換音樂模式
   * Requirements 1.4, 2.2, 3.5: 場景切換時調整音樂模式，使用淡入淡出效果
   */
  async switchMode(mode: MusicMode, useCrossfade: boolean = true): Promise<void> {
    const wasPlaying = this.isPlaying;

    // 更新配置
    this.config.mode = mode;
    this.config.bpm = MODE_PRESETS[mode].bpm || this.config.bpm;
    this.config.complexity = MODE_PRESETS[mode].complexity || this.config.complexity;

    const progressionName = MODE_PRESETS[mode].chordProgression || 'classic_synthwave';
    this.currentProgression = this.loadChordProgression(progressionName);

    logger.info(`[ProceduralMusicEngine] Switching to mode: ${mode}, crossfade: ${useCrossfade}`);

    // 如果正在播放且使用 crossfade
    if (wasPlaying && useCrossfade && this.config.crossfadeDuration && this.config.crossfadeDuration > 0) {
      this.isCrossfading = true;

      // 保存當前的 Voice Managers
      const oldVoices = {
        bass: this.bassManager,
        pad: this.padManager,
        lead: this.leadManager,
      };

      // 建立新的 Voice Managers，連接到 masterGain
      this.bassManager = new VoiceManager(() =>
        new BassSynthesizer(this.audioContext, this.masterGain, BASS_PRESETS.synthwave_classic)
      );
      this.padManager = new VoiceManager(() =>
        new PadSynthesizer(this.audioContext, this.masterGain, PAD_PRESETS.synthwave)
      );
      this.leadManager = new VoiceManager(() =>
        new LeadSynthesizer(this.audioContext, this.masterGain, LEAD_PRESETS.synthwave)
      );

      const newVoices = {
        bass: this.bassManager,
        pad: this.padManager,
        lead: this.leadManager,
      };

      // 開始新音樂 (音量為 0，將淡入)
      this.scheduleChordLoop();

      // 執行 crossfade
      const crossfadeDurationSec = this.config.crossfadeDuration / 1000;
      await this.crossfadeManager.crossfade(
        oldVoices,
        newVoices,
        crossfadeDurationSec,
        this.config.volume
      );

      this.isCrossfading = false;
      logger.info(`[ProceduralMusicEngine] Crossfade complete`);
    } else if (wasPlaying) {
      // 不使用 crossfade，直接切換
      // 清理舊的循環 timeout，防止重疊
      if (this.loopTimeoutId !== null) {
        clearTimeout(this.loopTimeoutId);
        this.loopTimeoutId = null;
        logger.info('[ProceduralMusicEngine] Cleared old loop timeout before mode switch');
      }

      this.stop();
      this.start();
      logger.info(`[ProceduralMusicEngine] Mode switched without crossfade`);
    } else {
      logger.info(`[ProceduralMusicEngine] Mode updated (not playing)`);
    }
  }

  /**
   * 設定音量
   * @param volume - 音量值 (0-1)
   * 使用 Master GainNode 即時更新音量，影響所有正在播放和未來排程的音符
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));

    // 即時更新 Master GainNode 的音量，使用平滑過渡避免爆音
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.config.volume, now + 0.05); // 50ms 平滑過渡

    logger.info(`[ProceduralMusicEngine] Volume set to ${this.config.volume} (applied to Master GainNode)`);
  }

  /**
   * 設定 BPM
   * @param bpm - BPM 值 (60-140)
   */
  setBPM(bpm: number): void {
    this.config.bpm = Math.max(60, Math.min(140, bpm));
    logger.info(`[ProceduralMusicEngine] BPM set to ${this.config.bpm}`);

    // 如果正在播放，重新啟動以應用新 BPM
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  /**
   * 獲取當前模式
   */
  getCurrentMode(): MusicMode {
    return this.config.mode;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MusicEngineConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (newConfig.chordProgression) {
      this.currentProgression = this.loadChordProgression(newConfig.chordProgression);
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig(): MusicEngineConfig {
    return { ...this.config };
  }

  /**
   * 檢查是否正在播放
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * 銷毀引擎並釋放資源
   * Task 2: 新增 CrossfadeManager 清理
   */
  dispose(): void {
    this.stop();
    this.bassManager.cleanup();
    this.padManager.cleanup();
    this.leadManager.cleanup();
    this.crossfadeManager.cleanup(); // Task 2: 清理 crossfade 資源

    // 清理 Master GainNode
    if (this.masterGain) {
      this.masterGain.disconnect();
    }

    logger.info('[ProceduralMusicEngine] Disposed');
  }
}

/**
 * Voice Manager - 管理多個合成器實例 (Polyphony)
 * 需求 10.1: 支援多音 (polyphonic) 合成器聲部
 */
class VoiceManager<T extends { stop: () => void }> {
  private voices: T[] = [];
  private currentIndex: number = 0;
  private readonly maxVoices: number = 8; // 需求: 最多 8 個同時播放的音符
  private voiceFactory: () => T;

  constructor(factory: () => T) {
    this.voiceFactory = factory;
  }

  /**
   * 獲取可用的 Voice (循環分配)
   */
  getVoice(): T {
    if (this.voices.length < this.maxVoices) {
      const voice = this.voiceFactory();
      this.voices.push(voice);
      return voice;
    }

    // 循環使用現有 Voice
    const voice = this.voices[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.maxVoices;
    return voice;
  }

  /**
   * 停止所有 Voice
   */
  stopAll(): void {
    for (const voice of this.voices) {
      voice.stop();
    }
  }

  /**
   * 清理所有 Voice
   */
  cleanup(): void {
    this.stopAll();
    this.voices = [];
    this.currentIndex = 0;
  }
}

/**
 * 工廠函式：建立預設引擎
 */
export function createMusicEngine(
  audioContext: AudioContext,
  destination: AudioNode,
  mode: MusicMode = 'synthwave'
): ProceduralMusicEngine {
  return new ProceduralMusicEngine(audioContext, destination, { mode });
}
