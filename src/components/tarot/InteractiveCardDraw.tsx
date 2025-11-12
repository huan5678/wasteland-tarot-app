/**
 * InteractiveCardDraw Component
 *
 * Provides an interactive card drawing experience with:
 * - Fisher-Yates shuffle algorithm for unbiased randomization
 * - Framer Motion animations (with reduced motion support)
<<<<<<< HEAD
 * - Multiple spread type support
 * - State management for drawing flow
 *
 * Requirements: 1.1, 1.2, 1.3
=======
 * - ShuffleAnimation for visual shuffle feedback
 * - CardSpreadLayout for card arrangement
 * - CardFlipAnimation for individual card flips
 * - Multiple spread type support
 * - State management for drawing flow
 * - Performance monitoring and auto-degradation
 *
 * Requirements: 1.1-1.13
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFisherYatesShuffle } from '@/hooks/useFisherYatesShuffle';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
<<<<<<< HEAD
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import { cardsAPI } from '@/lib/api';
=======
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import { cardsAPI } from '@/lib/api';
import { ShuffleAnimation } from './ShuffleAnimation';
import { CardFlipAnimation } from './CardFlipAnimation';
import { CardSpreadLayout } from './CardSpreadLayout';
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG

/**
 * Drawing state machine
 */
export type DrawingState =
  | 'idle' // No drawing in progress
  | 'shuffling' // Shuffling the deck
  | 'selectingCards' // Showing card backs, waiting for user clicks
  | 'flipping' // Flipping a specific card
  | 'complete'; // Drawing complete

/**
 * Card with position information
 */
export interface CardWithPosition {
  id: string | number;
  name: string;
  suit: string;
  number?: number;
  upright_meaning: string;
  reversed_meaning: string;
  image_url: string;
  keywords: string[];
  position: 'upright' | 'reversed';
  positionIndex: number;
  positionLabel?: string;
}

/**
 * Props for InteractiveCardDraw component
 */
export interface InteractiveCardDrawProps {
  /** Type of spread to draw (e.g., 'single', 'three_card', 'celtic_cross') */
  spreadType: string;

  /** Metadata for each position in the spread */
  positionsMeta?: { id: string; label: string }[];

  /** Callback when cards are drawn and ready */
  onCardsDrawn: (cards: CardWithPosition[]) => void;

  /** Callback when drawing state changes */
  onDrawingStateChange?: (state: DrawingState) => void;

  /** Whether to enable animations (can be overridden by reduced motion preference) */
  enableAnimation?: boolean;

  /** Animation duration in milliseconds */
  animationDuration?: number;
<<<<<<< HEAD
=======

  /** Unique reading session ID for session recovery (optional, will generate if not provided) */
  readingId?: string;
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
}

/**
 * Valid spread types
 */
const VALID_SPREAD_TYPES = [
  'single',
  'single_wasteland',
  'single_wasteland_reading',
  'three_card',
  'vault_tec_spread',
  'raider_chaos',
  'raider_chaos_spread',
  'wasteland_survival',
  'wasteland_survival_spread',
  'ncr_strategic',
  'ncr_strategic_spread',
  'brotherhood_council',
  'brotherhood_council_spread',
  'celtic_cross',
];

/**
 * Get the number of cards to draw for a given spread type
 */
function getCardCount(
  spreadType: string,
  positionsMeta?: { id: string; label: string }[]
): number {
  // Priority 1: Use positionsMeta length if provided
  if (positionsMeta && positionsMeta.length > 0) {
    return positionsMeta.length;
  }

  // Priority 2: Map spread type to card count
  const spreadMap: Record<string, number> = {
    single: 1,
    single_wasteland: 1,
    single_wasteland_reading: 1,
    three_card: 3,
    vault_tec_spread: 3,
    raider_chaos: 4,
    raider_chaos_spread: 4,
    wasteland_survival: 5,
    wasteland_survival_spread: 5,
    ncr_strategic: 6,
    ncr_strategic_spread: 6,
    brotherhood_council: 7,
    brotherhood_council_spread: 7,
    celtic_cross: 10,
  };

  return spreadMap[spreadType] || 1;
}

/**
 * InteractiveCardDraw Component
 *
 * Main component for interactive card drawing with shuffle animations
 */
export function InteractiveCardDraw({
  spreadType,
  positionsMeta,
  onCardsDrawn,
  onDrawingStateChange,
  enableAnimation = true,
  animationDuration = 1500,
<<<<<<< HEAD
=======
  readingId = `reading-${Date.now()}`,
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
}: InteractiveCardDrawProps) {
  // Hooks
  const { shuffle } = useFisherYatesShuffle();
  const { prefersReducedMotion } = usePrefersReducedMotion();
<<<<<<< HEAD
=======
  const { hasIncompleteReading, savedState, saveState, restoreState, clearState } =
    useSessionRecovery(readingId);
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG

  // State
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [shuffledDeck, setShuffledDeck] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<any[]>([]); // Cards to flip (card backs)
  const [flippedCards, setFlippedCards] = useState<CardWithPosition[]>([]); // Cards that have been flipped
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null); // Currently flipping card index
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG

  // Ref to prevent animation overlap
  const isDrawingRef = useRef(false);

  // Determine if animations should be disabled
  const shouldDisableAnimations = prefersReducedMotion || !enableAnimation;

<<<<<<< HEAD
=======
  // Check for incomplete reading on mount
  useEffect(() => {
    if (hasIncompleteReading && savedState) {
      setShowRestorePrompt(true);
    }
  }, [hasIncompleteReading, savedState]);

>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
  // Validate spread type on mount
  useEffect(() => {
    if (!VALID_SPREAD_TYPES.includes(spreadType)) {
      console.error(
        `Invalid spread type: ${spreadType}. Valid types: ${VALID_SPREAD_TYPES.join(', ')}`
      );
    }
  }, [spreadType]);

  // Notify parent of state changes
  useEffect(() => {
    onDrawingStateChange?.(drawingState);
  }, [drawingState, onDrawingStateChange]);

<<<<<<< HEAD
=======
  // Save state when drawing state changes (except idle and complete)
  useEffect(() => {
    if (drawingState === 'idle' || drawingState === 'complete') {
      return;
    }

    // Map drawing state to savedState format
    const mappedState =
      drawingState === 'shuffling' ? 'shuffling' :
      drawingState === 'selectingCards' ? 'selecting' :
      drawingState === 'flipping' ? 'flipping' : 'idle';

    saveState({
      spreadType,
      drawingState: mappedState,
      shuffledDeck,
      drawnCards: flippedCards,
      revealedIndices: flippedCards.map(c => c.positionIndex),
    });
  }, [drawingState, spreadType, shuffledDeck, flippedCards, saveState]);

  // Clear state when complete
  useEffect(() => {
    if (drawingState === 'complete') {
      clearState();
    }
  }, [drawingState, clearState]);

  /**
   * Restore saved reading state
   */
  const handleRestoreReading = useCallback(() => {
    const restored = restoreState();
    if (!restored) {
      return;
    }

    // Restore state
    setShuffledDeck(restored.shuffledDeck);
    setFlippedCards(restored.drawnCards);
    setSelectedCards(restored.shuffledDeck.slice(0, restored.drawnCards.length));

    // Restore drawing state
    const mappedState =
      restored.drawingState === 'shuffling' ? 'shuffling' :
      restored.drawingState === 'selecting' ? 'selectingCards' :
      restored.drawingState === 'flipping' ? 'flipping' : 'idle';
    setDrawingState(mappedState as DrawingState);

    setShowRestorePrompt(false);
    console.log('[InteractiveCardDraw] Restored saved reading state');
  }, [restoreState]);

  /**
   * Decline restoration and start fresh
   */
  const handleDeclineRestore = useCallback(() => {
    clearState();
    setShowRestorePrompt(false);
  }, [clearState]);

>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
  /**
   * Main draw cards function - shuffles and shows card backs
   */
  const handleDrawCards = useCallback(async () => {
    // Prevent overlapping draws
    if (isDrawingRef.current || drawingState !== 'idle') {
      return;
    }

    isDrawingRef.current = true;
    setError(null);

    try {
      // Step 1: Fetch full deck from API
      setDrawingState('shuffling');
      const fullDeck = await cardsAPI.getAll();

      // Step 2: Shuffle the deck using Fisher-Yates
      const shuffled = shuffle(fullDeck);
      setShuffledDeck(shuffled);

      // Step 3: Wait for shuffle animation (if enabled)
      if (!shouldDisableAnimations) {
        await new Promise((resolve) =>
          setTimeout(resolve, animationDuration)
        );
      }

      // Step 4: Select cards from shuffled deck and show backs
      const cardCount = getCardCount(spreadType, positionsMeta);
      const selected = shuffled.slice(0, cardCount);
      setSelectedCards(selected);

      // Step 5: Transition to card selection state
      setDrawingState('selectingCards');

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '抽牌失敗，請稍後再試';
      setError(errorMessage);
      console.error('Card drawing error:', err);
      setDrawingState('idle');
    } finally {
      isDrawingRef.current = false;
    }
  }, [
    spreadType,
    positionsMeta,
    shuffle,
    shouldDisableAnimations,
    animationDuration,
    drawingState,
  ]);

  /**
<<<<<<< HEAD
   * Handle clicking a card back to flip it
   */
  const handleCardClick = useCallback(async (index: number) => {
    // Prevent clicking if already flipped or currently flipping another card
    if (flippingIndex !== null) return;
    if (flippedCards.some(c => c.positionIndex === index)) return;

    setFlippingIndex(index);
    setDrawingState('flipping');

    // Wait for flip animation
    if (!shouldDisableAnimations) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Add position information and mark as flipped
    const card = selectedCards[index];
    const cardWithPosition: CardWithPosition = {
      ...card,
      position: Math.random() > 0.5 ? 'upright' : 'reversed',
=======
   * Handle card flip completion (called by CardFlipAnimation)
   */
  const handleCardFlipComplete = useCallback((completedCard: CardWithPosition, index: number) => {
    // Prevent duplicate flips
    if (flippedCards.some(c => c.positionIndex === index)) {
      return;
    }

    // Add position information (randomize upright/reversed if not set)
    const card = selectedCards[index];
    const cardWithPosition: CardWithPosition = {
      ...card,
      ...completedCard,
      position: completedCard.position || (Math.random() > 0.5 ? 'upright' : 'reversed'),
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
      positionIndex: index,
      positionLabel: positionsMeta?.[index]?.label || `位置 ${index + 1}`,
    };

    const newFlippedCards = [...flippedCards, cardWithPosition];
    setFlippedCards(newFlippedCards);
    setFlippingIndex(null);

<<<<<<< HEAD
=======
    console.log('[InteractiveCardDraw] Card flipped:', cardWithPosition.name, cardWithPosition.position);

>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
    // Check if all cards are flipped
    if (newFlippedCards.length === selectedCards.length) {
      setDrawingState('complete');
      // Notify parent component
      onCardsDrawn(newFlippedCards);
    } else {
      // Return to card selection state
      setDrawingState('selectingCards');
    }
  }, [
<<<<<<< HEAD
    flippingIndex,
=======
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
    flippedCards,
    selectedCards,
    positionsMeta,
    onCardsDrawn,
<<<<<<< HEAD
    shouldDisableAnimations,
=======
  ]);

  /**
   * Handle card click to trigger flip
   */
  const handleCardClick = useCallback((index: number) => {
    // Prevent clicking if already flipped or currently flipping another card
    if (flippingIndex !== null) return;
    if (flippedCards.some(c => c.positionIndex === index)) return;

    setFlippingIndex(index);
    setDrawingState('flipping');
  }, [
    flippingIndex,
    flippedCards,
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
  ]);

  return (
    <div
      data-testid="interactive-card-draw"
      data-reduced-motion={shouldDisableAnimations}
      className="flex flex-col items-center justify-center p-6"
    >
      {/* Hidden state indicator for testing */}
      <div data-testid="drawing-state" className="sr-only">
        {drawingState}
      </div>

<<<<<<< HEAD
=======
      {/* Restore Reading Prompt */}
      {showRestorePrompt && (
        <div
          data-testid="restore-prompt"
          className="mb-6 p-4 border-2 border-pip-boy-green bg-black/80 rounded-lg"
          role="dialog"
          aria-labelledby="restore-prompt-title"
        >
          <div className="flex items-start gap-3">
            <PixelIcon
              name="info"
              sizePreset="md"
              variant="primary"
            />
            <div className="flex-1">
              <h3
                id="restore-prompt-title"
                className="text-pip-boy-green font-bold text-sm mb-2"
              >
                發現未完成的解讀
              </h3>
              <p className="text-pip-boy-green/70 text-xs mb-3">
                你有一個未完成的解讀。要繼續上次的進度嗎？
              </p>
              <div className="flex gap-2">
                <Button
                  data-testid="restore-button"
                  size="sm"
                  variant="default"
                  onClick={handleRestoreReading}
                >
                  <PixelIcon name="play" sizePreset="xs" decorative />
                  <span>繼續解讀</span>
                </Button>
                <Button
                  data-testid="decline-restore-button"
                  size="sm"
                  variant="outline"
                  onClick={handleDeclineRestore}
                >
                  <PixelIcon name="x" sizePreset="xs" decorative />
                  <span>開始新的解讀</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
      {/* Error Display */}
      {error && (
        <div
          className="mb-4 p-3 border border-red-400 bg-red-900/20 text-red-400 rounded flex items-center gap-2"
          role="alert"
        >
          <PixelIcon name="alert-triangle" sizePreset="xs" />
          <span>{error}</span>
        </div>
      )}

      {/* Draw Button (shown only when idle) */}
      {drawingState === 'idle' && (
        <Button
          data-testid="start-draw-button"
          size="lg"
          variant="default"
          onClick={handleDrawCards}
          disabled={isDrawingRef.current}
          className="px-8 py-6"
        >
          <PixelIcon name="sparkles" sizePreset="sm" decorative />
          <span className="text-lg">
            開始抽牌（{getCardCount(spreadType, positionsMeta)} 張）
          </span>
        </Button>
      )}

<<<<<<< HEAD
      {/* Loading State (shuffling) */}
      {drawingState === 'shuffling' && (
        <div className="flex flex-col items-center gap-4">
          <PixelIcon
            name="loader"
            sizePreset="xxl"
            className={shouldDisableAnimations ? '' : 'animate-spin'}
            variant="primary"
            decorative
          />
          <span className="text-sm text-pip-boy-green/70">
            洗牌中...
          </span>
        </div>
=======
      {/* Shuffle Animation with Performance Monitoring */}
      {drawingState === 'shuffling' && (
        <ShuffleAnimation
          isShuffling={true}
          duration={animationDuration / 1000}
          onComplete={(actualDuration) => {
            console.log('[InteractiveCardDraw] Shuffle completed in', actualDuration, 'seconds');
          }}
          playSound={!shouldDisableAnimations}
        />
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
      )}

      {/* Card Selection State - Show card backs for user to click */}
      {(drawingState === 'selectingCards' || drawingState === 'flipping') && (
        <div className="w-full">
          <p className="text-center text-pip-boy-green/70 text-sm mb-6">
            點擊卡片以翻開它們
          </p>
<<<<<<< HEAD
          <div className="flex flex-wrap justify-center gap-4">
            {selectedCards.map((card, index) => {
              const isFlipped = flippedCards.some(c => c.positionIndex === index);
              const isFlipping = flippingIndex === index;
              const flippedCard = flippedCards.find(c => c.positionIndex === index);
              const positionLabel = positionsMeta?.[index]?.label || `位置 ${index + 1}`;

              return (
                <div
                  key={index}
                  className="relative"
                  style={{ perspective: '1000px' }}
                >
                  {/* Position Label */}
                  <div className="text-center text-pip-boy-green/60 text-xs mb-2">
                    {positionLabel}
                  </div>

                  {/* Card Container */}
                  <div
                    className={`relative w-32 h-48 transition-all duration-600 cursor-pointer ${
                      isFlipped ? '' : 'hover:scale-105'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped || isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transitionDuration: '0.6s',
                      transitionTimingFunction: 'ease-in-out',
                    }}
                    onClick={() => !isFlipped && !isFlipping && handleCardClick(index)}
                  >
                    {/* Card Back */}
                    <div
                      className="absolute inset-0 backface-hidden border-2 border-pip-boy-green bg-pip-boy-green/5 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <PixelIcon
                        name="radioactive"
                        sizePreset="xl"
                        variant="primary"
                        decorative
                      />
                      <span className="text-pip-boy-green text-xs mt-2 font-bold">
                        VAULT-TEC
                      </span>
                      <span className="text-pip-boy-green/50 text-xs">
                        ?
                      </span>
                    </div>

                    {/* Card Front (flipped card) */}
                    {isFlipped && flippedCard && (
                      <div
                        className="absolute inset-0 backface-hidden border-2 border-pip-boy-green bg-wasteland-dark p-2 flex flex-col items-center justify-center"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <img
                          src={flippedCard.image_url}
                          alt={flippedCard.name}
                          className="w-full h-auto object-contain"
                        />
                        <div className="text-center mt-2">
                          <p className="text-pip-boy-green text-xs font-bold">
                            {flippedCard.name}
                          </p>
                          <p className="text-pip-boy-green/60 text-xs">
                            {flippedCard.position === 'upright' ? '正位' : '逆位'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
=======
          <div className="flex flex-wrap justify-center gap-6">
            {selectedCards.map((card, index) => {
              const isFlipped = flippedCards.some(c => c.positionIndex === index);
              const isCurrentlyFlipping = flippingIndex === index;
              const flippedCard = flippedCards.find(c => c.positionIndex === index);
              const positionLabel = positionsMeta?.[index]?.label || `位置 ${index + 1}`;

              // Create card object with position metadata
              const cardWithMeta: CardWithPosition = flippedCard || {
                ...card,
                position: 'upright', // Will be determined on flip
                positionIndex: index,
                positionLabel,
              };

              return (
                <CardFlipAnimation
                  key={index}
                  card={cardWithMeta}
                  isRevealed={isFlipped}
                  onFlipComplete={(completedCard) => handleCardFlipComplete(completedCard, index)}
                  allowClickToFlip={true}
                  isDisabled={isCurrentlyFlipping || isFlipped}
                  flipDuration={0.6}
                  playSound={!shouldDisableAnimations}
                  className="w-40 h-60"
                />
>>>>>>> origin/claude/fix-interactive-reading-experience-011CV31XNLA7PavNAZiAKkEG
              );
            })}
          </div>
          <p className="text-center text-pip-boy-green/50 text-xs mt-6">
            已翻開 {flippedCards.length} / {selectedCards.length} 張
          </p>
        </div>
      )}

      {/* Complete State */}
      {drawingState === 'complete' && flippedCards.length > 0 && (
        <div className="text-center text-sm text-pip-boy-green/70">
          <PixelIcon name="check" sizePreset="sm" variant="success" />
          <span>抽牌完成！共 {flippedCards.length} 張卡片</span>
        </div>
      )}
    </div>
  );
}
