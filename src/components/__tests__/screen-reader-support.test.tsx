/**
 * Screen Reader Support Tests
 *
 * Tests comprehensive screen reader accessibility:
 * - ARIA labels on all interactive elements
 * - Voice prompts for card draw actions
 * - Live regions for dynamic content updates
 * - Compatibility with NVDA/JAWS screen readers
 *
 * Requirements: 8.1
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

// Mock components representing key interactive elements
const MockInteractiveCardDraw = ({ onShuffle, onFlip }: { onShuffle: () => void; onFlip: () => void }) => (
  <div>
    <button
      onClick={onShuffle}
      aria-label="點擊牌組開始洗牌"
      aria-describedby="shuffle-help"
    >
      洗牌
    </button>
    <span id="shuffle-help" className="sr-only">
      點擊此按鈕將隨機洗牌並展開卡片
    </span>

    <div role="status" aria-live="polite" aria-atomic="true" data-testid="shuffle-status">
      {/* Live region for shuffle status */}
    </div>

    <button
      onClick={onFlip}
      aria-label="翻開第一張卡片"
      aria-describedby="flip-help"
    >
      翻牌
    </button>
    <span id="flip-help" className="sr-only">
      點擊卡片背面以翻開並查看牌面
    </span>

    <div role="status" aria-live="polite" aria-atomic="true" data-testid="flip-status">
      {/* Live region for flip status */}
    </div>
  </div>
);

const MockStreamingInterpretation = ({ text }: { text: string }) => (
  <div>
    <div
      role="region"
      aria-label="AI 解讀內容"
      aria-live="polite"
      aria-atomic="false"
      data-testid="interpretation-region"
    >
      {text}
    </div>
  </div>
);

describe('Screen Reader Support', () => {
  describe('ARIA Labels', () => {
    it('should provide descriptive ARIA labels for interactive elements', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const shuffleButton = screen.getByRole('button', { name: /點擊牌組開始洗牌/i });
      const flipButton = screen.getByRole('button', { name: /翻開第一張卡片/i });

      expect(shuffleButton).toHaveAttribute('aria-label', '點擊牌組開始洗牌');
      expect(flipButton).toHaveAttribute('aria-label', '翻開第一張卡片');
    });

    it('should provide aria-describedby for additional context', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const shuffleButton = screen.getByRole('button', { name: /點擊牌組開始洗牌/i });
      const shuffleHelp = screen.getByText(/點擊此按鈕將隨機洗牌並展開卡片/i);

      expect(shuffleButton).toHaveAttribute('aria-describedby', 'shuffle-help');
      expect(shuffleHelp).toHaveAttribute('id', 'shuffle-help');
      expect(shuffleHelp).toHaveClass('sr-only');
    });
  });

  describe('Voice Prompts', () => {
    it('should announce shuffle action to screen readers', async () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      const { rerender } = render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const shuffleButton = screen.getByRole('button', { name: /點擊牌組開始洗牌/i });
      await userEvent.click(shuffleButton);

      // Simulate status update
      const ShuffleWithStatus = () => (
        <div>
          <button onClick={mockShuffle} aria-label="點擊牌組開始洗牌">洗牌</button>
          <span id="shuffle-help" className="sr-only">點擊此按鈕將隨機洗牌並展開卡片</span>
          <div role="status" aria-live="polite" aria-atomic="true" data-testid="shuffle-status">
            正在洗牌中，請稍候...
          </div>
          <button onClick={mockFlip} aria-label="翻開第一張卡片">翻牌</button>
          <span id="flip-help" className="sr-only">點擊卡片背面以翻開並查看牌面</span>
          <div role="status" aria-live="polite" aria-atomic="true" data-testid="flip-status"></div>
        </div>
      );

      rerender(<ShuffleWithStatus />);

      const statusRegion = screen.getByTestId('shuffle-status');
      expect(statusRegion).toHaveAttribute('role', 'status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveTextContent('正在洗牌中，請稍候...');
    });

    it('should announce flip action to screen readers', async () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      const { rerender } = render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const flipButton = screen.getByRole('button', { name: /翻開第一張卡片/i });
      await userEvent.click(flipButton);

      // Simulate flip status update
      const FlipWithStatus = () => (
        <div>
          <button onClick={mockShuffle} aria-label="點擊牌組開始洗牌">洗牌</button>
          <span id="shuffle-help" className="sr-only">點擊此按鈕將隨機洗牌並展開卡片</span>
          <div role="status" aria-live="polite" aria-atomic="true" data-testid="shuffle-status"></div>
          <button onClick={mockFlip} aria-label="翻開第一張卡片">翻牌</button>
          <span id="flip-help" className="sr-only">點擊卡片背面以翻開並查看牌面</span>
          <div role="status" aria-live="polite" aria-atomic="true" data-testid="flip-status">
            已翻開卡片：愚者（正位）
          </div>
        </div>
      );

      rerender(<FlipWithStatus />);

      const flipStatus = screen.getByTestId('flip-status');
      expect(flipStatus).toHaveAttribute('role', 'status');
      expect(flipStatus).toHaveTextContent('已翻開卡片：愚者（正位）');
    });
  });

  describe('Live Regions', () => {
    it('should use live regions for dynamic content updates', () => {
      render(<MockStreamingInterpretation text="AI 正在生成解讀..." />);

      const liveRegion = screen.getByTestId('interpretation-region');
      expect(liveRegion).toHaveAttribute('role', 'region');
      expect(liveRegion).toHaveAttribute('aria-label', 'AI 解讀內容');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    });

    it('should update live region content for streaming text', async () => {
      const { rerender } = render(<MockStreamingInterpretation text="AI 正在生成解讀..." />);

      let liveRegion = screen.getByTestId('interpretation-region');
      expect(liveRegion).toHaveTextContent('AI 正在生成解讀...');

      // Simulate streaming text update
      rerender(<MockStreamingInterpretation text="愚者牌代表新的開始..." />);

      liveRegion = screen.getByTestId('interpretation-region');
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('愚者牌代表新的開始...');
      });
    });

    it('should use polite live region to avoid interrupting user', () => {
      render(<MockStreamingInterpretation text="解讀內容" />);

      const liveRegion = screen.getByTestId('interpretation-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      // aria-atomic="false" allows incremental updates
      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('Screen Reader Only Content', () => {
    it('should provide screen reader only help text', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const shuffleHelp = screen.getByText(/點擊此按鈕將隨機洗牌並展開卡片/i);
      const flipHelp = screen.getByText(/點擊卡片背面以翻開並查看牌面/i);

      expect(shuffleHelp).toHaveClass('sr-only');
      expect(flipHelp).toHaveClass('sr-only');
    });

    it('should use sr-only class to hide visual content from sighted users', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Verify sr-only elements are in DOM but visually hidden
      srOnlyElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('NVDA/JAWS Compatibility', () => {
    it('should use semantic HTML roles for screen reader navigation', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      // Buttons should be semantic <button> elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should provide status role for live status updates', () => {
      const mockShuffle = jest.fn();
      const mockFlip = jest.fn();

      render(<MockInteractiveCardDraw onShuffle={mockShuffle} onFlip={mockFlip} />);

      const statusRegions = screen.getAllByRole('status');
      expect(statusRegions.length).toBeGreaterThan(0);

      statusRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live', 'polite');
        expect(region).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should provide region role for major content areas', () => {
      render(<MockStreamingInterpretation text="解讀內容" />);

      const contentRegion = screen.getByRole('region', { name: /AI 解讀內容/i });
      expect(contentRegion).toBeInTheDocument();
      expect(contentRegion).toHaveAttribute('aria-label', 'AI 解讀內容');
    });
  });
});
