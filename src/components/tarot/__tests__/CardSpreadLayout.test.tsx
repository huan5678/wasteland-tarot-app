/**
 * CardSpreadLayout Component Tests
 *
 * Tests for card spread layout and animation with:
 * - Multiple spread types (1/3/5/10 cards)
 * - Card positioning calculations
 * - Expansion animations
 * - Touch interactions
 * - Reduced motion support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardSpreadLayout } from '../CardSpreadLayout';

// Mock usePrefersReducedMotion hook
jest.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: jest.fn(() => ({
    prefersReducedMotion: false,
    isLoading: false,
  })),
}));

// Mock Framer Motion
jest.mock('framer-motion/m', () => ({
  div: ({ children, onClick, onHoverStart, onHoverEnd, ...props }: any) => (
    <div
      {...props}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {children}
    </div>
  ),
}));

// Mock card data
const mockCards = [
  {
    id: '1',
    name: 'The Fool',
    suit: 'major_arcana',
    position: 'upright' as const,
    positionIndex: 0,
    positionLabel: '過去',
    image_url: '/images/fool.png',
    upright_meaning: 'New beginnings',
    reversed_meaning: 'Recklessness',
    keywords: ['innocence', 'freedom'],
  },
  {
    id: '2',
    name: 'The Magician',
    suit: 'major_arcana',
    position: 'reversed' as const,
    positionIndex: 1,
    positionLabel: '現在',
    image_url: '/images/magician.png',
    upright_meaning: 'Power',
    reversed_meaning: 'Manipulation',
    keywords: ['skill', 'willpower'],
  },
  {
    id: '3',
    name: 'The High Priestess',
    suit: 'major_arcana',
    position: 'upright' as const,
    positionIndex: 2,
    positionLabel: '未來',
    image_url: '/images/priestess.png',
    upright_meaning: 'Intuition',
    reversed_meaning: 'Secrets',
    keywords: ['wisdom', 'mystery'],
  },
];

describe('CardSpreadLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('應該渲染指定數量的卡片', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const cards = screen.getAllByTestId(/card-position-/);
      expect(cards).toHaveLength(3);
    });

    it('應該顯示卡片位置標籤', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      expect(screen.getByText('過去')).toBeInTheDocument();
      expect(screen.getByText('現在')).toBeInTheDocument();
      expect(screen.getByText('未來')).toBeInTheDocument();
    });
  });

  describe('Spread Type Layouts', () => {
    it('應該使用單卡排列（single）', () => {
      const singleCard = [mockCards[0]];
      const { container } = render(
        <CardSpreadLayout cards={singleCard} spreadType="single" />
      );

      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveAttribute('data-spread-type', 'single');
    });

    it('應該使用三卡排列（three_card）', () => {
      const { container } = render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveAttribute('data-spread-type', 'three_card');
    });

    it('應該使用五卡排列（wasteland_survival）', () => {
      const fiveCards = [...mockCards, mockCards[0], mockCards[1]];
      const { container } = render(
        <CardSpreadLayout cards={fiveCards} spreadType="wasteland_survival" />
      );

      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveAttribute('data-spread-type', 'wasteland_survival');
    });

    it('應該使用十卡排列（celtic_cross）', () => {
      const tenCards = [
        ...mockCards,
        ...mockCards,
        ...mockCards,
        mockCards[0],
      ];
      const { container } = render(
        <CardSpreadLayout cards={tenCards} spreadType="celtic_cross" />
      );

      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveAttribute('data-spread-type', 'celtic_cross');
    });
  });

  describe('Card Positioning', () => {
    it('應該計算正確的卡片位置', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const cards = screen.getAllByTestId(/card-position-/);

      // 檢查每張卡片都有位置屬性
      cards.forEach((card, index) => {
        expect(card).toHaveAttribute('data-position-index', `${index}`);
      });
    });

    it('應該為不同牌陣類型使用不同的間距', () => {
      const { rerender, container } = render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const threeCardLayout = container.firstChild as HTMLElement;
      const threeCardSpacing = threeCardLayout.getAttribute('data-spacing');

      rerender(
        <CardSpreadLayout
          cards={[...mockCards, ...mockCards, ...mockCards, mockCards[0]]}
          spreadType="celtic_cross"
        />
      );

      const celticCrossLayout = container.firstChild as HTMLElement;
      const celticCrossSpacing = celticCrossLayout.getAttribute('data-spacing');

      // Celtic Cross 應該有較小的間距
      expect(celticCrossSpacing).not.toBe(threeCardSpacing);
    });
  });

  describe('Expansion Animation', () => {
    it('應該在掛載時執行展開動畫', async () => {
      const { container } = render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const layout = container.firstChild as HTMLElement;

      // 初始狀態應該是收縮的
      expect(layout).toHaveAttribute('data-animation-state', 'expanding');

      // 等待動畫完成
      await waitFor(
        () => {
          expect(layout).toHaveAttribute('data-animation-state', 'expanded');
        },
        { timeout: 2000 }
      );
    });

    it('應該按順序展開卡片（staggered animation）', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const cards = screen.getAllByTestId(/card-position-/);

      cards.forEach((card, index) => {
        const delay = card.getAttribute('data-animation-delay');
        expect(parseFloat(delay || '0')).toBeGreaterThanOrEqual(index * 0.1);
      });
    });
  });

  describe('Hover Effects', () => {
    it('應該在滑鼠懸停時顯示輻射光暈效果', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const firstCard = screen.getByTestId('card-position-0');

      // 懸停前無光暈
      expect(firstCard).not.toHaveClass('card-hover-glow');

      // 觸發懸停
      fireEvent.mouseEnter(firstCard);

      // 懸停後有光暈
      expect(firstCard).toHaveClass('card-hover-glow');

      // 離開後光暈消失
      fireEvent.mouseLeave(firstCard);
      expect(firstCard).not.toHaveClass('card-hover-glow');
    });

    it('應該在 reduced motion 模式下禁用懸停動畫', () => {
      const { usePrefersReducedMotion } = require('@/hooks/usePrefersReducedMotion');
      usePrefersReducedMotion.mockReturnValue({
        prefersReducedMotion: true,
        isLoading: false,
      });

      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const firstCard = screen.getByTestId('card-position-0');

      fireEvent.mouseEnter(firstCard);

      // Reduced motion 模式下不應顯示動畫效果
      expect(firstCard).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('Touch Interactions', () => {
    it('應該支援觸控點擊', () => {
      const mockOnCardClick = jest.fn();

      render(
        <CardSpreadLayout
          cards={mockCards}
          spreadType="three_card"
          onCardClick={mockOnCardClick}
        />
      );

      const firstCard = screen.getByTestId('card-position-0');

      fireEvent.touchStart(firstCard);
      fireEvent.touchEnd(firstCard);

      expect(mockOnCardClick).toHaveBeenCalledWith(mockCards[0], 0);
    });

    it('應該支援長按預覽', async () => {
      const mockOnCardLongPress = jest.fn();

      render(
        <CardSpreadLayout
          cards={mockCards}
          spreadType="three_card"
          onCardLongPress={mockOnCardLongPress}
        />
      );

      const firstCard = screen.getByTestId('card-position-0');

      fireEvent.touchStart(firstCard);

      // 模擬長按 (>500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(mockOnCardLongPress).toHaveBeenCalledWith(mockCards[0], 0);
    });
  });

  describe('Accessibility', () => {
    it('應該包含適當的 ARIA 標籤', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const layout = screen.getByTestId('card-spread-layout');

      expect(layout).toHaveAttribute('role', 'group');
      expect(layout).toHaveAttribute(
        'aria-label',
        expect.stringContaining('卡牌排列')
      );
    });

    it('應該為每張卡片提供可訪問的名稱', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const firstCard = screen.getByTestId('card-position-0');

      expect(firstCard).toHaveAttribute(
        'aria-label',
        expect.stringContaining('The Fool')
      );
      expect(firstCard).toHaveAttribute(
        'aria-label',
        expect.stringContaining('過去')
      );
    });

    it('應該支援鍵盤導航', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const cards = screen.getAllByTestId(/card-position-/);

      cards.forEach((card) => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      const { usePrefersReducedMotion } = require('@/hooks/usePrefersReducedMotion');
      usePrefersReducedMotion.mockReturnValue({
        prefersReducedMotion: true,
        isLoading: false,
      });
    });

    it('應該在 reduced motion 模式下禁用展開動畫', () => {
      const { container } = render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const layout = container.firstChild as HTMLElement;

      expect(layout).toHaveAttribute('data-reduced-motion', 'true');
      expect(layout).toHaveAttribute('data-animation-state', 'instant');
    });

    it('應該在 reduced motion 模式下立即顯示所有卡片', () => {
      render(
        <CardSpreadLayout cards={mockCards} spreadType="three_card" />
      );

      const cards = screen.getAllByTestId(/card-position-/);

      cards.forEach((card) => {
        const delay = card.getAttribute('data-animation-delay');
        expect(delay).toBe('0');
      });
    });
  });
});
