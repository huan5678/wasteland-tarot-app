'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useWishlistStore, type Wish } from '@/stores/wishlistStore'
import { PixelIcon } from '@/components/ui/icons'
import MarkdownEditor from '@/components/wishlist/MarkdownEditor'

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
  const { submitReply, toggleHidden, isLoading } = useWishlistStore()

  // 狀態：是否處於回覆模式
  const [isReplyMode, setIsReplyMode] = useState(false)
  const [replyContent, setReplyContent] = useState(wish.admin_reply || '')

  // 判斷回覆狀態
  const hasReply = !!wish.admin_reply
  const replyStatus = hasReply ? '已回覆' : '未回覆'
  const replyStatusColor = hasReply ? 'text-pip-boy-green' : 'text-radiation-orange'

  // 判斷隱藏狀態
  const hiddenStatus = wish.is_hidden ? '已隱藏' : '未隱藏'
  const hiddenStatusColor = wish.is_hidden ? 'text-red-500' : 'text-pip-boy-green'

  // 處理回覆按鈕點擊
  const handleReplyClick = useCallback(() => {
    setIsReplyMode(true)
    // 如果已有回覆，預填原內容
    if (wish.admin_reply) {
      setReplyContent(wish.admin_reply)
    }
  }, [wish.admin_reply])

  // 處理提交回覆
  const handleSubmitReply = useCallback(async (content: string) => {
    try {
      await submitReply(wish.id, content)
      setIsReplyMode(false) // 成功後關閉編輯模式
    } catch (error) {
      // 錯誤由 store 處理，此處僅記錄
      console.error('[AdminWishCard] 提交回覆失敗:', error)
      throw error // 重新拋出錯誤讓 MarkdownEditor 處理
    }
  }, [wish.id, submitReply])

  // 處理取消回覆
  const handleCancelReply = useCallback(() => {
    setIsReplyMode(false)
    // 恢復原內容
    setReplyContent(wish.admin_reply || '')
  }, [wish.admin_reply])

  // 處理隱藏/取消隱藏
  const handleToggleHidden = useCallback(async () => {
    try {
      await toggleHidden(wish.id, !wish.is_hidden)
    } catch (error) {
      console.error('[AdminWishCard] 切換隱藏狀態失敗:', error)
    }
  }, [wish.id, wish.is_hidden, toggleHidden])

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

      {/* 管理員回覆區 */}
      {!isReplyMode && wish.admin_reply && (
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

      {/* 回覆編輯模式 */}
      {isReplyMode && (
        <div className="mt-4 p-4 border border-radiation-orange/50 rounded bg-radiation-orange/5">
          <div className="flex items-center gap-2 mb-4">
            <PixelIcon name="shield-user" sizePreset="sm" variant="secondary" decorative />
            <span className="text-sm font-bold text-radiation-orange">
              {hasReply ? '編輯管理員回覆' : '新增管理員回覆'}
            </span>
          </div>

          <MarkdownEditor
            initialContent={replyContent}
            onChange={setReplyContent}
            maxLength={1000}
            submitButtonText={hasReply ? '更新回覆' : '提交回覆'}
            onSubmit={handleSubmitReply}
            isLoading={isLoading}
            placeholder="在此輸入管理員回覆（最多 1000 字）..."
            showCancelButton={true}
            onCancel={handleCancelReply}
          />
        </div>
      )}

      {/* 操作按鈕區 */}
      {!isReplyMode && (
        <div className="flex items-center gap-3 pt-4 border-t border-pip-boy-green/20">
          {/* 回覆按鈕（或編輯回覆） */}
          <button
            onClick={handleReplyClick}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
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
            onClick={handleToggleHidden}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] ${
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
      )}
    </div>
  )
}

/**
 * 篩選器元件
 */
function AdminFilters() {
  const { adminFilter, adminSort, setAdminFilter, setAdminSort } = useWishlistStore()

  // 回覆狀態篩選選項
  const REPLY_STATUS_OPTIONS = [
    { value: 'all', label: '全部' },
    { value: 'replied', label: '已回覆' },
    { value: 'unreplied', label: '未回覆' },
  ] as const

  // 排序選項
  const SORT_OPTIONS = [
    { value: 'newest', label: '最新優先' },
    { value: 'oldest', label: '最舊優先' },
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border border-pip-boy-green/30 rounded-lg bg-black/30 mb-6">
      {/* 回覆狀態篩選器 */}
      <div className="flex items-center gap-2">
        <PixelIcon name="filter" sizePreset="sm" variant="primary" decorative />
        <span className="text-sm text-pip-boy-green/70">回覆狀態：</span>
        <div className="flex gap-2">
          {REPLY_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAdminFilter(option.value)}
              className={`px-3 py-1 rounded text-sm transition-colors min-w-[44px] min-h-[44px] ${
                adminFilter === option.value
                  ? 'bg-pip-boy-green text-black font-bold'
                  : 'border border-pip-boy-green/50 text-pip-boy-green hover:bg-pip-boy-green/10'
              }`}
              aria-label={`篩選 ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分隔線 */}
      <div className="h-6 w-px bg-pip-boy-green/30" />

      {/* 排序選擇器 */}
      <div className="flex items-center gap-2">
        <PixelIcon name="sort" sizePreset="sm" variant="primary" decorative />
        <span className="text-sm text-pip-boy-green/70">排序：</span>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAdminSort(option.value)}
              className={`px-3 py-1 rounded text-sm transition-colors min-w-[44px] min-h-[44px] ${
                adminSort === option.value
                  ? 'bg-pip-boy-green text-black font-bold'
                  : 'border border-pip-boy-green/50 text-pip-boy-green hover:bg-pip-boy-green/10'
              }`}
              aria-label={`排序 ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 分頁導航元件
 */
function AdminPagination() {
  const { adminPage, adminTotal, adminPageSize, setAdminPage } = useWishlistStore()

  // 計算總頁數
  const totalPages = Math.ceil(adminTotal / adminPageSize)

  // 如果只有一頁或沒有資料，不顯示分頁
  if (totalPages <= 1) return null

  // 處理上一頁
  const handlePrevPage = () => {
    if (adminPage > 1) {
      setAdminPage(adminPage - 1)
    }
  }

  // 處理下一頁
  const handleNextPage = () => {
    if (adminPage < totalPages) {
      setAdminPage(adminPage + 1)
    }
  }

  // 處理頁碼跳轉
  const handlePageJump = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setAdminPage(page)
    }
  }

  // 生成頁碼按鈕
  const renderPageButtons = () => {
    const buttons = []
    const maxVisiblePages = 5

    // 計算顯示範圍
    let startPage = Math.max(1, adminPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // 調整起始頁碼
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 第一頁
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageJump(1)}
          className="px-3 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors min-w-[44px] min-h-[44px]"
          aria-label="第 1 頁"
        >
          1
        </button>
      )
      if (startPage > 2) {
        buttons.push(<span key="ellipsis-start" className="px-2 text-pip-boy-green/50">...</span>)
      }
    }

    // 中間頁碼
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageJump(i)}
          className={`px-3 py-2 rounded transition-colors min-w-[44px] min-h-[44px] ${
            adminPage === i
              ? 'bg-pip-boy-green text-black font-bold'
              : 'border border-pip-boy-green/50 text-pip-boy-green hover:bg-pip-boy-green/10'
          }`}
          aria-label={`第 ${i} 頁`}
          aria-current={adminPage === i ? 'page' : undefined}
        >
          {i}
        </button>
      )
    }

    // 最後一頁
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis-end" className="px-2 text-pip-boy-green/50">...</span>)
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageJump(totalPages)}
          className="px-3 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors min-w-[44px] min-h-[44px]"
          aria-label={`第 ${totalPages} 頁`}
        >
          {totalPages}
        </button>
      )
    }

    return buttons
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-pip-boy-green/30 rounded-lg bg-black/30 mt-6">
      {/* 左側：頁碼資訊 */}
      <div className="flex items-center gap-2 text-sm text-pip-boy-green/70">
        <PixelIcon name="file-list" sizePreset="sm" variant="primary" decorative />
        <span>
          第 <span className="text-pip-boy-green font-bold">{adminPage}</span> 頁，
          共 <span className="text-pip-boy-green font-bold">{totalPages}</span> 頁
          （總計 <span className="text-pip-boy-green font-bold">{adminTotal}</span> 筆）
        </span>
      </div>

      {/* 右側：分頁按鈕 */}
      <div className="flex items-center gap-2">
        {/* 上一頁按鈕 */}
        <button
          onClick={handlePrevPage}
          disabled={adminPage === 1}
          className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
          aria-label="上一頁"
        >
          <PixelIcon name="arrow-left-s" sizePreset="sm" decorative />
          <span>上一頁</span>
        </button>

        {/* 頁碼按鈕 */}
        <div className="flex items-center gap-2">
          {renderPageButtons()}
        </div>

        {/* 下一頁按鈕 */}
        <button
          onClick={handleNextPage}
          disabled={adminPage === totalPages}
          className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
          aria-label="下一頁"
        >
          <span>下一頁</span>
          <PixelIcon name="arrow-right-s" sizePreset="sm" decorative />
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
 * - 支援篩選、排序、分頁
 * - 管理員可回覆、隱藏願望
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.6
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
        {/* 篩選器與排序（Task 10.1） */}
        <AdminFilters />

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
              <>
                <div className="space-y-6">
                  {adminWishes.map((wish) => (
                    <AdminWishCard key={wish.id} wish={wish} />
                  ))}
                </div>

                {/* 分頁導航（Task 10.4） */}
                <AdminPagination />
              </>
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
