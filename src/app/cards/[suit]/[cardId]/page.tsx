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
import { serverApi } from '@/lib/serverApi';
import { getSuitDisplayName } from '@/types/suits';

// 動態生成 metadata（根據卡牌內容）
export async function generateMetadata({ params }: { params: Promise<{ suit: string; cardId: string }> }): Promise<Metadata> {
  const { cardId } = await params;

  try {
    const card = await serverApi.cards.getCard(cardId);
    const cardName = card.name || '塔羅牌';
    const suitName = getSuitDisplayName(card.suit);

    return {
      title: `${cardName} | ${suitName} | 卡牌詳情 | 廢土塔羅 - 探索塔羅牌意義與解讀`,
      description: `深入了解 ${suitName}${cardName} 的象徵意義、正逆位解讀與廢土主題背景故事。結合 Fallout 世界觀的獨特生存智慧與靈性指引。`,
    };
  } catch (error) {
    console.error('Failed to fetch card for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '卡牌詳情 | 廢土塔羅 - 探索塔羅牌意義與解讀',
    description: '深入了解塔羅牌的象徵意義、正逆位解讀與廢土主題背景故事。每張卡牌都結合 Fallout 世界觀，提供獨特的生存智慧與靈性指引。',
  };
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ suit: string; cardId: string }>;
}) {
  const { suit, cardId } = await params;

  return <CardDetailClientPage suit={suit} cardId={cardId} />;
}
