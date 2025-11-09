'use client'

import React, { useState } from 'react'
import { TarotCard } from '@/components/tarot/TarotCard'
import { CardDraw } from '@/components/tarot/CardDraw'
import { SpreadInteractiveDraw } from '@/components/readings/SpreadInteractiveDraw'
import { mockTarotCards } from '@/test/mocks/data'
import { useDeviceCapabilities } from '@/hooks/useTouchInteractions'

const testCard = {
  id: 1,
  name: '愚者',
  suit: 'Major Arcana',
  number: 0,
  meaning_upright: '新的開始,天真,自發',
  meaning_reversed: '魯莽,風險,愚蠢',
  image_url: '/images/fool.jpg',
  keywords: ['開始', '冒險', '天真', '自由']
}

export default function TestInteractionsPage() {
  const [selectedSpread, setSelectedSpread] = useState('single_wasteland')
  const [interactionLog, setInteractionLog] = useState<string[]>([])
  const { isTouchDevice, hasHapticFeedback, prefersReducedMotion } = useDeviceCapabilities()

  const logInteraction = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setInteractionLog(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)])
  }

  const handleCardClick = (card: any) => {
    logInteraction(`Card clicked: ${card.name}`)
  }

  const handleCardLongPress = (card: any) => {
    logInteraction(`Card long pressed: ${card.name}`)
  }

  const handleCardSwipe = (direction: string, card: any) => {
    logInteraction(`Card swiped ${direction}: ${card.name}`)
  }

  const handleCardsDrawn = (cards: any[]) => {
    logInteraction(`${cards.length} cards drawn`)
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Device Info */}
        <div className="bg-pip-boy-green/10 border border-pip-boy-green/30 p-4 rounded-lg">
          <h2 className="text-lg font-mono font-bold text-pip-boy-green mb-3">
            裝置資訊
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-mono">
            <div className="text-pip-boy-green/70">
              觸控裝置: {isTouchDevice ? '是' : '否'}
            </div>
            <div className="text-pip-boy-green/70">
              震動回饋: {hasHapticFeedback ? '支援' : '不支援'}
            </div>
            <div className="text-pip-boy-green/70">
              減少動畫: {prefersReducedMotion ? '是' : '否'}
            </div>
            <div className="text-pip-boy-green/70">
              螢幕寬度: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
            </div>
            <div className="text-pip-boy-green/70">
              User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'N/A'}
            </div>
          </div>
        </div>

        {/* Interaction Log */}
        <div className="bg-vault-dark/50 border border-pip-boy-green/30 p-4 rounded-lg">
          <h2 className="text-lg font-mono font-bold text-pip-boy-green mb-3">
            互動記錄
          </h2>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {interactionLog.length === 0 ? (
              <div className="text-pip-boy-green/50 font-mono text-sm">等待互動...</div>
            ) : (
              interactionLog.map((log, index) => (
                <div key={index} className="text-pip-boy-green/80 font-mono text-xs">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Single Card Tests */}
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h2 className="text-xl font-mono font-bold text-pip-boy-green mb-4">
            單卡互動測試
          </h2>
          <div className="text-sm text-pip-boy-green/70 mb-4">
            {isTouchDevice
              ? '輕觸: 點擊 | 長按: 詳細資訊 | 滑動: 翻牌'
              : '滑鼠: 點擊 | 懸停: 高亮效果'
            }
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            {['small', 'medium', 'large'].map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <TarotCard
                  card={testCard}
                  isRevealed={true}
                  position="upright"
                  size={size as any}
                  onClick={handleCardClick}
                  onLongPress={handleCardLongPress}
                  onSwipe={handleCardSwipe}
                  showGlow={true}
                  enableHaptic={true}
                  isSelectable={true}
                  showProgress={true}
                  cardIndex={0}
                  totalCards={3}
                />
                <span className="text-xs font-mono text-pip-boy-green/60">
                  {size}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Draw Tests */}
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h2 className="text-xl font-mono font-bold text-pip-boy-green mb-4">
            抽牌動畫測試
          </h2>
          <CardDraw
            spreadType="vault_tec_spread"
            onCardsDrawn={handleCardsDrawn}
            enableRedraw={true}
            animationDuration={800}
          />
        </div>

        {/* Spread Layout Tests */}
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h2 className="text-xl font-mono font-bold text-pip-boy-green mb-4">
            牌陣布局測試
          </h2>
          <div className="mb-4">
            <select
              value={selectedSpread}
              onChange={(e) => setSelectedSpread(e.target.value)}
              className="bg-vault-dark border border-pip-boy-green/40 text-pip-boy-green p-2 rounded font-mono"
            >
              <option value="single_wasteland">單卡 - 廢土</option>
              <option value="vault_tec_spread">三卡 - Vault-Tec</option>
              <option value="wasteland_survival">五卡 - 廢土生存</option>
              <option value="brotherhood_council">七卡 - 兄弟會議</option>
              <option value="celtic_cross">十卡 - 凱爾特十字</option>
              <option value="horseshoe">七卡 - 馬蹄</option>
            </select>
          </div>
          <SpreadInteractiveDraw
            spreadType={selectedSpread}
            onDone={handleCardsDrawn}
          />
        </div>

        {/* Performance Tips */}
        <div className="bg-radiation-orange/10 border border-radiation-orange/30 p-4 rounded-lg">
          <h3 className="text-md font-mono font-bold text-radiation-orange mb-2">
            效能提示
          </h3>
          <ul className="text-sm text-radiation-orange/80 space-y-1 font-mono">
            <li>• 在較舊裝置上，複雜動畫可能會降低效能</li>
            <li>• 觸控互動針對 44px 最小觸控目標進行最佳化</li>
            <li>• 震動回饋在 iOS Safari 中可能無法使用</li>
            <li>• 請測試橫向和直向模式</li>
            {prefersReducedMotion && (
              <li className="text-warning-yellow">• 偵測到減少動畫偏好設定</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}