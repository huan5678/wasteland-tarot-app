'use client';

/**
 * PixelIcon 元件
 *
 * 基於 pixelarticons 套件的 React 圖示元件
 * 提供統一的圖示介面、自動 fallback、快取機制和無障礙支援
 *
 * @module PixelIcon
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { PixelIconProps } from '../../../types/icons';
import { getIconPath, getFallbackIcon } from './iconMapping';
import { iconRegistry } from '../../../lib/iconRegistry';
import { getIconSize, composeIconClasses } from './iconUtils';

/**
 * Pixel 風格圖示元件
 *
 * 基於 pixelarticons 套件的 React 包裝器
 * 支援自動載入、快取、fallback 機制和完整的無障礙功能
 *
 * @component
 *
 * @example
 * ```tsx
 * // 基本使用
 * <PixelIcon name="home" />
 *
 * // 使用尺寸預設（Phase 6）
 * <PixelIcon name="user" sizePreset="lg" />
 *
 * // 使用動畫效果（Phase 6）
 * <PixelIcon name="reload" animation="spin" />
 * <PixelIcon name="bell" animation="bounce" variant="warning" />
 *
 * // 使用顏色變體（Phase 6）
 * <PixelIcon name="check" variant="success" />
 * <PixelIcon name="alert" variant="error" animation="wiggle" />
 *
 * // 組合使用多個 Phase 6 功能
 * <PixelIcon
 *   name="loader"
 *   sizePreset="xl"
 *   animation="spin"
 *   variant="primary"
 *   aria-label="載入中"
 * />
 *
 * // 裝飾性圖示（不需要無障礙標籤）
 * <PixelIcon name="star" decorative />
 *
 * // 互動式圖示
 * <PixelIcon
 *   name="trash"
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
}) => {
  const [iconSvg, setIconSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /**
   * 載入圖示的核心邏輯
   */
  const loadIcon = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // 嘗試從快取或伺服器載入圖示
      const svgContent = await iconRegistry.getIcon(name);
      setIconSvg(svgContent);
      setIsLoading(false);
    } catch (error) {
      console.warn(`Icon "${name}" not found, using fallback`, error);

      // 載入失敗時使用 fallback 圖示
      try {
        const fallbackPath = getFallbackIcon();
        const response = await fetch(fallbackPath);

        if (!response.ok) {
          throw new Error('Fallback icon also failed to load');
        }

        const svgContent = await response.text();
        setIconSvg(svgContent);
        setHasError(true);
        setIsLoading(false);
      } catch (fallbackError) {
        console.error('Failed to load fallback icon', fallbackError);
        setIsLoading(false);
        setHasError(true);
        setIconSvg(null);
      }
    }
  }, [name]);

  /**
   * 當圖示名稱改變時重新載入
   */
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      await loadIcon();
    };

    if (isMounted) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [loadIcon]);

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
   * 組合後的樣式
   */
  const containerStyle = useMemo(
    () => ({
      width: finalSize,
      height: finalSize,
      minWidth: finalSize,
      minHeight: finalSize,
      ...style,
    }),
    [finalSize, style]
  );

  /**
   * 組合後的 CSS 類別
   * Phase 6: Visual Polish - Animations & Variants
   */
  const containerClassName = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center';
    return composeIconClasses(baseClasses, animation, variant, className, onClick);
  }, [animation, variant, className, onClick]);

  /**
   * 如果載入中，顯示佔位符（帶動畫效果）
   */
  if (isLoading || !iconSvg) {
    return (
      <span
        className={`inline-block animate-pulse bg-pip-boy-green/20 rounded ${className}`}
        style={containerStyle}
        {...a11yProps}
      />
    );
  }

  /**
   * 如果有錯誤且沒有 SVG 內容，顯示錯誤佔位符
   */
  if (hasError && !iconSvg) {
    return (
      <span
        className={`inline-block bg-red-500/20 rounded ${className}`}
        style={containerStyle}
        title={`Icon "${name}" failed to load`}
        {...a11yProps}
      >
        <span className="text-red-500 text-xs">?</span>
      </span>
    );
  }

  /**
   * 渲染 SVG 圖示
   * 使用 dangerouslySetInnerHTML 嵌入 SVG 內容
   * SVG 使用 currentColor，因此可以通過 CSS 的 color 屬性控制顏色
   */
  return (
    <span
      className={containerClassName}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...a11yProps}
      dangerouslySetInnerHTML={{ __html: iconSvg }}
    />
  );
};

PixelIcon.displayName = 'PixelIcon';

/**
 * 導出 PixelIcon 為預設匯出（方便使用）
 */
export default PixelIcon;
