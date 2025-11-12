/**
 * AnimatedList Component
 *
 * 通用的動畫列表組件，提供以下功能：
 * - 滾動時的進入動畫（使用 framer-motion 的 useInView）
 * - 鍵盤導航（上下箭頭、Tab、Enter）
 * - 漸變邊緣效果（提示可滾動內容）
 * - 自動滾動到選中項目
 *
 * 使用範例：
 * ```tsx
 * <AnimatedList
 *   items={readings}
 *   selectedIndex={0}
 *   onItemSelect={(item, index) => console.log(item, index)}
 *   renderItem={(item, index, isSelected) => (
 *     <div className={isSelected ? 'selected' : ''}>
 *       {item.title}
 *     </div>
 *   )}
 *   keyExtractor={(item) => item.id}
 * />
 * ```
 */

'use client';

import React, { useRef, useState, useEffect, ReactNode, UIEvent } from 'react';
import { motion, useInView } from 'motion/react';

// ============================================================================
// Types
// ============================================================================

interface AnimatedItemProps<T> {
  children: ReactNode;
  delay?: number;
  index: number;
  item: T;
  isSelected: boolean;
  onMouseEnter?: (item: T, index: number) => void;
  onClick?: (item: T, index: number) => void;
}

interface AnimatedListProps<T> {
  /** 列表項目資料 */
  items: T[];

  /** 渲染每個項目的函數 */
  renderItem: (item: T, index: number, isSelected: boolean) => ReactNode;

  /** 取得項目唯一鍵值的函數 */
  keyExtractor: (item: T, index: number) => string | number;

  /** 項目被選中時的回調 */
  onItemSelect?: (item: T, index: number) => void;

  /** 當前選中的索引 */
  selectedIndex?: number;

  /** 初始選中的索引 */
  initialSelectedIndex?: number;

  /** 是否顯示漸變邊緣效果 */
  showGradients?: boolean;

  /** 是否啟用鍵盤導航（上下箭頭、Tab、Enter） */
  enableArrowNavigation?: boolean;

  /** 容器的自訂 className */
  className?: string;

  /** 列表項目容器的自訂 className */
  itemClassName?: string;

  /** 是否顯示捲軸 */
  displayScrollbar?: boolean;

  /** 最大高度（CSS 值，例如 '400px' 或 'none'） */
  maxHeight?: string;

  /** 動畫延遲時間（秒） */
  animationDelay?: number;

  /** 動畫持續時間（秒） */
  animationDuration?: number;

  /** 漸變顏色（CSS 顏色值） */
  gradientColor?: string;

  /** 漸變高度（頂部和底部的像素值） */
  gradientHeight?: { top: number; bottom: number };
}

// ============================================================================
// AnimatedItem Component
// ============================================================================

function AnimatedItem<T>({
  children,
  delay = 0,
  index,
  item,
  isSelected,
  onMouseEnter,
  onClick,
}: AnimatedItemProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={() => onMouseEnter?.(item, index)}
      onClick={() => onClick?.(item, index)}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="mb-4"
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// AnimatedList Component
// ============================================================================

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  onItemSelect,
  selectedIndex: controlledSelectedIndex,
  initialSelectedIndex = -1,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  maxHeight = '400px',
  animationDelay = 0.1,
  animationDuration = 0.2,
  gradientColor = '#060010',
  gradientHeight = { top: 50, bottom: 100 },
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  // 使用受控的 selectedIndex（如果提供）或內部狀態
  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;
  const setSelectedIndex = controlledSelectedIndex !== undefined ? () => {} : setInternalSelectedIndex;

  // 滾動事件處理：更新漸變透明度
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / gradientHeight.top, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / gradientHeight.bottom, 1));
  };

  // 鍵盤導航
  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        const newIndex = Math.min(selectedIndex + 1, items.length - 1);
        if (controlledSelectedIndex === undefined) {
          setInternalSelectedIndex(newIndex);
        }
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        const newIndex = Math.max(selectedIndex - 1, 0);
        if (controlledSelectedIndex === undefined) {
          setInternalSelectedIndex(newIndex);
        }
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onItemSelect?.(items[selectedIndex], selectedIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation, controlledSelectedIndex]);

  // 自動滾動到選中項目
  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;

    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;

    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;

      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }

    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  // 滾動條樣式類
  const scrollbarClasses = displayScrollbar
    ? '[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-pip-boy-green/30 [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-thumb]:hover:bg-pip-boy-green/50'
    : 'scrollbar-hide';

  return (
    <div className={`relative ${className}`}>
      <div
        ref={listRef}
        className={`overflow-y-auto p-4 ${scrollbarClasses}`}
        onScroll={handleScroll}
        style={{
          maxHeight: maxHeight === 'none' ? undefined : maxHeight,
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
          scrollbarColor: displayScrollbar ? '#00ff88 #000000' : undefined,
        }}
      >
        {items.map((item, index) => {
          const key = keyExtractor(item, index);
          const isSelected = selectedIndex === index;

          return (
            <AnimatedItem<T>
              key={key}
              delay={animationDelay}
              index={index}
              item={item}
              isSelected={isSelected}
              onMouseEnter={(item, idx) => {
                if (controlledSelectedIndex === undefined) {
                  setInternalSelectedIndex(idx);
                }
              }}
              onClick={(item, idx) => {
                if (controlledSelectedIndex === undefined) {
                  setInternalSelectedIndex(idx);
                }
                onItemSelect?.(item, idx);
              }}
            >
              <div className={itemClassName}>
                {renderItem(item, index, isSelected)}
              </div>
            </AnimatedItem>
          );
        })}
      </div>

      {/* 漸變邊緣效果 */}
      {showGradients && (
        <>
          {/* 頂部漸變 */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-300 ease"
            style={{
              height: `${gradientHeight.top}px`,
              background: `linear-gradient(to bottom, ${gradientColor}, transparent)`,
              opacity: topGradientOpacity,
            }}
          />
          {/* 底部漸變 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-300 ease"
            style={{
              height: `${gradientHeight.bottom}px`,
              background: `linear-gradient(to top, ${gradientColor}, transparent)`,
              opacity: bottomGradientOpacity,
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default AnimatedList;
