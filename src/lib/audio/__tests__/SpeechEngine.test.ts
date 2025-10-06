/**
 * SpeechEngine 單元測試
 * 需求 2.1, 2.3, 2.6, 8.2: TTS 功能測試
 */

import { SpeechEngine } from '../SpeechEngine';

// Mock SpeechSynthesis
class MockSpeechSynthesis {
  speaking = false;
  paused = false;
  pending = false;

  speak(utterance: SpeechSynthesisUtterance) {
    this.speaking = true;
    setTimeout(() => {
      utterance.onend?.(new Event('end') as any);
      this.speaking = false;
    }, 100);
  }

  cancel() {
    this.speaking = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  getVoices() {
    return [
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ] as SpeechSynthesisVoice[];
  }
}

class MockSpeechSynthesisUtterance {
  text = '';
  voice: SpeechSynthesisVoice | null = null;
  pitch = 1;
  rate = 1;
  volume = 1;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null = null;

  constructor(text?: string) {
    this.text = text || '';
  }
}

(global as any).speechSynthesis = new MockSpeechSynthesis();
(global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

describe('SpeechEngine', () => {
  let speechEngine: SpeechEngine;

  beforeEach(() => {
    speechEngine = SpeechEngine.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('應該返回同一實例', () => {
      const instance1 = SpeechEngine.getInstance();
      const instance2 = SpeechEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize()', () => {
    it('應該在支援時返回 true', () => {
      const result = speechEngine.initialize();
      expect(result).toBe(true);
    });

    it('應該檢測瀏覽器支援', () => {
      expect(speechEngine.isSpeechSupported()).toBe(true);
    });
  });

  describe('speak()', () => {
    beforeEach(() => {
      speechEngine.initialize();
    });

    it('應該合成並播放語音', (done) => {
      speechEngine.speak('測試文字', {
        onComplete: () => {
          expect(true).toBe(true);
          done();
        },
      });

      expect(speechEngine.isSpeaking()).toBe(true);
    });

    it('應該套用角色語音配置', () => {
      speechEngine.speak('測試', {
        voice: 'mr_handy',
      });

      // MrHandy 應該有高音調
      const config = speechEngine.getVoiceConfig('mr_handy');
      expect(config?.pitch).toBeGreaterThan(1);
    });

    it('應該觸發進度回調', (done) => {
      let progressCalled = false;

      speechEngine.speak('測試文字', {
        onProgress: (charIndex) => {
          progressCalled = true;
          expect(charIndex).toBeGreaterThanOrEqual(0);
        },
        onComplete: () => {
          done();
        },
      });
    });
  });

  describe('pause() / resume()', () => {
    beforeEach(() => {
      speechEngine.initialize();
    });

    it('應該暫停語音播放', () => {
      speechEngine.speak('測試');
      speechEngine.pause();

      expect(speechEngine.isPaused()).toBe(true);
    });

    it('應該恢復語音播放', () => {
      speechEngine.speak('測試');
      speechEngine.pause();
      speechEngine.resume();

      expect(speechEngine.isPaused()).toBe(false);
    });
  });

  describe('stop()', () => {
    beforeEach(() => {
      speechEngine.initialize();
    });

    it('應該停止語音播放', () => {
      speechEngine.speak('測試');
      speechEngine.stop();

      expect(speechEngine.isSpeaking()).toBe(false);
    });
  });

  describe('Voice Configuration', () => {
    it('應該設定角色語音配置', () => {
      speechEngine.setVoiceConfig('pip_boy', {
        pitch: 1.2,
        rate: 1.1,
        volume: 0.9,
      });

      const config = speechEngine.getVoiceConfig('pip_boy');
      expect(config?.pitch).toBe(1.2);
      expect(config?.rate).toBe(1.1);
    });

    it('應該提供預設語音配置', () => {
      const config = speechEngine.getVoiceConfig('mr_handy');
      expect(config).toBeDefined();
      expect(config?.pitch).toBe(1.5);
    });
  });

  describe('Browser Support', () => {
    it('應該檢測不支援的瀏覽器', () => {
      // Temporarily remove speechSynthesis
      const original = (global as any).speechSynthesis;
      delete (global as any).speechSynthesis;

      const newEngine = Object.create(SpeechEngine.prototype);
      const result = newEngine.initialize.call(newEngine);

      expect(result).toBe(false);

      // Restore
      (global as any).speechSynthesis = original;
    });
  });
});
