/**
 * PipBoyCard Component Tests
 * 測試 PipBoyCard 元件使用 CVA 變體系統
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,
  PipBoyCardFooter,
  type PipBoyCardProps,
} from '../PipBoyCard';

// Mock useAudioEffect hook
jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
    stopSound: jest.fn(),
    stopAll: jest.fn(),
  }),
}));

describe('PipBoyCard', () => {
  describe('CVA Variants System', () => {
    it('應該正確渲染 default 變體', () => {
      render(<PipBoyCard data-testid="card">Default Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-pip-boy-green');
      expect(card).toHaveClass('bg-black/80');
    });

    it('應該正確渲染 elevated 變體', () => {
      render(<PipBoyCard variant="elevated" data-testid="card">Elevated Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('shadow-[0_0_20px_rgba(51,255,51,0.3)]');
    });

    it('應該正確渲染 ghost 變體', () => {
      render(<PipBoyCard variant="ghost" data-testid="card">Ghost Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('border-pip-boy-green/30');
      expect(card).toHaveClass('bg-black/60');
    });

    it('應該正確渲染 interactive 變體', () => {
      render(<PipBoyCard variant="interactive" data-testid="card">Interactive Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Padding Variants', () => {
    it('應該正確渲染 none padding', () => {
      render(<PipBoyCard padding="none" data-testid="card">No Padding</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('p-0');
    });

    it('應該正確渲染 sm padding', () => {
      render(<PipBoyCard padding="sm" data-testid="card">Small Padding</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('p-3');
    });

    it('應該正確渲染 default padding', () => {
      render(<PipBoyCard padding="default" data-testid="card">Default Padding</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('p-4');
    });

    it('應該正確渲染 lg padding', () => {
      render(<PipBoyCard padding="lg" data-testid="card">Large Padding</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('p-6');
    });

    it('應該正確渲染 xl padding', () => {
      render(<PipBoyCard padding="xl" data-testid="card">XL Padding</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('p-8');
    });
  });

  describe('Visual Effects', () => {
    it('應該顯示發光效果', () => {
      render(<PipBoyCard glowEffect data-testid="card">Glow Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('shadow-[0_0_20px_rgba(51,255,51,0.3)]');
      expect(card).toHaveClass('animate-pulse-glow');
    });

    it('應該顯示載入狀態', () => {
      render(<PipBoyCard isLoading data-testid="card">Loading Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('animate-pulse');
    });

    it('應該顯示 Vault-Tec 角落圖示', () => {
      const { container } = render(
        <PipBoyCard showCornerIcons data-testid="card">Corner Icons Card</PipBoyCard>
      );

      // 應該有 4 個角落裝飾 div
      const cornerIcons = container.querySelectorAll('.absolute');
      expect(cornerIcons).toHaveLength(4);
    });
  });

  describe('Interactive Behavior', () => {
    it('isClickable 應該使卡片可點擊', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PipBoyCard isClickable onClick={handleClick} data-testid="card">
          Clickable Card
        </PipBoyCard>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('isClickable 應該套用 interactive 變體', () => {
      render(<PipBoyCard isClickable data-testid="card">Clickable Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('cursor-pointer');
    });

    it('fullWidth 應該使卡片全寬', () => {
      render(<PipBoyCard fullWidth data-testid="card">Full Width Card</PipBoyCard>);
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('w-full');
    });
  });

  describe('Sub-components', () => {
    it('應該正確渲染 CardHeader', () => {
      render(
        <PipBoyCard>
          <PipBoyCardHeader data-testid="header">Header Content</PipBoyCardHeader>
        </PipBoyCard>
      );
      const header = screen.getByTestId('header');

      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('mb-4');
      expect(header).toHaveClass('border-b');
    });

    it('CardHeader 應該支援 bordered={false}', () => {
      render(
        <PipBoyCard>
          <PipBoyCardHeader bordered={false} data-testid="header">
            No Border Header
          </PipBoyCardHeader>
        </PipBoyCard>
      );
      const header = screen.getByTestId('header');

      expect(header).not.toHaveClass('border-b');
    });

    it('應該正確渲染 CardTitle', () => {
      render(
        <PipBoyCard>
          <PipBoyCardTitle data-testid="title">Card Title</PipBoyCardTitle>
        </PipBoyCard>
      );
      const title = screen.getByTestId('title');

      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('uppercase');
    });

    it('應該正確渲染 CardDescription', () => {
      render(
        <PipBoyCard>
          <PipBoyCardDescription data-testid="desc">Description</PipBoyCardDescription>
        </PipBoyCard>
      );
      const description = screen.getByTestId('desc');

      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm');
    });

    it('應該正確渲染 CardContent', () => {
      render(
        <PipBoyCard>
          <PipBoyCardContent data-testid="content">Content</PipBoyCardContent>
        </PipBoyCard>
      );
      const content = screen.getByTestId('content');

      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('text-sm');
    });

    it('應該正確渲染 CardFooter', () => {
      render(
        <PipBoyCard>
          <PipBoyCardFooter data-testid="footer">Footer Content</PipBoyCardFooter>
        </PipBoyCard>
      );
      const footer = screen.getByTestId('footer');

      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('mt-4');
      expect(footer).toHaveClass('border-t');
    });

    it('CardFooter 應該支援 bordered={false}', () => {
      render(
        <PipBoyCard>
          <PipBoyCardFooter bordered={false} data-testid="footer">
            No Border Footer
          </PipBoyCardFooter>
        </PipBoyCard>
      );
      const footer = screen.getByTestId('footer');

      expect(footer).not.toHaveClass('border-t');
    });
  });

  describe('Composition Example', () => {
    it('應該支援完整的子元件組合', () => {
      render(
        <PipBoyCard data-testid="card">
          <PipBoyCardHeader data-testid="header">
            <PipBoyCardTitle data-testid="title">塔羅卡片</PipBoyCardTitle>
            <PipBoyCardDescription data-testid="desc">
              愚者 - 新的開始
            </PipBoyCardDescription>
          </PipBoyCardHeader>
          <PipBoyCardContent data-testid="content">
            <p>卡片內容說明</p>
          </PipBoyCardContent>
          <PipBoyCardFooter data-testid="footer">
            <button>查看詳情</button>
          </PipBoyCardFooter>
        </PipBoyCard>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('title')).toHaveTextContent('塔羅卡片');
      expect(screen.getByTestId('desc')).toHaveTextContent('愚者 - 新的開始');
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('可點擊卡片應該支援鍵盤導航', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PipBoyCard isClickable onClick={handleClick} data-testid="card">
          Clickable Card
        </PipBoyCard>
      );
      const card = screen.getByTestId('card');

      card.focus();
      expect(card).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('應該支援自訂 className', () => {
      render(
        <PipBoyCard className="custom-class" data-testid="card">
          Custom Class Card
        </PipBoyCard>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('border-2'); // 應保留基礎樣式
    });
  });
});
