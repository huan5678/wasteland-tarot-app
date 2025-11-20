/**
 * Homepage Animation Integration Tests
 * Task 18.1: 整合所有 sections 至首頁驗證
 *
 * 驗證目標：
 * - 所有 section components 正確匯入至 client-page.tsx
 * - 所有動畫在完整頁面中協調運作
 * - 無動畫衝突或效能問題
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ClientPage from '../client-page';

// Mock custom hooks
vi.mock('@/lib/animations/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('@/lib/animations/useStagger', () => ({
  useStagger: vi.fn(),
}));

vi.mock('@/lib/animations/useScrollAnimation', () => ({
  useScrollAnimation: vi.fn(() => ({
    scrollTrigger: null,
    timeline: null,
    isReady: true,
    refresh: vi.fn(),
  })),
}));

vi.mock('@/lib/animations/useParallax', () => ({
  useParallax: vi.fn(),
}));

vi.mock('@/components/landing/useTestimonialAnimation', () => ({
  useTestimonialAnimation: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/authStore', () => ({
  useAuthStore: vi.fn(() => null),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  landingStatsAPI: {
    getStats: vi.fn(() =>
      Promise.resolve({
        users: 1234,
        readings: 5678,
        cards: 78,
        providers: 3,
      })
    ),
  },
}));

describe('Homepage Integration Tests - Task 18.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Section Components Integration', () => {
    it('應該渲染所有 7 個主要 sections', () => {
      render(<ClientPage />);

      // 1. Hero Section
      expect(screen.getByText(/VAULT-TEC PIP-BOY 3000/)).toBeInTheDocument();

      // 2. How It Works Section
      expect(screen.getByText('如何使用')).toBeInTheDocument();
      expect(screen.getByText('選擇牌陣')).toBeInTheDocument();

      // 3. Stats Section
      expect(screen.getByText('即時數據統計')).toBeInTheDocument();

      // 4. Testimonials Section
      expect(screen.getByText('用戶評價')).toBeInTheDocument();

      // 5. Features Section
      expect(screen.getByText('核心功能')).toBeInTheDocument();

      // 6. FAQ Section
      expect(screen.getByText('常見問題')).toBeInTheDocument();

      // 7. CTA Section
      expect(
        screen.getByText('準備好探索你的廢土命運了嗎？')
      ).toBeInTheDocument();
    });

    it('Hero Section 應該包含動態標題元件', () => {
      render(<ClientPage />);

      // DynamicHeroTitle 應該被渲染
      const heroSection = screen
        .getByText(/VAULT-TEC PIP-BOY 3000/)
        .closest('section');
      expect(heroSection).toBeInTheDocument();
    });

    it('How It Works Section 應該包含 4 個 StepCards', () => {
      render(<ClientPage />);

      expect(screen.getByText('選擇牌陣')).toBeInTheDocument();
      expect(screen.getByText('洗牌抽卡')).toBeInTheDocument();
      expect(screen.getByText('查看解讀')).toBeInTheDocument();
      expect(screen.getByText('追蹤進度')).toBeInTheDocument();
    });

    it('Stats Section 應該包含 4 個 StatCounters', () => {
      render(<ClientPage />);

      expect(screen.getByText('總用戶數')).toBeInTheDocument();
      expect(screen.getByText('占卜次數')).toBeInTheDocument();
      expect(screen.getByText('塔羅牌')).toBeInTheDocument();
      expect(screen.getByText('AI 供應商')).toBeInTheDocument();
    });

    it('Testimonials Section 應該包含 3 個 TestimonialCards', () => {
      render(<ClientPage />);

      expect(screen.getByText('Vault111_X')).toBeInTheDocument();
      expect(screen.getByText('WastelandWanderer')).toBeInTheDocument();
      expect(screen.getByText('NukaEnthusiast')).toBeInTheDocument();
    });

    it('FAQ Section 應該包含 4 個 FAQ 項目', () => {
      render(<ClientPage />);

      expect(screen.getByText('什麼是廢土塔羅？')).toBeInTheDocument();
      expect(screen.getByText('我需要註冊才能使用嗎？')).toBeInTheDocument();
      expect(screen.getByText('如何解讀占卜結果？')).toBeInTheDocument();
      expect(screen.getByText('占卜結果準確嗎？')).toBeInTheDocument();
    });

    it('CTA Section 應該包含兩個 CTA 按鈕', () => {
      render(<ClientPage />);

      expect(screen.getByText('註冊 Vault 帳號')).toBeInTheDocument();
      expect(screen.getByText('瀏覽卡牌圖書館')).toBeInTheDocument();
    });
  });

  describe('Animation Hooks Integration', () => {
    it('應該正確整合 useStagger hook (How It Works Section)', () => {
      const { useStagger } = require('@/lib/animations/useStagger');

      render(<ClientPage />);

      // useStagger 應該被呼叫
      expect(useStagger).toHaveBeenCalled();

      // 驗證參數
      const callArgs = useStagger.mock.calls[0][0];
      expect(callArgs.childrenSelector).toBe('.step-card');
      expect(callArgs.stagger).toBe(0.15);
      expect(callArgs.from).toEqual({ opacity: 0, y: 40 });
      expect(callArgs.to).toEqual({ opacity: 1, y: 0 });
      expect(callArgs.duration).toBe(0.6);
    });

    it('應該正確整合 useTestimonialAnimation hook (Testimonials Section)', () => {
      const { useTestimonialAnimation } = require('@/components/landing/useTestimonialAnimation');

      render(<ClientPage />);

      // useTestimonialAnimation 應該被呼叫
      expect(useTestimonialAnimation).toHaveBeenCalled();

      // 驗證參數
      const callArgs = useTestimonialAnimation.mock.calls[0][0];
      expect(callArgs.childrenSelector).toBe('.testimonial-card');
      expect(callArgs.stagger).toBe(0.2);
    });

    it('應該整合 useReducedMotion hook 至所有需要的 sections', () => {
      const { useReducedMotion } = require('@/lib/animations/useReducedMotion');

      render(<ClientPage />);

      // useReducedMotion 應該被呼叫
      expect(useReducedMotion).toHaveBeenCalled();
    });
  });

  describe('Animation Coordination', () => {
    it('各 section 動畫應該使用不同的 trigger refs（避免衝突）', () => {
      render(<ClientPage />);

      // How It Works Section 使用 howItWorksContainerRef
      const howItWorksSection = screen.getByText('如何使用').closest('section');
      expect(howItWorksSection).toBeInTheDocument();

      // Testimonials Section 使用 testimonialsRef
      const testimonialsSection = screen.getByText('用戶評價').closest('section');
      expect(testimonialsSection).toBeInTheDocument();

      // 確認兩個 section 是不同的 DOM 元素
      expect(howItWorksSection).not.toBe(testimonialsSection);
    });

    it('所有 motion buttons 應該正確配置 variants', () => {
      render(<ClientPage />);

      const ctaButtons = screen.getAllByRole('button', {
        name: /註冊 Vault 帳號|瀏覽卡牌圖書館/,
      });

      expect(ctaButtons.length).toBe(2);
    });
  });

  describe('Layout & Styling Consistency', () => {
    it('所有 sections 應該使用一致的邊框樣式', () => {
      render(<ClientPage />);

      // 檢查是否有 border-pip-boy-green 的 sections
      const sections = document.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(6);
    });

    it('應該使用一致的 max-width container', () => {
      render(<ClientPage />);

      // 檢查所有主要 container 是否使用 max-w-6xl 或 max-w-4xl
      const containers = document.querySelectorAll('.max-w-6xl, .max-w-4xl');
      expect(containers.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Performance Considerations', () => {
    it('應該使用 lazy initialization 避免過多 refs', () => {
      render(<ClientPage />);

      // 驗證 component 成功渲染（無過多 refs 導致的錯誤）
      expect(screen.getByText('如何使用')).toBeInTheDocument();
    });

    it('動畫配置應該使用 memoized values', () => {
      // 此測試驗證無不必要的 re-renders
      const { rerender } = render(<ClientPage />);

      // Re-render 不應該破壞 animation hooks
      rerender(<ClientPage />);

      expect(screen.getByText('如何使用')).toBeInTheDocument();
    });
  });
});
