/**
 * Quick Reading Card Detail Page (移動端)
 * 路由: /readings/quick/card/[cardId]
 *
 * 功能：
 * - 從 localStorage 讀取快速解讀 session 資料
 * - 從 enhancedCards 資料中取得卡片完整資訊
 * - 顯示單張卡牌的完整詳情
 * - 支援返回到 /readings/quick
 */

import type { Metadata } from 'next';
import QuickCardDetailClientPage from './client-page';

// 動態生成 metadata（根據卡牌內容）
export async function generateMetadata({ params }: { params: { cardId: string } }): Promise<Metadata> {
  try {
    // 嘗試從 API 獲取卡牌資料
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cards/${params.cardId}`, {
      cache: 'force-cache',
    });

    if (response.ok) {
      const card = await response.json();
      const cardName = card.name || '塔羅牌';

      return {
        title: `${cardName} | 快速占卜卡牌 | 廢土塔羅`,
        description: `查看快速占卜中抽到的 ${cardName} 詳細資訊，包含卡牌意義、象徵與解讀建議。無需註冊即可體驗。`,
      };
    }
  } catch (error) {
    console.error('Failed to fetch card for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '快速占卜卡牌 | 廢土塔羅 - 查看卡牌詳情',
    description: '查看快速占卜中抽到的卡牌詳細資訊，包含卡牌意義、象徵與解讀建議。無需註冊即可體驗。',
  };
}

export default function QuickCardDetailPage() {
  return <QuickCardDetailClientPage />;
}
