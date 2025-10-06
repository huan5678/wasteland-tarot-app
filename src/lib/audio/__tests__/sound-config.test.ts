/**
 * Sound Configuration 測試
 * 需求 3.9, 4.3: 音效配置管理測試
 */

import { SOUND_CONFIGS, type SoundGeneratorConfig } from '../constants';

describe('Sound Configuration', () => {
  describe('SOUND_CONFIGS', () => {
    it('應該包含所有必要的音效配置', () => {
      const requiredSounds = [
        'button-click',
        'card-flip',
        'card-shuffle',
        'card-reveal',
        'pip-boy-beep',
        'terminal-type',
        'vault-door',
      ];

      requiredSounds.forEach((soundId) => {
        expect(SOUND_CONFIGS[soundId]).toBeDefined();
      });
    });

    it('每個音效配置應包含必要欄位', () => {
      Object.values(SOUND_CONFIGS).forEach((config) => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('priority');
        expect(config).toHaveProperty('generator');
        expect(config).toHaveProperty('params');
      });
    });

    it('音效類型應為有效值', () => {
      const validTypes = ['sfx', 'music', 'voice'];

      Object.values(SOUND_CONFIGS).forEach((config) => {
        expect(validTypes).toContain(config.type);
      });
    });

    it('優先級應為有效值', () => {
      const validPriorities = ['critical', 'normal', 'low'];

      Object.values(SOUND_CONFIGS).forEach((config) => {
        expect(validPriorities).toContain(config.priority);
      });
    });

    it('生成器名稱應為有效值', () => {
      const validGenerators = [
        'button-click',
        'card-flip',
        'pip-boy-beep',
        'terminal-type',
        'vault-door',
        'shuffle',
        'reveal',
      ];

      Object.values(SOUND_CONFIGS).forEach((config) => {
        expect(validGenerators).toContain(config.generator);
      });
    });

    it('參數應包含有效的數值', () => {
      Object.values(SOUND_CONFIGS).forEach((config) => {
        if (config.params.frequency !== undefined) {
          expect(config.params.frequency).toBeGreaterThan(0);
        }

        if (config.params.duration !== undefined) {
          expect(config.params.duration).toBeGreaterThan(0);
        }

        if (config.params.volume !== undefined) {
          expect(config.params.volume).toBeGreaterThanOrEqual(0);
          expect(config.params.volume).toBeLessThanOrEqual(1);
        }
      });
    });

    it('Critical 優先級的音效應包含 button-click 和 pip-boy-beep', () => {
      expect(SOUND_CONFIGS['button-click'].priority).toBe('critical');
      expect(SOUND_CONFIGS['pip-boy-beep'].priority).toBe('critical');
    });

    it('button-click 應使用 sine wave', () => {
      expect(SOUND_CONFIGS['button-click'].params.waveType).toBe('sine');
    });

    it('pip-boy-beep 應使用 square wave', () => {
      expect(SOUND_CONFIGS['pip-boy-beep'].params.waveType).toBe('square');
    });

    it('vault-door 應有掃頻效果（startFrequency 和 endFrequency）', () => {
      const vaultDoorConfig = SOUND_CONFIGS['vault-door'];
      expect(vaultDoorConfig.params.startFrequency).toBeDefined();
      expect(vaultDoorConfig.params.endFrequency).toBeDefined();
      expect(vaultDoorConfig.params.startFrequency).toBeGreaterThan(
        vaultDoorConfig.params.endFrequency as number
      );
    });
  });

  describe('配置一致性', () => {
    it('所有配置的 id 應與鍵值相符', () => {
      Object.entries(SOUND_CONFIGS).forEach(([key, config]) => {
        expect(config.id).toBe(key);
      });
    });

    it('不應有重複的生成器與參數組合', () => {
      const seen = new Set<string>();

      Object.values(SOUND_CONFIGS).forEach((config) => {
        const signature = `${config.generator}-${JSON.stringify(config.params)}`;
        expect(seen.has(signature)).toBe(false);
        seen.add(signature);
      });
    });
  });
});
