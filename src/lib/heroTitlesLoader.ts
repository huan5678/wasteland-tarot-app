/**
 * Hero 標題資料載入器
 *
 * 負責載入、驗證與管理 Hero Section 文案資料
 */

import type { HeroTitle, HeroTitlesCollection } from '@/types/hero';
import { FALLBACK_TITLE } from '@/types/hero';

/**
 * 驗證文案資料結構
 *
 * @param data - 待驗證的資料
 * @returns 驗證通過的文案集合
 * @throws {Error} 驗證失敗時拋出錯誤
 */
export function validateHeroTitles(data: unknown): HeroTitlesCollection {
  // 基本結構檢查
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON structure: data must be an object');
  }

  const collection = data as HeroTitlesCollection;

  // 必要欄位檢查
  if (!Array.isArray(collection.titles) || collection.titles.length === 0) {
    throw new Error('titles array is required and must not be empty');
  }

  // 每個文案驗證
  collection.titles.forEach((title, index) => {
    const requiredFields: (keyof HeroTitle)[] = ['id', 'title', 'subtitle', 'description'];

    requiredFields.forEach((field) => {
      if (!title[field] || typeof title[field] !== 'string') {
        throw new Error(`Title at index ${index}: ${field} is required and must be a non-empty string`);
      }
    });

    if (typeof title.enabled !== 'boolean') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Title ${title.id}: enabled field missing, defaulting to true`);
      }
      title.enabled = true;
    }
  });

  return collection;
}

/**
 * 載入 Hero 標題資料
 *
 * @returns Promise 包含驗證通過的文案集合
 */
export async function loadHeroTitles(): Promise<HeroTitlesCollection> {
  try {
    // 動態載入 JSON 檔案
    const response = await fetch('/data/heroTitles.json');

    if (!response.ok) {
      throw new Error(`Failed to load heroTitles.json: ${response.statusText}`);
    }

    const data = await response.json();

    // 驗證資料結構
    const validatedData = validateHeroTitles(data);

    return validatedData;
  } catch (error) {
    // 錯誤處理與降級邏輯
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load or validate heroTitles.json:', error);
      console.warn('Using fallback title as default');
    }

    // 返回包含降級文案的集合
    return {
      version: '1.0.0',
      titles: [FALLBACK_TITLE],
      defaultConfig: {
        typingSpeed: 50,
        autoPlayInterval: 8000,
      },
    };
  }
}

/**
 * 過濾啟用的文案
 *
 * @param collection - 文案集合
 * @returns 僅包含啟用文案的陣列
 */
export function filterEnabledTitles(collection: HeroTitlesCollection): HeroTitle[] {
  return collection.titles.filter((title) => title.enabled);
}
