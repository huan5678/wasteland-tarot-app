/**
 * CarouselIndicator 元件
 *
 * 顯示輪播指示器（dots），支援鍵盤導航與無障礙屬性
 */

'use client';

import React from 'react';

/**
 * 元件 Props
 */
export interface CarouselIndicatorProps {
  /** 文案總數 */
  totalCount: number;
  /** 當前索引 */
  currentIndex: number;
  /** 點擊回調 */
  onDotClick: (index: number) => void;
  /** 是否顯示（單一文案時隱藏） */
  visible: boolean;
}

/**
 * CarouselIndicator 元件
 */
export function CarouselIndicator({
  totalCount,
  currentIndex,
  onDotClick,
  visible,
}: CarouselIndicatorProps) {
  // 不顯示時返回 null
  if (!visible || totalCount <= 1) {
    return null;
  }

  /**
   * 處理鍵盤事件
   */
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onDotClick(index);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={`文案輪播指示器，共 ${totalCount} 組`}
      className="flex justify-center gap-3 mt-8"
    >
      {Array.from({ length: totalCount }, (_, index) => {
        const isActive = index === currentIndex;

        return (
          <button
            key={index}
            role="tab"
            aria-label={`第 ${index + 1} 組文案，共 ${totalCount} 組`}
            aria-current={isActive ? 'true' : undefined}
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => onDotClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              w-3 h-3 transition-all duration-200
              border border-pip-boy-green
              focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2
              focus:ring-offset-black
              hover:scale-125
              ${
                isActive
                  ? 'bg-pip-boy-green scale-110'
                  : 'bg-transparent hover:bg-pip-boy-green/30'
              }
            `}
            style={{
              // 使用方形符合終端機風格
              borderRadius: '2px',
            }}
          />
        );
      })}
    </div>
  );
}
