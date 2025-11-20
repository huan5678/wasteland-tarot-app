/**
 * DynamicHeroTitle 元件
 *
 * Hero Section 動態標題系統主元件
 * 流程：主標題解碼 → 副標題解碼 → 內容解碼 → 等待 3 秒 → 全部反向解碼消失 → 下一組
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { HeroTitle, HeroTitlesCollection } from '@/types/hero';
import { FALLBACK_TITLE } from '@/types/hero';
import { loadHeroTitles, filterEnabledTitles, getRandomTitles } from '@/lib/heroTitlesLoader';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useGlitch } from '@/hooks/useGlitch';
import { CarouselIndicator } from './CarouselIndicator';
import { cn } from '@/lib/utils';
import styles from './DynamicHeroTitle.module.css';
import { useTextScramble } from '@/lib/animations/useTextScramble';

/**
 * 元件 Props
 */
export interface DynamicHeroTitleProps {
  /** 預設顯示的文案索引 */
  defaultIndex?: number;
  /** 是否啟用自動輪播（預設 true） */
  autoPlay?: boolean;
  /** 打字速度（毫秒/字元，預設 80）- 在 Scramble 效果中對應 speed */
  typingSpeed?: number;
  /** 刪除速度（毫秒/字元，預設 30） */
  deletingSpeed?: number;
  /** 全部顯示後等待時間（毫秒，預設 3000） */
  waitBeforeDelete?: number;
  /** 測試模式：跳過動畫直接顯示（預設 false） */
  testMode?: boolean;
  /** 初始延遲時間（毫秒，預設 0）- 用於等待其他動畫完成 */
  initialDelay?: number;
}

export function DynamicHeroTitle({
  defaultIndex = 0,
  autoPlay = true,
  typingSpeed = 40, // Scramble 效果通常快一點
  waitBeforeDelete = 3000,
  testMode = false,
  initialDelay = 0,
}: DynamicHeroTitleProps) {
  // 狀態管理
  const [titles, setTitles] = useState<HeroTitle[]>([FALLBACK_TITLE]);
  const [isLoading, setIsLoading] = useState(false); // 修復：設為 false 避免卡在 loading 畫面
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  
  // 控制各個部分顯示的目標文字
  const [targetTitle, setTargetTitle] = useState('');
  const [targetSubtitle, setTargetSubtitle] = useState('');
  const [targetDescription, setTargetDescription] = useState('');

  // 流程控制
  const [isWaiting, setIsWaiting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  /**
   * 載入文案資料
   */
  useEffect(() => {
    loadHeroTitles()
      .then((collection: HeroTitlesCollection) => {
        const enabledTitles = filterEnabledTitles(collection);
        if (enabledTitles.length > 0) {
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
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * 偵測行動裝置
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 當 currentIndex 改變時，開始新的序列
  useEffect(() => {
    if (isLoading || titles.length === 0) return;
    if (!isVisible) return;

    const currentTitle = titles[currentIndex];

    // ✅ 初始延遲：只在第一次（currentIndex === defaultIndex）時延遲
    const isFirstRender = currentIndex === defaultIndex;
    const delay = isFirstRender ? initialDelay : 0;

    const timer = setTimeout(() => {
      // 重置狀態，開始顯示標題
      setTargetTitle(currentTitle.title);
      setTargetSubtitle('');
      setTargetDescription('');
      setIsWaiting(false);
    }, delay);

    return () => clearTimeout(timer);

  }, [currentIndex, isLoading, titles, isVisible, defaultIndex, initialDelay]);

  // 定義 Scramble Hooks
  // 標題完成 -> 觸發副標題
  const titleAnim = useTextScramble({
    text: targetTitle,
    speed: typingSpeed,
    autoStart: true,
    onComplete: () => {
      if (targetTitle && !prefersReducedMotion && !testMode) {
        // 標題顯示完成，開始顯示副標題
        setTargetSubtitle(titles[currentIndex].subtitle);
      }
    }
  });

  // 副標題完成 -> 觸發描述
  const subtitleAnim = useTextScramble({
    text: targetSubtitle,
    speed: typingSpeed,
    autoStart: true,
    onComplete: () => {
      if (targetSubtitle && !prefersReducedMotion && !testMode) {
        // 副標題顯示完成，開始顯示描述
        setTargetDescription(titles[currentIndex].description);
      }
    }
  });

  // 描述完成 -> 等待 -> 逆序清除（描述 → 副標題 → 主標題）
  const descAnim = useTextScramble({
    text: targetDescription,
    speed: typingSpeed,
    autoStart: true,
    onComplete: () => {
      if (targetDescription && !isWaiting && !prefersReducedMotion && !testMode) {
        // 全部顯示完成，進入等待狀態
        setIsWaiting(true);

        if (autoPlay && titles.length > 1) {
          timeoutRef.current = setTimeout(() => {
            // ✅ 開始逆序清除：先清除描述
            setTargetDescription('');
          }, waitBeforeDelete);
        }
      }
    }
  });

  // ✅ 新增：描述清除完成 -> 清除副標題
  useEffect(() => {
    if (isWaiting && targetDescription === '' && targetSubtitle !== '' && !prefersReducedMotion && !testMode) {
      // 描述已清除，開始清除副標題（延遲確保動畫完成）
      const timer = setTimeout(() => {
        setTargetSubtitle('');
      }, 1500); // 等待描述清除動畫完成（1.5秒）

      return () => clearTimeout(timer);
    }
  }, [isWaiting, targetDescription, targetSubtitle, prefersReducedMotion, testMode]);

  // ✅ 新增：副標題清除完成 -> 清除主標題
  useEffect(() => {
    if (isWaiting && targetDescription === '' && targetSubtitle === '' && targetTitle !== '' && !prefersReducedMotion && !testMode) {
      // 副標題已清除，開始清除主標題（延遲確保動畫完成）
      const timer = setTimeout(() => {
        setTargetTitle('');
      }, 1500); // 等待副標題清除動畫完成（1.5秒）

      return () => clearTimeout(timer);
    }
  }, [isWaiting, targetDescription, targetSubtitle, targetTitle, prefersReducedMotion, testMode]);

  // ✅ 新增：主標題清除完成 -> 切換到下一個 index
  useEffect(() => {
    if (isWaiting && targetDescription === '' && targetSubtitle === '' && targetTitle === '' && !prefersReducedMotion && !testMode) {
      // 所有文字已清除，切換到下一個標題（延遲確保動畫完成）
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % titles.length);
        setIsWaiting(false); // 重置等待狀態
      }, 1500); // 等待主標題清除動畫完成（1.5秒）

      return () => clearTimeout(timer);
    }
  }, [isWaiting, targetDescription, targetSubtitle, targetTitle, titles.length, prefersReducedMotion, testMode]);

  // 處理 Reduced Motion 和 Test Mode
  useEffect(() => {
    if ((prefersReducedMotion || testMode) && titles[currentIndex]) {
      setTargetTitle(titles[currentIndex].title);
      setTargetSubtitle(titles[currentIndex].subtitle);
      setTargetDescription(titles[currentIndex].description);
    }
  }, [prefersReducedMotion, testMode, currentIndex, titles]);

  /**
   * 手動切換文案
   */
  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className="text-center mb-12" aria-live="polite" aria-busy="true">
        <div className="text-pip-boy-green">載入中...</div>
      </div>
    );
  }

  // ✅ 終端機風格游標邏輯：只顯示一個游標，模擬真實終端
  // 規則：使用 displayText（實際顯示的文字）而非 targetText（目標狀態）
  // 這樣刪除時游標會跟隨文字縮短
  const showDescCursor = descAnim.displayText !== '';
  const showSubtitleCursor = subtitleAnim.displayText !== '' && descAnim.displayText === '';
  const showTitleCursor = titleAnim.displayText !== '' && subtitleAnim.displayText === '' && descAnim.displayText === '';

  // 特殊：初始狀態（全空），顯示標題位置的空白游標
  const showInitialCursor = titleAnim.displayText === '' && subtitleAnim.displayText === '' && descAnim.displayText === '';

  return (
    <div className={cn('text-center mb-12', testMode && 'test-mode')}>
      {/* CRT 視覺特效容器 */}
      <div className={styles['hero-title-container']}>
        {/* 主標題 */}
        <div
          className={cn(
            'text-5xl md:text-7xl font-bold mb-6 tracking-tight text-pip-boy-green min-h-[4rem] md:min-h-[6rem] flex items-center justify-center',
            isGlitching && styles['hero-title-glitching']
          )}
          aria-live="polite"
        >
          <h1 className={cn('inline', styles['hero-title-text'])}>
            {titleAnim.displayText}
            {/* ✅ 終端機游標：初始狀態或標題是最後有內容的區塊時顯示 */}
            {(showInitialCursor || showTitleCursor) && (
              <span className={styles['typing-cursor-inline']} aria-hidden="true" />
            )}
          </h1>
        </div>

        {/* 副標題 */}
        <div className="text-xl md:text-2xl mb-8 text-pip-boy-green/80 min-h-[2rem] flex items-center justify-center">
          <p className={cn('inline', styles['hero-subtitle-text'])}>
            {subtitleAnim.displayText}
            {/* ✅ 終端機游標：副標題是最後有內容的區塊時顯示 */}
            {showSubtitleCursor && (
              <span className={styles['typing-cursor-inline']} aria-hidden="true" />
            )}
          </p>
        </div>

        {/* 描述段落 */}
        <div className="text-sm text-pip-boy-green/60 max-w-2xl mx-auto leading-relaxed min-h-[3rem] flex items-center justify-center">
          <p className={cn('inline', styles['hero-description-text'])}>
            {descAnim.displayText}
            {/* ✅ 終端機游標：內文是最後有內容的區塊時顯示（打字完成後停留在最後） */}
            {showDescCursor && (
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
