'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { useReadingsStore } from '@/lib/readingsStore';
import { PixelIcon } from '@/components/ui/icons';
import { VirtualizedReadingList } from '@/components/readings/VirtualizedReadingList';
import { SearchInput } from '@/components/readings/SearchInput';
import { FilterPanel } from '@/components/readings/FilterPanel';
import { FilterChips } from '@/components/readings/FilterChips';
import type { FilterCriteria } from '@/components/readings/FilterChips';
import { ReadingStatsDashboard } from '@/components/readings/ReadingStatsDashboard';
import { PipBoyTabs, PipBoyTabsList, PipBoyTabsTrigger, PipBoyTabsContent } from '@/components/ui/pipboy-tabs';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/mobile';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Reading } from '@/types/database';

export default function ReadingsClientPage() {
  // ✅ 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth();
  const isLoading = useReadingsStore((s) => s.isLoading);
  const readings = useReadingsStore((s) => s.readings);
  const isMobile = useIsMobile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  // 🟢 Task 15.8: Error recovery state
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter state management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<FilterCriteria>>({});

  // CRITICAL FIX: Always fetch readings when page mounts OR when navigating back
  // This ensures we see newly created readings immediately
  useEffect(() => {
    // ✅ 等待認證就緒後才載入資料
    if (!isReady) return;

    const fetch = async () => {
      try {
        setLoadError(null);
        console.log('[ReadingsPage] Fetching readings for user:', user!.id);
        await useReadingsStore.getState().fetchUserReadings(user!.id, true); // force = true
      } catch (error: any) {
        console.error('[ReadingsPage] Failed to fetch readings:', error);
        setLoadError(error.message || '載入失敗，請重試');
      }
    };
    fetch();
  }, [isReady, user]);

  // 🟢 Task 15.8: Reload data function
  const reloadData = async () => {
    if (!user?.id) return;
    try {
      setLoadError(null);
      await useReadingsStore.getState().fetchUserReadings(user.id, true);
    } catch (error: any) {
      setLoadError(error.message || '載入失敗，請重試');
    }
  };

  // Extract available tags and categories from readings
  const availableTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    readings.forEach(r => {
      if (r.tags) {
        r.tags.forEach(tag => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(tagMap).map(([name, count]) => ({
      name,
      count
    }));
  }, [readings]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    readings.forEach(r => {
      if (r.category) {
        categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + 1);
      }
    });
    return Array.from(categoryMap).map(([id, count]) => ({
      id,
      name: id,
      count
    }));
  }, [readings]);

  // Apply filters to readings
  const filteredReadings = useMemo(() => {
    let result = [...readings];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.question?.toLowerCase().includes(query) ||
        r.spread_type?.toLowerCase().includes(query) ||
        r.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(r =>
        r.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(r =>
        r.category && filters.categories!.includes(r.category)
      );
    }

    // Favorite filter
    if (filters.favoriteOnly) {
      result = result.filter(r => r.is_favorite);
    }

    // Archived filter
    if (filters.archivedOnly) {
      result = result.filter(r => r.is_archived);
    }

    return result;
  }, [readings, searchQuery, filters]);

  // Filter manipulation functions
  const handleRemoveFilter = (filterType: keyof FilterCriteria, value: any) => {
    const newFilters = { ...filters };

    if (filterType === 'tags' && Array.isArray(newFilters.tags)) {
      newFilters.tags = newFilters.tags.filter(t => t !== value);
      if (newFilters.tags.length === 0) {
        delete newFilters.tags;
      }
    } else if (filterType === 'categories' && Array.isArray(newFilters.categories)) {
      newFilters.categories = newFilters.categories.filter(c => c !== value);
      if (newFilters.categories.length === 0) {
        delete newFilters.categories;
      }
    } else {
      delete newFilters[filterType];
    }

    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // ✅ 統一載入畫面（認證驗證 + 資料載入）
  if (!isReady || isLoading) {
    return <AuthLoading isVerifying={!isReady} />;
  }

  // Pull-to-refresh handler for mobile
  const handleRefresh = async () => {
    if (!user?.id) return;
    await useReadingsStore.getState().fetchUserReadings(user.id, true);
  };

  const readingsContent = (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-pip-boy-green">
                塔羅管理中心
              </h1>
              <p className="text-pip-boy-green/70 text-sm">個人占卜記錄與數據分析</p>
            </div>
            <Button
              size="default"
              variant="default"
              onClick={() => window.location.href = '/readings/new'}
              className="flex items-center gap-2"
            >
              <PixelIcon name="magic" sizePreset="xs" decorative />
              新占卜
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <PipBoyTabs defaultValue="history">
          <PipBoyTabsList>
            <PipBoyTabsTrigger value="history" icon="file-list">
              占卜記錄
            </PipBoyTabsTrigger>
            <PipBoyTabsTrigger value="stats" icon="bar-chart">
              數據統計
            </PipBoyTabsTrigger>
          </PipBoyTabsList>

          <PipBoyTabsContent value="history">
            <div className="space-y-4">
              {/* 🟢 Task 15.8: Error Recovery UI */}
              {loadError && (
                <div className="border-2 border-red-500 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
                    <div className="flex-1">
                      <p className="text-red-500 font-bold mb-1">載入失敗</p>
                      <p className="text-red-400 text-sm mb-3">{loadError}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={reloadData}
                        className="flex items-center gap-2"
                      >
                        <PixelIcon name="reload" sizePreset="xs" decorative />
                        重新載入
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 搜尋框 */}
              <SearchInput
                onSearch={setSearchQuery}
                placeholder="搜尋解讀記錄..."
                resultsCount={filteredReadings.length}
              />

              {/* 篩選器 Chips */}
              {(filters.tags || filters.categories || filters.favoriteOnly || filters.archivedOnly) && (
                <FilterChips
                  filters={filters}
                  onRemove={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />
              )}

              {/* 篩選面板 */}
              <FilterPanel
                availableTags={availableTags}
                availableCategories={availableCategories}
                filters={filters}
                onChange={setFilters}
              />

              {/* 虛擬化列表 */}
              <VirtualizedReadingList
                readings={filteredReadings}
                enableVirtualization={filteredReadings.length >= 100}
                onSelect={(id) => router.push(`/readings/${id}`)}
                isLoading={isLoading}
              />
            </div>
          </PipBoyTabsContent>

          <PipBoyTabsContent value="stats">
            <ReadingStatsDashboard />
          </PipBoyTabsContent>
        </PipBoyTabs>
      </div>
    </div>
  );

  // Wrap with PullToRefresh on mobile
  return isMobile ? (
    <PullToRefresh onRefresh={handleRefresh}>
      {readingsContent}
    </PullToRefresh>
  ) : readingsContent;
}
