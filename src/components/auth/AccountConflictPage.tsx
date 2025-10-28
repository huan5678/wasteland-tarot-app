/**
 * AccountConflictPage Component - Account Conflict Resolution Page
 * Guides users to link OAuth when email conflicts with existing account (Task 7.2, 7.3)
 * Requirements: 8.5
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PixelIcon } from '@/components/ui/icons'
import { useAuthStore } from '@/lib/authStore'
import { toast } from 'sonner'
import { trackConflictResolutionAbandoned } from '@/lib/analytics/authEventTracker'

export interface AccountConflictPageProps {
  email: string
  existingAuthMethods: string[] // ["password", "passkey", "oauth_facebook"]
  oauthProvider: string // "google"
  oauthId: string
  profilePicture?: string
}

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export function AccountConflictPage({
  email,
  existingAuthMethods,
  oauthProvider,
  oauthId,
  profilePicture,
}: AccountConflictPageProps) {
  const router = useRouter()
  const { setUser, refreshAuthMethods } = useAuthStore()

  // Form state
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  // Check if account is locked
  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  // Determine primary existing auth method
  const hasPassword = existingAuthMethods.includes('password')
  const hasPasskey = existingAuthMethods.includes('passkey')
  const hasOtherOAuth = existingAuthMethods.some((method) =>
    method.startsWith('oauth_')
  )

  // Get OAuth provider display name
  const getProviderDisplayName = (provider: string): string => {
    const providerMap: Record<string, string> = {
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
    }
    return providerMap[provider.toLowerCase()] || provider
  }

  // Get auth method icon name
  const getAuthMethodIcon = (method: string): string => {
    if (method === 'password') return 'key'
    if (method === 'passkey') return 'fingerprint'
    if (method.startsWith('oauth_')) return 'user'
    return 'shield'
  }

  // Handle password login and link OAuth
  const handlePasswordLoginAndLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLocked) {
      const remainingTime = Math.ceil((lockedUntil! - Date.now()) / 1000 / 60)
      setError(`帳號已鎖定，請 ${remainingTime} 分鐘後再試`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call backend API to login with password and link OAuth
      const response = await fetch('/api/v1/auth/login?link_oauth=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          link_oauth: true,
          oauth_provider: oauthProvider,
          oauth_id: oauthId,
          profile_picture: profilePicture,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '登入失敗')
      }

      const data = await response.json()

      // Update auth store
      setUser(data.user, data.expires_at, 'oauth')
      await refreshAuthMethods()

      // Show success message
      toast.success('Google 帳號已連結！', {
        description: '您現在可以使用 Google 或密碼登入',
      })

      // Wait a bit and redirect to dashboard
      await new Promise((resolve) => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登入失敗'
      setError(errorMessage)

      // Increment login attempts
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)

      // Lock account after 5 failed attempts
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS
        setLockedUntil(lockUntil)
        setError(
          `連續失敗 ${MAX_LOGIN_ATTEMPTS} 次，帳號已鎖定 15 分鐘。請使用忘記密碼功能或聯繫支援。`
        )
      }

      toast.error('登入失敗', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Passkey login and link OAuth (Task 7.3)
  const handlePasskeyLoginAndLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: 取得 Passkey 驗證選項
      const optionsResponse = await fetch('/api/v1/auth/passkey/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      })

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || '取得驗證選項失敗')
      }

      const passkeyOptions = await optionsResponse.json()

      // Step 2: 觸發瀏覽器 WebAuthn
      const { startAuthentication } = await import('@/lib/webauthn')
      const assertion = await startAuthentication(passkeyOptions)

      // Step 3: 呼叫 login-and-link API
      const loginResponse = await fetch('/api/v1/auth/passkey/login-and-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assertion_response: assertion,
          link_oauth: true,
          oauth_provider: oauthProvider,
          oauth_id: oauthId,
          profile_picture: profilePicture
        })
      })

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json()
        throw new Error(errorData.error || '登入失敗')
      }

      const data = await loginResponse.json()

      // Step 4: 更新 authStore
      setUser(data.user, data.expires_at, 'passkey')
      await refreshAuthMethods()

      // Step 5: 顯示成功訊息
      toast.success('Google 帳號已連結！', {
        description: '您現在可以使用 Google 或 Passkey 登入'
      })

      // Step 6: 導向 dashboard
      await new Promise((resolve) => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Passkey 登入失敗'
      setError(errorMessage)
      toast.error('Passkey 登入失敗', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle other OAuth login
  const handleOtherOAuthLogin = async (provider: string) => {
    toast.info(`${getProviderDisplayName(provider)} 登入功能即將推出`)
  }

  // Handle back to login
  const handleBackToLogin = () => {
    // 追蹤事件：使用者放棄解決衝突
    trackConflictResolutionAbandoned(existingAuthMethods).catch(console.warn)

    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="max-w-md w-full">
        {/* Vault-Tec Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-pip-boy-green mb-2">VAULT-TEC</h1>
          <p className="text-pip-boy-green text-lg">帳號整合終端機</p>
          <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
        </div>

        {/* Main Content Card */}
        <div className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20">
          {/* Conflict Message */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PixelIcon
                name="alert-circle"
                sizePreset="md"
                variant="warning"
                animation="pulse"
                aria-label="警告"
              />
              <h2 className="text-2xl text-pip-boy-green">此 Email 已註冊</h2>
            </div>

            <p className="text-pip-boy-green/80 text-sm mb-4">
              您的 {getProviderDisplayName(oauthProvider)} 帳號（
              <span className="text-pip-boy-green font-bold">{email}</span>
              ）已經在系統中註冊過，目前使用以下方式登入：
            </p>

            {/* Existing Auth Methods Display */}
            <div className="flex flex-wrap gap-2 mb-4">
              {existingAuthMethods.map((method) => (
                <div
                  key={method}
                  className="flex items-center gap-2 px-3 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green text-sm"
                >
                  <PixelIcon
                    name={getAuthMethodIcon(method)}
                    sizePreset="xs"
                    variant="primary"
                    decorative
                  />
                  <span>
                    {method === 'password'
                      ? 'Email/密碼'
                      : method === 'passkey'
                      ? 'Passkey 生物辨識'
                      : getProviderDisplayName(method.replace('oauth_', ''))}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-pip-boy-green/70 text-xs">
              請使用現有方式登入以連結您的{' '}
              {getProviderDisplayName(oauthProvider)} 帳號
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-sm flex items-center"
            >
              <PixelIcon
                name="alert-triangle"
                sizePreset="xs"
                variant="error"
                animation="wiggle"
                className="mr-2"
                aria-label="錯誤"
              />
              {error}
            </div>
          )}

          {/* Password Login Form */}
          {hasPassword && (
            <form onSubmit={handlePasswordLoginAndLink} className="mb-6">
              <h3 className="text-pip-boy-green text-lg mb-4 flex items-center gap-2">
                <PixelIcon name="key" sizePreset="sm" variant="primary" decorative />
                使用密碼登入並連結
              </h3>

              {/* Email Field (Pre-filled and Disabled) */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-pip-boy-green text-sm mb-2">
                  Email 信箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-black border border-pip-boy-green/50 text-pip-boy-green/50 cursor-not-allowed"
                />
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-pip-boy-green text-sm mb-2">
                  密碼
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-required="true"
                  className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
                  placeholder="輸入您的密碼..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isLocked}
                />
              </div>

              {/* Forgot Password Link */}
              <div className="mb-4 text-right">
                <a
                  href="#"
                  className="text-pip-boy-green/70 text-xs hover:text-pip-boy-green transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    toast.info('忘記密碼功能即將推出')
                  }}
                >
                  忘記密碼？
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isLocked || !password}
                className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green hover:text-black focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <PixelIcon
                      name="loader"
                      sizePreset="xs"
                      variant="primary"
                      animation="spin"
                      decorative
                    />
                    驗證中...
                  </span>
                ) : (
                  '使用密碼登入並連結 Google 帳號'
                )}
              </button>
            </form>
          )}

          {/* Passkey Login Button */}
          {hasPasskey && (
            <div className="mb-6">
              <h3 className="text-pip-boy-green text-lg mb-4 flex items-center gap-2">
                <PixelIcon
                  name="fingerprint"
                  sizePreset="sm"
                  variant="primary"
                  decorative
                />
                使用 Passkey 登入並連結
              </h3>

              <button
                type="button"
                onClick={handlePasskeyLoginAndLink}
                disabled={isLoading}
                className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green hover:text-black focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <PixelIcon name="fingerprint" sizePreset="sm" decorative />
                使用生物辨識登入
              </button>
            </div>
          )}

          {/* Other OAuth Login Button */}
          {hasOtherOAuth &&
            existingAuthMethods
              .filter((method) => method.startsWith('oauth_'))
              .map((method) => {
                const provider = method.replace('oauth_', '')
                return (
                  <div key={method} className="mb-6">
                    <h3 className="text-pip-boy-green text-lg mb-4 flex items-center gap-2">
                      <PixelIcon name="user" sizePreset="sm" variant="primary" decorative />
                      使用 {getProviderDisplayName(provider)} 登入並連結
                    </h3>

                    <button
                      type="button"
                      onClick={() => handleOtherOAuthLogin(provider)}
                      disabled={isLoading}
                      className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green hover:text-black focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      使用 {getProviderDisplayName(provider)} 登入
                    </button>
                  </div>
                )
              })}

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
            <span className="px-4 text-pip-boy-green/70 text-xs">或</span>
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
          </div>

          {/* Back to Login Button */}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full py-3 bg-black border-2 border-pip-boy-green/50 text-pip-boy-green/70 font-bold text-sm hover:border-pip-boy-green hover:text-pip-boy-green focus:outline-none focus:ring-2 focus:ring-pip-boy-green transition-all duration-200"
          >
            返回登入頁面
          </button>
        </div>

        {/* Terminal Footer */}
        <div className="mt-8 text-center">
          <p className="text-pip-boy-green/50 text-xs">
            Vault-Tec：在地下建造更美好的明天
          </p>
        </div>
      </div>
    </div>
  )
}
