'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import { DynamicHeroTitle, DynamicHeroTitleErrorBoundary } from '@/components/hero'
import { PipBoyButton, PipBoyCard, PipBoyCardHeader, PipBoyCardTitle, PipBoyCardContent } from '@/components/ui/pipboy'
import { StepCard } from '@/components/landing/StepCard'
import { StatCounter } from '@/components/landing/StatCounter'
import { TestimonialCard } from '@/components/landing/TestimonialCard'
import { landingStatsAPI } from '@/lib/api'

// How It Works steps data
const HOW_IT_WORKS_STEPS = [
  {
    id: 1,
    icon: 'layout-grid',
    title: '選擇牌陣',
    description: '從多種廢土主題牌陣中選擇適合的占卜方式',
  },
  {
    id: 2,
    icon: 'shuffle',
    title: '洗牌抽卡',
    description: '透過量子演算法隨機抽取塔羅牌',
  },
  {
    id: 3,
    icon: 'hand',
    title: '查看解讀',
    description: '獲得結合 Fallout 世界觀的詳細牌義解析',
  },
  {
    id: 4,
    icon: 'cpu',
    title: '追蹤進度',
    description: '記錄占卜歷史並追蹤你的廢土業力',
  },
] as const

// Testimonials data
const TESTIMONIALS = [
  {
    id: 1,
    avatar: 'user-3',
    username: 'Vault111_X',
    rating: 5,
    review: '這個 AI 占卜系統準得可怕，完全預測到我在廢土中會遇到的挑戰。Pip-Boy 風格的介面也超有沉浸感！',
  },
  {
    id: 2,
    avatar: 'user-6',
    username: 'WastelandWanderer',
    rating: 5,
    review: '結合量子演算法和塔羅占卜的概念很新穎，解讀也很深入。作為 Fallout 粉絲，這個主題設計讓我很滿意。',
  },
  {
    id: 3,
    avatar: 'skull',
    username: 'NukaEnthusiast',
    rating: 4,
    review: '占卜結果很有參考價值，幫助我在廢土生存中做出更好的決策。希望未來能加入更多牌陣選擇。',
  },
] as const

// FAQ data
const FAQ_ITEMS = [
  {
    id: 1,
    question: '什麼是廢土塔羅？',
    answer: '廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統，使用量子演算法提供準確的牌義解讀，幫助你在廢土世界中找到生存智慧。',
  },
  {
    id: 2,
    question: '我需要註冊才能使用嗎？',
    answer: '不需要！你可以直接使用「快速占卜」功能體驗服務。註冊帳號後可以保存占卜記錄、追蹤業力進度並解鎖更多進階功能。',
  },
  {
    id: 3,
    question: '如何解讀占卜結果？',
    answer: '每次占卜都會提供詳細的牌義解析，結合 Fallout 世界觀的故事背景，幫助你理解卡牌的象徵意義並應用到實際生活中。',
  },
  {
    id: 4,
    question: '占卜結果準確嗎？',
    answer: '我們使用先進的量子演算法確保隨機性和準確性。塔羅占卜本質上是一種自我反思的工具，準確度取決於你如何解讀和應用結果。',
  },
] as const

export default function ClientPage() {
  const user = useAuthStore(s => s.user)
  const [stats, setStats] = useState({ users: 0, readings: 0, cards: 78, providers: 3 })
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Fetch landing stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await landingStatsAPI.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch landing stats:', error)
        // Fallback values
        setStats({ users: 1000, readings: 5000, cards: 78, providers: 3 })
      }
    }

    fetchStats()
  }, [])

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

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
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

      {/* How It Works Section */}
      <section className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              如何使用
            </h2>
            <p className="text-pip-boy-green/70">
              四個簡單步驟開始你的廢土占卜之旅
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <StepCard
                key={step.id}
                stepNumber={step.id}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="border-t-2 border-pip-boy-green">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              即時數據統計
            </h2>
            <p className="text-pip-boy-green/70">
              加入數千名 Vault Dweller 的占卜社群
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter
              icon="user"
              value={stats.users}
              label="總用戶數"
              suffix="+"
            />
            <StatCounter
              icon="file-list-2"
              value={stats.readings}
              label="占卜次數"
              suffix="+"
            />
            <StatCounter
              icon="grid"
              value={stats.cards}
              label="塔羅牌"
              suffix="張"
            />
            <StatCounter
              icon="cpu"
              value={stats.providers}
              label="AI 供應商"
              suffix="家"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              用戶評價
            </h2>
            <p className="text-pip-boy-green/70">
              看看其他 Vault Dweller 怎麼說
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                avatar={testimonial.avatar}
                username={testimonial.username}
                rating={testimonial.rating}
                review={testimonial.review}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              核心功能
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

      {/* FAQ Section */}
      <section className="border-t-2 border-pip-boy-green">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              常見問題
            </h2>
            <p className="text-pip-boy-green/70">
              關於廢土塔羅的一切你需要知道的
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <div
                key={faq.id}
                className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)]"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-pip-boy-green-20)] transition-colors"
                  aria-expanded={expandedFaq === faq.id}
                >
                  <span className="font-semibold text-pip-boy-green pr-4">
                    {faq.question}
                  </span>
                  <PixelIcon
                    name={expandedFaq === faq.id ? 'arrow-up-s' : 'arrow-down-s'}
                    sizePreset="sm"
                    className="flex-shrink-0 text-pip-boy-green"
                    aria-hidden="true"
                  />
                </button>

                {/* Answer Panel */}
                {expandedFaq === faq.id && (
                  <div className="border-t-2 border-pip-boy-green p-4 bg-black/20 animate-fade-in">
                    <p className="text-pip-boy-green/80 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
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
                className="hover:scale-105 transition-transform"
              >
                註冊 Vault 帳號
              </PipBoyButton>
              <PipBoyButton
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/cards'}
                className="hover:scale-105 transition-transform"
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
