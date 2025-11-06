import type { Metadata } from "next";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import { DynamicBackground } from "@/components/layout/DynamicBackground";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { StagedAuthProvider } from '@/components/providers/StagedAuthProvider';
import { AppProviders } from '@/components/providers/AppProviders';
import { LoadingStrategy } from '@/components/providers/LoadingStrategy';
import { BackendHealthCheck } from '@/components/providers/BackendHealthCheck';
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

        {/*
          重構後的 Provider 架構 (Next.js 2025 Best Practices)

          設計原則：
          1. BackendHealthCheck: 確保後端喚醒後才載入應用（防止 serverless cold start 錯誤）
          2. StagedAuthProvider: 分階段 Auth 初始化（不阻擋渲染）
          3. AppProviders: 統一管理所有功能 providers
          4. LoadingStrategy: 根據頁面類型顯示不同 loading
          5. 404 頁面完全獨立（在 ConditionalLayout 層級處理）

          效能優化：
          - Backend health check 最優先（避免 API 請求失敗）
          - Auth 初始化在背景執行，不阻擋頁面顯示
          - Providers 只包裹 {children}，不包裹整個 HTML
          - 按需載入，減少不必要的初始化
        */}
        <BackendHealthCheck>
          <StagedAuthProvider requireAuth={false}>
            <AppProviders>
              <LoadingStrategy>
                <div className="min-h-screen flex flex-col relative z-10">
                  <ClientLayout>
                    {/* ConditionalLayout: 根據路由決定是否顯示 Header 和 Footer */}
                    {/* 404 頁面不顯示 Header 和 Footer，完全獨立渲染 */}
                    <ConditionalLayout>
                      {children}
                    </ConditionalLayout>
                  </ClientLayout>
                </div>
              </LoadingStrategy>
            </AppProviders>
          </StagedAuthProvider>
        </BackendHealthCheck>
      </body>
    </html>
  );
}