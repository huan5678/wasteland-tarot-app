/**
 * Offline Detection Hook
 * Monitors network connectivity and manages request queue for offline scenarios
 *
 * Features:
 * - Online/offline state detection
 * - Automatic request queueing when offline
 * - Retry queued requests when back online
 * - Visual offline notice state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseOfflineDetectionReturn {
  isOnline: boolean;
  showOfflineNotice: boolean;
  queueRequest: (request: () => Promise<any>) => void;
  queuedCount: number;
  dismissNotice: () => void;
}

/**
 * Hook for detecting offline state and managing request queue
 * @returns Online state, offline notice state, queue management functions
 */
export function useOfflineDetection(): UseOfflineDetectionReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [queuedRequests, setQueuedRequests] = useState<Array<() => Promise<any>>>([]);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('[useOfflineDetection] 📡 Back online, processing queued requests...');
      setIsOnline(true);
      setShowOfflineNotice(false);

      // Retry queued requests
      if (queuedRequests.length > 0) {
        for (const request of queuedRequests) {
          try {
            await request();
          } catch (error) {
            console.error('[useOfflineDetection] Failed to retry queued request:', error);
          }
        }
        setQueuedRequests([]);
      }
    };

    const handleOffline = () => {
      console.log('[useOfflineDetection] 🔌 Connection lost');
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedRequests]);

  const queueRequest = useCallback((request: () => Promise<any>) => {
    console.log('[useOfflineDetection] 📥 Queueing request for retry');
    setQueuedRequests(prev => [...prev, request]);
  }, []);

  const dismissNotice = useCallback(() => {
    setShowOfflineNotice(false);
  }, []);

  return {
    isOnline,
    showOfflineNotice,
    queueRequest,
    queuedCount: queuedRequests.length,
    dismissNotice
  };
}
