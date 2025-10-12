'use client';

/**
 * Icon Preview Page
 * 圖示預覽頁面 - 開發者工具
 *
 * 提供完整的圖示瀏覽、搜尋、篩選和複製功能
 * Fallout Pip-Boy 主題設計
 *
 * @module IconPreviewPage
 */

import React, { useState, useMemo, useCallback } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import {
  ICON_METADATA,
  searchIcons,
  getIconsByCategory,
  getIconCount,
  getAllCategories,
  getIconCountByCategory,
} from '@/components/ui/icons/iconMetadata';
import { IconCategory, type IconSize } from '@/types/icons';

/**
 * 圖示預覽頁面元件
 */
export default function IconPreviewPage() {
  // ========== State 管理 ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'all'>('all');
  const [selectedSize, setSelectedSize] = useState<IconSize>(48);
  const [selectedColor, setSelectedColor] = useState('text-pip-boy-green');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  // ========== 資料處理 ==========
  /**
   * 過濾後的圖示列表
   */
  const filteredIcons = useMemo(() => {
    // 先根據搜尋查詢過濾
    let icons = searchQuery.trim() ? searchIcons(searchQuery) : ICON_METADATA;

    // 再根據分類過濾
    if (selectedCategory !== 'all') {
      icons = icons.filter((icon) => icon.category === selectedCategory);
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  /**
   * 統計資訊
   */
  const statistics = useMemo(() => {
    const total = getIconCount();
    const filtered = filteredIcons.length;
    const categories = getAllCategories();
    const counts = getIconCountByCategory();

    return { total, filtered, categories, counts };
  }, [filteredIcons]);

  // ========== 事件處理器 ==========
  /**
   * 複製圖示使用範例程式碼
   */
  const handleCopyIconCode = useCallback((iconName: string) => {
    const code = `<PixelIcon name="${iconName}" aria-label="描述" />`;

    // 複製到剪貼簿
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIcon(iconName);

      // 2 秒後清除提示
      setTimeout(() => {
        setCopiedIcon(null);
      }, 2000);
    });
  }, []);

  /**
   * 處理鍵盤導航
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, iconName: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCopyIconCode(iconName);
      }
    },
    [handleCopyIconCode]
  );

  // ========== 渲染 ==========
  return (
    <div className="min-h-screen bg-wasteland-dark text-pip-boy-green p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wider">
          PIXEL ICON LIBRARY
        </h1>
        <p className="text-pip-boy-amber text-sm md:text-base">
          Developer Tools - Icon Browser & Reference
        </p>
      </header>

      {/* Statistics Bar */}
      <div className="mb-6 p-4 border border-pip-boy-green bg-pip-boy-green/5">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-pip-boy-amber">Total Icons:</span>{' '}
            <span className="font-bold">{statistics.total}</span>
          </div>
          <div>
            <span className="text-pip-boy-amber">Filtered:</span>{' '}
            <span className="font-bold">{statistics.filtered}</span>
          </div>
          <div>
            <span className="text-pip-boy-amber">Categories:</span>{' '}
            <span className="font-bold">{statistics.categories.length}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm mb-2 text-pip-boy-amber">
            Search Icons
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, tags, or description..."
            className="w-full px-4 py-2 bg-wasteland-dark border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:border-pip-boy-amber"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm mb-2 text-pip-boy-amber">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as IconCategory | 'all')}
            className="w-full px-4 py-2 bg-wasteland-dark border border-pip-boy-green text-pip-boy-green focus:outline-none focus:border-pip-boy-amber"
          >
            <option value="all">All Categories ({statistics.total})</option>
            {statistics.categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)} (
                {statistics.counts[category]})
              </option>
            ))}
          </select>
        </div>

        {/* Size Selector */}
        <div>
          <label htmlFor="size" className="block text-sm mb-2 text-pip-boy-amber">
            Icon Size
          </label>
          <select
            id="size"
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value) as IconSize)}
            className="w-full px-4 py-2 bg-wasteland-dark border border-pip-boy-green text-pip-boy-green focus:outline-none focus:border-pip-boy-amber"
          >
            <option value={24}>24px</option>
            <option value={32}>32px</option>
            <option value={48}>48px (Default)</option>
            <option value={72}>72px</option>
            <option value={96}>96px</option>
          </select>
        </div>
      </div>

      {/* Color Selector */}
      <div className="mb-8">
        <label className="block text-sm mb-2 text-pip-boy-amber">Icon Color</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedColor('text-pip-boy-green')}
            className={`px-4 py-2 border ${
              selectedColor === 'text-pip-boy-green'
                ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green'
                : 'bg-wasteland-dark text-pip-boy-green border-pip-boy-green hover:bg-pip-boy-green/10'
            }`}
          >
            Pip-Boy Green
          </button>
          <button
            onClick={() => setSelectedColor('text-pip-boy-amber')}
            className={`px-4 py-2 border ${
              selectedColor === 'text-pip-boy-amber'
                ? 'bg-pip-boy-amber text-wasteland-dark border-pip-boy-amber'
                : 'bg-wasteland-dark text-pip-boy-amber border-pip-boy-amber hover:bg-pip-boy-amber/10'
            }`}
          >
            Pip-Boy Amber
          </button>
          <button
            onClick={() => setSelectedColor('text-white')}
            className={`px-4 py-2 border ${
              selectedColor === 'text-white'
                ? 'bg-white text-wasteland-dark border-white'
                : 'bg-wasteland-dark text-white border-white hover:bg-white/10'
            }`}
          >
            White
          </button>
        </div>
      </div>

      {/* Icon Grid */}
      {filteredIcons.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
          {filteredIcons.map((icon) => (
            <div
              key={icon.name}
              onClick={() => handleCopyIconCode(icon.name)}
              onKeyDown={(e) => handleKeyDown(e, icon.name)}
              tabIndex={0}
              role="button"
              aria-label={`Copy code for ${icon.name} icon`}
              className={`
                relative flex flex-col items-center justify-center p-4 border border-pip-boy-green/30
                bg-wasteland-dark hover:bg-pip-boy-green/10 hover:border-pip-boy-amber
                cursor-pointer transition-all duration-200
                hover:scale-110 hover:shadow-lg hover:shadow-pip-boy-green/20
                focus:outline-none focus:ring-2 focus:ring-pip-boy-amber
                ${copiedIcon === icon.name ? 'bg-pip-boy-green/20 border-pip-boy-amber' : ''}
              `}
            >
              {/* Icon */}
              <div className="mb-2 transition-transform duration-200 hover:scale-125">
                <PixelIcon
                  name={icon.name}
                  size={selectedSize}
                  className={selectedColor}
                  decorative
                />
              </div>

              {/* Icon Name */}
              <div className="text-xs text-center text-pip-boy-green/80 break-words w-full">
                {icon.name}
              </div>

              {/* Copied Indicator */}
              {copiedIcon === icon.name && (
                <div className="absolute top-0 right-0 m-1 text-xs bg-pip-boy-amber text-wasteland-dark px-2 py-1">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 border border-pip-boy-green/30 bg-pip-boy-green/5">
          <div className="text-6xl mb-4 text-pip-boy-green/30">[ ]</div>
          <p className="text-xl text-pip-boy-amber mb-2">No icons found</p>
          <p className="text-sm text-pip-boy-green/60">
            Try adjusting your search query or category filter
          </p>
        </div>
      )}

      {/* Copy Notification */}
      {copiedIcon && (
        <div className="fixed bottom-8 right-8 px-6 py-4 bg-pip-boy-green text-wasteland-dark border-2 border-pip-boy-green shadow-lg animate-pulse">
          <p className="font-bold">✓ Code Copied!</p>
          <p className="text-sm">&lt;PixelIcon name=&quot;{copiedIcon}&quot; /&gt;</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-pip-boy-green/30 text-center text-sm text-pip-boy-green/60">
        <p>
          Pixel Icon Library - {statistics.total} icons from{' '}
          <a
            href="https://pixelarticons.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pip-boy-amber hover:underline"
          >
            pixelarticons
          </a>
        </p>
        <p className="mt-2">
          Click any icon to copy its usage code to clipboard
        </p>
      </footer>
    </div>
  );
}
