/**
 * TarotFanDrawer Component
 *
 * Main interactive 78-card tarot fan drawer with:
 * - Half-circle fan layout (polar coordinates)
 * - Drag-to-rotate navigation (@use-gesture/react)
 * - Manual card selection (click to select N cards)
 * - Virtualized rendering (render ~25 instead of 78 cards)
 * - Responsive design (desktop horizontal, mobile vertical)
 * - Performance optimized (60 FPS target)
 *
 * User Flow:
 * 1. Click deck → Shuffle animation → Fan expansion
 * 2. Drag to rotate and explore all 78 cards
 * 3. Click to select N cards (based on spread type)
 * 4. Click "確認選擇" button
 * 5. Proceed to card flipping
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { useFanLayout, calculateRotationBounds } from '@/hooks/useFanLayout';
import { useCardSelection } from '@/hooks/useCardSelection';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { FanCard } from './FanCard';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';

/**
 * Props for TarotFanDrawer component
 */
export interface TarotFanDrawerProps {
  /** Total number of cards in deck (78) */
  totalCards: number;

  /** Number of cards to select (spread count) */
  spreadCount: number;

  /** Callback when cards are selected and confirmed (returns selected indices) */
  onCardsSelected: (selectedIndices: number[]) => void;

  /** Card back image URL (for daily random card back) */
  cardBackUrl: string;

  /** Whether the fan is disabled */
  isDisabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * TarotFanDrawer Component
 *
 * Interactive 78-card fan with drag-to-rotate and manual selection
 * NOTE: Only shows card backs - no card data to prevent DevTools snooping
 */
export function TarotFanDrawer({
  totalCards,
  spreadCount,
  onCardsSelected,
  cardBackUrl,
  isDisabled = false,
  className = '',
}: TarotFanDrawerProps) {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  // Get fan layout configuration
  const { config, containerSize, cardPositions, calculateVisibleIndices, deviceType } =
    useFanLayout(totalCards);

  // Card selection state
  const selection = useCardSelection({
    maxSelections: spreadCount,
    onSelectionChange: (selected) => {
      console.log(`[TarotFanDrawer] 已選擇: ${selected.size}/${spreadCount}`);
    },
    onMaxReached: () => {
      console.warn(`[TarotFanDrawer] 已達最大選擇數量: ${spreadCount}`);
    },
    onConfirm: (indices) => {
      console.log('[TarotFanDrawer] 確認選擇:', indices);
    },
    enableHaptics: true,
  });

  // Rotation state (can be any value, will be normalized with modulo)
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const rotationRef = useRef(0);

  // Normalize rotation angle to 0-360 range
  const normalizeRotation = useCallback((angle: number): number => {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }, []);

  // Calculate visible card indices (virtualization)
  // Use normalized rotation for consistency
  const visibleIndices = useMemo(() => {
    const normalized = normalizeRotation(rotation);
    return calculateVisibleIndices(normalized);
  }, [rotation, calculateVisibleIndices, normalizeRotation]);

  // Drag gesture handler for rotation (INFINITE ROTATION)
  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], memo = rotationRef.current }) => {
      setIsDragging(down);

      if (down) {
        // Convert horizontal drag to rotation angle
        // Sensitivity: 1px = 0.2°
        const dragToAngle = mx * 0.2;
        const newRotation = memo + dragToAngle;

        // NO CLAMPING - Allow infinite rotation
        setRotation(newRotation);
      } else {
        // Apply momentum on release
        const momentum = vx * 50; // Velocity multiplier
        const finalRotation = rotation + momentum;

        // NO CLAMPING - Allow infinite rotation
        setRotation(finalRotation);
        rotationRef.current = finalRotation;
      }

      return memo;
    },
    {
      axis: 'x', // Only horizontal drag
      filterTaps: true, // Prevent clicks during drag
      threshold: 5, // Minimum 5px movement to trigger
      rubberband: false, // Disable rubberband (no bounds)
      from: () => [rotationRef.current, 0],
    }
  );

  // Handle card click
  const handleCardClick = useCallback(
    (index: number) => {
      if (isDragging || isDisabled) return;
      selection.toggleCard(index);
    },
    [isDragging, isDisabled, selection]
  );

  // Handle confirm selection - returns indices only
  const handleConfirm = useCallback(() => {
    const indices = selection.confirmSelection();
    if (indices) {
      onCardsSelected(indices);
    }
  }, [selection, onCardsSelected]);

  // Container style (responsive positioning)
  // CRITICAL: Use percentage positioning + margin for stable axis
  const containerStyle = useMemo(() => {
    if (deviceType === 'desktop') {
      // Desktop: Circle center at bottom-center of viewport
      return {
        position: 'fixed' as const,
        left: '50%', // Horizontal center
        bottom: '0', // At bottom
        width: `${containerSize.width}px`,
        height: `${containerSize.height}px`,
        marginLeft: `-${containerSize.width / 2}px`, // Center horizontally
        marginBottom: `-${containerSize.height / 2}px`, // Half above viewport
        pointerEvents: 'auto' as const,
      };
    } else {
      // Mobile: Circle center at right-center of viewport
      return {
        position: 'fixed' as const,
        right: '0', // At right edge
        top: '50%', // Vertical center
        width: `${containerSize.width}px`,
        height: `${containerSize.height}px`,
        marginRight: `-${containerSize.width / 2}px`, // Half outside viewport
        marginTop: `-${containerSize.height / 2}px`, // Center vertically
        pointerEvents: 'auto' as const,
      };
    }
  }, [deviceType, containerSize]);

  // Fan container style (rotatable)
  // CRITICAL: transform-origin must be '50% 50%' (container center = circle center)
  const fanStyle = useMemo(
    () => ({
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      transform: `rotate(${rotation}deg)`,
      transformOrigin: '50% 50%', // Rotate around container center (= circle center)
      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'pan-y', // Allow vertical scroll, prevent horizontal
    }),
    [rotation, isDragging]
  );

  return (
    <div
      data-testid="tarot-fan-drawer"
      data-device-type={deviceType}
      data-rotation={rotation}
      className={className}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Fan container */}
      <div style={containerStyle}>
        <div {...bind()} style={fanStyle}>
          {/* Render only visible cards (virtualization) */}
          {visibleIndices.map((index) => {
            const position = cardPositions[index];

            if (!position) return null;

            return (
              <FanCard
                key={index}
                index={index}
                position={position}
                isSelected={selection.isSelected(index)}
                isDisabled={isDragging || isDisabled}
                width={config.cardWidth}
                height={config.cardHeight}
                cardBackUrl={cardBackUrl}
                onClick={() => handleCardClick(index)}
              />
            );
          })}
        </div>
      </div>

      {/* Selection UI Overlay - positioned near rotation axis */}
      <div
        className="selection-ui"
        style={{
          position: 'fixed',
          // Desktop: near bottom center (axis location)
          // Mobile: near right center (axis location)
          ...(deviceType === 'desktop'
            ? {
                bottom: '120px', // Above the fan arc
                left: '50%',
                transform: 'translateX(-50%)',
              }
            : {
                right: '120px', // Left of the fan arc
                top: '50%',
                transform: 'translateY(-50%)',
              }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10000,
          pointerEvents: 'none',
        }}
      >
        {/* Drag hint (show only initially) */}
        {selection.count === 0 && !isDragging && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #00ff88',
              borderRadius: '8px',
              color: '#00ff88',
              fontSize: '12px',
              fontFamily: 'var(--font-cubic)',
              textAlign: 'center',
            }}
          >
            <PixelIcon name="hand" sizePreset="xs" variant="primary" decorative />
            <span style={{ marginLeft: '8px' }}>
              {deviceType === 'desktop' ? '左右拖曳旋轉牌組' : '上下拖曳旋轉牌組'}
            </span>
          </div>
        )}

        {/* Selection counter */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: `2px solid ${selection.count === spreadCount ? '#00ff88' : '#00ff88'}`,
            borderRadius: '12px',
            color: '#00ff88',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-cubic)',
            textAlign: 'center',
            boxShadow:
              selection.count === spreadCount
                ? '0 0 20px rgba(0, 255, 136, 0.6)'
                : 'none',
          }}
        >
          已選 {selection.count}/{spreadCount} 張
        </div>

        {/* Confirm button */}
        {selection.count > 0 && (
          <Button
            size="lg"
            variant="default"
            onClick={handleConfirm}
            disabled={selection.count !== spreadCount}
            style={{
              pointerEvents: 'auto',
            }}
            data-testid="confirm-selection-button"
          >
            <PixelIcon name="check" sizePreset="sm" decorative />
            <span>確認選擇</span>
          </Button>
        )}
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid #00ff88',
            borderRadius: '8px',
            color: '#00ff88',
            fontSize: '10px',
            fontFamily: 'monospace',
            zIndex: 10001,
          }}
        >
          <div>Rotation: {rotation.toFixed(1)}° (normalized: {normalizeRotation(rotation).toFixed(1)}°)</div>
          <div>Visible: {visibleIndices.length}/78</div>
          <div>Selected: {selection.count}/{spreadCount}</div>
          <div>Device: {deviceType}</div>
        </div>
      )}
    </div>
  );
}
