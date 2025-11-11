/**
 * Error Handling Integration Example
 * Demonstrates how to use all error handling features together
 *
 * This file serves as a reference for implementing error handling
 * across the interactive reading experience.
 *
 * Features Demonstrated:
 * - API timeout handling
 * - Offline detection
 * - LocalStorage fallback
 * - Input validation
 * - Browser compatibility warnings
 * - Error boundaries
 */

'use client';

import React, { useState } from 'react';
import { useApiWithTimeout, useOfflineDetection, useLocalStorageFallback } from '@/hooks/errorHandling';
import { validateSearchInput, sanitizeInput } from '@/utils/inputValidation';
import { OfflineNotice } from '@/components/common/OfflineNotice';
import { BrowserCompatibilityWarning } from '@/components/common/BrowserCompatibilityWarning';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export const ErrorHandlingExample: React.FC = () => {
  // 🟢 Task 15.1: API timeout handling
  const { fetchWithTimeout, isTimeout, resetTimeout } = useApiWithTimeout(30000);

  // 🟢 Task 15.2: Offline detection
  const { isOnline, showOfflineNotice, queueRequest, queuedCount } = useOfflineDetection();

  // 🟢 Task 15.3: LocalStorage fallback
  const { saveReadingWithFallback, hasPendingBackup, clearBackup } = useLocalStorageFallback();

  // 🟢 Task 15.5: Browser compatibility (TTS example)
  const { browserInfo } = useTextToSpeech();

  const [searchInput, setSearchInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Example: API request with timeout handling
   */
  const handleApiRequest = async () => {
    try {
      resetTimeout();
      const response = await fetchWithTimeout('/api/v1/readings', {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('Data received:', data);
    } catch (error: any) {
      if (isTimeout) {
        console.error('Request timed out:', error);
        // Show user-friendly timeout message
      } else {
        console.error('Request failed:', error);
      }
    }
  };

  /**
   * Example: Save with LocalStorage fallback
   */
  const handleSaveReading = async (reading: any) => {
    const saveToBackend = async (r: any) => {
      const response = await fetchWithTimeout('/api/v1/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r)
      });

      if (!response.ok) {
        throw new Error('Failed to save reading');
      }
    };

    await saveReadingWithFallback(reading, saveToBackend);
  };

  /**
   * Example: Input validation
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // 🟢 Task 15.4: Validate input
    const error = validateSearchInput(rawValue);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    // 🟢 Task 15.4: Sanitize input
    const sanitized = sanitizeInput(rawValue);
    setSearchInput(sanitized);
  };

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-pip-boy-green">
          錯誤處理整合範例
        </h1>

        {/* 🟢 Task 15.2: Offline Notice */}
        <OfflineNotice />

        {/* 🟢 Task 15.5: Browser Compatibility Warning */}
        <BrowserCompatibilityWarning
          feature="語音朗讀"
          isSupported={browserInfo.isSupported}
          recommendedBrowsers={browserInfo.recommendedBrowsers}
          currentBrowser={browserInfo.currentBrowser}
        />

        {/* Status Display */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4">
          <h2 className="text-lg font-bold text-pip-boy-green mb-2">系統狀態</h2>
          <ul className="space-y-1 text-sm text-pip-boy-green/80">
            <li>連線狀態: {isOnline ? '✅ 在線' : '❌ 離線'}</li>
            <li>待重試請求: {queuedCount}</li>
            <li>待同步備份: {hasPendingBackup ? '✅ 有' : '❌ 無'}</li>
            <li>請求超時: {isTimeout ? '✅ 是' : '❌ 否'}</li>
            <li>語音支援: {browserInfo.isSupported ? '✅ 是' : '❌ 否'}</li>
          </ul>
        </div>

        {/* Example Actions */}
        <div className="space-y-2">
          <button
            onClick={handleApiRequest}
            className="px-4 py-2 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green hover:bg-pip-boy-green/20"
          >
            測試 API 請求 (30s 超時)
          </button>

          <button
            onClick={() => handleSaveReading({ test: 'data' })}
            className="px-4 py-2 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green hover:bg-pip-boy-green/20"
          >
            測試儲存 (自動備份)
          </button>

          {hasPendingBackup && (
            <button
              onClick={clearBackup}
              className="px-4 py-2 border-2 border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              清除備份
            </button>
          )}
        </div>

        {/* Search Input Example */}
        <div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="測試輸入驗證 (最多 50 字元)"
            className="w-full px-4 py-2 border-2 border-pip-boy-green bg-black text-pip-boy-green"
          />
          {validationError && (
            <p className="text-red-400 text-sm mt-1">{validationError}</p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

ErrorHandlingExample.displayName = 'ErrorHandlingExample';
