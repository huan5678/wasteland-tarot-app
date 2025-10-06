/**
 * Web Audio 系統整合測試
 * 需求 3.1-3.9, 4.5: 完整音效播放流程整合測試
 */

import { AudioEngine } from '../AudioEngine';
import * as SoundGenerator from '../SoundGenerator';
import { SOUND_CONFIGS } from '../constants';

describe('Web Audio System Integration', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();

    // 清理之前的測試狀態
    if ((audioEngine as any).audioContext) {
      (audioEngine as any).audioContext = null;
      (audioEngine as any).isUnlocked = false;
    }
  });

  describe('音效生成器整合', () => {
    it('所有配置的音效生成器函數應該存在', () => {
      const generatorMapping: Record<string, Function> = {
        'button-click': SoundGenerator.generateButtonClick,
        'card-flip': SoundGenerator.generateCardFlip,
        'shuffle': SoundGenerator.generateShuffle,
        'reveal': SoundGenerator.generateReveal,
        'pip-boy-beep': SoundGenerator.generatePipBoyBeep,
        'terminal-type': SoundGenerator.generateTerminalType,
        'vault-door': SoundGenerator.generateVaultDoor,
      };

      Object.values(SOUND_CONFIGS).forEach((config) => {
        expect(generatorMapping[config.generator]).toBeDefined();
        expect(typeof generatorMapping[config.generator]).toBe('function');
      });
    });

    it('配置參數應該與生成器簽章相符', () => {
      Object.values(SOUND_CONFIGS).forEach((config) => {
        // 驗證參數類型
        if (config.params.frequency !== undefined) {
          expect(typeof config.params.frequency).toBe('number');
        }

        if (config.params.duration !== undefined) {
          expect(typeof config.params.duration).toBe('number');
        }

        if (config.params.volume !== undefined) {
          expect(typeof config.params.volume).toBe('number');
        }

        if (config.params.waveType !== undefined) {
          const validWaveTypes = ['sine', 'square', 'sawtooth', 'triangle'];
          expect(validWaveTypes).toContain(config.params.waveType);
        }
      });
    });
  });

  describe('音效配置整合', () => {
    it('AudioEngine 應該能讀取所有音效配置', () => {
      const configIds = Object.keys(SOUND_CONFIGS);

      expect(configIds.length).toBeGreaterThan(0);

      configIds.forEach((id) => {
        const config = SOUND_CONFIGS[id];
        expect(config).toBeDefined();
        expect(config.id).toBe(id);
      });
    });

    it('音效配置應包含優先級資訊', () => {
      const priorities = new Set(Object.values(SOUND_CONFIGS).map((c) => c.priority));

      expect(priorities.has('critical')).toBe(true);
      expect(priorities.has('normal')).toBe(true);
    });
  });

  describe('記憶體管理整合', () => {
    it('getMemoryUsage 在未初始化時應返回 0', () => {
      expect(audioEngine.getMemoryUsage()).toBe(0);
    });

    it('clearCache 應該能夠安全執行', () => {
      expect(() => audioEngine.clearCache()).not.toThrow();
    });

    it('isInitialized 應該正確反映初始化狀態', () => {
      expect(audioEngine.isInitialized()).toBe(false);
    });
  });

  describe('音量控制整合', () => {
    it('setVolume 應該接受有效的音量值', () => {
      expect(() => audioEngine.setVolume('sfx', 0)).not.toThrow();
      expect(() => audioEngine.setVolume('sfx', 0.5)).not.toThrow();
      expect(() => audioEngine.setVolume('sfx', 1)).not.toThrow();
    });

    it('setVolume 應該處理無效的音量值', () => {
      // 應該自動限制在 0-1 範圍
      expect(() => audioEngine.setVolume('sfx', -0.5)).not.toThrow();
      expect(() => audioEngine.setVolume('sfx', 1.5)).not.toThrow();
    });

    it('setVolume 應該接受所有音訊類型', () => {
      expect(() => audioEngine.setVolume('sfx', 0.7)).not.toThrow();
      expect(() => audioEngine.setVolume('music', 0.5)).not.toThrow();
      expect(() => audioEngine.setVolume('voice', 0.8)).not.toThrow();
    });
  });

  describe('非瀏覽器環境處理', () => {
    it('在非瀏覽器環境應優雅降級', async () => {
      // 當前測試環境就是非瀏覽器環境
      await expect(audioEngine.initialize()).resolves.toBeUndefined();
      expect(audioEngine.isInitialized()).toBe(false);
    });

    it('未初始化時播放音效應靜默失敗', async () => {
      await expect(audioEngine.play('button-click')).resolves.toBeUndefined();
      await expect(audioEngine.play('card-flip')).resolves.toBeUndefined();
      await expect(audioEngine.play('pip-boy-beep')).resolves.toBeUndefined();
    });

    it('未初始化時預載音效應靜默失敗', async () => {
      const testSounds = [
        { id: 'button-click', url: '/test.mp3', type: 'sfx' as const, priority: 'critical' as const },
      ];

      await expect(audioEngine.preloadSounds(testSounds)).resolves.toBeUndefined();
    });
  });

  describe('完整流程整合', () => {
    it('初始化 → 設定音量 → 播放音效流程應該正常', async () => {
      await audioEngine.initialize();
      audioEngine.setVolume('sfx', 0.7);

      await expect(audioEngine.play('button-click', { volume: 0.5 })).resolves.toBeUndefined();
    });

    it('初始化 → 預載 → 播放流程應該正常', async () => {
      await audioEngine.initialize();

      const sounds = [
        { id: 'button-click', url: '/test1.mp3', type: 'sfx' as const, priority: 'critical' as const },
        { id: 'card-flip', url: '/test2.mp3', type: 'sfx' as const, priority: 'normal' as const },
      ];

      await audioEngine.preloadSounds(sounds);

      await expect(audioEngine.play('button-click')).resolves.toBeUndefined();
      await expect(audioEngine.play('card-flip')).resolves.toBeUndefined();
    });

    it('清除快取後應能重新初始化', async () => {
      await audioEngine.initialize();
      audioEngine.clearCache();

      // 應該能夠再次初始化
      await expect(audioEngine.initialize()).resolves.toBeUndefined();
    });
  });

  describe('效能驗證', () => {
    it('音效配置數量應該合理（< 20 個）', () => {
      const configCount = Object.keys(SOUND_CONFIGS).length;
      expect(configCount).toBeLessThan(20);
      expect(configCount).toBeGreaterThan(0);
    });

    it('每個音效配置的參數應該合理', () => {
      Object.values(SOUND_CONFIGS).forEach((config) => {
        // 持續時間應 < 5 秒
        if (config.params.duration) {
          expect(config.params.duration).toBeLessThan(5);
        }

        // 頻率應在人耳可聽範圍（20Hz - 20kHz）
        if (config.params.frequency) {
          expect(config.params.frequency).toBeGreaterThanOrEqual(20);
          expect(config.params.frequency).toBeLessThanOrEqual(20000);
        }

        // 音量應在 0-1 範圍
        if (config.params.volume) {
          expect(config.params.volume).toBeGreaterThanOrEqual(0);
          expect(config.params.volume).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
