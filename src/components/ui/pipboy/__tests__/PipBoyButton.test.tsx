/**
 * PipBoyButton Component Tests
 * 測試 PipBoyButton 元件使用 CVA 變體系統
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PipBoyButton, type ButtonProps } from '../PipBoyButton';

// Mock useAudioEffect hook
jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
    stopSound: jest.fn(),
    stopAll: jest.fn(),
  }),
}));

describe('PipBoyButton', () => {
  describe('CVA Variants System', () => {
    it('應該正確渲染 default 變體', () => {
      render(<PipBoyButton variant="default">Default Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /default button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-pip-boy-green');
      expect(button).toHaveClass('text-black');
    });

    it('應該正確渲染 outline 變體', () => {
      render(<PipBoyButton variant="outline">Outline Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /outline button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-pip-boy-green-bright');
    });

    it('應該在未指定變體時使用 default', () => {
      render(<PipBoyButton>Default Variant</PipBoyButton>);
      const button = screen.getByRole('button', { name: /default variant/i });

      expect(button).toHaveClass('bg-pip-boy-green');
    });
  });

  describe('Size Variants', () => {
    it('應該正確渲染 sm 尺寸', () => {
      render(<PipBoyButton size="sm">Small Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /small button/i });

      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-xs');
    });

    it('應該正確渲染 default 尺寸', () => {
      render(<PipBoyButton size="default">Default Size</PipBoyButton>);
      const button = screen.getByRole('button', { name: /default size/i });

      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-sm');
    });

    it('應該正確渲染 lg 尺寸', () => {
      render(<PipBoyButton size="lg">Large Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /large button/i });

      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('Disabled State', () => {
    it('應該正確渲染 disabled 狀態', () => {
      render(<PipBoyButton disabled>Disabled Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /disabled button/i });

      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled 狀態下不應該觸發點擊事件', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<PipBoyButton disabled onClick={handleClick}>Disabled</PipBoyButton>);
      const button = screen.getByRole('button', { name: /disabled/i });

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('應該接受合法的 variant 值', () => {
      const validVariants: ButtonProps['variant'][] = ['default', 'outline'];

      validVariants.forEach(variant => {
        const { unmount } = render(<PipBoyButton variant={variant}>Button</PipBoyButton>);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });

    it('應該接受合法的 size 值', () => {
      const validSizes: ButtonProps['size'][] = ['sm', 'default', 'lg'];

      validSizes.forEach(size => {
        const { unmount } = render(<PipBoyButton size={size}>Button</PipBoyButton>);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('應該支援 ARIA 屬性', () => {
      render(
        <PipBoyButton aria-label="Test Label" aria-describedby="test-desc">
          Button
        </PipBoyButton>
      );
      const button = screen.getByRole('button', { name: /test label/i });

      expect(button).toHaveAttribute('aria-label', 'Test Label');
      expect(button).toHaveAttribute('aria-describedby', 'test-desc');
    });

    it('應該支援鍵盤互動', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<PipBoyButton onClick={handleClick}>Keyboard Button</PipBoyButton>);
      const button = screen.getByRole('button', { name: /keyboard button/i });

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Custom Props', () => {
    it('應該支援自訂 className', () => {
      render(<PipBoyButton className="custom-class">Custom Class</PipBoyButton>);
      const button = screen.getByRole('button', { name: /custom class/i });

      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-pip-boy-green'); // 應保留基礎樣式
    });

    it('應該支援 HTML button 屬性', () => {
      render(
        <PipBoyButton type="submit" name="test-button" value="test-value">
          Submit
        </PipBoyButton>
      );
      const button = screen.getByRole('button', { name: /submit/i });

      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'test-button');
      expect(button).toHaveAttribute('value', 'test-value');
    });
  });

  describe('Backward Compatibility', () => {
    it('default 變體應該對應舊的 primary 功能', () => {
      render(<PipBoyButton variant="default">Default</PipBoyButton>);
      const button = screen.getByRole('button', { name: /default/i });

      // 實心背景，綠色背景黑色文字
      expect(button).toHaveClass('bg-pip-boy-green');
      expect(button).toHaveClass('text-black');
    });

    it('outline 變體應該對應舊的 secondary 功能', () => {
      render(<PipBoyButton variant="outline">Outline</PipBoyButton>);
      const button = screen.getByRole('button', { name: /outline/i });

      // 透明背景，綠色文字
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-pip-boy-green-bright');
    });
  });
});
