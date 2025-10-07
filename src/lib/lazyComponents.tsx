/**
 * Lazy Components
 * 使用動態導入 (Dynamic Import) 進行 Code Splitting
 * 減少初始載入時間，提升效能
 */

'use client'

import dynamic from 'next/dynamic'
import { ComponentType, Suspense } from 'react'

// ============================================================================
// Loading Components
// ============================================================================

/**
 * 通用載入指示器
 */
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-12 h-12 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin"></div>
  </div>
)

/**
 * 卡片載入骨架
 */
export const CardSkeleton = () => (
  <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4 animate-pulse">
    <div className="h-32 bg-pip-boy-green/20 border border-pip-boy-green/50 mb-2"></div>
    <div className="h-4 bg-pip-boy-green/20 mb-2"></div>
    <div className="h-3 bg-pip-boy-green/20 w-2/3"></div>
  </div>
)

/**
 * 模態框載入指示器
 */
export const ModalLoading = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="border-2 border-pip-boy-green bg-vault-dark p-8">
      <LoadingSpinner />
      <p className="text-pip-boy-green font-mono text-center mt-4">載入中...</p>
    </div>
  </div>
)

// ============================================================================
// Lazy Loaded Components
// ============================================================================

/**
 * Bingo 相關組件（懶載入）
 */
export const LazyBingoCardSetup = dynamic(
  () => import('@/components/bingo/BingoCardSetup'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // 客戶端渲染
  }
)

export const LazyBingoGrid = dynamic(
  () => import('@/components/bingo/BingoGrid'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyDailyCheckin = dynamic(
  () => import('@/components/bingo/DailyCheckin'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

/**
 * 音效相關組件（懶載入）
 */
export const LazyAudioControls = dynamic(
  () => import('@/components/audio/AudioControls'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyAudioVisualizer = dynamic(
  () => import('@/components/audio/AudioVisualizer'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazySpeechControls = dynamic(
  () => import('@/components/audio/SpeechControls'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

/**
 * 卡片相關組件（懶載入）
 */
export const LazyCardDetailModal = dynamic(
  () => import('@/components/cards/CardDetailModal'),
  {
    loading: () => <ModalLoading />,
    ssr: false,
  }
)

// Temporarily disabled due to encoding issues
// export const LazyMobileCardModal = dynamic(
//   () => import('@/components/layout/MobileCardModal'),
//   {
//     loading: () => <ModalLoading />,
//     ssr: false,
//   }
// )

/**
 * 分析相關組件（懶載入）
 */
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/AnalyticsDashboard'),
  {
    loading: () => <LoadingSpinner />,
    ssr: true, // 支援 SSR
  }
)

export const LazyCardFrequency = dynamic(
  () => import('@/components/analytics/CardFrequency'),
  {
    loading: () => <LoadingSpinner />,
  }
)

export const LazyReadingTrends = dynamic(
  () => import('@/components/analytics/ReadingTrends'),
  {
    loading: () => <LoadingSpinner />,
  }
)

/**
 * 3D/動畫組件（懶載入 - 這些組件較大）
 */
export const LazyPixelBlast = dynamic(
  () => import('@/components/PixelBlast'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // 必須客戶端渲染
  }
)

export const LazyDitherBackground = dynamic(
  () => import('@/components/layout/DitherBackground'),
  {
    loading: () => null, // 背景可以無載入指示器
    ssr: false,
  }
)

// ============================================================================
// Higher Order Component for Lazy Loading
// ============================================================================

/**
 * 創建懶載入組件的高階函數
 *
 * @example
 * const LazyMyComponent = createLazyComponent(
 *   () => import('./MyComponent'),
 *   { loading: CustomLoader }
 * )
 */
export function createLazyComponent<P = {}>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: () => JSX.Element
    ssr?: boolean
  }
) {
  return dynamic(loader, {
    loading: options?.loading || (() => <LoadingSpinner />),
    ssr: options?.ssr ?? true,
  })
}

// ============================================================================
// Preload Utilities
// ============================================================================

/**
 * 預載入組件（在用戶可能需要之前）
 *
 * @example
 * // 在 hover 時預載入
 * <button onMouseEnter={() => preloadComponent(LazyCardDetailModal)}>
 *   查看詳情
 * </button>
 */
export function preloadComponent(
  component: ReturnType<typeof dynamic>
): void {
  // Next.js dynamic 組件會自動支援 preload
  if ('preload' in component) {
    (component as any).preload()
  }
}

/**
 * 使用 Suspense 包裝組件
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: JSX.Element
) {
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  )
}
