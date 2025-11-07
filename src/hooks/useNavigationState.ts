/**
 * useNavigationState - Navigation State Hook
 * Spec: mobile-native-app-layout
 * Phase 2: Page Transition Animations
 * 
 * Tracks navigation direction and state for page transitions
 */

'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export type NavigationDirection = 'forward' | 'backward' | 'none';

interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  direction: NavigationDirection;
  isTabSwitch: boolean;
}

const BOTTOM_NAV_ROUTES = ['/', '/cards', '/readings', '/achievements', '/profile'];

/**
 * Hook to track navigation state and direction
 * Used for determining page transition animations
 */
export function useNavigationState(): NavigationState {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState>({
    currentRoute: pathname,
    previousRoute: null,
    direction: 'none',
    isTabSwitch: false
  });
  
  const historyIndexRef = useRef(0);
  const routeHistoryRef = useRef<string[]>([pathname]);

  useEffect(() => {
    if (pathname === state.currentRoute) return;

    const isCurrentTab = BOTTOM_NAV_ROUTES.includes(pathname);
    const isPreviousTab = state.currentRoute ? BOTTOM_NAV_ROUTES.includes(state.currentRoute) : false;
    const isTabSwitch = isCurrentTab && isPreviousTab;

    // Determine direction based on route depth
    let direction: NavigationDirection = 'none';
    
    if (isTabSwitch) {
      // Tab switches don't have forward/backward direction
      direction = 'none';
    } else {
      // Check if route exists in history (backward navigation)
      const existingIndex = routeHistoryRef.current.indexOf(pathname);
      
      if (existingIndex !== -1 && existingIndex < historyIndexRef.current) {
        direction = 'backward';
        historyIndexRef.current = existingIndex;
        routeHistoryRef.current = routeHistoryRef.current.slice(0, existingIndex + 1);
      } else {
        // New route or forward navigation
        direction = 'forward';
        historyIndexRef.current++;
        routeHistoryRef.current.push(pathname);
        
        // Keep history limited to 50 items
        if (routeHistoryRef.current.length > 50) {
          routeHistoryRef.current.shift();
          historyIndexRef.current--;
        }
      }
    }

    setState({
      currentRoute: pathname,
      previousRoute: state.currentRoute,
      direction,
      isTabSwitch
    });
  }, [pathname, state.currentRoute]);

  return state;
}

/**
 * Hook to remember scroll position for each route
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    // Save current scroll position before route changes
    const handleScroll = () => {
      scrollPositions.current[pathname] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    // Restore scroll position for this route
    const savedPosition = scrollPositions.current[pathname];
    
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant' as ScrollBehavior
        });
      });
    } else {
      // New route - scroll to top
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return {
    savePosition: (route: string, position: number) => {
      scrollPositions.current[route] = position;
    },
    getPosition: (route: string) => scrollPositions.current[route] ?? 0,
    clearPosition: (route: string) => {
      delete scrollPositions.current[route];
    }
  };
}
