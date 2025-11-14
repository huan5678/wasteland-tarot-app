'use client';

/**
 * ShareButton Component (Updated for Task 16)
 * 占卜結果頁面的分享按鈕
 *
 * Features:
 * - 點擊開啟分享對話框
 * - 整合 ShareDialogIntegrated
 * - Loading 狀態
 * - 錯誤處理
 */

import { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { ShareDialogIntegrated } from '@/components/readings/ShareDialogIntegrated';
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  readingId: string;
  reading?: any; // Full reading object if available
  className?: string;
}

export function ShareButton({ readingId, reading, className = '' }: ShareButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleShare = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleShare}
        className="px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider"
        aria-label="分享占卜結果"
      >
        <span className="flex items-center justify-center gap-2">
          <PixelIcon
            name="share-line"
            sizePreset="xs"
            variant="default"
            decorative
          />
          分享結果
        </span>
      </Button>

      <ShareDialogIntegrated
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        reading={reading || null}
      />
    </>
  );
}
