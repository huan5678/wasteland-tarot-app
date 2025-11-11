/**
 * Offline Notice Component
 * Displays a persistent notice when user is offline
 *
 * Features:
 * - Fixed position at top of viewport
 * - Dismissible
 * - Shows queued requests count
 * - Fallout-themed styling
 */

'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

export const OfflineNotice: React.FC = () => {
  const { isOnline, showOfflineNotice, queuedCount, dismissNotice } = useOfflineDetection();

  if (isOnline || !showOfflineNotice) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-radiation-orange border-b-2 border-radiation-orange/80 p-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <PixelIcon
            name="wifi-off"
            sizePreset="sm"
            variant="warning"
            animation="pulse"
            decorative
          />
          <div className="flex-1">
            <p className="text-black font-bold text-sm">
              輻射區域 - 連線中斷
            </p>
            <p className="text-black/80 text-xs">
              {queuedCount > 0
                ? `已暫存 ${queuedCount} 個請求，連線恢復後將自動重試`
                : '部分功能可能無法使用'
              }
            </p>
          </div>
        </div>

        <button
          onClick={dismissNotice}
          aria-label="關閉通知"
          className="text-black/80 hover:text-black transition-colors"
        >
          <PixelIcon name="close" sizePreset="sm" decorative />
        </button>
      </div>
    </div>
  );
};

OfflineNotice.displayName = 'OfflineNotice';
