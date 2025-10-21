'use client'

/**
 * ShareButton Component
 * 占卜結果頁面的分享按鈕
 *
 * Features:
 * - 點擊生成分享連結
 * - 顯示 ShareModal
 * - Loading 狀態
 * - 錯誤處理
 */

import { useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { ShareModal } from './ShareModal'
import { shareAPI } from '@/lib/api/share'
import type { ShareLinkResponse } from '@/types/api'

interface ShareButtonProps {
  readingId: string
  className?: string
}

export function ShareButton({ readingId, className = '' }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shareData, setShareData] = useState<ShareLinkResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await shareAPI.generateShareLink(readingId)
      setShareData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成分享連結失敗'
      setError(errorMessage)
      console.error('Failed to generate share link:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShareData(null)
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2
          bg-pip-boy-green/10 hover:bg-pip-boy-green/20
          border border-pip-boy-green
          text-pip-boy-green
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${className}
        `}
        aria-label="分享占卜結果"
      >
        <PixelIcon
          name="share"
          sizePreset="sm"
          variant="primary"
          decorative
        />
        <span>{isLoading ? '生成中...' : '分享結果'}</span>
      </button>

      {error && (
        <div
          className="mt-2 text-red-500 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {shareData && (
        <ShareModal
          shareUrl={shareData.share_url}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
