/**
 * Analytics Page
 * Display user analytics dashboard
 */

import type { Metadata } from 'next';
import { AnalyticsPageContent } from './analytics-content';

export const metadata: Metadata = {
  title: '數據分析 | 廢土塔羅 - 用戶分析儀表板',
  description: '查看你的塔羅使用統計數據，包含占卜頻率、最常抽到的卡牌、偏好的牌陣類型與業力成長趨勢。深入了解你的占卜習慣。',
};

export default function AnalyticsPage() {
  return <AnalyticsPageContent />;
}
