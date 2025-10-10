'use client'

import React, { useState, useEffect } from 'react'
import { animated, useSpring, useTransition } from '@react-spring/web'
import {
  Home, Cards, BookOpen, User, Settings, Menu, X,
  ChevronUp, Search, Filter, Star, Calendar, Dices
} from 'lucide-react'
import { useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  isActive?: boolean
  badge?: number
}

interface MobileNavigationProps {
  currentPath?: string
  onNavigate?: (path: string) => void
  className?: string
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: '主頁', icon: <Home className="w-5 h-5" />, href: '/' },
  { id: 'cards', label: '卡牌', icon: <Cards className="w-5 h-5" />, href: '/cards' },
  { id: 'bingo', label: '賓果', icon: <Dices className="w-5 h-5" />, href: '/bingo' },
  { id: 'readings', label: '占卜', icon: <BookOpen className="w-5 h-5" />, href: '/readings' },
  { id: 'profile', label: '個人', icon: <User className="w-5 h-5" />, href: '/profile' },
]

const quickActions = [
  { id: 'new-reading', label: '新占卜', icon: <Star className="w-4 h-4" />, action: 'new-reading' },
  { id: 'daily-card', label: '每日', icon: <Calendar className="w-4 h-4" />, action: 'daily-card' },
  { id: 'search', label: '搜尋', icon: <Search className="w-4 h-4" />, action: 'search' },
  { id: 'filter', label: '篩選', icon: <Filter className="w-4 h-4" />, action: 'filter' },
]

export function MobileNavigation({
  currentPath = '/',
  onNavigate,
  className = ''
}: MobileNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const { isTouchDevice, screenSize, isIOS } = useAdvancedDeviceCapabilities()

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navigation
        setIsVisible(false)
      } else {
        // Scrolling up - show navigation
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    if (isTouchDevice) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY, isTouchDevice])

  // Animation springs
  const navSpring = useSpring({
    transform: isVisible ? 'translateY(0%)' : 'translateY(100%)',
    opacity: isVisible ? 1 : 0.9,
    config: { tension: 300, friction: 30 }
  })

  const expandSpring = useSpring({
    height: isExpanded ? 'auto' : '0px',
    opacity: isExpanded ? 1 : 0,
    config: { tension: 300, friction: 25 }
  })

  const quickActionsTransition = useTransition(showQuickActions, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
    config: { tension: 400, friction: 25 }
  })

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
    setIsExpanded(false)
    setShowQuickActions(false)
  }

  const handleQuickAction = (action: string) => {
    // Handle quick actions
    switch (action) {
      case 'new-reading':
        handleNavigation('/readings/new')
        break
      case 'daily-card':
        handleNavigation('/daily')
        break
      case 'search':
        // Trigger search modal
        break
      case 'filter':
        // Trigger filter modal
        break
    }
    setShowQuickActions(false)
  }

  return (
    <>
      {/* Quick Actions Floating Panel */}
      {quickActionsTransition((style, item) =>
        item ? (
          <animated.div
            style={style}
            className="fixed bottom-24 right-4 z-40"
          >
            <div className="bg-black/90 backdrop-blur-sm border border-pip-boy-green/30 rounded-2xl p-3 shadow-xl">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.action)}
                    className="flex flex-col items-center gap-1 p-3 text-pip-boy-green hover:bg-pip-boy-green/10 rounded-xl transition-colors"
                  >
                    {action.icon}
                    <span className="text-xs">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </animated.div>
        ) : null
      )}

      {/* Main Navigation Bar */}
      <animated.nav
        style={navSpring}
        className={`
          fixed bottom-0 left-0 right-0 z-30
          bg-black/95 backdrop-blur-sm border-t border-pip-boy-green/30
          ${isIOS ? 'pb-safe' : 'pb-4'}
          ${className}
        `}
      >
        {/* Expanded Menu */}
        <animated.div
          style={expandSpring}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-pip-boy-green/20">
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex flex-col items-center gap-2 p-3 text-pip-boy-green hover:bg-pip-boy-green/10 rounded-xl transition-colors"
                >
                  {action.icon}
                  <span className="text-xs">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </animated.div>

        {/* Main Navigation Items */}
        <div className="flex items-center justify-between px-4 py-2">
          {navigationItems.map((item) => {
            const isActive = currentPath === item.href ||
              (item.href !== '/' && currentPath.startsWith(item.href))

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'text-pip-boy-green bg-pip-boy-green/20 scale-105'
                    : 'text-pip-boy-green/70 hover:text-pip-boy-green hover:bg-pip-boy-green/10'
                  }
                `}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pip-boy-green rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded)
              setShowQuickActions(false)
            }}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
              ${isExpanded
                ? 'text-pip-boy-green bg-pip-boy-green/20'
                : 'text-pip-boy-green/70 hover:text-pip-boy-green hover:bg-pip-boy-green/10'
              }
            `}
          >
            <ChevronUp className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            <span className="text-xs">更多</span>
          </button>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`
            absolute -top-6 right-4 w-12 h-12 rounded-full
            bg-pip-boy-green text-wasteland-dark shadow-lg
            flex items-center justify-center
            transition-all duration-300 hover:scale-110 active:scale-95
            ${showQuickActions ? 'rotate-45' : ''}
          `}
          aria-label="快速操作"
        >
          <Star className="w-6 h-6" />
        </button>

        {/* Safe area padding for iOS */}
        {isIOS && <div className="h-safe-area-inset-bottom" />}
      </animated.nav>
    </>
  )
}

// Tab Bar component for simpler navigation needs
interface MobileTabBarProps {
  tabs: Array<{
    id: string
    label: string
    icon: React.ReactNode
    isActive?: boolean
    badge?: number
  }>
  onTabChange?: (tabId: string) => void
  className?: string
}

export function MobileTabBar({
  tabs,
  onTabChange,
  className = ''
}: MobileTabBarProps) {
  const { isIOS } = useAdvancedDeviceCapabilities()

  return (
    <div className={`
      bg-black/90 backdrop-blur-sm border-t border-pip-boy-green/30
      ${isIOS ? 'pb-safe' : 'pb-2'}
      ${className}
    `}>
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
              ${tab.isActive
                ? 'text-pip-boy-green bg-pip-boy-green/20 scale-105'
                : 'text-pip-boy-green/70 hover:text-pip-boy-green hover:bg-pip-boy-green/10'
              }
            `}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className={`text-xs ${tab.isActive ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 60,
  className = ''
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const refreshSpring = useSpring({
    transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
    opacity: pullDistance > 0 ? Math.min(pullDistance / threshold, 1) : 0,
    config: { tension: 300, friction: 30 }
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    setPullDistance(distance)
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      <animated.div
        style={refreshSpring}
        className="fixed top-0 left-0 right-0 z-40 bg-pip-boy-green/20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center p-4">
          <div className={`
            w-8 h-8 border-2 border-pip-boy-green rounded-full
            ${isRefreshing ? 'animate-spin border-t-transparent' : ''}
          `} />
          <span className="ml-2 text-pip-boy-green text-sm">
            {isRefreshing ? '正在更新...' : pullDistance >= threshold ? '釋放以更新' : '下拉更新'}
          </span>
        </div>
      </animated.div>

      {children}
    </div>
  )
}