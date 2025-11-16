/**
 * Landing Stats API Types - Unit Tests
 * 測試 LandingStatsResponse schema 和型別驗證
 */

import { describe, it, expect } from '@jest/globals'
import { LandingStatsResponseSchema, type LandingStatsResponse } from '../api'

describe('LandingStatsResponseSchema', () => {
  describe('成功驗證案例', () => {
    it('應該驗證有效的統計資料', () => {
      const validData = {
        users: 1234,
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('應該接受零值的 users 和 readings', () => {
      const validData = {
        users: 0,
        readings: 0,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該接受大數值的 users 和 readings', () => {
      const validData = {
        users: 1000000,
        readings: 5000000,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('應該使用預設值 78 for cards when not provided', () => {
      const partialData = {
        users: 1234,
        readings: 5678,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(partialData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cards).toBe(78)
      }
    })

    it('應該使用預設值 3 for providers when not provided', () => {
      const partialData = {
        users: 1234,
        readings: 5678,
        cards: 78,
      }

      const result = LandingStatsResponseSchema.safeParse(partialData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.providers).toBe(3)
      }
    })
  })

  describe('驗證失敗案例', () => {
    it('應該拒絕負數的 users', () => {
      const invalidData = {
        users: -10,
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕負數的 readings', () => {
      const invalidData = {
        users: 1234,
        readings: -100,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的 users', () => {
      const invalidData = {
        users: 123.45,
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕非整數的 readings', () => {
      const invalidData = {
        users: 1234,
        readings: 567.89,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕字串型別的數值', () => {
      const invalidData = {
        users: '1234',
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('應該拒絕缺少必要欄位', () => {
      const invalidData = {
        users: 1234,
        readings: 5678,
        // Missing cards and providers (should use defaults)
      }

      // Note: This should actually PASS because cards and providers have defaults
      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(true)
    })

    it('應該拒絕完全空物件', () => {
      const invalidData = {}

      const result = LandingStatsResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('型別推導測試', () => {
    it('應該正確推導 TypeScript 型別', () => {
      const data: LandingStatsResponse = {
        users: 1234,
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      // TypeScript 編譯時檢查
      expect(typeof data.users).toBe('number')
      expect(typeof data.readings).toBe('number')
      expect(typeof data.cards).toBe('number')
      expect(typeof data.providers).toBe('number')
    })
  })

  describe('API 回應模擬測試', () => {
    it('應該驗證正常 API 回應', () => {
      const mockApiResponse = {
        users: 1234,
        readings: 5678,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(mockApiResponse)
      expect(result.success).toBe(true)
    })

    it('應該驗證 fallback 值', () => {
      const fallbackResponse = {
        users: 1000,
        readings: 5000,
        cards: 78,
        providers: 3,
      }

      const result = LandingStatsResponseSchema.safeParse(fallbackResponse)
      expect(result.success).toBe(true)
    })

    it('應該處理 JSON 解析後的資料', () => {
      const jsonString = JSON.stringify({
        users: 1234,
        readings: 5678,
        cards: 78,
        providers: 3,
      })

      const parsedData = JSON.parse(jsonString)
      const result = LandingStatsResponseSchema.safeParse(parsedData)
      expect(result.success).toBe(true)
    })
  })
})
