/**
 * Token Extension Analytics API Client
 *
 * 用於呼叫 backend token-extensions analytics endpoints
 */

import { apiClient } from './client'

export interface TokenExtensionEvent {
  extension_type: 'activity' | 'loyalty'
  extension_minutes: number
  success: boolean
  reason?: string
  metadata?: Record<string, any>
}

export interface TokenExtensionStats {
  total_extensions: number
  activity_extensions: number
  loyalty_extensions: number
  total_minutes_extended: number
  average_extension_minutes: number
  success_rate: number
  last_extension: any | null
  daily_stats: Array<{
    date: string
    total: number
    activity: number
    loyalty: number
    minutes_extended: number
  }>
}

export interface TokenExtensionHistoryItem {
  id: string
  user_id: string
  event_type: string
  event_category: string
  event_action: string
  event_data: {
    extension_type: 'activity' | 'loyalty'
    extension_minutes: number
    success: boolean
    reason?: string
  }
  created_at: string
  readable_time: string
  success_text: string
  type_text: string
}

export interface TokenExtensionHistory {
  extensions: TokenExtensionHistoryItem[]
  total_count: number
  period_start: string | null
  period_end: string | null
}

/**
 * 追蹤 Token 延長事件
 */
export async function trackTokenExtension(event: TokenExtensionEvent): Promise<any> {
  const response = await apiClient.post<any>('/api/v1/analytics/token-extensions/track', event)
  return response
}

/**
 * 取得 Token 延長統計資料
 */
export async function getTokenExtensionStats(
  startDate?: string,
  endDate?: string
): Promise<TokenExtensionStats> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const queryString = params.toString()
  const url = queryString
    ? `/api/v1/analytics/token-extensions/stats?${queryString}`
    : '/api/v1/analytics/token-extensions/stats'

  const response = await apiClient.get<TokenExtensionStats>(url)
  return response
}

/**
 * 取得 Token 延長歷史記錄
 */
export async function getTokenExtensionHistory(
  extensionType?: 'activity' | 'loyalty',
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<TokenExtensionHistory> {
  const params = new URLSearchParams()
  if (extensionType) params.append('extension_type', extensionType)
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  if (limit) params.append('limit', limit.toString())

  const queryString = params.toString()
  const url = queryString
    ? `/api/v1/analytics/token-extensions/history?${queryString}`
    : '/api/v1/analytics/token-extensions/history'

  const response = await apiClient.get<TokenExtensionHistory>(url)
  return response
}
