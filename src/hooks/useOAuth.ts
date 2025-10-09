/**
 * useOAuth Hook - Google OAuth 流程管理
 * 封裝 Supabase OAuth 認證流程
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

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

  const supabase = createClient()

  /**
   * 啟動 Google OAuth 登入流程
   */
  const signInWithGoogle = useCallback(async () => {
    setState({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

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
  }, [supabase])

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
    code: string
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/auth/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 包含 cookies 以接收 httpOnly cookies
        body: JSON.stringify({
          code,
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
