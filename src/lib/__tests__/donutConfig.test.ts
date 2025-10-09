/**
 * donutConfig.ts 單元測試
 * 測試配置管理模組的功能
 */

import {
  DonutRendererConfig,
  DEFAULT_DONUT_CONFIG,
  LOW_PERFORMANCE_CONFIG,
  mergeDonutConfig,
} from '../donutConfig';

describe('donutConfig', () => {
  describe('DEFAULT_DONUT_CONFIG', () => {
    it('所有數值參數應該大於 0', () => {
      expect(DEFAULT_DONUT_CONFIG.width).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.height).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.R1).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.R2).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.K1).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.K2).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.thetaSpacing).toBeGreaterThan(0);
      expect(DEFAULT_DONUT_CONFIG.phiSpacing).toBeGreaterThan(0);
    });

    it('luminanceChars 應該不為空', () => {
      expect(DEFAULT_DONUT_CONFIG.luminanceChars.length).toBeGreaterThan(0);
    });

    it('應該包含正確的預設值', () => {
      expect(DEFAULT_DONUT_CONFIG).toEqual({
        width: 80,
        height: 24,
        R1: 1,
        R2: 2,
        K1: 30,
        K2: 5,
        thetaSpacing: 0.07,
        phiSpacing: 0.02,
        luminanceChars: '.,-~:;=!*#$@',
      });
    });
  });

  describe('LOW_PERFORMANCE_CONFIG', () => {
    it('應該比預設配置有更低的解析度', () => {
      expect(LOW_PERFORMANCE_CONFIG.width).toBeLessThan(DEFAULT_DONUT_CONFIG.width);
      expect(LOW_PERFORMANCE_CONFIG.height).toBeLessThan(DEFAULT_DONUT_CONFIG.height);
    });

    it('應該有更大的角度步進（減少計算點數）', () => {
      expect(LOW_PERFORMANCE_CONFIG.thetaSpacing).toBeGreaterThan(DEFAULT_DONUT_CONFIG.thetaSpacing);
      expect(LOW_PERFORMANCE_CONFIG.phiSpacing).toBeGreaterThan(DEFAULT_DONUT_CONFIG.phiSpacing);
    });

    it('應該包含正確的降級值', () => {
      expect(LOW_PERFORMANCE_CONFIG).toEqual({
        width: 60,
        height: 18,
        thetaSpacing: 0.14,
        phiSpacing: 0.04,
      });
    });
  });

  describe('mergeDonutConfig', () => {
    it('空物件應該返回預設配置', () => {
      const result = mergeDonutConfig({});
      expect(result).toEqual(DEFAULT_DONUT_CONFIG);
    });

    it('應該正確合併部分自訂配置', () => {
      const custom = { width: 100, height: 30 };
      const result = mergeDonutConfig(custom);

      expect(result.width).toBe(100);
      expect(result.height).toBe(30);
      expect(result.R1).toBe(DEFAULT_DONUT_CONFIG.R1);
      expect(result.R2).toBe(DEFAULT_DONUT_CONFIG.R2);
    });

    it('應該正確合併完整自訂配置', () => {
      const custom: DonutRendererConfig = {
        width: 120,
        height: 40,
        R1: 1.5,
        R2: 2.5,
        K1: 40,
        K2: 6,
        thetaSpacing: 0.05,
        phiSpacing: 0.01,
        luminanceChars: '@#*!',
      };
      const result = mergeDonutConfig(custom);

      expect(result).toEqual(custom);
    });

    it('應該拒絕無效的 width（<= 0）', () => {
      const invalid = { width: 0 };
      const result = mergeDonutConfig(invalid);

      // 應該使用預設值
      expect(result.width).toBe(DEFAULT_DONUT_CONFIG.width);
    });

    it('應該拒絕無效的 height（<= 0）', () => {
      const invalid = { height: -10 };
      const result = mergeDonutConfig(invalid);

      expect(result.height).toBe(DEFAULT_DONUT_CONFIG.height);
    });

    it('應該拒絕無效的 R1（<= 0）', () => {
      const invalid = { R1: 0 };
      const result = mergeDonutConfig(invalid);

      expect(result.R1).toBe(DEFAULT_DONUT_CONFIG.R1);
    });

    it('應該拒絕無效的 R2（<= 0）', () => {
      const invalid = { R2: -1 };
      const result = mergeDonutConfig(invalid);

      expect(result.R2).toBe(DEFAULT_DONUT_CONFIG.R2);
    });

    it('應該拒絕空的 luminanceChars', () => {
      const invalid = { luminanceChars: '' };
      const result = mergeDonutConfig(invalid);

      expect(result.luminanceChars).toBe(DEFAULT_DONUT_CONFIG.luminanceChars);
    });

    it('應該記錄警告當配置無效時', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mergeDonutConfig({ width: -5, height: 0 });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
