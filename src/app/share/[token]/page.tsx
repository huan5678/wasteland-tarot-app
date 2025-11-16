/**
 * SharePage - 公開分享頁面
 *
 * 功能：
 * - 通過 share_token 載入公開的占卜資料
 * - 無需登入即可查看
 * - 只顯示過濾後的公開資料（不含 user_id, email 等）
 * - 提供 CTA 引導訪客開始自己的占卜
 *
 * TDD Green Phase: 實作功能讓測試通過
 */

import type { Metadata } from 'next';
import ShareClientPage from './client-page';
import { serverApi } from '@/lib/serverApi';

// 動態生成 metadata（根據分享的占卜內容）
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;

  try {
    const reading = await serverApi.readings.getSharedReading(token);
    const question = reading.question || '占卜記錄';
    const spreadName = reading.spread_template?.display_name || '占卜';

    return {
      title: `${question} | 分享占卜 | 廢土塔羅 - 查看公開占卜記錄`,
      description: `查看「${question}」的 ${spreadName} 占卜分享。無需登入即可瀏覽完整的占卜結果與解讀內容。`,
    };
  } catch (error) {
    console.error('Failed to fetch shared reading for metadata:', error);
  }

  // 後備 metadata
  return {
    title: '分享占卜 | 廢土塔羅 - 查看公開占卜記錄',
    description: '查看用戶分享的塔羅占卜記錄。無需登入即可瀏覽完整的占卜結果與解讀內容。',
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <ShareClientPage token={token} />;
}
