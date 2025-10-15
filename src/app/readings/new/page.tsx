'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CardDraw } from '@/components/tarot/CardDraw'
import { CardThumbnailFlippable } from '@/components/cards/CardThumbnailFlippable'
import { PixelIcon } from '@/components/ui/icons'
import { readingsAPI } from '@/lib/api'
import { SpreadSelector } from '@/components/readings/SpreadSelector'
import { SpreadLayoutPreview } from '@/components/readings/SpreadLayoutPreview'
import { toCanonical } from '@/lib/spreadMapping'
import { SpreadInteractiveDraw } from '@/components/readings/SpreadInteractiveDraw'
import { useAuthStore } from '@/lib/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAnalytics, useReadingTracking } from '@/hooks/useAnalytics'
import { useSessionStore } from '@/lib/sessionStore'
import { useAutoSave, useSessionChangeTracker } from '@/hooks/useAutoSave'
import { AutoSaveIndicator } from '@/components/session/AutoSaveIndicator'
import { CardDetailModal } from '@/components/tarot/CardDetailModal'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { enhanceCardWithWastelandData } from '@/data/enhancedCards'
import type { SessionState } from '@/types/session'
import commonQuestionsData from '@/data/commonTarotQuestions.json'

interface TarotCardWithPosition {
  id: number
  name: string
  suit: string
  number?: number
  meaning_upright: string
  meaning_reversed: string
  image_url: string
  keywords: string[]
  position: 'upright' | 'reversed'
}

export default function NewReadingPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [step, setStep] = useState<'setup' | 'drawing' | 'results'>('setup')
  const [question, setQuestion] = useState('')
  const [spreadType, setSpreadType] = useState<string>('single_wasteland_reading')
  const [drawnCards, setDrawnCards] = useState<TarotCardWithPosition[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [readingId, setReadingId] = useState<string>()

  // 從每個類別隨機選一個問題
  const [randomQuestions] = useState(() => {
    return commonQuestionsData.categories.map(category => {
      const randomIndex = Math.floor(Math.random() * category.questions.length)
      return {
        text: category.questions[randomIndex],
        category: category.name
      }
    })
  })

  // Card Detail Modal state
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<DetailedTarotCard | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)

  // Analytics hooks
  const { trackReadingCreated, trackReadingCompleted, trackFeatureUsage } = useAnalytics()
  const { trackCardView } = useReadingTracking(readingId)
  const readingStartTime = useRef<number>(Date.now())

  // Session store hooks
  const {
    activeSession,
    createSession,
    updateSession,
    completeSession,
    setActiveSession,
    resumeSession,
  } = useSessionStore()

  // Auto-save hook
  const { triggerSave, saveNow, status: autoSaveStatus } = useAutoSave({
    debounceMs: 2000,
    enabled: true,
    onSaveSuccess: (session) => {
      console.log('Session auto-saved:', session.id)
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error)
      toast.error('自動儲存失敗', { description: error.message })
    },
  })

  // Track session changes for auto-save
  useSessionChangeTracker(activeSession, {
    onChange: triggerSave,
    watchFields: ['session_state', 'question'],
  })

  // Track if session has been initialized to prevent infinite loop
  const sessionInitialized = useRef(false)
  const initialSessionId = useRef<string | null>(null)

  // Initialize or resume session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!user?.id) return

      // Check if there's an active session to resume
      if (activeSession) {
        // Only initialize if this is a new session or first load
        if (!sessionInitialized.current || initialSessionId.current !== activeSession.id) {
          sessionInitialized.current = true
          initialSessionId.current = activeSession.id

          // Restore state from active session
          if (activeSession.question) setQuestion(activeSession.question)
          if (activeSession.spread_type) setSpreadType(activeSession.spread_type)

          const sessionState = activeSession.session_state
          if (sessionState) {
            // Restore cards if they exist
            if (sessionState.cards_drawn && sessionState.cards_drawn.length > 0) {
              const restoredCards: TarotCardWithPosition[] = sessionState.cards_drawn.map((card) => ({
                id: parseInt(card.card_id),
                name: card.card_name,
                suit: card.suit || '',
                position: card.position as 'upright' | 'reversed',
                meaning_upright: '',
                meaning_reversed: '',
                image_url: '',
                keywords: [],
              }))
              setDrawnCards(restoredCards)
            }

            // Restore interpretation progress
            if (sessionState.interpretation_progress?.text) {
              setInterpretation(sessionState.interpretation_progress.text)
            }

            // Determine current step based on state
            if (sessionState.cards_drawn && sessionState.cards_drawn.length > 0) {
              if (sessionState.interpretation_progress?.completed) {
                setStep('results')
              } else {
                setStep('drawing')
              }
            } else {
              setStep('setup')
            }
          }

          console.log('恢復現有會話:', activeSession.id)
        }
      } else {
        // Reset initialization flag when no active session
        sessionInitialized.current = false
        initialSessionId.current = null
        console.log('無現有會話，等待用戶開始新占卜')
      }
    }

    initializeSession()
  }, [user, activeSession])

  // Create session when question is submitted
  const createNewSession = async () => {
    if (!user?.id || !question.trim()) return

    try {
      const sessionState: SessionState = {
        cards_drawn: [],
        current_card_index: 0,
        interpretation_progress: {
          started: false,
          completed: false,
        },
      }

      const session = await createSession({
        user_id: user.id,
        spread_type: toCanonical(spreadType),
        question: question.trim(),
        session_state: sessionState,
        status: 'active',
      })

      console.log('新會話已建立:', session.id)
      toast.success('會話已建立', { description: '你的占卜進度將自動儲存' })
    } catch (error) {
      console.error('建立會話失敗:', error)
      // Continue anyway - user can still use the reading without save/resume
    }
  }

  // Update session state when cards are drawn or interpretation changes
  const updateSessionState = async () => {
    if (!activeSession) return

    const sessionState: SessionState = {
      cards_drawn: drawnCards.map((card) => ({
        card_id: card.id.toString(),
        card_name: card.name,
        suit: card.suit,
        position: card.position,
        drawn_at: new Date().toISOString(),
      })),
      current_card_index: drawnCards.length,
      interpretation_progress: {
        started: interpretation.length > 0,
        completed: !isGeneratingInterpretation && interpretation.length > 0,
        text: interpretation,
      },
    }

    try {
      await updateSession(activeSession.id, {
        session_state: sessionState,
        question: question,
      })
    } catch (error) {
      console.error('更新會話狀態失敗:', error)
    }
  }

  // Update session state when relevant data changes
  useEffect(() => {
    if (activeSession && (drawnCards.length > 0 || interpretation)) {
      // Update the active session in the store to trigger auto-save
      const sessionState: SessionState = {
        cards_drawn: drawnCards.map((card) => ({
          card_id: card.id.toString(),
          card_name: card.name,
          suit: card.suit,
          position: card.position,
          drawn_at: new Date().toISOString(),
        })),
        current_card_index: drawnCards.length,
        interpretation_progress: {
          started: interpretation.length > 0,
          completed: !isGeneratingInterpretation && interpretation.length > 0,
          text: interpretation,
        },
      }

      // Update local state only - auto-save will handle the API call
      setActiveSession({
        ...activeSession,
        session_state: sessionState,
        question: question,
      })
    }
  }, [drawnCards, interpretation, isGeneratingInterpretation])

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      // Create session if not already exists
      if (!activeSession) {
        await createNewSession()
      }

      // Track question submission
      trackFeatureUsage('reading_creation', 'question_submitted', {
        spread_type: spreadType,
        question_length: question.length
      })
      setStep('drawing')
    }
  }

  const handleCardsDrawn = async (cards: TarotCardWithPosition[]) => {
    setDrawnCards(cards)
    setStep('results')

    // Track cards drawn
    cards.forEach((card) => {
      trackCardView(card.id.toString())
    })

    // Track reading creation
    trackReadingCreated({
      spread_type: spreadType,
      character_voice: 'pip-boy',
      question_length: question.length,
      card_ids: cards.map(c => c.id.toString())
    })

    await generateInterpretation(cards)
  }

  const generateInterpretation = async (cards: TarotCardWithPosition[]) => {
    setIsGeneratingInterpretation(true)

    // Simulate AI interpretation generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock interpretation based on cards
    let mockInterpretation = ''

    // Use interpretation engine for all spread types
    const gen = (require('@/lib/interpretationEngine') as any).generateInterpretation({ spreadType, question, cards })
    setInterpretation(gen)
    setIsGeneratingInterpretation(false)
    return

    if (spreadType === 'single') {
      const card = cards[0]
      mockInterpretation = `The ${card.name} appears ${card.position} in response to your question about "${question}".

${card.position === 'upright' ? card.meaning_upright : card.meaning_reversed}

This card suggests that you should focus on ${card.keywords.slice(0, 3).join(', ')}.

In the context of the wasteland, this guidance can help you navigate the challenges ahead with wisdom and confidence.`
    } else {
      mockInterpretation = `Your three-card spread reveals a comprehensive answer to your question about "${question}":

**Past/Foundation (${cards[0].name} - ${cards[0].position}):**
${cards[0].position === 'upright' ? cards[0].meaning_upright : cards[0].meaning_reversed}

**Present/Challenge (${cards[1].name} - ${cards[1].position}):**
${cards[1].position === 'upright' ? cards[1].meaning_upright : cards[1].meaning_reversed}

**Future/Outcome (${cards[2].name} - ${cards[2].position}):**
${cards[2].position === 'upright' ? cards[2].meaning_upright : cards[2].meaning_reversed}

**Overall Message:**
The cards indicate a journey of transformation in the wasteland. Trust in your abilities and remain adaptable to the changing circumstances around you.`
    }

    setInterpretation(mockInterpretation)
    // Future: could call interpretationEngine for dynamic logic
    // Example (disabled now):
    // const gen = generateInterpretation({ spreadType, question, cards })
    // setInterpretation(gen)
    setIsGeneratingInterpretation(false)
  }

  const handleSaveReading = async () => {
    console.log('[handleSaveReading] Called')
    console.log('[handleSaveReading] user:', user)
    console.log('[handleSaveReading] activeSession:', activeSession)
    console.log('[handleSaveReading] completeSession function:', completeSession)

    if (!user) {
      console.log('[handleSaveReading] No user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Must have an active session to complete
    if (!activeSession) {
      console.log('[handleSaveReading] No active session!')
      toast.error('保存失敗', { description: '找不到會話記錄' })
      return
    }

    setIsSaving(true)
    console.log('[handleSaveReading] Calling completeSession with id:', activeSession.id)

    try {
      // Complete the session (creates Reading record internally)
      const result = await completeSession(activeSession.id, {
        interpretation: interpretation,
        character_voice: 'pip-boy',
        karma_context: 'neutral',
        faction_influence: 'vault-tec'
      })

      console.log('會話已完成並轉換為 Reading:', result)

      // Track reading completion
      const duration = Math.floor((Date.now() - readingStartTime.current) / 1000)
      if (result.reading_id) {
        setReadingId(result.reading_id)
        trackReadingCompleted({
          reading_id: result.reading_id,
          duration: duration
        })
      }

      // Track action
      import('@/lib/actionTracker').then(m=>m.track('reading:create',{
        question,
        spread: spreadType,
        cards: drawnCards.length,
        reading_id: result.reading_id
      }))

      // Show success message and redirect
      toast.success('占卜已保存', { description: '你的占卜結果已成功儲存至 Vault' })
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save reading:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失敗'
      toast.error('保存失敗', { description: '無法儲存占卜結果，請稍後再試' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewReading = () => {
    // Clear active session to start fresh
    setActiveSession(null)

    setStep('setup')
    setQuestion('')
    setSpreadType('single_wasteland_reading')
    setDrawnCards([])
    setInterpretation('')
    readingStartTime.current = Date.now()
  }

  // Handle card click to show detail modal
  const handleCardClick = (card: TarotCardWithPosition) => {
    // Enhance card data with Wasteland information
    const enhancedCard = enhanceCardWithWastelandData(card)
    setSelectedCardForDetail(enhancedCard)
    setIsCardModalOpen(true)
  }

  // Handle modal close
  const handleCloseCardModal = () => {
    setIsCardModalOpen(false)
    setSelectedCardForDetail(null)
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-pip-boy-green">
                新塔羅占卜
              </h1>
              <p className="text-pip-boy-green/70 text-sm">
                廢土占卜協議 - Pip-Boy 增強版
              </p>
            </div>
            {activeSession && (
              <div className="ml-4">
                <AutoSaveIndicator />
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
              step === 'setup' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
              ['drawing', 'results'].includes(step) ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
              'border-pip-boy-green/50 text-pip-boy-green/50'
            }`}>
              1
            </div>
            <div className={`w-16 h-px ${step === 'drawing' || step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
              step === 'drawing' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
              step === 'results' ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
              'border-pip-boy-green/50 text-pip-boy-green/50'
            }`}>
              2
            </div>
            <div className={`w-16 h-px ${step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
              step === 'results' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
              'border-pip-boy-green/50 text-pip-boy-green/50'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Question Setup */}
        {step === 'setup' && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="edit" size={20} className="mr-2" decorative />制定你的問題
            </h2>

            <form onSubmit={handleQuestionSubmit} className="space-y-6">
              <div>
                <label htmlFor="question" className="block text-pip-boy-green text-sm mb-2">
                  你希望從廢土靈魂那裡尋求什麼指引？
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green resize-none"
                  placeholder="詢問關於你在後末世世界中的道路、關係、挑戰或未來..."
                  rows={4}
                  required
                />

                {/* 常見問題 Tags */}
                <div className="mt-3 space-y-2">
                  <p className="text-pip-boy-green/70 text-xs flex items-center">
                    <PixelIcon name="star" size={14} className="mr-1" decorative />
                    常見問題：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {randomQuestions.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setQuestion(item.text)}
                        className="px-3 py-1.5 text-xs border border-pip-boy-green/40 text-pip-boy-green/80 hover:bg-pip-boy-green/10 hover:border-pip-boy-green/60 hover:text-pip-boy-green transition-all duration-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-pip-boy-green/30"
                        title={`${item.category}類問題`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-pip-boy-green/60 text-xs mt-2 flex items-center">
                  <PixelIcon name="zap" size={16} className="mr-1" decorative />提示：請具體說明你真正需要指引的事項
                </p>
              </div>

              <div className="space-y-4">
                <SpreadSelector value={spreadType} onChange={(v)=> setSpreadType(v as any)} />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-pip-boy-green text-wasteland-dark font-bold text-lg hover:bg-pip-boy-green/80 transition-colors flex items-center justify-center"
              >
                <PixelIcon name="target" size={16} className="mr-2" decorative />進行卡牌抽取
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Card Drawing */}
        {step === 'drawing' && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 text-center flex items-center justify-center">
              <PixelIcon name="card-stack" size={20} className="mr-2" decorative />抽取你的卡牌
            </h2>

            <div className="text-center mb-6">
              <p className="text-pip-boy-green/80 text-sm italic mb-2">
                "{question}"
              </p>
              <p className="text-pip-boy-green/60 text-xs">
                在抽取卡牌時專注於你的問題
              </p>
            </div>

            <SpreadInteractiveDraw spreadType={toCanonical(spreadType)} onDone={handleCardsDrawn} />
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="space-y-6">
            {/* Question Recap */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <h3 className="text-pip-boy-green font-bold mb-2">你的問題：</h3>
              <p className="text-pip-boy-green/80 text-sm italic">"{question}"</p>
            </div>

            {/* Cards Display */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4 text-center flex items-center justify-center">
                <PixelIcon name="card-stack" size={20} className="mr-2" decorative />你的卡牌
              </h3>

              <div className="flex justify-center mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                {drawnCards.map((card, index) => {
                  // 取得位置標籤
                  const positionLabel = (card as any)._position_meta ||
                    (spreadType === 'three_card'
                      ? (index === 0 ? '戰前狀況' : index === 1 ? '當前廢土' : '重建希望')
                      : `位置 ${index + 1}`)

                  return (
                    <div
                      key={`${card.id}-${index}`}
                      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      onClick={() => handleCardClick(card)}
                    >
                      <CardThumbnailFlippable
                        card={card}
                        isRevealed={true}
                        position={card.position}
                        size="medium"
                        positionLabel={positionLabel}
                        onClick={() => handleCardClick(card)}
                      />
                    </div>
                  )
                })}
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
                <PixelIcon name="android" size={16} className="mr-2" decorative />Pip-Boy 解讀
              </h3>

              {isGeneratingInterpretation ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-pip-boy-green text-sm">
                    分析量子塔羅模式中...
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="text-pip-boy-green/80 text-sm whitespace-pre-line leading-relaxed">
                    {interpretation}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isGeneratingInterpretation && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveReading}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-pip-boy-green text-wasteland-dark font-bold text-lg hover:bg-pip-boy-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <PixelIcon name="save" size={16} className="mr-2" decorative />{isSaving ? '保存中...' : '儲存至 Vault'}
                </button>
                <button
                  onClick={handleNewReading}
                  className="flex-1 py-3 border-2 border-pip-boy-green text-pip-boy-green font-bold text-lg hover:bg-pip-boy-green/10 transition-colors flex items-center justify-center"
                >
                  <PixelIcon name="reload" size={16} className="mr-2" decorative />新占卜
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCardForDetail}
        isOpen={isCardModalOpen}
        onClose={handleCloseCardModal}
        initialTab="overview"
        enableAudio={true}
        showQuickActions={true}
        isGuestMode={!user}
        showBookmark={!!user}
        showShare={true}
        showStudyMode={!!user}
        showPersonalNotes={!!user}
      />
    </div>
  )
}