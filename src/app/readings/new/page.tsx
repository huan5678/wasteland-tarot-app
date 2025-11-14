'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CardDraw } from '@/components/tarot/CardDraw';
import { CardThumbnail } from '@/components/cards/CardThumbnail';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyButton, PipBoyCard, PipBoyCardHeader, PipBoyCardTitle, PipBoyCardContent } from '@/components/ui/pipboy';
import { readingsAPI } from '@/lib/api';
import { SpreadSelector } from '@/components/readings/SpreadSelector';
import { SpreadLayoutPreview } from '@/components/readings/SpreadLayoutPreview';
import { toCanonical } from '@/lib/spreadMapping';
import { spreadPositionMeanings } from '@/lib/spreadLayouts';
import { InteractiveCardDraw } from '@/components/tarot/InteractiveCardDraw';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAnalytics, useReadingTracking } from '@/hooks/useAnalytics';
import { useSessionStore } from '@/lib/sessionStore';
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore';
import { useAutoSave, useSessionChangeTracker } from '@/hooks/useAutoSave';
import { AutoSaveIndicator } from '@/components/session/AutoSaveIndicator';
import { CardDetailModal } from '@/components/tarot/CardDetailModal';
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal';
import { enhanceCardBasic } from '@/hooks/useCardEnhancement';
import type { SessionState } from '@/types/session';
import commonQuestionsData from '@/data/commonTarotQuestions.json';import { Button } from "@/components/ui/button";

interface TarotCardWithPosition {
  id: number; // Display ID (for UI compatibility)
  uuid?: string; // Backend UUID (for API calls and storage)
  name: string;
  suit: string;
  number?: number;
  upright_meaning: string;
  reversed_meaning: string;
  image_url: string;
  keywords: string[];
  position: 'upright' | 'reversed';
}

export default function NewReadingPage() {
  // 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth();
  const { prefersReducedMotion } = usePrefersReducedMotion();

  // Get spread templates loading state
  const isSpreadsLoading = useSpreadTemplatesStore(s => s.isLoading);

  const [step, setStep] = useState<'setup' | 'drawing' | 'results'>('setup');
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<string>('single_wasteland_reading');
  const [drawnCards, setDrawnCards] = useState<TarotCardWithPosition[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [readingId, setReadingId] = useState<string>();
  const [hasAutoSaved, setHasAutoSaved] = useState(false); // 追蹤是否已自動儲存

  // 從每個類別隨機選一個問題
  const [randomQuestions] = useState(() => {
    return commonQuestionsData.categories.map((category) => {
      const randomIndex = Math.floor(Math.random() * category.questions.length);
      return {
        text: category.questions[randomIndex],
        category: category.name
      };
    });
  });

  // Card Detail Modal state
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<DetailedTarotCard | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Analytics hooks
  const { trackReadingCreated, trackReadingCompleted, trackFeatureUsage } = useAnalytics();
  const { trackCardView } = useReadingTracking(readingId);
  const readingStartTime = useRef<number>(Date.now());

  // Session store hooks
  const {
    activeSession,
    createSession,
    updateSession,
    completeSession,
    setActiveSession,
    resumeSession
  } = useSessionStore();

  // Auto-save hook
  const { triggerSave, saveNow, status: autoSaveStatus } = useAutoSave({
    debounceMs: 2000,
    enabled: true,
    onSaveSuccess: (session) => {
      console.log('Session auto-saved:', session.id);
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error);
      toast.error('自動儲存失敗', { description: error.message });
    }
  });

  // Track session changes for auto-save
  useSessionChangeTracker(activeSession, {
    onChange: triggerSave,
    watchFields: ['session_state', 'question']
  });

  // Track if session has been initialized to prevent infinite loop
  const sessionInitialized = useRef(false);
  const initialSessionId = useRef<string | null>(null);

  // CRITICAL: Generate stable reading ID for InteractiveCardDraw to prevent infinite loop
  const stableReadingIdRef = useRef<string>(`temp-reading-${Date.now()}`);

  // Prevent body scrolling during drawing step
  useEffect(() => {
    if (step === 'drawing') {
      // Save original overflow value
      const originalOverflow = document.body.style.overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore original overflow when leaving drawing step
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [step]);

  // Initialize or resume session on mount
  useEffect(() => {
    const initializeSession = async () => {
      // 簡潔的檢查
      if (!isReady) return;

      // Check if there's an active session to resume
      if (activeSession) {
        // Only initialize if this is a new session or first load
        if (!sessionInitialized.current || initialSessionId.current !== activeSession.id) {
          sessionInitialized.current = true;
          initialSessionId.current = activeSession.id;

          // Restore state from active session
          if (activeSession.question) setQuestion(activeSession.question);
          if (activeSession.spread_type) setSpreadType(activeSession.spread_type);

          const sessionState = activeSession.session_state;
          if (sessionState) {
            // Restore cards if they exist
            if (sessionState.cards_drawn && sessionState.cards_drawn.length > 0) {
              // Fetch full card data from API based on card_ids
              const fetchFullCards = async () => {
                try {
                  const { cardsAPI } = await import('@/lib/api/services');
                  const cardPromises = sessionState.cards_drawn!.map(async (card) => {
                    try {
                      // Fetch full card data from API using UUID
                      const fullCard = await cardsAPI.getById(card.card_id);
                      return {
                        ...fullCard,
                        // Keep both UUID (for storage) and number ID (for UI compatibility)
                        uuid: fullCard.id, // Backend UUID
                        id: fullCard.number || parseInt(fullCard.id.split('-')[0], 16) % 1000, // Display ID
                        position: card.position as 'upright' | 'reversed'
                      };
                    } catch (error) {
                      console.error(`Failed to fetch card ${card.card_id}:`, error);
                      // Fallback to minimal data if API fails
                      return {
                        uuid: card.card_id, // Preserve UUID for retry
                        id: parseInt(card.card_id.split('-')[0], 16) % 1000,
                        name: card.card_name,
                        suit: card.suit || '',
                        position: card.position as 'upright' | 'reversed',
                        upright_meaning: '',
                        reversed_meaning: '',
                        image_url: '',
                        keywords: []
                      };
                    }
                  });

                  const fullCards = await Promise.all(cardPromises);
                  setDrawnCards(fullCards as TarotCardWithPosition[]);
                } catch (error) {
                  console.error('Failed to restore cards:', error);
                  // Fallback to basic restore without full data
                  const restoredCards: TarotCardWithPosition[] = sessionState.cards_drawn!.map((card) => ({
                    uuid: card.card_id, // ✅ Preserve UUID for future retries
                    id: 0, // ✅ Placeholder display ID (will be replaced when API succeeds)
                    name: card.card_name,
                    suit: card.suit || '',
                    position: card.position as 'upright' | 'reversed',
                    upright_meaning: '',
                    reversed_meaning: '',
                    image_url: '',
                    keywords: []
                  }));
                  setDrawnCards(restoredCards);
                }
              };

              fetchFullCards();
            }

            // Restore interpretation progress
            if (sessionState.interpretation_progress?.text) {
              setInterpretation(sessionState.interpretation_progress.text);
            }

            // Determine current step based on state
            // CRITICAL FIX: Only auto-restore step on first load, don't override during active drawing
            if (sessionState.cards_drawn && sessionState.cards_drawn.length > 0) {
              // If cards are drawn, always go to results page
              // (interpretation will continue loading there if not completed)
              setStep('results');
            } else {
              setStep('setup');
            }
          }

          console.log('恢復現有會話:', activeSession.id);
        } else {
          // Session already initialized - don't override step during active operations
          console.log('[Session] Already initialized, skipping step override to preserve drawing state');
        }
      } else {
        // Reset initialization flag when no active session
        sessionInitialized.current = false;
        initialSessionId.current = null;
        console.log('無現有會話，等待用戶開始新占卜');
      }
    };

    initializeSession();
  }, [isReady, user, activeSession]);

  // Create session when question is submitted
  const createNewSession = async () => {
    if (!user?.id || !question.trim()) return;

    try {
      const sessionState: SessionState = {
        cards_drawn: [],
        current_card_index: 0
        // 🔧 FIX: Don't track interpretation progress in session_state
        // interpretation_progress: {
        //   started: false,
        //   completed: false
        // }
      };

      const session = await createSession({
        user_id: user.id,
        spread_type: toCanonical(spreadType),
        question: question.trim(),
        session_state: sessionState,
        status: 'active'
      });

      // CRITICAL FIX: Mark this session as initialized to prevent step reset
      sessionInitialized.current = true;
      initialSessionId.current = session.id;

      console.log('新會話已建立:', session.id);
      toast.success('會話已建立', { description: '你的占卜進度將自動儲存' });
    } catch (error) {
      console.error('建立會話失敗:', error);
      // Continue anyway - user can still use the reading without save/resume
    }
  };

  // Update session state when cards are drawn or interpretation changes
  const updateSessionState = async () => {
    if (!activeSession) return;

    const sessionState: SessionState = {
      cards_drawn: drawnCards.map((card) => ({
        card_id: card.uuid || card.id.toString(), // ✅ Use UUID if available, fallback to number ID
        card_name: card.name,
        suit: card.suit,
        position: card.position,
        drawn_at: new Date().toISOString()
      })),
      current_card_index: drawnCards.length
      // 🔧 FIX: Don't save interpretation to session_state
      // AI interpretation should only be generated when user explicitly requests it
      // interpretation_progress: {
      //   started: interpretation.length > 0,
      //   completed: !isGeneratingInterpretation && interpretation.length > 0,
      //   text: interpretation
      // }
    };

    try {
      await updateSession(activeSession.id, {
        session_state: sessionState,
        question: question
      });
    } catch (error) {
      console.error('更新會話狀態失敗:', error);
    }
  };

  // Update session state when relevant data changes
  useEffect(() => {
    if (activeSession && (drawnCards.length > 0 || interpretation)) {
      // Get position meanings for current spread type
      const canonicalSpreadType = toCanonical(spreadType);
      const positions = spreadPositionMeanings[canonicalSpreadType] || [];

      // Update the active session in the store to trigger auto-save
      const sessionState: SessionState = {
        cards_drawn: drawnCards.map((card, index) => ({
          card_id: card.uuid || card.id.toString(), // Use UUID if available, fallback to number ID
          card_name: card.name,
          suit: card.suit,
          position: card.position,
          drawn_at: new Date().toISOString(),
          // Add position metadata
          positionName: positions[index]?.name || `位置 ${index + 1}`,
          positionMeaning: positions[index]?.meaning || ''
        })),
        current_card_index: drawnCards.length
        // 🔧 FIX: Don't save interpretation to session_state
        // interpretation_progress: {
        //   started: interpretation.length > 0,
        //   completed: !isGeneratingInterpretation && interpretation.length > 0,
        //   text: interpretation
        // }
      };

      // Update local state only - auto-save will handle the API call
      setActiveSession({
        ...activeSession,
        session_state: sessionState,
        question: question
      });
    }
  }, [drawnCards, interpretation, isGeneratingInterpretation, spreadType]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      // Create session if not already exists
      if (!activeSession) {
        await createNewSession();
      }

      // Track question submission
      trackFeatureUsage('reading_creation', 'question_submitted', {
        spread_type: spreadType,
        question_length: question.length
      });
      setStep('drawing');
    }
  };

  // Handle back to step 1 (only allowed if no cards drawn yet)
  const handleBackToSetup = () => {
    if (step === 'drawing' && drawnCards.length === 0) {
      setStep('setup');
    }
  };

  const handleCardsDrawn = async (cards: any[]) => {
    console.log('[InteractiveCardDraw] Cards drawn:', cards);

    // Convert CardWithPosition to TarotCardWithPosition
    const convertedCards: TarotCardWithPosition[] = cards.map((card) => ({
      id: typeof card.id === 'number' ? card.id : (card.number || 0),
      uuid: typeof card.id === 'string' ? card.id : card.uuid,
      name: card.name,
      suit: card.suit,
      number: card.number,
      upright_meaning: card.upright_meaning,
      reversed_meaning: card.reversed_meaning,
      image_url: card.image_url,
      keywords: card.keywords || [],
      position: card.position,
      _position_meta: card.positionLabel // Preserve position label
    } as any));

    setDrawnCards(convertedCards);
    setStep('results');

    // Track cards drawn
    convertedCards.forEach((card) => {
      trackCardView(card.id.toString());
    });

    // Track reading creation
    trackReadingCreated({
      spread_type: spreadType,
      character_voice: 'pip-boy',
      question_length: question.length,
      card_ids: convertedCards.map((c) => c.id.toString())
    });

    await generateInterpretation(convertedCards);
  };

  const generateInterpretation = async (cards: TarotCardWithPosition[]) => {
    setIsGeneratingInterpretation(true);

    try {
      // Use interpretation engine for all spread types
      const { generateInterpretation: generateInterp } = await import('@/lib/interpretationEngine');
      const interpretation = generateInterp({ spreadType, question, cards });
      setInterpretation(interpretation);
    } catch (error) {
      console.error('Failed to generate interpretation:', error);
      // Fallback to basic interpretation if engine fails
      const fallbackInterpretation = cards.map((card, index) => {
        const positionLabel = `位置 ${index + 1}`;
        const meaning = card.position === 'upright' ? card.upright_meaning : card.reversed_meaning;
        return `**${positionLabel}: ${card.name} (${card.position === 'upright' ? '正位' : '逆位'})**\n${meaning}`;
      }).join('\n\n');

      setInterpretation(fallbackInterpretation + '\n\n請稍後再試以獲得更詳細的解讀。');
    } finally {
      setIsGeneratingInterpretation(false);
    }
  };

  // 自動儲存：當解讀完成後自動保存占卜記錄
  useEffect(() => {
    const autoSaveReading = async () => {
      // 檢查條件：解讀已完成、有卡牌、有解讀內容、還沒保存過
      if (!isGeneratingInterpretation && drawnCards.length > 0 && interpretation && !hasAutoSaved && activeSession) {
        console.log('[AutoSave] 條件滿足，開始自動保存占卜記錄');
        setHasAutoSaved(true); // 立即設置，防止重複保存
        await handleSaveReading();
      }
    };

    autoSaveReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeneratingInterpretation]);

  const handleSaveReading = async () => {
    console.log('[handleSaveReading] Called');
    console.log('[handleSaveReading] user:', user);
    console.log('[handleSaveReading] activeSession:', activeSession);
    console.log('[handleSaveReading] completeSession function:', completeSession);

    // Must have an active session to complete
    if (!activeSession) {
      console.log('[handleSaveReading] No active session!');
      toast.error('保存失敗', { description: '找不到會話記錄' });
      return;
    }

    setIsSaving(true);
    console.log('[handleSaveReading] Calling completeSession with id:', activeSession.id);

    try {
      // CRITICAL FIX: Force save session with cards_drawn BEFORE completing
      console.log('[handleSaveReading] Force saving session with cards_drawn...');
      console.log('[handleSaveReading] drawnCards count:', drawnCards.length);
      console.log('[handleSaveReading] activeSession.id:', activeSession.id);

      // Get position meanings for current spread type
      const canonicalSpreadType = toCanonical(spreadType);
      const positions = spreadPositionMeanings[canonicalSpreadType] || [];

      // Prepare session state with cards_drawn
      const sessionState: SessionState = {
        cards_drawn: drawnCards.map((card, index) => ({
          card_id: card.uuid || card.id.toString(), // Use UUID if available, fallback to number ID
          card_name: card.name,
          suit: card.suit,
          position: card.position,
          drawn_at: new Date().toISOString(),
          // Add position metadata
          positionName: positions[index]?.name || `位置 ${index + 1}`,
          positionMeaning: positions[index]?.meaning || ''
        })),
        current_card_index: drawnCards.length
        // 🔧 FIX: Don't save interpretation to session_state
        // interpretation_progress: {
        //   started: interpretation.length > 0,
        //   completed: !isGeneratingInterpretation && interpretation.length > 0,
        //   text: interpretation
        // }
      };

      console.log('[handleSaveReading] Prepared session_state:', sessionState);
      console.log('[handleSaveReading] cards_drawn count in session_state:', sessionState.cards_drawn.length);
      console.log('[handleSaveReading] First card in cards_drawn:', sessionState.cards_drawn[0]);

      // CRITICAL: Directly call updateSession API with explicit session_state
      let updatedSession;
      try {
        console.log('[handleSaveReading] Calling updateSession API...');
        updatedSession = await updateSession(activeSession.id, {
          session_state: sessionState,
          question: question
        });

        // Check if session was cleared (404/403 errors)
        if (!updatedSession) {
          console.error('[handleSaveReading] Session was cleared (not found or forbidden)');
          toast.error('會話已失效', { description: '無法找到或存取此會話' });
          throw new Error('Session was cleared');
        }

        console.log('[handleSaveReading] updateSession SUCCESS:', updatedSession);
        console.log('[handleSaveReading] Updated session.session_state.cards_drawn:', updatedSession.session_state?.cards_drawn);
      } catch (updateError) {
        console.error('[handleSaveReading] updateSession FAILED:', updateError);
        toast.error('保存會話失敗', { description: '無法更新會話資料' });
        throw updateError; // Re-throw to stop execution
      }

      console.log('[handleSaveReading] Session saved successfully, now calling completeSession');

      // CRITICAL FIX: Fetch spread templates and find matching template ID
      const { useSpreadTemplatesStore } = await import('@/lib/spreadTemplatesStore');
      await useSpreadTemplatesStore.getState().fetchAll();
      const spreadTemplates = useSpreadTemplatesStore.getState().templates;

      // Find the template matching our spread type
      const matchingTemplate = spreadTemplates.find((t) => t.spread_type === canonicalSpreadType);
      const spreadTemplateId = matchingTemplate?.id;

      console.log('[handleSaveReading] canonicalSpreadType:', canonicalSpreadType);
      console.log('[handleSaveReading] matchingTemplate:', matchingTemplate);
      console.log('[handleSaveReading] spreadTemplateId:', spreadTemplateId);

      // Complete the session (creates Reading record internally)
      // 🔧 FIX: Don't pass interpretation - AI interpretation should only be generated
      // when user explicitly requests it via "請求 AI 解讀" button
      const result = await completeSession(activeSession.id, {
        // interpretation: interpretation, // ❌ REMOVED: Don't auto-fill interpretation
        spread_template_id: spreadTemplateId, // ✅ NOW PASSING spread_template_id!
        character_voice: 'pip_boy',
        karma_context: 'neutral',
        faction_influence: 'independent' // 預設使用獨立派
      });

      console.log('會話已完成並轉換為 Reading:', result);

      // Track reading completion
      const duration = Math.floor((Date.now() - readingStartTime.current) / 1000);
      if (result.reading_id) {
        setReadingId(result.reading_id);
        trackReadingCompleted({
          reading_id: result.reading_id,
          duration: duration
        });
      }

      // Track action
      import('@/lib/actionTracker').then((m) => m.track('reading:create', {
        question,
        spread: spreadType,
        cards: drawnCards.length,
        reading_id: result.reading_id
      }));

      // CRITICAL FIX: Refresh readings store so new reading appears immediately
      console.log('[handleSaveReading] Refreshing readings store...');
      const { useReadingsStore } = await import('@/lib/readingsStore');
      await useReadingsStore.getState().fetchUserReadings(user!.id, true); // force refresh
      console.log('[handleSaveReading] Readings refreshed successfully');

      // 自動保存完成（不跳轉，由用戶選擇是否查看詳情）
      console.log('[handleSaveReading] 占卜記錄已自動保存，reading_id:', result.reading_id);
    } catch (error) {
      console.error('Failed to save reading:', error);
      const errorMessage = error instanceof Error ? error.message : '保存失敗';
      toast.error('保存失敗', { description: '無法儲存占卜結果，請稍後再試' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewReading = () => {
    // Clear active session to start fresh
    setActiveSession(null);

    setStep('setup');
    setQuestion('');
    setSpreadType('single_wasteland_reading');
    setDrawnCards([]);
    setInterpretation('');
    setHasAutoSaved(false); // 重置自動保存狀態
    setReadingId(undefined); // 清空 reading ID
    readingStartTime.current = Date.now();
  };

  // 查看詳情：跳轉到占卜詳情頁
  const handleViewDetail = () => {
    if (readingId) {
      window.location.href = `/readings/${readingId}`;
    }
  };

  // Handle card click to show detail modal
  const handleCardClick = (card: TarotCardWithPosition) => {
    // ✅ Enhance card data with basic information (API will load interpretations)
    const enhancedCard = enhanceCardBasic(card);
    setSelectedCardForDetail(enhancedCard);
    setIsCardModalOpen(true);
  };

  // Handle modal close
  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
    setSelectedCardForDetail(null);
  };

  // 統一載入畫面
  if (!isReady) {
    return <AuthLoading isVerifying={true} />;
  }

  return (
    <div className={cn(
      "flex flex-col bg-wasteland-dark overflow-x-hidden",
      step === 'drawing' ? '' : 'min-h-screen p-4'
    )}>
      <div className={step === 'drawing' ? 'flex flex-col' : 'max-w-4xl mx-auto w-full flex-1'}>
        {/* Header - hidden during card drawing step */}
        {step !== 'drawing' && (
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
        )}

        {/* Progress Indicator - always in normal flow */}
        <div className={cn(
          "flex items-center justify-center",
          step === 'drawing' ? 'py-4' : 'mb-8'
        )}>
          <div className="flex items-center gap-4">
            {/* Step 1 - clickable when in step 2 and no cards drawn yet */}
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                step === 'setup' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
                ['drawing', 'results'].includes(step) ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
                'border-pip-boy-green/50 text-pip-boy-green/50'
              } ${
                step === 'drawing' && drawnCards.length === 0 ? 'cursor-pointer hover:bg-pip-boy-green/40 transition-colors' : ''
              }`}
              onClick={step === 'drawing' && drawnCards.length === 0 ? handleBackToSetup : undefined}
              role={step === 'drawing' && drawnCards.length === 0 ? 'button' : undefined}
              aria-label={step === 'drawing' && drawnCards.length === 0 ? '返回問題設定' : undefined}
            >
              1
            </div>
            <div className={`w-16 h-px ${step === 'drawing' || step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
            step === 'drawing' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
            step === 'results' ? 'bg-pip-boy-green/20 text-pip-boy-green border-pip-boy-green' :
            'border-pip-boy-green/50 text-pip-boy-green/50'}`
            }>
              2
            </div>
            <div className={`w-16 h-px ${step === 'results' ? 'bg-pip-boy-green' : 'bg-pip-boy-green/50'}`}></div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
            step === 'results' ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green' :
            'border-pip-boy-green/50 text-pip-boy-green/50'}`
            }>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Question Setup */}
        {step === 'setup' &&
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="edit" size={20} className="mr-2" decorative />制定你的問題
            </h2>

            <form onSubmit={handleQuestionSubmit} className="space-y-6">
              <div>
                <label htmlFor="question" className="block text-pip-boy-green text-sm font-bold tracking-wide mb-2 uppercase">
                  你希望從廢土靈魂那裡尋求什麼指引？
                </label>
                <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 bg-wasteland-dark/50 border-2 border-pip-boy-green/50 text-pip-boy-green placeholder:text-pip-boy-green/40 focus:outline-none focus:border-pip-boy-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)] hover:border-pip-boy-green/70 disabled:cursor-not-allowed disabled:opacity-40 resize-none transition-colors font-[family-name:var(--font-cubic),monospace]"
                style={{ fontFamily: 'var(--font-cubic), monospace' }}
                placeholder="詢問關於你在後末世世界中的道路、關係、挑戰或未來..."
                rows={4}
                required />


                {/* 常見問題 Tags */}
                <div className="mt-3 space-y-2">
                  <p className="text-pip-boy-green/70 text-xs flex items-center">
                    <PixelIcon name="star" size={14} className="mr-1" decorative />
                    常見問題：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {randomQuestions.map((item, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setQuestion(item.text)}
                        className="px-3 py-1.5 border transition-all duration-200"
                        title={`${item.category}類問題`}
                      >
                        {item.text}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="text-pip-boy-green/60 text-xs mt-2 flex items-center">
                  <PixelIcon name="zap" size={16} className="mr-1" decorative />提示：請具體說明你真正需要指引的事項
                </p>
              </div>

              <div className="space-y-4">
                <SpreadSelector value={spreadType} onChange={(v) => setSpreadType(v as any)} />
              </div>

              <PipBoyButton
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={isSpreadsLoading || !question.trim()}>

                <PixelIcon name="target" size={16} className="mr-2" decorative />
                {isSpreadsLoading ? '載入牌陣中...' : '進行卡牌抽取'}
              </PipBoyButton>
            </form>
          </div>
        }

        {/* Step 2: Card Drawing */}
        {step === 'drawing' &&
        <div className="flex flex-col flex-1">
            {/* Header section - compact design for step 2 */}
            <div className="mx-4 mb-6 border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <h2 className="text-xl font-bold text-pip-boy-green mb-3 text-center flex items-center justify-center">
                <PixelIcon name="card-stack" size={20} className="mr-2" decorative />抽取你的卡牌
              </h2>

              <div className="text-center">
                <p className="text-pip-boy-green/80 text-sm italic mb-2">
                  "{question}"
                </p>
                <p className="text-pip-boy-green/60 text-xs">
                  在抽取卡牌時專注於你的問題
                </p>
              </div>
            </div>

            {/* Card drawing area - natural height */}
            <InteractiveCardDraw
                spreadType={toCanonical(spreadType)}
                positionsMeta={spreadPositionMeanings[toCanonical(spreadType)]?.map((p) => ({
                  id: p.name,
                  label: p.name
                }))}
                onCardsDrawn={handleCardsDrawn}
                enableAnimation={!prefersReducedMotion}
                animationDuration={1500}
                readingId={activeSession?.id || stableReadingIdRef.current}
              />
          </div>
        }

        {/* Step 3: Results */}
        {step === 'results' &&
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

              <div className="flex flex-wrap justify-center items-center gap-6 mb-6">
                {drawnCards.map((card, index) => {
                // 取得位置標籤
                const positionLabel = (card as any)._position_meta || (
                spreadType === 'three_card' ?
                index === 0 ? '戰前狀況' : index === 1 ? '當前廢土' : '重建希望' :
                `位置 ${index + 1}`);

                return (
                  <div
                    key={`${card.id}-${index}`}
                    className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    style={{
                      width: '200px',
                      height: '300px',
                    }}
                    onClick={() => handleCardClick(card)}>

                      <CardThumbnail
                      flippable
                      card={card}
                      isRevealed={true}
                      position={card.position}
                      size="medium"
                      positionLabel={positionLabel}
                      onClick={() => handleCardClick(card)} />

                    </div>);

              })}
              </div>
            </div>

            {/* Pip-Boy Interpretation */}
            <PipBoyCard variant="default" padding="lg">
              <PipBoyCardHeader>
                <PipBoyCardTitle>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="android" size={16} decorative />
                    Pip-Boy 解讀
                  </div>
                </PipBoyCardTitle>
              </PipBoyCardHeader>
              <PipBoyCardContent>
                {isGeneratingInterpretation ?
              <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-pip-boy-green text-sm">
                      分析量子塔羅模式中...
                    </p>
                  </div> :

              <div className="prose prose-sm max-w-none">
                    <div className="text-pip-boy-green/80 text-sm whitespace-pre-line leading-relaxed">
                      {interpretation}
                    </div>
                  </div>
              }
              </PipBoyCardContent>
            </PipBoyCard>

            {/* Action Buttons */}
            {!isGeneratingInterpretation &&
          <div className="space-y-4">
                {/* 自動儲存狀態提示 */}
                {isSaving && !hasAutoSaved &&
            <div className="flex items-center justify-center gap-2 text-pip-boy-green/80 text-sm">
                    <div className="w-4 h-4 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin"></div>
                    <span>正在儲存占卜記錄...</span>
                  </div>
            }

                {hasAutoSaved && readingId &&
            <div className="flex items-center justify-center gap-2 text-pip-boy-green/80 text-sm">
                    <PixelIcon name="checkbox-circle" size={16} decorative />
                    <span>占卜記錄已自動儲存至 Vault</span>
                  </div>
            }

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* 查看詳情按鈕（自動保存完成後顯示） */}
                  {hasAutoSaved && readingId &&
              <PipBoyButton
                onClick={handleViewDetail}
                variant="default"
                size="lg"
                className="flex-1">

                      <PixelIcon name="eye" size={16} className="mr-2" decorative />查看詳情
                    </PipBoyButton>
              }

                  {/* 新占卜按鈕 */}
                  <PipBoyButton
                onClick={handleNewReading}
                disabled={isSaving || isGeneratingInterpretation}
                variant="outline"
                size="lg"
                className="flex-1">

                    {isSaving ?
                <>
                        <PixelIcon name="loader" size={16} className="mr-2 animate-spin" decorative />
                        儲存中...
                      </> :

                <>
                        <PixelIcon name="magic" size={16} className="mr-2" decorative />
                        新占卜
                      </>
                }
                  </PipBoyButton>
                </div>

                {/* 說明文字 */}
                <p className="text-center text-pip-boy-green/60 text-xs">
                  {isSaving ?
              '正在自動儲存占卜記錄，請稍候...' :
              hasAutoSaved && readingId ?
              '占卜記錄已保存，點擊「查看詳情」可查看完整解讀和語音朗讀' :
              '占卜解讀完成後將自動儲存至 Vault'}
                </p>
              </div>
          }
          </div>
        }
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
        showPersonalNotes={!!user}
        factionInfluence="independent" />

    </div>);

}