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
   * 從 URL 提取授權碼並與後端交換會話
   */
  const handleOAuthCallback = useCallback(async (
    code: string
  ): Promise<OAuthCallbackResult> => {
    setState({ loading: true, error: null })

    try {
      // 使用授權碼與 Supabase 交換會話
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || '無法建立會話')
      }

      // 提取使用者資料
      const { user } = sessionData
      if (!user.email) {
        throw new Error('Google 帳號未提供 Email')
      }

      // 呼叫後端 OAuth 回調端點
      // 重構變更：使用正確的後端 API 路徑
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/auth/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 包含 cookies 以接收 httpOnly cookies
        body: JSON.stringify({
          code,
          provider: 'google',
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
  }, [supabase])

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
