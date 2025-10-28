/**
 * useOAuth Hook - Google OAuth 流程管理
 * 重構後：完全透過後端 API 處理，不直接依賴 Supabase SDK
 */

import { useState, useCallback } from 'react'

interface OAuthState {
  loading: boolean
  error: string | null
}

interface OAuthCallbackResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    oauth_provider: string
    profile_picture_url?: string
  }
  error?: string
}

export function useOAuth() {
  const [state, setState] = useState<OAuthState>({
    loading: false,
    error: null,
  })

  /**
   * 啟動 Google OAuth 登入流程
   * 重構後：呼叫後端 API 取得 OAuth URL，然後重導向
   */
  const signInWithGoogle = useCallback(async () => {
    setState({ loading: true, error: null })

    try {
      // 呼叫後端 API 取得 Google OAuth URL
      // 使用 Next.js API proxy (空字串表示使用相對路徑，會經過 /api/v1/[...path] proxy)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const apiPath = API_BASE_URL ? `${API_BASE_URL}/api/v1/auth/oauth/google/login` : '/api/v1/auth/oauth/google/login'
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          redirect_url: `${window.location.origin}/auth/callback`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || '無法啟動 Google 登入')
      }

      const data = await response.json()

      // 重導向到 Google OAuth 頁面
      window.location.href = data.authorization_url

      // OAuth 流程會自動重導向，無需手動處理
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google 登入失敗'
      setState({ loading: false, error: errorMessage })

      // Play error sound
      if (typeof window !== 'undefined') {
        ;(window as any).WastelandTarot?.PipBoyInterface?.playSound('error-beep')
      }

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * 處理 OAuth 回調
   * 直接將授權碼傳遞給後端，由後端負責交換 session
   *
   * 重構變更：
   * - 移除前端 Supabase session 交換（避免重複交換）
   * - 直接將授權碼傳給後端
   * - 後端負責交換 session、建立使用者、設定 cookies
   */
  const handleOAuthCallback = useCallback(async (
    code: string, state?: string | null
  ): Promise<OAuthCallbackResult> => {
    setState({ loading: true, error: null })

    try {
      // 直接呼叫後端 OAuth 回調端點，傳遞授權碼
      // 後端會負責：
      // 1. 使用 Supabase SDK 交換授權碼取得 session
      // 2. 從 session 提取使用者資料
      // 3. 建立或更新資料庫使用者記錄
      // 4. 生成 JWT tokens 並設定 httpOnly cookies
      // 5. 返回使用者資料
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const apiPath = API_BASE_URL ? `${API_BASE_URL}/api/v1/auth/oauth/callback` : '/api/v1/auth/oauth/callback'
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 包含 cookies 以接收 httpOnly cookies
        body: JSON.stringify({
          code, state: state || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || '後端認證失敗')
      }

      const data = await response.json()

      setState({ loading: false, error: null })

      // Play success sound
      if (typeof window !== 'undefined') {
        ;(window as any).WastelandTarot?.PipBoyInterface?.playSound('login-success')
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          oauth_provider: data.user.oauth_provider,
          profile_picture_url: data.user.profile_picture_url,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth 回調處理失敗'
      setState({ loading: false, error: errorMessage })

      // Play error sound
      if (typeof window !== 'undefined') {
        ;(window as any).WastelandTarot?.PipBoyInterface?.playSound('error-beep')
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * 清除錯誤訊息
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    signInWithGoogle,
    handleOAuthCallback,
    clearError,
  }
}
