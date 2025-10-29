/**
 * Cards Page - Suit Selection
 * 花色選擇頁面
 *
 * 特色:
 * - Server Component (SSR, 減少客戶端 JavaScript)
 * - 顯示所有 5 個花色選項
 * - Pip-Boy 風格設計
 * - 完整的 SEO 元資料
 * - 響應式網格佈局
 */

import type { Metadata } from 'next'
import { SuitCard, SuitCardGrid } from '@/components/cards/SuitCard'
import { SuitType, getAllSuits } from '@/types/suits'

/**
 * 頁面元資料 (SEO)
 */
export const metadata: Metadata = {
  title: '塔羅牌圖書館 | Wasteland Tarot',
  description:
    '探索 78 張 Wasteland Tarot 卡牌,包含大阿爾克那與四個小阿爾克那花色。透過廢土塔羅獲得啟示與指引。',
  keywords: [
    '塔羅牌',
    'Wasteland Tarot',
    '廢土塔羅',
    'Fallout 塔羅',
    '大阿爾克那',
    '小阿爾克那',
    'Nuka-Cola',
    '戰鬥武器',
    '瓶蓋',
    '輻射棒',
  ],
  openGraph: {
    title: '塔羅牌圖書館 | Wasteland Tarot',
    description: '探索 78 張 Wasteland Tarot 卡牌,獲得廢土的智慧與啟示',
    type: 'website',
    locale: 'zh_TW',
  },
}

/**
 * Suit Selection Page (Server Component)
 */
export default function CardsPage() {
  // 取得所有花色元資料
  const suits = getAllSuits()

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <header className="mb-8 md:mb-12">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-pip-boy-green uppercase tracking-wider mb-3">
              塔羅牌圖書館
            </h1>
            <p className="text-base md:text-lg text-pip-boy-green/70">
              選擇花色開始探索廢土占卜
            </p>
            <div className="mt-4 pt-4 border-t border-pip-boy-green/30">
              <p className="text-sm md:text-base text-pip-boy-green/60">
                78 張卡牌 | 5 個花色 | 完整的廢土塔羅體系
              </p>
            </div>
          </div>
        </header>

        {/* 花色選項網格 */}
        <main>
          <SuitCardGrid>
            {suits.map((suitMetadata) => (
              <SuitCard key={suitMetadata.suit} suit={suitMetadata.suit} />
            ))}
          </SuitCardGrid>
        </main>

        {/* 頁面說明 */}
        <footer className="mt-12 md:mt-16">
          <div className="border-2 border-pip-boy-green/30 bg-black/40 p-6">
            <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
              關於 Wasteland Tarot
            </h2>
            <div className="space-y-3 text-sm md:text-base text-pip-boy-green/70">
              <p>
                Wasteland Tarot 是融合 Fallout 世界觀的塔羅牌系統,
                結合傳統塔羅智慧與廢土生存哲學。
              </p>
              <p>
                每張卡牌都蘊含著在後啟示錄世界中生存、成長與找尋意義的深刻洞見。
              </p>
              <p>選擇一個花色,開始你的廢土占卜之旅。</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
