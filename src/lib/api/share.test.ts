/**
 * Share API Tests
 *
 * TDD Red Phase: 測試 share API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shareAPI } from './share'
import { apiClient } from './client'

// Mock apiClient
vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('shareAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateShareLink', () => {
    it('should call POST /api/v1/readings/{id}/share', async () => {
      // RED: shareAPI.generateShareLink 尚未實作
      const mockResponse = {
        share_token: '550e8400-e29b-41d4-a716-446655440000',
        share_url: 'http://localhost:3000/share/550e8400-e29b-41d4-a716-446655440000',
        created_at: '2025-10-21T12:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const readingId = 'reading-123'
      const result = await shareAPI.generateShareLink(readingId)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/v1/readings/${readingId}/share`
      )
      expect(result).toEqual(mockResponse)
    })

    it('should return share_token and share_url', async () => {
      // RED: 測試會失敗
      const mockResponse = {
        share_token: 'abc-123',
        share_url: 'http://localhost:3000/share/abc-123',
        created_at: '2025-10-21T12:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await shareAPI.generateShareLink('reading-id')

      expect(result.share_token).toBe('abc-123')
      expect(result.share_url).toBe('http://localhost:3000/share/abc-123')
      expect(result.created_at).toBeTruthy()
    })

    it('should throw error on API failure', async () => {
      // RED: 測試會失敗
      vi.mocked(apiClient.post).mockRejectedValue(new Error('API Error'))

      await expect(
        shareAPI.generateShareLink('reading-id')
      ).rejects.toThrow('API Error')
    })
  })

  describe('getSharedReading', () => {
    it('should call GET /api/v1/share/{token}', async () => {
      // RED: shareAPI.getSharedReading 尚未實作
      const mockResponse = {
        reading_id: 'reading-123',
        question: 'Test question',
        character_voice_used: 'ghoul',
        karma_context: 'neutral',
        overall_interpretation: 'Test interpretation',
        created_at: '2025-10-21T12:00:00Z',
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const shareToken = 'abc-123'
      const result = await shareAPI.getSharedReading(shareToken)

      expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/share/${shareToken}`)
      expect(result).toEqual(mockResponse)
    })

    it('should return public reading data', async () => {
      // RED: 測試會失敗
      const mockResponse = {
        reading_id: 'reading-123',
        question: 'About work',
        character_voice_used: 'ghoul',
        karma_context: 'neutral',
        overall_interpretation: 'Your future looks bright',
        created_at: '2025-10-21T12:00:00Z',
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await shareAPI.getSharedReading('token-123')

      expect(result.reading_id).toBe('reading-123')
      expect(result.question).toBe('About work')
      expect(result.overall_interpretation).toBe('Your future looks bright')
    })

    it('should not include private data', async () => {
      // RED: 測試會失敗
      const mockResponse = {
        reading_id: 'reading-123',
        question: 'Test question',
        overall_interpretation: 'Test',
        created_at: '2025-10-21T12:00:00Z',
        // 不應該包含這些欄位
        // user_id, user_email
      }

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await shareAPI.getSharedReading('token-123')

      expect(result).not.toHaveProperty('user_id')
      expect(result).not.toHaveProperty('user_email')
    })

    it('should throw error on invalid token (404)', async () => {
      // RED: 測試會失敗
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Share link not found'))

      await expect(
        shareAPI.getSharedReading('invalid-token')
      ).rejects.toThrow('Share link not found')
    })
  })
})
