/**
 * OAuth Callback Page
 * 處理 Google OAuth 授權回調
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
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

  useEffect(() => {
    const code = searchParams?.get('code')
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

    // 處理 OAuth 回調
    handleOAuthCallback(code)
      .then(result => {
        if (result.success && result.user) {
          // 更新 auth store
          // 重構變更：不再傳遞 token，後端已設定 httpOnly cookies
          setOAuthUser({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            isOAuthUser: true,
            oauthProvider: result.user.oauth_provider,
            profilePicture: result.user.profile_picture_url,
          })

          setStatus('success')

          // 延遲重導向
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
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
        <div className="bg-vault-dark border-2 border-pip-boy-green rounded-none p-8 shadow-lg shadow-pip-boy-green/20">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-pip-boy-green font-mono text-xl mb-2">
                正在完成登入...
              </h2>
              <p className="text-pip-boy-green/70 font-mono text-sm">
                請稍候，正在驗證您的 Google 帳號
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-pip-boy-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-vault-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-pip-boy-green font-mono text-xl mb-2">
                登入成功！
              </h2>
              <p className="text-pip-boy-green/70 font-mono text-sm">
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
              <h2 className="text-red-400 font-mono text-xl mb-2">
                登入失敗
              </h2>
              <p className="text-red-400/70 font-mono text-sm mb-6">
                {errorMessage}
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-2 bg-pip-boy-green text-vault-dark font-mono font-bold text-sm hover:bg-pip-boy-green/80 transition-colors"
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
