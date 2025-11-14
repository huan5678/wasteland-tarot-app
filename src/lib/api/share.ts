/**
 * Share API Service
 * 占卜結果分享功能的 API client
 *
 * TDD Green Phase: 實作讓測試通過
 */

import { apiClient } from './client'
import type { ShareLinkResponse, PublicReadingData } from '@/types/api'
import { ShareLinkResponseSchema, PublicReadingDataSchema } from '@/types/api'

/**
 * 使用 Zod schema 驗證 API 回應
 */
function validateResponse<T>(data: unknown, schema: any): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('API Response Validation Error:', result.error)
    throw new Error(`Invalid API response: ${result.error.message}`)
  }

  return result.data as T
}

// ============================================================================
// Share API
// ============================================================================

export const shareAPI = {
  /**
   * 生成分享連結
   *
   * 呼叫 POST /api/v1/readings/{readingId}/share
   * 需要登入（JWT token 會由 apiClient 自動處理）
   *
   * @param readingId - 占卜 ID
   * @returns ShareLinkResponse - 包含 share_token, share_url, created_at
   *
   * @throws {ApiError} 404 - Reading 不存在
   * @throws {ApiError} 403 - 不是占卜的擁有者
   * @throws {ApiError} 401 - 未登入
   *
   * @example
   * ```ts
   * const result = await shareAPI.generateShareLink('reading-123')
   * console.log(result.share_url)
   * // => http://localhost:3000/share/550e8400-e29b-41d4-a716-446655440000
   * ```
   */
  async generateShareLink(readingId: string): Promise<ShareLinkResponse> {
    const data = await apiClient.post(`/api/v1/readings/${readingId}/share`)
    return validateResponse<ShareLinkResponse>(data, ShareLinkResponseSchema)
  },

  /**
   * 獲取公開的占卜資料
   *
   * 呼叫 GET /api/v1/share/{shareToken}
   * 無需登入 - 任何人都可以用 share_token 查看
   *
   * @param shareToken - 分享 token (UUID)
   * @param password - 可選的密碼（如果分享需要密碼保護）
   * @returns PublicReadingData - 公開的占卜資料（不含私密欄位）
   *
   * @throws {ApiError} 404 - Share link 不存在
   * @throws {ApiError} 410 - 分享已被撤回
   * @throws {ApiError} 403 - 密碼錯誤或需要密碼
   * @throws {ApiError} 422 - Token 格式錯誤
   *
   * @example
   * ```ts
   * // 無密碼的分享
   * const data = await shareAPI.getSharedReading('550e8400-e29b-41d4-a716-446655440000')
   * console.log(data.question)
   * // => "關於工作的問題"
   *
   * // 有密碼保護的分享
   * const data = await shareAPI.getSharedReading('550e8400-e29b-41d4-a716-446655440000', '1234')
   * ```
   */
  async getSharedReading(shareToken: string, password?: string): Promise<PublicReadingData> {
    // 構建 URL，如果有密碼則加入 query parameter
    let endpoint = `/api/v1/share/${shareToken}`
    if (password) {
      const params = new URLSearchParams({ password })
      endpoint += `?${params.toString()}`
    }

    const data = await apiClient.get(endpoint)
    return validateResponse<PublicReadingData>(data, PublicReadingDataSchema)
  },
}
