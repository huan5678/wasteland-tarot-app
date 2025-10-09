'use client'
import React, { useState, useCallback, useMemo } from 'react'
import { useReadingsStore, SearchFilters } from '@/lib/readingsStore'
import { Search, Filter, Calendar, Tag, Star, Archive, Hash, X, ChevronDown, RotateCcw } from 'lucide-react'

interface Props {
  onSearchResults: (results: any[]) => void
  onFiltersChange?: (filters: SearchFilters) => void
}

export function AdvancedSearchFilter({ onSearchResults, onFiltersChange }: Props) {
  const { searchReadings, categories, readings } = useReadingsStore()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Extract available options from existing readings
  const availableOptions = useMemo(() => {
    const allTags = new Set<string>()
    const spreadTypes = new Set<string>()

    readings.forEach(reading => {
      reading.tags?.forEach(tag => allTags.add(tag))
      spreadTypes.add(reading.spread_type)
    })

    return {
      tags: Array.from(allTags).sort(),
      spreadTypes: Array.from(spreadTypes).sort(),
      accuracyRatings: [1, 2, 3, 4, 5]
    }
  }, [readings])

  const performSearch = useCallback(() => {
    const results = searchReadings(query, filters)
    onSearchResults(results)
    onFiltersChange?.(filters)
  }, [query, filters, searchReadings, onSearchResults, onFiltersChange])

  // Auto-search when query or filters change
  React.useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [performSearch])

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearAllFilters = () => {
    setQuery('')
    setFilters({})
  }

  const removeTag = (tagToRemove: string) => {
    updateFilters({
      tags: filters.tags?.filter(tag => tag !== tagToRemove)
    })
  }

  const addTag = (tag: string) => {
    updateFilters({
      tags: [...(filters.tags || []), tag]
    })
  }

  const toggleAccuracyRating = (rating: number) => {
    const current = filters.accuracyRating || []
    const updated = current.includes(rating)
      ? current.filter(r => r !== rating)
      : [...current, rating]

    updateFilters({ accuracyRating: updated.length > 0 ? updated : undefined })
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.tags?.length) count++
    if (filters.category) count++
    if (filters.spreadType) count++
    if (filters.isFavorite !== undefined) count++
    if (filters.isArchived !== undefined) count++
    if (filters.hasNotes !== undefined) count++
    if (filters.dateRange) count++
    if (filters.accuracyRating?.length) count++
    return count
  }, [filters])

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pip-boy-green/60" />
            <input
              type="text"
              placeholder="搜尋問題、解讀內容、筆記..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border-2 border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                       focus:border-pip-boy-green focus:outline-none placeholder:text-pip-boy-green/40"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pip-boy-green/60 hover:text-pip-boy-green"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-3 border-2 font-mono text-sm flex items-center gap-2 transition-colors
              ${isExpanded
                ? 'border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green'
                : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
              }`}
          >
            <Filter className="w-4 h-4" />
            篩選
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-pip-boy-green text-wasteland-dark text-xs rounded">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear All Button */}
          {(query || activeFilterCount > 0) && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-3 border-2 border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60 hover:text-pip-boy-green
                       font-mono text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              清除
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green font-mono text-sm font-bold">類別</label>
              <select
                value={filters.category || ''}
                onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                         focus:border-pip-boy-green focus:outline-none"
              >
                <option value="">所有類別</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Spread Type Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green font-mono text-sm font-bold">牌陣類型</label>
              <select
                value={filters.spreadType || ''}
                onChange={(e) => updateFilters({ spreadType: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                         focus:border-pip-boy-green focus:outline-none"
              >
                <option value="">所有牌陣</option>
                {availableOptions.spreadTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'single' ? '單張卡牌' :
                     type === 'three_card' ? '三張卡牌' :
                     type === 'celtic_cross' ? '凱爾特十字' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="block text-pip-boy-green font-mono text-sm font-bold">日期範圍</label>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                         text-left hover:border-pip-boy-green/60 flex items-center justify-between"
              >
                <span>
                  {filters.dateRange
                    ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
                    : '選擇日期範圍'
                  }
                </span>
                <Calendar className="w-4 h-4" />
              </button>

              {showDatePicker && (
                <div className="absolute z-10 mt-1 p-3 bg-wasteland-dark border-2 border-pip-boy-green space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-pip-boy-green font-mono text-xs mb-1">開始日期</label>
                      <input
                        type="date"
                        onChange={(e) => {
                          const start = new Date(e.target.value)
                          updateFilters({
                            dateRange: {
                              start,
                              end: filters.dateRange?.end || new Date()
                            }
                          })
                        }}
                        className="w-full px-2 py-1 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-pip-boy-green font-mono text-xs mb-1">結束日期</label>
                      <input
                        type="date"
                        onChange={(e) => {
                          const end = new Date(e.target.value)
                          end.setHours(23, 59, 59, 999) // End of day
                          updateFilters({
                            dateRange: {
                              start: filters.dateRange?.start || new Date(2020, 0, 1),
                              end
                            }
                          })
                        }}
                        className="w-full px-2 py-1 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-pip-boy-green/30">
                    <button
                      onClick={() => updateFilters({ dateRange: undefined })}
                      className="text-pip-boy-green/60 hover:text-pip-boy-green font-mono text-xs"
                    >
                      清除日期
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-2 py-1 border border-pip-boy-green/30 text-pip-boy-green font-mono text-xs hover:border-pip-boy-green"
                    >
                      確定
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tag Filter */}
          <div className="space-y-2">
            <label className="block text-pip-boy-green font-mono text-sm font-bold">標籤</label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.tags.map(tag => {
                const isSelected = filters.tags?.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                    className={`px-2 py-1 border font-mono text-xs flex items-center gap-1 transition-colors
                      ${isSelected
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                      }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                )
              })}
            </div>

            {filters.tags && filters.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-pip-boy-green/70 font-mono text-xs">標籤匹配模式:</span>
                <select
                  value={filters.tagMode || 'any'}
                  onChange={(e) => updateFilters({ tagMode: e.target.value as 'any' | 'all' })}
                  className="px-2 py-1 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-xs"
                >
                  <option value="any">任一標籤</option>
                  <option value="all">所有標籤</option>
                </select>
              </div>
            )}
          </div>

          {/* Quick Toggle Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateFilters({ isFavorite: filters.isFavorite === true ? undefined : true })}
              className={`px-3 py-2 border font-mono text-sm flex items-center gap-2 transition-colors
                ${filters.isFavorite === true
                  ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                  : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                }`}
            >
              <Star className="w-4 h-4" />
              最愛
            </button>

            <button
              onClick={() => updateFilters({ isArchived: filters.isArchived === true ? undefined : true })}
              className={`px-3 py-2 border font-mono text-sm flex items-center gap-2 transition-colors
                ${filters.isArchived === true
                  ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                  : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                }`}
            >
              <Archive className="w-4 h-4" />
              已封存
            </button>

            <button
              onClick={() => updateFilters({ hasNotes: filters.hasNotes === true ? undefined : true })}
              className={`px-3 py-2 border font-mono text-sm flex items-center gap-2 transition-colors
                ${filters.hasNotes === true
                  ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                  : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                }`}
            >
              <Hash className="w-4 h-4" />
              有筆記
            </button>
          </div>

          {/* Accuracy Rating Filter */}
          <div className="space-y-2">
            <label className="block text-pip-boy-green font-mono text-sm font-bold">準確度評分</label>
            <div className="flex gap-2">
              {availableOptions.accuracyRatings.map(rating => {
                const isSelected = filters.accuracyRating?.includes(rating)
                return (
                  <button
                    key={rating}
                    onClick={() => toggleAccuracyRating(rating)}
                    className={`px-3 py-2 border font-mono text-sm transition-colors
                      ${isSelected
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                      }`}
                  >
                    {rating} ⭐
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      <div className="text-pip-boy-green/70 font-mono text-sm">
        {query && `搜尋: "${query}" • `}
        {activeFilterCount > 0 && `${activeFilterCount} 個篩選條件 • `}
        找到結果將在下方顯示
      </div>
    </div>
  )
}