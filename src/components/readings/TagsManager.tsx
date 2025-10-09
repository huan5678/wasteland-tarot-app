'use client'
import React, { useState, useMemo, useCallback } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { Tag, Plus, X, Hash, TrendingUp, Search } from 'lucide-react'

interface Props {
  selectedTags?: string[]
  onTagsChange?: (tags: string[]) => void
  onClose?: () => void
  mode?: 'select' | 'manage' // select mode for choosing tags, manage mode for tag analytics
}

interface TagStats {
  name: string
  count: number
  lastUsed: string
  readings: string[] // reading IDs
}

export function TagsManager({ selectedTags = [], onTagsChange, onClose, mode = 'select' }: Props) {
  const { readings } = useReadingsStore()
  const [newTag, setNewTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate tag statistics
  const tagStats = useMemo(() => {
    const stats: Record<string, TagStats> = {}

    readings.forEach(reading => {
      reading.tags?.forEach(tag => {
        if (!stats[tag]) {
          stats[tag] = {
            name: tag,
            count: 0,
            lastUsed: reading.created_at || '',
            readings: []
          }
        }
        stats[tag].count++
        stats[tag].readings.push(reading.id)

        // Update last used if this reading is more recent
        if (reading.created_at && reading.created_at > stats[tag].lastUsed) {
          stats[tag].lastUsed = reading.created_at
        }
      })
    })

    return Object.values(stats).sort((a, b) => b.count - a.count)
  }, [readings])

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tagStats

    const query = searchQuery.toLowerCase()
    return tagStats.filter(tag =>
      tag.name.toLowerCase().includes(query)
    )
  }, [tagStats, searchQuery])

  // Handle tag selection
  const toggleTag = useCallback((tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName]

    onTagsChange?.(newTags)
  }, [selectedTags, onTagsChange])

  // Add new tag
  const addNewTag = useCallback(() => {
    const trimmed = newTag.trim()
    if (!trimmed || selectedTags.includes(trimmed)) return

    onTagsChange?.([...selectedTags, trimmed])
    setNewTag('')
  }, [newTag, selectedTags, onTagsChange])

  // Remove selected tag
  const removeTag = useCallback((tagName: string) => {
    onTagsChange?.(selectedTags.filter(t => t !== tagName))
  }, [selectedTags, onTagsChange])

  // Get popular tags (top 5)
  const popularTags = useMemo(() =>
    tagStats.slice(0, 5)
  , [tagStats])

  // Get recently used tags (last 7 days)
  const recentTags = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return tagStats
      .filter(tag => new Date(tag.lastUsed) > sevenDaysAgo)
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 10)
  }, [tagStats])

  if (mode === 'manage') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-pip-boy-green font-mono">標籤分析</h3>
          {onClose && (
            <button onClick={onClose} className="text-pip-boy-green/70 hover:text-pip-boy-green">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
            <div className="text-2xl font-bold text-pip-boy-green font-mono">{tagStats.length}</div>
            <div className="text-sm text-pip-boy-green/70 font-mono">總標籤數</div>
          </div>

          <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
            <div className="text-2xl font-bold text-pip-boy-green font-mono">
              {tagStats.reduce((sum, tag) => sum + tag.count, 0)}
            </div>
            <div className="text-sm text-pip-boy-green/70 font-mono">標籤使用次數</div>
          </div>

          <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
            <div className="text-2xl font-bold text-pip-boy-green font-mono">
              {Math.round(tagStats.reduce((sum, tag) => sum + tag.count, 0) / Math.max(tagStats.length, 1))}
            </div>
            <div className="text-sm text-pip-boy-green/70 font-mono">平均使用次數</div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold text-pip-boy-green flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            熱門標籤
          </h4>
          <div className="space-y-2">
            {popularTags.map(tag => (
              <div key={tag.name} className="border border-pip-boy-green/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-pip-boy-green/60" />
                  <span className="font-mono text-pip-boy-green">{tag.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-pip-boy-green font-bold">{tag.count} 次</div>
                  <div className="font-mono text-xs text-pip-boy-green/60">
                    {new Date(tag.lastUsed).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Tags with Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-mono font-bold text-pip-boy-green flex items-center gap-2">
              <Hash className="w-4 h-4" />
              所有標籤
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pip-boy-green/60" />
              <input
                type="text"
                placeholder="搜尋標籤..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                         focus:border-pip-boy-green focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredTags.map(tag => (
              <div key={tag.name} className="border border-pip-boy-green/30 p-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-pip-boy-green/60" />
                  <span className="font-mono text-pip-boy-green">{tag.name}</span>
                </div>
                <span className="font-mono text-pip-boy-green/70">{tag.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Select mode UI
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-pip-boy-green font-mono">選擇標籤</h3>
        {onClose && (
          <button onClick={onClose} className="text-pip-boy-green/70 hover:text-pip-boy-green">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="block text-pip-boy-green font-mono text-sm font-bold">已選標籤</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <div
                key={tag}
                className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green text-pip-boy-green font-mono text-sm
                         flex items-center gap-2"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-pip-boy-green/70 hover:text-pip-boy-green"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Tag */}
      <div className="space-y-2">
        <label className="block text-pip-boy-green font-mono text-sm font-bold">新增標籤</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
            placeholder="輸入新標籤名稱"
            className="flex-1 px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                     focus:border-pip-boy-green focus:outline-none"
            maxLength={30}
          />
          <button
            onClick={addNewTag}
            disabled={!newTag.trim() || selectedTags.includes(newTag.trim())}
            className="px-4 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green font-mono text-sm
                     hover:bg-pip-boy-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>
      </div>

      {/* Search Existing Tags */}
      <div className="space-y-2">
        <label className="block text-pip-boy-green font-mono text-sm font-bold">選擇現有標籤</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pip-boy-green/60" />
          <input
            type="text"
            placeholder="搜尋標籤..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                     focus:border-pip-boy-green focus:outline-none"
          />
        </div>
      </div>

      {/* Recent Tags */}
      {recentTags.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <label className="block text-pip-boy-green font-mono text-sm font-bold">最近使用</label>
          <div className="flex flex-wrap gap-2">
            {recentTags.slice(0, 8).map(tag => {
              const isSelected = selectedTags.includes(tag.name)
              return (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 border font-mono text-sm flex items-center gap-1 transition-colors
                    ${isSelected
                      ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                      : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                    }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag.name}
                  <span className="text-xs opacity-60">({tag.count})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* All Available Tags */}
      {filteredTags.length > 0 && (
        <div className="space-y-2">
          <label className="block text-pip-boy-green font-mono text-sm font-bold">
            {searchQuery ? '搜尋結果' : '所有標籤'}
            <span className="text-pip-boy-green/60 font-normal ml-2">({filteredTags.length})</span>
          </label>
          <div className="max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {filteredTags.map(tag => {
                const isSelected = selectedTags.includes(tag.name)
                return (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1 border font-mono text-sm flex items-center gap-1 transition-colors
                      ${isSelected
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                      }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag.name}
                    <span className="text-xs opacity-60">({tag.count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTags.length === 0 && (
        <div className="text-center py-8 border-2 border-pip-boy-green/30">
          <Hash className="w-8 h-8 mx-auto mb-2 text-pip-boy-green/40" />
          <div className="font-mono text-sm text-pip-boy-green/70">
            {searchQuery ? '沒有找到相關標籤' : '尚無可用標籤'}
          </div>
          {!searchQuery && (
            <div className="font-mono text-xs text-pip-boy-green/50 mt-1">
              使用上方的輸入框建立第一個標籤
            </div>
          )}
        </div>
      )}
    </div>
  )
}