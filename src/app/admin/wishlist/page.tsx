'use client'

import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useWishlistStore, type Wish } from '@/stores/wishlistStore'
import { PixelIcon } from '@/components/ui/icons'

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
 * AdminWishCard Props
 */
interface AdminWishCardProps {
  wish: Wish
}

/**
 * 管理員願望卡片元件
 *
 * 顯示使用者願望的完整資訊，包含：
 * - 使用者 ID
 * - 願望內容（Markdown 渲染）
 * - 提交時間
 * - 回覆狀態（已回覆/未回覆）
 * - 隱藏狀態（已隱藏/未隱藏）
 * - 操作按鈕（回覆、隱藏/取消隱藏）
 */
function AdminWishCard({ wish }: AdminWishCardProps) {
  // 判斷回覆狀態
  const hasReply = !!wish.admin_reply
  const replyStatus = hasReply ? '已回覆' : '未回覆'
  const replyStatusColor = hasReply ? 'text-pip-boy-green' : 'text-radiation-orange'

  // 判斷隱藏狀態
  const hiddenStatus = wish.is_hidden ? '已隱藏' : '未隱藏'
  const hiddenStatusColor = wish.is_hidden ? 'text-red-500' : 'text-pip-boy-green'

  return (
    <div className="flex flex-col gap-4 p-6 border border-pip-boy-green/30 rounded-lg bg-black/30">
      {/* 卡片標題列 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <PixelIcon name="user" sizePreset="sm" variant="primary" decorative />
          <span className="text-sm text-pip-boy-green/70">
            使用者 ID: <span className="font-mono text-pip-boy-green">{wish.user_id}</span>
          </span>
        </div>

        {/* 狀態標籤 */}
        <div className="flex items-center gap-4">
          {/* 回覆狀態 */}
          <div className="flex items-center gap-2">
            <PixelIcon
              name={hasReply ? "checkbox-circle" : "close-circle"}
              sizePreset="xs"
              variant={hasReply ? "success" : "warning"}
              decorative
            />
            <span className={`text-xs ${replyStatusColor}`}>{replyStatus}</span>
          </div>

          {/* 隱藏狀態 */}
          <div className="flex items-center gap-2">
            <PixelIcon
              name={wish.is_hidden ? "eye-off" : "eye"}
              sizePreset="xs"
              variant={wish.is_hidden ? "error" : "success"}
              decorative
            />
            <span className={`text-xs ${hiddenStatusColor}`}>{hiddenStatus}</span>
          </div>

          {/* 已編輯標籤 */}
          {wish.has_been_edited && (
            <div className="flex items-center gap-1">
              <PixelIcon name="pencil" sizePreset="xs" variant="warning" decorative />
              <span className="text-xs text-yellow-500">已編輯</span>
            </div>
          )}
        </div>
      </div>

      {/* 提交時間 */}
      <div className="flex items-center gap-2">
        <PixelIcon name="time" sizePreset="xs" variant="primary" decorative />
        <span className="text-xs text-pip-boy-green/70">
          提交時間：{formatDateTime(wish.created_at)}
        </span>
      </div>

      {/* 願望內容區 */}
      <div className="prose prose-invert prose-sm max-w-none text-pip-boy-green/90 border-t border-pip-boy-green/20 pt-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        >
          {wish.content}
        </ReactMarkdown>
      </div>

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

      {/* 操作按鈕區 */}
      <div className="flex items-center gap-3 pt-4 border-t border-pip-boy-green/20">
        {/* 回覆按鈕（或編輯回覆） */}
        <button
          className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors"
          aria-label={hasReply ? "編輯回覆" : "回覆"}
        >
          <PixelIcon
            name={hasReply ? "pencil" : "chat-1"}
            sizePreset="sm"
            decorative
          />
          <span>{hasReply ? '編輯回覆' : '回覆'}</span>
        </button>

        {/* 隱藏/取消隱藏按鈕 */}
        <button
          className={`flex items-center gap-2 px-4 py-2 border rounded transition-colors ${
            wish.is_hidden
              ? 'border-pip-boy-green/50 text-pip-boy-green hover:bg-pip-boy-green/10'
              : 'border-red-500/50 text-red-500 hover:bg-red-500/10'
          }`}
          aria-label={wish.is_hidden ? "取消隱藏" : "隱藏"}
        >
          <PixelIcon
            name={wish.is_hidden ? "eye" : "eye-off"}
            sizePreset="sm"
            decorative
          />
          <span>{wish.is_hidden ? '取消隱藏' : '隱藏'}</span>
        </button>
      </div>
    </div>
  )
}

/**
 * 管理員願望管理頁面
 *
 * 路徑：/admin/wishlist
 *
 * 功能：
 * - 顯示所有使用者的願望列表
 * - 支援篩選、排序、分頁（後續任務實作）
 * - 管理員可回覆、隱藏願望
 *
 * Requirements: 4.1, 4.6, 5.6
 */
export default function AdminWishlistPage() {
  const {
    adminWishes,
    isLoading,
    error,
    fetchAdminWishes
  } = useWishlistStore()

  // 頁面載入時自動呼叫 fetchAdminWishes()
  useEffect(() => {
    console.log('[AdminWishlistPage] 頁面載入，開始載入願望列表...')
    fetchAdminWishes()
  }, [fetchAdminWishes])

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-6">
      {/* 頁面標題 */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-2">
          <PixelIcon name="clipboard-list" sizePreset="lg" variant="primary" decorative />
          <h1 className="text-3xl font-bold text-pip-boy-green">
            願望管理
          </h1>
        </div>
        <p className="text-pip-boy-green/70">
          管理所有使用者的願望提交、回覆與狀態
        </p>
      </div>

      {/* 主要內容區 */}
      <div className="max-w-6xl mx-auto">
        {/* 載入狀態 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <PixelIcon
              name="loader-4"
              animation="spin"
              variant="primary"
              sizePreset="xl"
              decorative
            />
            <p className="text-pip-boy-green/70">載入願望列表中...</p>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && !isLoading && (
          <div className="flex items-center gap-4 p-6 border border-red-500/50 rounded-lg bg-red-500/10">
            <PixelIcon
              name="error-warning"
              variant="error"
              animation="wiggle"
              sizePreset="lg"
              decorative
            />
            <div className="flex-1">
              <h3 className="text-red-500 font-bold mb-1">載入失敗</h3>
              <p className="text-red-500/70 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 願望列表 */}
        {!isLoading && !error && (
          <>
            {adminWishes.length > 0 ? (
              <div className="space-y-6">
                {adminWishes.map((wish) => (
                  <AdminWishCard key={wish.id} wish={wish} />
                ))}
              </div>
            ) : (
              // 空狀態提示
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <PixelIcon
                  name="file-search"
                  variant="muted"
                  sizePreset="xxl"
                  decorative
                />
                <div className="text-center">
                  <h3 className="text-xl text-pip-boy-green mb-2">
                    無符合條件的願望
                  </h3>
                  <p className="text-pip-boy-green/60 text-sm">
                    目前沒有符合篩選條件的願望記錄
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
