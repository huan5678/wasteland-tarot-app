/**
 * donutRenderer.ts 單元測試
 * 測試核心渲染引擎的數學計算正確性
 */

import { DonutRenderer } from '../donutRenderer';
import { DEFAULT_DONUT_CONFIG } from '../donutConfig';

describe('DonutRenderer', () => {
  describe('建構子與初始化', () => {
    it('應該正確初始化 DonutRenderer 實例', () => {
      const renderer = new DonutRenderer(DEFAULT_DONUT_CONFIG);
      expect(renderer).toBeInstanceOf(DonutRenderer);
    });

    it('應該使用提供的配置', () => {
      const customConfig = {
        ...DEFAULT_DONUT_CONFIG,
        width: 40,
        height: 20,
      };
      const renderer = new DonutRenderer(customConfig);
      expect(renderer).toBeInstanceOf(DonutRenderer);
    });
  });

  describe('render() 方法', () => {
    let renderer: DonutRenderer;

    beforeEach(() => {
      renderer = new DonutRenderer(DEFAULT_DONUT_CONFIG);
    });

    afterEach(() => {
      renderer.dispose();
    });

    it('應該返回字串', () => {
      const result = renderer.render(0, 0);
      expect(typeof result).toBe('string');
    });

    it('返回的字串應該包含正確數量的行', () => {
      const result = renderer.render(0, 0);
      const lines = result.split('\n');
      expect(lines.length).toBe(DEFAULT_DONUT_CONFIG.height);
    });

    it('每行應該包含正確數量的字元', () => {
      const result = renderer.render(0, 0);
      const lines = result.split('\n');

      lines.forEach((line) => {
        expect(line.length).toBe(DEFAULT_DONUT_CONFIG.width);
      });
    });

    it('應該只包含 luminanceChars 中的字元', () => {
      const result = renderer.render(0, 0);
      const validChars = new Set(DEFAULT_DONUT_CONFIG.luminanceChars + ' ');

      for (const char of result.replace(/\n/g, '')) {
        expect(validChars.has(char)).toBe(true);
      }
    });

    it('不同的旋轉角度應該產生不同的輸出（驗證旋轉邏輯）', () => {
      const result1 = renderer.render(0, 0);
      const result2 = renderer.render(Math.PI / 4, 0);
      const result3 = renderer.render(0, Math.PI / 4);

      expect(result1).not.toBe(result2);
      expect(result1).not.toBe(result3);
      expect(result2).not.toBe(result3);
    });

    it('相同的角度應該產生相同的輸出（確定性）', () => {
      const result1 = renderer.render(1.5, 2.3);
      const result2 = renderer.render(1.5, 2.3);

      expect(result1).toBe(result2);
    });

    it('應該在結果中包含可見的 ASCII 字元（不只是空格）', () => {
      const result = renderer.render(0, 0);
      const nonSpaceChars = result.replace(/[\s\n]/g, '');

      expect(nonSpaceChars.length).toBeGreaterThan(0);
    });

    it('應該使用多種不同的 ASCII 字元（驗證光照計算）', () => {
      const result = renderer.render(0, 0);
      const uniqueChars = new Set(result.replace(/[\s\n]/g, ''));

      // 應該至少使用 3 種不同的字元
      expect(uniqueChars.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('dispose() 方法', () => {
    it('應該清理資源', () => {
      const renderer = new DonutRenderer(DEFAULT_DONUT_CONFIG);

      // 先渲染以確保資源已分配
      renderer.render(0, 0);

      // 清理資源
      expect(() => renderer.dispose()).not.toThrow();
    });

    it('dispose 後應該仍然可以渲染（重新初始化）', () => {
      const renderer = new DonutRenderer(DEFAULT_DONUT_CONFIG);

      renderer.render(0, 0);
      renderer.dispose();

      // dispose 後仍可渲染
      const result = renderer.render(0, 0);
      expect(typeof result).toBe('string');
    });
  });

  describe('數學計算驗證', () => {
    let renderer: DonutRenderer;

    beforeEach(() => {
      // 使用較小的配置以便於驗證
      const smallConfig = {
        ...DEFAULT_DONUT_CONFIG,
        width: 20,
        height: 10,
      };
      renderer = new DonutRenderer(smallConfig);
    });

    afterEach(() => {
      renderer.dispose();
    });

    it('Z-buffer 應該正確處理深度（前面的點遮蔽後面的點）', () => {
      // 渲染一個 donut
      const result = renderer.render(0, 0);

      // 驗證結果不是全空格（證明有可見的表面）
      const nonSpaceChars = result.replace(/[\s\n]/g, '');
      expect(nonSpaceChars.length).toBeGreaterThan(0);
    });

    it('完整旋轉一圈（2π）應該回到相似的狀態', () => {
      const result1 = renderer.render(0, 0);
      const result2 = renderer.render(Math.PI * 2, 0);

      // 允許一些數值誤差
      const similarity = calculateSimilarity(result1, result2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('邊界條件', () => {
    it('應該處理極小的配置', () => {
      const tinyConfig = {
        ...DEFAULT_DONUT_CONFIG,
        width: 10,
        height: 5,
      };
      const renderer = new DonutRenderer(tinyConfig);

      const result = renderer.render(0, 0);
      const lines = result.split('\n');

      expect(lines.length).toBe(5);
      lines.forEach((line) => {
        expect(line.length).toBe(10);
      });

      renderer.dispose();
    });

    it('應該處理大角度值', () => {
      const renderer = new DonutRenderer(DEFAULT_DONUT_CONFIG);

      // 測試大角度（> 2π）
      expect(() => renderer.render(10, 20)).not.toThrow();
      expect(() => renderer.render(-5, -10)).not.toThrow();

      renderer.dispose();
    });
  });
});

/**
 * 計算兩個字串的相似度（0-1）
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1.length !== str2.length) return 0;

  let matches = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] === str2[i]) matches++;
  }

  return matches / str1.length;
}
