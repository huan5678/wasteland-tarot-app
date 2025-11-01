/**
 * OAuth Callback Page
 * 處理 Google OAuth 授權回調
 */

'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOAuth } from '@/hooks/useOAuth'
import { useAuthStore } from '@/lib/authStore'
import Link from 'next/link'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleOAuthCallback } = useOAuth()
  const setOAuthUser = useAuthStore(s => s.setOAuthUser)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const hasProcessedRef = useRef(false) // 防止重複處理（React StrictMode）

  useEffect(() => {
    // 防止 React StrictMode 重複執行
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    const code = searchParams?.get('code')
    const state = searchParams?.get('state')
    const error = searchParams?.get('error')

    if (error) {
      setStatus('error')
      setErrorMessage('登入已取消或發生錯誤')
      return
    }

    if (!code) {
      setStatus('error')
      setErrorMessage('缺少授權碼')
      return
    }

    // 處理 OAuth 回調（傳遞 code 和 state）
    handleOAuthCallback(code, state)
      .then(result => {
        // 調試日誌：檢查 OAuth callback 結果
        console.log('🔍 [Callback] OAuth result:', {
          success: result.success,
          has_tokenExpiresAt: !!result.tokenExpiresAt,
          tokenExpiresAt: result.tokenExpiresAt,
          user: result.user?.email
        })

        if (result.success && result.user) {
          // 額外檢查：警告如果 tokenExpiresAt 缺失
          if (!result.tokenExpiresAt) {
            console.error('❌ [Callback] Missing tokenExpiresAt in result!')
          }
          // 更新 auth store
          // 重構變更：傳遞完整的 user 資料和 token_expires_at 以儲存登入狀態
          setOAuthUser({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,  // User model 只有 name，沒有 username
            isOAuthUser: true,
            oauthProvider: result.user.oauth_provider,
            profilePicture: result.user.profile_picture_url,  // Google OAuth 頭像
            avatar_url: result.user.avatar_url,  // 使用者上傳的頭像（優先）
            created_at: result.user.created_at,  // 註冊時間（用於計算服務天數）
            total_readings: result.user.total_readings,
            karma_score: result.user.karma_score,
            experience_level: result.user.experience_level,
            faction_alignment: result.user.faction_alignment,
            favorite_card_suit: result.user.favorite_card_suit,
          }, result.tokenExpiresAt) // 傳遞 token 過期時間

          console.log('✅ [Callback] Auth store updated, waiting for persist...')

          setStatus('success')

          // 延遲重導向，確保 Zustand persist middleware 完成寫入
          // 增加延遲至 2 秒，給 localStorage 足夠時間持久化
          setTimeout(() => {
            console.log('🔄 [Callback] Redirecting to dashboard with fresh state')
            // 使用 router.replace 而非 push，避免返回時回到 callback 頁面
            router.replace('/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setErrorMessage(result.error || 'OAuth 回調處理失敗')
        }
      })
      .catch(err => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'OAuth 回調處理失敗')
      })
  }, [searchParams, handleOAuthCallback, setOAuthUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-8 shadow-lg shadow-pip-boy-green/20">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-pip-boy-green text-xl mb-2">
                正在完成登入...
              </h2>
              <p className="text-pip-boy-green/70 text-sm">
                請稍候，正在驗證您的 Google 帳號
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-pip-boy-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-wasteland-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-pip-boy-green text-xl mb-2">
                登入成功！
              </h2>
              <p className="text-pip-boy-green/70 text-sm">
                正在跳轉至控制台...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-red-400 text-xl mb-2">
                登入失敗
              </h2>
              <p className="text-red-400/70 text-sm mb-6">
                {errorMessage}
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-2 bg-pip-boy-green text-wasteland-dark font-bold text-sm hover:bg-pip-boy-green/80 transition-colors"
              >
                返回登入
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
