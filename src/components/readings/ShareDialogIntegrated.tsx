/**
 * ShareDialog Component (Integrated Version)
 *
 * Task 16.1-16.4, 16.7: Complete social sharing dialog
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9
 *
 * Features:
 * - Social media sharing (Facebook, Twitter/X)
 * - Copy share link functionality
 * - Export as image (1200×630px)
 * - Password protection option (4-8 digits)
 * - API integration
 * - Accessibility compliant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useShareReading } from '@/hooks/useShareReading';
import { shareToFacebook, shareToTwitter, generateShareText } from '@/utils/socialShare';
import { exportReadingAsImage } from '@/utils/imageExport';
import { PixelIcon } from '@/components/ui/icons';

interface Reading {
  id: string;
  question: string;
  cards_drawn: Array<{
    id: string;
    name: string;
    suit: string;
    position: 'upright' | 'reversed';
    imageUrl: string;
    positionIndex: number;
  }>;
  interpretation: string;
  created_at: string;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  reading: Reading | null;
}

export const ShareDialogIntegrated: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  reading,
}) => {
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportLoading, setExportLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const { generateShareLink, loading, error } = useShareReading();

  // Generate unique ID for aria-labelledby
  const titleId = `share-dialog-title-${reading?.id || 'none'}`;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPasswordProtection(false);
      setPassword('');
      setPasswordError('');
      setCopyStatus('idle');
      setExportLoading(false);
      setShareUrl(null);
    }
  }, [open]);

  // Focus first button when dialog opens
  useEffect(() => {
    if (open && firstButtonRef.current) {
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const validatePassword = (value: string): boolean => {
    if (passwordProtection && (value.length < 4 || value.length > 8)) {
      setPasswordError('密碼必須為 4-8 位數');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  /**
   * Generate share link (calls backend API)
   */
  const ensureShareUrl = async (): Promise<string> => {
    if (!reading) {
      throw new Error('沒有可分享的解讀');
    }

    // If already generated, return cached URL
    if (shareUrl) {
      return shareUrl;
    }

    // Validate password if protection is enabled
    if (passwordProtection && !validatePassword(password)) {
      throw new Error('密碼格式不正確');
    }

    // Generate new share link
    const url = await generateShareLink(
      reading.id,
      passwordProtection,
      passwordProtection ? password : undefined
    );

    setShareUrl(url);
    return url;
  };

  const handleShareToFacebook = async () => {
    try {
      const url = await ensureShareUrl();
      const shareText = reading ? generateShareText(reading) : undefined;

      shareToFacebook({
        url,
        title: '我在廢土塔羅抽到了這些牌！',
        description: shareText,
      });
    } catch (err) {
      console.error('Facebook 分享失敗:', err);
      alert(err instanceof Error ? err.message : 'Facebook 分享失敗');
    }
  };

  const handleShareToTwitter = async () => {
    try {
      const url = await ensureShareUrl();
      const shareText = reading ? generateShareText(reading) : undefined;

      shareToTwitter({
        url,
        title: '我在廢土塔羅抽到了這些牌！',
        description: shareText,
      });
    } catch (err) {
      console.error('Twitter 分享失敗:', err);
      alert(err instanceof Error ? err.message : 'Twitter 分享失敗');
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = await ensureShareUrl();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('複製連結失敗:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleExportImage = async () => {
    if (!reading) return;

    setExportLoading(true);
    try {
      await exportReadingAsImage(reading);
    } catch (err) {
      console.error('匯出圖片失敗:', err);
      alert(err instanceof Error ? err.message : '匯出圖片失敗');
    } finally {
      setExportLoading(false);
    }
  };

  const isReadingInvalid = !reading;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-pip-boy-dark border-2 border-pip-boy-green rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-2xl font-bold text-pip-boy-green">
            分享解讀
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉對話框"
            className="text-pip-boy-green hover:text-radiation-orange transition-colors"
          >
            <PixelIcon name="close-line" sizePreset="sm" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-300">
            <PixelIcon name="error-warning-line" sizePreset="xs" className="inline mr-2" />
            {error.message}
          </div>
        )}

        <div className="space-y-4">
          {/* Social Media Buttons */}
          <div className="space-y-2">
            <button
              ref={firstButtonRef}
              type="button"
              onClick={handleShareToFacebook}
              disabled={isReadingInvalid || loading}
              aria-label="分享到 Facebook"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <PixelIcon name="facebook-box-fill" sizePreset="sm" decorative />
              Facebook
            </button>
            <button
              type="button"
              onClick={handleShareToTwitter}
              disabled={isReadingInvalid || loading}
              aria-label="分享到 Twitter/X"
              className="w-full py-3 px-4 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <PixelIcon name="twitter-x-fill" sizePreset="sm" decorative />
              Twitter/X
            </button>
          </div>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={isReadingInvalid || loading}
            aria-label="複製分享連結"
            className="w-full py-3 px-4 bg-pip-boy-green text-pip-boy-dark rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <PixelIcon
              name={copyStatus === 'success' ? 'check-line' : 'links-line'}
              sizePreset="sm"
              decorative
            />
            {copyStatus === 'success' ? '已複製！' : '複製連結'}
          </button>

          {copyStatus === 'error' && (
            <p className="text-red-400 text-sm text-center">複製失敗，請稍後再試</p>
          )}

          {/* Export Image */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isReadingInvalid || exportLoading}
            aria-label="匯出為圖片"
            className="w-full py-3 px-4 bg-radiation-orange text-pip-boy-dark rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <PixelIcon
              name={exportLoading ? 'loader-4-line' : 'image-line'}
              sizePreset="sm"
              animation={exportLoading ? 'spin' : undefined}
              decorative
            />
            {exportLoading ? '匯出中...' : '匯出為圖片'}
          </button>

          {/* Password Protection Option */}
          <div className="border-t border-pip-boy-green border-opacity-30 pt-4 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={passwordProtection}
                onChange={(e) => setPasswordProtection(e.target.checked)}
                aria-label="需要密碼保護"
                className="w-4 h-4 accent-pip-boy-green"
              />
              <span className="text-pip-boy-green group-hover:text-green-400 transition-colors">
                需要密碼保護
              </span>
            </label>

            {passwordProtection && (
              <div className="mt-3">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="請輸入 4-8 位數密碼"
                  maxLength={8}
                  className="w-full px-3 py-2 bg-pip-boy-dark border border-pip-boy-green rounded focus:outline-none focus:ring-2 focus:ring-pip-boy-green text-pip-boy-green placeholder-gray-500"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                {passwordError && (
                  <p id="password-error" className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <PixelIcon name="error-warning-line" sizePreset="xs" decorative />
                    {passwordError}
                  </p>
                )}
              </div>
            )}
          </div>

          {shareUrl && (
            <div className="mt-4 p-3 bg-pip-boy-green bg-opacity-10 border border-pip-boy-green border-opacity-30 rounded">
              <p className="text-pip-boy-green text-sm flex items-center gap-2">
                <PixelIcon name="check-line" sizePreset="xs" decorative />
                分享連結已生成
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
