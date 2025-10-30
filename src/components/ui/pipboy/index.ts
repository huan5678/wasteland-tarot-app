/**
 * Pip-Boy UI Component System
 *
 * Vault-Tec 認證的終端機風格 UI 元件系統，整合 CVA 變體管理、
 * Radix UI Primitives、音效系統，與完整的無障礙支援。
 *
 * @module @/components/ui/pipboy
 *
 * ## 快速開始
 *
 * ### 表單範例
 *
 * ```tsx
 * import {
 *   PipBoyLabel,
 *   PipBoyInput,
 *   PipBoySelect,
 *   PipBoySelectTrigger,
 *   PipBoySelectValue,
 *   PipBoySelectContent,
 *   PipBoySelectItem,
 *   PipBoyButton
 * } from '@/components/ui/pipboy'
 *
 * function LoginForm() {
 *   return (
 *     <form className="space-y-4">
 *       <div>
 *         <PipBoyLabel htmlFor="username" required>
 *           使用者名稱
 *         </PipBoyLabel>
 *         <PipBoyInput
 *           id="username"
 *           placeholder="輸入使用者名稱"
 *         />
 *       </div>
 *
 *       <div>
 *         <PipBoyLabel htmlFor="role">
 *           角色
 *         </PipBoyLabel>
 *         <PipBoySelect>
 *           <PipBoySelectTrigger id="role">
 *             <PipBoySelectValue placeholder="選擇角色" />
 *           </PipBoySelectTrigger>
 *           <PipBoySelectContent>
 *             <PipBoySelectItem value="overseer">監督者</PipBoySelectItem>
 *             <PipBoySelectItem value="dweller">避難所居民</PipBoySelectItem>
 *           </PipBoySelectContent>
 *         </PipBoySelect>
 *       </div>
 *
 *       <PipBoyButton type="submit" variant="default" size="lg">
 *         登入終端機
 *       </PipBoyButton>
 *     </form>
 *   )
 * }
 * ```
 *
 * ### 對話框範例
 *
 * ```tsx
 * import {
 *   PipBoyDialog,
 *   PipBoyDialogTrigger,
 *   PipBoyDialogContent,
 *   PipBoyDialogHeader,
 *   PipBoyDialogTitle,
 *   PipBoyDialogDescription,
 *   PipBoyDialogFooter,
 *   PipBoyButton
 * } from '@/components/ui/pipboy'
 *
 * function DeleteConfirmation() {
 *   return (
 *     <PipBoyDialog>
 *       <PipBoyDialogTrigger asChild>
 *         <PipBoyButton variant="destructive">
 *           刪除資料
 *         </PipBoyButton>
 *       </PipBoyDialogTrigger>
 *       <PipBoyDialogContent>
 *         <PipBoyDialogHeader>
 *           <PipBoyDialogTitle>確認刪除？</PipBoyDialogTitle>
 *           <PipBoyDialogDescription>
 *             此操作無法復原。資料將永久從 Vault-Tec 資料庫中移除。
 *           </PipBoyDialogDescription>
 *         </PipBoyDialogHeader>
 *         <PipBoyDialogFooter>
 *           <PipBoyButton variant="outline">取消</PipBoyButton>
 *           <PipBoyButton variant="destructive">確認刪除</PipBoyButton>
 *         </PipBoyDialogFooter>
 *       </PipBoyDialogContent>
 *     </PipBoyDialog>
 *   )
 * }
 * ```
 *
 * ### 卡片列表範例
 *
 * ```tsx
 * import {
 *   PipBoyCard,
 *   PipBoyCardHeader,
 *   PipBoyCardTitle,
 *   PipBoyCardDescription,
 *   PipBoyCardContent,
 *   PipBoyCardFooter,
 *   PipBoyButton,
 *   PipBoyLoading
 * } from '@/components/ui/pipboy'
 *
 * function TarotCardList({ cards, isLoading }) {
 *   if (isLoading) {
 *     return <PipBoyLoading variant="spinner" text="載入卡牌資料..." />
 *   }
 *
 *   return (
 *     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 *       {cards.map((card) => (
 *         <PipBoyCard
 *           key={card.id}
 *           variant="interactive"
 *           isClickable
 *           onClick={() => handleCardClick(card.id)}
 *         >
 *           <PipBoyCardHeader>
 *             <PipBoyCardTitle>{card.name}</PipBoyCardTitle>
 *             <PipBoyCardDescription>
 *               {card.arcana}
 *             </PipBoyCardDescription>
 *           </PipBoyCardHeader>
 *           <PipBoyCardContent>
 *             <p>{card.description}</p>
 *           </PipBoyCardContent>
 *           <PipBoyCardFooter>
 *             <PipBoyButton variant="ghost" size="sm">
 *               查看詳情
 *             </PipBoyButton>
 *           </PipBoyCardFooter>
 *         </PipBoyCard>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * ## 設計原則
 *
 * - **CVA 變體系統**: 使用 class-variance-authority 管理變體與尺寸
 * - **Radix UI Primitives**: 基於 Radix UI 提供無障礙支援
 * - **音效整合**: 整合 useAudioEffect hook 提供互動音效
 * - **Cubic 11 字體**: 使用 Cubic 11 點陣字體保持視覺一致性
 * - **Pip-Boy Green 配色**: 統一使用 Pip-Boy Green 終端機色彩
 * - **React 19 支援**: 支援 ref-as-prop 與最新 React 模式
 */

// ============================================================================
// Button Components
// ============================================================================

/**
 * PipBoyButton - Pip-Boy 風格按鈕元件
 *
 * 支援 9 個變體、6 個尺寸，整合音效系統。
 *
 * @example
 * ```tsx
 * // 主要按鈕
 * <PipBoyButton variant="default" size="lg">
 *   開始解讀
 * </PipBoyButton>
 *
 * // 次要按鈕
 * <PipBoyButton variant="outline">
 *   取消
 * </PipBoyButton>
 *
 * // 錯誤操作
 * <PipBoyButton variant="destructive">
 *   刪除
 * </PipBoyButton>
 * ```
 */
export {
  PipBoyButton,
  PipBoyIconButton,
  type PipBoyButtonProps,
  type PipBoyIconButtonProps,
  type ButtonVariant,
  type ButtonSize,
  buttonVariants,
} from './PipBoyButton'

// ============================================================================
// Card Components
// ============================================================================

/**
 * PipBoyCard - Pip-Boy 風格卡片容器元件
 *
 * 支援 4 個變體、5 個 padding 選項，雙層綠色邊框與終端機背景。
 *
 * @example
 * ```tsx
 * // 標準卡片
 * <PipBoyCard>
 *   <PipBoyCardHeader>
 *     <PipBoyCardTitle>卡片標題</PipBoyCardTitle>
 *     <PipBoyCardDescription>描述文字</PipBoyCardDescription>
 *   </PipBoyCardHeader>
 *   <PipBoyCardContent>
 *     <p>卡片內容</p>
 *   </PipBoyCardContent>
 *   <PipBoyCardFooter>
 *     <PipBoyButton>操作按鈕</PipBoyButton>
 *   </PipBoyCardFooter>
 * </PipBoyCard>
 *
 * // 互動卡片
 * <PipBoyCard variant="interactive" isClickable onClick={handleClick}>
 *   <PipBoyCardTitle>點擊我</PipBoyCardTitle>
 * </PipBoyCard>
 * ```
 */
export {
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,
  PipBoyCardFooter,
  type PipBoyCardProps,
  type PipBoyCardHeaderProps,
  type PipBoyCardFooterProps,
  type CardVariant,
  type CardPadding,
  cardVariants,
} from './PipBoyCard'

// ============================================================================
// Loading Components
// ============================================================================

/**
 * PipBoyLoading - 統一載入元件
 *
 * 支援 4 個變體：spinner（旋轉圖示）、dots（點動畫）、
 * skeleton（骨架屏）、overlay（全屏遮罩）。
 *
 * @example
 * ```tsx
 * // 旋轉載入圖示
 * <PipBoyLoading variant="spinner" size="md" text="載入中..." />
 *
 * // 點動畫
 * <PipBoyLoading variant="dots" text="處理中" />
 *
 * // 骨架屏（卡片列表）
 * <PipBoyLoading variant="skeleton" skeletonType="card-list" />
 *
 * // 全屏遮罩
 * <PipBoyLoading variant="overlay" text="同步資料..." />
 * ```
 */
export {
  PipBoyLoading,
  type PipBoyLoadingProps,
  type SkeletonType,
} from './PipBoyLoading'

// ============================================================================
// Dialog Components
// ============================================================================

/**
 * PipBoyDialog - Vault-Tec 品牌風格對話框
 *
 * 基於 Radix UI Dialog Primitive，提供完整無障礙支援。
 *
 * @example
 * ```tsx
 * <PipBoyDialog>
 *   <PipBoyDialogTrigger asChild>
 *     <PipBoyButton>開啟對話框</PipBoyButton>
 *   </PipBoyDialogTrigger>
 *   <PipBoyDialogContent>
 *     <PipBoyDialogHeader>
 *       <PipBoyDialogTitle>標題</PipBoyDialogTitle>
 *       <PipBoyDialogDescription>描述文字</PipBoyDialogDescription>
 *     </PipBoyDialogHeader>
 *     <div className="py-4">
 *       <!-- 對話框內容 -->
 *     </div>
 *     <PipBoyDialogFooter>
 *       <PipBoyButton variant="outline">取消</PipBoyButton>
 *       <PipBoyButton>確認</PipBoyButton>
 *     </PipBoyDialogFooter>
 *   </PipBoyDialogContent>
 * </PipBoyDialog>
 * ```
 */
export {
  PipBoyDialog,
  PipBoyDialogPortal,
  PipBoyDialogOverlay,
  PipBoyDialogTrigger,
  PipBoyDialogClose,
  PipBoyDialogContent,
  PipBoyDialogHeader,
  PipBoyDialogFooter,
  PipBoyDialogTitle,
  PipBoyDialogDescription,
} from './PipBoyDialog'

// ============================================================================
// Form Components
// ============================================================================

/**
 * PipBoyInput - Pip-Boy 終端機風格輸入框
 *
 * 對齊 shadcn/ui Input API，支援錯誤狀態與無障礙屬性。
 *
 * @example
 * ```tsx
 * // 基礎輸入框
 * <PipBoyInput
 *   type="text"
 *   placeholder="輸入訊息..."
 * />
 *
 * // 錯誤狀態
 * <PipBoyInput
 *   type="email"
 *   error="請輸入有效的電子郵件地址"
 *   aria-invalid="true"
 * />
 *
 * // 與 Label 配合使用
 * <div>
 *   <PipBoyLabel htmlFor="username" required>使用者名稱</PipBoyLabel>
 *   <PipBoyInput id="username" />
 * </div>
 * ```
 */
export {
  PipBoyInput,
  type PipBoyInputProps,
} from './PipBoyInput'

/**
 * PipBoySelect - Pip-Boy 終端機風格下拉選單
 *
 * 基於 Radix UI Select Primitive，提供完整鍵盤導航與無障礙支援。
 *
 * @example
 * ```tsx
 * // 基礎下拉選單
 * <PipBoySelect>
 *   <PipBoySelectTrigger>
 *     <PipBoySelectValue placeholder="選擇選項" />
 *   </PipBoySelectTrigger>
 *   <PipBoySelectContent>
 *     <PipBoySelectItem value="option1">選項 1</PipBoySelectItem>
 *     <PipBoySelectItem value="option2">選項 2</PipBoySelectItem>
 *   </PipBoySelectContent>
 * </PipBoySelect>
 *
 * // 分組選單
 * <PipBoySelect>
 *   <PipBoySelectTrigger>
 *     <PipBoySelectValue placeholder="選擇角色" />
 *   </PipBoySelectTrigger>
 *   <PipBoySelectContent>
 *     <PipBoySelectGroup>
 *       <PipBoySelectLabel>管理者</PipBoySelectLabel>
 *       <PipBoySelectItem value="admin">系統管理員</PipBoySelectItem>
 *       <PipBoySelectItem value="overseer">監督者</PipBoySelectItem>
 *     </PipBoySelectGroup>
 *     <PipBoySelectSeparator />
 *     <PipBoySelectGroup>
 *       <PipBoySelectLabel>一般使用者</PipBoySelectLabel>
 *       <PipBoySelectItem value="dweller">避難所居民</PipBoySelectItem>
 *     </PipBoySelectGroup>
 *   </PipBoySelectContent>
 * </PipBoySelect>
 * ```
 */
export {
  PipBoySelect,
  PipBoySelectGroup,
  PipBoySelectValue,
  PipBoySelectTrigger,
  PipBoySelectContent,
  PipBoySelectLabel,
  PipBoySelectItem,
  PipBoySelectSeparator,
  PipBoySelectScrollUpButton,
  PipBoySelectScrollDownButton,
} from './PipBoySelect'

/**
 * PipBoyLabel - Pip-Boy 終端機風格標籤
 *
 * 基於 Radix UI Label Primitive，提供正確的表單關聯。
 *
 * @example
 * ```tsx
 * // 基礎標籤
 * <PipBoyLabel htmlFor="email">
 *   電子郵件
 * </PipBoyLabel>
 * <PipBoyInput id="email" type="email" />
 *
 * // 必填標籤（顯示紅色 *）
 * <PipBoyLabel htmlFor="password" required>
 *   密碼
 * </PipBoyLabel>
 * <PipBoyInput id="password" type="password" />
 * ```
 */
export {
  PipBoyLabel,
  type PipBoyLabelProps,
} from './PipBoyLabel'

// ============================================================================
// Legacy Components (Backward Compatibility)
// ============================================================================

/**
 * LoadingSpinner - 舊版載入元件（向後兼容）
 *
 * @deprecated 使用 PipBoyLoading 替代
 *
 * 這些元件保留用於向後兼容，建議新專案使用 PipBoyLoading。
 */
export {
  LoadingSpinner,
  LoadingDots,
  LoadingOverlay,
  LoadingSkeleton,
  type LoadingSpinnerProps,
  type LoadingDotsProps,
  type LoadingOverlayProps,
  type LoadingSkeletonProps,
} from './LoadingSpinner'

/**
 * ErrorDisplay - 舊版錯誤顯示元件（向後兼容）
 *
 * @deprecated 建議使用 PipBoyCard + PipBoyDialog 組合替代
 *
 * 這些元件保留用於向後兼容，未來可能移除。
 */
export {
  ErrorDisplay,
  ErrorBoundaryFallback,
  InlineError,
  NotFound,
  type ErrorDisplayProps,
  type ErrorBoundaryFallbackProps,
  type InlineErrorProps,
  type NotFoundProps,
} from './ErrorDisplay'
