/**
 * Analytics Page
 * Display user analytics dashboard
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '數據分析 | 廢土塔羅 - 用戶分析儀表板',
  description: '查看你的塔羅使用統計數據，包含占卜頻率、最常抽到的卡牌、偏好的牌陣類型與業力成長趨勢。深入了解你的占卜習慣。',
};

'use client'

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  // 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth();

  // 統一載入畫面
  if (!isReady) {
    return <AuthLoading isVerifying={true} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <AnalyticsDashboard />
    </div>
  );
}
