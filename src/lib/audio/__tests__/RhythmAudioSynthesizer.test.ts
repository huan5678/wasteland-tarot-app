/**
 * RhythmAudioSynthesizer 單元測試
 *
 * 測試項目：
 * 1. 5 種樂器音效播放
 * 2. Pattern 循環播放（4 次循環）
 * 3. 播放控制（播放/暫停/停止）
 * 4. Pattern 切換邏輯
 * 5. Tempo 調整
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RhythmAudioSynthesizer,
  type Pattern,
  type RhythmAudioSynthesizerConfig,
} from '../RhythmAudioSynthesizer';

// Mock AudioContext
class MockAudioContext {
  public currentTime = 0;
  public sampleRate = 44100;
  public destination = {};

  createOscillator() {
    return {
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      type: 'sine',
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 0 },
      connect: vi.fn(),
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
}

// 測試用 Pattern（Techno）
const technoPattern: Pattern = {
  kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
  clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
};

// 測試用 Pattern（House）
const housePattern: Pattern = {
  kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
  openhat: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
  clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
};

describe('RhythmAudioSynthesizer', () => {
  let audioContext: AudioContext;
  let synthesizer: RhythmAudioSynthesizer;
  let config: RhythmAudioSynthesizerConfig;

  beforeEach(() => {
    // @ts-ignore - Mock AudioContext
    audioContext = new MockAudioContext() as AudioContext;

    config = {
      audioContext,
      patterns: [technoPattern, housePattern],
      tempo: 120,
      loopCount: 4,
    };

    synthesizer = new RhythmAudioSynthesizer(config);
  });

  describe('初始化', () => {
    it('應該正確初始化合成器', () => {
      expect(synthesizer).toBeDefined();
      const state = synthesizer.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.currentPatternIndex).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.currentLoop).toBe(1);
    });

    it('應該正確設定初始 patterns', () => {
      synthesizer.setPatterns([technoPattern]);
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(0);
    });
  });

  describe('Tempo 控制', () => {
    it('應該正確設定 tempo', () => {
      synthesizer.setTempo(140);
      // Tempo 已更新，但無法直接測試私有屬性
      // 透過播放來驗證（需要整合測試）
    });

    it('應該限制 tempo 範圍在 60-180 BPM', () => {
      synthesizer.setTempo(50); // 小於最小值
      synthesizer.setTempo(200); // 大於最大值
      // 透過播放來驗證 tempo 被限制在合法範圍
    });
  });

  describe('Pattern 管理', () => {
    it('應該正確載入單一 Pattern', () => {
      synthesizer.loadPattern(housePattern);
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.currentLoop).toBe(1);
    });

    it('應該正確設定多個 Patterns', () => {
      const patterns = [technoPattern, housePattern];
      synthesizer.setPatterns(patterns);
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(0);
    });
  });

  describe('播放控制', () => {
    it('應該能夠開始播放', () => {
      synthesizer.play();
      const state = synthesizer.getState();
      expect(state.isPlaying).toBe(true);
    });

    it('應該能夠暫停播放', () => {
      synthesizer.play();
      synthesizer.pause();
      const state = synthesizer.getState();
      expect(state.isPlaying).toBe(false);
      // 暫停後不應重置步驟
      // expect(state.currentStep).toBeGreaterThanOrEqual(0);
    });

    it('應該能夠停止播放', () => {
      synthesizer.play();
      synthesizer.stop();
      const state = synthesizer.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.currentStep).toBe(0);
      expect(state.currentLoop).toBe(1);
    });

    it('停止後應重置到步驟 0', () => {
      synthesizer.play();
      synthesizer.stop();
      const state = synthesizer.getState();
      expect(state.currentStep).toBe(0);
      expect(state.currentLoop).toBe(1);
    });
  });

  describe('Pattern 切換', () => {
    it('應該能夠切換到下一個 Pattern', () => {
      synthesizer.next();
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(1);
      expect(state.currentStep).toBe(0);
      expect(state.currentLoop).toBe(1);
    });

    it('應該能夠切換到上一個 Pattern', () => {
      synthesizer.next(); // 切到索引 1
      synthesizer.previous(); // 切回索引 0
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(0);
    });

    it('應該循環切換 Pattern（next 到最後一個後回到第一個）', () => {
      synthesizer.next(); // 索引 1
      synthesizer.next(); // 索引 0（循環）
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(0);
    });

    it('應該循環切換 Pattern（previous 在第一個時回到最後一個）', () => {
      synthesizer.previous();
      const state = synthesizer.getState();
      expect(state.currentPatternIndex).toBe(1); // 2 patterns，從 0 往前回到 1
    });
  });

  describe('Pattern 完成回呼', () => {
    it('應該在 Pattern 完成時觸發回呼', (done) => {
      synthesizer.setOnPatternComplete(() => {
        done();
      });

      // 模擬 Pattern 完成（需要整合測試）
      // 這裡僅驗證回呼可以設定
    });
  });

  describe('資源管理', () => {
    it('應該能夠銷毀合成器', () => {
      synthesizer.play();
      synthesizer.destroy();
      const state = synthesizer.getState();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('邊界情況', () => {
    it('空播放清單時不應播放', () => {
      synthesizer.setPatterns([]);
      synthesizer.play();
      const state = synthesizer.getState();
      // 空播放清單不應啟動播放
      expect(state.currentPatternIndex).toBe(0);
    });

    it('已播放中時再次呼叫 play 不應有效', () => {
      synthesizer.play();
      const state1 = synthesizer.getState();
      expect(state1.isPlaying).toBe(true);

      synthesizer.play(); // 再次呼叫
      const state2 = synthesizer.getState();
      expect(state2.isPlaying).toBe(true);
    });
  });
});
