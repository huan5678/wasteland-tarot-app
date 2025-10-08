'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { animated, useSpring, useTransition } from '@react-spring/web'
import {
  Search, Filter, Star, Clock, TrendingUp, Heart, DollarSign,
  Users, Brain, Calendar, Zap, ChevronRight, ChevronDown,
  Info, Play, Bookmark, Share2
} from 'lucide-react'
import { useAdvancedGestures, useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures'
import { useMobilePerformance, useAdaptiveQuality } from '@/hooks/useMobilePerformance'
import { MobileCard, MobileGrid, MobileBottomSheet } from '@/components/layout/ResponsiveContainer'

interface SpreadConfig {
  id: string
  name: string
  description: string
  cardCount: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: 'love' | 'career' | 'spiritual' | 'general' | 'daily'
  duration: string
  icon: React.ReactNode
  preview: string[]
  positions: { id: string; label: string; meaning: string }[]
  isPopular?: boolean
  isNew?: boolean
  isFavorite?: boolean
}

interface MobileSpreadSelectorProps {
  spreads: SpreadConfig[]
  selectedSpread?: string
  onSpreadSelect: (spreadId: string) => void
  onStartReading: (spreadId: string) => void
  className?: string
}

const spreadCategories = [
  { id: 'all', label: '全部', icon: <Star className="w-4 h-4" /> },
  { id: 'daily', label: '每日', icon: <Calendar className="w-4 h-4" /> },
  { id: 'love', label: '愛情', icon: <Heart className="w-4 h-4" /> },
  { id: 'career', label: '事業', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'spiritual', label: '靈性', icon: <Zap className="w-4 h-4" /> },
  { id: 'general', label: '綜合', icon: <Users className="w-4 h-4" /> }
]

const difficultyColors = {
  beginner: 'text-green-400 bg-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/20',
  advanced: 'text-red-400 bg-red-400/20'
}

const difficultyLabels = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '高級'
}

export function MobileSpreadSelector({
  spreads,
  selectedSpread,
  onSpreadSelect,
  onStartReading,
  className = ''
}: MobileSpreadSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'popularity' | 'duration'>('popularity')
  const [showFilters, setShowFilters] = useState(false)
  const [showSpreadDetails, setShowSpreadDetails] = useState(false)
  const [selectedSpreadDetails, setSelectedSpreadDetails] = useState<SpreadConfig | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { isTouchDevice, screenSize } = useAdvancedDeviceCapabilities()
  const { isLowPerformanceDevice } = useMobilePerformance()
  const { qualityLevel, settings } = useAdaptiveQuality()

  // Filter and sort spreads
  const filteredSpreads = useMemo(() => {
    let filtered = spreads

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(spread => spread.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(spread =>
        spread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spread.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort spreads
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh')
        case 'difficulty':
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        case 'popularity':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
        case 'duration':
          return a.cardCount - b.cardCount
        default:
          return 0
      }
    })

    return sorted
  }, [spreads, selectedCategory, searchQuery, sortBy])

  // Animation springs
  const searchSpring = useSpring({
    opacity: searchQuery ? 1 : 0.7,
    transform: searchQuery ? 'scale(1)' : 'scale(0.98)',
    config: { tension: 300, friction: 25 }
  })

  const spreadTransitions = useTransition(filteredSpreads, {
    from: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
    enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    leave: { opacity: 0, transform: 'translateY(-20px) scale(0.95)' },
    config: { tension: 200, friction: 25 },
    trail: isLowPerformanceDevice ? 0 : 50
  })

  const categoryTransitions = useTransition(spreadCategories, {
    from: { opacity: 0, transform: 'scale(0.8)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 400, friction: 30 }
  })

  // Gesture handlers for spread cards
  const { bind, touchHandlers } = useAdvancedGestures(
    {
      onTap: (event) => {
        // Handle spread selection on tap
      },
      onLongPress: (event) => {
        // Show spread details on long press
      },
      onSwipe: (direction, event) => {
        if (direction === 'up') {
          setShowFilters(true)
        } else if (direction === 'left' || direction === 'right') {
          // Navigate between categories
          const currentIndex = spreadCategories.findIndex(cat => cat.id === selectedCategory)
          const nextIndex = direction === 'right'
            ? Math.min(currentIndex + 1, spreadCategories.length - 1)
            : Math.max(currentIndex - 1, 0)
          setSelectedCategory(spreadCategories[nextIndex].id)
        }
      }
    },
    {
      enableSwipe: true,
      enableDoubleTap: false,
      swipeThreshold: 50
    }
  )

  const handleSpreadSelect = (spread: SpreadConfig) => {
    onSpreadSelect(spread.id)
    setSelectedSpreadDetails(spread)
    setShowSpreadDetails(true)
  }

  const handleStartReading = (spread: SpreadConfig) => {
    onStartReading(spread.id)
    setShowSpreadDetails(false)
  }

  const SpreadCard = ({ spread }: { spread: SpreadConfig }) => (
    <MobileCard
      variant="elevated"
      touchTarget
      onClick={() => handleSpreadSelect(spread)}
      className={`
        transition-all duration-200 hover:scale-105 active:scale-95
        ${selectedSpread === spread.id ? 'ring-2 ring-pip-boy-green' : ''}
        ${viewMode === 'list' ? 'flex flex-row items-center' : ''}
      `}
    >
      <div className={`${viewMode === 'list' ? 'flex items-center space-x-4 w-full' : ''}`}>
        {/* Spread Icon & Badges */}
        <div className={`
          relative flex items-center justify-center
          ${viewMode === 'list' ? 'w-16 h-16' : 'w-full h-24 mb-4'}
          bg-pip-boy-green/10 rounded-lg
        `}>
          <div className="text-pip-boy-green text-2xl">
            {spread.icon}
          </div>

          {/* Badges */}
          <div className="absolute -top-1 -right-1 flex gap-1">
            {spread.isNew && (
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                新
              </div>
            )}
            {spread.isPopular && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                熱門
              </div>
            )}
            {spread.isFavorite && (
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            )}
          </div>
        </div>

        <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
          {/* Spread Title */}
          <h3 className="text-pip-boy-green font-mono font-bold text-lg mb-2">
            {spread.name}
          </h3>

          {/* Spread Info */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-mono ${difficultyColors[spread.difficulty]}`}>
              {difficultyLabels[spread.difficulty]}
            </span>
            <span className="text-pip-boy-green/70">{spread.cardCount} 張牌</span>
            <span className="text-pip-boy-green/70">{spread.duration}</span>
          </div>

          {/* Description */}
          <p className={`
            text-pip-boy-green/80 text-sm line-clamp-2 mb-4
            ${viewMode === 'list' ? 'line-clamp-1' : ''}
          `}>
            {spread.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStartReading(spread)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-pip-boy-green text-wasteland-dark
                       rounded-lg text-sm font-mono font-bold hover:bg-pip-boy-green/90
                       transition-colors active:scale-95"
            >
              <Play className="w-4 h-4" />
              開始占卜
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedSpreadDetails(spread)
                setShowSpreadDetails(true)
              }}
              className="p-2 border border-pip-boy-green/50 text-pip-boy-green
                       rounded-lg hover:bg-pip-boy-green/10 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </MobileCard>
  )

  return (
    <div className={`mobile-spread-selector ${className}`} {...bind()}>
      {/* Search Bar */}
      <animated.div style={searchSpring} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pip-boy-green/60 w-5 h-5" />
          <input
            type="text"
            placeholder="搜尋牌陣..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-black/60 border border-pip-boy-green/30
                     text-pip-boy-green placeholder-pip-boy-green/50 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50
                     font-mono"
          />
          <button
            onClick={() => setShowFilters(true)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2
                     text-pip-boy-green/60 hover:text-pip-boy-green transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </animated.div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categoryTransitions((style, category) => (
          <animated.button
            key={category.id}
            style={style}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm
              whitespace-nowrap transition-all duration-200 min-w-fit
              ${selectedCategory === category.id
                ? 'bg-pip-boy-green text-wasteland-dark'
                : 'bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30'
              }
            `}
          >
            {category.icon}
            {category.label}
          </animated.button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-pip-boy-green/70 text-sm font-mono">
          找到 {filteredSpreads.length} 個牌陣
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/60 border border-pip-boy-green/30 text-pip-boy-green
                     text-sm rounded-lg px-3 py-1 font-mono focus:outline-none"
          >
            <option value="popularity">熱門度</option>
            <option value="name">名稱</option>
            <option value="difficulty">難度</option>
            <option value="duration">時長</option>
          </select>

          <div className="flex border border-pip-boy-green/30 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-pip-boy-green text-wasteland-dark'
                  : 'text-pip-boy-green hover:bg-pip-boy-green/20'
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-pip-boy-green text-wasteland-dark'
                  : 'text-pip-boy-green hover:bg-pip-boy-green/20'
              }`}
            >
              <div className="w-4 h-4 flex flex-col justify-between">
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Spreads Grid/List */}
      <div className={`
        ${viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
        }
      `}>
        {spreadTransitions((style, spread) => (
          <animated.div key={spread.id} style={style}>
            <SpreadCard spread={spread} />
          </animated.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSpreads.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-pip-boy-green/30 mx-auto mb-4" />
          <p className="text-pip-boy-green/60 font-mono">
            沒有找到符合條件的牌陣
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="mt-4 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green
                     rounded-lg hover:bg-pip-boy-green/10 transition-colors font-mono"
          >
            重置篩選
          </button>
        </div>
      )}

      {/* Filters Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        snapPoints={['40%', '80%']}
      >
        <div className="p-6">
          <h3 className="text-pip-boy-green font-mono text-lg font-bold mb-6">篩選選項</h3>

          <div className="space-y-6">
            {/* Difficulty Filter */}
            <div>
              <h4 className="text-pip-boy-green font-mono font-bold mb-3">難度</h4>
              <div className="flex gap-2">
                {Object.entries(difficultyLabels).map(([key, label]) => (
                  <button
                    key={key}
                    className={`px-3 py-2 rounded-lg text-sm font-mono transition-colors
                      ${difficultyColors[key as keyof typeof difficultyColors]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Count Filter */}
            <div>
              <h4 className="text-pip-boy-green font-mono font-bold mb-3">牌數</h4>
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-pip-boy-green/20 text-pip-boy-green rounded-lg text-sm font-mono">
                  1 張
                </button>
                <button className="px-3 py-2 bg-pip-boy-green/20 text-pip-boy-green rounded-lg text-sm font-mono">
                  3 張
                </button>
                <button className="px-3 py-2 bg-pip-boy-green/20 text-pip-boy-green rounded-lg text-sm font-mono">
                  5+ 張
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-3 border border-pip-boy-green/50 text-pip-boy-green
                       rounded-lg font-mono hover:bg-pip-boy-green/10 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-3 bg-pip-boy-green text-wasteland-dark
                       rounded-lg font-mono font-bold hover:bg-pip-boy-green/90 transition-colors"
            >
              套用篩選
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Spread Details Bottom Sheet */}
      {selectedSpreadDetails && (
        <MobileBottomSheet
          isOpen={showSpreadDetails}
          onClose={() => setShowSpreadDetails(false)}
          snapPoints={['60%', '90%']}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-pip-boy-green/10 rounded-lg flex items-center justify-center text-2xl">
                  {selectedSpreadDetails.icon}
                </div>
                <div>
                  <h3 className="text-pip-boy-green font-mono text-xl font-bold">
                    {selectedSpreadDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono ${difficultyColors[selectedSpreadDetails.difficulty]}`}>
                      {difficultyLabels[selectedSpreadDetails.difficulty]}
                    </span>
                    <span className="text-pip-boy-green/70 text-sm">
                      {selectedSpreadDetails.cardCount} 張牌
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-pip-boy-green hover:bg-pip-boy-green/10 rounded-lg">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button className="p-2 text-pip-boy-green hover:bg-pip-boy-green/10 rounded-lg">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-pip-boy-green/80 mb-6 leading-relaxed">
              {selectedSpreadDetails.description}
            </p>

            {/* Position Details */}
            <div className="mb-8">
              <h4 className="text-pip-boy-green font-mono font-bold mb-4">牌位說明</h4>
              <div className="space-y-3">
                {selectedSpreadDetails.positions.map((position, index) => (
                  <div key={position.id} className="flex items-start gap-3 p-3 bg-pip-boy-green/5 rounded-lg">
                    <div className="w-8 h-8 bg-pip-boy-green/20 rounded-full flex items-center justify-center
                                 text-pip-boy-green font-mono text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h5 className="text-pip-boy-green font-mono font-bold">{position.label}</h5>
                      <p className="text-pip-boy-green/70 text-sm mt-1">{position.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSpreadDetails(false)}
                className="flex-1 py-3 border border-pip-boy-green/50 text-pip-boy-green
                         rounded-lg font-mono hover:bg-pip-boy-green/10 transition-colors"
              >
                關閉
              </button>
              <button
                onClick={() => handleStartReading(selectedSpreadDetails)}
                className="flex-1 py-3 bg-pip-boy-green text-wasteland-dark
                         rounded-lg font-mono font-bold hover:bg-pip-boy-green/90
                         transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                開始占卜
              </button>
            </div>
          </div>
        </MobileBottomSheet>
      )}

      {/* Loading State */}
      {isLowPerformanceDevice && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black/90 border border-pip-boy-green/30 rounded-lg p-3">
            <p className="text-pip-boy-green/70 text-xs font-mono">
              低效能模式已啟用
            </p>
          </div>
        </div>
      )}
    </div>
  )
}