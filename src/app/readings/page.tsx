'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { useReadingsStore } from '@/lib/readingsStore';
import { PixelIcon } from '@/components/ui/icons';
import { ReadingHistory } from '@/components/readings/ReadingHistory';
import { ReadingStatsDashboard } from '@/components/readings/ReadingStatsDashboard';import { Button } from "@/components/ui/button";

export default function ReadingsPage() {
  // ✅ 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth();
  const isLoading = useReadingsStore((s) => s.isLoading);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');

  // CRITICAL FIX: Always fetch readings when page mounts OR when navigating back
  // This ensures we see newly created readings immediately
  useEffect(() => {
    // ✅ 等待認證就緒後才載入資料
    if (!isReady) return;

    const fetch = async () => {
      console.log('[ReadingsPage] Fetching readings for user:', user!.id);
      await useReadingsStore.getState().fetchUserReadings(user!.id, true); // force = true
    };
    fetch();
  }, [isReady, user]);

  // ✅ 統一載入畫面（認證驗證 + 資料載入）
  if (!isReady || isLoading) {
    return <AuthLoading isVerifying={!isReady} />;
  }

  const tabs = [
  { id: 'history', label: '占卜記錄', icon: 'file-list' },
  { id: 'stats', label: '數據統計', icon: 'bar-chart' }] as
  const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return <ReadingHistory />;
      case 'stats':
        return <ReadingStatsDashboard />;
      default:
        return <ReadingHistory />;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-pip-boy-green">
                塔羅管理中心
              </h1>
              <p className="text-pip-boy-green/70 text-sm">個人占卜記錄與數據分析</p>
            </div>
            <Link
              href="/readings/new"
              className="px-4 py-2 bg-pip-boy-green text-wasteland-dark font-bold hover:bg-pip-boy-green/80 transition-colors">

+ 新占卜
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button size="icon" variant="default"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="{expression}"




                aria-label={tab.label}>

                  <PixelIcon name={tab.icon as any} size={16} decorative />
                  {tab.label}
                </Button>);

            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>);

}