/**
 * Lazy Loading Utilities
 * Optimize component loading with suspense and fallbacks
 */

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

// Loading fallback components
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wasteland-green" />
  </div>
);

export const LoadingCard = () => (
  <div className="animate-pulse bg-wasteland-dark-lighter rounded-lg p-4">
    <div className="h-4 bg-wasteland-dark-lighter rounded w-3/4 mb-2" />
    <div className="h-4 bg-wasteland-dark-lighter rounded w-1/2" />
  </div>
);

export const LoadingSkeleton = ({ height = '200px' }: { height?: string }) => (
  <div className="animate-pulse bg-wasteland-dark-lighter rounded-lg" style={{ height }} />
);

/**
 * Lazy load a component with custom loading fallback
 */
export function lazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    ssr?: boolean;
  }
) {
  const LazyComponent = dynamic(importFunc, {
    loading: () => <>{options?.fallback || <LoadingSpinner />}</>,
    ssr: options?.ssr !== false,
  });

  return (props: P) => (
    <Suspense fallback={options?.fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Lazy load with error boundary
 */
export function lazyLoadWithErrorBoundary<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    ssr?: boolean;
  }
) {
  const LazyComponent = lazyLoad(importFunc, options);

  return (props: P) => {
    try {
      return <LazyComponent {...props} />;
    } catch (error) {
      console.error('Error loading component:', error);
      return <>{options?.errorFallback || <div>Failed to load component</div>}</>;
    }
  };
}

/**
 * Preload a lazy component
 */
export function preloadComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  return importFunc();
}

/**
 * Lazy load with timeout
 */
export function lazyLoadWithTimeout<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  timeout: number = 10000,
  options?: {
    fallback?: React.ReactNode;
    timeoutFallback?: React.ReactNode;
  }
) {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Component loading timeout')), timeout)
  );

  const LazyComponent = dynamic(
    () => Promise.race([importFunc(), timeoutPromise]),
    {
      loading: () => <>{options?.fallback || <LoadingSpinner />}</>,
    }
  );

  return (props: P) => (
    <Suspense fallback={options?.fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Pre-defined lazy loaded components
export const LazyCardDetailModal = lazyLoad(
  () => import('@/components/tarot/CardDetailModal'),
  { fallback: <LoadingCard /> }
);

export const LazyReadingHistory = lazyLoad(
  () => import('@/components/readings/ReadingHistory'),
  { fallback: <LoadingSkeleton height="400px" /> }
);

export const LazySpreadSelector = lazyLoad(
  () => import('@/components/readings/SpreadSelector'),
  { fallback: <LoadingSkeleton height="300px" /> }
);

export const LazyStreamingInterpretation = lazyLoad(
  () => import('@/components/readings/StreamingInterpretation'),
  { fallback: <LoadingSkeleton height="200px" /> }
);

// Lazy load heavy components
export const LazyReadingStatsDashboard = lazyLoad(
  () => import('@/components/readings/ReadingStatsDashboard'),
  { fallback: <LoadingSkeleton height="500px" />, ssr: false }
);

export const LazyAdvancedSearchFilter = lazyLoad(
  () => import('@/components/readings/AdvancedSearchFilter'),
  { fallback: <LoadingSkeleton height="300px" />, ssr: false }
);
