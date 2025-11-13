/**
 * ShareLinkManagement Component
 *
 * Task 16.5, 16.6: Manage and revoke share links
 * Requirements: 10.6, 10.7, 10.8
 *
 * Features:
 * - List all active share links for a reading
 * - Show access count for each link
 * - Revoke button with confirmation
 * - Copy individual share URLs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useShareReading } from '@/hooks/useShareReading';
import { PixelIcon } from '@/components/ui/icons';

interface Share {
  uuid: string;
  url: string;
  access_count: number;
  is_active: boolean;
  created_at: string;
  has_password: boolean;
}

interface ShareLinkManagementProps {
  readingId: string;
  onClose?: () => void;
}

export const ShareLinkManagement: React.FC<ShareLinkManagementProps> = ({
  readingId,
  onClose,
}) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const { listShares, revokeShareLink, loading, error } = useShareReading();

  // Load shares on mount and when filter changes
  useEffect(() => {
    loadShares();
  }, [readingId, showActiveOnly]);

  const loadShares = async () => {
    try {
      const data = await listShares(readingId, showActiveOnly);
      setShares(data);
    } catch (err) {
      console.error('Failed to load shares:', err);
    }
  };

  const handleRevoke = async (uuid: string) => {
    try {
      await revokeShareLink(uuid);
      // Reload shares after revocation
      await loadShares();
      setRevokeConfirm(null);
    } catch (err) {
      console.error('Failed to revoke share:', err);
      alert(err instanceof Error ? err.message : '撤銷失敗');
    }
  };

  const handleCopyUrl = async (url: string, uuid: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopyStatus(uuid);
        setTimeout(() => setCopyStatus(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-pip-boy-dark border-2 border-pip-boy-green rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-pip-boy-green">分享管理</h3>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="關閉"
            className="text-pip-boy-green hover:text-radiation-orange transition-colors"
          >
            <PixelIcon name="close-line" sizePreset="sm" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            aria-label="僅顯示活躍分享"
            className="w-4 h-4 accent-pip-boy-green"
          />
          <span className="text-pip-boy-green group-hover:text-green-400 transition-colors">
            僅顯示活躍分享
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-300">
          <PixelIcon name="error-warning-line" sizePreset="xs" className="inline mr-2" />
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <PixelIcon
            name="loader-4-line"
            sizePreset="lg"
            animation="spin"
            variant="primary"
          />
          <span className="ml-3 text-pip-boy-green">載入中...</span>
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <PixelIcon name="links-line" sizePreset="xl" className="mx-auto mb-3 opacity-50" />
          <p>尚無分享記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((share) => (
            <div
              key={share.uuid}
              className={`border rounded-lg p-4 ${
                share.is_active
                  ? 'border-pip-boy-green bg-pip-boy-green bg-opacity-5'
                  : 'border-gray-600 bg-gray-800 bg-opacity-30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        share.is_active
                          ? 'bg-pip-boy-green text-pip-boy-dark'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {share.is_active ? '活躍' : '已撤銷'}
                    </span>
                    {share.has_password && (
                      <span className="text-xs px-2 py-1 rounded bg-radiation-orange text-pip-boy-dark">
                        <PixelIcon name="lock-line" sizePreset="xs" decorative className="inline mr-1" />
                        密碼保護
                      </span>
                    )}
                  </div>

                  {/* Share URL */}
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm text-pip-boy-green truncate flex-1">
                      {share.url}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(share.url, share.uuid)}
                      aria-label="複製連結"
                      className="text-pip-boy-green hover:text-green-400 transition-colors"
                    >
                      <PixelIcon
                        name={copyStatus === share.uuid ? 'check-line' : 'file-copy-line'}
                        sizePreset="xs"
                      />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      <PixelIcon name="eye-line" sizePreset="xs" decorative className="inline mr-1" />
                      瀏覽 {share.access_count} 次
                    </span>
                    <span>
                      <PixelIcon name="time-line" sizePreset="xs" decorative className="inline mr-1" />
                      {formatDate(share.created_at)}
                    </span>
                  </div>
                </div>

                {/* Revoke Button */}
                {share.is_active && (
                  <div>
                    {revokeConfirm === share.uuid ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-radiation-orange mb-1">確定撤銷？</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRevoke(share.uuid)}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => setRevokeConfirm(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevokeConfirm(share.uuid)}
                        aria-label="撤銷分享"
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <PixelIcon name="delete-bin-line" sizePreset="xs" decorative />
                        撤銷
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
