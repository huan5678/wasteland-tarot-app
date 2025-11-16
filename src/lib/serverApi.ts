/**
 * Server-side API Client
 * 專門用於 Server Components (如 generateMetadata) 的 API 呼叫
 *
 * 特色：
 * - 統一的資料存取點（透過 Next.js API route）
 * - 統一的錯誤處理
 * - 集中管理 cache 策略
 * - TypeScript 類型安全
 *
 * 使用場景：
 * - generateMetadata() - 生成動態 SEO metadata
 * - Server Components - 需要在 server-side 獲取資料
 *
 * 注意：
 * - 只能在 Server Components 中使用
 * - Client Components 應該使用 src/lib/api.ts
 */

import type { TarotCard, Reading } from '@/types/api';

/**
 * 獲取網站 base URL
 * 優先使用環境變數，開發環境 fallback 到 localhost:3000
 */
const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

/**
 * Next.js cache 策略類型
 */
type CacheStrategy = 'force-cache' | 'no-store' | 'default';

/**
 * 通用 API fetch 函數
 * 處理統一的錯誤處理和 JSON 解析
 */
async function fetchApi<T>(
  path: string,
  options: {
    cache?: CacheStrategy;
  } = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1${path}`;

  try {
    const response = await fetch(url, {
      cache: options.cache || 'default',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[ServerAPI] Failed to fetch ${path}:`, error);
    throw error;
  }
}

/**
 * Server-side API Client
 * 提供類型安全的 API 方法
 */
export const serverApi = {
  /**
   * 卡牌相關 API
   */
  cards: {
    /**
     * 獲取單張卡牌資料
     * @param cardId - 卡牌 UUID
     * @returns 卡牌完整資料
     */
    getCard: (cardId: string): Promise<TarotCard> =>
      fetchApi(`/cards/${cardId}`, { cache: 'force-cache' }),
  },

  /**
   * 占卜記錄相關 API
   */
  readings: {
    /**
     * 獲取占卜記錄
     * @param readingId - 占卜記錄 UUID
     * @returns 占卜記錄完整資料
     */
    getReading: (readingId: string): Promise<Reading> =>
      fetchApi(`/readings/${readingId}`, { cache: 'no-store' }),

    /**
     * 獲取公開分享的占卜記錄
     * @param token - 分享 token
     * @returns 公開的占卜記錄資料
     */
    getSharedReading: (token: string): Promise<Reading> =>
      fetchApi(`/readings/shared/${token}`, { cache: 'no-store' }),
  },
};
