/**
 * Hero Section Animations Integration Tests
 *
 * Tests for tasks 7.1, 7.2, 7.3:
 * - 7.1: 視差效果整合
 * - 7.2: 入場動畫序列
 * - 7.3: 無障礙支援
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock animation hooks - use factory functions to avoid hoisting issues
vi.mock('@/lib/animations/useParallax', () => ({
  useParallax: vi.fn(),
}));

vi.mock('@/lib/animations/useScrollAnimation', () => ({
  useScrollAnimation: vi.fn(() => ({
    scrollTrigger: null,
    timeline: null,
    isReady: true,
    refresh: vi.fn(),
  })),
}));

vi.mock('@/lib/animations/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { HeroSection } from '../HeroSection';
import { useParallax } from '@/lib/animations/useParallax';
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

// Get mocked functions
const mockUseParallax = vi.mocked(useParallax);
const mockUseScrollAnimation = vi.mocked(useScrollAnimation);
const mockUseReducedMotion = vi.mocked(useReducedMotion);

describe('HeroSection - Animation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default values
    mockUseReducedMotion.mockReturnValue(false);
    mockUseScrollAnimation.mockReturnValue({
      scrollTrigger: null,
      timeline: null,
      isReady: true,
      refresh: vi.fn(),
    });
  });

  describe('Task 7.1: 視差效果整合', () => {
    it('應該呼叫 useParallax hook 並傳入正確參數', () => {
      render(<HeroSection />);

      expect(mockUseParallax).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundRef: expect.objectContaining({ current: expect.any(Object) }),
          foregroundRef: expect.objectContaining({ current: expect.any(Object) }),
          backgroundSpeed: 0.5,
          foregroundSpeed: 1.0,
          disableOnMobile: true,
        })
      );
    });

    it('應該正確綁定 backgroundRef 與 foregroundRef', () => {
      render(<HeroSection />);

      const backgroundElement = screen.getByTestId('hero-background');
      const foregroundElement = screen.getByTestId('hero-foreground');

      expect(backgroundElement).toBeInTheDocument();
      expect(foregroundElement).toBeInTheDocument();
    });
  });

  describe('Task 7.2: 入場動畫序列', () => {
    it('應該呼叫 useScrollAnimation hook 並設定標題動畫', () => {
      render(<HeroSection />);

      expect(mockUseScrollAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerRef: expect.objectContaining({ current: expect.any(Object) }),
          animations: expect.arrayContaining([
            expect.objectContaining({
              target: '.hero-title',
              from: { opacity: 0, y: -40 },
              to: expect.objectContaining({
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
              }),
            }),
          ]),
        })
      );
    });

    it('應該設定副標題動畫（延遲 0.3s）', () => {
      render(<HeroSection />);

      const call = mockUseScrollAnimation.mock.calls[0][0];
      const subtitleAnimation = call.animations.find(
        (anim: any) => anim.target === '.hero-subtitle'
      );

      expect(subtitleAnimation).toEqual(
        expect.objectContaining({
          target: '.hero-subtitle',
          from: { opacity: 0, y: -20 },
          to: expect.objectContaining({
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          }),
          position: '+=0.3',
        })
      );
    });

    it('應該設定 CTA 按鈕縮放動畫（延遲 0.5s 後執行）', () => {
      render(<HeroSection />);

      const call = mockUseScrollAnimation.mock.calls[0][0];
      const ctaAnimation = call.animations.find(
        (anim: any) => anim.target === '.hero-cta'
      );

      expect(ctaAnimation).toEqual(
        expect.objectContaining({
          target: '.hero-cta',
          from: { opacity: 0, scale: 0.8 },
          to: expect.objectContaining({
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'elastic.out(1, 0.5)',
          }),
          position: '+=0.5',
        })
      );
    });

    it('應該在 foregroundRef 上綁定入場動畫', () => {
      render(<HeroSection />);

      const call = mockUseScrollAnimation.mock.calls[0][0];

      expect(call.triggerRef).toEqual(
        expect.objectContaining({ current: expect.any(Object) })
      );
    });
  });

  describe('Task 7.3: 無障礙支援整合', () => {
    it('當 useReducedMotion 返回 true 時，應停用視差效果', () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<HeroSection />);

      const call = mockUseScrollAnimation.mock.calls[0][0];
      expect(call.enabled).toBe(false);
    });

    it('當 useReducedMotion 返回 true 時，useScrollAnimation 應接收 enabled: false', () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<HeroSection />);

      expect(mockUseScrollAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('當 useReducedMotion 返回 false 時，應啟用所有動畫', () => {
      mockUseReducedMotion.mockReturnValue(false);

      render(<HeroSection />);

      const call = mockUseScrollAnimation.mock.calls[0][0];
      expect(call.enabled).toBe(true);
    });

    it('應該整合 useReducedMotion hook', () => {
      render(<HeroSection />);

      expect(mockUseReducedMotion).toHaveBeenCalled();
    });
  });

  describe('Task 7.4: 元件渲染驗證', () => {
    it('應該渲染所有必要的動畫目標元素', () => {
      render(<HeroSection />);

      // 使用 container 搜尋 class name（因為這些元素可能沒有 test-id）
      const { container } = render(<HeroSection />);

      const title = container.querySelector('.hero-title');
      const subtitle = container.querySelector('.hero-subtitle');
      const cta = container.querySelector('.hero-cta');

      expect(title).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
      expect(cta).toBeInTheDocument();
    });

    it('應該在視差停用時仍正常渲染內容', () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<HeroSection />);

      expect(screen.getByTestId('hero-background')).toBeInTheDocument();
      expect(screen.getByTestId('hero-foreground')).toBeInTheDocument();
    });
  });
});
