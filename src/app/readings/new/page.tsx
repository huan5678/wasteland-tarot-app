'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CardDraw } from '@/components/tarot/CardDraw'
import { Zap, Target, Bot, Save, Edit3, Spade, RotateCcw } from 'lucide-react'
import { readingsAPI } from '@/lib/api'
import { SpreadSelector } from '@/components/readings/SpreadSelector'
import { SpreadLayoutPreview } from '@/components/readings/SpreadLayoutPreview'
import { toCanonical } from '@/lib/spreadMapping'
import { SpreadInteractiveDraw } from '@/components/readings/SpreadInteractiveDraw'
import { useAuthStore } from '@/lib/authStore'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/common/Toast'
import { useAnalytics, useReadingTracking } from '@/hooks/useAnalytics'

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
  const token = useAuthStore(s => s.token)
  const { showSuccess, showError } = useToast()
  const [step, setStep] = useState<'setup' | 'drawing' | 'results'>('setup')
  const [question, setQuestion] = useState('')
  const [spreadType, setSpreadType] = useState<string>('single')
  const [drawnCards, setDrawnCards] = useState<TarotCardWithPosition[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [readingId, setReadingId] = useState<string>()

  // Analytics hooks
  const { trackReadingCreated, trackReadingCompleted, trackFeatureUsage } = useAnalytics()
  const { trackCardView } = useReadingTracking(readingId)
  const readingStartTime = useRef<number>(Date.now())

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
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
    if (!user || !token) {
      router.push('/auth/login')
      return
    }

    setIsSaving(true)

    try {
      const readingData = {
        question: question,
        spread_type: toCanonical(spreadType),
        cards_drawn: drawnCards.map(card => ({
          id: card.id.toString(),
          name: card.name,
          suit: card.suit,
          position: card.position,
          position_meta: (card as any)._position_meta,
          meaning: card.position === 'upright' ? card.meaning_upright : card.meaning_reversed
        })),
        interpretation: interpretation,
        character_voice: 'pip-boy',
        karma_context: 'neutral',
        faction_influence: 'vault-tec'
      }

      import('@/lib/actionTracker').then(m=>m.track('reading:create',{question, spread: spreadType, cards: readingData.cards_drawn.length}))
      const savedReading = await readingsAPI.create(readingData)
      console.log('Reading saved successfully:', savedReading)

      // Set reading ID for tracking
      if (savedReading.id) {
        setReadingId(savedReading.id)
      }

      // Track reading completion
      const duration = Math.floor((Date.now() - readingStartTime.current) / 1000)
      trackReadingCompleted({
        reading_id: savedReading.id || 'unknown',
        duration: duration
      })

      // Show success message and redirect
      showSuccess('占卜已保存', '你的占卜結果已成功儲存至 Vault')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save reading:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失敗'
      showError('保存失敗', '無法儲存占卜結果，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewReading = () => {
    setStep('setup')
    setQuestion('')
    setSpreadType('single')
    setDrawnCards([])
    setInterpretation('')
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <h1 className="text-2xl font-bold text-pip-boy-green font-mono">
            新塔羅占卜
          </h1>
          <p className="text-pip-boy-green/70 font-mono text-sm">
            廢土占卜協議 - Pip-Boy 增強版
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
              step === 'setup' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
              ['drawing', 'results'].includes(step) ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
              'border-pip-boy-green/50 text-pip-boy-green/50'
            }`}>
              1
            </div>
            <div className={`w-16 h-px ${step === 'drawing' || step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
              step === 'drawing' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
              step === 'results' ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
              'border-pip-boy-green/50 text-pip-boy-green/50'
            }`}>
              2
            </div>
            <div className={`w-16 h-px ${step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
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
            <h2 className="text-xl font-bold text-pip-boy-green font-mono mb-4">
              <Edit3 className="w-5 h-5 mr-2 inline" />制定你的問題
            </h2>

            <form onSubmit={handleQuestionSubmit} className="space-y-6">
              <div>
                <label htmlFor="question" className="block text-pip-boy-green font-mono text-sm mb-2">
                  你希望從廢土靈魂那裡尋求什麼指引？
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-black border-2 border-pip-boy-green text-pip-boy-green font-mono placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green resize-none"
                  placeholder="詢問關於你在後末世世界中的道路、關係、挑戰或未來..."
                  rows={4}
                  required
                />
                <p className="text-pip-boy-green/60 text-xs font-mono mt-2">
                  <Zap className="w-4 h-4 mr-1 inline" />提示：請具體說明你真正需要指引的事項
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  <SpreadSelector value={spreadType} onChange={(v)=> setSpreadType(v as any)} />
                  <SpreadLayoutPreview spreadType={spreadType} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-pip-boy-green text-wasteland-dark font-mono font-bold text-lg hover:bg-pip-boy-green/80 transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />進行卡牌抽取
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Card Drawing */}
        {step === 'drawing' && (
          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
            <h2 className="text-xl font-bold text-pip-boy-green font-mono mb-4 text-center">
              <Spade className="w-5 h-5 mr-2 inline" />抽取你的卡牌
            </h2>

            <div className="text-center mb-6">
              <p className="text-pip-boy-green/80 font-mono text-sm italic mb-2">
                "{question}"
              </p>
              <p className="text-pip-boy-green/60 font-mono text-xs">
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
              <h3 className="text-pip-boy-green font-mono font-bold mb-2">你的問題：</h3>
              <p className="text-pip-boy-green/80 font-mono text-sm italic">"{question}"</p>
            </div>

            {/* Cards Display */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green font-mono mb-4 text-center">
                <Spade className="w-5 h-5 mr-2 inline" />你的卡牌
              </h3>

              <div className="flex justify-center gap-4 mb-6">
                {drawnCards.map((card, index) => (
                  <div key={`${card.id}-${index}`} className="text-center">
                    <div className="mb-2">
                      {/* The TarotCard component would be rendered here */}
                      <div className="w-32 h-48 border-2 border-pip-boy-green bg-pip-boy-green/10 rounded flex items-center justify-center">
                        <div className="text-center text-pip-boy-green">
                          <Spade className="w-8 h-8 mb-2 text-pip-boy-green" />
                          <div className="text-xs font-mono font-bold">{card.name}</div>
                          <div className="text-xs font-mono">{card.position}</div>
                        </div>
                      </div>
                    </div>
                    {spreadType === 'three_card' && (
                      <p className="text-pip-boy-green/70 text-xs font-mono">
                        {index === 0 ? '過去' : index === 1 ? '現在' : '未來'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Interpretation */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green font-mono mb-4">
                <Bot className="w-4 h-4 mr-2" />Pip-Boy 解讀
              </h3>

              {isGeneratingInterpretation ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-pip-boy-green font-mono text-sm">
                    分析量子塔羅模式中...
                  </p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="text-pip-boy-green/80 font-mono text-sm whitespace-pre-line leading-relaxed">
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
                  className="flex-1 py-3 bg-pip-boy-green text-wasteland-dark font-mono font-bold text-lg hover:bg-pip-boy-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />{isSaving ? '保存中...' : '儲存至 Vault'}
                </button>
                <button
                  onClick={handleNewReading}
                  className="flex-1 py-3 border-2 border-pip-boy-green text-pip-boy-green font-mono font-bold text-lg hover:bg-pip-boy-green/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2 inline" />新占卜
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}