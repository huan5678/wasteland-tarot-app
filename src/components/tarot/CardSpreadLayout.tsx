/**
 * CardSpreadLayout Component
 *
 * Provides card spread layout and expansion animation with:
 * - Multiple spread type support (1/3/5/10 cards)
 * - Staggered expansion animation
 * - Hover effects with radiation glow
 * - Touch interaction support
 * - Full accessibility and reduced motion support
 *
 * Requirements: 1.6, 1.12
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import * as m from 'framer-motion/m';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CardWithPosition } from './InteractiveCardDraw';

// Create motion alias for cleaner JSX
const motion = { div: m.div };

/**
 * Props for CardSpreadLayout component
 */
export interface CardSpreadLayoutProps {
  /** Cards to display in the spread */
  cards: CardWithPosition[];

  /** Type of spread layout */
  spreadType: string;

  /** Callback when a card is clicked */
  onCardClick?: (card: CardWithPosition, index: number) => void;

  /** Callback when a card is long-pressed (mobile) */
  onCardLongPress?: (card: CardWithPosition, index: number) => void;

  /** Whether to show position labels */
  showLabels?: boolean;
}

/**
 * Animation state for the spread
 */
type AnimationState = 'expanding' | 'expanded' | 'instant';

/**
 * Spread layout configuration
 */
interface SpreadConfig {
  spacing: number; // pixels between cards
  arrangement: 'horizontal' | 'circular' | 'cross';
  maxWidth: number; // maximum container width
}

/**
 * Get spread configuration based on type
 */
function getSpreadConfig(spreadType: string, cardCount: number): SpreadConfig {
  const configs: Record<string, SpreadConfig> = {
    single: {
      spacing: 0,
      arrangement: 'horizontal',
      maxWidth: 200,
    },
    three_card: {
      spacing: 32,
      arrangement: 'horizontal',
      maxWidth: 800,
    },
    wasteland_survival: {
      spacing: 24,
      arrangement: 'cross',
      maxWidth: 600,
    },
    celtic_cross: {
      spacing: 16,
      arrangement: 'cross',
      maxWidth: 900,
    },
  };

  // Default configuration
  return (
    configs[spreadType] || {
      spacing: 24,
      arrangement: 'horizontal',
      maxWidth: 800,
    }
  );
}

/**
 * Calculate card position for different layouts
 */
function calculateCardPosition(
  index: number,
  cardCount: number,
  config: SpreadConfig
): { x: number; y: number; rotate: number } {
  const { spacing, arrangement } = config;

  if (arrangement === 'horizontal') {
    // Linear horizontal layout
    const totalWidth = (cardCount - 1) * spacing;
    const startX = -totalWidth / 2;
    const x = startX + index * spacing;

    return { x, y: 0, rotate: 0 };
  }

  if (arrangement === 'circular') {
    // Circular layout (for larger spreads)
    const radius = spacing * 2;
    const angleStep = (2 * Math.PI) / cardCount;
    const angle = angleStep * index - Math.PI / 2; // Start from top

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const rotate = (angle * 180) / Math.PI + 90; // Face outward

    return { x, y, rotate };
  }

  if (arrangement === 'cross') {
    // Cross layout (Celtic Cross style)
    const positions: Record<number, { x: number; y: number; rotate: number }> =
      {
        0: { x: 0, y: 0, rotate: 0 }, // Center
        1: { x: spacing, y: 0, rotate: 90 }, // Right (crossing)
        2: { x: 0, y: -spacing, rotate: 0 }, // Top
        3: { x: -spacing, y: 0, rotate: 0 }, // Left
        4: { x: 0, y: spacing, rotate: 0 }, // Bottom
        5: { x: spacing * 1.5, y: -spacing * 1.5, rotate: 0 }, // Top-right
        6: { x: spacing * 1.5, y: -spacing * 0.5, rotate: 0 }, // Right-top
        7: { x: spacing * 1.5, y: spacing * 0.5, rotate: 0 }, // Right-bottom
        8: { x: spacing * 1.5, y: spacing * 1.5, rotate: 0 }, // Bottom-right
        9: { x: 0, y: -spacing * 2, rotate: 0 }, // Final outcome (top)
      };

    return (
      positions[index] || {
        x: index * spacing,
        y: 0,
        rotate: 0,
      }
    );
  }

  return { x: 0, y: 0, rotate: 0 };
}

/**
 * CardSpreadLayout Component
 *
 * Main component for displaying card spreads with animations
 */
export function CardSpreadLayout({
  cards,
  spreadType,
  onCardClick,
  onCardLongPress,
  showLabels = true,
}: CardSpreadLayoutProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const [animationState, setAnimationState] = useState<AnimationState>(
    prefersReducedMotion ? 'instant' : 'expanding'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const config = getSpreadConfig(spreadType, cards.length);

  // Complete expansion animation
  useEffect(() => {
    if (animationState === 'expanding') {
      const timeout = setTimeout(() => {
        setAnimationState('expanded');
      }, 1000 + cards.length * 100); // Base time + stagger time

      return () => clearTimeout(timeout);
    }
  }, [animationState, cards.length]);

  // Handle card click
  const handleCardClick = useCallback(
    (card: CardWithPosition, index: number) => {
      onCardClick?.(card, index);
    },
    [onCardClick]
  );

  // Handle card hover
  const handleCardHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  // Handle touch start (for long press)
  const handleTouchStart = useCallback(
    (card: CardWithPosition, index: number) => {
      const timer = setTimeout(() => {
        onCardLongPress?.(card, index);
        setLongPressTimer(null);
      }, 500); // 500ms for long press

      setLongPressTimer(timer);
    },
    [onCardLongPress]
  );

  // Handle touch end (clear long press timer)
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  return (
    <motion.div
        data-testid="card-spread-layout"
        data-spread-type={spreadType}
        data-spacing={config.spacing}
        data-animation-state={animationState}
        data-reduced-motion={prefersReducedMotion}
        role="group"
        aria-label={`${spreadType} 卡牌排列，共 ${cards.length} 張`}
        className="relative flex items-center justify-center"
        style={{ maxWidth: config.maxWidth, margin: '0 auto' }}
      >
        {cards.map((card, index) => {
          const position = calculateCardPosition(index, cards.length, config);
          const isHovered = hoveredIndex === index;
          const animationDelay = prefersReducedMotion ? 0 : index * 0.1;

          return (
            <motion.div
              key={card.id}
              data-testid={`card-position-${index}`}
              data-position-index={index}
              data-animation-delay={animationDelay}
              data-reduced-motion={prefersReducedMotion}
              className={`absolute cursor-pointer ${
                isHovered && !prefersReducedMotion ? 'card-hover-glow' : ''
              }`}
              tabIndex={0}
              role="button"
              aria-label={`${card.positionLabel}: ${card.name} (${card.position})`}
              initial={
                prefersReducedMotion
                  ? {
                      x: position.x,
                      y: position.y,
                      rotate: position.rotate,
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      x: 0,
                      y: 0,
                      rotate: 0,
                      opacity: 0,
                      scale: 0.5,
                    }
              }
              animate={{
                x: position.x,
                y: position.y,
                rotate: position.rotate,
                opacity: 1,
                scale: isHovered && !prefersReducedMotion ? 1.05 : 1,
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: animationDelay,
                ease: 'easeOut',
                scale: {
                  duration: 0.2,
                },
              }}
              onClick={() => handleCardClick(card, index)}
              onHoverStart={() => handleCardHover(index)}
              onHoverEnd={() => handleCardHover(null)}
              onTouchStart={() => handleTouchStart(card, index)}
              onTouchEnd={handleTouchEnd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card, index);
                }
              }}
            >
              {/* Card placeholder (actual card rendering delegated to parent) */}
              <div className="relative w-32 h-48 bg-black border-2 border-pip-boy-green rounded-lg overflow-hidden">
                {/* Position label */}
                {showLabels && card.positionLabel && (
                  <div className="absolute top-2 left-2 right-2 text-xs text-center text-pip-boy-green/70 font-mono bg-black/80 px-2 py-1 rounded">
                    {card.positionLabel}
                  </div>
                )}

                {/* Card back indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-40 border border-pip-boy-green/30 rounded flex items-center justify-center">
                    <span className="text-xs text-pip-boy-green/50">
                      {card.position === 'upright' ? '正位' : '逆位'}
                    </span>
                  </div>
                </div>

                {/* Hover glow effect */}
                {isHovered && !prefersReducedMotion && (
                  <div className="absolute inset-0 bg-pip-boy-green/10 rounded-lg pointer-events-none" />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
  );
}
