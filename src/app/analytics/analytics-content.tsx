'use client'

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export function AnalyticsPageContent() {
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
