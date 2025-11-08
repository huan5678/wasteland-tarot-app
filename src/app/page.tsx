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

          {/* Primary Actions - Fallout Terminal Style */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto mb-16 justify-center">
            {/* Primary CTA */}
            <button
              onClick={handleGetStarted}
              className="group relative w-full sm:w-auto overflow-hidden"
            >
              {/* Background layers */}
              <div className="absolute inset-0 bg-black border-2 border-pip-boy-green"></div>
              <div className="absolute inset-0 bg-pip-boy-green/5 group-hover:bg-pip-boy-green/10 transition-colors"></div>
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pip-boy-green"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pip-boy-green"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pip-boy-green"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pip-boy-green"></div>
              
              {/* Scan line effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-full w-full bg-gradient-to-b from-transparent via-pip-boy-green/10 to-transparent animate-scanline"></div>
              </div>
              
              {/* Content - Horizontal Layout */}
              <div className="relative px-6 py-4 flex items-center gap-4">
                <PixelIcon
                  name="target"
                  sizePreset="lg"
                  className="text-pip-boy-green group-hover:animate-pulse flex-shrink-0"
                  decorative
                />
                <div className="text-left flex-1">
                  <div className="text-lg font-bold text-pip-boy-green tracking-wider uppercase">
                    {user ? '> 進入控制台' : '> 進入 Vault'}
                  </div>
                  <div className="text-xs text-pip-boy-green/70 font-mono">
                    {user ? '[ 查看占卜記錄 ]' : '[ 登入終端機 ]'}
                  </div>
                </div>
              </div>
            </button>

            {/* Secondary CTA */}
            <button
              onClick={handleQuickReading}
              className="group relative w-full sm:w-auto overflow-hidden"
            >
              {/* Background layers */}
              <div className="absolute inset-0 bg-black border-2 border-radiation-orange"></div>
              <div className="absolute inset-0 bg-radiation-orange/5 group-hover:bg-radiation-orange/10 transition-colors"></div>
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-radiation-orange"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-radiation-orange"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-radiation-orange"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-radiation-orange"></div>
              
              {/* Scan line effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-full w-full bg-gradient-to-b from-transparent via-radiation-orange/10 to-transparent animate-scanline"></div>
              </div>
              
              {/* Content - Horizontal Layout */}
              <div className="relative px-6 py-4 flex items-center gap-4">
                <PixelIcon
                  name="file-list-2"
                  sizePreset="lg"
                  className="text-radiation-orange group-hover:animate-pulse flex-shrink-0"
                  decorative
                />
                <div className="text-left flex-1">
                  <div className="text-lg font-bold text-radiation-orange tracking-wider uppercase">
                    {user ? '> 新占卜' : '> 快速占卜'}
                  </div>
                  <div className="text-xs text-radiation-orange/70 font-mono">
                    {user ? '[ 開始新占卜 ]' : '[ 免註冊試用 ]'}
                  </div>
                </div>
              </div>
            </button>
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
