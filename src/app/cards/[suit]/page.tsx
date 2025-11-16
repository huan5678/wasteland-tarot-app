/**
 * Card List Page - Cards by Suit (Server Component)
 * 卡牌列表頁面 (依花色) - 伺服器元件
 *
 * 負責：
 * - 生成動態 SEO metadata
 * - SSG 支援：預先生成所有有效花色的靜態頁面
 * - 渲染 Client Component
 */

import type { Metadata } from 'next';
import CardListClientPage from './client-page';

// 動態生成 metadata（根據花色）
export async function generateMetadata({ params }: { params: Promise<{ suit: string }> }): Promise<Metadata> {
  const { suit } = await params;

  const suitNameMap: Record<string, string> = {
    'major': '大阿爾克那',
    'wands': '權杖',
    'cups': '聖杯',
    'swords': '寶劍',
    'pentacles': '錢幣',
  };

  const suitName = suitNameMap[suit] || '卡牌';

  return {
    title: `${suitName} | 卡牌瀏覽 | 廢土塔羅 - 探索塔羅牌意義與解讀`,
    description: `瀏覽廢土塔羅 ${suitName} 的完整卡牌集合。每張卡牌都融入 Fallout 世界觀，提供獨特的廢土主題解讀與生存智慧。`,
  };
}

/**
 * CardListPage Component (Server Component wrapper)
 */
export default async function CardListPage({
  params,
}: {
  params: Promise<{ suit: string }>;
}) {
  const { suit } = await params;

  return <CardListClientPage suit={suit} />;
}
