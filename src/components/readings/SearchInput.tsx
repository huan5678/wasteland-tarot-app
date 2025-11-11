'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { validateSearchInput, sanitizeInput } from '@/utils/inputValidation';

export interface SearchInputProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
  resultsCount?: number;
  placeholder?: string;
  className?: string;
}

/**
 * SearchInput - 搜尋輸入元件，支援防抖動功能
 *
 * @param onSearch - 搜尋回調函數
 * @param debounceMs - 防抖動延遲時間（毫秒），預設 300ms
 * @param resultsCount - 搜尋結果數量（選填）
 * @param placeholder - 輸入框佔位文字
 * @param className - 自訂 CSS 類別
 *
 * Requirements: 3.4 (即時搜尋與篩選，300ms debounce)
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceMs = 300,
  resultsCount,
  placeholder = '搜尋解讀記錄...',
  className = '',
}) => {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  // 🟢 Task 15.4: Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce effect
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    // Cleanup on unmount or value change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, debounceMs]);

  // Call onSearch when debounced value changes
  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  // 🟢 Task 15.4: Enhanced change handler with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Validate input
    const error = validateSearchInput(rawValue);
    if (error) {
      setValidationError(error);
      return;
    }

    // Clear error if valid
    setValidationError(null);

    // Sanitize and set value
    const sanitized = sanitizeInput(rawValue);
    setValue(sanitized);
  };

  const handleClear = useCallback(() => {
    setValue('');
    setDebouncedValue('');
    setValidationError(null);
    onSearch(''); // Call immediately without debounce
  }, [onSearch]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <PixelIcon
            name="search"
            sizePreset="sm"
            variant="muted"
            aria-label="搜尋"
            decorative
          />
        </div>

        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="搜尋解讀記錄"
          className="w-full pl-10 pr-10 py-2 border border-pip-boy-green/30 bg-black/80 text-pip-boy-green rounded-none font-mono text-sm focus:outline-none focus:border-pip-boy-green focus:ring-1 focus:ring-pip-boy-green placeholder:text-pip-boy-green/50"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="清除搜尋"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-pip-boy-green/70 hover:text-pip-boy-green transition-colors"
          >
            <PixelIcon name="close-circle" sizePreset="sm" decorative />
          </button>
        )}
      </div>

      {/* 🟢 Task 15.4: Validation Error */}
      {validationError && (
        <div
          role="alert"
          className="mt-2 text-xs text-red-400 font-mono flex items-center gap-1"
        >
          <PixelIcon name="alert-circle" sizePreset="xs" variant="error" decorative />
          {validationError}
        </div>
      )}

      {/* Results Count */}
      {resultsCount !== undefined && !validationError && (
        <div
          role="status"
          aria-live="polite"
          className="mt-2 text-xs text-pip-boy-green/70 font-mono"
        >
          找到 {resultsCount} 筆記錄
        </div>
      )}
    </div>
  );
};

SearchInput.displayName = 'SearchInput';
