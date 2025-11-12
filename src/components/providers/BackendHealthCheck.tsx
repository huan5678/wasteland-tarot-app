'use client';

import { useEffect, useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';

const MAX_RETRIES = 10; // 最多重試 10 次
const RETRY_DELAY = 3000; // 每次間隔 3 秒

export function BackendHealthCheck({ children }: { children: React.ReactNode }) {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // 使用相對路徑，透過 Next.js API Route proxy 到後端
        const response = await fetch('/api/v1/health', {
          method: 'GET',
          cache: 'no-store',
        });

        if (response.ok) {
          setIsBackendReady(true);
          setError(null);
        } else {
          throw new Error(`Backend returned ${response.status}`);
        }
      } catch (err) {
        console.warn(`Backend health check failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(checkBackendHealth, RETRY_DELAY);
        } else {
          setError('無法連接到伺服器,請稍後再試');
        }
      }
    };

    checkBackendHealth();
  }, [retryCount]);

  // 如果後端還沒準備好,顯示 Loading 畫面
  if (!isBackendReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-wasteland-darker text-pip-boy-green">
        <div className="text-center space-y-6 max-w-md px-4">
          {/* Vault-Tec Logo */}
          <div className="flex justify-center">
            <PixelIcon
              name="loader-4-line"
              sizePreset="xxl"
              variant="primary"
              animation="spin"
              decorative
            />
          </div>

          {/* 狀態訊息 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {error ? '連線失敗' : '喚醒伺服器中...'}
            </h1>
            
            {!error && (
              <p className="text-sm opacity-80">
                正在啟動 Vault-Tec 系統 ({retryCount + 1}/{MAX_RETRIES})
              </p>
            )}

            {error && (
              <div className="space-y-4">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-pip-boy-green text-wasteland-darker font-bold rounded hover:bg-radiation-orange transition-colors"
                >
                  重試
                </button>
              </div>
            )}
          </div>

          {/* 進度條 */}
          {!error && (
            <div className="w-full bg-wasteland-dark h-2 rounded overflow-hidden relative">
              {/* 進度條填充（3 秒循環：0% → 100%） */}
              <div
                className="h-full bg-pip-boy-green origin-left animate-progress-loop"
              />
              {/* 閃爍效果 */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-pip-boy-green/50 to-transparent animate-pulse"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 後端準備好了,渲染正常內容
  return <>{children}</>;
}
