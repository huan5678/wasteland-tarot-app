/**
 * Reading Card Detail Page (移動端)
 * 路由: /readings/[id]/card/[cardId]
 *
 * 功能：
 * - 從 API 讀取完整占卜記錄資料
 * - 顯示單張卡牌的完整詳情（包含占卜情境）
 * - 支援返回到 /readings/[id]
 */

import type { Metadata } from 'next';
import ReadingCardDetailClientPage from './client-page';

// 動態生成 metadata（根據卡牌內容）
export async function generateMetadata({ params }: { params: { id: string; cardId: string } }): Promise<Metadata> {
  try {
    // 嘗試從 API 獲取卡牌資料
    const cardResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cards/${params.cardId}`, {
      cache: 'force-cache',
    });

    if (cardResponse.ok) {
      const card = await cardResponse.json();
      const cardName = card.name || '塔羅牌';

      return {
        title: `${cardName} | 卡牌解讀 | 廢土塔羅`,
        description: `查看占卜中 ${cardName} 的詳細解讀，包含正逆位意義、在此占卜中的位置意義與完整詮釋。`,
      };
    }
  } catch (error) {
    console.error('Failed to fetch card for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '卡牌解讀 | 廢土塔羅 - 深入了解卡牌意義',
    description: '查看占卜中特定卡牌的詳細解讀，包含正逆位意義、在此占卜中的位置意義與完整詮釋。',
  };
}

export default function ReadingCardDetailPage() {
  return <ReadingCardDetailClientPage />;
}
