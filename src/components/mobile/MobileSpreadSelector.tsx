'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { animated, useSpring, useTransition } from '@react-spring/web';
import { useAdvancedGestures, useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures';
import { useMobilePerformance, useAdaptiveQuality } from '@/hooks/useMobilePerformance';
import { MobileCard, MobileGrid, MobileBottomSheet } from '@/components/layout/ResponsiveContainer';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface SpreadConfig {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'love' | 'career' | 'spiritual' | 'general' | 'daily';
  duration: string;
  icon: React.ReactNode;
  preview: string[];
  positions: {id: string;label: string;meaning: string;}[];
  isPopular?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
}

interface MobileSpreadSelectorProps {
  spreads: SpreadConfig[];
  selectedSpread?: string;
  onSpreadSelect: (spreadId: string) => void;
  onStartReading: (spreadId: string) => void;
  className?: string;
}

const spreadCategories = [
{ id: 'all', label: '全部', icon: <PixelIcon iconName="star" size={16} decorative /> },
{ id: 'daily', label: '每日', icon: <PixelIcon iconName="calendar" size={16} decorative /> },
{ id: 'love', label: '愛情', icon: <PixelIcon iconName="heart" size={16} decorative /> },
{ id: 'career', label: '事業', icon: <PixelIcon iconName="coin" size={16} decorative /> },
{ id: 'spiritual', label: '靈性', icon: <PixelIcon iconName="zap" size={16} decorative /> },
{ id: 'general', label: '綜合', icon: <PixelIcon iconName="users" size={16} decorative /> }];


const difficultyColors = {
  beginner: 'text-green-400 bg-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/20',
  advanced: 'text-red-400 bg-red-400/20'
};

const difficultyLabels = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '高級'
};

export function MobileSpreadSelector({
  spreads,
  selectedSpread,
  onSpreadSelect,
  onStartReading,
  className = ''
}: MobileSpreadSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'popularity' | 'duration'>('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [showSpreadDetails, setShowSpreadDetails] = useState(false);
  const [selectedSpreadDetails, setSelectedSpreadDetails] = useState<SpreadConfig | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { isTouchDevice, screenSize } = useAdvancedDeviceCapabilities();
  const { isLowPerformanceDevice } = useMobilePerformance();
  const { qualityLevel, settings } = useAdaptiveQuality();

  // Filter and sort spreads
  const filteredSpreads = useMemo(() => {
    let filtered = spreads;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((spread) => spread.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((spread) =>
      spread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spread.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort spreads
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh');
        case 'difficulty':
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'popularity':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case 'duration':
          return a.cardCount - b.cardCount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [spreads, selectedCategory, searchQuery, sortBy]);

  // Animation springs
  const searchSpring = useSpring({
    opacity: searchQuery ? 1 : 0.7,
    transform: searchQuery ? 'scale(1)' : 'scale(0.98)',
    config: { tension: 300, friction: 25 }
  });

  const spreadTransitions = useTransition(filteredSpreads, {
    from: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
    enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    leave: { opacity: 0, transform: 'translateY(-20px) scale(0.95)' },
    config: { tension: 200, friction: 25 },
    trail: isLowPerformanceDevice ? 0 : 50
  });

  const categoryTransitions = useTransition(spreadCategories, {
    from: { opacity: 0, transform: 'scale(0.8)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 400, friction: 30 }
  });

  // Gesture handlers for spread cards
  const { bind, touchHandlers } = useAdvancedGestures(
    {
      onTap: (event) => {

        // Handle spread selection on tap
      }, onLongPress: (event) => {

        // Show spread details on long press
      }, onSwipe: (direction, event) => {
        if (direction === 'up') {
          setShowFilters(true);
        } else if (direction === 'left' || direction === 'right') {
          // Navigate between categories
          const currentIndex = spreadCategories.findIndex((cat) => cat.id === selectedCategory);
          const nextIndex = direction === 'right' ?
          Math.min(currentIndex + 1, spreadCategories.length - 1) :
          Math.max(currentIndex - 1, 0);
          setSelectedCategory(spreadCategories[nextIndex].id);
        }
      }
    },
    {
      enableSwipe: true,
      enableDoubleTap: false,
      swipeThreshold: 50
    }
  );

  const handleSpreadSelect = (spread: SpreadConfig) => {
    onSpreadSelect(spread.id);
    setSelectedSpreadDetails(spread);
    setShowSpreadDetails(true);
  };

  const handleStartReading = (spread: SpreadConfig) => {
    onStartReading(spread.id);
    setShowSpreadDetails(false);
  };

  const SpreadCard = ({ spread }: {spread: SpreadConfig;}) =>
  <MobileCard
    variant="elevated"
    touchTarget
    onClick={() => handleSpreadSelect(spread)}
    className={`
        transition-all duration-200 hover:scale-105 active:scale-95
        ${selectedSpread === spread.id ? 'ring-2 ring-pip-boy-green' : ''}
        ${viewMode === 'list' ? 'flex flex-row items-center' : ''}
      `}>

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
            {spread.isNew &&
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                新
              </div>
          }
            {spread.isPopular &&
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                熱門
              </div>
          }
            {spread.isFavorite &&
          <PixelIcon iconName="star" size={16} className="text-yellow-400" decorative />
          }
          </div>
        </div>

        <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
          {/* Spread Title */}
          <h3 className="text-pip-boy-green font-bold text-lg mb-2">
            {spread.name}
          </h3>

          {/* Spread Info */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[spread.difficulty]}`}>
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
            <Button size="sm" variant="link"
          onClick={(e) => {
            e.stopPropagation();
            handleStartReading(spread);
          }}
          className="flex items-center gap-2 px-3 py-2 font-bold transition-colors">



              <PixelIcon iconName="play" size={16} decorative />
              開始占卜
            </Button>

            <Button size="icon" variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSpreadDetails(spread);
            setShowSpreadDetails(true);
          }}
          className="p-2 border transition-colors">


              <PixelIcon iconName="info" size={16} aria-label="查看牌陣詳情" />
            </Button>
          </div>
        </div>
      </div>
    </MobileCard>;


  return (
    <div className={`mobile-spread-selector ${className}`} {...bind()}>
      {/* Search Bar */}
      <animated.div style={searchSpring} className="mb-6">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pip-boy-green/60">
            <PixelIcon iconName="search" size={20} decorative />
          </div>
          <input
            type="text"
            placeholder="搜尋牌陣..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-black/60 border border-pip-boy-green/30
                     text-pip-boy-green placeholder-pip-boy-green/50 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50
                    " />




          <Button size="icon" variant="link"
          onClick={() => setShowFilters(true)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2\n transition-colors"

          aria-label="開啟篩選選項">

            <PixelIcon iconName="filter" size={20} />
          </Button>
        </div>
      </animated.div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categoryTransitions((style, category) =>
        <animated.button
          key={category.id}
          style={style}
          onClick={() => setSelectedCategory(category.id)}
          className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm
              whitespace-nowrap transition-all duration-200 min-w-fit
              ${selectedCategory === category.id ?
          'bg-pip-boy-green text-wasteland-dark' :
          'bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30'}
            `
          }>

            {category.icon}
            {category.label}
          </animated.button>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-pip-boy-green/70 text-sm">
          找到 {filteredSpreads.length} 個牌陣
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/60 border border-pip-boy-green/30 text-pip-boy-green
                     text-sm rounded-lg px-3 py-1 focus:outline-none">


            <option value="popularity">熱門度</option>
            <option value="name">名稱</option>
            <option value="difficulty">難度</option>
            <option value="duration">時長</option>
          </select>

          <div className="flex border border-pip-boy-green/30 rounded-lg overflow-hidden">
            <Button size="icon" variant="default"
            onClick={() => setViewMode('grid')}
            className="{expression}">





              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </Button>
            <Button size="icon" variant="default"
            onClick={() => setViewMode('list')}
            className="{expression}">





              <div className="w-4 h-4 flex flex-col justify-between">
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Spreads Grid/List */}
      <div className={`
        ${viewMode === 'grid' ?
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' :
      'space-y-4'}
      `
      }>
        {spreadTransitions((style, spread) =>
        <animated.div key={spread.id} style={style}>
            <SpreadCard spread={spread} />
          </animated.div>
        )}
      </div>

      {/* Empty State */}
      {filteredSpreads.length === 0 &&
      <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <PixelIcon iconName="search" size={64} className="text-pip-boy-green/30" decorative />
          </div>
          <p className="text-pip-boy-green/60">
            沒有找到符合條件的牌陣
          </p>
          <Button size="default" variant="outline"
        onClick={() => {
          setSearchQuery('');
          setSelectedCategory('all');
        }}
        className="mt-4 px-4 py-2 border transition-colors">


            重置篩選
          </Button>
        </div>
      }

      {/* Filters Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        snapPoints={['40%', '80%']}>

        <div className="p-6">
          <h3 className="text-pip-boy-green text-lg font-bold mb-6">篩選選項</h3>

          <div className="space-y-6">
            {/* Difficulty Filter */}
            <div>
              <h4 className="text-pip-boy-green font-bold mb-3">難度</h4>
              <div className="flex gap-2">
                {Object.entries(difficultyLabels).map(([key, label]) =>
                <Button size="icon" variant="default"
                key={key}
                className="{expression}">


                    {label}
                  </Button>
                )}
              </div>
            </div>

            {/* Card Count Filter */}
            <div>
              <h4 className="text-pip-boy-green font-bold mb-3">牌數</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="link" className="px-3 py-2">
                  1 張
                </Button>
                <Button size="sm" variant="link" className="px-3 py-2">
                  3 張
                </Button>
                <Button size="sm" variant="link" className="px-3 py-2">
                  5+ 張
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Button size="default" variant="outline"
            onClick={() => setShowFilters(false)}
            className="flex-1 py-3 border transition-colors">


              取消
            </Button>
            <Button size="default" variant="link"
            onClick={() => setShowFilters(false)}
            className="flex-1 py-3 font-bold transition-colors">


              套用篩選
            </Button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Spread Details Bottom Sheet */}
      {selectedSpreadDetails &&
      <MobileBottomSheet
        isOpen={showSpreadDetails}
        onClose={() => setShowSpreadDetails(false)}
        snapPoints={['60%', '90%']}>

          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-pip-boy-green/10 rounded-lg flex items-center justify-center text-2xl">
                  {selectedSpreadDetails.icon}
                </div>
                <div>
                  <h3 className="text-pip-boy-green text-xl font-bold">
                    {selectedSpreadDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[selectedSpreadDetails.difficulty]}`}>
                      {difficultyLabels[selectedSpreadDetails.difficulty]}
                    </span>
                    <span className="text-pip-boy-green/70 text-sm">
                      {selectedSpreadDetails.cardCount} 張牌
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="link" className="p-2" aria-label="加入書籤">
                  <PixelIcon iconName="bookmark" size={20} />
                </Button>
                <Button size="icon" variant="link" className="p-2" aria-label="分享牌陣">
                  <PixelIcon iconName="share" size={20} />
                </Button>
              </div>
            </div>

            <p className="text-pip-boy-green/80 mb-6 leading-relaxed">
              {selectedSpreadDetails.description}
            </p>

            {/* Position Details */}
            <div className="mb-8">
              <h4 className="text-pip-boy-green font-bold mb-4">牌位說明</h4>
              <div className="space-y-3">
                {selectedSpreadDetails.positions.map((position, index) =>
              <div key={position.id} className="flex items-start gap-3 p-3 bg-pip-boy-green/5 rounded-lg">
                    <div className="w-8 h-8 bg-pip-boy-green/20 rounded-full flex items-center justify-center
                                 text-pip-boy-green text-sm font-bold">

                      {index + 1}
                    </div>
                    <div>
                      <h5 className="text-pip-boy-green font-bold">{position.label}</h5>
                      <p className="text-pip-boy-green/70 text-sm mt-1">{position.meaning}</p>
                    </div>
                  </div>
              )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button size="default" variant="outline"
            onClick={() => setShowSpreadDetails(false)}
            className="flex-1 py-3 border transition-colors">


                關閉
              </Button>
              <Button size="default" variant="link"
            onClick={() => handleStartReading(selectedSpreadDetails)}
            className="flex-1 py-3 font-bold transition-colors flex items-center justify-center gap-2">



                <PixelIcon iconName="play" size={20} decorative />
                開始占卜
              </Button>
            </div>
          </div>
        </MobileBottomSheet>
      }

      {/* Loading State */}
      {isLowPerformanceDevice &&
      <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black/90 border border-pip-boy-green/30 rounded-lg p-3">
            <p className="text-pip-boy-green/70 text-xs">
              低效能模式已啟用
            </p>
          </div>
        </div>
      }
    </div>);

}