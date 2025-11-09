'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { useReadingsStore, SearchFilters } from '@/lib/readingsStore';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface Props {
  onSearchResults: (results: any[]) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
}

export function AdvancedSearchFilter({ onSearchResults, onFiltersChange }: Props) {
  const { searchReadings, categories, readings } = useReadingsStore();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Extract available options from existing readings
  const availableOptions = useMemo(() => {
    const spreadTypes = new Set<string>();

    readings.forEach((reading) => {
      spreadTypes.add(reading.spread_type);
    });

    return {
      spreadTypes: Array.from(spreadTypes).sort(),
      accuracyRatings: [1, 2, 3, 4, 5]
    };
  }, [readings]);

  const performSearch = useCallback(() => {
    const results = searchReadings(query, filters);
    onSearchResults(results);
    onFiltersChange?.(filters);
  }, [query, filters, searchReadings, onSearchResults, onFiltersChange]);

  // Auto-search when query or filters change
  React.useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearAllFilters = () => {
    setQuery('');
    setFilters({});
  };

  const toggleAccuracyRating = (rating: number) => {
    const current = filters.accuracyRating || [];
    const updated = current.includes(rating) ?
    current.filter((r) => r !== rating) :
    [...current, rating];

    updateFilters({ accuracyRating: updated.length > 0 ? updated : undefined });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.spreadType) count++;
    if (filters.isFavorite !== undefined) count++;
    if (filters.isArchived !== undefined) count++;
    if (filters.hasNotes !== undefined) count++;
    if (filters.dateRange) count++;
    if (filters.accuracyRating?.length) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <PixelIcon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pip-boy-green/60" />
            <input
              type="text"
              placeholder="搜尋問題、解讀內容、筆記..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-pip-boy-green/30 text-pip-boy-green text-sm
                       focus:border-pip-boy-green focus:outline-none placeholder:text-pip-boy-green/40" />


            {query &&
            <Button size="icon" variant="link"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2">

                <PixelIcon name="close" className="w-4 h-4" />
              </Button>
            }
          </div>

          {/* Filter Toggle Button */}
          <Button size="default" variant="default"
          onClick={() => setIsExpanded(!isExpanded)}
          className="{expression}">





            <PixelIcon name="filter" className="w-4 h-4" />
            篩選
            {activeFilterCount > 0 &&
            <span className="px-1.5 py-0.5 bg-pip-boy-green text-wasteland-dark text-xs rounded">
                {activeFilterCount}
              </span>
            }
            <PixelIcon name="chevron-down" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>

          {/* Clear All Button */}
          {(query || activeFilterCount > 0) &&
          <Button size="sm" variant="outline"
          onClick={clearAllFilters}
          className="px-3 py-3 flex items-center gap-2">


              <PixelIcon name="rotate-ccw" className="w-4 h-4" />
              清除
            </Button>
          }
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded &&
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green text-sm font-bold">類別</label>
              <select
              value={filters.category || ''}
              onChange={(e) => updateFilters({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                         focus:border-pip-boy-green focus:outline-none">


                <option value="">所有類別</option>
                {categories.map((category) =>
              <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
              )}
              </select>
            </div>

            {/* Spread Type Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green text-sm font-bold">牌陣類型</label>
              <select
              value={filters.spreadType || ''}
              onChange={(e) => updateFilters({ spreadType: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                         focus:border-pip-boy-green focus:outline-none">


                <option value="">所有牌陣</option>
                {availableOptions.spreadTypes.map((type) =>
              <option key={type} value={type}>
                    {type === 'single' ? '單張卡牌' :
                type === 'three_card' ? '三張卡牌' :
                type === 'celtic_cross' ? '凱爾特十字' : type}
                  </option>
              )}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green text-sm font-bold">日期範圍</label>
              <Button size="icon" variant="outline"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full px-3 py-2 border flex items-center justify-between">


                <span>
                  {filters.dateRange ?
                `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}` :
                '選擇日期範圍'
                }
                </span>
                <PixelIcon name="calendar" className="w-4 h-4" />
              </Button>

              {showDatePicker &&
            <div className="absolute z-10 mt-1 p-3 bg-wasteland-dark border-2 border-pip-boy-green space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-pip-boy-green text-xs mb-1">開始日期</label>
                      <input
                    type="date"
                    onChange={(e) => {
                      const start = new Date(e.target.value);
                      updateFilters({
                        dateRange: {
                          start,
                          end: filters.dateRange?.end || new Date()
                        }
                      });
                    }}
                    className="w-full px-2 py-1 bg-black border border-pip-boy-green/30 text-pip-boy-green text-xs" />

                    </div>
                    <div>
                      <label className="block text-pip-boy-green text-xs mb-1">結束日期</label>
                      <input
                    type="date"
                    onChange={(e) => {
                      const end = new Date(e.target.value);
                      end.setHours(23, 59, 59, 999); // End of day
                      updateFilters({
                        dateRange: {
                          start: filters.dateRange?.start || new Date(2020, 0, 1),
                          end
                        }
                      });
                    }}
                    className="w-full px-2 py-1 bg-black border border-pip-boy-green/30 text-pip-boy-green text-xs" />

                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-pip-boy-green/30">
                    <Button size="xs" variant="link"
                onClick={() => updateFilters({ dateRange: undefined })}>


                      清除日期
                    </Button>
                    <Button size="xs" variant="outline"
                onClick={() => setShowDatePicker(false)}
                className="px-2 py-1 border">

                      確定
                    </Button>
                  </div>
                </div>
            }
            </div>
          </div>

          {/* Quick Toggle Filters */}
          <div className="flex flex-wrap gap-3">
            <Button size="default" variant="default"
          onClick={() => updateFilters({ isFavorite: filters.isFavorite === true ? undefined : true })}
          className="{expression}">





              <PixelIcon name="star" className="w-4 h-4" />
              最愛
            </Button>

            <Button size="default" variant="default"
          onClick={() => updateFilters({ isArchived: filters.isArchived === true ? undefined : true })}
          className="{expression}">





              <PixelIcon name="archive" className="w-4 h-4" />
              已封存
            </Button>

            <Button size="default" variant="default"
          onClick={() => updateFilters({ hasNotes: filters.hasNotes === true ? undefined : true })}
          className="{expression}">





              <PixelIcon name="hash" className="w-4 h-4" />
              有筆記
            </Button>
          </div>

          {/* Accuracy Rating Filter */}
          <div className="space-y-2">
            <label className="block text-pip-boy-green text-sm font-bold">準確度評分</label>
            <div className="flex gap-2">
              {availableOptions.accuracyRatings.map((rating) => {
              const isSelected = filters.accuracyRating?.includes(rating);
              return (
                <Button size="default" variant="default"
                key={rating}
                onClick={() => toggleAccuracyRating(rating)}
                className="{expression}">





                    {rating} ⭐
                  </Button>);

            })}
            </div>
          </div>
        </div>
      }

      {/* Search Results Summary */}
      <div className="text-pip-boy-green/70 text-sm">
        {query && `搜尋: "${query}" • `}
        {activeFilterCount > 0 && `${activeFilterCount} 個篩選條件 • `}
        找到結果將在下方顯示
      </div>
    </div>);

}