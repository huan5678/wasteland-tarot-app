import type { Metadata } from "next";
import "./globals.css";
import { ZustandAuthInitializer } from "@/components/providers/ZustandAuthProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/layout/DynamicBackground";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastProvider } from "@/components/common/Toast";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { MetricsInitializer } from '@/components/system/MetricsInitializer';
import { AudioInitializer } from '@/components/system/AudioInitializer';
import { doto } from '@/lib/fonts';

export const metadata: Metadata = {
  title: "廢土塔羅 - Pip-Boy 占卜終端機",
  description: "由 Vault-Tec 驅動的後末世塔羅占卜。透過神秘的卡牌占卜探索你在廢土中的命運。",
  keywords: ["塔羅", "輻射", "pip-boy", "廢土", "占卜", "卡牌", "Vault-Tec"],
  authors: [{ name: "Vault-Tec Corporation" }],
  creator: "Vault-Tec Corporation",
  publisher: "Vault-Tec Corporation",
  robots: "index, follow",
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
    <html lang="zh-TW" className={`dark ${doto.variable}`}>
      <body className="text-pip-boy-green font-mono antialiased" style={{backgroundColor: 'var(--color-wasteland-darker)'}}>
        <DynamicBackground />
        <ErrorBoundary>
          <ZustandAuthInitializer>
            <AnalyticsProvider>
              <MetricsInitializer />
              <AudioInitializer />
              <ToastProvider>
                <div className="min-h-screen flex flex-col relative z-10">
                  <ClientLayout>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </ClientLayout>
                </div>
              </ToastProvider>
            </AnalyticsProvider>
          </ZustandAuthInitializer>
        </ErrorBoundary>
      </body>
    </html>
  );
}