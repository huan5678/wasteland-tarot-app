/**
 * JournalCard Component
 * Preview card for journal entries in list view
 */

'use client'

import { useMemo } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import type { Journal } from '@/stores/journalStore'

// ============================================================================
// Constants
// ============================================================================

const MOOD_TAG_LABELS: Record<string, string> = {
  hopeful: '充滿希望',
  anxious: '焦慮不安',
  reflective: '深思反省',
  excited: '興奮期待',
  peaceful: '平靜安詳',
  confused: '困惑迷茫',
  grateful: '感恩知足',
  uncertain: '不確定',
}

const MAX_PREVIEW_LENGTH = 100
const MAX_VISIBLE_TAGS = 3

// ============================================================================
// Helpers
// ============================================================================

/**
 * 從 Markdown 中提取純文字
 */
function stripMarkdown(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bold
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic
    .replace(/\*(.*?)\*/g, '$1')
    // Remove links
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`(.*?)`/g, '$1')
    // Clean up extra whitespace
    .replace(/\n+/g, ' ')
    .trim()
}

/**
 * 截斷文字到指定長度
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// ============================================================================
// Types
// ============================================================================

export interface JournalCardProps {
  /** 日記資料 */
  journal: Journal

  /** 點擊卡片時的回調 */
  onClick: (journal: Journal) => void
}

// ============================================================================
// Component
// ============================================================================

export function JournalCard({ journal, onClick }: JournalCardProps) {
  // ========== Computed ==========

  const preview = useMemo(() => {
    const plainText = stripMarkdown(journal.content)
    return truncateText(plainText, MAX_PREVIEW_LENGTH)
  }, [journal.content])

  const displayDate = useMemo(() => {
    return formatDate(journal.created_at)
  }, [journal.created_at])

  const visibleTags = useMemo(() => {
    return journal.mood_tags.slice(0, MAX_VISIBLE_TAGS)
  }, [journal.mood_tags])

  const remainingTagsCount = useMemo(() => {
    return Math.max(0, journal.mood_tags.length - MAX_VISIBLE_TAGS)
  }, [journal.mood_tags.length])

  // ========== Handlers ==========

  const handleClick = () => {
    onClick(journal)
  }

  // ========== Render ==========

  return (
    <article
      className="journal-card p-4 bg-wasteland-dark/50 border border-pip-boy-green hover:border-pip-boy-green/100 hover:bg-wasteland-dark/70 transition-all cursor-pointer"
      onClick={handleClick}
      role="article"
    >
      {/* Header: Date & Privacy Icon */}
      <div className="flex items-center justify-between mb-3">
        <time className="text-xs font-cubic text-pip-boy-green/70" dateTime={journal.created_at}>
          <PixelIcon name="calendar" sizePreset="xs" decorative /> {displayDate}
        </time>

        {journal.is_private && (
          <span
            className="text-pip-boy-green/70"
            aria-label="私密日記"
            title="私密日記"
          >
            <PixelIcon name="lock" sizePreset="xs" aria-label="私密" />
          </span>
        )}
      </div>

      {/* Content Preview */}
      <div className="mb-3">
        <p className="text-sm font-cubic text-pip-boy-green leading-relaxed">
          {preview}
        </p>
      </div>

      {/* Mood Tags */}
      {journal.mood_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-cubic bg-pip-boy-green/20 text-pip-boy-green border border-pip-boy-green/50"
            >
              {MOOD_TAG_LABELS[tag] || tag}
            </span>
          ))}

          {remainingTagsCount > 0 && (
            <span className="text-xs font-cubic text-pip-boy-green/70">
              +{remainingTagsCount}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
