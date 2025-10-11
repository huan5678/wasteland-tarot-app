/**
 * Icon Component Types
 * 圖示元件型別定義
 */

import type { CSSProperties, MouseEvent } from 'react'

/**
 * @deprecated SuitIcon is being migrated to PixelIcon system
 * SuitIcon Props Interface
 *
 * SuitIcon 元件的 props 型別定義
 */
export interface SuitIconProps {
  /**
   * PixelIcon icon name
   */
  iconName: string

  /**
   * 圖示尺寸預設值
   * - sm: 小尺寸 (32px)
   * - md: 中尺寸 (48px)
   * - lg: 大尺寸 (64-96px,響應式)
   * - xl: 超大尺寸 (80-112px,響應式)
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /**
   * 額外的 CSS 類別 (用於覆寫或擴展樣式)
   */
  className?: string

  /**
   * ARIA label (當圖示傳達重要資訊時使用)
   */
  ariaLabel?: string

  /**
   * ARIA hidden (當圖示為裝飾性或與文字並存時使用)
   * @default false
   */
  ariaHidden?: boolean
}

// ============================================================================
// Pixel Icon System Types (pixelarticons)
// ============================================================================

/**
 * 可用的 pixelarticons 圖示名稱
 *
 * 完整清單參考：https://pixelarticons.com/
 *
 * 總計 486 個圖示，這裡列出常用的圖示以提供 TypeScript 自動完成支援
 * 未列出的圖示名稱仍然有效（會回退到 string 型別）
 */
export type PixelIconName =
  // 導航 (Navigation)
  | 'home'
  | 'menu'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-bar-up'
  | 'arrow-bar-down'
  | 'arrow-bar-left'
  | 'arrow-bar-right'
  | 'backburger'
  | 'forwardburger'
  | 'forward'
  | 'external-link'
  // 使用者相關 (User)
  | 'user'
  | 'users'
  | 'user-plus'
  | 'user-minus'
  | 'user-x'
  | 'avatar'
  | 'contact'
  | 'contact-multiple'
  | 'contact-plus'
  | 'contact-delete'
  | 'login'
  | 'logout'
  // 操作 (Actions)
  | 'search'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'edit-box'
  | 'trash'
  | 'trash-alt'
  | 'delete'
  | 'download'
  | 'upload'
  | 'share'
  | 'copy'
  | 'cut'
  | 'duplicate'
  | 'duplicate-alt'
  | 'save'
  | 'print'
  | 'reload'
  | 'redo'
  | 'undo'
  | 'sync'
  // 狀態與反饋 (Status & Feedback)
  | 'check'
  | 'check-double'
  | 'checkbox'
  | 'checkbox-on'
  | 'close-box'
  | 'info-box'
  | 'alert'
  | 'warning-box'
  | 'notification'
  | 'notification-off'
  | 'loader'
  // 媒體 (Media)
  | 'image'
  | 'image-multiple'
  | 'image-plus'
  | 'image-delete'
  | 'image-gallery'
  | 'file'
  | 'file-multiple'
  | 'file-plus'
  | 'file-delete'
  | 'file-alt'
  | 'folder'
  | 'folder-plus'
  | 'folder-minus'
  | 'folder-x'
  | 'music'
  | 'play'
  | 'pause'
  | 'next'
  | 'prev'
  | 'repeat'
  | 'shuffle'
  | 'volume'
  | 'volume-1'
  | 'volume-2'
  | 'volume-3'
  | 'volume-x'
  | 'volume-plus'
  | 'volume-minus'
  | 'camera'
  | 'camera-alt'
  | 'video'
  | 'video-off'
  | 'movie'
  // 社群與通訊 (Social & Communication)
  | 'heart'
  | 'star'
  | 'message'
  | 'message-text'
  | 'message-plus'
  | 'message-minus'
  | 'message-reply'
  | 'chat'
  | 'mail'
  | 'mail-multiple'
  | 'mail-unread'
  | 'mail-check'
  | 'mail-delete'
  | 'comment'
  | 'reply'
  | 'reply-all'
  | 'deskphone'
  | 'missed-call'
  // 系統與設定 (System & Settings)
  | 'settings'
  | 'sliders'
  | 'sliders-2'
  | 'power'
  | 'lock'
  | 'lock-open'
  | 'eye'
  | 'eye-closed'
  | 'visible'
  | 'hidden'
  | 'shield'
  | 'shield-off'
  | 'bluetooth'
  | 'cast'
  | 'gps'
  // 文件與組織 (Documents & Organization)
  | 'book'
  | 'book-open'
  | 'bookmark'
  | 'bookmarks'
  | 'note'
  | 'note-plus'
  | 'note-delete'
  | 'note-multiple'
  | 'notes'
  | 'notes-plus'
  | 'notes-delete'
  | 'notes-multiple'
  | 'article'
  | 'article-multiple'
  | 'calendar'
  | 'calendar-today'
  | 'calendar-check'
  | 'calendar-plus'
  | 'calendar-minus'
  | 'clock'
  // 介面元素 (UI Elements)
  | 'grid'
  | 'list'
  | 'list-box'
  | 'table'
  | 'dashboard'
  | 'layout'
  | 'layout-sidebar-left'
  | 'layout-sidebar-right'
  | 'expand'
  | 'collapse'
  | 'more-horizontal'
  | 'more-vertical'
  | 'drag-and-drop'
  | 'move'
  // 商業 (Business)
  | 'briefcase'
  | 'cart'
  | 'credit-card'
  | 'money'
  | 'coin'
  | 'dollar'
  | 'euro'
  | 'store'
  | 'shopping-bag'
  // 其他常用圖示
  | 'flag'
  | 'gift'
  | 'trophy'
  | 'lightbulb'
  | 'bug'
  | 'code'
  | 'server'
  | 'cloud'
  | 'sun'
  | 'moon'
  // 支援所有其他 pixelarticons 圖示名稱（字串形式）
  | string;

/**
 * 圖示尺寸選項
 *
 * 基於 24x24px 的倍數，確保像素完美渲染
 */
export type IconSize = 16 | 24 | 32 | 48 | 72 | 96;

/**
 * 圖示尺寸預設名稱
 *
 * 提供語意化的尺寸名稱，方便使用
 */
export type IconSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * 圖示動畫類型
 *
 * Phase 6: Visual Polish - 動畫效果
 */
export type IconAnimation =
  | 'none'
  | 'pulse'      // 脈衝效果（適合載入、通知）
  | 'spin'       // 旋轉效果（適合載入、同步）
  | 'bounce'     // 彈跳效果（適合提示、警告）
  | 'ping'       // ping 效果（適合通知點）
  | 'fade'       // 淡入淡出（適合切換）
  | 'wiggle'     // 搖晃效果（適合錯誤、警告）
  | 'float';     // 懸浮效果（適合提示）

/**
 * 圖示顏色變體
 *
 * Phase 6: Visual Polish - 語意化顏色（高對比度版本）
 */
export type IconColorVariant =
  | 'default'     // 繼承當前顏色
  | 'primary'     // 主要色（Pip-Boy Green #00ff88）
  | 'secondary'   // 次要色（Radiation Orange #ff8800）
  | 'success'     // 成功（Bright Green #00ff41）
  | 'warning'     // 警告（Warning Yellow #ffdd00）
  | 'error'       // 錯誤（Deep Red #ef4444）
  | 'info'        // 資訊（Vault Blue #0055aa）
  | 'muted';      // 柔和（Gray #6b7280）

/**
 * 圖示分類
 *
 * 用於圖示預覽頁面的分類和過濾
 */
export enum IconCategory {
  NAVIGATION = 'navigation',
  USER = 'user',
  ACTIONS = 'actions',
  STATUS = 'status',
  MEDIA = 'media',
  SOCIAL = 'social',
  SYSTEM = 'system',
  DOCUMENTS = 'documents',
  UI_ELEMENTS = 'ui-elements',
  BUSINESS = 'business',
  OTHER = 'other',
}

/**
 * 圖示元資料介面
 *
 * 描述單個圖示的詳細資訊，用於搜尋和文件
 */
export interface IconMetadata {
  /**
   * 圖示名稱（對應 SVG 檔案名稱）
   */
  name: string;

  /**
   * 圖示分類
   */
  category: IconCategory;

  /**
   * 搜尋標籤（中英文）
   */
  tags: string[];

  /**
   * 圖示描述（繁體中文）
   */
  description: string;

  /**
   * 是否為常用圖示
   * @default false
   */
  popular?: boolean;
}

/**
 * PixelIcon 元件的 Props 介面
 */
export interface PixelIconProps {
  /**
   * 圖示名稱（pixelarticons 套件中的檔案名稱）
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" />
   * <PixelIcon name="user" />
   * ```
   */
  name: PixelIconName;

  /**
   * 圖示尺寸（像素）
   *
   * @default 24
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" size={32} />
   * ```
   */
  size?: IconSize;

  /**
   * 圖示尺寸預設（Phase 6: Visual Polish）
   *
   * 使用語意化名稱設定尺寸，會覆寫 size prop
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" sizePreset="lg" />
   * ```
   */
  sizePreset?: IconSizePreset;

  /**
   * 圖示動畫效果（Phase 6: Visual Polish）
   *
   * @default 'none'
   *
   * @example
   * ```tsx
   * <PixelIcon name="loader" animation="spin" />
   * <PixelIcon name="bell" animation="bounce" />
   * ```
   */
  animation?: IconAnimation;

  /**
   * 圖示顏色變體（Phase 6: Visual Polish）
   *
   * @default 'default'
   *
   * @example
   * ```tsx
   * <PixelIcon name="check" variant="success" />
   * <PixelIcon name="alert" variant="warning" />
   * ```
   */
  variant?: IconColorVariant;

  /**
   * 自訂 CSS 類別
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" className="text-pip-boy-green" />
   * ```
   */
  className?: string;

  /**
   * 無障礙標籤
   *
   * 互動式圖示必須提供，裝飾性圖示可省略
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" aria-label="返回首頁" />
   * ```
   */
  'aria-label'?: string;

  /**
   * 是否為裝飾性圖示（不需要無障礙標籤）
   *
   * 設為 true 時會自動加上 aria-hidden="true"
   *
   * @default false
   *
   * @example
   * ```tsx
   * <PixelIcon name="star" decorative />
   * ```
   */
  decorative?: boolean;

  /**
   * 自訂內聯樣式
   *
   * @example
   * ```tsx
   * <PixelIcon name="home" style={{ color: '#00FF00' }} />
   * ```
   */
  style?: CSSProperties;

  /**
   * 點擊事件處理器
   *
   * @example
   * ```tsx
   * <PixelIcon
   *   name="trash"
   *   onClick={(e) => handleDelete()}
   *   aria-label="刪除"
   * />
   * ```
   */
  onClick?: (event: MouseEvent<HTMLSpanElement>) => void;

  /**
   * 滑鼠懸停事件處理器
   */
  onMouseEnter?: (event: MouseEvent<HTMLSpanElement>) => void;

  /**
   * 滑鼠離開事件處理器
   */
  onMouseLeave?: (event: MouseEvent<HTMLSpanElement>) => void;
}
