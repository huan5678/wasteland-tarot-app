import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { PixelIcon } from '@/components/ui/icons'

/**
 * PipBoyLoading 統一載入元件
 *
 * 整合 LoadingSpinner, LoadingDots, Skeleton, LoadingOverlay 為單一元件
 * 支援 4 個變體：spinner, dots, skeleton, overlay
 *
 * @example
 * ```tsx
 * <PipBoyLoading variant="spinner" size="md" text="載入中..." />
 * <PipBoyLoading variant="skeleton" />
 * <PipBoyLoading variant="overlay" />
 * ```
 */

const loadingVariants = cva(
  'inline-flex items-center justify-center text-pip-boy-green',
  {
    variants: {
      variant: {
        spinner: 'flex-col gap-2',
        dots: 'gap-1',
        skeleton: 'w-full',
        overlay: 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'spinner',
      size: 'md',
    },
  }
)

export type SkeletonType = 'card-list' | 'interpretation-list' | 'stat-card' | 'table'

export interface PipBoyLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  /**
   * 載入文字（使用 Cubic 11 字體）
   */
  text?: string
  /**
   * Skeleton 變體的寬度
   */
  width?: string | number
  /**
   * Skeleton 變體的高度
   */
  height?: string | number
  /**
   * Skeleton 預設配置類型
   */
  skeletonType?: SkeletonType
}

export const PipBoyLoading = ({
  className,
  variant = 'spinner',
  size = 'md',
  text,
  width,
  height,
  skeletonType,
  ...props
}: PipBoyLoadingProps) => {
  const [isReducedMotion, setIsReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (variant === 'spinner') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(loadingVariants({ variant, size }), className)}
        {...props}
      >
        <PixelIcon
          name="loader"
          sizePreset="md"
          variant="primary"
          animation={isReducedMotion ? undefined : 'spin'}
          decorative
        />
        {text && (
          <span className="text-pip-boy-green" style={{ fontFamily: 'var(--font-cubic), monospace' }}>
            {text}
          </span>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(loadingVariants({ variant, size }), className)}
        {...props}
      >
        <span
          className={cn(
            'inline-block size-2 rounded-full bg-pip-boy-green',
            !isReducedMotion && 'animate-pulse'
          )}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={cn(
            'inline-block size-2 rounded-full bg-pip-boy-green',
            !isReducedMotion && 'animate-pulse'
          )}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={cn(
            'inline-block size-2 rounded-full bg-pip-boy-green',
            !isReducedMotion && 'animate-pulse'
          )}
          style={{ animationDelay: '300ms' }}
        />
        {text && (
          <span className="ml-2 text-pip-boy-green" style={{ fontFamily: 'var(--font-cubic), monospace' }}>
            {text}
          </span>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'skeleton') {
    // 處理 skeletonType 預設配置
    if (skeletonType === 'card-list') {
      return (
        <div className={cn('space-y-4', className)} {...props}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-32 rounded bg-pip-boy-green/20',
                !isReducedMotion && 'animate-pulse',
                'motion-reduce:animate-none'
              )}
            />
          ))}
          <span className="sr-only">Loading card list...</span>
        </div>
      )
    }

    if (skeletonType === 'interpretation-list') {
      return (
        <div className={cn('space-y-3', className)} {...props}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div
                className={cn(
                  'h-4 w-3/4 rounded bg-pip-boy-green/20',
                  !isReducedMotion && 'animate-pulse',
                  'motion-reduce:animate-none'
                )}
              />
              <div
                className={cn(
                  'h-4 w-full rounded bg-pip-boy-green/20',
                  !isReducedMotion && 'animate-pulse',
                  'motion-reduce:animate-none'
                )}
              />
              <div
                className={cn(
                  'h-4 w-5/6 rounded bg-pip-boy-green/20',
                  !isReducedMotion && 'animate-pulse',
                  'motion-reduce:animate-none'
                )}
              />
            </div>
          ))}
          <span className="sr-only">Loading interpretation list...</span>
        </div>
      )
    }

    if (skeletonType === 'stat-card') {
      return (
        <div className={cn('rounded border-2 border-pip-boy-green/30 p-6', className)} {...props}>
          <div
            className={cn(
              'h-6 w-1/2 mb-4 rounded bg-pip-boy-green/20',
              !isReducedMotion && 'animate-pulse',
              'motion-reduce:animate-none'
            )}
          />
          <div
            className={cn(
              'h-12 w-full rounded bg-pip-boy-green/20',
              !isReducedMotion && 'animate-pulse',
              'motion-reduce:animate-none'
            )}
          />
          <span className="sr-only">Loading stat card...</span>
        </div>
      )
    }

    if (skeletonType === 'table') {
      return (
        <div className={cn('space-y-2', className)} {...props}>
          {/* Table header */}
          <div
            className={cn(
              'h-10 w-full rounded bg-pip-boy-green/30',
              !isReducedMotion && 'animate-pulse',
              'motion-reduce:animate-none'
            )}
          />
          {/* Table rows */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-8 w-full rounded bg-pip-boy-green/20',
                !isReducedMotion && 'animate-pulse',
                'motion-reduce:animate-none'
              )}
            />
          ))}
          <span className="sr-only">Loading table...</span>
        </div>
      )
    }

    // 預設 skeleton（自訂寬高）
    return (
      <div
        data-testid="pipboy-skeleton"
        className={cn(
          'bg-pip-boy-green/20',
          !isReducedMotion && 'animate-pulse',
          'motion-reduce:animate-none',
          className
        )}
        style={{
          width: width || '100%',
          height: height || '1rem',
        }}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'overlay') {
    return (
      <div
        data-testid="pipboy-overlay"
        className={cn(loadingVariants({ variant, size }), className)}
        {...props}
      >
        <PixelIcon
          name="loader"
          sizePreset="lg"
          variant="primary"
          animation={isReducedMotion ? undefined : 'spin'}
          decorative
        />
        {text && (
          <span className="mt-4 text-pip-boy-green text-lg" style={{ fontFamily: 'var(--font-cubic), monospace' }}>
            {text}
          </span>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return null
}

PipBoyLoading.displayName = 'PipBoyLoading'
