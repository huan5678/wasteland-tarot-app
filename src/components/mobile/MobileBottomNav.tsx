/**
 * MobileBottomNav - Native App-Style Bottom Navigation
 * Spec: mobile-native-app-layout
 * Phase 1: Bottom Navigation Integration
 * 
 * iOS/Android compliant bottom tab bar with safe area support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';
import { usePlatform } from '@/hooks/usePlatform';
import { useSafeArea } from '@/hooks/useSafeArea';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  iconName: IconName;
  href: string;
  badge?: number;
}

interface MobileBottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: '首頁', iconName: 'home', href: '/' },
  { id: 'cards', label: '卡牌', iconName: 'cards', href: '/cards' },
  { id: 'readings', label: '占卜', iconName: 'book-open', href: '/readings' },
  { id: 'achievements', label: '成就', iconName: 'trophy', href: '/achievements' },
  { id: 'profile', label: '個人', iconName: 'user', href: '/profile' }
];

export function MobileBottomNav({
  currentPath = '/',
  onNavigate,
  className = ''
}: MobileBottomNavProps) {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const platform = usePlatform();
  const safeArea = useSafeArea();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // Auto-hide navigation on scroll (optional, currently disabled)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only hide on significant downward scroll
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Disabled for now - keep navigation always visible
    // window.addEventListener('scroll', handleScroll, { passive: true });
    // return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Animation spring for hide/show
  const navSpring = useSpring({
    transform: isVisible ? 'translateY(0%)' : 'translateY(100%)',
    opacity: isVisible ? 1 : 0,
    config: { tension: 300, friction: 30 }
  });

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    
    // If already on the page, scroll to top
    if (currentPath === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <animated.nav
      style={navSpring}
      role="navigation"
      aria-label="主要導航"
      aria-roledescription="導航列，5 個分頁"
      className={cn(
        'mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30',
        'bg-black/95 border-t border-pip-boy-green/30',
        isIOS && 'backdrop-blur-xl',
        isAndroid && 'shadow-lg',
        className
      )}
      style={{
        paddingBottom: `${safeArea.bottom}px`,
        height: `${64 + safeArea.bottom}px`
      }}
    >
      {/* Main Navigation Items */}
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems.map((item, index) => {
          const isActive = currentPath === item.href ||
            (item.href !== '/' && currentPath.startsWith(item.href));

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              role="tab"
              aria-label={`分頁，${item.label}，5 之 ${index + 1}`}
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'min-w-[44px] min-h-[44px] px-3 py-2',
                'transition-all duration-200 ease-out',
                'active:scale-95',
                isActive ? 'text-pip-boy-green' : 'text-pip-boy-green/60',
                'hover:text-pip-boy-green'
              )}
            >
              <div className="relative">
                <PixelIcon 
                  name={item.iconName} 
                  size={24} 
                  decorative 
                  className={cn(
                    'transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium tracking-wide',
                isActive && 'font-bold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pip-boy-green rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </animated.nav>
  );
}
