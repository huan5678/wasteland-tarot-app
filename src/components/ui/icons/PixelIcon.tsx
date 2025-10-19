'use client';

/**
 * PixelIcon 元件
 *
 * 使用 RemixIcon CSS class name 方式的統一圖示元件
 * 規則: ri-{name}-{style}
 *
 * 優點:
 * - 直接從 RemixIcon 網頁複製名稱使用
 * - 不需要動態 import React 元件
 * - 輕量且效能更好
 * - Phase 6 功能完整保留：動畫、variant、sizePreset
 *
 * @module PixelIcon
 * @version 4.0
 */

import React, { useMemo } from 'react';
import type { PixelIconProps } from '../../../types/icons';
import { getIconSize, composeIconClasses } from './iconUtils';
import { getRemixIconClassName } from '@/lib/remixIconMapping';

/**
 * RemixIcon 風格圖示元件
 *
 * 使用 CSS class name 方式: ri-{name}-{style}
 *
 * @component
 *
 * @example
 * ```tsx
 * // 基本使用（預設 line 風格）
 * <PixelIcon name="home" />
 *
 * // Fill 風格 (實心)
 * <PixelIcon name="home" remixVariant="fill" />
 *
 * // 使用尺寸預設（Phase 6）
 * <PixelIcon name="user" sizePreset="lg" />
 *
 * // 使用動畫效果（Phase 6）
 * <PixelIcon name="loader-4" animation="spin" />
 * <PixelIcon name="notification" animation="bounce" variant="warning" />
 *
 * // 使用顏色變體（Phase 6）
 * <PixelIcon name="checkbox-circle" variant="success" />
 * <PixelIcon name="error-warning" variant="error" animation="wiggle" />
 *
 * // 組合使用多個 Phase 6 功能
 * <PixelIcon
 *   name="loader-4"
 *   sizePreset="xl"
 *   animation="spin"
 *   variant="primary"
 *   remixVariant="fill"
 *   aria-label="載入中"
 * />
 *
 * // 裝飾性圖示（不需要無障礙標籤）
 * <PixelIcon name="star" decorative />
 *
 * // 互動式圖示
 * <PixelIcon
 *   name="delete-bin"
 *   onClick={handleDelete}
 *   aria-label="刪除項目"
 *   variant="error"
 *   sizePreset="md"
 * />
 * ```
 */
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size,
  sizePreset,
  animation,
  variant,
  className = '',
  'aria-label': ariaLabel,
  decorative = false,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  remixVariant = 'line',
  ...rest
}) => {
  /**
   * 無障礙屬性
   * 根據 decorative prop 決定是裝飾性還是資訊性圖示
   */
  const a11yProps = useMemo(() => {
    if (decorative) {
      return { 'aria-hidden': true as const };
    }

    return {
      'aria-label': ariaLabel || name,
      role: 'img' as const,
    };
  }, [decorative, ariaLabel, name]);

  /**
   * 計算最終尺寸（優先使用 sizePreset）
   * Phase 6: Visual Polish - Size Presets
   */
  const finalSize = useMemo(() => getIconSize(size, sizePreset), [size, sizePreset]);

  /**
   * 組合 RemixIcon CSS class name
   * 格式: ri-{name}-{style}
   * 使用自動映射確保圖示名稱正確
   */
  const iconClassName = useMemo(() => {
    return getRemixIconClassName(name, remixVariant);
  }, [name, remixVariant]);

  /**
   * 組合後的 CSS 類別
   * Phase 6: Visual Polish - Animations & Variants
   */
  const containerClassName = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center';
    return composeIconClasses(baseClasses, animation, variant, className, onClick);
  }, [animation, variant, className, onClick]);

  /**
   * 組合後的樣式
   */
  const containerStyle = useMemo(
    () => ({
      fontSize: finalSize,
      width: finalSize,
      height: finalSize,
      minWidth: finalSize,
      minHeight: finalSize,
      lineHeight: 1,
      ...style,
    }),
    [finalSize, style]
  );

  return (
    <i
      className={`${iconClassName} ${containerClassName}`}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...a11yProps}
      {...rest}
    />
  );
};

PixelIcon.displayName = 'PixelIcon';

/**
 * 導出 PixelIcon 為預設匯出（方便使用）
 */
export default PixelIcon;
