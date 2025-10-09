/**
 * Card Image Utils Tests
 * 測試卡牌圖片路徑映射與 alt 文字生成函式
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TarotCard } from '@/types/api'
import {
  getCardImageUrl,
  getCardImageAlt,
  isValidCardImagePath,
  getFallbackImageUrl,
  preloadCardImages,
} from '../cardImages'

describe('cardImages utils', () => {
  describe('getCardImageUrl', () => {
    describe('Major Arcana cards', () => {
      it('should return correct path for Major Arcana card with is_major_arcana=true', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: true,
          number: 0,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/00.png')
      })

      it('should return correct path for Major Arcana card with suit="major_arcana"', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 1,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/01.png')
      })

      it('should pad single-digit numbers with zero', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: true,
          number: 5,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/05.png')
      })

      it('should handle two-digit numbers correctly', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: true,
          number: 21,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/21.png')
      })

      it('should handle number=0 (The Fool)', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: true,
          number: 0,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/00.png')
      })
    })

    describe('Minor Arcana cards', () => {
      it('should return correct path for Nuka-Cola suit', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 1,
          suit: 'nuka_cola',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/nuka-cola-bottles/01.png')
      })

      it('should return correct path for Combat Weapons suit', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 10,
          suit: 'combat_weapons',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/combat-weapons/10.png')
      })

      it('should return correct path for Bottle Caps suit', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 14,
          suit: 'bottle_caps',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/bottle-caps/14.png')
      })

      it('should return correct path for Radiation Rods suit', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 7,
          suit: 'radiation_rods',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/radiation-rods/07.png')
      })

      it('should pad single-digit numbers with zero for Minor Arcana', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 3,
          suit: 'nuka_cola',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/nuka-cola-bottles/03.png')
      })
    })

    describe('Error handling', () => {
      it('should return fallback image for unknown suit', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: 5,
          suit: 'unknown_suit',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/card-backs/default.png')
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[getCardImageUrl] Unknown suit: unknown_suit. Using fallback image.'
        )
        consoleWarnSpy.mockRestore()
      })

      it('should handle null number by using 0 for Major Arcana', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: true,
          number: null,
          suit: 'major_arcana',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/major-arcana/00.png')
      })

      it('should handle undefined number by using 1 for Minor Arcana', () => {
        const card: Partial<TarotCard> = {
          is_major_arcana: false,
          number: undefined,
          suit: 'nuka_cola',
        }
        const url = getCardImageUrl(card as TarotCard)
        expect(url).toBe('/assets/cards/minor-arcana/nuka-cola-bottles/01.png')
      })
    })
  })

  describe('getCardImageAlt', () => {
    it('should return visuals.image_alt_text if available', () => {
      const card: Partial<TarotCard> = {
        name: 'The Wanderer',
        visuals: {
          image_alt_text: '流浪者塔羅牌 - 廢土主題',
          image_url: null,
          background_image_url: null,
          audio_cue_url: null,
          geiger_sound_intensity: 0.1,
        },
      }
      const alt = getCardImageAlt(card as TarotCard)
      expect(alt).toBe('流浪者塔羅牌 - 廢土主題')
    })

    it('should return default alt text if visuals.image_alt_text is not available', () => {
      const card: Partial<TarotCard> = {
        name: 'The Vault Dweller',
        visuals: {
          image_alt_text: null,
          image_url: null,
          background_image_url: null,
          audio_cue_url: null,
          geiger_sound_intensity: 0.1,
        },
      }
      const alt = getCardImageAlt(card as TarotCard)
      expect(alt).toBe('The Vault Dweller - Wasteland Tarot Card')
    })

    it('should return default alt text if visuals is undefined', () => {
      const card: Partial<TarotCard> = {
        name: 'Ace of Nuka-Cola',
        visuals: undefined,
      }
      const alt = getCardImageAlt(card as TarotCard)
      expect(alt).toBe('Ace of Nuka-Cola - Wasteland Tarot Card')
    })

    it('should handle empty image_alt_text by using fallback', () => {
      const card: Partial<TarotCard> = {
        name: 'Ten of Bottle Caps',
        visuals: {
          image_alt_text: '',
          image_url: null,
          background_image_url: null,
          audio_cue_url: null,
          geiger_sound_intensity: 0.1,
        },
      }
      const alt = getCardImageAlt(card as TarotCard)
      // Empty string is falsy, should use fallback
      expect(alt).toBe('Ten of Bottle Caps - Wasteland Tarot Card')
    })
  })

  describe('isValidCardImagePath', () => {
    it('should return true for valid Major Arcana card (number 0-21)', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: true,
        suit: 'major_arcana',
        number: 10,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(true)
    })

    it('should return true for valid Minor Arcana card (number 1-14)', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: false,
        suit: 'nuka_cola',
        number: 5,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(true)
    })

    it('should return false for Major Arcana card with number > 21', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: true,
        suit: 'major_arcana',
        number: 22,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for Major Arcana card with negative number', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: true,
        suit: 'major_arcana',
        number: -1,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for Minor Arcana card with number < 1', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: false,
        suit: 'nuka_cola',
        number: 0,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for Minor Arcana card with number > 14', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: false,
        suit: 'nuka_cola',
        number: 15,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for card with null number', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: false,
        suit: 'nuka_cola',
        number: null,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for card with undefined suit', () => {
      const card: Partial<TarotCard> = {
        is_major_arcana: false,
        suit: undefined,
        number: 5,
      }
      expect(isValidCardImagePath(card as TarotCard)).toBe(false)
    })

    it('should return false for null card', () => {
      expect(isValidCardImagePath(null as any)).toBe(false)
    })
  })

  describe('getFallbackImageUrl', () => {
    it('should return fallback image path', () => {
      const url = getFallbackImageUrl()
      expect(url).toBe('/assets/cards/card-backs/default.png')
    })
  })

  describe('preloadCardImages', () => {
    it('should create prefetch links for each card in browser environment', () => {
      // Ensure window is defined
      global.window = {} as any

      // Mock DOM environment
      const createElementMock = vi.fn(() => ({
        rel: '',
        as: '',
        href: '',
      }))
      const appendChildMock = vi.fn()

      global.document = {
        createElement: createElementMock,
        head: {
          appendChild: appendChildMock,
        },
      } as any

      const cards: Partial<TarotCard>[] = [
        { is_major_arcana: true, number: 0, suit: 'major_arcana' },
        { is_major_arcana: false, number: 5, suit: 'nuka_cola' },
      ]

      preloadCardImages(cards as TarotCard[])

      expect(createElementMock).toHaveBeenCalledTimes(2)
      expect(appendChildMock).toHaveBeenCalledTimes(2)
    })

    it('should not execute on server-side (window undefined)', () => {
      const originalWindow = global.window
      const originalDocument = global.document

      // @ts-ignore
      delete global.window

      const createElementMock = vi.fn()
      global.document = {
        createElement: createElementMock,
        head: {
          appendChild: vi.fn(),
        },
      } as any

      const cards: Partial<TarotCard>[] = [
        { is_major_arcana: true, number: 0, suit: 'major_arcana' },
      ]

      preloadCardImages(cards as TarotCard[])

      // No error should be thrown, but createElement should not be called
      expect(createElementMock).not.toHaveBeenCalled()

      // Restore window and document
      global.window = originalWindow as any
      global.document = originalDocument
    })
  })
})
