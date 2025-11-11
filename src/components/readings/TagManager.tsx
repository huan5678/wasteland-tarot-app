'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  readingId: string;
  currentTags: string[];
  onTagsChange: (tags: string[]) => Promise<void> | void;
  availableTags?: string[];
  className?: string;
}

const MAX_TAGS = 20;
const MIN_TAG_LENGTH = 1;
const MAX_TAG_LENGTH = 50;

export default function TagManager({
  readingId,
  currentTags,
  onTagsChange,
  availableTags = [],
  className,
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() && availableTags.length > 0) {
      const filtered = availableTags.filter(
        tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !currentTags.includes(tag)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, availableTags, currentTags]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateTag = (tag: string): string | null => {
    if (tag.length < MIN_TAG_LENGTH || tag.length > MAX_TAG_LENGTH) {
      return `標籤長度必須在 ${MIN_TAG_LENGTH}-${MAX_TAG_LENGTH} 字元之間`;
    }
    if (currentTags.includes(tag)) {
      return '標籤已存在';
    }
    if (currentTags.length >= MAX_TAGS) {
      return `已達到標籤數量上限（${MAX_TAGS} 個）`;
    }
    return null;
  };

  const handleAddTag = async (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    const validationError = validateTag(trimmedTag);
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newTags = [...currentTags, trimmedTag];
      await onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
    } catch (err) {
      setError('新增標籤失敗，請稍後再試');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newTags = currentTags.filter(tag => tag !== tagToRemove);
      await onTagsChange(newTags);
    } catch (err) {
      setError('移除標籤失敗，請稍後再試');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  const remainingTags = MAX_TAGS - currentTags.length;
  const showWarning = remainingTags <= 5 && remainingTags > 0;

  return (
    <div className={cn('space-y-3', className)} aria-label="標籤管理">
      {/* Current Tags Display */}
      <div className="flex flex-wrap gap-2">
        {currentTags.length === 0 ? (
          <p className="text-sm text-pip-boy-green/60">尚無標籤，請新增第一個標籤</p>
        ) : (
          currentTags.map(tag => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded"
            >
              <span className="text-sm text-pip-boy-green">{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={isLoading}
                aria-label={`移除標籤 ${tag}`}
                className="hover:text-pip-boy-orange focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tag Input with Autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(suggestions.length > 0)}
          placeholder="新增標籤 (按 Enter 確認)"
          disabled={isLoading || currentTags.length >= MAX_TAGS}
          aria-label="新增標籤輸入框"
          className={cn(
            'w-full px-3 py-2 bg-black/50 border text-pip-boy-green',
            'placeholder:text-pip-boy-green/40',
            'focus:outline-none focus:border-pip-boy-green',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-pip-boy-orange' : 'border-pip-boy-green/30'
          )}
        />

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-black border border-pip-boy-green/30 rounded shadow-lg max-h-40 overflow-y-auto"
          >
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm text-pip-boy-green hover:bg-pip-boy-green/10 focus:bg-pip-boy-green/10 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="space-y-1">
        {error && (
          <p className="text-xs text-pip-boy-orange" role="alert">
            {error}
          </p>
        )}

        {showWarning && (
          <p className="text-xs text-pip-boy-orange/80">
            還可以新增 {remainingTags} 個標籤
          </p>
        )}

        {currentTags.length >= MAX_TAGS && (
          <p className="text-xs text-pip-boy-orange" role="alert">
            已達到標籤數量上限（{MAX_TAGS} 個）
          </p>
        )}
      </div>
    </div>
  );
}
