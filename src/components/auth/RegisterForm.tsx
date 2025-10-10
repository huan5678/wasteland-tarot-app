/**
 * RegisterForm Component - Vault-Tec 新使用者註冊
 * 支援 email + password + name 和 Google OAuth 註冊
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { useOAuth } from '@/hooks/useOAuth'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
}

interface RegisterFormProps {
  hideHeader?: boolean
}

export function RegisterForm({ hideHeader = false }: RegisterFormProps) {
  const router = useRouter()
  const { signInWithGoogle, loading: oauthLoading, error: oauthError } = useOAuth()

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email 驗證
    if (!formData.email) {
      newErrors.email = 'Email 為必填'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '無效的 Email 格式'
    }

    // Name 驗證
    if (!formData.name) {
      newErrors.name = '名稱為必填'
    } else if (formData.name.length < 1 || formData.name.length > 50) {
      newErrors.name = '名稱長度需在 1-50 字元之間'
    }

    // Password 驗證
    if (!formData.password) {
      newErrors.password = '密碼為必填'
    } else if (formData.password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元'
    }

    // Confirm Password 驗證
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

    // Clear field error when user starts typing
    if (errors[field]) {
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
      // 使用 API 服務層呼叫註冊端點
      // authAPI.register 會自動處理 httpOnly cookies
      const data = await authAPI.register({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        name: formData.name,
      })

      // 註冊成功後自動登入（後端會設定 httpOnly cookies）
      toast.success('註冊成功', { description: `歡迎加入，${formData.name}!` })
      router.push('/dashboard')
    } catch (err: any) {
      // 處理各種錯誤情況
      let errorMessage = '註冊失敗'

      if (err.status === 409) {
        // Email 已存在
        setErrors({ email: 'Email 已被註冊' })
        errorMessage = 'Email 已被註冊，請使用其他 Email 或嘗試登入'
      } else if (err.status === 422) {
        // 驗證錯誤
        errorMessage = err.message || '輸入資料格式錯誤'
      } else if (err.message) {
        errorMessage = err.message
      }

      setSubmitError(errorMessage)
      toast.error('註冊失敗', { description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        toast.info('正在跳轉至 Google 註冊...')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google 註冊失敗'
      toast.error('Google 註冊失敗', { description: errorMessage })
    }
  }

  const isFormDisabled = isSubmitting || oauthLoading

  return (
    <div className={hideHeader ? '' : 'min-h-screen flex items-center justify-center px-4 py-8'}>
      <div className={hideHeader ? 'w-full' : 'max-w-md w-full'}>
        {/* Vault-Tec Header */}
        {!hideHeader && (
          <div className="text-center mb-8">
            <h1 className="text-4xl text-pip-boy-green mb-2">
              VAULT-TEC
            </h1>
            <p className="text-pip-boy-green text-lg">
              新 Vault Dweller 註冊終端機
            </p>
            <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
          </div>
        )}

        {/* Register Form */}
        <form
          className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20"
          onSubmit={handleSubmit}
        >
          {/* Error Display */}
          {submitError && (
            <div className="mb-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />{submitError}
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

          {/* Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-pip-boy-green text-sm mb-2"
            >
              名稱
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              placeholder="輸入你的名稱..."
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isFormDisabled}
            />
            {errors.name && (
              <p className="mt-1 text-red-400 text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />{errors.name}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-pip-boy-green text-sm mb-2"
            >
              密碼
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              placeholder="至少 8 個字元..."
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={isFormDisabled}
            />
            {errors.password && (
              <p className="mt-1 text-red-400 text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />{errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-pip-boy-green text-sm mb-2"
            >
              確認密碼
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              placeholder="再次輸入密碼..."
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              disabled={isFormDisabled}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-red-400 text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />{errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green hover:text-black focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? '註冊中...' : '加入 Vault-Tec'}
          </button>

          {/* Divider */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
            <span className="px-4 text-pip-boy-green/70 text-xs">或</span>
            <div className="flex-1 h-px bg-pip-boy-green/30"></div>
          </div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isFormDisabled}
            className="w-full py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-bold text-sm hover:bg-pip-boy-green/10 focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {oauthLoading ? '連接 Google...' : '使用 Google 註冊'}
          </button>

          {/* OAuth Error Display */}
          {oauthError && (
            <div className="mt-4 p-3 border border-red-400 bg-red-900/20 text-red-400 text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />{oauthError}
            </div>
          )}

          {/* Links */}
          {!hideHeader && (
            <div className="mt-6 text-center">
              <Link
                href="/auth?tab=login"
                className="text-pip-boy-green text-sm hover:text-pip-boy-green/80 transition-colors"
              >
                已經有帳號？返回登入
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
