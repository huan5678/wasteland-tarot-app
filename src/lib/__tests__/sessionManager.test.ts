/**
 * Session Manager 測試
 */

import { describe, it, expect, beforeEach, jest } from 'bun:test'

describe('Session Manager Structure', () => {
  it('should export required functions', async () => {
    const sessionManager = await import('../sessionManager')

    expect(typeof sessionManager.refreshSession).toBe('function')
    expect(typeof sessionManager.validateSession).toBe('function')
    expect(typeof sessionManager.setupAutoRefresh).toBe('function')
    expect(typeof sessionManager.setupAuthListener).toBe('function')
    expect(typeof sessionManager.initializeSessionManager).toBe('function')
  })

  it('should have correct function signatures', async () => {
    const { refreshSession, validateSession } = await import('../sessionManager')

    // 驗證返回 Promise
    expect(refreshSession()).toBeInstanceOf(Promise)
    expect(validateSession()).toBeInstanceOf(Promise)
  })
})

describe('Session Status Interface', () => {
  it('should define correct session status structure', () => {
    const mockStatus = {
      isValid: true,
      expiresAt: Date.now() + 3600000,
      needsRefresh: false,
    }

    expect(mockStatus.isValid).toBe(true)
    expect(typeof mockStatus.expiresAt).toBe('number')
    expect(mockStatus.needsRefresh).toBe(false)
  })
})
