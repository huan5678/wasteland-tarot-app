/**
 * DynamicHeroTitle 元件
 *
 * Hero Section 動態標題系統主元件
 * 流程：主標題打字 → 副標題打字 → 內容打字 → 等待 3 秒 → 1 秒內全部刪除 → 下一組
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { HeroTitle, HeroTitlesCollection } from '@/types/hero';
import { FALLBACK_TITLE } from '@/types/hero';
import { loadHeroTitles, filterEnabledTitles, getRandomTitles } from '@/lib/heroTitlesLoader';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useGlitch } from '@/hooks/useGlitch';
import { CarouselIndicator } from './CarouselIndicator';
import { cn } from '@/lib/utils';
import styles from './DynamicHeroTitle.module.css';

/**
 * 元件 Props
 */
export interface DynamicHeroTitleProps {
  /** 預設顯示的文案索引 */
  defaultIndex?: number;
  /** 是否啟用自動輪播（預設 true） */
  autoPlay?: boolean;
  /** 打字速度（毫秒/字元，預設 80） */
  typingSpeed?: number;
  /** 刪除速度（毫秒/字元，預設 30） */
  deletingSpeed?: number;
  /** 全部顯示後等待時間（毫秒，預設 3000） */
  waitBeforeDelete?: number;
  /** 測試模式：跳過動畫直接顯示（預設 false） */
  testMode?: boolean;
}

type AnimationPhase =
  | 'typing-title'
  | 'typing-subtitle'
  | 'typing-description'
  | 'waiting'
  | 'deleting-all'
  | 'idle';

/**
 * DynamicHeroTitle 元件
 */
export function DynamicHeroTitle({
  defaultIndex = 0,
  autoPlay = true,
  typingSpeed = 80,
  deletingSpeed = 30,
  waitBeforeDelete = 3000,
  testMode = false,
}: DynamicHeroTitleProps) {
  // 狀態管理
  const [titles, setTitles] = useState<HeroTitle[]>([FALLBACK_TITLE]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const [phase, setPhase] = useState<AnimationPhase>('idle');

  // 顯示文字狀態
  const [displayTitle, setDisplayTitle] = useState('');
  const [displaySubtitle, setDisplaySubtitle] = useState('');
  const [displayDescription, setDisplayDescription] = useState('');

  // 刪除階段追蹤：記錄當前正在刪除哪個部分
  const [deletingSection, setDeletingSection] = useState<'description' | 'subtitle' | 'title' | null>(null);

  // 偵測無障礙偏好
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // 行動裝置偵測
  const [isMobile, setIsMobile] = useState(false);

  // 分頁可見性
  const isVisible = usePageVisibility();

  // Glitch 效果（僅套用於主標題）
  const { isGlitching } = useGlitch({
    enabled: !testMode,
    isMobile,
  });

  // Refs
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const currentTitleRef = useRef<HeroTitle | null>(null);

  /**
   * 載入文案資料
   */
  useEffect(() => {
    loadHeroTitles()
      .then((collection: HeroTitlesCollection) => {
        const enabledTitles = filterEnabledTitles(collection);

        if (enabledTitles.length > 0) {
          // 從啟用的文案中隨機選擇 10 個
          const randomTitles = getRandomTitles(enabledTitles, 10);
          setTitles(randomTitles);
        } else {
          setTitles([FALLBACK_TITLE]);
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load hero titles:', err);
        setTitles([FALLBACK_TITLE]);
        setIsLoading(false);
      });
  }, []);

  /**
   * 偵測 prefers-reduced-motion
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  /**
   * 偵測行動裝置
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始偵測
    checkMobile();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  /**
   * 分頁可見性控制
   */
  useEffect(() => {
    isPausedRef.current = !isVisible;
  }, [isVisible]);

  /**
   * 清理所有動畫和計時器
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * 主要動畫控制邏輯
   */
  useEffect(() => {
    if (isLoading || titles.length === 0) return;

    const currentTitle = titles[currentIndex];
    if (!currentTitle) return;

    currentTitleRef.current = currentTitle;

    // 清理之前的動畫
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 重置顯示狀態
    setDisplayTitle('');
    setDisplaySubtitle('');
    setDisplayDescription('');
    setDeletingSection(null);

    // 如果偏好減少動畫或測試模式，直接顯示
    if (prefersReducedMotion || testMode) {
      setDisplayTitle(currentTitle.title);
      setDisplaySubtitle(currentTitle.subtitle);
      setDisplayDescription(currentTitle.description);
      setPhase('waiting');

      if (autoPlay && !testMode && titles.length > 1) {
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % titles.length);
        }, waitBeforeDelete);
      }
      return;
    }

    // 開始打字動畫序列
    let charIndex = 0;
    let lastTimestamp = performance.now();
    let currentPhase: AnimationPhase = 'typing-title';
    let targetText = currentTitle.title;
    let deletedChars = 0;

    const animate = (timestamp: number) => {
      // 如果暫停，繼續下一幀
      if (isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentSpeed =
        currentPhase === 'deleting-all' ? deletingSpeed : typingSpeed;

      if (timestamp - lastTimestamp >= currentSpeed) {
        lastTimestamp = timestamp;

        // 根據階段執行不同邏輯
        if (currentPhase === 'typing-title') {
          charIndex++;
          setDisplayTitle(targetText.slice(0, charIndex));

          if (charIndex >= targetText.length) {
            // 主標題完成，開始副標題
            currentPhase = 'typing-subtitle';
            setPhase('typing-subtitle');
            targetText = currentTitle.subtitle;
            charIndex = 0;
          }
        } else if (currentPhase === 'typing-subtitle') {
          charIndex++;
          setDisplaySubtitle(targetText.slice(0, charIndex));

          if (charIndex >= targetText.length) {
            // 副標題完成，開始內容
            currentPhase = 'typing-description';
            setPhase('typing-description');
            targetText = currentTitle.description;
            charIndex = 0;
          }
        } else if (currentPhase === 'typing-description') {
          charIndex++;
          setDisplayDescription(targetText.slice(0, charIndex));

          if (charIndex >= targetText.length) {
            // 內容完成，開始等待
            currentPhase = 'waiting';
            setPhase('waiting');

            // 設定等待計時器
            timeoutRef.current = setTimeout(() => {
              currentPhase = 'deleting-all';
              setPhase('deleting-all');
              deletedChars = 0;
              // 繼續動畫
              animationFrameRef.current = requestAnimationFrame(animate);
            }, waitBeforeDelete);

            // 暫時停止動畫循環
            return;
          }
        } else if (currentPhase === 'deleting-all') {
          deletedChars++;

          const descLen = currentTitle.description.length;
          const subLen = currentTitle.subtitle.length;
          const titleLen = currentTitle.title.length;
          const totalChars = descLen + subLen + titleLen;

          // 從下往上刪除：description → subtitle → title
          if (deletedChars <= descLen) {
            setDeletingSection('description');
            setDisplayDescription(
              currentTitle.description.slice(0, descLen - deletedChars)
            );
          } else if (deletedChars <= descLen + subLen) {
            setDeletingSection('subtitle');
            setDisplayDescription('');
            setDisplaySubtitle(
              currentTitle.subtitle.slice(0, subLen - (deletedChars - descLen))
            );
          } else {
            setDeletingSection('title');
            setDisplayDescription('');
            setDisplaySubtitle('');
            setDisplayTitle(
              currentTitle.title.slice(
                0,
                titleLen - (deletedChars - descLen - subLen)
              )
            );
          }

          if (deletedChars >= totalChars) {
            // 刪除完成，切換到下一組
            setDisplayTitle('');
            setDisplaySubtitle('');
            setDisplayDescription('');
            setPhase('idle');

            if (autoPlay && titles.length > 1) {
              setCurrentIndex((prev) => (prev + 1) % titles.length);
            }
            return;
          }
        }
      }

      // 繼續動畫循環
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 啟動動畫
    setPhase('typing-title');
    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理函式
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    currentIndex,
    isLoading,
    titles,
    typingSpeed,
    deletingSpeed,
    waitBeforeDelete,
    autoPlay,
    prefersReducedMotion,
    testMode,
  ]);

  /**
   * 手動切換文案
   */
  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;

    // 清理當前動畫
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setCurrentIndex(index);
  };

  // Loading 狀態
  if (isLoading) {
    return (
      <div className="text-center mb-12" aria-live="polite" aria-busy="true">
        <div className="text-pip-boy-green font-mono">載入中...</div>
      </div>
    );
  }

  return (
    <div className={cn('text-center mb-12', testMode && 'test-mode')}>
      {/* CRT 視覺特效容器 - 包裹主標題、副標題、描述（承載 ::after RGB 網格疊加層） */}
      <div className={styles['hero-title-container']}>
        {/* 主標題 */}
        <div
          className={cn(
            'text-5xl md:text-7xl font-bold mb-6 font-mono tracking-tight text-pip-boy-green min-h-[4rem] md:min-h-[6rem] flex items-center justify-center',
            isGlitching && styles['hero-title-glitching']
          )}
          aria-live="polite"
        >
          <h1 className={cn('inline', styles['hero-title-text'])}>
            {displayTitle}
            {!testMode && (phase === 'typing-title' || deletingSection === 'title') && (
              <span className={styles['typing-cursor-inline']} aria-hidden="true" />
            )}
          </h1>
        </div>

        {/* 副標題 */}
        <div className="text-xl md:text-2xl mb-8 text-pip-boy-green/80 min-h-[2rem] flex items-center justify-center">
          <p className={cn('inline', styles['hero-subtitle-text'])}>
            {displaySubtitle}
            {!testMode && (phase === 'typing-subtitle' || deletingSection === 'subtitle') && (
              <span className={styles['typing-cursor-inline']} aria-hidden="true" />
            )}
          </p>
        </div>

        {/* 描述段落 */}
        <div className="text-sm font-mono text-pip-boy-green/60 max-w-2xl mx-auto leading-relaxed min-h-[3rem] flex items-center justify-center">
          <p className={cn('inline', styles['hero-description-text'])}>
            {displayDescription}
            {!testMode && (phase === 'typing-description' || phase === 'waiting' || deletingSection === 'description') && (
              <span className={styles['typing-cursor-inline']} aria-hidden="true" />
            )}
          </p>
        </div>
      </div>

      {/* 輪播指示器 */}
      {titles.length > 1 && (
        <CarouselIndicator
          totalCount={titles.length}
          currentIndex={currentIndex}
          onDotClick={handleDotClick}
          visible={true}
        />
      )}
    </div>
  );
}
