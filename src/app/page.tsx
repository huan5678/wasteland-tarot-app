'use client'

import React from 'react'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import { DynamicHeroTitle, DynamicHeroTitleErrorBoundary } from '@/components/hero'
import { PipBoyButton, PipBoyCard, PipBoyCardHeader, PipBoyCardTitle, PipBoyCardContent } from '@/components/ui/pipboy'

export default function HomePage() {
  const user = useAuthStore(s => s.user)

  const handleGetStarted = () => {
    if (user) {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/auth/login'
    }
  }

  const handleQuickReading = () => {
    if (user) {
      window.location.href = '/readings/new'
    } else {
      // 未登入用戶導向快速占卜頁面，不需要註冊
      window.location.href = '/readings/quick'
    }
  }

  return (
    <div className="min-h-screen text-pip-boy-green">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Terminal Header */}
          <div className="text-center mb-12">
            <div className="border-2 border-pip-boy-green p-4 inline-block mb-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
              <div className="flex items-center gap-2 sm:gap-4 text-xs">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                {/* 手機版：簡化顯示 */}
                <span className="hidden md:inline">VAULT-TEC PIP-BOY 3000 MARK IV</span>
                <span className="hidden sm:inline md:hidden">PIP-BOY 3000 MARK IV</span>
                <span className="inline sm:hidden">PIP-BOY 3000</span>
                <span className="hidden sm:inline text-pip-boy-green/50">|</span>
                <span className="hidden sm:inline">占卜終端機啟動中</span>
                <span className="hidden md:inline text-pip-boy-green/50">|</span>
                <span className="hidden md:inline">狀態：線上</span>
              </div>
            </div>

            {/* 動態標題元件 */}
            <DynamicHeroTitleErrorBoundary>
              <DynamicHeroTitle />
            </DynamicHeroTitleErrorBoundary>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <PipBoyCard
              variant="interactive"
              isClickable
              onClick={handleGetStarted}
              className="group p-8 hover:scale-105"
            >
              <div className="text-center">
                <PixelIcon name="target" size={48} className="mb-4 mx-auto group-hover:animate-pulse text-pip-boy-green" aria-label={user ? '進入控制台' : '進入 Vault'} />
                <h3 className="text-xl font-bold text-pip-boy-green mb-2">
                  {user ? '進入控制台' : '進入 Vault'}
                </h3>
                <p className="text-pip-boy-green/60 text-sm">
                  {user ? '查看你的占卜記錄並管理個人檔案' : '登入以存取你的個人 Pip-Boy 終端機'}
                </p>
              </div>
            </PipBoyCard>

            <PipBoyCard
              variant="interactive"
              isClickable
              onClick={handleQuickReading}
              className="group p-8 hover:scale-105"
            >
              <div className="text-center">
                <PixelIcon name="card-stack" size={48} className="mb-4 mx-auto group-hover:animate-bounce text-pip-boy-green" aria-label={user ? '新占卜' : '快速占卜'} />
                <h3 className="text-xl font-bold text-pip-boy-green mb-2">
                  {user ? '新占卜' : '快速占卜'}
                </h3>
                <p className="text-pip-boy-green/60 text-sm">
                  {user ? '開始一場全新的塔羅占卜' : '嘗試樣本占卜 - 無需 Vault 註冊'}
                </p>
              </div>
            </PipBoyCard>
          </div>
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-px bg-gradient-to-r from-transparent via-pip-boy-green to-transparent opacity-30 animate-pulse"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              終端機功能
            </h2>
            <p className="text-pip-boy-green/70">
              由戰前量子計算技術驅動
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PipBoyCard variant="default" padding="lg" className="text-center">
              <PipBoyCardContent>
                <PixelIcon name="zap" size={40} className="mb-4 mx-auto text-pip-boy-green" decorative />
                <h3 className="text-lg font-bold text-pip-boy-green mb-2">
                  量子占卜
                </h3>
                <p className="text-pip-boy-green/60 text-sm">
                  先進演算法透過 Vault-Tec 的量子矩陣處理塔羅牌含義
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard variant="default" padding="lg" className="text-center">
              <PipBoyCardContent>
                <PixelIcon name="chart-bar" size={40} className="mb-4 mx-auto text-pip-boy-green" decorative />
                <h3 className="text-lg font-bold text-pip-boy-green mb-2">
                  占卜分析
                </h3>
                <p className="text-pip-boy-green/60 text-sm">
                  透過 Pip-Boy 整合追蹤你的業力進展和占卜歷史
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard variant="default" padding="lg" className="text-center">
              <PipBoyCardContent>
                <PixelIcon name="test-tube" remixVariant="fill" sizePreset="lg" variant="primary" className="mb-4 mx-auto" decorative />
                <h3 className="text-lg font-bold text-pip-boy-green mb-2">
                  廢土主題
                </h3>
                <p className="text-pip-boy-green/60 text-sm">
                  專為核災後生存和廢土生活調整的解讀
                </p>
              </PipBoyCardContent>
            </PipBoyCard>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t-2 border-pip-boy-green">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="border-2 border-pip-boy-green p-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
            <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
              準備好探索你的廢土命運了嗎？
            </h2>
            <p className="text-pip-boy-green/70 mb-6">
              加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PipBoyButton
                variant="default"
                size="lg"
                onClick={() => window.location.href = '/auth/register'}
                className="hover:scale-105"
              >
                註冊 Vault 帳號
              </PipBoyButton>
              <PipBoyButton
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/cards'}
                className="hover:scale-105"
              >
                瀏覽卡牌圖書館
              </PipBoyButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}