'use client'

/**
 * 快速占卜頁面 - 供訪客使用，無需登入
 *
 * 功能：
 * - 允許未登入用戶體驗占卜功能
 * - 簡化的單卡占卜或三卡占卜
 * - 不儲存結果至資料庫
 * - 鼓勵用戶註冊以儲存歷史記錄
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spade, RefreshCw, UserPlus, ArrowLeft } from 'lucide-react'

export default function QuickReadingPage() {
  const router = useRouter()
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [interpretation, setInterpretation] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)

  // 簡化的卡牌數據（示例）
  const sampleCards = [
    { id: 1, name: '廢土流浪者', meaning: '新的旅程即將開始，勇敢面對未知的挑戰。' },
    { id: 2, name: 'Vault 居民', meaning: '安全與秩序是你當前的優先事項。' },
    { id: 3, name: '鋼鐵兄弟會戰士', meaning: '力量和科技將幫助你達成目標。' },
    { id: 4, name: 'NCR 遊俠', meaning: '正義與秩序引導著你的道路。' },
    { id: 5, name: '廢土商人', meaning: '機遇與交易將為你帶來好運。' }
  ]

  const handleDrawCard = async () => {
    setIsDrawing(true)
    setInterpretation('')

    // 模擬抽卡動畫
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 隨機選擇一張卡
    const randomIndex = Math.floor(Math.random() * sampleCards.length)
    const drawnCard = sampleCards[randomIndex]

    setSelectedCard(randomIndex)
    setInterpretation(drawnCard.meaning)
    setIsDrawing(false)
  }

  const handleReset = () => {
    setSelectedCard(null)
    setInterpretation('')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  const handleGoBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen text-pip-boy-green p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green p-4 mb-8" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="text-pip-boy-green hover:text-cyan-400 transition-colors"
                aria-label="返回首頁"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span>快速占卜模式</span>
                  <span>|</span>
                  <span>訪客體驗</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRegister}
              className="flex items-center gap-2 text-xs font-mono text-pip-boy-green hover:text-cyan-400 transition-colors px-3 py-1 border border-pip-boy-green"
            >
              <UserPlus className="w-4 h-4" />
              註冊 Vault 帳號
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="border-2 border-pip-boy-green p-8" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
          <div className="text-center mb-8">
            <Spade className="w-16 h-16 mx-auto mb-4 text-pip-boy-green" />
            <h1 className="text-3xl font-bold text-pip-boy-green font-mono mb-2">
              快速占卜
            </h1>
            <p className="text-sm text-text-muted font-mono">
              無需登入，立即體驗廢土塔羅的智慧
            </p>
          </div>

          {/* Card Drawing Area */}
          <div className="space-y-6">
            {!selectedCard && !isDrawing && (
              <div className="text-center">
                <button
                  onClick={handleDrawCard}
                  className="border-2 border-pip-boy-green px-8 py-4 text-lg font-mono text-pip-boy-green hover:bg-pip-boy-green hover:text-black transition-all duration-300"
                  disabled={isDrawing}
                >
                  抽取你的命運之牌
                </button>
                <p className="mt-4 text-xs text-text-muted font-mono">
                  點擊按鈕，讓 Pip-Boy 為你選擇一張指引卡
                </p>
              </div>
            )}

            {isDrawing && (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-pip-boy-green animate-spin" />
                <p className="text-sm font-mono text-pip-boy-green animate-pulse">
                  正在掃描廢土能量波動...
                </p>
              </div>
            )}

            {selectedCard !== null && !isDrawing && (
              <div className="space-y-6">
                {/* Card Display */}
                <div className="border-2 border-pip-boy-green p-6 text-center" style={{backgroundColor: 'var(--color-pip-boy-green-10)'}}>
                  <div className="text-2xl font-bold text-pip-boy-green font-mono mb-2">
                    {sampleCards[selectedCard].name}
                  </div>
                  <div className="text-xs text-text-muted font-mono">
                    卡牌 #{selectedCard + 1}
                  </div>
                </div>

                {/* Interpretation */}
                <div className="border-2 border-pip-boy-green p-6" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
                  <h3 className="text-lg font-bold text-pip-boy-green font-mono mb-3">
                    Pip-Boy 解析：
                  </h3>
                  <p className="text-sm text-text-secondary font-mono leading-relaxed">
                    {interpretation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 border-2 border-pip-boy-green px-6 py-3 font-mono text-pip-boy-green hover:bg-pip-boy-green hover:text-black transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    再抽一次
                  </button>
                  <button
                    onClick={handleRegister}
                    className="flex items-center gap-2 border-2 border-cyan-400 px-6 py-3 font-mono text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4" />
                    註冊以儲存結果
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 border border-pip-boy-green p-4" style={{backgroundColor: 'var(--color-pip-boy-green-5)'}}>
            <p className="text-xs text-text-muted font-mono text-center">
              📝 註冊 Vault 帳號後，你可以：儲存占卜歷史 | 使用高級牌陣 | 獲得 AI 詳細解讀 | 追蹤 Karma 變化
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
