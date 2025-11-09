'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { PixelIcon } from '@/components/ui/icons'
import MarkdownEditor from './MarkdownEditor'
import type { Wish } from '@/stores/wishlistStore'

/**
 * WishCard Props
 */
export interface WishCardProps {
  /** 願望資料 */
  wish: Wish

  /** 編輯願望回調 */
  onEdit?: (wishId: string, content: string) => Promise<void>

  /** 載入狀態 */
  isLoading?: boolean
}

/**
 * 格式化時間為 YYYY-MM-DD HH:mm
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)

  // 轉換為 UTC+8
  const utc8Offset = 8 * 60 * 60 * 1000
  const utc8Date = new Date(date.getTime() + utc8Offset)

  const year = utc8Date.getUTCFullYear()
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utc8Date.getUTCDate()).padStart(2, '0')
  const hours = String(utc8Date.getUTCHours()).padStart(2, '0')
  const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * WishCard 元件
 *
 * **功能**:
 * - 顯示願望內容（Markdown 渲染）
 * - 顯示提交時間（YYYY-MM-DD HH:mm）
 * - 顯示管理員回覆（如有，使用不同背景色）
 * - 顯示「已編輯」標籤
 * - 顯示編輯按鈕（僅當無回覆且未編輯過）
 * - 點擊編輯後展開編輯模式
 *
 * **使用範例**:
 * ```tsx
 * <WishCard
 *   wish={wish}
 *   onEdit={async (wishId, content) => {
 *     await wishlistStore.updateWish(wishId, content)
 *   }}
 * />
 * ```
 */
export default function WishCard({
  wish,
  onEdit,
  isLoading = false,
}: WishCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(wish.content)

  // 是否可以編輯
  const canEdit = !wish.admin_reply && !wish.has_been_edited

  // 處理開始編輯
  const handleStartEdit = () => {
    setEditContent(wish.content)
    setIsEditing(true)
  }

  // 處理取消編輯
  const handleCancelEdit = () => {
    setEditContent(wish.content)
    setIsEditing(false)
  }

  // 處理儲存編輯
  const handleSaveEdit = async (content: string) => {
    if (onEdit) {
      await onEdit(wish.id, content)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border border-pip-boy-green/30 rounded-lg bg-black/30">
      {/* 願望標題列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PixelIcon name="file-text" sizePreset="sm" variant="primary" decorative />
          <span className="text-sm text-pip-boy-green/70">
            提交時間：{formatDateTime(wish.created_at)}
          </span>
        </div>

        {/* 已編輯標籤 */}
        {wish.has_been_edited && (
          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <PixelIcon name="pencil" sizePreset="xs" variant="warning" decorative />
            <span>已編輯</span>
          </div>
        )}
      </div>

      {/* 願望內容區 */}
      {isEditing ? (
        // 編輯模式
        <MarkdownEditor
          initialContent={editContent}
          onChange={setEditContent}
          maxLength={500}
          submitButtonText="儲存"
          onSubmit={handleSaveEdit}
          isLoading={isLoading}
          showCancelButton
          onCancel={handleCancelEdit}
          placeholder="編輯你的願望..."
        />
      ) : (
        // 顯示模式
        <>
          <div className="prose prose-invert prose-sm max-w-none text-pip-boy-green/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            >
              {wish.content}
            </ReactMarkdown>
          </div>

          {/* 編輯按鈕 */}
          {canEdit && !isEditing && (
            <div className="flex justify-end">
              <button
                onClick={handleStartEdit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PixelIcon name="pencil" sizePreset="sm" decorative />
                <span>編輯</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 管理員回覆區（如有） */}
      {wish.admin_reply && (
        <div className="mt-2 p-4 border-l-4 border-radiation-orange bg-radiation-orange/5 rounded">
          <div className="flex items-center gap-2 mb-3">
            <PixelIcon name="shield-user" sizePreset="sm" variant="secondary" decorative />
            <span className="text-sm font-bold text-radiation-orange">
              管理員回覆
            </span>
            {wish.admin_reply_timestamp && (
              <span className="text-xs text-radiation-orange/70 ml-auto">
                {formatDateTime(wish.admin_reply_timestamp)}
              </span>
            )}
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-radiation-orange/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            >
              {wish.admin_reply}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
