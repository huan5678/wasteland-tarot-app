'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cardsAPI } from '@/lib/api/services'
import { ApiError, NetworkError } from '@/lib/api/client'
import type { TarotCard } from '@/types/api'

export default function CardsPage() {
  const [cards, setCards] = useState<TarotCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const cardsData = await cardsAPI.getAll()
      setCards(cardsData)
      setRetryCount(0) // 重置重試計數
    } catch (err) {
      let errorMessage = '無法載入卡牌數據'

      if (err instanceof NetworkError) {
        errorMessage = '網路連線中斷，請檢查網路連線'
      } else if (err instanceof ApiError) {
        if (err.status === 503) {
          errorMessage = '服務暫時無法使用，請稍後再試'
        } else if (err.status === 404) {
          errorMessage = '找不到卡牌資料'
        } else if (err.status >= 500) {
          errorMessage = '伺服器錯誤，請稍後再試'
        } else {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    fetchCards()
  }, [fetchCards])

  return (
    <div className="min-h-screen bg-vault-dark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <h1 className="text-2xl font-bold text-pip-boy-green font-mono">
            塔羅牌圖書館
          </h1>
          <p className="text-pip-boy-green/70 font-mono text-sm">
            全面的廢土占卜資料庫 - 共有 {cards.length} 張牌可用
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-pip-boy-green font-mono">載入卡牌資料庫中...</p>
          </div>
        )}

        {error && (
          <div className="border-2 border-red-500 bg-red-500/10 p-6">
            <div className="text-center py-4">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-red-400 font-mono text-lg mb-4">
                {error}
              </p>
              {retryCount > 0 && (
                <p className="text-red-300/70 font-mono text-sm mb-4">
                  重試次數：{retryCount}
                </p>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green font-mono hover:bg-pip-boy-green/20 transition-colors"
                  disabled={loading}
                >
                  {loading ? '重試中...' : '重試'}
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 border-2 border-pip-boy-green/50 bg-transparent text-pip-boy-green/70 font-mono hover:border-pip-boy-green hover:text-pip-boy-green transition-colors"
                >
                  返回首頁
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4 cursor-pointer hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200"
              >
                <div className="text-center">
                  <div className="h-32 bg-pip-boy-green/20 border border-pip-boy-green/50 mb-2 flex items-center justify-center">
                    <span className="text-pip-boy-green font-mono text-xs">牌面</span>
                  </div>
                  <p className="text-pip-boy-green font-mono text-sm font-bold">{card.name}</p>
                  <p className="text-pip-boy-green/70 font-mono text-xs">{card.suit}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-pip-boy-green/70 font-mono text-lg mb-2">
              找不到牌片
            </p>
          </div>
        )}
      </div>
    </div>
  )
}