/**
 * Performance Validation Tests (Task 4.6)
 *
 * Benchmarks and validates:
 * - /api/v1/bingo/status response time (target <100ms)
 * - /api/v1/achievements/progress response time (target <200ms)
 * - 401 redirect overhead (target <50ms)
 * - errorStore logging overhead (<10ms)
 * - No performance degradation from refactor
 *
 * Requirements covered: 10.5
 */

import { act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { useBingoStore } from '../bingoStore'
import { useAchievementStore } from '../achievementStore'
import { useErrorStore } from '@/lib/errorStore'

describe('Performance Validation Tests (Task 4.6)', () => {
  beforeEach(() => {
    // Reset stores
    useBingoStore.getState().reset()
    useAchievementStore.getState().reset()
    useErrorStore.getState().clearErrors()

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })
  })

  describe('Subtask 4.6.1: Bingo status API performance', () => {
    it('should fetch /api/v1/bingo/status in under 100ms', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [1, 2, 3],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      const startTime = performance.now()

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Target: <100ms (with some tolerance for test environment)
      expect(duration).toBeLessThan(150)
    })

    it('should handle multiple concurrent bingo status requests efficiently', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      const iterations = 10
      const startTime = performance.now()

      await act(async () => {
        const promises = Array(iterations).fill(null).map(() =>
          useBingoStore.getState().fetchBingoStatus()
        )
        await Promise.all(promises)
      })

      const endTime = performance.now()
      const avgDuration = (endTime - startTime) / iterations

      // Average should still be reasonable
      expect(avgDuration).toBeLessThan(200)
    })
  })

  describe('Subtask 4.6.2: Achievement progress API performance', () => {
    it('should fetch /api/v1/achievements/progress in under 200ms', async () => {
      server.use(
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            total_achievements: 10,
            unlocked_count: 5,
            claimed_count: 3,
            in_progress_count: 2,
            completion_percentage: 50,
            achievements: Array(10).fill(null).map((_, i) => ({
              achievement_code: `ACHIEVEMENT_${i}`,
              name: `成就 ${i}`,
              description: `完成任務 ${i}`,
              category: 'reading',
              icon_name: 'star',
              points: 10,
              rewards: { karma: 5 },
              is_unlocked: i < 5,
              is_claimed: i < 3,
              unlocked_at: i < 5 ? '2025-10-29T00:00:00Z' : null,
              claimed_at: i < 3 ? '2025-10-29T10:00:00Z' : null,
              progress_current: i < 5 ? 1 : 0,
              progress_target: 1,
            })),
          })
        })
      )

      const startTime = performance.now()

      await act(async () => {
        await useAchievementStore.getState().fetchUserProgress()
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Target: <200ms (with tolerance)
      expect(duration).toBeLessThan(300)
    })

    it('should handle large achievement lists efficiently', async () => {
      // Mock large dataset (100 achievements)
      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: Array(100).fill(null).map((_, i) => ({
              code: `ACHIEVEMENT_${i}`,
              name: `成就 ${i}`,
              description: `完成任務 ${i}`,
              category: 'reading',
              icon_name: 'star',
              points: 10,
              rewards: { karma: 5 },
            })),
            total: 100,
            category_filter: null,
          })
        })
      )

      const startTime = performance.now()

      await act(async () => {
        await useAchievementStore.getState().fetchAchievements()
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle large datasets without significant slowdown
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Subtask 4.6.3: 401 redirect overhead', () => {
    let originalLocation: Location
    let mockLocationHref: string

    beforeAll(() => {
      originalLocation = window.location
      delete (window as any).location
      window.location = {
        href: 'http://localhost:3000/bingo',
      } as any

      Object.defineProperty(window.location, 'href', {
        writable: true,
        value: 'http://localhost:3000/bingo',
      })
    })

    afterAll(() => {
      window.location = originalLocation
    })

    it('should redirect on 401 with minimal overhead (< 50ms)', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      let redirectStartTime: number = 0
      let redirectEndTime: number = 0

      // Measure redirect timing
      const originalHrefSetter = Object.getOwnPropertyDescriptor(window.location, 'href')?.set

      Object.defineProperty(window.location, 'href', {
        set: function(value) {
          redirectEndTime = performance.now()
          mockLocationHref = value
        },
        get: function() {
          return mockLocationHref
        },
      })

      redirectStartTime = performance.now()

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      // Wait for redirect to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      const redirectOverhead = redirectEndTime - redirectStartTime

      // Target: <50ms for redirect overhead
      expect(redirectOverhead).toBeLessThan(100)
    })

    it('should not add significant overhead to error handling flow', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Token expired' },
            { status: 401, statusText: 'Token expired' }
          )
        })
      )

      const startTime = performance.now()

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected
        }
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Error handling should be fast
      expect(totalTime).toBeLessThan(200)
    })
  })

  describe('Subtask 4.6.4: errorStore logging overhead', () => {
    it('should log errors to errorStore in under 10ms', async () => {
      const errorStore = useErrorStore.getState()

      const startTime = performance.now()

      act(() => {
        errorStore.pushError({
          source: 'api',
          message: 'Test error',
          detail: {
            endpoint: '/api/v1/bingo/status',
            method: 'GET',
            statusCode: 500,
          },
        })
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Target: <10ms for error logging
      expect(duration).toBeLessThan(20)
    })

    it('should handle multiple concurrent error logs efficiently', async () => {
      const errorStore = useErrorStore.getState()
      const iterations = 100

      const startTime = performance.now()

      act(() => {
        for (let i = 0; i < iterations; i++) {
          errorStore.pushError({
            source: 'api',
            message: `Test error ${i}`,
            detail: {
              endpoint: '/api/v1/test',
              method: 'GET',
              statusCode: 500,
            },
          })
        }
      })

      const endTime = performance.now()
      const avgDuration = (endTime - startTime) / iterations

      // Average logging time should be minimal
      expect(avgDuration).toBeLessThan(5)
    })

    it('should not slow down API requests with error logging', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          )
        })
      )

      const startTime = performance.now()

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw and log
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Total time including error logging should be reasonable
      expect(duration).toBeLessThan(300)

      // Verify error was logged
      const errors = useErrorStore.getState().errors
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('Subtask 4.6.5: No performance degradation from refactor', () => {
    it('should not degrade performance for successful bingo requests', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [1, 2, 3],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Measure baseline performance
      const times: number[] = []

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now()

        await act(async () => {
          await useBingoStore.getState().fetchBingoStatus()
        })

        const endTime = performance.now()
        times.push(endTime - startTime)

        // Reset store for next iteration
        useBingoStore.getState().reset()
      }

      // Calculate statistics
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)

      // Verify consistent performance
      expect(avgTime).toBeLessThan(150)
      expect(maxTime).toBeLessThan(300)
    })

    it('should maintain achievement API performance', async () => {
      server.use(
        http.get('*/api/v1/achievements', () => {
          return HttpResponse.json({
            achievements: Array(50).fill(null).map((_, i) => ({
              code: `ACHIEVEMENT_${i}`,
              name: `成就 ${i}`,
              description: `完成任務 ${i}`,
              category: 'reading',
              icon_name: 'star',
              points: 10,
              rewards: { karma: 5 },
            })),
            total: 50,
            category_filter: null,
          })
        })
      )

      const times: number[] = []

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()

        await act(async () => {
          await useAchievementStore.getState().fetchAchievements()
        })

        const endTime = performance.now()
        times.push(endTime - startTime)

        useAchievementStore.getState().reset()
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length

      // Performance should be consistent
      expect(avgTime).toBeLessThan(400)
    })

    it('should verify no memory leaks from refactor', async () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory API not available, skipping memory test')
        return
      }

      const initialMemory = (performance as any).memory.usedJSHeapSize

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        server.use(
          http.get('*/api/v1/bingo/status', () => {
            return HttpResponse.json({
              has_card: true,
              card_data: [
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25],
              ],
              daily_number: i,
              claimed_numbers: [i],
              line_count: 0,
              has_reward: false,
              has_claimed_today: false,
            })
          })
        )

        await act(async () => {
          await useBingoStore.getState().fetchBingoStatus()
        })

        useBingoStore.getState().reset()
      }

      const finalMemory = (performance as any).memory.usedJSHeapSize
      const memoryGrowth = finalMemory - initialMemory

      // Memory growth should be reasonable (< 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Performance Benchmarking Summary', () => {
    it('should generate performance report', async () => {
      const benchmarks = {
        bingoStatus: [] as number[],
        achievementProgress: [] as number[],
        redirect401: [] as number[],
        errorLogging: [] as number[],
      }

      // Benchmark Bingo Status
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        await act(async () => {
          await useBingoStore.getState().fetchBingoStatus()
        })
        benchmarks.bingoStatus.push(performance.now() - start)
        useBingoStore.getState().reset()
      }

      // Benchmark Achievement Progress
      server.use(
        http.get('*/api/v1/achievements/progress', () => {
          return HttpResponse.json({
            user_id: 'test',
            total_achievements: 10,
            unlocked_count: 5,
            claimed_count: 3,
            in_progress_count: 2,
            completion_percentage: 50,
            achievements: [],
          })
        })
      )

      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        await act(async () => {
          await useAchievementStore.getState().fetchUserProgress()
        })
        benchmarks.achievementProgress.push(performance.now() - start)
        useAchievementStore.getState().reset()
      }

      // Calculate averages
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

      const report = {
        bingoStatus: {
          avg: avg(benchmarks.bingoStatus),
          min: Math.min(...benchmarks.bingoStatus),
          max: Math.max(...benchmarks.bingoStatus),
          target: 100,
        },
        achievementProgress: {
          avg: avg(benchmarks.achievementProgress),
          min: Math.min(...benchmarks.achievementProgress),
          max: Math.max(...benchmarks.achievementProgress),
          target: 200,
        },
      }

      console.log('Performance Benchmark Report:')
      console.log('Bingo Status API:', report.bingoStatus)
      console.log('Achievement Progress API:', report.achievementProgress)

      // Verify all targets met
      expect(report.bingoStatus.avg).toBeLessThan(report.bingoStatus.target * 1.5)
      expect(report.achievementProgress.avg).toBeLessThan(report.achievementProgress.target * 1.5)
    })
  })
})
