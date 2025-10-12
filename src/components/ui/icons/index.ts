/**
 * Pixel Icon System - 公開 API
 *
 * 統一匯出所有圖示系統相關的元件、函式和型別
 *
 * @module icons
 */

// 主要元件
export { PixelIcon, default as PixelIconDefault } from './PixelIcon';

// 圖示工具函式（Phase 6: Visual Polish）
export {
  SIZE_PRESETS,
  ANIMATION_CLASSES,
  VARIANT_CLASSES,
  getIconSize,
  getAnimationClass,
  getVariantClass,
  composeIconClasses,
  isValidAnimation,
  isValidVariant,
  isValidSizePreset,
} from './iconUtils';

// 圖示元資料系統
export {
  ICON_METADATA,
  getIconsByCategory,
  searchIcons,
  getPopularIcons,
  getIconMetadata,
  getAllCategories,
  getIconCount,
  getIconCountByCategory,
} from './iconMetadata';

// 型別定義
export type {
  PixelIconName,
  IconSize,
  IconSizePreset,
  IconAnimation,
  IconColorVariant,
  PixelIconProps,
  IconMetadata,
} from '../../../types/icons';

export { IconCategory } from '../../../types/icons';
