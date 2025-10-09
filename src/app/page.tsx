'use client'

import React from 'react'
import { useAuthStore } from '@/lib/authStore'
import { Target, Spade, Zap, BarChart3, Theater } from 'lucide-react'
import { DynamicHeroTitle, DynamicHeroTitleErrorBoundary } from '@/components/hero'

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
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>VAULT-TEC PIP-BOY 3000 MARK IV</span>
                <span>|</span>
                <span>占卜終端機啟動中</span>
                <span>|</span>
                <span>狀態：線上</span>
              </div>
            </div>

            {/* 動態標題元件 */}
            <DynamicHeroTitleErrorBoundary>
              <DynamicHeroTitle />
            </DynamicHeroTitleErrorBoundary>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <button
              onClick={handleGetStarted}
              className="group border-2 border-pip-boy-green p-8 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-pip-boy-green-20)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-30)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-20)'
              }}
            >
              <div className="text-center">
                <Target className="w-12 h-12 mb-4 mx-auto group-hover:animate-pulse text-pip-boy-green" />
                <h3 className="text-xl font-bold text-pip-boy-green font-mono mb-2">
                  {user ? '進入控制台' : '進入 Vault'}
                </h3>
                <p className="text-pip-boy-green/60 text-sm font-mono">
                  {user ? '查看你的占卜記錄並管理個人檔案' : '登入以存取你的個人 Pip-Boy 終端機'}
                </p>
              </div>
            </button>

            <button
              onClick={handleQuickReading}
              className="group border-2 border-pip-boy-green p-8 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-pip-boy-green-10)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-20)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-10)'
              }}
            >
              <div className="text-center">
                <Spade className="w-12 h-12 mb-4 mx-auto group-hover:animate-bounce text-pip-boy-green" />
                <h3 className="text-xl font-bold text-pip-boy-green font-mono mb-2">
                  {user ? '新占卜' : '快速占卜'}
                </h3>
                <p className="text-pip-boy-green/60 text-sm font-mono">
                  {user ? '開始一場全新的塔羅占卜' : '嘗試樣本占卜 - 無需 Vault 註冊'}
                </p>
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
            <h2 className="text-3xl font-bold text-pip-boy-green font-mono mb-4">
              終端機功能
            </h2>
            <p className="text-pip-boy-green/70 font-mono">
              由戰前量子計算技術驅動
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-pip-boy-green p-6 text-center" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
              <Zap className="w-10 h-10 mb-4 mx-auto text-pip-boy-green" />
              <h3 className="text-lg font-bold text-pip-boy-green font-mono mb-2">
                量子占卜
              </h3>
              <p className="text-pip-boy-green/60 text-sm font-mono">
                先進演算法透過 Vault-Tec 的量子矩陣處理塔羅牌含義
              </p>
            </div>

            <div className="border border-pip-boy-green p-6 text-center" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
              <BarChart3 className="w-10 h-10 mb-4 mx-auto text-pip-boy-green" />
              <h3 className="text-lg font-bold text-pip-boy-green font-mono mb-2">
                占卜分析
              </h3>
              <p className="text-pip-boy-green/60 text-sm font-mono">
                透過 Pip-Boy 整合追蹤你的業力進展和占卜歷史
              </p>
            </div>

            <div className="border border-pip-boy-green p-6 text-center" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
              <Theater className="w-10 h-10 mb-4 mx-auto text-pip-boy-green" />
              <h3 className="text-lg font-bold text-pip-boy-green font-mono mb-2">
                廢土主題
              </h3>
              <p className="text-pip-boy-green/60 text-sm font-mono">
                專為核災後生存和廢土生活調整的解讀
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t-2 border-pip-boy-green">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="border-2 border-pip-boy-green p-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
            <h2 className="text-2xl font-bold text-pip-boy-green font-mono mb-4">
              準備好探索你的廢土命運了嗎？
            </h2>
            <p className="text-pip-boy-green/70 font-mono mb-6">
              加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/auth/register'}
                className="px-6 py-3 border-2 border-pip-boy-green text-pip-boy-green font-mono transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-pip-boy-green-20)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-30)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-20)'
                }}
              >
                註冊 Vault 帳號
              </button>
              <button
                onClick={() => window.location.href = '/cards'}
                className="px-6 py-3 border-2 border-pip-boy-green text-pip-boy-green/80 hover:text-pip-boy-green
                         hover:border-pip-boy-green font-mono transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--color-pip-boy-green-10)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-20)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-pip-boy-green-10)'
                }}
              >
                瀏覽卡牌圖書館
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}