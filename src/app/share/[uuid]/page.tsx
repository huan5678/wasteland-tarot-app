/**
 * Shared Reading View Page
 *
 * Task 16.2: Public page for viewing shared readings
 * Requirements: 10.2, 10.3, 10.4
 *
 * Features:
 * - Public access (no authentication required)
 * - Password protection support
 * - PII stripped by backend
 * - Handle revoked shares (410 Gone)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useShareReading } from '@/hooks/useShareReading';
import { PixelIcon } from '@/components/ui/icons';

export default function SharedReadingPage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const [reading, setReading] = useState<any>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isRevoked, setIsRevoked] = useState(false);

  const { viewSharedReading, loading, error } = useShareReading();

  // Attempt to load reading on mount
  useEffect(() => {
    if (uuid) {
      loadReading();
    }
  }, [uuid]);

  const loadReading = async (pwd?: string) => {
    try {
      const data = await viewSharedReading(uuid, pwd);
      setReading(data);
      setRequiresPassword(false);
      setPasswordError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';

      if (errorMessage.includes('撤回')) {
        setIsRevoked(true);
      } else if (errorMessage.includes('密碼') || errorMessage.includes('需要')) {
        setRequiresPassword(true);
        if (pwd) {
          setPasswordError(errorMessage);
        }
      } else {
        setPasswordError(errorMessage);
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length >= 4 && password.length <= 8) {
      loadReading(password);
    } else {
      setPasswordError('密碼必須為 4-8 位數');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Revoked state
  if (isRevoked) {
    return (
      <div className="min-h-screen bg-pip-boy-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <PixelIcon
              name="forbid-line"
              sizePreset="xxl"
              variant="error"
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-pip-boy-green mb-4">分享已撤銷</h1>
          <p className="text-gray-400 mb-6">
            此解讀已被擁有者撤回，無法繼續查看。
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pip-boy-green text-pip-boy-dark rounded hover:bg-green-400 transition-colors"
          >
            <PixelIcon name="home-line" sizePreset="sm" decorative />
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  // Password required state
  if (requiresPassword && !reading) {
    return (
      <div className="min-h-screen bg-pip-boy-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-pip-boy-green bg-opacity-10 border-2 border-pip-boy-green rounded-lg p-8">
            <div className="text-center mb-6">
              <PixelIcon
                name="lock-line"
                sizePreset="xxl"
                variant="primary"
                className="mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-pip-boy-green mb-2">需要密碼</h1>
              <p className="text-gray-400">此分享受密碼保護</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入 4-8 位數密碼"
                  maxLength={8}
                  className="w-full px-4 py-3 bg-pip-boy-dark border-2 border-pip-boy-green rounded text-pip-boy-green placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pip-boy-green"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <PixelIcon name="error-warning-line" sizePreset="xs" decorative />
                    {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-pip-boy-green text-pip-boy-dark rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <PixelIcon name="loader-4-line" sizePreset="sm" animation="spin" decorative />
                    驗證中...
                  </>
                ) : (
                  <>
                    <PixelIcon name="lock-unlock-line" sizePreset="sm" decorative />
                    解鎖
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !reading) {
    return (
      <div className="min-h-screen bg-pip-boy-dark flex items-center justify-center">
        <div className="text-center">
          <PixelIcon
            name="loader-4-line"
            sizePreset="xxl"
            animation="spin"
            variant="primary"
            className="mx-auto mb-4"
          />
          <p className="text-pip-boy-green">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !reading) {
    return (
      <div className="min-h-screen bg-pip-boy-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <PixelIcon
            name="error-warning-line"
            sizePreset="xxl"
            variant="error"
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-pip-boy-green mb-4">載入失敗</h1>
          <p className="text-gray-400 mb-6">{error.message}</p>
          <button
            onClick={() => loadReading()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-pip-boy-green text-pip-boy-dark rounded hover:bg-green-400 transition-colors"
          >
            <PixelIcon name="refresh-line" sizePreset="sm" decorative />
            重試
          </button>
        </div>
      </div>
    );
  }

  // Success: Display reading
  return (
    <div className="min-h-screen bg-pip-boy-dark py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-pip-boy-green mb-2">
            廢土塔羅
          </h1>
          <p className="text-gray-400">分享的解讀</p>
        </div>

        {/* Reading Card */}
        <div className="bg-pip-boy-green bg-opacity-5 border-2 border-pip-boy-green rounded-lg p-8 mb-8">
          {/* Question */}
          {reading?.question && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-radiation-orange mb-2">問題</h2>
              <p className="text-pip-boy-green text-xl">{reading.question}</p>
            </div>
          )}

          {/* Cards Drawn */}
          {reading?.cards_drawn && reading.cards_drawn.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-radiation-orange mb-3">抽到的牌</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {reading.cards_drawn.map((card: any, index: number) => (
                  <div key={index} className="text-center">
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-auto rounded border border-pip-boy-green"
                      />
                    )}
                    <p className="text-pip-boy-green text-sm mt-2">{card.name}</p>
                    {card.position && (
                      <p className="text-gray-500 text-xs">
                        {card.position === 'upright' ? '正位' : '逆位'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interpretation */}
          {reading?.interpretation && (
            <div>
              <h2 className="text-lg font-bold text-radiation-orange mb-3">解讀</h2>
              <div className="text-pip-boy-green whitespace-pre-wrap leading-relaxed">
                {reading.interpretation}
              </div>
            </div>
          )}

          {/* Date */}
          {reading?.created_at && (
            <div className="mt-6 pt-6 border-t border-pip-boy-green border-opacity-30 text-gray-400 text-sm">
              <PixelIcon name="time-line" sizePreset="xs" decorative className="inline mr-2" />
              {formatDate(reading.created_at)}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">想要自己的塔羅解讀嗎？</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-pip-boy-green text-pip-boy-dark rounded-lg hover:bg-green-400 transition-colors font-bold"
          >
            <PixelIcon name="tarot-card-line" sizePreset="sm" decorative />
            開始你的廢土旅程
          </a>
        </div>
      </div>
    </div>
  );
}
