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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination state management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage);

  // Paginated readings (slice the filtered results)
  const paginatedReadings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReadings.slice(startIndex, endIndex);
  }, [filteredReadings, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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

              {/* 篩選面板切換按鈕 */}
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="w-full px-4 py-3 bg-black/90 border border-pip-boy-green/30 hover:border-pip-boy-green/60 transition-colors flex items-center justify-between group"
                aria-expanded={isFilterExpanded}
                aria-controls="filter-panel"
              >
                <div className="flex items-center gap-2">
                  <PixelIcon
                    name="filter"
                    sizePreset="sm"
                    variant="primary"
                    decorative
                  />
                  <span className="text-pip-boy-green font-mono text-sm font-bold">
                    篩選條件
                  </span>
                  {(filters.tags?.length || filters.categories?.length || filters.favoriteOnly || filters.archivedOnly) && (
                    <span className="px-2 py-0.5 bg-radiation-orange text-black text-xs font-mono font-bold">
                      已啟用
                    </span>
                  )}
                </div>
                <PixelIcon
                  name={isFilterExpanded ? 'arrow-up' : 'arrow-down'}
                  sizePreset="xs"
                  className="text-pip-boy-green group-hover:text-radiation-orange transition-colors"
                  decorative
                />
              </button>

              {/* 篩選面板 */}
              <div
                id="filter-panel"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isFilterExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <FilterPanel
                  availableTags={availableTags}
                  availableCategories={availableCategories}
                  filters={filters}
                  onChange={setFilters}
                />
              </div>

              {/* 每頁項目數選擇器 & 結果統計 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-pip-boy-green/70 font-mono">每頁顯示：</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-3 py-1.5 bg-black/90 border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm focus:outline-none focus:border-pip-boy-green transition-colors"
                  >
                    <option value={10}>10 筆</option>
                    <option value={20}>20 筆</option>
                    <option value={50}>50 筆</option>
                    <option value={100}>100 筆</option>
                  </select>
                </div>
                <div className="text-sm text-pip-boy-green/70 font-mono">
                  共 {filteredReadings.length} 筆記錄
                  {totalPages > 1 && ` / 第 ${currentPage} 頁，共 ${totalPages} 頁`}
                </div>
              </div>

              {/* 虛擬化列表 */}
              <VirtualizedReadingList
                readings={paginatedReadings}
                enableVirtualization={false}
                onSelect={(id) => router.push(`/readings/${id}`)}
                isLoading={isLoading}
              />

              {/* 分頁元件 */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNumber: number;

                        if (totalPages <= 7) {
                          // 顯示所有頁碼
                          pageNumber = i + 1;
                        } else {
                          // 智能顯示頁碼
                          if (i === 0) pageNumber = 1;
                          else if (i === 6) pageNumber = totalPages;
                          else if (currentPage <= 4) pageNumber = i + 1;
                          else if (currentPage >= totalPages - 3) pageNumber = totalPages - 6 + i;
                          else pageNumber = currentPage - 3 + i;
                        }

                        // 檢查是否需要省略符號
                        const showEllipsis =
                          totalPages > 7 &&
                          ((i === 1 && currentPage > 4) ||
                           (i === 5 && currentPage < totalPages - 3));

                        if (showEllipsis) {
                          return (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
