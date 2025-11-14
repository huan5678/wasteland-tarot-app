import type { Metadata } from 'next';
import { TokenAnalyticsPageContent } from './token-analytics-content';

export const metadata: Metadata = {
  title: 'Token 延長分析 | 廢土塔羅 - 系統效能監控',
  description: 'Pip-Boy 風格的 Token 延長分析儀表板，監控系統 Token 延長次數、成功率、平均延長時間與每日趨勢圖表。',
};

export default function TokenAnalyticsPagePage() {
  return <TokenAnalyticsPageContent />;
}
