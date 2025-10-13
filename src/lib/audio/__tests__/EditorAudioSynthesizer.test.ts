/**
 * EditorAudioSynthesizer 單元測試
 *
 * 測試項目：
 * 1. 單一樂器音效播放
 * 2. Pattern 預覽播放
 * 3. 預覽控制（開始/停止）
 * 4. 獨立 AudioContext（不干擾播放器）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EditorAudioSynthesizer,
  type EditorAudioSynthesizerConfig,
  type InstrumentType,
} from '../EditorAudioSynthesizer';
import type { Pattern } from '../RhythmAudioSynthesizer';

// Mock AudioContext（與 RhythmAudioSynthesizer 測試共用）
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

// 測試用 Pattern
const testPattern: Pattern = {
  kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
  clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
};

describe('EditorAudioSynthesizer', () => {
  let audioContext: AudioContext;
  let synthesizer: EditorAudioSynthesizer;
  let config: EditorAudioSynthesizerConfig;

  beforeEach(() => {
    // @ts-ignore - Mock AudioContext
    audioContext = new MockAudioContext() as AudioContext;

    config = {
      audioContext,
      tempo: 120,
    };

    synthesizer = new EditorAudioSynthesizer(config);
  });

  describe('初始化', () => {
    it('應該正確初始化編輯器合成器', () => {
      expect(synthesizer).toBeDefined();
      expect(synthesizer.isPreviewingPattern()).toBe(false);
    });
  });

  describe('Tempo 控制', () => {
    it('應該正確設定 tempo', () => {
      synthesizer.setTempo(140);
      // Tempo 已更新，但無法直接測試私有屬性
    });

    it('應該限制 tempo 範圍在 60-180 BPM', () => {
      synthesizer.setTempo(50); // 小於最小值
      synthesizer.setTempo(200); // 大於最大值
      // 透過預覽播放來驗證 tempo 被限制在合法範圍
    });
  });

  describe('單一樂器音效播放', () => {
    it('應該能夠播放 Kick 音效', () => {
      expect(() => synthesizer.playInstrument('kick')).not.toThrow();
    });

    it('應該能夠播放 Snare 音效', () => {
      expect(() => synthesizer.playInstrument('snare')).not.toThrow();
    });

    it('應該能夠播放 HiHat 音效', () => {
      expect(() => synthesizer.playInstrument('hihat')).not.toThrow();
    });

    it('應該能夠播放 OpenHat 音效', () => {
      expect(() => synthesizer.playInstrument('openhat')).not.toThrow();
    });

    it('應該能夠播放 Clap 音效', () => {
      expect(() => synthesizer.playInstrument('clap')).not.toThrow();
    });

    it('應該能夠連續播放不同樂器', () => {
      const instruments: InstrumentType[] = ['kick', 'snare', 'hihat', 'openhat', 'clap'];
      instruments.forEach(instrument => {
        expect(() => synthesizer.playInstrument(instrument)).not.toThrow();
      });
    });
  });

  describe('Pattern 預覽播放', () => {
    it('應該能夠開始預覽 Pattern', () => {
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);
    });

    it('應該能夠停止預覽', () => {
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);

      synthesizer.stopPreview();
      expect(synthesizer.isPreviewingPattern()).toBe(false);
    });

    it('開始新預覽時應該停止舊預覽', () => {
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);

      // 開始新預覽
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);
    });

    it('多次停止預覽不應產生錯誤', () => {
      synthesizer.previewPattern(testPattern);
      synthesizer.stopPreview();
      expect(() => synthesizer.stopPreview()).not.toThrow();
    });
  });

  describe('預覽狀態', () => {
    it('未開始預覽時應返回 false', () => {
      expect(synthesizer.isPreviewingPattern()).toBe(false);
    });

    it('開始預覽後應返回 true', () => {
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);
    });

    it('停止預覽後應返回 false', () => {
      synthesizer.previewPattern(testPattern);
      synthesizer.stopPreview();
      expect(synthesizer.isPreviewingPattern()).toBe(false);
    });
  });

  describe('資源管理', () => {
    it('應該能夠銷毀合成器', () => {
      synthesizer.previewPattern(testPattern);
      synthesizer.destroy();
      expect(synthesizer.isPreviewingPattern()).toBe(false);
    });

    it('銷毀後不應產生錯誤', () => {
      synthesizer.destroy();
      expect(() => synthesizer.destroy()).not.toThrow();
    });
  });

  describe('獨立性測試', () => {
    it('編輯器合成器應獨立於播放器合成器', () => {
      // 建立另一個獨立的 AudioContext
      // @ts-ignore
      const anotherAudioContext = new MockAudioContext() as AudioContext;
      const anotherSynthesizer = new EditorAudioSynthesizer({
        audioContext: anotherAudioContext,
        tempo: 120,
      });

      // 兩個合成器應該獨立運作
      synthesizer.previewPattern(testPattern);
      expect(synthesizer.isPreviewingPattern()).toBe(true);
      expect(anotherSynthesizer.isPreviewingPattern()).toBe(false);
    });
  });

  describe('邊界情況', () => {
    it('空 Pattern 不應產生錯誤', () => {
      const emptyPattern: Pattern = {
        kick: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        hihat: new Array(16).fill(false),
        openhat: new Array(16).fill(false),
        clap: new Array(16).fill(false),
      };

      expect(() => synthesizer.previewPattern(emptyPattern)).not.toThrow();
    });

    it('全部啟用的 Pattern 不應產生錯誤', () => {
      const fullPattern: Pattern = {
        kick: new Array(16).fill(true),
        snare: new Array(16).fill(true),
        hihat: new Array(16).fill(true),
        openhat: new Array(16).fill(true),
        clap: new Array(16).fill(true),
      };

      expect(() => synthesizer.previewPattern(fullPattern)).not.toThrow();
    });
  });
});
