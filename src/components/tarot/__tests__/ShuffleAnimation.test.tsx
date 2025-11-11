/**
 * ShuffleAnimation Component Tests
 *
 * Tests for the shuffle animation component with:
 * - Framer Motion integration
 * - Reduced motion support
 * - Animation timing
 * - Performance degradation
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShuffleAnimation } from '../ShuffleAnimation';

// Mock usePrefersReducedMotion hook
jest.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: jest.fn(() => ({
    prefersReducedMotion: false,
    isLoading: false,
  })),
}));

// Mock Framer Motion
jest.mock('framer-motion/m', () => ({
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

describe('ShuffleAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('應該在洗牌時渲染動畫容器', () => {
      render(<ShuffleAnimation isShuffling={true} />);
      const container = screen.getByTestId('shuffle-animation');
      expect(container).toBeInTheDocument();
    });

    it('應該在非洗牌狀態時不渲染動畫', () => {
      render(<ShuffleAnimation isShuffling={false} />);
      const container = screen.queryByTestId('shuffle-animation');
      expect(container).not.toBeInTheDocument();
    });
  });

  describe('Animation Duration', () => {
    it('應該使用預設的動畫持續時間 (1.5s)', () => {
      const { container } = render(<ShuffleAnimation isShuffling={true} />);
      const animationElement = container.firstChild as HTMLElement;

      // 檢查 data-duration 屬性
      expect(animationElement).toHaveAttribute('data-duration', '1.5');
    });

    it('應該允許自訂動畫持續時間', () => {
      const { container } = render(
        <ShuffleAnimation isShuffling={true} duration={2.0} />
      );
      const animationElement = container.firstChild as HTMLElement;

      expect(animationElement).toHaveAttribute('data-duration', '2');
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

    it('應該在 reduced motion 模式下禁用動畫', () => {
      const { container } = render(<ShuffleAnimation isShuffling={true} />);
      const animationElement = container.firstChild as HTMLElement;

      expect(animationElement).toHaveAttribute('data-reduced-motion', 'true');
    });

    it('應該在 reduced motion 模式下使用簡化動畫', () => {
      render(<ShuffleAnimation isShuffling={true} />);
      const simplifiedIndicator = screen.getByTestId('shuffle-simplified');

      expect(simplifiedIndicator).toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    it('應該在動畫完成後呼叫 onComplete', async () => {
      const mockOnComplete = jest.fn();

      render(
        <ShuffleAnimation
          isShuffling={true}
          duration={0.1} // 短持續時間以加速測試
          onComplete={mockOnComplete}
        />
      );

      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 500 }
      );
    });

    it('應該傳遞動畫持續時間給 onComplete', async () => {
      const mockOnComplete = jest.fn();
      const duration = 0.1;

      render(
        <ShuffleAnimation
          isShuffling={true}
          duration={duration}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(duration);
      });
    });
  });

  describe('Visual Elements', () => {
    it('應該顯示輻射效果', () => {
      render(<ShuffleAnimation isShuffling={true} />);
      const radiationEffect = screen.getByTestId('radiation-effect');

      expect(radiationEffect).toBeInTheDocument();
    });

    it('應該顯示洗牌提示文字', () => {
      render(<ShuffleAnimation isShuffling={true} />);
      const hintText = screen.getByText(/洗牌中/i);

      expect(hintText).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('應該包含適當的 ARIA 標籤', () => {
      render(<ShuffleAnimation isShuffling={true} />);
      const container = screen.getByTestId('shuffle-animation');

      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-label', '正在洗牌');
    });

    it('應該在 reduced motion 模式下通知使用者', () => {
      const { usePrefersReducedMotion } = require('@/hooks/usePrefersReducedMotion');
      usePrefersReducedMotion.mockReturnValue({
        prefersReducedMotion: true,
        isLoading: false,
      });

      render(<ShuffleAnimation isShuffling={true} />);
      const container = screen.getByTestId('shuffle-animation');

      expect(container).toHaveAttribute('aria-label', '正在洗牌（簡化模式）');
    });
  });
});
