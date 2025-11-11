/**
 * ShareDialog Component
 *
 * Task 16.1: Social sharing dialog for tarot readings
 * Requirements: 10.1
 *
 * Features:
 * - Social media sharing (Facebook, Twitter/X)
 * - Copy share link functionality
 * - Export as image (1200×630px)
 * - Password protection option (4-8 digits)
 * - Accessibility compliant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  onShareToFacebook?: (readingId: string) => void;
  onShareToTwitter?: (readingId: string) => void;
  onCopyLink?: (readingId: string) => Promise<string>;
  onExportImage?: (readingId: string) => Promise<void>;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  reading,
  onShareToFacebook,
  onShareToTwitter,
  onCopyLink,
  onExportImage,
}) => {
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportLoading, setExportLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleShareToFacebook = () => {
    if (reading && onShareToFacebook) {
      onShareToFacebook(reading.id);
    }
  };

  const handleShareToTwitter = () => {
    if (reading && onShareToTwitter) {
      onShareToTwitter(reading.id);
    }
  };

  const handleCopyLink = async () => {
    if (!reading || !onCopyLink) return;

    try {
      const shareUrl = await onCopyLink(reading.id);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 3000);
      }
    } catch (error) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleExportImage = async () => {
    if (!reading || !onExportImage) return;

    setExportLoading(true);
    try {
      await onExportImage(reading.id);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Don't close when clicking inside dialog content
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-2xl font-bold">
            分享解讀
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉對話框"
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Social Media Buttons */}
          <div className="space-y-2">
            <button
              ref={firstButtonRef}
              type="button"
              onClick={handleShareToFacebook}
              disabled={isReadingInvalid}
              aria-label="分享到 Facebook"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={handleShareToTwitter}
              disabled={isReadingInvalid}
              aria-label="分享到 Twitter/X"
              className="w-full py-2 px-4 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Twitter/X
            </button>
          </div>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={isReadingInvalid}
            aria-label="複製分享連結"
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            複製連結
          </button>

          {copyStatus === 'success' && (
            <p className="text-green-600 text-sm">連結已複製</p>
          )}
          {copyStatus === 'error' && (
            <p className="text-red-600 text-sm">複製失敗，請稍後再試</p>
          )}

          {/* Export Image */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isReadingInvalid || exportLoading}
            aria-label="匯出為圖片"
            className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? '匯出中...' : '匯出為圖片'}
          </button>

          {/* Password Protection Option */}
          <div className="border-t pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={passwordProtection}
                onChange={(e) => setPasswordProtection(e.target.checked)}
                aria-label="需要密碼保護"
                className="w-4 h-4"
              />
              <span>需要密碼保護</span>
            </label>

            {passwordProtection && (
              <div className="mt-2">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="請輸入 4-8 位數密碼"
                  maxLength={8}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                {passwordError && (
                  <p id="password-error" className="text-red-600 text-sm mt-1">
                    {passwordError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
