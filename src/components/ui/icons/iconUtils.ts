/**
 * Icon Utilities
 * 圖示工具函式 - Phase 6: Visual Polish
 *
 * 提供動畫、顏色變體、尺寸預設等工具函式
 *
 * @module iconUtils
 */

import type { IconAnimation, IconColorVariant, IconSizePreset, IconSize } from '@/types/icons';

/**
 * 尺寸預設映射
 *
 * 將語意化名稱映射到像素值
 */
export const SIZE_PRESETS: Record<IconSizePreset, IconSize> = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 72,
  xxl: 96,
};

/**
 * 動畫 CSS 類別映射
 *
 * 使用 Tailwind 內建動畫和自訂 CSS
 */
export const ANIMATION_CLASSES: Record<IconAnimation, string> = {
  none: '',
  pulse: 'animate-pulse',           // Tailwind 內建脈衝
  spin: 'animate-spin',             // Tailwind 內建旋轉
  bounce: 'animate-bounce',         // Tailwind 內建彈跳
  ping: 'animate-ping',             // Tailwind 內建 ping
  fade: 'animate-fade-in-out',      // 自訂淡入淡出
  wiggle: 'animate-wiggle',         // 自訂搖晃
  float: 'animate-float',           // 自訂懸浮
};

/**
 * 顏色變體 CSS 類別映射
 *
 * 基於 Fallout Wasteland Tarot 配色方案
 * 調整為更有明顯區分度的顏色
 */
export const VARIANT_CLASSES: Record<IconColorVariant, string> = {
  default: '',                                      // 繼承當前顏色
  primary: 'text-pip-boy-green',                    // 主要色 Pip-Boy Green (#00ff88)
  secondary: 'text-radiation-orange',               // 次要色 Radiation Orange (#ff8800)
  success: 'text-pip-boy-green-bright',             // 成功 Bright Green (#00ff41)
  warning: 'text-warning-yellow',                   // 警告黃色 (#ffdd00)
  error: 'text-red-500',                            // 錯誤紅色（更深的紅）
  info: 'text-vault-blue-light',                    // 資訊藍色 Vault Blue (#0055aa)
  muted: 'text-gray-500',                           // 柔和灰色（更深的灰）
};

/**
 * 取得尺寸值
 *
 * 優先使用 sizePreset，如果沒有則使用 size，都沒有則返回預設值
 *
 * @param size - 像素尺寸
 * @param sizePreset - 尺寸預設名稱
 * @returns 最終的像素尺寸
 *
 * @example
 * ```ts
 * getIconSize(undefined, 'lg') // 48
 * getIconSize(32, undefined)   // 32
 * getIconSize(32, 'lg')        // 48 (preset 優先)
 * ```
 */
export function getIconSize(
  size?: IconSize,
  sizePreset?: IconSizePreset
): IconSize {
  if (sizePreset) {
    return SIZE_PRESETS[sizePreset];
  }
  return size ?? 24; // 預設 24px
}

/**
 * 取得動畫類別
 *
 * @param animation - 動畫類型
 * @returns CSS 類別字串
 *
 * @example
 * ```ts
 * getAnimationClass('spin')   // 'animate-spin'
 * getAnimationClass('none')   // ''
 * getAnimationClass()         // ''
 * ```
 */
export function getAnimationClass(animation?: IconAnimation): string {
  if (!animation || animation === 'none') {
    return '';
  }
  return ANIMATION_CLASSES[animation] || '';
}

/**
 * 取得顏色變體類別
 *
 * @param variant - 顏色變體
 * @returns CSS 類別字串
 *
 * @example
 * ```ts
 * getVariantClass('success')  // 'text-green-400'
 * getVariantClass('default')  // ''
 * getVariantClass()           // ''
 * ```
 */
export function getVariantClass(variant?: IconColorVariant): string {
  if (!variant || variant === 'default') {
    return '';
  }
  return VARIANT_CLASSES[variant] || '';
}

/**
 * 組合所有圖示樣式類別
 *
 * 將基礎類別、動畫、變體、自訂類別組合成最終的 className
 *
 * @param baseClass - 基礎 CSS 類別
 * @param animation - 動畫類型
 * @param variant - 顏色變體
 * @param className - 自訂 CSS 類別
 * @param onClick - 點擊處理器（如果有，會加上 cursor-pointer）
 * @returns 組合後的 className 字串
 *
 * @example
 * ```ts
 * composeIconClasses(
 *   'inline-flex items-center',
 *   'spin',
 *   'primary',
 *   'my-custom-class',
 *   handleClick
 * )
 * // 'inline-flex items-center cursor-pointer animate-spin text-pip-boy-green my-custom-class'
 * ```
 */
export function composeIconClasses(
  baseClass: string,
  animation?: IconAnimation,
  variant?: IconColorVariant,
  className?: string,
  onClick?: unknown
): string {
  const classes = [baseClass];

  // 點擊處理器存在時加上 cursor-pointer
  if (onClick) {
    classes.push('cursor-pointer');
  }

  // 動畫類別
  const animationClass = getAnimationClass(animation);
  if (animationClass) {
    classes.push(animationClass);
  }

  // 顏色變體類別
  const variantClass = getVariantClass(variant);
  if (variantClass) {
    classes.push(variantClass);
  }

  // 自訂類別
  if (className) {
    classes.push(className);
  }

  return classes.filter(Boolean).join(' ').trim();
}

/**
 * 檢查是否為有效的動畫類型
 *
 * @param value - 要檢查的值
 * @returns 是否為有效的動畫類型
 */
export function isValidAnimation(value: unknown): value is IconAnimation {
  if (typeof value !== 'string') return false;
  return Object.keys(ANIMATION_CLASSES).includes(value);
}

/**
 * 檢查是否為有效的顏色變體
 *
 * @param value - 要檢查的值
 * @returns 是否為有效的顏色變體
 */
export function isValidVariant(value: unknown): value is IconColorVariant {
  if (typeof value !== 'string') return false;
  return Object.keys(VARIANT_CLASSES).includes(value);
}

/**
 * 檢查是否為有效的尺寸預設
 *
 * @param value - 要檢查的值
 * @returns 是否為有效的尺寸預設
 */
export function isValidSizePreset(value: unknown): value is IconSizePreset {
  if (typeof value !== 'string') return false;
  return Object.keys(SIZE_PRESETS).includes(value);
}
