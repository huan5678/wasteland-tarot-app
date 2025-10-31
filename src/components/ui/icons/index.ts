/**
 * Pixel Icon System - 公開 API
 *
 * 統一匯出所有圖示系統相關的元件、函式和型別
 *
 * @module icons
 */

// 主要元件
export { PixelIcon, default as PixelIconDefault } from './PixelIcon';

// 輕量版元件（Server Component 專用 - 不載入 metadata）
export { PixelIconLite } from './PixelIconLite';

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
// ⚠️ 效能優化：元資料不再透過 barrel export 匯出
// 原因：iconMetadata.ts 有 749 行（~50KB），導致所有 import { PixelIcon } 的檔案都載入元資料
// 解決：需要元資料的頁面請直接 import from './iconMetadata'
// 範例：import { ICON_METADATA, searchIcons } from '@/components/ui/icons/iconMetadata'
//
// export {
//   ICON_METADATA,
//   getIconsByCategory,
//   searchIcons,
//   getPopularIcons,
//   getIconMetadata,
//   getAllCategories,
//   getIconCount,
//   getIconCountByCategory,
// } from './iconMetadata';

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
