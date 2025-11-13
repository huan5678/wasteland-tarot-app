/**
 * Card Detail Page
 * 卡牌詳細頁面
 *
 * 特色:
 * - Client Component (使用 Zustand store)
 * - 動態路由: /cards/[suit]/[cardId]
 * - 顯示完整卡牌資訊
 * - 上一張/下一張導航
 * - 載入狀態與錯誤處理
 */

import type { Metadata } from 'next';
import CardDetailClientPage from './client-page';

// 動態生成 metadata（根據卡牌內容）
export async function generateMetadata({ params }: { params: { suit: string; cardId: string } }): Promise<Metadata> {
  try {
    // 嘗試從 API 獲取卡牌資料
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cards/${params.cardId}`, {
      cache: 'force-cache',
    });

    if (response.ok) {
      const card = await response.json();
      const cardName = card.name || '塔羅牌';
      const suitName = card.suit_display_name || '';

      return {
        title: `${cardName} | 卡牌詳情 | 廢土塔羅`,
        description: `深入了解 ${suitName}${cardName} 的象徵意義、正逆位解讀與廢土主題背景故事。結合 Fallout 世界觀的獨特生存智慧與靈性指引。`,
      };
    }
  } catch (error) {
    console.error('Failed to fetch card for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '卡牌詳情 | 廢土塔羅 - 探索塔羅牌意義與解讀',
    description: '深入了解塔羅牌的象徵意義、正逆位解讀與廢土主題背景故事。每張卡牌都結合 Fallout 世界觀，提供獨特的生存智慧與靈性指引。',
  };
}

export default function CardDetailPage() {
  return <CardDetailClientPage />;
}
