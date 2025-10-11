/**
 * iconMapping 系統單元測試
 *
 * 測試覆蓋範圍：
 * - getIconPath 函式返回正確路徑
 * - lucide-react 名稱映射功能
 * - getFallbackIcon 函式
 * - iconExists 函式
 * - batchIconExists 函式
 * - getSupportedLucideIcons 函式
 * - getMappedPixelIcons 函式
 * - ICON_MAPPING 資料完整性
 *
 * @module iconMapping.test
 */

import {
  getIconPath,
  getFallbackIcon,
  iconExists,
  batchIconExists,
  getSupportedLucideIcons,
  getMappedPixelIcons,
  ICON_MAPPING,
} from '../iconMapping';

// Mock global.fetch
beforeEach(() => {
  global.fetch = jest.fn((url: string) => {
    const urlString = url.toString();

    // 模擬存在的圖示（返回 200 OK）
    if (
      urlString.includes('home.svg') ||
      urlString.includes('user.svg') ||
      urlString.includes('close.svg') ||
      urlString.includes('info-box.svg')
    ) {
      return Promise.resolve({
        ok: true,
        status: 200,
      } as Response);
    }

    // 不存在的圖示返回 404
    return Promise.resolve({
      ok: false,
      status: 404,
    } as Response);
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('iconMapping 系統', () => {
  // ========== getIconPath 測試 ==========
  describe('getIconPath 函式', () => {
    it('應該返回正確的路徑格式', () => {
      const path = getIconPath('home');
      expect(path).toBe('/icons/pixelarticons/home.svg');
    });

    it('應該將 lucide-react 名稱映射到對應的 pixelarticons 名稱', () => {
      const path = getIconPath('x');
      expect(path).toBe('/icons/pixelarticons/close.svg');
    });

    it('應該將 user-circle 映射到 user', () => {
      const path = getIconPath('user-circle');
      expect(path).toBe('/icons/pixelarticons/user.svg');
    });

    it('未映射的名稱應該直接使用原始名稱', () => {
      const path = getIconPath('custom-icon');
      expect(path).toBe('/icons/pixelarticons/custom-icon.svg');
    });

    it('應該正確處理多個映射', () => {
      expect(getIconPath('x')).toBe('/icons/pixelarticons/close.svg');
      expect(getIconPath('menu')).toBe('/icons/pixelarticons/menu.svg');
      expect(getIconPath('user')).toBe('/icons/pixelarticons/user.svg');
      expect(getIconPath('settings')).toBe('/icons/pixelarticons/settings.svg');
    });
  });

  // ========== getFallbackIcon 測試 ==========
  describe('getFallbackIcon 函式', () => {
    it('應該返回有效的 fallback 圖示路徑', () => {
      const fallbackPath = getFallbackIcon();
      expect(fallbackPath).toBe('/icons/pixelarticons/info-box.svg');
    });

    it('fallback 路徑應該使用正確的格式', () => {
      const fallbackPath = getFallbackIcon();
      expect(fallbackPath).toMatch(/^\/icons\/pixelarticons\/.+\.svg$/);
    });
  });

  // ========== iconExists 測試 ==========
  describe('iconExists 函式', () => {
    it('存在的圖示應該返回 true', async () => {
      const exists = await iconExists('home');
      expect(exists).toBe(true);
    });

    it('不存在的圖示應該返回 false', async () => {
      const exists = await iconExists('nonexistent-icon');
      expect(exists).toBe(false);
    });

    it('應該使用 HEAD 請求檢查圖示', async () => {
      await iconExists('home');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('home.svg'),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('fetch 錯誤時應該返回 false', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const exists = await iconExists('home');
      expect(exists).toBe(false);
    });
  });

  // ========== batchIconExists 測試 ==========
  describe('batchIconExists 函式', () => {
    it('應該檢查多個圖示的存在性', async () => {
      const results = await batchIconExists(['home', 'user', 'nonexistent']);

      expect(results).toEqual({
        home: true,
        user: true,
        nonexistent: false,
      });
    });

    it('空陣列應該返回空物件', async () => {
      const results = await batchIconExists([]);
      expect(results).toEqual({});
    });

    it('應該平行處理所有請求', async () => {
      const iconNames = ['home', 'user', 'close'];
      await batchIconExists(iconNames);

      // 驗證每個圖示都被檢查
      expect(global.fetch).toHaveBeenCalledTimes(iconNames.length);
    });

    it('部分失敗時應該正確處理', async () => {
      const results = await batchIconExists([
        'home',
        'nonexistent1',
        'user',
        'nonexistent2',
      ]);

      expect(results).toEqual({
        home: true,
        nonexistent1: false,
        user: true,
        nonexistent2: false,
      });
    });
  });

  // ========== getSupportedLucideIcons 測試 ==========
  describe('getSupportedLucideIcons 函式', () => {
    it('應該返回所有支援的 lucide-react 圖示名稱', () => {
      const supported = getSupportedLucideIcons();

      expect(Array.isArray(supported)).toBe(true);
      expect(supported.length).toBeGreaterThan(0);
    });

    it('返回的陣列應該包含常見的 lucide 圖示名稱', () => {
      const supported = getSupportedLucideIcons();

      expect(supported).toContain('home');
      expect(supported).toContain('menu');
      expect(supported).toContain('x');
      expect(supported).toContain('user');
      expect(supported).toContain('settings');
    });

    it('返回的陣列應該與 ICON_MAPPING 的 keys 一致', () => {
      const supported = getSupportedLucideIcons();
      const mappingKeys = Object.keys(ICON_MAPPING);

      expect(supported).toEqual(mappingKeys);
    });
  });

  // ========== getMappedPixelIcons 測試 ==========
  describe('getMappedPixelIcons 函式', () => {
    it('應該返回所有對應的 pixelarticons 名稱', () => {
      const pixelIcons = getMappedPixelIcons();

      expect(Array.isArray(pixelIcons)).toBe(true);
      expect(pixelIcons.length).toBeGreaterThan(0);
    });

    it('返回的陣列應該包含常見的 pixel 圖示名稱', () => {
      const pixelIcons = getMappedPixelIcons();

      expect(pixelIcons).toContain('home');
      expect(pixelIcons).toContain('menu');
      expect(pixelIcons).toContain('close');
      expect(pixelIcons).toContain('user');
      expect(pixelIcons).toContain('settings');
    });

    it('返回的陣列應該去重（不包含重複值）', () => {
      const pixelIcons = getMappedPixelIcons();
      const uniqueIcons = Array.from(new Set(pixelIcons));

      expect(pixelIcons.length).toBe(uniqueIcons.length);
    });

    it('應該包含 ICON_MAPPING 中的所有值', () => {
      const pixelIcons = getMappedPixelIcons();
      const mappingValues = Array.from(new Set(Object.values(ICON_MAPPING)));

      expect(pixelIcons.sort()).toEqual(mappingValues.sort());
    });
  });

  // ========== ICON_MAPPING 資料完整性測試 ==========
  describe('ICON_MAPPING 資料完整性', () => {
    it('ICON_MAPPING 應該是一個物件', () => {
      expect(typeof ICON_MAPPING).toBe('object');
      expect(ICON_MAPPING).not.toBeNull();
    });

    it('ICON_MAPPING 應該包含至少 100 個映射', () => {
      const keys = Object.keys(ICON_MAPPING);
      expect(keys.length).toBeGreaterThanOrEqual(100);
    });

    it('所有映射的 key 和 value 都應該是字串', () => {
      Object.entries(ICON_MAPPING).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('應該包含關鍵的導航圖示映射', () => {
      expect(ICON_MAPPING['home']).toBe('home');
      expect(ICON_MAPPING['menu']).toBe('menu');
      expect(ICON_MAPPING['x']).toBe('close');
      expect(ICON_MAPPING['close']).toBe('close');
      expect(ICON_MAPPING['chevron-left']).toBe('chevron-left');
      expect(ICON_MAPPING['chevron-right']).toBe('chevron-right');
    });

    it('應該包含關鍵的使用者圖示映射', () => {
      expect(ICON_MAPPING['user']).toBe('user');
      expect(ICON_MAPPING['user-circle']).toBe('user');
      expect(ICON_MAPPING['user-plus']).toBe('user-plus');
      expect(ICON_MAPPING['users']).toBe('users');
      expect(ICON_MAPPING['log-in']).toBe('login');
      expect(ICON_MAPPING['log-out']).toBe('logout');
    });

    it('應該包含關鍵的操作圖示映射', () => {
      expect(ICON_MAPPING['search']).toBe('search');
      expect(ICON_MAPPING['plus']).toBe('plus');
      expect(ICON_MAPPING['minus']).toBe('minus');
      expect(ICON_MAPPING['edit']).toBe('edit');
      expect(ICON_MAPPING['trash']).toBe('trash');
      expect(ICON_MAPPING['download']).toBe('download');
      expect(ICON_MAPPING['upload']).toBe('upload');
    });

    it('應該包含關鍵的狀態圖示映射', () => {
      expect(ICON_MAPPING['check']).toBe('check');
      expect(ICON_MAPPING['check-circle']).toBe('checkbox-on');
      expect(ICON_MAPPING['alert-circle']).toBe('info-box');
      expect(ICON_MAPPING['bell']).toBe('notification');
    });

    it('應該包含關鍵的媒體圖示映射', () => {
      expect(ICON_MAPPING['play']).toBe('play');
      expect(ICON_MAPPING['pause']).toBe('pause');
      expect(ICON_MAPPING['volume']).toBe('volume');
      expect(ICON_MAPPING['music']).toBe('music');
      expect(ICON_MAPPING['image']).toBe('image');
    });

    it('應該包含關鍵的社群圖示映射', () => {
      expect(ICON_MAPPING['heart']).toBe('heart');
      expect(ICON_MAPPING['star']).toBe('star');
      expect(ICON_MAPPING['mail']).toBe('mail');
      expect(ICON_MAPPING['message-circle']).toBe('message');
    });

    it('應該包含關鍵的系統圖示映射', () => {
      expect(ICON_MAPPING['settings']).toBe('settings');
      expect(ICON_MAPPING['power']).toBe('power');
      expect(ICON_MAPPING['lock']).toBe('lock');
      expect(ICON_MAPPING['unlock']).toBe('lock-open');
      expect(ICON_MAPPING['eye']).toBe('eye');
      expect(ICON_MAPPING['eye-off']).toBe('eye-closed');
    });
  });
});
