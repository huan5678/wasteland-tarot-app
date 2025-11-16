/**
 * Reading Detail Page - 占卜詳情頁面（Tab 式設計）
 *
 * 使用 Tab 形式整合以下內容：
 * - Tab 1: 占卜總覽 - 問題、牌陣、所有卡牌
 * - Tab 2-N: 每張卡牌的詳細資訊（整合 ReadingCardDetail）
 * - Tab N+1: 解讀結果
 * - Tab N+2: 元資料
 */

import type { Metadata } from 'next';
import ReadingDetailClientPage from './client-page';
import { serverApi } from '@/lib/serverApi';

// 動態生成 metadata（根據占卜內容）
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const reading = await serverApi.readings.getReading(id);
    const question = reading.question || '占卜記錄';
    const spreadName = reading.spread_template?.display_name || '占卜';

    return {
      title: `${question} | 占卜詳情 | 廢土塔羅 - 查看占卜記錄與解讀`,
      description: `查看「${question}」的 ${spreadName} 占卜詳細記錄，包含牌陣配置、每張卡牌解讀與完整占卜結果。`,
    };
  } catch (error) {
    console.error('Failed to fetch reading for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '占卜詳情 | 廢土塔羅 - 查看占卜記錄與解讀',
    description: '查看你的塔羅占卜詳細記錄，包含問題、牌陣配置、每張卡牌解讀與完整占卜結果。回顧過去的占卜體驗，深化理解。',
  };
}

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ReadingDetailClientPage readingId={id} />;
}
