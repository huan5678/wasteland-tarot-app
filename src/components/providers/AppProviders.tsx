'use client'

/**
 * AppProviders - 統一管理所有全域 Providers
 *
 * 架構設計：
 * 1. Core Providers (必須) - Auth, Analytics, ErrorBoundary
 * 2. UI Providers (選擇性) - Notification, TiltConfig, DailyCardBack
 * 3. Feature Providers (選擇性) - Music, Metrics, Activity
 *
 * 基於 Next.js 2025 best practices：
 * - 只包裹 {children} 而非整個 HTML
 * - 按需載入，不是所有頁面都需要所有 providers
 * - Client Component 標記 'use client'
 */

import React, { ReactNode } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { GlobalErrorDisplay } from '@/components/common/GlobalErrorDisplay'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { TiltConfigProvider } from '@/contexts/TiltConfigContext'
import { DailyCardBackProvider } from '@/components/providers/DailyCardBackProvider'
import { AnimationProvider } from '@/components/providers/AnimationProvider'
import { CRTScreenEffect } from '@/components/ui/CRTScreenEffect'

// Initializers
import { MetricsInitializer } from '@/components/system/MetricsInitializer'
import { AudioInitializer } from '@/components/system/AudioInitializer'
import { ActivityTrackerInitializer } from '@/components/system/ActivityTrackerInitializer'
import { LoyaltyRewardInitializer } from '@/components/system/LoyaltyRewardInitializer'
import { AchievementNotificationInitializer } from '@/components/system/AchievementNotificationInitializer'
import { MusicPlayerInitializer } from '@/components/system/MusicPlayerInitializer'
import { FontLoadMonitor } from '@/components/system/FontLoadMonitor'

// UI Components
import { MusicPlayerDrawer } from '@/components/music-player/MusicPlayerDrawer'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * CoreProviders - 核心功能 Providers
 * 所有頁面都需要（除了 404）
 */
function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AnalyticsProvider>
        <MetricsInitializer />
        <AudioInitializer />
        <GlobalErrorDisplay />
        {children}
      </AnalyticsProvider>
    </ErrorBoundary>
  )
}

/**
 * FeatureProviders - 功能性 Providers
 * 需要 Auth 的頁面才需要
 */
function FeatureProviders({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      {/* ActivityTrackerInitializer: 自動追蹤使用者活躍度，累積 30 分鐘後延長 token */}
      <ActivityTrackerInitializer />

      {/* LoyaltyRewardInitializer: 每日登入忠誠度檢查與獎勵通知 */}
      {/* 必須在 NotificationProvider 內部才能使用 useNotification hook */}
      <LoyaltyRewardInitializer />

      {/* AchievementNotificationInitializer: 成就解鎖通知系統 */}
      {/* 自動顯示新解鎖的成就，支援自動消失與手動關閉 */}
      <AchievementNotificationInitializer />

      {children}
    </NotificationProvider>
  )
}

/**
 * UIProviders - UI 相關 Providers
 * 所有互動頁面都需要（除了 404）
 */
function UIProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {/* FontLoadMonitor: 開發環境字體載入監控 */}
      <FontLoadMonitor />

      {/* LazyMotion: Framer Motion lazy loading provider */}
      {/* 啟用所有使用 'framer-motion/m' 的組件動畫功能 */}
      {/* domAnimation: 輕量版 features，包含大部分常用動畫功能 */}
      {/* strict: 關閉以允許混用 motion 和 m components */}
    <LazyMotion features={domAnimation}>
        {/* AnimationProvider: 管理全域動畫狀態（如 CRT 開關機效果） */}
        <AnimationProvider>
          {/* TiltConfigProvider: 為所有卡片元件提供 3D 傾斜效果全域配置 */}
          {/* 自動偵測裝置效能並設定降級策略（低效能裝置減少角度、停用光澤） */}
          <TiltConfigProvider>
            {/* DailyCardBackProvider: 提供每日隨機卡背功能，自動在換日時更新 */}
            <DailyCardBackProvider>
              {/* MusicPlayerInitializer: 初始化音樂播放器並從 localStorage 恢復狀態 */}
              {/* 暫時禁用：修復無限 API 請求循環導致頁面卡死 */}
              {/* <MusicPlayerInitializer /> */}

              {/* CRT 螢幕特效層 (Z-Index: 9999) */}
              <CRTScreenEffect />

              {children}

              {/* MusicPlayerDrawer: 全域音樂播放器 Drawer，固定在右下角 */}
              <MusicPlayerDrawer />
            </DailyCardBackProvider>
          </TiltConfigProvider>
        </AnimationProvider>
      </LazyMotion>
    </>
  )
}

/**
 * AppProviders - 主要 Providers 組合
 *
 * 使用策略：
 * - 404 頁面：完全不使用（直接渲染 not-found.tsx）
 * - 公開頁面：只使用 CoreProviders + UIProviders
 * - 需要 Auth 的頁面：使用全部 Providers
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CoreProviders>
      <FeatureProviders>
        <UIProviders>
          {children}
        </UIProviders>
      </FeatureProviders>
    </CoreProviders>
  )
}

/**
 * MinimalProviders - 最小化 Providers
 * 用於不需要完整功能的頁面（例如公開頁面）
 */
export function MinimalProviders({ children }: { children: ReactNode }) {
  return (
    <CoreProviders>
      <UIProviders>
        {children}
      </UIProviders>
    </CoreProviders>
  )
}
