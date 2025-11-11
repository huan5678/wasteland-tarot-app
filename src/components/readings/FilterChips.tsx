'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';

export interface FilterCriteria {
  searchQuery?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  categories?: string[];
  favoriteOnly?: boolean;
  archivedOnly?: boolean;
  spreadTypes?: string[];
}

export interface FilterChipsProps {
  filters: Partial<FilterCriteria>;
  onRemove: (filterType: keyof FilterCriteria, value: any) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * FilterChips - 篩選條件 Chips 元件
 *
 * @param filters - 當前篩選條件
 * @param onRemove - 移除單個篩選條件的回調
 * @param onClearAll - 清除所有篩選條件的回調
 * @param className - 自訂 CSS 類別
 *
 * Requirements: 3.5 (Chips/Pills UI 顯示已選篩選器，提供單獨移除或「清除全部」選項)
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemove,
  onClearAll,
  className = '',
}) => {
  // Check if any filters are active
  const hasFilters = filters && (
    (filters.tags && filters.tags.length > 0) ||
    (filters.categories && filters.categories.length > 0) ||
    filters.dateRange ||
    filters.favoriteOnly ||
    filters.archivedOnly ||
    (filters.spreadTypes && filters.spreadTypes.length > 0)
  );

  if (!hasFilters) {
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/');
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Tag Chips */}
      {filters.tags?.map((tag) => (
        <div
          key={`tag-${tag}`}
          role="button"
          aria-label={`移除篩選: ${tag}`}
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded-none text-pip-boy-green text-sm font-mono hover:bg-pip-boy-green/20 transition-colors"
        >
          <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
            {tag}
          </span>
          <button
            onClick={() => onRemove('tags', tag)}
            aria-label={`移除篩選: ${tag}`}
            className="ml-1 hover:text-radiation-orange transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      ))}

      {/* Category Chips */}
      {filters.categories?.map((category) => (
        <div
          key={`category-${category}`}
          role="button"
          aria-label={`移除分類篩選: ${category}`}
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-radiation-orange/10 border border-radiation-orange/30 rounded-none text-radiation-orange text-sm font-mono hover:bg-radiation-orange/20 transition-colors"
        >
          <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
            {category}
          </span>
          <button
            onClick={() => onRemove('categories', category)}
            aria-label={`移除分類篩選: ${category}`}
            className="ml-1 hover:text-pip-boy-green transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      ))}

      {/* Date Range Chip */}
      {filters.dateRange && (
        <div
          role="button"
          aria-label="移除日期範圍篩選"
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-vault-blue/10 border border-vault-blue/30 rounded-none text-vault-blue text-sm font-mono hover:bg-vault-blue/20 transition-colors"
        >
          <span className="whitespace-nowrap">
            {formatDate(filters.dateRange.start)} - {formatDate(filters.dateRange.end)}
          </span>
          <button
            onClick={() => onRemove('dateRange', null)}
            aria-label="移除日期範圍篩選"
            className="ml-1 hover:text-pip-boy-green transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      )}

      {/* Favorite Only Chip */}
      {filters.favoriteOnly && (
        <div
          role="button"
          aria-label="移除只顯示收藏篩選"
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-warning-yellow/10 border border-warning-yellow/30 rounded-none text-warning-yellow text-sm font-mono hover:bg-warning-yellow/20 transition-colors"
        >
          <PixelIcon name="star" sizePreset="xs" decorative />
          <span>只顯示收藏</span>
          <button
            onClick={() => onRemove('favoriteOnly', false)}
            aria-label="移除只顯示收藏篩選"
            className="ml-1 hover:text-pip-boy-green transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      )}

      {/* Archived Only Chip */}
      {filters.archivedOnly && (
        <div
          role="button"
          aria-label="移除只顯示封存篩選"
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-muted/10 border border-muted/30 rounded-none text-muted text-sm font-mono hover:bg-muted/20 transition-colors"
        >
          <PixelIcon name="archive" sizePreset="xs" decorative />
          <span>只顯示封存</span>
          <button
            onClick={() => onRemove('archivedOnly', false)}
            aria-label="移除只顯示封存篩選"
            className="ml-1 hover:text-pip-boy-green transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      )}

      {/* Spread Type Chips */}
      {filters.spreadTypes?.map((spreadType) => (
        <div
          key={`spread-${spreadType}`}
          role="button"
          aria-label={`移除牌陣類型篩選: ${spreadType}`}
          className="filter-chip flex items-center gap-1 px-3 py-1 bg-success-green/10 border border-success-green/30 rounded-none text-success-green text-sm font-mono hover:bg-success-green/20 transition-colors"
        >
          <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
            {spreadType}
          </span>
          <button
            onClick={() => onRemove('spreadTypes', spreadType)}
            aria-label={`移除牌陣類型篩選: ${spreadType}`}
            className="ml-1 hover:text-pip-boy-green transition-colors flex-shrink-0"
          >
            <PixelIcon name="close-circle" sizePreset="xs" decorative />
          </button>
        </div>
      ))}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="px-3 py-1 border border-deep-red/50 text-deep-red text-sm font-mono hover:bg-deep-red/10 hover:border-deep-red transition-colors rounded-none flex items-center gap-1"
      >
        <PixelIcon name="close-circle" sizePreset="xs" decorative />
        <span>清除全部</span>
      </button>
    </div>
  );
};

FilterChips.displayName = 'FilterChips';
