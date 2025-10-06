/**
 * AnalyticsProvider Component
 * Initializes analytics tracking for the entire app
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics/tracker';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize analytics on mount
  useEffect(() => {
    // Track initial page view
    analytics.trackPageView(pathname);

    // Cleanup on unmount
    return () => {
      analytics.endSession();
    };
  }, []);

  // Track route changes
  useEffect(() => {
    analytics.trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
