'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PixelIcon } from '@/components/ui/icons';
import { useAdvancedGestures, useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures';
import { CardStateIndicators, CardProgressIndicator, CardLoadingShimmer, type CardState } from '@/components/common/CardStateIndicators';
import { use3DTilt } from '@/hooks/tilt/use3DTilt';
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects';
import { useGyroscopePermission } from '@/hooks/tilt/useGyroscopePermission';
import { PipBoyButton } from '@/components/ui/pipboy';
import { CardBackPixelEffect } from '@/components/cards/CardBackPixelEffect';import { Button } from "@/components/ui/button";

interface TarotCard {
  id: number;
  name: string;
  suit: string;
  number?: number;
  meaning_upright: string;
  meaning_reversed: string;
  image_url: string;
  keywords: string[];
}

interface MobileTarotCardProps {
  card: TarotCard;
  isRevealed: boolean;
  position: 'upright' | 'reversed';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  loading?: boolean;
  showKeywords?: boolean;
  onClick?: (card: TarotCard) => void;
  onLongPress?: (card: TarotCard) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', card: TarotCard) => void;
  onDoubleTap?: (card: TarotCard) => void;
  flipStyle?: 'default' | 'kokonut' | 'mobile';
  isSelectable?: boolean;
  isSelected?: boolean;
  animationDelay?: number;
  showGlow?: boolean;
  enableHaptic?: boolean;
  cardIndex?: number;
  totalCards?: number;
  showProgress?: boolean;
  enableZoom?: boolean;
  enableRotation?: boolean;
  className?: string;
  /**
   * 啟用 3D 傾斜效果（預設：true）
   */
  enable3DTilt?: boolean;
  /**
   * 3D 傾斜最大角度（預設：15）
   */
  tiltMaxAngle?: number;
  /**
   * 3D 傾斜過渡動畫時間，單位 ms（預設：400）
   */
  tiltTransitionDuration?: number;
  /**
   * 啟用陀螺儀傾斜（行動裝置）（預設：true）
   */
  enableGyroscope?: boolean;
  /**
   * 啟用光澤效果（預設：true）
   */
  enableGloss?: boolean;
}

const mobileSizeClasses = {
  small: 'w-20 h-30 min-w-[80px] min-h-[120px]',
  medium: 'w-28 h-42 min-w-[112px] min-h-[168px]',
  large: 'w-40 h-60 min-w-[160px] min-h-[240px]',
  fullscreen: 'w-full h-full max-w-sm max-h-[70vh]'
};

export function MobileTarotCard({
  card,
  isRevealed,
  position,
  size = 'medium',
  loading = false,
  showKeywords = false,
  onClick,
  onLongPress,
  onSwipe,
  onDoubleTap,
  flipStyle = 'mobile',
  isSelectable = false,
  isSelected = false,
  animationDelay = 0,
  showGlow = false,
  enableHaptic = true,
  cardIndex = 0,
  totalCards = 1,
  showProgress = false,
  enableZoom = true,
  enableRotation = false,
  className = '',
  enable3DTilt = true,
  tiltMaxAngle = 15,
  tiltTransitionDuration = 400,
  enableGyroscope = true,
  enableGloss = true
}: MobileTarotCardProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [previousRevealed, setPreviousRevealed] = useState(isRevealed);
  const [cardState, setCardState] = useState<CardState>('idle');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isTouchDevice, prefersReducedMotion, screenSize, isIOS } = useAdvancedDeviceCapabilities();

  // 3D 傾斜效果（行動裝置優先使用陀螺儀）
  const {
    tiltRef,
    tiltHandlers,
    tiltStyle,
    tiltState,
    gyroscopePermission
  } = use3DTilt({
    enable3DTilt,
    tiltMaxAngle,
    tiltTransitionDuration,
    enableGyroscope,
    enableGloss,
    size: size === 'fullscreen' ? 'large' : size,
    isFlipping,
    loading
  });

  // Advanced gesture handlers
  const gestureHandlers = {
    onTap: useCallback((event: any) => {
      // Trigger hover effect on tap (for pixel animation)
      setIsHovered(true);
      setTimeout(() => setIsHovered(false), 300);

      if (onClick && (isRevealed || isSelectable)) {
        onClick(card);
      }
      // Show/hide controls on tap for fullscreen mode
      if (size === 'fullscreen') {
        setShowControls((prev) => !prev);
        // Auto-hide controls after 3 seconds
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    }, [onClick, card, isRevealed, isSelectable, size]),

    onDoubleTap: useCallback((event: any) => {
      if (onDoubleTap) {
        onDoubleTap(card);
      } else if (enableZoom && size === 'fullscreen') {
        // Toggle zoom on double tap
        setIsZoomed((prev) => !prev);
      }
    }, [onDoubleTap, card, enableZoom, size]),

    onLongPress: useCallback((event: any) => {
      // Trigger hover effect on long press
      setIsHovered(true);
      setTimeout(() => setIsHovered(false), 600);

      if (onLongPress) {
        onLongPress(card);
      } else {
        // Default long press: show card details or flip
        if (!isRevealed && isSelectable) {
          onClick?.(card);
        }
      }
    }, [onLongPress, card, isRevealed, isSelectable, onClick]),

    onSwipe: useCallback((direction: 'left' | 'right' | 'up' | 'down', event: any) => {
      event.preventDefault();

      if (onSwipe) {
        onSwipe(direction, card);
      } else {
        // Default swipe behaviors
        if (direction === 'up' && !isRevealed && isSelectable) {
          // Swipe up to reveal card
          onClick?.(card);
        } else if (direction === 'left' || direction === 'right') {
          // Swipe left/right to rotate (if enabled)
          if (enableRotation) {
            setRotation((prev) => prev + (direction === 'right' ? 90 : -90));
          }
        }
      }
    }, [onSwipe, card, isRevealed, isSelectable, onClick, enableRotation]),

    onPinch: useCallback((scale: number, event: any) => {
      if (enableZoom && size === 'fullscreen') {
        setIsZoomed(scale > 1.2);
      }
    }, [enableZoom, size])
  };

  const {
    bind,
    touchHandlers,
    animations,
    reset,
    animateTo,
    triggerHaptic
  } = useAdvancedGestures(gestureHandlers, {
    enablePinch: enableZoom && size === 'fullscreen',
    enableSwipe: true,
    enableDoubleTap: true,
    enableHaptic,
    swipeThreshold: 30,
    longPressDelay: 500,
    preventScroll: size === 'fullscreen'
  });

  // Handle flip animation when isRevealed changes
  useEffect(() => {
    if (previousRevealed !== isRevealed) {
      setCardState('revealing');
      setIsFlipping(true);

      const timer = setTimeout(() => {
        setIsFlipping(false);
        setCardState(isRevealed ? 'revealed' : 'idle');
      }, 600);

      setPreviousRevealed(isRevealed);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, previousRevealed]);

  // Handle animation delay for sequential reveals
  useEffect(() => {
    if (animationDelay > 0) {
      setCardState('animating');
      timeoutRef.current = setTimeout(() => {
        setCardState('idle');
      }, animationDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animationDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Mobile-specific loading skeleton
  if (loading) {
    return (
      <div
        data-testid="mobile-card-skeleton"
        className={`${mobileSizeClasses[size]} bg-gradient-to-br from-wasteland-dark to-black rounded-lg
          flex items-center justify-center relative border-2 border-pip-boy-green/30 ${className}`}>

        <CardLoadingShimmer />
        <div className="w-6 h-6 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin" />
        <CardStateIndicators state="loading" size={size === 'fullscreen' ? 'large' : 'medium'} />
        {showProgress && totalCards > 1 &&
        <CardProgressIndicator
          current={cardIndex + 1}
          total={totalCards}
          size={size === 'fullscreen' ? 'large' : 'medium'} />

        }
      </div>);

  }

  const cardContent =
  <animated.div
    ref={(el) => {
      // Merge refs: cardRef and tiltRef
      if (el) {
        cardRef.current = el;
        if (tiltRef) {
          ;(tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }
    }}
    data-testid="mobile-tarot-card"
    className={`
        ${mobileSizeClasses[size]} relative group
        ${position === 'reversed' ? 'reversed' : ''}
        ${isFlipping ? 'animate-card-flip' : ''}
        ${isSelected ? 'animate-card-selection' : ''}
        ${showGlow ? 'animate-card-glow' : ''}
        transition-all duration-300 ease-out select-none
        ${size === 'fullscreen' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${className}
      `}
    {...isTouchDevice ? { ...bind(), ...touchHandlers } : bind()}
    style={{
      ...animations,
      ...tiltStyle,
      transformStyle: 'preserve-3d',
      perspective: '1000px',
      animationDelay: `${animationDelay}ms`,
      touchAction: size === 'fullscreen' ? 'none' : 'manipulation',
      transform: `${animations.x ? `translateX(${animations.x}px)` : ''}
                   ${animations.y ? `translateY(${animations.y}px)` : ''}
                   ${animations.scale ? `scale(${animations.scale})` : ''}
                   ${rotation ? `rotate(${rotation}deg)` : ''}`
    }}>

      {/* 陀螺儀權限提示（僅 iOS 顯示） */}
      {enableGyroscope && gyroscopePermission.status === 'prompt' && isIOS &&
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-sm space-y-4 text-center">
            <div className="text-pip-boy-green text-sm">
              啟用陀螺儀以體驗 3D 傾斜效果
            </div>
            <PipBoyButton
          onClick={gyroscopePermission.requestPermission}
          variant="primary"
          size="md">

              啟用陀螺儀
            </PipBoyButton>
            {gyroscopePermission.error &&
        <div className="text-xs text-red-500">
                {gyroscopePermission.error}
              </div>
        }
          </div>
        </div>
    }

      {/* 3D Tilt Visual Effects */}
      {tiltState.isTilted &&
    <TiltVisualEffects
      tiltState={tiltState}
      enableGloss={enableGloss} />

    }

      {/* State indicators */}
      <CardStateIndicators
      state={cardState}
      size={size === 'fullscreen' ? 'large' : 'medium'}
      animate={!prefersReducedMotion} />


      {/* Progress indicator */}
      {showProgress && totalCards > 1 &&
    <CardProgressIndicator
      current={cardIndex + 1}
      total={totalCards}
      size={size === 'fullscreen' ? 'large' : 'medium'} />

    }

      {/* Mobile controls overlay for fullscreen */}
      {size === 'fullscreen' && showControls &&
    <div className={`
          absolute top-4 right-4 flex flex-col gap-2 z-20
          transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}
        `}>
          <Button size="icon" variant="outline"
      onClick={() => reset()}
      className="p-2 border"
      aria-label="重置位置">

            <PixelIcon name="reload" size={16} aria-hidden="true" />
          </Button>
          {enableRotation &&
      <Button size="icon" variant="outline"
      onClick={() => setRotation((prev) => prev + 90)}
      className="p-2 border"
      aria-label="旋转卡牌">

              <PixelIcon name="reload" size={16} aria-hidden="true" />
            </Button>
      }
        </div>
    }

      <div className={`
        relative w-full h-full [perspective:1200px] overflow-hidden
        transition-all duration-300 ease-out rounded-lg
      `}>
        <div className={`
          relative w-full h-full [transform-style:preserve-3d]
          ${isFlipping ? 'animate-card-flip' : 'transition-all duration-700'}
          ${isRevealed ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
        `}>
          {/* Card Back */}
          <div className={`
            absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-lg
            border-2 ${isSelected ? 'border-pip-boy-green animate-pulse' : 'border-pip-boy-green/60'}
            flex items-center justify-center bg-gradient-to-br from-wasteland-dark to-black
            transition-all duration-300 relative overflow-hidden
          `}>
            <div className="text-center text-pip-boy-green relative z-10">
              <PixelIcon
              name="cards"
              size={size === 'small' ? 16 : size === 'medium' ? 24 : size === 'fullscreen' ? 32 : 32}
              className="mb-2 mx-auto"
              aria-hidden="true" />

              <div className={`${size === 'small' ? 'text-[8px]' : size === 'medium' ? 'text-[10px]' : 'text-sm'}`}>
                WASTELAND
              </div>
              {size === 'fullscreen' &&
            <div className="text-xs opacity-60 mt-2">
                  {isTouchDevice ? '長按查看詳情' : '點擊查看'}
                </div>
            }
            </div>
            {/* Pixel hover effect for card back */}
            {!isRevealed &&
          <CardBackPixelEffect
            isHovered={isHovered}
            gap={size === 'small' ? 12 : size === 'medium' ? 10 : size === 'large' ? 8 : 6}
            speed={35} />

          }
          </div>

          {/* Card Front */}
          <div className={`
            absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg
            border-2 ${isSelected ? 'border-pip-boy-green animate-pulse' : 'border-pip-boy-green/60'}
            bg-black flex flex-col overflow-hidden relative
            transition-all duration-300
          `}>
            {/* Enhanced indicators */}
            {(onClick || isSelectable) &&
          <div className={`
                absolute top-1 right-1 flex items-center gap-1 z-10
                transition-all duration-200
              `}>
                <div className="w-2 h-2 bg-pip-boy-green/70 rounded-full animate-pulse"></div>
                {isSelected &&
            <PixelIcon name="zap" size={12} className="text-pip-boy-green animate-pulse" aria-hidden="true" />
            }
              </div>
          }

            {/* Shimmer effect for special states */}
            {showGlow &&
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-pip-boy-green/10 to-transparent animate-card-shimmer"></div>
          }

            {/* Card Image */}
            <div className="flex-1 flex items-center justify-center p-1 bg-pip-boy-green/5 w-full relative overflow-hidden">
              {imageError ?
            <div className="text-pip-boy-green/60 text-center">
                  <PixelIcon
                name="image"
                size={size === 'small' ? 24 : 32}
                className="mb-2 mx-auto"
                aria-hidden="true" />

                  <div className={`${size === 'small' ? 'text-[8px]' : 'text-xs'}`}>無圖</div>
                </div> :

            <img
              src={card.image_url}
              alt={card.name}
              onError={handleImageError}
              className={`
                    object-contain max-h-full max-w-full
                    ${size === 'fullscreen' ? 'transition-transform duration-300' : ''}
                    ${isZoomed && size === 'fullscreen' ? 'scale-150' : ''}
                  `}
              loading={size === 'fullscreen' ? 'eager' : 'lazy'} />

            }
            </div>

            {/* Card Info */}
            <div className={`
              ${size === 'small' ? 'p-1' : 'p-2'} border-t border-pip-boy-green/30 bg-wasteland-dark/60
              ${size === 'fullscreen' ? 'max-h-32 overflow-y-auto' : ''}
            `}>
              <div className={`
                text-center text-pip-boy-green font-bold leading-tight
                ${size === 'small' ? 'text-[9px]' : size === 'medium' ? 'text-[11px]' : 'text-sm'}
              `}>
                {card.name}
              </div>
              <div className={`
                text-center text-pip-boy-green/60 line-clamp-2 mt-0.5
                ${size === 'small' ? 'text-[8px]' : size === 'medium' ? 'text-[10px]' : 'text-xs'}
              `}>
                {position === 'upright' ? card.meaning_upright : card.meaning_reversed}
              </div>

              {/* Keywords for larger sizes */}
              {showKeywords && card.keywords && size !== 'small' &&
            <div className="flex flex-wrap gap-1 mt-2">
                  {card.keywords.slice(0, size === 'fullscreen' ? 10 : 3).map((keyword, index) =>
              <span
                key={index}
                className={`
                        bg-pip-boy-green/20 text-pip-boy-green px-1 rounded
                        ${size === 'fullscreen' ? 'text-xs' : 'text-[8px]'}
                      `}>

                      {keyword}
                    </span>
              )}
                </div>
            }

              {/* Mobile gesture hints for fullscreen */}
              {size === 'fullscreen' && isTouchDevice &&
            <div className="mt-2 text-center text-pip-boy-green/50 text-xs">
                  <div>雙擊：{enableZoom ? '縮放' : '詳情'} • 長按：選項</div>
                  <div>滑動：{enableRotation ? '旋轉' : '導航'}</div>
                </div>
            }
            </div>
          </div>
        </div>
      </div>
    </animated.div>;


  // Wrap with zoom functionality for fullscreen mode
  if (size === 'fullscreen' && enableZoom) {
    return (
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        limitToBounds={false}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ disabled: true }} // We handle double click ourselves
        panning={{ disabled: false }}
        className="w-full h-full">

        <TransformComponent wrapperClass="w-full h-full">
          {cardContent}
        </TransformComponent>
      </TransformWrapper>);

  }

  return cardContent;
}

// Export enhanced MobileTarotCard component with advanced gesture support
// Optimized for touch devices with native-feeling interactions