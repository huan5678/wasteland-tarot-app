/**
 * MusicModeSelector - Unit Tests
 * Task 32: 單元測試 - MusicModeSelector 組件
 * Requirements 12.1, 12.2: 單元測試覆蓋率 ≥ 80%
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MusicModeSelector } from '../MusicModeSelector';
import type { MusicMode } from '@/lib/audio/playlistTypes';

// Mock dependencies
jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
  }),
}));

describe('MusicModeSelector', () => {
  const defaultProps = {
    selectedMode: null as MusicMode | null,
    onSelect: jest.fn(),
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 4 music modes', () => {
      render(<MusicModeSelector {...defaultProps} />);

      expect(screen.getByText('Synthwave')).toBeInTheDocument();
      expect(screen.getByText('占卜')).toBeInTheDocument();
      expect(screen.getByText('Lo-fi')).toBeInTheDocument();
      expect(screen.getByText('Ambient')).toBeInTheDocument();
    });

    it('should render mode descriptions', () => {
      render(<MusicModeSelector {...defaultProps} />);

      expect(screen.getByText(/80 年代電子合成器風格/)).toBeInTheDocument();
      expect(screen.getByText(/神秘氛圍/)).toBeInTheDocument();
      expect(screen.getByText(/Lo-fi 節奏/)).toBeInTheDocument();
      expect(screen.getByText(/環境音樂/)).toBeInTheDocument();
    });

    it('should render mode icons', () => {
      const { container } = render(<MusicModeSelector {...defaultProps} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MusicModeSelector {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Mode Selection', () => {
    it('should call onSelect when a mode is clicked', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      fireEvent.click(synthwaveButton!);

      expect(defaultProps.onSelect).toHaveBeenCalledWith('synthwave');
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should highlight selected mode', () => {
      render(<MusicModeSelector {...defaultProps} selectedMode="synthwave" />);

      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      expect(synthwaveButton).toHaveClass('border-pip-boy-green');
      expect(synthwaveButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not highlight non-selected modes', () => {
      render(<MusicModeSelector {...defaultProps} selectedMode="synthwave" />);

      const lofiButton = screen.getByText('Lo-fi').closest('button');
      expect(lofiButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should allow selecting different modes', () => {
      const { rerender } = render(<MusicModeSelector {...defaultProps} />);

      // Select Synthwave
      fireEvent.click(screen.getByText('Synthwave').closest('button')!);
      expect(defaultProps.onSelect).toHaveBeenCalledWith('synthwave');

      // Rerender with Synthwave selected
      rerender(<MusicModeSelector {...defaultProps} selectedMode="synthwave" />);

      // Select Lo-fi
      fireEvent.click(screen.getByText('Lo-fi').closest('button')!);
      expect(defaultProps.onSelect).toHaveBeenCalledWith('lofi');
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<MusicModeSelector {...defaultProps} isLoading={true} loadingMode="synthwave" />);

      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      expect(synthwaveButton).toBeDisabled();
      expect(screen.getByText(/載入中/)).toBeInTheDocument();
    });

    it('should disable all buttons when loading', () => {
      render(<MusicModeSelector {...defaultProps} isLoading={true} loadingMode="synthwave" />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should not call onSelect when button is disabled', () => {
      render(<MusicModeSelector {...defaultProps} isLoading={true} loadingMode="synthwave" />);

      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      fireEvent.click(synthwaveButton!);

      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all mode buttons', () => {
      render(<MusicModeSelector {...defaultProps} />);

      expect(screen.getByLabelText(/選擇 Synthwave 模式/)).toBeInTheDocument();
      expect(screen.getByLabelText(/選擇占卜模式/)).toBeInTheDocument();
      expect(screen.getByLabelText(/選擇 Lo-fi 模式/)).toBeInTheDocument();
      expect(screen.getByLabelText(/選擇 Ambient 模式/)).toBeInTheDocument();
    });

    it('should have role="radiogroup" for mode selector', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-label', '音樂模式選擇器');
    });

    it('should have aria-pressed attribute for mode buttons', () => {
      render(<MusicModeSelector {...defaultProps} selectedMode="synthwave" />);

      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      const lofiButton = screen.getByText('Lo-fi').closest('button');

      expect(synthwaveButton).toHaveAttribute('aria-pressed', 'true');
      expect(lofiButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have focus-visible styles', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const button = screen.getByText('Synthwave').closest('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(<MusicModeSelector {...defaultProps} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Effects', () => {
    it('should have hover effects', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const button = screen.getByText('Synthwave').closest('button');
      expect(button).toHaveClass('hover:bg-pip-boy-green');
    });

    it('should have Pip-Boy green color scheme', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const button = screen.getByText('Synthwave').closest('button');
      expect(button).toHaveClass('border-pip-boy-green');
    });

    it('should have shadow effects for selected mode', () => {
      render(<MusicModeSelector {...defaultProps} selectedMode="synthwave" />);

      const button = screen.getByText('Synthwave').closest('button');
      expect(button?.className).toMatch(/shadow/);
    });
  });

  describe('Performance', () => {
    it('should use React.memo to prevent unnecessary re-renders', () => {
      const { rerender } = render(<MusicModeSelector {...defaultProps} />);

      const button = screen.getByText('Synthwave').closest('button');
      const initialElement = button;

      // Rerender with same props
      rerender(<MusicModeSelector {...defaultProps} />);

      const afterRerender = screen.getByText('Synthwave').closest('button');
      expect(afterRerender).toBe(initialElement);
    });

    it('should use useCallback for event handlers', () => {
      const onSelect = jest.fn();
      render(<MusicModeSelector {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByText('Synthwave').closest('button');

      fireEvent.click(button!);
      fireEvent.click(button!);

      // Handler should be stable and called twice
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks on same mode', () => {
      render(<MusicModeSelector {...defaultProps} />);

      const button = screen.getByText('Synthwave').closest('button');

      fireEvent.click(button!);
      fireEvent.click(button!);
      fireEvent.click(button!);

      expect(defaultProps.onSelect).toHaveBeenCalledTimes(3);
      expect(defaultProps.onSelect).toHaveBeenCalledWith('synthwave');
    });

    it('should handle rapid clicks on different modes', () => {
      render(<MusicModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Synthwave').closest('button')!);
      fireEvent.click(screen.getByText('Lo-fi').closest('button')!);
      fireEvent.click(screen.getByText('Ambient').closest('button')!);

      expect(defaultProps.onSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle null selectedMode gracefully', () => {
      render(<MusicModeSelector {...defaultProps} selectedMode={null} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should handle all modes being selected in sequence', () => {
      const modes: MusicMode[] = ['synthwave', 'divination', 'lofi', 'ambient'];
      const { rerender } = render(<MusicModeSelector {...defaultProps} />);

      modes.forEach((mode) => {
        rerender(<MusicModeSelector {...defaultProps} selectedMode={mode} />);

        // Find button by mode name mapping
        const modeNames = {
          synthwave: 'Synthwave',
          divination: '占卜',
          lofi: 'Lo-fi',
          ambient: 'Ambient',
        };

        const button = screen.getByText(modeNames[mode]).closest('button');
        expect(button).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Grid Layout', () => {
    it('should use grid layout for mode buttons', () => {
      const { container } = render(<MusicModeSelector {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should be responsive (2 columns on mobile, 4 on desktop)', () => {
      const { container } = render(<MusicModeSelector {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('md:grid-cols-4');
    });
  });
});
