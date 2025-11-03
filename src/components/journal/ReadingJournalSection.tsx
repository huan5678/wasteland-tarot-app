/**
 * ReadingJournalSection Component
 * Display and manage journal entry for a specific reading
 * Used in reading detail page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJournalStore } from '@/stores/journalStore';
import { JournalEditor } from './JournalEditor';
import { PixelIcon } from '@/components/ui/icons';
import ReactMarkdown from 'react-markdown';
import type { JournalData } from './JournalEditor';

// ============================================================================
// Constants
// ============================================================================
import { Button } from "@/components/ui/button";
const MOOD_TAG_LABELS: Record<string, string> = {
  hopeful: '充滿希望',
  anxious: '焦慮不安',
  reflective: '深思反省',
  excited: '興奮期待',
  peaceful: '平靜安詳',
  confused: '困惑迷茫',
  grateful: '感恩知足',
  uncertain: '不確定'
};

// ============================================================================
// Types
// ============================================================================

export interface ReadingJournalSectionProps {
  /** 占卜結果 ID */
  readingId: string;

  /** 是否展開（預設 false） */
  defaultExpanded?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ReadingJournalSection({
  readingId,
  defaultExpanded = false
}: ReadingJournalSectionProps) {
  // ========== State ==========
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [existingJournal, setExistingJournal] = useState<any>(null);

  // ========== Store ==========
  const {
    journals,
    isLoading,
    error,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
    clearError
  } = useJournalStore();

  // ========== Effects ==========

  // Find journal for this reading
  useEffect(() => {
    const journal = journals.find((j) => j.reading_id === readingId);
    setExistingJournal(journal || null);
  }, [journals, readingId]);

  // Fetch journals when component mounts
  useEffect(() => {
    if (isExpanded) {
      fetchJournals();
    }
  }, [isExpanded, fetchJournals]);

  // ========== Handlers ==========

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    setIsEditing(false);
  }, []);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(
    async (data: JournalData) => {
      try {
        if (existingJournal) {
          // Update existing journal
          await updateJournal(existingJournal.id, data);
        } else {
          // Create new journal
          await createJournal(readingId, data);
        }

        setIsEditing(false);
        // Refresh journal list
        await fetchJournals();
      } catch (err) {
        console.error('Failed to save journal:', err);
      }
    },
    [readingId, existingJournal, createJournal, updateJournal, fetchJournals]
  );

  const handleDelete = useCallback(async () => {
    if (!existingJournal) return;

    if (!confirm('確定要刪除此日記嗎？此操作無法復原。')) {
      return;
    }

    try {
      await deleteJournal(existingJournal.id);
      setExistingJournal(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to delete journal:', err);
    }
  }, [existingJournal, deleteJournal]);

  // ========== Render Helpers ==========

  const renderJournalView = () => {
    if (!existingJournal) {
      return (
        <div className="text-center py-8">
          <PixelIcon name="book-open" sizePreset="lg" variant="muted" decorative />
          <p className="mt-4 text-sm font-cubic text-pip-boy-green/70">
            尚未建立日記
          </p>
          <Button size="sm" variant="link"
          type="button"
          onClick={handleStartEdit}
          className="mt-4 px-4 py-2 font-cubic transition-colors"
          aria-label="建立日記">

            <PixelIcon name="add" sizePreset="xs" decorative /> 建立日記
          </Button>
        </div>);

    }

    return (
      <div className="space-y-4">
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs font-cubic text-pip-boy-green/70 pb-3 border-b border-pip-boy-green/30">
          <span>
            建立於 {new Date(existingJournal.created_at).toLocaleString('zh-TW')}
          </span>
          <div className="flex items-center gap-2">
            {existingJournal.is_private &&
            <span className="flex items-center gap-1">
                <PixelIcon name="lock" sizePreset="xs" decorative />
                私密
              </span>
            }
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-green max-w-none">
          <ReactMarkdown>{existingJournal.content}</ReactMarkdown>
        </div>

        {/* Mood Tags */}
        {existingJournal.mood_tags.length > 0 &&
        <div className="pt-4 border-t border-pip-boy-green/30">
            <p className="text-xs font-cubic text-pip-boy-green/70 mb-2">
              <PixelIcon name="mood" sizePreset="xs" decorative /> 心情標籤
            </p>
            <div className="flex flex-wrap gap-2">
              {existingJournal.mood_tags.map((tag: string) =>
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-pip-boy-green/20 text-pip-boy-green border border-pip-boy-green/50">

                  {MOOD_TAG_LABELS[tag] || tag}
                </span>
            )}
            </div>
          </div>
        }

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-pip-boy-green">
          <Button size="sm" variant="outline"
          type="button"
          onClick={handleStartEdit}
          className="px-4 py-2 border font-cubic transition-colors"
          aria-label="編輯日記">

            <PixelIcon name="edit" sizePreset="xs" decorative /> 編輯
          </Button>
          <Button size="sm" variant="outline"
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 border font-cubic transition-colors"
          aria-label="刪除日記">

            <PixelIcon name="trash" sizePreset="xs" decorative /> 刪除
          </Button>
        </div>
      </div>);

  };

  const renderEditor = () => {
    const initialData = existingJournal ?
    {
      content: existingJournal.content,
      mood_tags: existingJournal.mood_tags,
      is_private: existingJournal.is_private
    } :
    undefined;

    return (
      <JournalEditor
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        isSaving={isLoading} />);


  };

  // ========== Render ==========

  return (
    <div className="reading-journal-section bg-wasteland-dark/50 border border-pip-boy-green">
      {/* Header */}
      <Button size="lg" variant="default"
      type="button"
      onClick={handleToggleExpand}
      className="w-full px-6 py-4 flex items-center justify-between transition-colors"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? '收合日記區塊' : '展開日記區塊'}>

        <div className="flex items-center gap-3">
          <PixelIcon
            name="book-open"
            sizePreset="sm"
            variant="primary"
            decorative />

          <span className="text-lg font-cubic text-pip-boy-green">
            個人日記
          </span>
          {existingJournal &&
          <span className="px-2 py-0.5 text-xs font-cubic bg-pip-boy-green/20 text-pip-boy-green border border-pip-boy-green/50">
              已建立
            </span>
          }
        </div>

        <PixelIcon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          sizePreset="sm"
          variant="primary"
          decorative />

      </Button>

      {/* Content */}
      {isExpanded &&
      <div className="px-6 py-4 border-t border-pip-boy-green">
          {/* Error Message */}
          {error &&
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-500 text-red-500 font-cubic text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PixelIcon name="alert" sizePreset="xs" decorative />
                <span>{error.message}</span>
              </div>
              <Button size="icon" variant="default"
          type="button"
          onClick={clearError}
          className="transition-opacity"
          aria-label="關閉錯誤訊息">

                <PixelIcon name="close" sizePreset="xs" decorative />
              </Button>
            </div>
        }

          {/* Loading State */}
          {isLoading && !isEditing ?
        <div className="flex items-center justify-center py-8">
              <PixelIcon name="loader" sizePreset="lg" animation="spin" variant="primary" decorative />
              <span className="ml-3 text-sm font-cubic text-pip-boy-green/70">
                載入中...
              </span>
            </div> :
        isEditing ?
        renderEditor() :

        renderJournalView()
        }
        </div>
      }
    </div>);

}