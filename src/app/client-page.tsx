'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import { DynamicHeroTitle, DynamicHeroTitleErrorBoundary } from '@/components/hero'
import { PipBoyButton, PipBoyCard, PipBoyCardHeader, PipBoyCardTitle, PipBoyCardContent } from '@/components/ui/pipboy'
import { StepCard } from '@/components/landing/StepCard'
import { StatCounter } from '@/components/landing/StatCounter'
import { TestimonialCard } from '@/components/landing/TestimonialCard'
import { useTestimonialAnimation } from '@/components/landing/useTestimonialAnimation'
import { FAQSection } from '@/components/landing/FAQSection'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { landingStatsAPI } from '@/lib/api'
import { useStagger } from '@/lib/animations/useStagger'
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation'
import { useEntranceAnimation } from '@/lib/animations/useEntranceAnimation'
import { useReducedMotion } from '@/lib/animations/useReducedMotion'
import { breathingGlowVariants } from '@/lib/animations/motionVariants'
import { motion } from 'motion/react'
import { isGSAPAvailable } from '@/lib/animations/animationUtils'
import { useLayoutEffect } from 'react'

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
  // Use fallback values as initial state to prevent counter animation re-triggering
  const [stats, setStats] = useState({ users: 1000, readings: 5000, cards: 78, providers: 3 })

  // Task 13.3: Integrate reduced motion support
  const prefersReducedMotion = useReducedMotion()

  // Ref for Hero section entrance animation
  const heroSectionRef = useRef<HTMLDivElement>(null)

  // Ref for How It Works section stagger animation
  const howItWorksContainerRef = useRef<HTMLDivElement>(null)

  // Ref for Stats section animation
  const statsSectionRef = useRef<HTMLDivElement>(null)

  // Ref for Features section animation
  const featuresSectionRef = useRef<HTMLDivElement>(null)

  // ✅ Hero Section entrance animation（頁面載入時播放，不使用 ScrollTrigger）
  // Note: .hero-title 的 border 展開使用 CSS animation（立即執行，不等 JS）
  useEntranceAnimation({
    containerRef: heroSectionRef,
    animations: [
      {
        target: '.hero-header',
        from: { opacity: 0, y: -30 },
        to: { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        position: 0, // 第一個開始播放
      },
      {
        target: '.hero-cta',
        from: { opacity: 0, scale: 0.9 },
        to: { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
        position: '+=0.3',
      },
    ],
    delay: 0, // 立即開始，不延遲
  })

  // Task 8.1: Integrate useStagger hook for How It Works section
  // ✅ Normal scroll animation: Step cards appear as section enters viewport
  useStagger({
    containerRef: howItWorksContainerRef,
    childrenSelector: '.step-card',
    stagger: 0.15, // Desktop: 0.15s, Mobile: 0.075s (automatic via useStagger)
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    duration: 0.6,
    start: 'top 50%', // ✅ Lower trigger point for first section (50% instead of 80%)
    end: 'bottom 30%',
    scroller: '#main-content', // ✅ Use main content scrollbar
    // ✅ No pin: All sections use normal scroll animation
  })

  // Stats Section entrance animation
  // Note: .stat-counter animation is handled by StatCounter component's useCounterAnimation
  useScrollAnimation({
    triggerRef: statsSectionRef,
    animations: [
      {
        target: '.stats-title',
        from: { opacity: 0, y: -20 },
        to: { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      },
    ],
    scroller: '#main-content', // ✅ Use main content scrollbar
  })

  // Task 10.1: Initialize testimonial animation
  // ✅ Normal scroll animation: Cards float in as section enters viewport
  const testimonialsRef = useRef<HTMLDivElement>(null)
  useTestimonialAnimation({
    containerRef: testimonialsRef,
    childrenSelector: '.testimonial-card',
    stagger: 0.2,
    scroller: '#main-content', // ✅ Use main content scrollbar
    // ✅ Use unified trigger position (top 66.67% from gsapConfig)
    // scrollTriggerStart: omitted to use default
    // ✅ No pin: All sections use normal scroll animation
  })

  // Features Section entrance animation
  // ✅ Normal scroll animation: Features appear as section enters viewport
  useScrollAnimation({
    triggerRef: featuresSectionRef,
    animations: [
      {
        target: '.features-title',
        from: { opacity: 0, y: -20 },
        to: { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      },
      {
        target: '.feature-card',
        from: { opacity: 0, scale: 0.9 },
        to: { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)', stagger: 0.12 },
        position: '+=0.2',
      },
    ],
    scroller: '#main-content', // ✅ Use main content scrollbar
    // ✅ No pin: All sections use normal scroll animation
  })

  // ✅ Landing Page Strategy: Use attractive fallback values
  // Don't fetch real stats for landing page to avoid showing small numbers (e.g., 2 users)
  // The fallback values (1000+, 5000+) are more appealing for marketing purposes

  // Fetch landing stats from API (prevent re-fetch on re-render)
  const hasFetchedRef = useRef(false)
  useEffect(() => {
    // Prevent duplicate fetch in React Strict Mode
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchStats = async () => {
      try {
        const data = await landingStatsAPI.getStats()
        console.log('[HomePage] Fetched landing stats:', data)

        // ✅ Only update if API returns larger values than fallback
        // This prevents showing small real numbers (e.g., 2 users) on landing page
        const shouldUpdate =
          data &&
          typeof data === 'object' &&
          data.users >= stats.users &&
          data.readings >= stats.readings

        if (shouldUpdate) {
          setStats(data)
          console.log('[HomePage] Updated stats with larger values:', data)
        } else {
          console.log('[HomePage] API returned smaller values, keeping attractive fallback:', {
            api: data,
            fallback: stats
          })
        }
      } catch (error) {
        console.error('[HomePage] Failed to fetch landing stats:', error)
        console.log('[HomePage] Using fallback stats:', stats)
      }
    }

    fetchStats()
  }, [])

  // ✅ GSAP 2025 Best Practice: Refresh ScrollTrigger after all animations initialize
  useLayoutEffect(() => {
    if (!isGSAPAvailable()) return

    // Wait for next frame to ensure all ScrollTriggers are created
    requestAnimationFrame(() => {
      const ScrollTriggerPlugin = (globalThis as any).ScrollTrigger
      if (ScrollTriggerPlugin) {
        ScrollTriggerPlugin.refresh()
        console.log('[HomePage] ScrollTrigger refreshed after initialization')
      }
    })
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

  return (
    <div className="min-h-screen text-pip-boy-green">
      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Terminal Header */}
          <div className="text-center mb-12">
            <div className="hero-header opacity-0 border-2 border-pip-boy-green p-4 inline-block mb-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
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
            <div
              className="hero-title animate-hero-border-expand"
              style={{
                width: '1px', // 初始寬度：1px 顯示垂直 border 線
                maxWidth: '100%', // 最大寬度 100%
                margin: '0 auto', // 水平居中
                opacity: 1,
                overflow: 'hidden' // 隱藏超出部分（文字）
              }}
            >
              <DynamicHeroTitleErrorBoundary>
                <DynamicHeroTitle initialDelay={1000} />
              </DynamicHeroTitleErrorBoundary>
            </div>
          </div>

          {/* Primary Actions - Fallout Terminal Style */}
          <div className="hero-cta opacity-0 flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto mb-16 justify-center">
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

      {/* How It Works Section - Task 8.1 & 8.3: Stagger Animation with Fixed Height */}
      {/* ✅ Ref moved to section so pin affects entire section, not just grid */}
      <section ref={howItWorksContainerRef} className="border-t-2 border-pip-boy-green min-h-[600px]" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-pip-boy-green mb-4">
              如何使用
            </h2>
            <p className="text-pip-boy-green/70">
              四個簡單步驟開始你的廢土占卜之旅
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
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
      <section ref={statsSectionRef} className="border-t-2 border-pip-boy-green">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="stats-title text-3xl font-bold text-pip-boy-green mb-4">
              即時數據統計
            </h2>
            <p className="text-pip-boy-green/70">
              加入數千名 Vault Dweller 的占卜社群
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="stat-counter">
              <StatCounter
                icon="user"
                value={stats.users}
                label="總用戶數"
                suffix="+"
                scroller="#main-content"
              />
            </div>
            <div className="stat-counter">
              <StatCounter
                icon="file-list-2"
                value={stats.readings}
                label="占卜次數"
                suffix="+"
                scroller="#main-content"
              />
            </div>
            <div className="stat-counter">
              <StatCounter
                icon="grid"
                value={stats.cards}
                label="塔羅牌"
                suffix="張"
                scroller="#main-content"
              />
            </div>
            <div className="stat-counter">
              <StatCounter
                icon="cpu"
                value={stats.providers}
                label="AI 供應商"
                suffix="家"
                scroller="#main-content"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      {/* ✅ Ref already on section - correct for pin */}
      <section ref={testimonialsRef} className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
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
      {/* ✅ Ref already on section - correct for pin */}
      <section ref={featuresSectionRef} className="border-t-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="features-title text-3xl font-bold text-pip-boy-green mb-4">
              核心功能
            </h2>
            <p className="text-pip-boy-green/70">
              由戰前量子計算技術驅動
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PipBoyCard variant="default" padding="lg" className="feature-card text-center">
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

            <PipBoyCard variant="default" padding="lg" className="feature-card text-center">
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

            <PipBoyCard variant="default" padding="lg" className="feature-card text-center">
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

      {/* FAQ Section - Task 12.1-12.6: Framer Motion FAQ Animation */}
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

          <FAQSection items={FAQ_ITEMS} />
        </div>
      </section>

      {/* Call to Action - Tasks 13.1-13.5: Breathing Glow Animation */}
      <section className="border-t-2 border-pip-boy-green">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="border-2 border-pip-boy-green p-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
            <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
              準備好探索你的廢土命運了嗎？
            </h2>
            <p className="text-pip-boy-green/70 mb-6">
              加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller
            </p>

            {/* Task 13.1-13.4: CTA Buttons with Breathing Glow, Hover, Tap Animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Primary CTA Button - Pip-Boy Green Glow */}
              <motion.button
                variants={breathingGlowVariants}
                initial="initial"
                animate={prefersReducedMotion ? 'initial' : 'animate'} // Task 13.3: Reduced motion support
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.6)', // Task 13.2: Enhanced glow
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.95 }} // Task 13.2: Tap animation
                onClick={() => window.location.href = '/auth/register'}
                className="px-6 py-3 text-lg font-bold text-black bg-pip-boy-green border-2 border-pip-boy-green hover:bg-pip-boy-green/90 transition-colors"
                style={{
                  boxShadow: prefersReducedMotion
                    ? '0 0 10px rgba(0, 255, 136, 0.4), 0 0 20px rgba(0, 255, 136, 0.3)' // Task 13.3: Static glow for reduced motion
                    : undefined,
                }}
              >
                註冊 Vault 帳號
              </motion.button>

              {/* Secondary CTA Button - Radiation Orange Glow */}
              <motion.button
                variants={{
                  initial: {
                    boxShadow: '0 0 10px rgba(255, 136, 0, 0.3), 0 0 20px rgba(255, 136, 0, 0.2)', // Radiation Orange
                  },
                  animate: {
                    boxShadow: [
                      '0 0 10px rgba(255, 136, 0, 0.3), 0 0 20px rgba(255, 136, 0, 0.2)',
                      '0 0 20px rgba(255, 136, 0, 0.6), 0 0 40px rgba(255, 136, 0, 0.4)',
                      '0 0 10px rgba(255, 136, 0, 0.3), 0 0 20px rgba(255, 136, 0, 0.2)',
                    ],
                    transition: {
                      duration: 2,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    },
                  },
                }}
                initial="initial"
                animate={prefersReducedMotion ? 'initial' : 'animate'}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 30px rgba(255, 136, 0, 0.8), 0 0 60px rgba(255, 136, 0, 0.6)',
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/cards'}
                className="px-6 py-3 text-lg font-bold text-radiation-orange bg-transparent border-2 border-radiation-orange hover:bg-radiation-orange/10 transition-colors"
                style={{
                  boxShadow: prefersReducedMotion
                    ? '0 0 10px rgba(255, 136, 0, 0.4), 0 0 20px rgba(255, 136, 0, 0.3)'
                    : undefined,
                }}
              >
                瀏覽卡牌圖書館
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
