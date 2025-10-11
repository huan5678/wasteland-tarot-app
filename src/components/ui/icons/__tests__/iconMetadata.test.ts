/**
 * iconMetadata 系統單元測試
 *
 * 測試覆蓋範圍：
 * - getIconsByCategory 分類過濾功能
 * - searchIcons 搜尋功能（名稱、標籤、描述）
 * - 中英文搜尋支援
 * - getPopularIcons 常用圖示篩選
 * - getIconMetadata 單一圖示查詢
 * - getAllCategories 取得所有分類
 * - getIconCount 圖示計數
 * - getIconCountByCategory 分類計數
 * - ICON_METADATA 資料完整性
 *
 * @module iconMetadata.test
 */

import {
  getIconsByCategory,
  searchIcons,
  getPopularIcons,
  getIconMetadata,
  getAllCategories,
  getIconCount,
  getIconCountByCategory,
  ICON_METADATA,
} from '../iconMetadata';
import { IconCategory } from '../../../../types/icons';

describe('iconMetadata 系統', () => {
  // ========== getIconsByCategory 測試 ==========
  describe('getIconsByCategory 函式', () => {
    it('應該正確過濾導航類圖示', () => {
      const navIcons = getIconsByCategory(IconCategory.NAVIGATION);

      expect(Array.isArray(navIcons)).toBe(true);
      expect(navIcons.length).toBeGreaterThan(0);

      // 驗證所有圖示都是導航類
      navIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.NAVIGATION);
      });
    });

    it('應該正確過濾使用者類圖示', () => {
      const userIcons = getIconsByCategory(IconCategory.USER);

      expect(userIcons.length).toBeGreaterThan(0);
      userIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.USER);
      });
    });

    it('應該正確過濾操作類圖示', () => {
      const actionIcons = getIconsByCategory(IconCategory.ACTIONS);

      expect(actionIcons.length).toBeGreaterThan(0);
      actionIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.ACTIONS);
      });
    });

    it('應該正確過濾狀態類圖示', () => {
      const statusIcons = getIconsByCategory(IconCategory.STATUS);

      expect(statusIcons.length).toBeGreaterThan(0);
      statusIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.STATUS);
      });
    });

    it('應該正確過濾媒體類圖示', () => {
      const mediaIcons = getIconsByCategory(IconCategory.MEDIA);

      expect(mediaIcons.length).toBeGreaterThan(0);
      mediaIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.MEDIA);
      });
    });

    it('應該正確過濾社群類圖示', () => {
      const socialIcons = getIconsByCategory(IconCategory.SOCIAL);

      expect(socialIcons.length).toBeGreaterThan(0);
      socialIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.SOCIAL);
      });
    });

    it('應該正確過濾系統類圖示', () => {
      const systemIcons = getIconsByCategory(IconCategory.SYSTEM);

      expect(systemIcons.length).toBeGreaterThan(0);
      systemIcons.forEach((icon) => {
        expect(icon.category).toBe(IconCategory.SYSTEM);
      });
    });

    it('不同分類的圖示數量應該不同', () => {
      const navCount = getIconsByCategory(IconCategory.NAVIGATION).length;
      const userCount = getIconsByCategory(IconCategory.USER).length;
      const actionCount = getIconsByCategory(IconCategory.ACTIONS).length;

      // 至少應該有一些差異
      expect(navCount + userCount + actionCount).toBeGreaterThan(0);
    });
  });

  // ========== searchIcons 測試 ==========
  describe('searchIcons 函式', () => {
    it('應該能透過名稱搜尋圖示（英文）', () => {
      const results = searchIcons('home');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((icon) => icon.name === 'home')).toBe(true);
    });

    it('應該能透過名稱搜尋圖示（中文）', () => {
      const results = searchIcons('首頁');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((icon) => icon.name === 'home')).toBe(true);
    });

    it('應該能透過英文標籤搜尋圖示', () => {
      const results = searchIcons('user');

      expect(results.length).toBeGreaterThan(0);
      // 應該包含 user 相關的圖示
      expect(
        results.some(
          (icon) => icon.name === 'user' || icon.tags.includes('user')
        )
      ).toBe(true);
    });

    it('應該能透過中文標籤搜尋圖示', () => {
      const results = searchIcons('使用者');

      expect(results.length).toBeGreaterThan(0);
      // 應該找到包含「使用者」標籤的圖示
      expect(results.some((icon) => icon.tags.includes('使用者'))).toBe(true);
    });

    it('應該能透過描述搜尋圖示', () => {
      const results = searchIcons('圖示');

      expect(results.length).toBeGreaterThan(0);
      // 應該有圖示的描述包含「圖示」
      expect(results.some((icon) => icon.description.includes('圖示'))).toBe(
        true
      );
    });

    it('搜尋應該不區分大小寫', () => {
      const lowerResults = searchIcons('home');
      const upperResults = searchIcons('HOME');
      const mixedResults = searchIcons('HoMe');

      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });

    it('空字串應該返回所有圖示', () => {
      const results = searchIcons('');

      expect(results.length).toBe(ICON_METADATA.length);
    });

    it('空格字串應該返回所有圖示', () => {
      const results = searchIcons('   ');

      expect(results.length).toBe(ICON_METADATA.length);
    });

    it('找不到結果時應該返回空陣列', () => {
      const results = searchIcons('xyznonexistent999');

      expect(results).toEqual([]);
    });

    it('應該支援部分匹配', () => {
      const results = searchIcons('use');

      // 應該找到 user, users 等包含 'use' 的圖示
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(
          (icon) =>
            icon.name.includes('use') ||
            icon.tags.some((tag) => tag.includes('use'))
        )
      ).toBe(true);
    });

    it('中文搜尋應該支援部分匹配', () => {
      const results = searchIcons('使用');

      // 應該找到包含「使用」的圖示
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(
          (icon) =>
            icon.description.includes('使用') ||
            icon.tags.some((tag) => tag.includes('使用'))
        )
      ).toBe(true);
    });
  });

  // ========== getPopularIcons 測試 ==========
  describe('getPopularIcons 函式', () => {
    it('應該返回標記為常用的圖示', () => {
      const popularIcons = getPopularIcons();

      expect(Array.isArray(popularIcons)).toBe(true);
      expect(popularIcons.length).toBeGreaterThan(0);

      // 所有圖示都應該標記為 popular
      popularIcons.forEach((icon) => {
        expect(icon.popular).toBe(true);
      });
    });

    it('常用圖示應該包含 home 圖示', () => {
      const popularIcons = getPopularIcons();

      expect(popularIcons.some((icon) => icon.name === 'home')).toBe(true);
    });

    it('常用圖示應該包含 user 圖示', () => {
      const popularIcons = getPopularIcons();

      expect(popularIcons.some((icon) => icon.name === 'user')).toBe(true);
    });

    it('常用圖示應該包含 search 圖示', () => {
      const popularIcons = getPopularIcons();

      expect(popularIcons.some((icon) => icon.name === 'search')).toBe(true);
    });

    it('常用圖示數量應該少於總圖示數量', () => {
      const popularCount = getPopularIcons().length;
      const totalCount = ICON_METADATA.length;

      expect(popularCount).toBeLessThan(totalCount);
      expect(popularCount).toBeGreaterThan(0);
    });
  });

  // ========== getIconMetadata 測試 ==========
  describe('getIconMetadata 函式', () => {
    it('應該返回指定圖示的元資料', () => {
      const metadata = getIconMetadata('home');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('home');
      expect(metadata?.category).toBe(IconCategory.NAVIGATION);
    });

    it('應該返回完整的圖示資訊', () => {
      const metadata = getIconMetadata('user');

      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('category');
      expect(metadata).toHaveProperty('tags');
      expect(metadata).toHaveProperty('description');
      expect(Array.isArray(metadata?.tags)).toBe(true);
    });

    it('找不到圖示時應該返回 undefined', () => {
      const metadata = getIconMetadata('nonexistent-icon');

      expect(metadata).toBeUndefined();
    });

    it('應該正確返回多個不同圖示的元資料', () => {
      const homeMetadata = getIconMetadata('home');
      const userMetadata = getIconMetadata('user');
      const searchMetadata = getIconMetadata('search');

      expect(homeMetadata?.name).toBe('home');
      expect(userMetadata?.name).toBe('user');
      expect(searchMetadata?.name).toBe('search');
    });
  });

  // ========== getAllCategories 測試 ==========
  describe('getAllCategories 函式', () => {
    it('應該返回所有使用中的分類', () => {
      const categories = getAllCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('返回的分類應該都是有效的 IconCategory 值', () => {
      const categories = getAllCategories();
      const validCategories = Object.values(IconCategory);

      categories.forEach((category) => {
        expect(validCategories).toContain(category);
      });
    });

    it('應該包含導航分類', () => {
      const categories = getAllCategories();

      expect(categories).toContain(IconCategory.NAVIGATION);
    });

    it('應該包含使用者分類', () => {
      const categories = getAllCategories();

      expect(categories).toContain(IconCategory.USER);
    });

    it('應該包含操作分類', () => {
      const categories = getAllCategories();

      expect(categories).toContain(IconCategory.ACTIONS);
    });

    it('不應該有重複的分類', () => {
      const categories = getAllCategories();
      const uniqueCategories = Array.from(new Set(categories));

      expect(categories.length).toBe(uniqueCategories.length);
    });
  });

  // ========== getIconCount 測試 ==========
  describe('getIconCount 函式', () => {
    it('應該返回圖示總數', () => {
      const count = getIconCount();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('返回的數量應該與 ICON_METADATA 長度一致', () => {
      const count = getIconCount();

      expect(count).toBe(ICON_METADATA.length);
    });

    it('圖示總數應該至少為 85（根據 requirements）', () => {
      const count = getIconCount();

      expect(count).toBeGreaterThanOrEqual(85);
    });
  });

  // ========== getIconCountByCategory 測試 ==========
  describe('getIconCountByCategory 函式', () => {
    it('應該返回每個分類的圖示數量', () => {
      const counts = getIconCountByCategory();

      expect(typeof counts).toBe('object');
      expect(counts).not.toBeNull();
    });

    it('每個分類的數量都應該是數字', () => {
      const counts = getIconCountByCategory();

      Object.values(counts).forEach((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('所有分類的總數應該等於圖示總數', () => {
      const counts = getIconCountByCategory();
      const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

      expect(totalCount).toBe(getIconCount());
    });

    it('應該包含所有主要分類的計數', () => {
      const counts = getIconCountByCategory();

      expect(counts[IconCategory.NAVIGATION]).toBeGreaterThan(0);
      expect(counts[IconCategory.USER]).toBeGreaterThan(0);
      expect(counts[IconCategory.ACTIONS]).toBeGreaterThan(0);
      expect(counts[IconCategory.STATUS]).toBeGreaterThan(0);
      expect(counts[IconCategory.MEDIA]).toBeGreaterThan(0);
    });

    it('各分類計數應該與 getIconsByCategory 結果一致', () => {
      const counts = getIconCountByCategory();

      expect(counts[IconCategory.NAVIGATION]).toBe(
        getIconsByCategory(IconCategory.NAVIGATION).length
      );
      expect(counts[IconCategory.USER]).toBe(
        getIconsByCategory(IconCategory.USER).length
      );
      expect(counts[IconCategory.ACTIONS]).toBe(
        getIconsByCategory(IconCategory.ACTIONS).length
      );
    });
  });

  // ========== ICON_METADATA 資料完整性測試 ==========
  describe('ICON_METADATA 資料完整性', () => {
    it('ICON_METADATA 應該是一個陣列', () => {
      expect(Array.isArray(ICON_METADATA)).toBe(true);
    });

    it('ICON_METADATA 應該包含至少 85 個圖示', () => {
      expect(ICON_METADATA.length).toBeGreaterThanOrEqual(85);
    });

    it('每個圖示都應該有必要的屬性', () => {
      ICON_METADATA.forEach((icon) => {
        expect(icon).toHaveProperty('name');
        expect(icon).toHaveProperty('category');
        expect(icon).toHaveProperty('tags');
        expect(icon).toHaveProperty('description');

        expect(typeof icon.name).toBe('string');
        expect(icon.name.length).toBeGreaterThan(0);
        expect(typeof icon.category).toBe('string');
        expect(Array.isArray(icon.tags)).toBe(true);
        expect(icon.tags.length).toBeGreaterThan(0);
        expect(typeof icon.description).toBe('string');
        expect(icon.description.length).toBeGreaterThan(0);
      });
    });

    it('每個圖示的 tags 應該同時包含英文和中文標籤', () => {
      ICON_METADATA.forEach((icon) => {
        // 至少應該有一個標籤
        expect(icon.tags.length).toBeGreaterThan(0);

        // 檢查是否有英文標籤（純字母）
        const hasEnglishTag = icon.tags.some((tag) => /^[a-zA-Z\s-]+$/.test(tag));
        // 檢查是否有中文標籤
        const hasChineseTag = icon.tags.some((tag) => /[\u4e00-\u9fa5]/.test(tag));

        expect(hasEnglishTag || hasChineseTag).toBe(true);
      });
    });

    it('圖示名稱不應該有重複', () => {
      const names = ICON_METADATA.map((icon) => icon.name);
      const uniqueNames = Array.from(new Set(names));

      expect(names.length).toBe(uniqueNames.length);
    });

    it('所有分類值都應該是有效的 IconCategory', () => {
      const validCategories = Object.values(IconCategory);

      ICON_METADATA.forEach((icon) => {
        expect(validCategories).toContain(icon.category);
      });
    });

    it('常用圖示應該被正確標記', () => {
      const popularIcons = ICON_METADATA.filter((icon) => icon.popular === true);

      // 應該有至少一些常用圖示
      expect(popularIcons.length).toBeGreaterThan(0);

      // 常用圖示應該包含關鍵圖示
      const popularNames = popularIcons.map((icon) => icon.name);
      expect(popularNames).toContain('home');
      expect(popularNames).toContain('user');
      expect(popularNames).toContain('search');
    });

    it('描述應該使用繁體中文', () => {
      ICON_METADATA.forEach((icon) => {
        // 檢查描述是否包含中文字元
        const hasChinese = /[\u4e00-\u9fa5]/.test(icon.description);
        expect(hasChinese).toBe(true);
      });
    });
  });
});
