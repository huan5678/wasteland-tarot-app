/**
 * LoginForm Component - Pip-Boy Authentication Interface
 * Fallout-themed login form with Vault-Tec branding
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Fingerprint } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'
import { useErrorStore } from '@/lib/errorStore'
import { useOAuth } from '@/hooks/useOAuth'
import { usePasskey } from '@/hooks/usePasskey'
import { toast } from 'sonner'

interface FormData {
  email: string // 改用 email
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string // 改用 email
  password?: string
}

interface LoginFormProps {
  hideHeader?: boolean
}

export function LoginForm({ hideHeader = false }: LoginFormProps) {
  const router = useRouter()
  const pushError = useErrorStore(s => s.pushError)

  const login = useAuthStore(s => s.login)
  const { signInWithGoogle, loading: oauthLoading, error: oauthError } = useOAuth()
  const {
    authenticateWithPasskey,
    isLoading: passkeyLoading,
    error: passkeyError,
    isSupported: passkeySupported,
    clearError: clearPasskeyError,
  } = usePasskey()

  const [formData, setFormData] = useState<FormData>({
    email: '', // 改用 email
    password: '',
    rememberMe: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const loading = false

  // Load remembered email from localStorage
  useEffect(() => {
    const remembered = localStorage.getItem('pip-boy-remember')
    if (remembered) {
      try {
        const { email } = JSON.parse(remembered)
        setFormData(prev => ({
          ...prev,
          email,
          rememberMe: true
        }))
      } catch {
        localStorage.removeItem('pip-boy-remember')
      }
    }
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email 驗證
    if (!formData.email) {
      newErrors.email = 'Email 為必填'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '無效的 Email 格式'
    }

    if (!formData.password) {
      newErrors.password = '存取密碼為必填'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Use centralized API service (now uses email)
      await login(formData.email, formData.password)

      // Handle remember me
      if (formData.rememberMe) {
        localStorage.setItem('pip-boy-remember', JSON.stringify({
          email: formData.email
        }))
      } else {
        localStorage.removeItem('pip-boy-remember')
      }

      // Success - show toast and redirect
      toast.success('登入成功', { description: '歡迎回來!' })
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登入失敗'

      // 處理 OAuth 使用者嘗試密碼登入錯誤
      if (errorMessage.includes('OAuth') || errorMessage.includes('Google')) {
        setSubmitError('此帳號使用 Google 登入，請點擊下方「使用 Google 登入」按鈕')
      } else {
        setSubmitError(errorMessage)
      }

      pushError({
        source: 'auth',
        message: '登入失敗',
        detail: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Google 登入處理
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        // OAuth 流程會自動重導向到 /auth/callback
        toast.info('正在跳轉至 Google 登入...')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google 登入失敗'
      pushError({
        source: 'auth',
        message: 'Google 登入失敗',
        detail: errorMessage
      })
    }
  }

  // Passkey 登入處理
  const handlePasskeyLogin = async () => {
    clearPasskeyError()
    try {
      // Email-guided Passkey 登入（如果有輸入 email）
      await authenticateWithPasskey(formData.email || undefined)
      toast.success('Passkey 登入成功！')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Passkey 登入失敗'
      pushError({
        source: 'auth',
        message: 'Passkey 登入失敗',
        detail: errorMessage
      })
    }
  }

  const isFormDisabled = loading || isSubmitting || passkeyLoading

  return (
    <div className={hideHeader ? '' : 'min-h-screen flex items-center justify-center px-4'}>
      <div className={hideHeader ? 'w-full' : 'max-w-md w-full'}>
        {/* Vault-Tec Header */}
        {!hideHeader && (
          <div className="text-center mb-8">
            <h1 className="text-4xl text-pip-boy-green mb-2">
              VAULT-TEC
            </h1>
            <p className="text-pip-boy-green text-lg">
              Pip-Boy 身份驗證終端機
            </p>
            <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
          </div>
        )}

        {/* Login Form */}
        <form
          role="form"
          className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20"
          onSubmit={handleSubmit}
        >
          {/* Error Display */}
          {submitError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-sm flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />{submitError}
            </div>
          )}

          {/* Loading State */}
          {isFormDisabled && (
            <div className="mb-4 p-3 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green text-sm">
              <div className="flex items-center gap-2">
                <div
                  data-testid="pip-boy-loading-spinner"
                  className="w-4 h-4 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin"
                />
                身份驗證中...
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-pip-boy-green text-sm mb-2"
            >
              Email 信箱
            </label>
            <input
              id="email"
              type="email"
              aria-required="true"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              placeholder="輸入你的 Email..."
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={isFormDisabled}
            />
            {errors.email && (
              <p className="mt-1 text-red-400 text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />{errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-pip-boy-green text-sm mb-2"
            >
              存取密碼
            </label>
            <input
              id="password"
              type="password"
              aria-required="true"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              placeholder="輸入存取密碼..."
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={isFormDisabled}
            />
            {errors.password && (
              <p className="mt-1 text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />{errors.password}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="mb-6">
            <label className="flex items-center text-pip-boy-green text-sm">
              <input
                type="checkbox"
                className="mr-2 accent-pip-boy-green"
                checked={formData.rememberMe}
                onChange={handleInputChange('rememberMe')}
                disabled={isFormDisabled}
              />
              在此終端機記住我
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green hover:text-black focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isFormDisabled ? '身份驗證中...' : '初始化 Pip-Boy'}
          </button>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
            <span className="px-4 text-pip-boy-green/70 text-xs">或</span>
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading || isFormDisabled}
            className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green/10 focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-wasteland-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {oauthLoading ? '連接 Google...' : '使用 Google 登入'}
          </button>

          {/* OAuth Error Display */}
          {oauthError && (
            <div className="mt-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />{oauthError}
            </div>
          )}

          {/* Passkey Login Button */}
          {passkeySupported && (
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading || isFormDisabled}
              className="w-full mt-4 py-3 bg-black border-2 border-amber-500 text-amber-500 font-bold text-sm hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-wasteland-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-5 h-5" />
              {passkeyLoading ? '生物辨識驗證中...' : '使用 Passkey 登入'}
            </button>
          )}

          {/* Passkey Error Display */}
          {passkeyError && (
            <div className="mt-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />{passkeyError}
            </div>
          )}

          {/* Passkey Info */}
          {passkeySupported && (
            <div className="mt-4 p-3 border border-amber-500/30 bg-amber-500/5 text-amber-500/80 text-xs">
              💡 提示：使用 Passkey 可免密碼登入（Touch ID、Face ID、Windows Hello）
            </div>
          )}

          {/* Links */}
          {!hideHeader && (
            <div className="mt-6 text-center space-y-2">
              <div className="text-pip-boy-green/70 text-xs">
                忘記存取密碼？（即將推出）
              </div>
              <Link
                href="/auth?tab=register"
                className="block text-pip-boy-green text-sm hover:text-pip-boy-green/80 transition-colors"
              >
                加入 Vault-Tec - 註冊新 Vault Dweller
              </Link>
            </div>
          )}
        </form>

        {/* Terminal Footer */}
        {!hideHeader && (
          <div className="mt-8 text-center">
            <p className="text-pip-boy-green/50 text-xs">
              Vault-Tec：在地下建造更美好的明天
            </p>
          </div>
        )}
      </div>
    </div>
  )
}