/**
 * AuthPageClient Component
 * 客戶端認證頁面，使用 Tabs 切換登入/註冊
 */

'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PipBoyTabs, PipBoyTabsList, PipBoyTabsTrigger, PipBoyTabsContent } from '@/components/ui/pipboy-tabs'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function AuthPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // 從 URL 參數讀取初始 tab (預設為 login)
  const initialTab = searchParams.get('tab') || 'login'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab as 'login' | 'register')

  // 當 tab 改變時更新 URL
  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    // 更新 URL 但不重新載入頁面
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Vault-Tec Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-pip-boy-green mb-2">
            VAULT-TEC
          </h1>
          <p className="text-pip-boy-green text-lg">
            Pip-Boy 身份驗證終端機
          </p>
          <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
        </div>

        {/* Tabs Container */}
        <PipBoyTabs defaultValue={initialTab}>
          {/* Tab Headers */}
          <PipBoyTabsList>
            <PipBoyTabsTrigger value="login" icon="user">
              存取終端機
            </PipBoyTabsTrigger>
            <PipBoyTabsTrigger value="register" icon="user-add">
              註冊新用戶
            </PipBoyTabsTrigger>
          </PipBoyTabsList>

          {/* Login Tab Content */}
          <PipBoyTabsContent value="login">
            <LoginForm hideHeader />
          </PipBoyTabsContent>

          {/* Register Tab Content */}
          <PipBoyTabsContent value="register">
            <RegisterForm hideHeader />
          </PipBoyTabsContent>
        </PipBoyTabs>

        {/* Terminal Footer */}
        <div className="mt-8 text-center">
          <p className="text-pip-boy-green/50 text-xs">
            Vault-Tec：在地下建造更美好的明天™
          </p>
          <p className="text-pip-boy-green/30 text-xs mt-2">
            「戰爭，戰爭從未改變。」
          </p>
        </div>
      </div>
    </div>
  )
}
