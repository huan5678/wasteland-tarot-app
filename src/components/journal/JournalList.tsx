/**
 * JournalList Component
 * Displays list of journal entries with search, filtering, and pagination
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { JournalCard } from './JournalCard';
import { PixelIcon } from '@/components/ui/icons';
import type { Journal } from '@/stores/journalStore';

// ============================================================================
// Constants
// ============================================================================
import { Button } from "@/components/ui/button";
const MOOD_TAGS = [
{ value: 'hopeful', label: '充滿希望' },
{ value: 'anxious', label: '焦慮不安' },
{ value: 'reflective', label: '深思反省' },
{ value: 'excited', label: '興奮期待' },
{ value: 'peaceful', label: '平靜安詳' },
{ value: 'confused', label: '困惑迷茫' },
{ value: 'grateful', label: '感恩知足' },
{ value: 'uncertain', label: '不確定' }] as
const;

// ============================================================================
// Types
// ============================================================================

export interface JournalListProps {
  /** 日記列表 */
  journals: Journal[];

  /** 總筆數（用於分頁） */
  total: number;

  /** 當前頁碼（1-indexed） */
  currentPage?: number;

  /** 每頁筆數 */
  pageSize?: number;

  /** 是否載入中 */
  isLoading?: boolean;

  /** 分頁變更回調 */
  onPageChange?: (page: number) => void;

  /** 點擊日記卡片回調 */
  onJournalClick: (journal: Journal) => void;
}

// ============================================================================
// Component
// ============================================================================

export function JournalList({
  journals,
  total,
  currentPage = 1,
  pageSize = 20,
  isLoading = false,
  onPageChange,
  onJournalClick
}: JournalListProps) {
  // ========== State ==========

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMoodTag, setSelectedMoodTag] = useState<string | null>(null);

  // ========== Computed ==========

  const filteredJournals = useMemo(() => {
    let result = journals;

    // Filter by search keyword
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      result = result.filter((journal) =>
      journal.content.toLowerCase().includes(keyword)
      );
    }

    // Filter by mood tag
    if (selectedMoodTag) {
      result = result.filter((journal) =>
      journal.mood_tags.includes(selectedMoodTag)
      );
    }

    return result;
  }, [journals, searchKeyword, selectedMoodTag]);

  const displayCount = filteredJournals.length;

  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  const shouldShowPagination = total > pageSize;

  // ========== Handlers ==========

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  }, []);

  const toggleMoodTag = useCallback((tag: string) => {
    setSelectedMoodTag((prev) => prev === tag ? null : tag);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (!isFirstPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  }, [isFirstPage, currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (!isLastPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  }, [isLastPage, currentPage, onPageChange]);

  // ========== Render Helpers ==========

  const renderLoadingSkeleton = () =>
  <div
    className="flex flex-col items-center justify-center py-12"
    role="status"
    aria-label="載入中">

      <PixelIcon name="loader" sizePreset="xl" animation="spin" variant="primary" decorative />
      <p className="mt-4 text-sm font-cubic text-pip-boy-green/70">載入中...</p>
    </div>;


  const renderEmptyState = () => {
    // No journals at all
    if (journals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PixelIcon name="book-open" sizePreset="xl" variant="muted" decorative />
          <p className="mt-4 text-lg font-cubic text-pip-boy-green">尚無日記</p>
          <p className="mt-2 text-sm font-cubic text-pip-boy-green/70">
            開始記錄你的塔羅之旅
          </p>
        </div>);

    }

    // No search results
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <PixelIcon name="search" sizePreset="xl" variant="muted" decorative />
        <p className="mt-4 text-lg font-cubic text-pip-boy-green">找不到符合的日記</p>
        <p className="mt-2 text-sm font-cubic text-pip-boy-green/70">
          請試試不同的關鍵字或標籤
        </p>
      </div>);

  };

  const renderJournalList = () =>
  <div className="space-y-4" role="list">
      {filteredJournals.map((journal) =>
    <JournalCard
      key={journal.id}
      journal={journal}
      onClick={onJournalClick} />

    )}
    </div>;


  const renderPagination = () => {
    if (!shouldShowPagination) return null;

    return (
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-pip-boy-green">
        <Button size="sm" variant="outline"
        type="button"
        onClick={handlePrevPage}
        disabled={isFirstPage}
        className="px-4 py-2 border font-cubic disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="上一頁">

          <PixelIcon name="chevron-left" sizePreset="xs" decorative /> 上一頁
        </Button>

        <span className="text-sm font-cubic text-pip-boy-green">
          第 {currentPage} / {totalPages} 頁
        </span>

        <Button size="sm" variant="outline"
        type="button"
        onClick={handleNextPage}
        disabled={isLastPage}
        className="px-4 py-2 border font-cubic disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="下一頁">

          下一頁 <PixelIcon name="chevron-right" sizePreset="xs" decorative />
        </Button>
      </div>);

  };

  // ========== Render ==========

  return (
    <div className="journal-list space-y-6">
      {/* Search and Filter Section */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <PixelIcon
            name="search"
            sizePreset="sm"
            variant="muted"
            decorative
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          <input
            type="text"
            value={searchKeyword}
            onChange={handleSearchChange}
            placeholder="搜尋日記內容..."
            className="w-full pl-12 pr-4 py-3 bg-wasteland-dark/50 border border-pip-boy-green text-pip-boy-green font-cubic text-sm placeholder:text-pip-boy-green/50 focus:outline-none focus:ring-2 focus:ring-pip-boy-green"
            aria-label="搜尋日記" />

        </div>

        {/* Mood Tag Filters */}
        <div className="space-y-2">
          <label className="block text-xs font-cubic text-pip-boy-green/70">
            <PixelIcon name="mood" sizePreset="xs" decorative /> 依心情標籤篩選
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_TAGS.map(({ value, label }) => {
              const isSelected = selectedMoodTag === value;
              return (
                <Button size="icon" variant="default"
                key={value}
                type="button"
                onClick={() => toggleMoodTag(value)}
                className="{expression}"




                aria-label={label}>

                  {label}
                </Button>);

            })}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between pb-2 border-b border-pip-boy-green">
        <p className="text-sm font-cubic text-pip-boy-green/70">
          <PixelIcon name="list" sizePreset="xs" decorative /> 共 {displayCount} 筆日記
        </p>
      </div>

      {/* Content Area */}
      {isLoading ?
      renderLoadingSkeleton() :
      filteredJournals.length === 0 ?
      renderEmptyState() :

      <>
          {renderJournalList()}
          {renderPagination()}
        </>
      }
    </div>);

}