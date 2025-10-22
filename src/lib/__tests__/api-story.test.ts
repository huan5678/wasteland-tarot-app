/**
 * Story API Client Tests (TDD - Red Phase)
 * Tests for wasteland story mode API client methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCardWithStory,
  generateStoryAudio,
  getStoryAudioUrls,
} from '../api'
import type {
  WastelandCardWithStory,
  GenerateStoryAudioResponse,
} from '@/types/database'

// Mock fetch and navigator globally
const originalFetch = global.fetch
const originalNavigator = global.navigator

describe('Story API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.onLine to be true
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    global.navigator = originalNavigator
  })

  describe('getCardWithStory', () => {
    it('should fetch card with story when include_story=true', async () => {
      const mockCard: WastelandCardWithStory = {
        id: 'test-card-id',
        name: 'The Fool',
        suit: 'MAJOR_ARCANA',
        card_number: 0,
        number: 0,
        upright_meaning: 'New beginnings',
        reversed_meaning: 'Recklessness',
        image_url: '/images/cards/fool.png',
        radiation_factor: 0.5,
        karma_alignment: 'NEUTRAL',
        character_voice_interpretations: {},
        rarity_level: 'common',
        is_active: true,
        is_complete: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        story: {
          background: '在輻射廢土上，一名初出茅廬的避難所居民踏出了 Vault 的大門，面對著未知的荒蕪世界。他手持 Pip-Boy，心懷希望，準備在這片充滿危險與機會的廢土上書寫自己的傳奇。他不知道前方等待著什麼，但他相信每一步都是新的開始。',
          character: '避難所居民',
          location: 'Vault 111',
          timeline: '2287 年',
          factionsInvolved: ['Vault-Tec', 'Independent'],
          relatedQuest: '離開 Vault',
        },
        audioUrls: {
          'vault_dweller': 'https://storage.supabase.co/story/test-card-id/vault_dweller.mp3',
          'pip_boy': 'https://storage.supabase.co/story/test-card-id/pip_boy.mp3',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockCard,
      })

      const result = await getCardWithStory('test-card-id')

      expect(result).toBeDefined()
      expect(result.story).toBeDefined()
      expect(result.story?.background).toContain('輻射廢土')
      expect(result.audioUrls).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/cards/test-card-id?include_story=true'),
        expect.any(Object)
      )
    })

    it('should throw error when card not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ detail: 'Card not found' }),
      })

      await expect(getCardWithStory('non-existent-id')).rejects.toThrow()
    })
  })

  describe('generateStoryAudio', () => {
    it('should successfully generate story audio', async () => {
      const mockResponse: GenerateStoryAudioResponse = {
        cardId: 'test-card-id',
        audioUrls: {
          'brotherhood_scribe': 'https://storage.supabase.co/story/test-card-id/brotherhood_scribe.mp3',
        },
        cached: {
          'brotherhood_scribe': false,
        },
        generatedAt: '2025-01-22T10:00:00Z',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockResponse,
      })

      const result = await generateStoryAudio('test-card-id', ['brotherhood_scribe'])

      expect(result).toBeDefined()
      expect(result.audioUrls).toBeDefined()
      expect(result.audioUrls['brotherhood_scribe']).toContain('.mp3')
      expect(result.cached['brotherhood_scribe']).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/audio/generate/story'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('brotherhood_scribe'),
        })
      )
    })

    it('should fallback to Web Speech API on TTS service failure (503)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ detail: 'TTS service unavailable' }),
      })

      const result = await generateStoryAudio('test-card-id', ['pip_boy'])

      // Should return empty response with fallback hint
      expect(result).toBeDefined()
      expect(result.cardId).toBe('test-card-id')
      expect(result.audioUrls).toEqual({})
      expect(result.cached).toEqual({})
    })

    it('should return cached URLs when audio already exists', async () => {
      const mockResponse: GenerateStoryAudioResponse = {
        cardId: 'test-card-id',
        audioUrls: {
          'ncr_ranger': 'https://storage.supabase.co/story/test-card-id/ncr_ranger.mp3',
        },
        cached: {
          'ncr_ranger': true,
        },
        generatedAt: '2025-01-22T09:00:00Z',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockResponse,
      })

      const result = await generateStoryAudio('test-card-id', ['ncr_ranger'])

      expect(result.cached['ncr_ranger']).toBe(true)
    })
  })

  describe('getStoryAudioUrls', () => {
    it('should fetch all story audio URLs for a card', async () => {
      const mockResponse = {
        cardId: 'test-card-id',
        audioUrls: {
          'vault_dweller': 'https://storage.supabase.co/story/test-card-id/vault_dweller.mp3',
          'pip_boy': 'https://storage.supabase.co/story/test-card-id/pip_boy.mp3',
          'wasteland_trader': 'https://storage.supabase.co/story/test-card-id/wasteland_trader.mp3',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockResponse,
      })

      const result = await getStoryAudioUrls('test-card-id')

      expect(result).toBeDefined()
      expect(Object.keys(result)).toHaveLength(3)
      expect(result['vault_dweller']).toContain('.mp3')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/audio/story/test-card-id'),
        expect.any(Object)
      )
    })

    it('should return empty object when no audio URLs exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ detail: 'No audio found' }),
      })

      const result = await getStoryAudioUrls('test-card-id')

      expect(result).toEqual({})
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await getStoryAudioUrls('test-card-id')

      expect(result).toEqual({})
    })
  })
})
