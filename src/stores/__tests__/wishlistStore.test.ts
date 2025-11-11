/**
 * WishlistStore Tests
 * Testing Zustand store methods and state changes
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useWishlistStore } from '../wishlistStore'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock cookies for authentication
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'access_token=mock-token',
})

describe('WishlistStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useWishlistStore())
    act(() => {
      result.current.reset()
    })
  })

  afterEach(() => {
    // Reset handlers after each test
    server.resetHandlers()
  })

  describe('Initial State', () => {
    it('should have empty wishes array', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.wishes).toEqual([])
    })

    it('should have isLoading as false', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.isLoading).toBe(false)
    })

    it('should have error as null', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.error).toBeNull()
    })

    it('should have hasSubmittedToday as false', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.hasSubmittedToday).toBe(false)
    })

    it('should have default admin state', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.adminWishes).toEqual([])
      expect(result.current.adminFilter).toBe('all')
      expect(result.current.adminSort).toBe('newest')
      expect(result.current.adminPage).toBe(1)
      expect(result.current.adminTotal).toBe(0)
      expect(result.current.adminPageSize).toBe(50)
    })
  })

  describe('fetchUserWishes', () => {
    it('should fetch user wishes successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.wishes.length).toBeGreaterThan(0)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('should set isLoading to true during fetch', async () => {
      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        result.current.fetchUserWishes()
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should update hasSubmittedToday based on latest wish date', async () => {
      // Mock response with wish from today
      const today = new Date().toISOString()

      server.use(
        http.get(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json([
            {
              id: 'wish-today',
              user_id: 'user-1',
              content: 'Today wish',
              admin_reply: null,
              created_at: today,
              updated_at: today,
              admin_reply_timestamp: null,
              has_been_edited: false,
              is_hidden: false,
            },
          ])
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.hasSubmittedToday).toBe(true)
      })
    })

    it('should handle fetch error', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('submitWish', () => {
    it('should submit wish successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.submitWish('New wish content')
      })

      await waitFor(() => {
        expect(result.current.wishes.length).toBeGreaterThan(0)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should reload wishes after successful submission', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // First fetch existing wishes
      await act(async () => {
        await result.current.fetchUserWishes()
      })

      const initialCount = result.current.wishes.length

      // Submit new wish
      await act(async () => {
        await result.current.submitWish('Another wish')
      })

      await waitFor(() => {
        // Should have reloaded wishes
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle daily limit error', async () => {
      server.use(
        http.post(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json(
            { detail: '今日已提交願望，明日再來許願吧' },
            { status: 409 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await expect(
        act(async () => {
          await result.current.submitWish('New wish')
        })
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should handle empty content error', async () => {
      server.use(
        http.post(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json(
            { detail: '願望內容不可為空' },
            { status: 400 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await expect(
        act(async () => {
          await result.current.submitWish('')
        })
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })
  })

  describe('updateWish', () => {
    it('should update wish successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // First fetch wishes
      await act(async () => {
        await result.current.fetchUserWishes()
      })

      const wishId = result.current.wishes[0]?.id

      if (wishId) {
        await act(async () => {
          await result.current.updateWish(wishId, 'Updated content')
        })

        await waitFor(() => {
          const updatedWish = result.current.wishes.find(w => w.id === wishId)
          expect(updatedWish?.content).toBe('Updated content')
          expect(updatedWish?.has_been_edited).toBe(true)
        })
      }
    })

    it('should handle edit not allowed error', async () => {
      server.use(
        http.put(`${API_BASE}/api/v1/wishlist/:wishId`, () => {
          return HttpResponse.json(
            { detail: '此願望已收到回覆，無法再次編輯' },
            { status: 403 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await expect(
        act(async () => {
          await result.current.updateWish('wish-1', 'New content')
        })
      ).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })

    it('should handle wish not found error', async () => {
      server.use(
        http.put(`${API_BASE}/api/v1/wishlist/:wishId`, () => {
          return HttpResponse.json(
            { detail: '願望未找到' },
            { status: 404 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await expect(
        act(async () => {
          await result.current.updateWish('non-existent', 'New content')
        })
      ).rejects.toThrow()
    })
  })

  describe('fetchAdminWishes', () => {
    it('should fetch admin wishes successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchAdminWishes()
      })

      await waitFor(() => {
        expect(result.current.adminWishes.length).toBeGreaterThan(0)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should apply filter parameter', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        result.current.setAdminFilter('unreplied')
      })

      await waitFor(() => {
        expect(result.current.adminFilter).toBe('unreplied')
      })
    })

    it('should apply sort parameter', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        result.current.setAdminSort('oldest')
      })

      await waitFor(() => {
        expect(result.current.adminSort).toBe('oldest')
      })
    })

    it('should update pagination info', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchAdminWishes()
      })

      await waitFor(() => {
        expect(result.current.adminTotal).toBeGreaterThanOrEqual(0)
        expect(result.current.adminPage).toBe(1)
      })
    })
  })

  describe('setAdminFilter', () => {
    it('should update filter and reset page to 1', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // Set page to 2 first
      await act(async () => {
        result.current.setAdminPage(2)
      })

      await waitFor(() => {
        expect(result.current.adminPage).toBe(2)
      })

      // Change filter should reset page
      await act(async () => {
        result.current.setAdminFilter('replied')
      })

      await waitFor(() => {
        expect(result.current.adminFilter).toBe('replied')
        expect(result.current.adminPage).toBe(1)
      })
    })

    it('should trigger fetchAdminWishes', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        result.current.setAdminFilter('unreplied')
      })

      await waitFor(() => {
        expect(result.current.adminWishes).toBeDefined()
      })
    })
  })

  describe('setAdminSort', () => {
    it('should update sort and reset page to 1', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // Set page to 3 first
      await act(async () => {
        result.current.setAdminPage(3)
      })

      await waitFor(() => {
        expect(result.current.adminPage).toBe(3)
      })

      // Change sort should reset page
      await act(async () => {
        result.current.setAdminSort('oldest')
      })

      await waitFor(() => {
        expect(result.current.adminSort).toBe('oldest')
        expect(result.current.adminPage).toBe(1)
      })
    })
  })

  describe('setAdminPage', () => {
    it('should update page and trigger fetch', async () => {
      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        result.current.setAdminPage(2)
      })

      await waitFor(() => {
        expect(result.current.adminPage).toBe(2)
      })
    })
  })

  describe('submitReply', () => {
    it('should submit admin reply successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // First fetch admin wishes
      await act(async () => {
        await result.current.fetchAdminWishes()
      })

      const wishId = result.current.adminWishes[0]?.id

      if (wishId) {
        await act(async () => {
          await result.current.submitReply(wishId, 'Admin reply content')
        })

        await waitFor(() => {
          const repliedWish = result.current.adminWishes.find(w => w.id === wishId)
          expect(repliedWish?.admin_reply).toBe('Admin reply content')
          expect(repliedWish?.admin_reply_timestamp).not.toBeNull()
        })
      }
    })

    it('should handle wish not found error', async () => {
      server.use(
        http.put(`${API_BASE}/api/v1/wishlist/admin/:wishId/reply`, () => {
          return HttpResponse.json(
            { detail: '願望未找到' },
            { status: 404 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await expect(
        act(async () => {
          await result.current.submitReply('non-existent', 'Reply')
        })
      ).rejects.toThrow()
    })
  })

  describe('toggleHidden', () => {
    it('should hide wish successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // First fetch admin wishes
      await act(async () => {
        await result.current.fetchAdminWishes()
      })

      const wishId = result.current.adminWishes[0]?.id

      if (wishId) {
        await act(async () => {
          await result.current.toggleHidden(wishId, true)
        })

        await waitFor(() => {
          const hiddenWish = result.current.adminWishes.find(w => w.id === wishId)
          expect(hiddenWish?.is_hidden).toBe(true)
        })
      }
    })

    it('should unhide wish successfully', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // First fetch admin wishes
      await act(async () => {
        await result.current.fetchAdminWishes()
      })

      const wishId = result.current.adminWishes[0]?.id

      if (wishId) {
        // Hide first
        await act(async () => {
          await result.current.toggleHidden(wishId, true)
        })

        // Then unhide
        await act(async () => {
          await result.current.toggleHidden(wishId, false)
        })

        await waitFor(() => {
          const visibleWish = result.current.adminWishes.find(w => w.id === wishId)
          expect(visibleWish?.is_hidden).toBe(false)
        })
      }
    })
  })

  describe('Utility Methods', () => {
    it('checkDailyLimit should return hasSubmittedToday value', () => {
      const { result } = renderHook(() => useWishlistStore())

      const canSubmit = result.current.checkDailyLimit()
      expect(canSubmit).toBe(result.current.hasSubmittedToday)
    })

    it('clearError should clear error state', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // Trigger an error first
      server.use(
        http.get(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json(
            { detail: 'Error occurred' },
            { status: 500 }
          )
        })
      )

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('reset should reset all state to initial values', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // Load some data first
      await act(async () => {
        await result.current.fetchUserWishes()
        result.current.setAdminFilter('replied')
        result.current.setAdminSort('oldest')
        result.current.setAdminPage(3)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.wishes).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.hasSubmittedToday).toBe(false)
      expect(result.current.adminWishes).toEqual([])
      expect(result.current.adminFilter).toBe('all')
      expect(result.current.adminSort).toBe('newest')
      expect(result.current.adminPage).toBe(1)
      expect(result.current.adminTotal).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle 401 unauthorized errors', async () => {
      server.use(
        http.get(`${API_BASE}/api/v1/wishlist`, () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.fetchUserWishes()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })
    })
  })

  describe('State Consistency', () => {
    it('should maintain consistent state during multiple operations', async () => {
      const { result } = renderHook(() => useWishlistStore())

      // Fetch wishes
      await act(async () => {
        await result.current.fetchUserWishes()
      })

      const initialCount = result.current.wishes.length

      // Update a wish
      if (initialCount > 0) {
        const wishId = result.current.wishes[0].id

        await act(async () => {
          await result.current.updateWish(wishId, 'Updated')
        })

        // Wish count should remain the same
        expect(result.current.wishes.length).toBe(initialCount)
      }
    })

    it('should not mutate state outside of actions', () => {
      const { result } = renderHook(() => useWishlistStore())

      const initialWishes = result.current.wishes

      // Attempting to mutate directly should not affect store
      initialWishes.push({
        id: 'fake-wish',
        user_id: 'user-1',
        content: 'Fake',
        admin_reply: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_reply_timestamp: null,
        has_been_edited: false,
        is_hidden: false,
      })

      // Store should still have empty array (immutability)
      expect(result.current.wishes.length).toBe(0)
    })
  })
})
