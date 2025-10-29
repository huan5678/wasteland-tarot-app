/**
 * Achievement Page Authentication Integration Tests (Task 4.4)
 *
 * Tests complete authentication flow for Achievement page:
 * - Page load with valid httpOnly cookie
 * - Redirect when no cookie
 * - Redirect when expired cookie (401)
 * - Achievement claim succeeds
 * - Already claimed error (409)
 *
 * Requirements covered: 10.2, 10.3, 10.4
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import AchievementsPage from '../page'
import { useAuthStore } from '@/lib/authStore'
import { useAchievementStore } from '@/lib/stores/achievementStore'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('Achievement Page Authentication Integration (Task 4.4)', () => {
  let originalLocation: Location | undefined

  beforeAll(() => {
    // Setup window location mock if in browser environment
    if (typeof window !== 'undefined') {
      originalLocation = window.location
      delete (window as any).location
      window.location = {
        ...originalLocation,
        href: 'http://localhost:3000/achievements',
      } as any

      Object.defineProperty(window.location, 'href', {
        writable: true,
        value: 'http://localhost:3000/achievements',
      })
    }
  })

  afterAll(() => {
    // Restore window location
    if (typeof window !== 'undefined' && originalLocation) {
      window.location = originalLocation
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset stores
    useAuthStore.getState().setUser(null)
    useAuthStore.setState({ isInitialized: true })
    useAchievementStore.getState().reset()

    // Mock navigator.onLine
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
    }
  })

  describe('Subtask 4.4.1: Successful page load with valid httpOnly cookie', () => {
    it('should load page successfully with valid authentication', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock achievements data
      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
              {
                code: 'SOCIAL_BUTTERFLY',
                name: '社交達人',
                description: '與 10 位不同用戶互動',
                category: 'social',
                icon_name: 'users',
                points: 20,
                rewards: { karma: 10 },
              },
            ],
            total: 2,
            category_filter: null,
          })
        }),
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 2,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 1,
            completion_percentage: 50,
            achievements: [
              {
                achievement_code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
                is_unlocked: true,
                is_claimed: false,
                unlocked_at: '2025-10-29T00:00:00Z',
                claimed_at: null,
                progress_current: 1,
                progress_target: 1,
              },
            ],
          })
        }),
        http.get('*/api/v1/achievements/summary', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 2,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 1,
            completion_percentage: 50,
            total_points_earned: 0,
            total_karma_earned: 0,
            achievements_by_category: {
              reading: 1,
              social: 1,
              bingo: 0,
              exploration: 0,
            },
          })
        })
      )

      render(<AchievementsPage />)

      // Wait for data to load
      await waitFor(() => {
        expect(useAchievementStore.getState().achievements.length).toBeGreaterThan(0)
      })

      expect(useAchievementStore.getState().isLoading).toBe(false)
      expect(useAchievementStore.getState().error).toBeNull()
    })

    it('should display achievement list with correct data', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
            ],
            total: 1,
            category_filter: null,
          })
        }),
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            achievements: [
              {
                achievement_code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
                is_unlocked: true,
                is_claimed: false,
                unlocked_at: '2025-10-29T00:00:00Z',
                claimed_at: null,
                progress_current: 1,
                progress_target: 1,
              },
            ],
          })
        }),
        http.get('*/api/v1/achievements/summary', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            total_points_earned: 0,
            total_karma_earned: 0,
            achievements_by_category: {
              reading: 1,
              social: 0,
              bingo: 0,
              exploration: 0,
            },
          })
        })
      )

      render(<AchievementsPage />)

      await waitFor(() => {
        const achievements = useAchievementStore.getState().achievements
        expect(achievements.length).toBe(1)
        expect(achievements[0].code).toBe('FIRST_READING')
      })
    })
  })

  describe('Subtask 4.4.2: Redirect when no httpOnly cookie', () => {
    it('should redirect to login when user is not authenticated', async () => {
      useAuthStore.getState().setUser(null)

      render(<AchievementsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should not fetch achievement data when unauthenticated', async () => {
      useAuthStore.getState().setUser(null)

      const fetchSpy = jest.spyOn(useAchievementStore.getState(), 'fetchAchievements')

      render(<AchievementsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('Subtask 4.4.3: Redirect when expired cookie (401)', () => {
    it('should redirect to login when API returns 401', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock 401 response
      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json(
            { detail: 'Token expired' },
            { status: 401, statusText: 'Token expired' }
          )
        })
      )

      render(<AchievementsPage />)

      await waitFor(() => {
        if (typeof window !== 'undefined') {
          expect(window.location.href).toContain('/auth/login?reason=session_expired')
        }
      }, { timeout: 5000 })
    })

    it('should handle 401 with missing token reason', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      render(<AchievementsPage />)

      await waitFor(() => {
        if (typeof window !== 'undefined') {
          expect(window.location.href).toContain('/auth/login?reason=auth_required')
        }
      }, { timeout: 5000 })
    })
  })

  describe('Subtask 4.4.4: Achievement reward claim succeeds', () => {
    it('should successfully claim achievement reward with valid authentication', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
            ],
            total: 1,
            category_filter: null,
          })
        }),
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            achievements: [
              {
                achievement_code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
                is_unlocked: true,
                is_claimed: false,
                unlocked_at: '2025-10-29T00:00:00Z',
                claimed_at: null,
                progress_current: 1,
                progress_target: 1,
              },
            ],
          })
        }),
        http.get('*/api/v1/achievements/summary', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            total_points_earned: 0,
            total_karma_earned: 0,
            achievements_by_category: {
              reading: 1,
              social: 0,
              bingo: 0,
              exploration: 0,
            },
          })
        }),
        http.post('*/api/v1/achievements/FIRST_READING/claim', () => {
          return HttpResponse.json({
            success: true,
            achievement_code: 'FIRST_READING',
            rewards: { karma: 5 },
            message: '獎勵已領取！',
            claimed_at: '2025-10-29T10:00:00Z',
          })
        })
      )

      render(<AchievementsPage />)

      await waitFor(() => {
        expect(useAchievementStore.getState().achievements.length).toBeGreaterThan(0)
      })

      // Claim reward
      await act(async () => {
        await useAchievementStore.getState().claimReward('FIRST_READING')
      })

      // Verify claim succeeded
      await waitFor(() => {
        expect(useAchievementStore.getState().isClaiming).toBe(false)
        expect(useAchievementStore.getState().error).toBeNull()
      })
    })
  })

  describe('Subtask 4.4.5: Already claimed error (409)', () => {
    it('should handle already claimed achievement error', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
            ],
            total: 1,
            category_filter: null,
          })
        }),
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 1,
            in_progress_count: 0,
            completion_percentage: 100,
            achievements: [
              {
                achievement_code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
                is_unlocked: true,
                is_claimed: true,
                unlocked_at: '2025-10-29T00:00:00Z',
                claimed_at: '2025-10-29T10:00:00Z',
                progress_current: 1,
                progress_target: 1,
              },
            ],
          })
        }),
        http.get('*/api/v1/achievements/summary', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 1,
            in_progress_count: 0,
            completion_percentage: 100,
            total_points_earned: 10,
            total_karma_earned: 5,
            achievements_by_category: {
              reading: 1,
              social: 0,
              bingo: 0,
              exploration: 0,
            },
          })
        }),
        http.post('*/api/v1/achievements/FIRST_READING/claim', () => {
          return HttpResponse.json(
            { detail: '成就已領取' },
            { status: 409 }
          )
        })
      )

      render(<AchievementsPage />)

      await waitFor(() => {
        expect(useAchievementStore.getState().achievements.length).toBeGreaterThan(0)
      })

      // Try to claim already claimed achievement
      await act(async () => {
        try {
          await useAchievementStore.getState().claimReward('FIRST_READING')
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify error is displayed
      expect(useAchievementStore.getState().error).toBeTruthy()
    })
  })

  describe('Subtask 4.4.6: Offline error handling', () => {
    it('should display offline error when network is unavailable', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock offline state
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        })
      }

      render(<AchievementsPage />)

      await act(async () => {
        try {
          await useAchievementStore.getState().fetchAchievements()
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify offline error
      await waitFor(() => {
        expect(useAchievementStore.getState().error).toContain('網路')
      })
    })

    it('should allow retry when connection is restored', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Start offline
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        })
      }

      render(<AchievementsPage />)

      // Attempt to fetch (should fail)
      await act(async () => {
        try {
          await useAchievementStore.getState().fetchAchievements()
        } catch (error) {
          // Expected
        }
      })

      expect(useAchievementStore.getState().error).toBeTruthy()

      // Go back online
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        })
      }

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
            ],
            total: 1,
            category_filter: null,
          })
        })
      )

      // Retry fetch
      await act(async () => {
        await useAchievementStore.getState().fetchAchievements()
      })

      // Verify success
      await waitFor(() => {
        expect(useAchievementStore.getState().achievements.length).toBe(1)
        expect(useAchievementStore.getState().error).toBeNull()
      })
    })
  })

  describe('Integration: Complete user flow', () => {
    it('should handle full authenticated flow: load → view → claim', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: [
              {
                code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
              },
            ],
            total: 1,
            category_filter: null,
          })
        }),
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            achievements: [
              {
                achievement_code: 'FIRST_READING',
                name: '首次解讀',
                description: '完成第一次塔羅牌解讀',
                category: 'reading',
                icon_name: 'book-open',
                points: 10,
                rewards: { karma: 5 },
                is_unlocked: true,
                is_claimed: false,
                unlocked_at: '2025-10-29T00:00:00Z',
                claimed_at: null,
                progress_current: 1,
                progress_target: 1,
              },
            ],
          })
        }),
        http.get('*/api/v1/achievements/summary', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 1,
            unlocked_count: 1,
            claimed_count: 0,
            in_progress_count: 0,
            completion_percentage: 100,
            total_points_earned: 0,
            total_karma_earned: 0,
            achievements_by_category: {
              reading: 1,
              social: 0,
              bingo: 0,
              exploration: 0,
            },
          })
        }),
        http.post('*/api/v1/achievements/FIRST_READING/claim', () => {
          return HttpResponse.json({
            success: true,
            achievement_code: 'FIRST_READING',
            rewards: { karma: 5 },
            message: '獎勵已領取！',
            claimed_at: '2025-10-29T10:00:00Z',
          })
        })
      )

      render(<AchievementsPage />)

      // 1. Load page
      await waitFor(() => {
        expect(useAchievementStore.getState().achievements.length).toBe(1)
      })

      // 2. View user progress
      await act(async () => {
        await useAchievementStore.getState().fetchUserProgress()
      })

      await waitFor(() => {
        expect(useAchievementStore.getState().userProgress.length).toBe(1)
      })

      // 3. Claim reward
      await act(async () => {
        await useAchievementStore.getState().claimReward('FIRST_READING')
      })

      await waitFor(() => {
        expect(useAchievementStore.getState().isClaiming).toBe(false)
        expect(useAchievementStore.getState().error).toBeNull()
      })
    })
  })
})
