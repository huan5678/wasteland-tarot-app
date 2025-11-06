'use client';

/**
 * ShareModal Component
 * 顯示分享連結的 Modal
 *
 * Features:
 * - 顯示分享 URL
 * - 一鍵複製功能
 * - 複製成功提示
 * - Fallout 主題樣式
 */

import { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      // 2 秒後重置狀態
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有點擊背景時才關閉，點擊內容區不關閉
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title">

      <div className="bg-pip-boy-dark border-2 border-pip-boy-green p-6 rounded-lg max-w-md w-full mx-4 shadow-lg shadow-pip-boy-green/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="share-modal-title"
            className="text-xl font-bold text-pip-boy-green">

            分享你的占卜結果
          </h2>
          <Button size="icon" variant="link"
          onClick={onClose}
          className="transition-colors"
          aria-label="關閉">

            <PixelIcon name="close" sizePreset="sm" decorative />
          </Button>
        </div>

        {/* URL Display */}
        <div className="bg-black/50 border border-pip-boy-green/30 p-3 rounded mb-4">
          <code className="text-pip-boy-green text-sm break-all block">
            {shareUrl}
          </code>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="icon" variant="outline"
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border transition-colors">

            <PixelIcon
              name={copied ? 'check' : 'copy'}
              sizePreset="sm"
              variant={copied ? 'success' : 'primary'}
              decorative />

            <span>{copied ? '已複製！' : '複製連結'}</span>
          </Button>

          <Button size="default" variant="outline"
          onClick={onClose}
          className="px-4 py-2 border transition-colors">

            關閉
          </Button>
        </div>

        {/* Helper Text */}
        <p className="mt-4 text-xs text-pip-boy-green/60 text-center">
          此連結可分享給任何人，無需登入即可查看占卜結果
        </p>
      </div>
    </div>);

}