import type { Metadata } from "next";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import { ZustandAuthInitializer } from "@/components/providers/ZustandAuthProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/layout/DynamicBackground";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { GlobalErrorDisplay } from "@/components/common/GlobalErrorDisplay";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { MetricsInitializer } from '@/components/system/MetricsInitializer';
import { AudioInitializer } from '@/components/system/AudioInitializer';
import { ActivityTrackerInitializer } from '@/components/system/ActivityTrackerInitializer';
import { LoyaltyRewardInitializer } from '@/components/system/LoyaltyRewardInitializer';
import { AchievementNotificationInitializer } from '@/components/system/AchievementNotificationInitializer';
import { TiltConfigProvider } from '@/contexts/TiltConfigContext';
import { MusicPlayerInitializer } from '@/components/system/MusicPlayerInitializer';
import { MusicPlayerDrawer } from '@/components/music-player/MusicPlayerDrawer';
import { FontLoadMonitor } from '@/components/system/FontLoadMonitor';
import { DailyCardBackProvider } from '@/components/providers/DailyCardBackProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { cn } from '@/lib/utils';
// import { doto } from '@/lib/fonts'; // Doto font removed - using Noto Sans TC

export const metadata: Metadata = {
  // 修復 metadataBase 警告 - 設定基礎 URL 用於生成絕對路徑
  // 開發環境使用 localhost，生產環境需要設定 NEXT_PUBLIC_SITE_URL
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "廢土塔羅 - Pip-Boy 占卜終端機",
  description: "由 Vault-Tec 驅動的後末世塔羅占卜。透過神秘的卡牌占卜探索你在廢土中的命運。",
  keywords: ["塔羅", "輻射", "pip-boy", "廢土", "占卜", "卡牌", "Vault-Tec"],
  authors: [{ name: "Vault-Tec Corporation" }],
  creator: "Vault-Tec Corporation",
  publisher: "Vault-Tec Corporation",
  robots: "index, follow",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    images: ['/logo.svg'],
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: "#00ff88",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      {/*
        font-cubic: Cubic 11 像素字體，完整支援中英文
        使用 className 驅動的字體整合策略，所有子元件透過 inherit 繼承字體設定
        參考: .kiro/specs/cubic-11-font-integration/design.md
      */}
      <body
        className={cn("font-cubic", "text-pip-boy-green", "antialiased")}
        style={{backgroundColor: 'var(--color-wasteland-darker)'}}
        suppressHydrationWarning
      >
        <DynamicBackground />
        <ErrorBoundary>
          <ZustandAuthInitializer>
            <AnalyticsProvider>
              <MetricsInitializer />
              <AudioInitializer />
              {/* ActivityTrackerInitializer: 自動追蹤使用者活躍度，累積 30 分鐘後延長 token */}
              <ActivityTrackerInitializer />
              {/* FontLoadMonitor: 開發環境字體載入監控 */}
              <FontLoadMonitor />
              {/* NotificationProvider: 全域通知系統（忠誠度獎勵等） */}
              <NotificationProvider>
                {/* LoyaltyRewardInitializer: 每日登入忠誠度檢查與獎勵通知 */}
                {/* 必須在 NotificationProvider 內部才能使用 useNotification hook */}
                <LoyaltyRewardInitializer />
                {/* AchievementNotificationInitializer: 成就解鎖通知系統 */}
                {/* 自動顯示新解鎖的成就，支援自動消失與手動關閉 */}
                <AchievementNotificationInitializer />
                {/* TiltConfigProvider: 為所有卡片元件提供 3D 傾斜效果全域配置 */}
                {/* 自動偵測裝置效能並設定降級策略（低效能裝置減少角度、停用光澤） */}
                <TiltConfigProvider>
                {/* DailyCardBackProvider: 提供每日隨機卡背功能，自動在換日時更新 */}
                <DailyCardBackProvider>
                  <GlobalErrorDisplay />
                  {/* MusicPlayerInitializer: 初始化音樂播放器並從 localStorage 恢復狀態 */}
                  <MusicPlayerInitializer />
                  <div className="min-h-screen flex flex-col relative z-10">
                    <ClientLayout>
                      <Header />
                      <main className="flex-1 pt-[120px] md:pt-[140px]">{children}</main>
                      <Footer />
                    </ClientLayout>
                  </div>
                  {/* MusicPlayerDrawer: 全域音樂播放器 Drawer，固定在右下角 */}
                  <MusicPlayerDrawer />
                </DailyCardBackProvider>
              </TiltConfigProvider>
              </NotificationProvider>
            </AnalyticsProvider>
          </ZustandAuthInitializer>
        </ErrorBoundary>
      </body>
    </html>
  );
}