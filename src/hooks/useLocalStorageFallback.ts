/**
 * LocalStorage Fallback Hook
 * Provides automatic backup to LocalStorage when backend save fails
 *
 * Features:
 * - Automatic backup on save failure
 * - Retry pending backups when online
 * - Expiration handling (24 hours)
 * - Integration with offline detection
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useOfflineDetection } from './useOfflineDetection';

interface PendingReading {
  reading: any;
  timestamp: number;
}

const BACKUP_KEY = 'pending_reading_backup';
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface UseLocalStorageFallbackReturn {
  saveReadingWithFallback: (
    reading: any,
    saveToBackend: (r: any) => Promise<void>
  ) => Promise<void>;
  hasPendingBackup: boolean;
  clearBackup: () => void;
}

/**
 * Hook for automatic LocalStorage backup when backend save fails
 * @returns Save function with fallback, pending backup state, clear function
 */
export function useLocalStorageFallback(): UseLocalStorageFallbackReturn {
  const { isOnline, queueRequest } = useOfflineDetection();

  /**
   * Save reading with automatic LocalStorage fallback on failure
   */
  const saveReadingWithFallback = useCallback(async (
    reading: any,
    saveToBackend: (r: any) => Promise<void>
  ): Promise<void> => {
    try {
      await saveToBackend(reading);
      // Success - clear any existing backup
      localStorage.removeItem(BACKUP_KEY);
      console.log('[useLocalStorageFallback] ✅ Saved to backend successfully');
    } catch (error: any) {
      const isServerError = error.status === 500 || error.status === 503;
      const shouldBackup = isServerError || !isOnline;

      if (shouldBackup) {
        // Save to LocalStorage as backup
        const backup: PendingReading = {
          reading,
          timestamp: Date.now()
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
        console.log('[useLocalStorageFallback] 💾 Backed up to LocalStorage');

        // Queue for retry
        queueRequest(() => saveToBackend(reading));

        // Don't throw error - backup is acceptable
        return;
      }

      // Other errors should be thrown
      throw error;
    }
  }, [isOnline, queueRequest]);

  /**
   * Check if there's a pending backup
   */
  const hasPendingBackup = useCallback((): boolean => {
    return localStorage.getItem(BACKUP_KEY) !== null;
  }, []);

  /**
   * Clear backup from LocalStorage
   */
  const clearBackup = useCallback(() => {
    localStorage.removeItem(BACKUP_KEY);
    console.log('[useLocalStorageFallback] 🗑️ Backup cleared');
  }, []);

  /**
   * Check for pending backups on mount and when online
   */
  useEffect(() => {
    if (isOnline) {
      const backupStr = localStorage.getItem(BACKUP_KEY);
      if (backupStr) {
        try {
          const backup: PendingReading = JSON.parse(backupStr);

          // Check if expired
          if (Date.now() - backup.timestamp > EXPIRATION_MS) {
            console.log('[useLocalStorageFallback] ⏰ Backup expired, removing');
            localStorage.removeItem(BACKUP_KEY);
          } else {
            console.log('[useLocalStorageFallback] 📦 Found pending backup');
            // User can manually trigger sync through UI
          }
        } catch (e) {
          console.error('[useLocalStorageFallback] Failed to parse backup:', e);
          localStorage.removeItem(BACKUP_KEY);
        }
      }
    }
  }, [isOnline]);

  return {
    saveReadingWithFallback,
    hasPendingBackup: hasPendingBackup(),
    clearBackup
  };
}
