'use client'

import React, { useEffect, useState } from 'react'
import { useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures'

interface ResponsiveContainerProps {
  children: React.ReactNode
  mobileLayout?: React.ReactNode
  tabletLayout?: React.ReactNode
  desktopLayout?: React.ReactNode
  breakpoints?: {
    mobile: number
    tablet: number
  }
  className?: string
  enableSwipeNavigation?: boolean
}

export function ResponsiveContainer({
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
  breakpoints = { mobile: 640, tablet: 1024 },
  className = '',
  enableSwipeNavigation = false
}: ResponsiveContainerProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const { isTouchDevice, screenSize } = useAdvancedDeviceCapabilities()

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCurrentLayout = () => {
    if (windowSize.width <= breakpoints.mobile && mobileLayout) {
      return mobileLayout
    }
    if (windowSize.width <= breakpoints.tablet && tabletLayout) {
      return tabletLayout
    }
    if (desktopLayout) {
      return desktopLayout
    }
    return children
  }

  return (
    <div className={`
      responsive-container
      ${screenSize === 'mobile' ? 'mobile-layout' : ''}
      ${screenSize === 'tablet' ? 'tablet-layout' : ''}
      ${screenSize === 'desktop' ? 'desktop-layout' : ''}
      ${isTouchDevice ? 'touch-device' : 'non-touch-device'}
      ${className}
    `}>
      {getCurrentLayout()}
    </div>
  )
}

// Grid component with mobile-optimized breakpoints
interface MobileGridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  className?: string
}

export function MobileGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 4, tablet: 6, desktop: 8 },
  className = ''
}: MobileGridProps) {
  const { screenSize } = useAdvancedDeviceCapabilities()

  const getGridClasses = () => {
    const colClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    }

    const gapClass = {
      2: 'gap-2',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12'
    }

    const mobileCol = colClass[cols.mobile as keyof typeof colClass] || 'grid-cols-1'
    const tabletCol = colClass[cols.tablet as keyof typeof colClass] || 'md:grid-cols-2'
    const desktopCol = colClass[cols.desktop as keyof typeof colClass] || 'lg:grid-cols-3'

    const mobileGap = gapClass[gap.mobile as keyof typeof gapClass] || 'gap-4'
    const tabletGap = gapClass[gap.tablet as keyof typeof gapClass] || 'md:gap-6'
    const desktopGap = gapClass[gap.desktop as keyof typeof gapClass] || 'lg:gap-8'

    return `grid ${mobileCol} ${tabletCol} ${desktopCol} ${mobileGap} ${tabletGap} ${desktopGap}`
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  )
}

// Flexible layout component with mobile-first design
interface MobileLayoutProps {
  children: React.ReactNode
  variant?: 'stack' | 'sidebar' | 'centered' | 'fullwidth'
  spacing?: 'tight' | 'normal' | 'relaxed'
  className?: string
}

export function MobileLayout({
  children,
  variant = 'stack',
  spacing = 'normal',
  className = ''
}: MobileLayoutProps) {
  const { screenSize, isTouchDevice } = useAdvancedDeviceCapabilities()

  const getLayoutClasses = () => {
    const spacingClasses = {
      tight: 'space-y-2 md:space-y-3 lg:space-y-4',
      normal: 'space-y-4 md:space-y-6 lg:space-y-8',
      relaxed: 'space-y-6 md:space-y-8 lg:space-y-12'
    }

    const variantClasses = {
      stack: 'flex flex-col',
      sidebar: 'flex flex-col lg:flex-row lg:space-x-8 lg:space-y-0',
      centered: 'flex flex-col items-center justify-center min-h-screen',
      fullwidth: 'w-full'
    }

    return `
      ${variantClasses[variant]}
      ${spacingClasses[spacing]}
      ${isTouchDevice ? 'touch-optimized' : ''}
    `
  }

  return (
    <div className={`
      mobile-layout
      ${getLayoutClasses()}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Card container with mobile-optimized touch targets
interface MobileCardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost'
  padding?: 'none' | 'small' | 'medium' | 'large'
  touchTarget?: boolean
  onClick?: () => void
  onLongPress?: () => void
  className?: string
}

export function MobileCard({
  children,
  variant = 'elevated',
  padding = 'medium',
  touchTarget = false,
  onClick,
  onLongPress,
  className = ''
}: MobileCardProps) {
  const { isTouchDevice } = useAdvancedDeviceCapabilities()

  const getCardClasses = () => {
    const variantClasses = {
      elevated: 'bg-black/60 backdrop-blur-sm border border-pip-boy-green/20 shadow-lg',
      outlined: 'bg-transparent border-2 border-pip-boy-green/40',
      filled: 'bg-pip-boy-green/10 border border-pip-boy-green/30',
      ghost: 'bg-transparent border-none'
    }

    const paddingClasses = {
      none: '',
      small: 'p-3',
      medium: 'p-4 md:p-6',
      large: 'p-6 md:p-8'
    }

    const touchClasses = touchTarget && isTouchDevice
      ? 'min-h-[44px] cursor-pointer active:scale-95 transition-transform'
      : ''

    return `
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${touchClasses}
      rounded-lg
      ${(onClick || onLongPress) && isTouchDevice ? 'select-none' : ''}
    `
  }

  return (
    <div
      className={`${getCardClasses()} ${className}`}
      onClick={onClick}
      onContextMenu={onLongPress ? (e) => {
        e.preventDefault()
        onLongPress()
      } : undefined}
    >
      {children}
    </div>
  )
}

// Bottom sheet component for mobile
interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  snapPoints?: string[]
  initialSnap?: number
  backdrop?: boolean
  className?: string
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = ['50%', '90%'],
  initialSnap = 0,
  backdrop = true,
  className = ''
}: MobileBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap)
  const { isTouchDevice } = useAdvancedDeviceCapabilities()

  if (!isTouchDevice) {
    // Fall back to modal on desktop
    return isOpen ? (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`bg-black border border-pip-boy-green/30 rounded-lg max-w-md w-full mx-4 ${className}`}>
          {children}
        </div>
      </div>
    ) : null
  }

  return isOpen ? (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-black/95 backdrop-blur-sm border-t border-pip-boy-green/30
        rounded-t-xl transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        ${className}
      `} style={{ height: snapPoints[currentSnap] }}>
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-pip-boy-green/40 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </>
  ) : null
}

// Safe area component for iOS devices
export function SafeAreaView({
  children,
  edges = ['top', 'bottom'],
  className = ''
}: {
  children: React.ReactNode
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>
  className?: string
}) {
  const { isIOS } = useAdvancedDeviceCapabilities()

  if (!isIOS) {
    return <div className={className}>{children}</div>
  }

  const safeAreaClasses = {
    top: 'pt-safe-area-inset-top',
    bottom: 'pb-safe-area-inset-bottom',
    left: 'pl-safe-area-inset-left',
    right: 'pr-safe-area-inset-right'
  }

  const appliedClasses = edges.map(edge => safeAreaClasses[edge]).join(' ')

  return (
    <div className={`${appliedClasses} ${className}`}>
      {children}
    </div>
  )
}