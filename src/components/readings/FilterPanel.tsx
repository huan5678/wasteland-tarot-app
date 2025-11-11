'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import type { FilterCriteria } from './FilterChips';

export interface TagOption {
  name: string;
  count: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  count: number;
}

export interface FilterPanelProps {
  availableTags: TagOption[];
  availableCategories: CategoryOption[];
  filters: Partial<FilterCriteria>;
  onChange: (filters: Partial<FilterCriteria>) => void;
  className?: string;
}

/**
 * FilterPanel - 篩選面板元件
 *
 * @param availableTags - 可用標籤列表（含數量）
 * @param availableCategories - 可用分類列表（含數量）
 * @param filters - 當前篩選條件
 * @param onChange - 篩選條件變更回調
 * @param className - 自訂 CSS 類別
 *
 * Requirements: 3.5, 3.6 (篩選面板，顯示可用項目數量，避免零結果搜尋)
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  availableTags,
  availableCategories,
  filters = {},
  onChange,
  className = '',
}) => {
  const handleTagToggle = (tagName: string) => {
    const currentTags = filters.tags || [];
    const isSelected = currentTags.includes(tagName);

    const newTags = isSelected
      ? currentTags.filter((t) => t !== tagName)
      : [...currentTags, tagName];

    onChange({ ...filters, tags: newTags });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const isSelected = currentCategories.includes(categoryId);

    const newCategories = isSelected
      ? currentCategories.filter((c) => c !== categoryId)
      : [...currentCategories, categoryId];

    onChange({ ...filters, categories: newCategories });
  };

  const handleToggleFilter = (key: keyof FilterCriteria) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div
      className={`bg-black/90 border border-pip-boy-green/30 p-4 rounded-none ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-pip-boy-green/30">
        <PixelIcon name="filter" sizePreset="sm" variant="primary" decorative />
        <h3 className="text-pip-boy-green font-mono text-lg font-bold">篩選條件</h3>
      </div>

      {/* Tags Section */}
      <div className="mb-6" role="region" aria-label="標籤篩選">
        <h4 className="text-pip-boy-green/80 font-mono text-sm mb-2 flex items-center gap-2">
          <PixelIcon name="price-tag" sizePreset="xs" decorative />
          標籤
        </h4>
        {availableTags.length === 0 ? (
          <p className="text-pip-boy-green/50 text-xs font-mono italic">暫無可用標籤</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = filters.tags?.includes(tag.name);
              const isZero = tag.count === 0;

              return (
                <button
                  key={tag.name}
                  onClick={() => handleTagToggle(tag.name)}
                  className={`px-3 py-1 border rounded-none text-sm font-mono transition-all
                    ${isSelected
                      ? 'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green'
                      : isZero
                        ? 'bg-black/40 border-muted/30 text-muted cursor-not-allowed'
                        : 'bg-black/60 border-pip-boy-green/30 text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:border-pip-boy-green'
                    }
                  `}
                  disabled={isZero}
                >
                  {tag.name} ({tag.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mb-6" role="region" aria-label="分類篩選">
        <h4 className="text-pip-boy-green/80 font-mono text-sm mb-2 flex items-center gap-2">
          <PixelIcon name="folder" sizePreset="xs" decorative />
          分類
        </h4>
        {availableCategories.length === 0 ? (
          <p className="text-pip-boy-green/50 text-xs font-mono italic">暫無可用分類</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => {
              const isSelected = filters.categories?.includes(category.id);
              const isZero = category.count === 0;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-3 py-1 border rounded-none text-sm font-mono transition-all
                    ${isSelected
                      ? 'bg-radiation-orange/20 border-radiation-orange text-radiation-orange'
                      : isZero
                        ? 'bg-black/40 border-muted/30 text-muted cursor-not-allowed'
                        : 'bg-black/60 border-radiation-orange/30 text-radiation-orange/70 hover:bg-radiation-orange/10 hover:border-radiation-orange'
                    }
                  `}
                  disabled={isZero}
                >
                  {category.name} ({category.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toggles Section */}
      <div className="space-y-2">
        {/* Favorite Only Toggle */}
        <button
          onClick={() => handleToggleFilter('favoriteOnly')}
          className={`w-full px-3 py-2 border rounded-none text-sm font-mono transition-all flex items-center gap-2
            ${filters.favoriteOnly
              ? 'bg-warning-yellow/20 border-warning-yellow text-warning-yellow'
              : 'bg-black/60 border-warning-yellow/30 text-warning-yellow/70 hover:bg-warning-yellow/10 hover:border-warning-yellow'
            }
          `}
        >
          <PixelIcon
            name={filters.favoriteOnly ? 'checkbox-circle' : 'checkbox-blank-circle'}
            sizePreset="xs"
            decorative
          />
          <span>只顯示收藏</span>
        </button>

        {/* Archived Only Toggle */}
        <button
          onClick={() => handleToggleFilter('archivedOnly')}
          className={`w-full px-3 py-2 border rounded-none text-sm font-mono transition-all flex items-center gap-2
            ${filters.archivedOnly
              ? 'bg-muted/20 border-muted text-muted'
              : 'bg-black/60 border-muted/30 text-muted/70 hover:bg-muted/10 hover:border-muted'
            }
          `}
        >
          <PixelIcon
            name={filters.archivedOnly ? 'checkbox-circle' : 'checkbox-blank-circle'}
            sizePreset="xs"
            decorative
          />
          <span>只顯示封存</span>
        </button>
      </div>
    </div>
  );
};

FilterPanel.displayName = 'FilterPanel';
