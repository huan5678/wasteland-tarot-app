'use client'

import React from 'react'
import { SpreadLayoutPreview } from '@/components/readings/SpreadLayoutPreview'

export default function TestSpreadPreviewPage() {
  const spreads = [
    { name: 'single_wasteland', displayName: '單卡廢土占卜', cardCount: 1 },
    { name: 'vault_tec_spread', displayName: 'Vault-Tec 時光機', cardCount: 3 },
    { name: 'raider_chaos_spread', displayName: '掠奪者混亂牌陣', cardCount: 4 },
    { name: 'wasteland_survival_spread', displayName: '廢土生存指南', cardCount: 5 },
    { name: 'ncr_strategic_spread', displayName: 'NCR 戰略規劃', cardCount: 6 },
    { name: 'brotherhood_council_spread', displayName: '兄弟會議會', cardCount: 7 },
  ]

  return (
    <div className="min-h-screen bg-wasteland-dark p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6 mb-8">
          <h1 className="text-3xl font-bold text-pip-boy-green mb-2">
            牌陣預覽測試頁面
          </h1>
          <p className="text-pip-boy-green/70 text-sm">
            測試所有 6 個牌陣的卡片佈局、尺寸和文字大小
          </p>
        </div>

        {/* Legend */}
        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mb-8">
          <h2 className="text-lg font-bold text-pip-boy-green mb-3">測試標準</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-pip-boy-green/80">
            <div>
              <div className="font-bold text-pip-boy-green mb-1">✅ 卡片尺寸</div>
              <ul className="space-y-1 text-xs">
                <li>1-3張: 48×64px (大型)</li>
                <li>4-5張: 40×56px (中型)</li>
                <li>6+張: 32×44px (小型)</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-pip-boy-green mb-1">✅ 文字大小</div>
              <ul className="space-y-1 text-xs">
                <li>1-3張: 14px (清晰)</li>
                <li>4-5張: 12px (可讀)</li>
                <li>6+張: 11px (適中)</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-pip-boy-green mb-1">✅ 容器高度</div>
              <ul className="space-y-1 text-xs">
                <li>1-3張: 160px (緊湊)</li>
                <li>4-5張: 176px (中等)</li>
                <li>6+張: 208px (較高)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Spread Previews Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {spreads.map((spread) => (
            <div
              key={spread.name}
              className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-6"
            >
              {/* Spread Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-pip-boy-green mb-1">
                  {spread.displayName}
                </h3>
                <div className="flex items-center gap-4 text-xs text-pip-boy-green/70">
                  <span>卡片數量: {spread.cardCount}</span>
                  <span>•</span>
                  <span>
                    尺寸: {spread.cardCount <= 3 ? '大型' : spread.cardCount <= 5 ? '中型' : '小型'}
                  </span>
                </div>
              </div>

              {/* Preview Component */}
              <SpreadLayoutPreview spreadType={spread.name} />

              {/* Validation Checklist */}
              <div className="mt-4 text-xs text-pip-boy-green/60 space-y-1">
                <div className="flex items-center">
                  <span className="text-pip-boy-green mr-2">✓</span>
                  <span>卡片無重疊</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pip-boy-green mr-2">✓</span>
                  <span>文字清晰可讀</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pip-boy-green mr-2">✓</span>
                  <span>佈局美觀</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mt-8">
          <p className="text-pip-boy-green/70 text-sm">
            <span className="font-bold text-pip-boy-green">修復說明：</span>
            所有牌陣預覽現在根據卡片數量動態調整卡片尺寸、文字大小和容器高度，
            解決了原本 7 張牌的兄弟會議會牌陣卡片重疊和文字過小的問題。
          </p>
        </div>
      </div>
    </div>
  )
}
