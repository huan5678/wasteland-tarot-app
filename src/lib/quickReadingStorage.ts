/**
 * Quick Reading localStorage Service
 *
 * 提供型別安全的 localStorage 操作介面，支援：
 * - 資料序列化與反序列化
 * - 格式驗證
 * - 錯誤處理與降級策略
 */

// localStorage 資料格式
export interface LocalStorageData {
  selectedCardId: string
  cardPoolIds: string[]
  timestamp: number
}

// 錯誤類型
export type StorageError =
  | { type: 'QUOTA_EXCEEDED'; message: string }
  | { type: 'INVALID_DATA'; message: string }
  | { type: 'ACCESS_DENIED'; message: string }

// Result 型別
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E }

/**
 * Quick Reading Storage Service
 */
export class QuickReadingStorage {
  private readonly STORAGE_KEY = 'wasteland-tarot-quick-reading'

  /**
   * 檢查 localStorage 是否可用
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * 儲存資料至 localStorage
   */
  save(data: LocalStorageData): Result<void, StorageError> {
    try {
      const serialized = JSON.stringify({
        selectedCardId: data.selectedCardId,
        cardPoolIds: data.cardPoolIds,
        timestamp: data.timestamp,
      })

      localStorage.setItem(this.STORAGE_KEY, serialized)
      return { success: true, value: undefined }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: {
            type: 'QUOTA_EXCEEDED',
            message: 'Storage quota exceeded',
          },
        }
      }

      return {
        success: false,
        error: {
          type: 'ACCESS_DENIED',
          message: error.message || 'Storage access denied',
        },
      }
    }
  }

  /**
   * 從 localStorage 讀取資料
   */
  load(): Result<LocalStorageData | null, StorageError> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)

      if (!stored) {
        return { success: true, value: null }
      }

      const parsed = JSON.parse(stored)

      if (!this.validate(parsed)) {
        // 自動清除損壞資料
        this.clear()
        return {
          success: false,
          error: {
            type: 'INVALID_DATA',
            message: 'Corrupted data detected and cleared',
          },
        }
      }

      return { success: true, value: parsed as LocalStorageData }
    } catch (error: any) {
      // JSON 解析失敗
      this.clear()
      return {
        success: false,
        error: {
          type: 'INVALID_DATA',
          message: error.message || 'Failed to parse stored data',
        },
      }
    }
  }

  /**
   * 清除儲存的資料
   */
  clear(): Result<void, StorageError> {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      return { success: true, value: undefined }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'ACCESS_DENIED',
          message: error.message || 'Failed to clear storage',
        },
      }
    }
  }

  /**
   * 驗證資料格式
   */
  private validate(data: unknown): data is LocalStorageData {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    const obj = data as any

    // 驗證必要欄位存在
    if (!('selectedCardId' in obj && 'cardPoolIds' in obj && 'timestamp' in obj)) {
      return false
    }

    // 驗證型別
    if (typeof obj.selectedCardId !== 'string') {
      return false
    }

    if (!Array.isArray(obj.cardPoolIds)) {
      return false
    }

    // 驗證 cardPoolIds 長度（3-5 張卡）
    if (obj.cardPoolIds.length < 3 || obj.cardPoolIds.length > 5) {
      return false
    }

    // 驗證 cardPoolIds 內容都是 string
    if (!obj.cardPoolIds.every((id: any) => typeof id === 'string')) {
      return false
    }

    if (typeof obj.timestamp !== 'number') {
      return false
    }

    // 驗證 timestamp 是有效的數字
    if (!Number.isFinite(obj.timestamp) || obj.timestamp < 0) {
      return false
    }

    return true
  }
}

/**
 * 單例實例
 */
export const quickReadingStorage = new QuickReadingStorage()
