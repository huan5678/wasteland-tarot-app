/**
 * JournalEditor Component
 * Markdown editor for tarot reading journals with mood tags and privacy settings
 */

'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { PixelIcon } from '@/components/ui/icons';

// ============================================================================
// Types & Constants
// ============================================================================

/**
 * 心情標籤白名單（與後端一致）
 */import { Button } from "@/components/ui/button";
const MOOD_TAGS = [
{ value: 'hopeful', label: '充滿希望' },
{ value: 'anxious', label: '焦慮不安' },
{ value: 'reflective', label: '深思反省' },
{ value: 'excited', label: '興奮期待' },
{ value: 'peaceful', label: '平靜安詳' },
{ value: 'confused', label: '困惑迷茫' },
{ value: 'grateful', label: '感恩知足' },
{ value: 'uncertain', label: '不確定' }] as
const;

const MAX_CONTENT_LENGTH = 10000;
const MAX_MOOD_TAGS = 5;

/**
 * 日記資料介面
 */
export interface JournalData {
  content: string;
  mood_tags: string[];
  is_private: boolean;
}

/**
 * JournalEditor Props
 */
export interface JournalEditorProps {
  /** 初始資料（編輯模式時提供） */
  initialData?: Partial<JournalData>;

  /** 儲存回調 */
  onSave: (data: JournalData) => void | Promise<void>;

  /** 取消回調 */
  onCancel: () => void;

  /** 是否正在儲存 */
  isSaving?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function JournalEditor({
  initialData,
  onSave,
  onCancel,
  isSaving = false
}: JournalEditorProps) {
  // ========== State ==========
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>(
    initialData?.mood_tags || []
  );
  const [isPrivate, setIsPrivate] = useState(initialData?.is_private ?? true);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [error, setError] = useState<string | null>(null);

  // ========== Computed ==========
  const characterCount = content.length;
  const isOverLimit = characterCount > MAX_CONTENT_LENGTH;
  const canSave = content.trim().length > 0 && !isOverLimit && !isSaving;

  // ========== Handlers ==========

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);
  }, []);

  const toggleMoodTag = useCallback((tag: string) => {
    setSelectedMoodTags((prev) => {
      if (prev.includes(tag)) {
        // Remove tag
        return prev.filter((t) => t !== tag);
      } else {
        // Add tag (check limit)
        if (prev.length >= MAX_MOOD_TAGS) {
          setError(`最多只能選擇 ${MAX_MOOD_TAGS} 個標籤`);
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return [...prev, tag];
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      if (content.trim().length === 0) {
        setError('請輸入日記內容');
      }
      return;
    }

    const journalData: JournalData = {
      content,
      mood_tags: selectedMoodTags,
      is_private: isPrivate
    };

    await onSave(journalData);
  }, [content, selectedMoodTags, isPrivate, canSave, onSave]);

  // ========== Render ==========

  return (
    <div className="journal-editor space-y-6" role="form">
      {/* Edit/Preview Mode Toggle */}
      <div className="flex gap-2 border-b border-pip-boy-green pb-2">
        <Button size="default" variant="default"
        type="button"
        onClick={() => setMode('edit')}
        className="{expression}"




        aria-label="編輯模式">

          <PixelIcon name="edit" sizePreset="xs" decorative /> 編輯
        </Button>
        <Button size="default" variant="default"
        type="button"
        onClick={() => setMode('preview')}
        className="{expression}"




        aria-label="預覽模式">

          <PixelIcon name="eye" sizePreset="xs" decorative /> 預覽
        </Button>
      </div>

      {/* Content Editor/Preview */}
      <div className="min-h-[300px]">
        {mode === 'edit' ?
        <div className="space-y-2">
            <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="寫下你的塔羅感想...

支援 Markdown 語法：
# 標題
**粗體** *斜體*
- 列表項目"





            className="w-full min-h-[300px] px-4 py-3 bg-wasteland-dark/50 border border-pip-boy-green text-pip-boy-green font-cubic text-sm resize-y focus:outline-none focus:ring-2 focus:ring-pip-boy-green"
            aria-label="日記內容" />


            {/* Character Count */}
            <div className="flex justify-between text-xs font-cubic">
              <span
              className={
              isOverLimit ? 'text-red-500' : 'text-pip-boy-green/70'
              }>

                {characterCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
              </span>
              {isOverLimit &&
            <span className="text-red-500">超過字數限制</span>
            }
            </div>
          </div> :

        <div
          className="prose prose-invert prose-green max-w-none px-4 py-3 bg-wasteland-dark/50 border border-pip-boy-green min-h-[300px] font-cubic text-pip-boy-green"
          aria-label="預覽">

            {content ?
          <ReactMarkdown>{content}</ReactMarkdown> :

          <p className="text-pip-boy-green/50">尚無內容...</p>
          }
          </div>
        }
      </div>

      {/* Mood Tags Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-cubic text-pip-boy-green">
          <PixelIcon name="mood" sizePreset="xs" decorative /> 心情標籤（最多 {MAX_MOOD_TAGS} 個）
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map(({ value, label }) => {
            const isSelected = selectedMoodTags.includes(value);
            return (
              <Button size="icon" variant="default"
              key={value}
              type="button"
              onClick={() => toggleMoodTag(value)}
              className="{expression}"




              aria-label={label}>

                {label}
              </Button>);

          })}
        </div>
      </div>

      {/* Privacy Toggle */}
      <div className="flex items-center gap-3">
        <label htmlFor="privacy-toggle" className="flex items-center gap-2 cursor-pointer">
          <input
            id="privacy-toggle"
            type="checkbox"
            role="switch"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-10 h-5 appearance-none bg-wasteland-dark border-2 border-pip-boy-green rounded-full relative cursor-pointer transition-colors checked:bg-pip-boy-green/30
              before:content-[''] before:absolute before:w-3 before:h-3 before:bg-pip-boy-green before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform
              checked:before:translate-x-5"


            aria-label="私密日記" />

          <span className="text-sm font-cubic text-pip-boy-green flex items-center gap-2">
            <PixelIcon name="lock" sizePreset="xs" decorative />
            私密日記
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error &&
      <div className="px-4 py-2 bg-red-900/20 border border-red-500 text-red-500 text-sm font-cubic">
          <PixelIcon name="alert" sizePreset="xs" decorative /> {error}
        </div>
      }

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-pip-boy-green">
        <Button size="icon" variant="link"
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="px-6 py-2 font-cubic disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        aria-label="儲存日記">

          <PixelIcon name="save" sizePreset="xs" decorative />
          {isSaving ? '儲存中...' : '儲存'}
        </Button>
        <Button size="sm" variant="outline"
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="px-6 py-2 border font-cubic disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="取消">

          取消
        </Button>
      </div>
    </div>);

}