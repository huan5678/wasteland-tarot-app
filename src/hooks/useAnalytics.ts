/**
 * useAnalytics Hook
 * React hook for analytics tracking
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics/tracker';

export function useAnalytics() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());

  // Track page view on mount and path change
  useEffect(() => {
    analytics.trackPageView(pathname);
    startTimeRef.current = Date.now();

    return () => {
      // Track page duration on unmount
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      analytics.track('page_duration', 'navigation', 'duration', { path: pathname }, duration);
    };
  }, [pathname]);

  // Track reading creation
  const trackReadingCreated = useCallback((data: {
    spread_type: string;
    character_voice: string;
    question_length: number;
    card_ids: string[];
  }) => {
    analytics.trackReadingCreated(data);
  }, []);

  // Track reading completion
  const trackReadingCompleted = useCallback((data: {
    reading_id: string;
    duration: number;
    satisfaction?: number;
  }) => {
    analytics.trackReadingCompleted(data);
  }, []);

  // Track card interaction
  const trackCardInteraction = useCallback((
    action: 'viewed' | 'flipped' | 'favorited' | 'studied',
    card_id: string,
    duration?: number
  ) => {
    analytics.trackCardInteraction(action, card_id, duration);
  }, []);

  // Track social interaction
  const trackSocialInteraction = useCallback((
    action: 'shared' | 'commented' | 'liked',
    target_id: string,
    target_type: string
  ) => {
    analytics.trackSocialInteraction(action, target_id, target_type);
  }, []);

  // Track feature usage
  const trackFeatureUsage = useCallback((
    feature: string,
    action: string,
    data?: Record<string, any>
  ) => {
    analytics.trackFeatureUsage(feature, action, data);
  }, []);

  // Track custom event
  const trackEvent = useCallback((
    event_type: string,
    event_category: string,
    event_action: string,
    event_data?: Record<string, any>,
    duration?: number
  ) => {
    analytics.track(event_type, event_category, event_action, event_data, duration);
  }, []);

  return {
    trackReadingCreated,
    trackReadingCompleted,
    trackCardInteraction,
    trackSocialInteraction,
    trackFeatureUsage,
    trackEvent,
  };
}

/**
 * Hook to track time spent on a component
 */
export function useComponentTracking(componentName: string) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      analytics.track(
        'component_duration',
        'engagement',
        'duration',
        { component: componentName },
        duration
      );
    };
  }, [componentName]);
}

/**
 * Hook to track reading session
 */
export function useReadingTracking(readingId?: string) {
  const startTimeRef = useRef<number>(Date.now());
  const cardViewTimesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (readingId) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        analytics.trackReadingCompleted({
          reading_id: readingId,
          duration,
        });
      }
    };
  }, [readingId]);

  const trackCardView = useCallback((cardId: string) => {
    cardViewTimesRef.current.set(cardId, Date.now());
    analytics.trackCardInteraction('viewed', cardId);
  }, []);

  const trackCardFlip = useCallback((cardId: string) => {
    const viewTime = cardViewTimesRef.current.get(cardId);
    const duration = viewTime ? Math.floor((Date.now() - viewTime) / 1000) : undefined;
    analytics.trackCardInteraction('flipped', cardId, duration);
  }, []);

  return {
    trackCardView,
    trackCardFlip,
  };
}

/**
 * Hook to track form interactions
 */
export function useFormTracking(formName: string) {
  const startTimeRef = useRef<number>(Date.now());
  const fieldsInteractedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const trackFieldInteraction = useCallback((fieldName: string) => {
    if (!fieldsInteractedRef.current.has(fieldName)) {
      fieldsInteractedRef.current.add(fieldName);
      analytics.track(
        'form_field_interaction',
        'form',
        'interact',
        { form: formName, field: fieldName }
      );
    }
  }, [formName]);

  const trackFormSubmit = useCallback((success: boolean, errorFields?: string[]) => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    analytics.track(
      'form_submitted',
      'form',
      success ? 'submit_success' : 'submit_failure',
      {
        form: formName,
        fields_interacted: Array.from(fieldsInteractedRef.current),
        error_fields: errorFields,
      },
      duration
    );
  }, [formName]);

  const trackFormAbandonment = useCallback(() => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (fieldsInteractedRef.current.size > 0) {
      analytics.track(
        'form_abandoned',
        'form',
        'abandon',
        {
          form: formName,
          fields_interacted: Array.from(fieldsInteractedRef.current),
        },
        duration
      );
    }
  }, [formName]);

  return {
    trackFieldInteraction,
    trackFormSubmit,
    trackFormAbandonment,
  };
}

/**
 * Hook to track search interactions
 */
export function useSearchTracking(searchContext: string) {
  const trackSearch = useCallback((query: string, resultCount: number) => {
    analytics.track(
      'search_performed',
      'search',
      'query',
      {
        context: searchContext,
        query,
        result_count: resultCount,
      }
    );
  }, [searchContext]);

  const trackSearchResultClick = useCallback((query: string, resultId: string, position: number) => {
    analytics.track(
      'search_result_clicked',
      'search',
      'click',
      {
        context: searchContext,
        query,
        result_id: resultId,
        position,
      }
    );
  }, [searchContext]);

  return {
    trackSearch,
    trackSearchResultClick,
  };
}

/**
 * Hook to track modal/dialog interactions
 */
export function useModalTracking(modalName: string) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    analytics.track('modal_opened', 'modal', 'open', { modal: modalName });

    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      analytics.track(
        'modal_closed',
        'modal',
        'close',
        { modal: modalName },
        duration
      );
    };
  }, [modalName]);

  const trackModalAction = useCallback((action: string, data?: Record<string, any>) => {
    analytics.track(
      'modal_action',
      'modal',
      action,
      { modal: modalName, ...data }
    );
  }, [modalName]);

  return {
    trackModalAction,
  };
}
