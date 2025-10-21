/**
 * Reading Detail Page - 占卜詳情頁面（Tab 式設計）
 *
 * 使用 Tab 形式整合以下內容：
 * - Tab 1: 占卜總覽 - 問題、牌陣、所有卡牌
 * - Tab 2-N: 每張卡牌的詳細資訊（整合 ReadingCardDetail）
 * - Tab N+1: 解讀結果
 * - Tab N+2: 元資料
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { readingsAPI } from '@/lib/api'
import { PixelIcon } from '@/components/ui/icons'
import type { Reading } from '@/lib/api'
import type { ReadingCard } from '@/components/readings/ReadingCardDetail'
import { cn } from '@/lib/utils'
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages'
import { useTextToSpeech } from '@/hooks/audio/useTextToSpeech'
import useCardInteractions from '@/hooks/useCardInteractions'
import { useReadingsStore } from '@/lib/readingsStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Switch } from '@/components/ui/switch'
import { filterCharacterVoicesByFaction } from '@/lib/factionVoiceMapping'
import { useFactions } from '@/hooks/useCharacterVoices'
import { useCharacters } from '@/hooks/useCharacterVoices'
import { ShareButton } from '@/components/share/ShareButton'

// Tab 類型定義
type MainTabType = 'overview' | 'interpretation' | 'metadata' | `card-${number}`

// 工具函數
const getSpreadTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'single': '單張牌',
    'three_card': '三張牌',
    'celtic_cross': '凱爾特十字',
    'past_present_future': '過去現在未來',
  }
  return typeMap[type] || type
}

const getSuitIcon = (suit: string) => {
  const suitLower = suit.toLowerCase()
  if (suitLower.includes('權杖') || suitLower.includes('wand') || suitLower.includes('radiation_rod'))
    return <PixelIcon name="zap" sizePreset="xs" decorative />
  if (suitLower.includes('聖杯') || suitLower.includes('cup') || suitLower.includes('nuka_cola'))
    return <PixelIcon name="heart" sizePreset="xs" decorative />
  if (suitLower.includes('寶劍') || suitLower.includes('sword') || suitLower.includes('combat_weapon'))
    return <PixelIcon name="sword" sizePreset="xs" decorative />
  if (suitLower.includes('錢幣') || suitLower.includes('pentacle') || suitLower.includes('bottle_cap'))
    return <PixelIcon name="coin" sizePreset="xs" decorative />
  if (suitLower.includes('major_arcana'))
    return <PixelIcon name="star" sizePreset="xs" decorative />
  return <PixelIcon name="star" sizePreset="xs" decorative />
}

const getRadiationLevel = (factor: number = 0) => {
  if (factor >= 0.8) return { label: '極高輻射', color: 'text-red-400', bgColor: 'bg-red-900/30' }
  if (factor >= 0.6) return { label: '高輻射', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
  if (factor >= 0.4) return { label: '中等輻射', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
  if (factor >= 0.2) return { label: '低輻射', color: 'text-pip-boy-green/60', bgColor: 'bg-pip-boy-green/10' }
  return { label: '安全', color: 'text-pip-boy-green', bgColor: 'bg-pip-boy-green/10' }
}

const getKarmaColor = (alignment?: string) => {
  switch (alignment) {
    case 'GOOD': return 'text-blue-400'
    case 'EVIL': return 'text-red-400'
    default: return 'text-pip-boy-green/70'
  }
}

export default function ReadingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const readingId = params.id as string

  const [reading, setReading] = useState<Reading | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MainTabType>('overview')
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini'>('openai')

  // Hooks
  const { speak, stop: stopSpeech, isSpeaking, isSupported: audioSupported } = useTextToSpeech()
  const { isBookmarked, toggleBookmark, updateBookmarkNotes, getStudyProgress, markAsViewed} = useCardInteractions()
  const deleteReading = useReadingsStore(s => s.deleteReading)
  const requestAIInterpretation = useReadingsStore(s => s.requestAIInterpretation)
  const storeError = useReadingsStore(s => s.error)
  const isRequestingAI = useReadingsStore(s => s.isLoading)

  // ✅ API Hooks for factions and characters
  const { factions, isLoading: isLoadingFactions } = useFactions()
  const { characters, isLoading: isLoadingCharacters } = useCharacters()

  useEffect(() => {
    const fetchReading = async () => {
      if (!readingId) return
      // 如果正在刪除，不要重新載入
      if (isDeleting) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await readingsAPI.getById(readingId)
        console.log('📊 Reading data:', data)
        console.log('🤖 AI requested?:', data.ai_interpretation_requested)
        console.log('🤖 AI at?:', data.ai_interpretation_at)
        // 檢查新舊資料結構
        if ('card_positions' in data) {
          console.log('🃏 Card positions (NEW structure):', data.card_positions)
          console.log('🃏 Card positions length:', data.card_positions?.length)
        } else {
          console.log('🃏 Cards drawn (LEGACY structure):', (data as any).cards_drawn)
          console.log('🃏 Cards drawn length:', (data as any).cards_drawn?.length)
        }
        setReading(data)
      } catch (err: any) {
        console.error('Failed to fetch reading:', err)
        // 只有在非刪除狀態下才顯示錯誤
        if (!isDeleting) {
          // 如果是 404 錯誤，直接跳轉到占卜列表頁面
          if (err.status === 404) {
            console.log('Reading not found, redirecting to readings list...')
            router.push('/readings')
            return
          }
          setError(err.message || '無法載入占卜記錄')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchReading()
  }, [readingId, isDeleting, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ✅ Helper: 根據 character key 取得角色名稱（使用 API 資料）
  const getVoiceLabel = useCallback((voiceKey: string): string => {
    if (!characters || characters.length === 0) return voiceKey
    const character = characters.find(c => c.key.toLowerCase() === voiceKey.toLowerCase())
    return character?.name || voiceKey
  }, [characters])

  // 轉換卡牌資料為 ReadingCard 格式
  const convertToReadingCard = useCallback((card: any, index: number): ReadingCard => {
    console.log(`🔄 [Convert] Converting card ${index}:`, {
      name: card.name,
      character_voice_interpretations: card.character_voice_interpretations,
      character_voices: card.character_voices
    })

    return {
      id: card.card_id || card.id || `card-${index}`,
      name: card.name || card.card_name || '未知卡牌',
      suit: card.suit || 'Unknown',
      number: card.number || card.card_number,  // 卡牌編號（必要欄位，用於圖片路徑）
      is_major_arcana: card.is_major_arcana || false,  // Major Arcana 標記（必要欄位，用於圖片路徑）
      image_url: card.image_url || '',
      is_reversed: card.is_reversed || false,
      position: card.position,
      upright_meaning: card.upright_meaning,
      reversed_meaning: card.reversed_meaning,
      meaning_upright: card.meaning_upright,
      meaning_reversed: card.meaning_reversed,
      description: card.description,
      keywords: card.keywords,
      fallout_reference: card.fallout_reference,
      character_voice_interpretations: card.character_voice_interpretations,
      radiation_factor: card.radiation_factor,
      karma_alignment: card.karma_alignment,
      symbolism: card.symbolism,
      element: card.element,
      astrological_association: card.astrological_association,
      card_number: card.card_number || card.number,
      position_in_reading: card.position_name || card.position_in_reading || `位置 ${index + 1}`,
      position_meaning: card.position_meaning || '',
      card_index: index
    }
  }, [])

  // Memoized 計算 - 支援新舊兩種資料結構
  const cardsData = useMemo(() => {
    if (!reading) return []

    // 新資料結構：使用 card_positions
    if ('card_positions' in reading && reading.card_positions && reading.card_positions.length > 0) {
      return reading.card_positions.map((position, index) => {
        // 使用完整的 card 物件（後端現在會包含）
        const card = position.card
        if (!card) {
          // 如果沒有完整卡牌資料，使用基本 position 資訊
          return convertToReadingCard({
            card_id: position.card_id,
            is_reversed: position.is_reversed,
            position_number: position.position_number,
            position_name: position.position_name,
            position_meaning: position.position_meaning,
            name: `卡牌 ${position.position_number}`,
            suit: 'Unknown',
            image_url: '',
          }, index)
        }

        // 使用完整的卡牌資料
        return convertToReadingCard({
          card_id: card.id,
          id: card.id,
          name: card.name,
          suit: card.suit,
          image_url: card.visuals?.image_url || card.image_url || '',
          upright_meaning: card.upright_meaning,
          reversed_meaning: card.reversed_meaning,
          is_reversed: position.is_reversed,
          position_name: position.position_name,
          position_meaning: position.position_meaning,
          position_number: position.position_number,
          // 從 card 中提取其他資訊
          number: card.number || card.card_number,  // 確保提取卡牌編號
          is_major_arcana: card.is_major_arcana || card.suit === 'major_arcana' || card.suit === 'major-arcana',  // Major Arcana 標記
          fallout_reference: card.fallout_easter_egg || card.nuka_cola_reference,
          // 使用 character_voices 而不是 character_voice_interpretations
          character_voice_interpretations: card.character_voices || card.character_voice_interpretations,
          radiation_factor: card.metadata?.radiation_level || 0,
          keywords: card.keywords,
          description: card.upright_meaning, // 使用 upright_meaning 作為描述
        }, index)
      })
    }

    // 舊資料結構：使用 cards_drawn
    if ('cards_drawn' in reading && (reading as any).cards_drawn) {
      return (reading as any).cards_drawn.map((card: any, index: number) => convertToReadingCard(card, index))
    }

    return []
  }, [reading, convertToReadingCard])

  // 生成 Tab 配置
  const tabConfig = useMemo(() => {
    const tabs = [
      { id: 'overview' as MainTabType, label: '占卜總覽', icon: 'eye' as const, color: 'text-pip-boy-green' }
    ]

    // 為每張卡片添加 Tab
    cardsData.forEach((card, index) => {
      tabs.push({
        id: `card-${index}` as MainTabType,
        label: card.name,
        icon: 'spade' as const,
        color: card.is_reversed ? 'text-red-400' : 'text-blue-400'
      })
    })

    if (reading?.interpretation) {
      tabs.push({ id: 'interpretation' as MainTabType, label: '解讀結果', icon: 'book' as const, color: 'text-yellow-400' })
    }

    return tabs
  }, [cardsData, reading])

  // 取得當前選中的卡牌
  const getCurrentCard = useCallback((): ReadingCard | null => {
    if (activeTab.startsWith('card-')) {
      const index = parseInt(activeTab.replace('card-', ''))
      return cardsData[index] || null
    }
    return null
  }, [activeTab, cardsData])

  const currentCard = getCurrentCard()

  // 當切換到新卡片時，自動選擇第一個可用的角色聲音（根據陣營過濾）
  useEffect(() => {
    if (currentCard?.character_voice_interpretations) {
      // ✅ 根據陣營過濾角色聲音（使用 API 資料）
      const filteredVoices = filterCharacterVoicesByFaction(
        currentCard.character_voice_interpretations,
        reading?.faction_influence,
        factions  // ✅ 傳入 factions 參數
      )
      const availableVoices = Object.keys(filteredVoices)

      if (availableVoices.length > 0 && !selectedVoice) {
        // 如果還沒選擇角色，自動選擇第一個
        setSelectedVoice(availableVoices[0])
      } else if (availableVoices.length > 0 && !availableVoices.includes(selectedVoice)) {
        // 如果當前選擇的角色不在過濾列表中，選擇第一個可用的
        setSelectedVoice(availableVoices[0])
      }
    }
  }, [currentCard, selectedVoice, reading?.faction_influence, factions])

  // 卡牌詳情相關的計算
  const cardImageUrl = useMemo(() => {
    if (!currentCard) return getFallbackImageUrl()
    const index = currentCard.card_index || 0
    return imageErrors[index] ? getFallbackImageUrl() : getCardImageUrl(currentCard as any)
  }, [currentCard, imageErrors])

  const uprightMeaning = useMemo(() => currentCard?.upright_meaning || currentCard?.meaning_upright || '未知含義', [currentCard])
  const reversedMeaning = useMemo(() => currentCard?.reversed_meaning || currentCard?.meaning_reversed || '未知含義', [currentCard])
  const currentMeaning = useMemo(() =>
    (currentCard?.is_reversed || currentCard?.position === 'reversed') ? reversedMeaning : uprightMeaning,
    [currentCard, uprightMeaning, reversedMeaning]
  )

  const radiationInfo = useMemo(() => getRadiationLevel(currentCard?.radiation_factor), [currentCard?.radiation_factor])

  const cardIsBookmarked = useMemo(() =>
    currentCard ? isBookmarked(currentCard.id.toString()) : false,
    [currentCard, isBookmarked]
  )

  const cardStudyProgress = useMemo(() =>
    currentCard ? getStudyProgress(currentCard.id.toString()) : null,
    [currentCard, getStudyProgress]
  )

  // 互動處理
  const handleBookmarkToggle = useCallback(async () => {
    if (!currentCard) return
    await toggleBookmark(currentCard)
  }, [currentCard, toggleBookmark])

  const handleSpeakText = useCallback((text: string) => {
    if (!audioSupported || isSpeaking) return
    try {
      speak(text)
    } catch (error) {
      console.error('Speech error:', error)
    }
  }, [audioSupported, isSpeaking, speak])

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }, [])

  // 確認刪除
  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const success = await deleteReading(readingId)
      if (success) {
        // 成功刪除後的追蹤
        import('@/lib/actionTracker').then(m => m.track('reading:delete', { id: readingId }))
        // 設置 reading 為 null，避免在跳轉過程中觸發 404
        setReading(null)
        // 關閉對話框
        setDeleteDialogOpen(false)
        // 刪除成功後跳轉到占卜列表頁面
        router.push('/readings')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  // 請求 AI 解讀
  const handleRequestAI = async () => {
    if (!reading || reading.ai_interpretation_requested) return

    try {
      const updated = await requestAIInterpretation(readingId, selectedProvider)
      if (updated) {
        // 更新本地 reading 狀態
        setReading(updated)
        // 追蹤 AI 請求
        import('@/lib/actionTracker').then(m => m.track('reading:ai-interpretation', { id: readingId, provider: selectedProvider }))
      }
    } catch (error) {
      console.error('AI interpretation request failed:', error)
    }
  }

  // === 渲染函數 ===

  // AI 解讀區塊（可在多個 tab 中使用）
  const renderAIInterpretationSection = () => {
    const hasAI = reading?.ai_interpretation_requested
    const canRequest = !hasAI && !isRequestingAI

    return (
      <div className="border-2 border-pip-boy-green/30 p-6 bg-black/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-pip-boy-green flex items-center gap-2 uppercase tracking-wider">
            <PixelIcon name="cpu" sizePreset="sm" variant="primary" decorative />
            AI 深度解讀
          </h3>

          {!hasAI && (
            <button
              onClick={handleRequestAI}
              disabled={!canRequest}
              className={cn(
                "px-4 py-2 border-2 border-pip-boy-green flex items-center gap-2 transition-all text-sm uppercase tracking-wider font-bold",
                canRequest
                  ? "bg-pip-boy-green/10 hover:bg-pip-boy-green/20 text-pip-boy-green cursor-pointer hover:scale-105"
                  : "bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed"
              )}
            >
              {isRequestingAI ? (
                <>
                  <PixelIcon name="loader" animation="spin" sizePreset="xs" decorative />
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <PixelIcon name="sparkles" sizePreset="xs" variant="warning" decorative />
                  <span>請求 AI 解讀</span>
                </>
              )}
            </button>
          )}

          {hasAI && (
            <div className="flex items-center gap-2 text-xs text-pip-boy-green/70">
              <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
              <span className="uppercase tracking-wider">已使用 AI 解讀</span>
              {reading.ai_interpretation_at && (
                <span className="text-pip-boy-green/50">
                  ({new Date(reading.ai_interpretation_at).toLocaleDateString('zh-TW')})
                </span>
              )}
              {reading.ai_interpretation_provider && (
                <span className="text-pip-boy-green/50">
                  - {reading.ai_interpretation_provider.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI Provider 選擇 Switch（未使用 AI 解讀時顯示）*/}
        {!hasAI && (
          <div className="mb-4 flex items-center justify-center gap-3 p-3 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded">
            <span className={cn(
              "text-sm font-bold uppercase tracking-wider transition-colors",
              selectedProvider === 'openai' ? 'text-pip-boy-green' : 'text-pip-boy-green/50'
            )}>
              OpenAI
            </span>
            <Switch
              checked={selectedProvider === 'gemini'}
              onCheckedChange={(checked) => setSelectedProvider(checked ? 'gemini' : 'openai')}
              disabled={hasAI}
              className="data-[state=checked]:bg-pip-boy-green"
            />
            <span className={cn(
              "text-sm font-bold uppercase tracking-wider transition-colors",
              selectedProvider === 'gemini' ? 'text-pip-boy-green' : 'text-pip-boy-green/50'
            )}>
              Gemini
            </span>
          </div>
        )}

        {/* AI 解讀內容 */}
        {hasAI && reading.overall_interpretation && (
          <div className="space-y-4">
            <div className="bg-black/70 p-4 border border-pip-boy-green/20 rounded">
              <p className="text-sm text-pip-boy-green/90 leading-relaxed whitespace-pre-wrap">
                {reading.overall_interpretation}
              </p>
            </div>

            {reading.summary_message && (
              <div className="bg-pip-boy-green/5 p-3 border-l-4 border-pip-boy-green rounded">
                <p className="text-xs text-pip-boy-green font-bold uppercase tracking-wider">
                  {reading.summary_message}
                </p>
              </div>
            )}

            {reading.prediction_confidence !== undefined && (
              <div className="flex items-center gap-2 text-xs text-pip-boy-green/60">
                <PixelIcon name="chart" sizePreset="xs" decorative />
                <span className="uppercase tracking-wider">
                  預測信心度: {(reading.prediction_confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* 未請求時的說明 */}
        {!hasAI && !isRequestingAI && (
          <div className="text-sm text-pip-boy-green/70 space-y-2">
            <p className="leading-relaxed">
              使用 AI 深度分析你的占卜結果，獲得更詳細的解讀與建議。
            </p>
            <p className="text-xs text-pip-boy-green/50 flex items-center gap-2">
              <PixelIcon name="alert" sizePreset="xs" variant="warning" decorative />
              <span className="uppercase tracking-wider">注意：每次占卜只能使用一次 AI 解讀功能</span>
            </p>
          </div>
        )}

        {/* 錯誤顯示 */}
        {storeError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 p-3 rounded">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <PixelIcon name="alert" sizePreset="xs" variant="error" decorative />
              <span>{storeError}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 1. 占卜總覽 Tab
  const renderOverviewTab = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* AI 解讀區塊 */}
      {renderAIInterpretationSection()}

      {/* 占卜資訊卡片 */}
      <div className="border-2 border-pip-boy-green bg-pip-boy-green/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-pip-boy-green">占卜記錄</h2>
          <span className="text-sm text-pip-boy-green/70">
            {reading && formatDate(reading.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {reading?.spread_type && (
            <span className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-sm rounded">
              {getSpreadTypeName(reading.spread_type)}
            </span>
          )}
          {reading?.faction_influence && (
            <span className="px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-sm rounded">
              派系: {reading.faction_influence}
            </span>
          )}
        </div>

        <div className="border-l-4 border-pip-boy-green/50 pl-4 py-2 bg-pip-boy-green/5">
          <p className="text-pip-boy-green italic text-lg">
            "{reading?.question}"
          </p>
        </div>
      </div>

      {/* 所有卡牌網格 */}
      <div>
        <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
          <PixelIcon name="spade" sizePreset="sm" variant="primary" decorative />
          抽到的卡牌
        </h3>

        {cardsData.length === 0 ? (
          /* 無卡牌資料的提示 */
          <div className="border-2 border-orange-400/40 bg-orange-500/5 p-8 rounded-lg">
            <div className="text-center space-y-4">
              <PixelIcon name="alert-triangle" sizePreset="xl" variant="warning" animation="pulse" decorative />
              <div>
                <h4 className="text-orange-400 font-bold text-lg mb-2">暫無卡牌資料</h4>
                <p className="text-pip-boy-green/70 text-sm">
                  此占卜記錄的卡牌資料尚未載入或不可用。
                </p>
                <p className="text-pip-boy-green/60 text-xs mt-2">
                  這可能是由於資料庫中的占卜記錄尚未包含完整的卡牌資訊。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cardsData.map((card, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveTab(`card-${index}` as MainTabType)}
              className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 hover:border-pip-boy-green hover:bg-pip-boy-green/10 hover:scale-105 transition-all duration-200 text-left group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="aspect-[2/3] bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex flex-col items-center justify-center mb-3 relative overflow-hidden">
                {card.number !== undefined && card.suit && !imageErrors[index] ? (
                  <img
                    src={getCardImageUrl(card as any)}
                    alt={getCardImageAlt(card as any)}
                    className={cn(
                      "w-full h-full object-cover",
                      card.is_reversed && "rotate-180"
                    )}
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <>
                    <PixelIcon name="spade" sizePreset="lg" variant="primary" decorative />
                    <span className="text-xs text-pip-boy-green/70 mt-2">
                      {card.position_in_reading}
                    </span>
                  </>
                )}
                {/* Hover 效果 */}
                <div className="absolute inset-0 bg-pip-boy-green/0 group-hover:bg-pip-boy-green/20 transition-colors flex items-center justify-center">
                  <PixelIcon
                    name="eye"
                    sizePreset="lg"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-pip-boy-green"
                    decorative
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-pip-boy-green mb-1">
                  {card.name}
                </p>
                {card.position_in_reading && (
                  <p className="text-xs text-pip-boy-green/70">
                    {card.position_in_reading}
                  </p>
                )}
                {card.is_reversed && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded">
                    逆位
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        )}
      </div>

      {/* 元資料區塊 */}
      {(reading?.character_voice || reading?.karma_context || reading?.faction_influence) && (
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
            <PixelIcon name="cog" sizePreset="sm" variant="primary" decorative />
            元資料
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reading?.character_voice && (
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 rounded-lg">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-pip-boy-green">
                  <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
                  角色聲音
                </h4>
                <p className="text-pip-boy-green/80 text-sm">{reading.character_voice}</p>
              </div>
            )}

            {reading?.karma_context && (
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 rounded-lg">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-pip-boy-green">
                  <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
                  業力背景
                </h4>
                <p className="text-pip-boy-green/80 text-sm">{reading.karma_context}</p>
              </div>
            )}

            {reading?.faction_influence && (
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 rounded-lg">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-pip-boy-green">
                  <PixelIcon name="flag" sizePreset="xs" variant="info" decorative />
                  派系影響
                </h4>
                <p className="text-pip-boy-green/80 text-sm">{reading.faction_influence}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )

  // 2. 卡牌詳情 Tab（整合 ReadingCardDetail 的內容）
  const renderCardDetailTab = () => {
    if (!currentCard) return null

    return (
      <motion.div
        key={`card-detail-${currentCard.card_index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {/* 占卜情境資訊 */}
        <div className="bg-orange-500/5 border border-orange-400/20 p-6 rounded-lg">
          <h3 className="text-orange-400 font-bold text-lg mb-4 flex items-center gap-2">
            <PixelIcon name="radioactive" sizePreset="sm" decorative />
            本次占卜情境
          </h3>

          <div className="space-y-4">
            {reading?.spread_type && (
              <div>
                <span className="text-pip-boy-green/70 text-sm">牌陣類型：</span>
                <span className="text-pip-boy-green ml-2">{getSpreadTypeName(reading.spread_type)}</span>
              </div>
            )}

            {reading?.question && (
              <div>
                <span className="text-pip-boy-green/70 text-sm">占卜問題：</span>
                <p className="text-pip-boy-green mt-1 italic border-l-4 border-orange-400/50 pl-3">
                  "{reading.question}"
                </p>
              </div>
            )}

            {currentCard.position_in_reading && (
              <div>
                <span className="text-pip-boy-green/70 text-sm">牌陣位置：</span>
                <span className="text-orange-400 ml-2 font-bold">{currentCard.position_in_reading}</span>
                {currentCard.card_index !== undefined && cardsData.length && (
                  <span className="text-pip-boy-green/60 ml-2 text-xs">
                    ({currentCard.card_index + 1}/{cardsData.length})
                  </span>
                )}
              </div>
            )}

            {currentCard.position_meaning && (
              <div className="mt-4 pt-4 border-t border-orange-400/20">
                <h4 className="text-orange-400/80 font-bold text-sm mb-2">此位置代表：</h4>
                <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                  {currentCard.position_meaning}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 卡牌圖片與基本資訊 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側 - 卡牌圖片 */}
          <div className="space-y-4">
            <div className="relative">
              <div className="w-full max-w-md mx-auto aspect-[2/3] border-2 border-pip-boy-green/60 rounded-lg overflow-hidden bg-wasteland-dark relative">
                {imageErrors[currentCard.card_index || 0] ? (
                  <div className="w-full h-full flex items-center justify-center text-pip-boy-green/60">
                    <div className="text-center">
                      <PixelIcon name="alert" sizePreset="lg" decorative />
                      <div className="text-sm mt-2">圖片載入失敗</div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={cardImageUrl}
                    alt={getCardImageAlt(currentCard as any)}
                    className={cn(
                      "w-full h-full object-cover",
                      (currentCard.is_reversed || currentCard.position === 'reversed') && "rotate-180"
                    )}
                    onError={() => handleImageError(currentCard.card_index || 0)}
                  />
                )}
              </div>

              {(currentCard.is_reversed || currentCard.position === 'reversed') && (
                <div className="absolute top-2 left-2 bg-red-900/80 text-red-400 px-2 py-1 rounded text-xs">
                  逆位
                </div>
              )}
            </div>

            {/* 卡牌 Metadata */}
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-pip-boy-green/70">花色：</span>
                  <span className="text-pip-boy-green ml-1">{currentCard.suit}</span>
                </div>
                <div>
                  <span className="text-pip-boy-green/70">編號：</span>
                  <span className="text-pip-boy-green ml-1">{currentCard.number || currentCard.card_number || 'N/A'}</span>
                </div>
                {currentCard.karma_alignment && (
                  <div>
                    <span className="text-pip-boy-green/70">業力：</span>
                    <span className={getKarmaColor(currentCard.karma_alignment) + ' ml-1'}>{currentCard.karma_alignment}</span>
                  </div>
                )}
                {currentCard.radiation_factor !== undefined && (
                  <div>
                    <span className="text-pip-boy-green/70">輻射：</span>
                    <span className={radiationInfo.color + ' ml-1'}>{radiationInfo.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 關鍵詞 */}
            {currentCard.keywords && currentCard.keywords.length > 0 && (
              <div>
                <h4 className="text-pip-boy-green font-bold mb-2 flex items-center gap-2">
                  <PixelIcon name="target" sizePreset="xs" decorative />
                  關鍵詞
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentCard.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-pip-boy-green/80 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側 - 當前含義 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
                <PixelIcon name="book" sizePreset="sm" decorative />
                在此情境下的意義
              </h4>
              <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-pip-boy-green/70">卡牌狀態：</span>
                  {(currentCard.is_reversed || currentCard.position === 'reversed') ? (
                    <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded flex items-center gap-1">
                      <PixelIcon name="alert" sizePreset="xs" decorative />
                      逆位
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs rounded">
                      正位
                    </span>
                  )}
                </div>
                <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                  {currentMeaning}
                </p>
              </div>
            </div>

            {currentCard.description && (
              <div>
                <h4 className="text-pip-boy-green font-bold mb-2 flex items-center gap-2">
                  <PixelIcon name="info" sizePreset="xs" decorative />
                  描述
                </h4>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
                  <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                    {currentCard.description}
                  </p>
                </div>
              </div>
            )}

            {currentCard.fallout_reference && (
              <div>
                <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
                  <PixelIcon name="radioactive" sizePreset="sm" decorative />
                  廢土背景
                </h4>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
                  <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                    {currentCard.fallout_reference}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 正逆位含義對照 */}
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-pip-boy-green">
            正逆位含義
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
                <PixelIcon name="arrow-up" sizePreset="sm" decorative />
                正位意義
              </h4>
              <div className="bg-blue-500/5 border border-blue-400/20 p-4 rounded-lg">
                <p className="text-blue-300/90 text-sm leading-relaxed">
                  {uprightMeaning}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-orange-400 font-bold text-lg mb-3 flex items-center gap-2">
                <PixelIcon name="arrow-down" sizePreset="sm" decorative />
                逆位意義
              </h4>
              <div className="bg-orange-500/5 border border-orange-400/20 p-4 rounded-lg">
                <p className="text-orange-300/90 text-sm leading-relaxed">
                  {reversedMeaning}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 角色聲音解讀 */}
        {currentCard.character_voice_interpretations && (() => {
          // 調試信息
          console.log('🎭 [Card Detail] Character voice interpretations:', currentCard.character_voice_interpretations)
          console.log('🎭 [Card Detail] Faction influence:', reading?.faction_influence)

          // ✅ 根據陣營過濾角色聲音（使用 API 資料）
          const filteredVoices = filterCharacterVoicesByFaction(
            currentCard.character_voice_interpretations,
            reading?.faction_influence,
            factions  // ✅ 傳入 factions 參數
          )
          const availableVoices = Object.keys(filteredVoices)

          console.log('🎭 [Card Detail] Filtered voices:', filteredVoices)
          console.log('🎭 [Card Detail] Available voices count:', availableVoices.length)

          // 如果沒有可用的角色聲音，不顯示這個區塊
          if (availableVoices.length === 0) {
            console.log('⚠️ [Card Detail] No voices available after filtering')
            return null
          }

          return (
            <div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-pip-boy-green">
                角色聲音解讀
              </h3>

              {/* 角色選擇 */}
              <div className="mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableVoices.map((voice) => {
                    const isSelected = selectedVoice === voice

                    return (
                      <button
                        key={voice}
                        onClick={() => setSelectedVoice(voice)}
                        className={cn(
                          "p-3 text-xs border rounded-lg transition-all duration-200",
                          isSelected
                            ? "bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green shadow-lg"
                            : "border-pip-boy-green/20 text-pip-boy-green/70 hover:bg-pip-boy-green/10"
                        )}
                      >
                        <span className="font-bold">{getVoiceLabel(voice.toLowerCase())}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 角色解讀內容 */}
              <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-pip-boy-green font-bold flex items-center gap-2">
                    <PixelIcon name="message" sizePreset="sm" decorative />
                    {getVoiceLabel(selectedVoice.toLowerCase())} 的解讀
                  </h4>

                  {audioSupported && filteredVoices[selectedVoice] && (
                    <button
                      onClick={() => handleSpeakText(filteredVoices[selectedVoice])}
                      disabled={isSpeaking}
                      className={cn(
                        "p-2 rounded border transition-colors flex items-center gap-2",
                        isSpeaking
                          ? "bg-orange-500/20 border-orange-400 text-orange-400 animate-pulse"
                          : "border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10"
                      )}
                    >
                      {isSpeaking ? (
                        <>
                          <PixelIcon name="volume-x" sizePreset="xs" decorative />
                          <span className="text-xs">播放中...</span>
                        </>
                      ) : (
                        <>
                          <PixelIcon name="volume" sizePreset="xs" decorative />
                          <span className="text-xs">播放</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                  {filteredVoices[selectedVoice] || '無可用解讀'}
                </p>
              </div>
            </div>
          )
        })()}
      </motion.div>
    )
  }

  // 3. 解讀結果 Tab
  const renderInterpretationTab = () => (
    <motion.div
      key="interpretation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* AI 解讀區塊 */}
      {renderAIInterpretationSection()}

      {/* 原始解讀結果 */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
        <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
          <PixelIcon name="book" sizePreset="sm" variant="primary" decorative />
          完整解讀結果
        </h3>

        <p className="text-pip-boy-green/90 whitespace-pre-wrap leading-relaxed">
          {reading?.interpretation}
        </p>
      </div>
    </motion.div>
  )

  // 4. 元資料 Tab
  const renderMetadataTab = () => (
    <motion.div
      key="metadata"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reading?.character_voice && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
              角色聲音
            </h3>
            <p className="text-pip-boy-green/80 text-sm">{reading.character_voice}</p>
          </div>
        )}

        {reading?.karma_context && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
              業力背景
            </h3>
            <p className="text-pip-boy-green/80 text-sm">{reading.karma_context}</p>
          </div>
        )}

        {reading?.faction_influence && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="flag" sizePreset="xs" variant="info" decorative />
              派系影響
            </h3>
            <p className="text-pip-boy-green/80 text-sm">{reading.faction_influence}</p>
          </div>
        )}
      </div>
    </motion.div>
  )

  // === Loading & Error States ===
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入占卜記錄...</p>
        </div>
      </div>
    )
  }

  if (error || !reading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-red-500 bg-red-500/10 p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <PixelIcon name="alert-triangle" sizePreset="lg" variant="error" animation="pulse" decorative />
            <h2 className="text-xl font-bold text-red-400 uppercase">錯誤</h2>
          </div>
          <p className="text-red-300 mb-6">{error || '找不到此占卜記錄'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green hover:bg-pip-boy-green/20 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回 Dashboard
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/readings')}
            className="flex items-center gap-2 text-pip-boy-green hover:text-pip-boy-green/80 transition-colors mb-4"
          >
            <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
            <span className="text-sm uppercase tracking-wider">返回占卜紀錄</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b-2 border-pip-boy-green/30 mb-6">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-pip-boy-green/30">
            {tabConfig.map((tab, index) => {
              const isActive = activeTab === tab.id
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? `${tab.color} border-current bg-pip-boy-green/5`
                      : "text-pip-boy-green/60 border-transparent hover:text-pip-boy-green/80 hover:bg-pip-boy-green/5"
                  )}
                  whileHover={{ y: -1 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PixelIcon name={tab.icon} sizePreset="xs" decorative />
                  <span>{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab.startsWith('card-') && renderCardDetailTab()}
            {activeTab === 'interpretation' && renderInterpretationTab()}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-3 border-2 border-pip-boy-green bg-transparent text-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回 Dashboard
            </span>
          </button>

          {/* Share Button - 只對已完成的占卜顯示 */}
          {reading && <ShareButton readingId={reading.id} />}

          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="px-4 py-3 border-2 border-red-400 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="trash" sizePreset="xs" decorative />
              刪除占卜
            </span>
          </button>

          <button
            onClick={() => router.push('/readings/new')}
            className="px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="plus" sizePreset="xs" variant="success" decorative />
              新占卜
            </span>
          </button>
        </div>

        {/* 刪除確認對話框 */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="刪除占卜記錄"
          description="確定要刪除這筆占卜記錄嗎？此操作無法復原，所有相關的卡牌和解讀資料都將被永久刪除。"
          confirmText="刪除"
          cancelText="取消"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}
