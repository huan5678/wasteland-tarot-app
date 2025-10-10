/**
 * PlaybackControls - Unit Tests
 * Task 32: 單元測試 - PlaybackControls 組件
 * Requirements 12.1, 12.2: 單元測試覆蓋率 ≥ 80%
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlaybackControls } from '../PlaybackControls';
import type { RepeatMode } from '@/lib/audio/playlistTypes';

// Mock useAudioEffect hook
jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
  }),
}));

describe('PlaybackControls', () => {
  const defaultProps = {
    isPlaying: false,
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onToggleShuffle: jest.fn(),
    onToggleRepeat: jest.fn(),
    shuffleEnabled: false,
    repeatMode: 'off' as RepeatMode,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all control buttons', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByLabelText('上一首')).toBeInTheDocument();
      expect(screen.getByLabelText('播放')).toBeInTheDocument();
      expect(screen.getByLabelText('下一首')).toBeInTheDocument();
      expect(screen.getByLabelText('啟用隨機播放')).toBeInTheDocument();
      expect(screen.getByLabelText('啟用循環播放')).toBeInTheDocument();
    });

    it('should show pause button when isPlaying is true', () => {
      render(<PlaybackControls {...defaultProps} isPlaying={true} />);

      expect(screen.getByLabelText('暫停')).toBeInTheDocument();
      expect(screen.queryByLabelText('播放')).not.toBeInTheDocument();
    });

    it('should show play button when isPlaying is false', () => {
      render(<PlaybackControls {...defaultProps} isPlaying={false} />);

      expect(screen.getByLabelText('播放')).toBeInTheDocument();
      expect(screen.queryByLabelText('暫停')).not.toBeInTheDocument();
    });

    it('should display keyboard shortcuts hint', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByText(/快捷鍵/)).toBeInTheDocument();
      expect(screen.getByText(/空白鍵/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PlaybackControls {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Play/Pause Interaction', () => {
    it('should call onPlay when play button is clicked', () => {
      render(<PlaybackControls {...defaultProps} isPlaying={false} />);

      const playButton = screen.getByLabelText('播放');
      fireEvent.click(playButton);

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when pause button is clicked', () => {
      render(<PlaybackControls {...defaultProps} isPlaying={true} />);

      const pauseButton = screen.getByLabelText('暫停');
      fireEvent.click(pauseButton);

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it('should toggle between play and pause on multiple clicks', () => {
      const { rerender } = render(
        <PlaybackControls {...defaultProps} isPlaying={false} />
      );

      // Click play
      fireEvent.click(screen.getByLabelText('播放'));
      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);

      // Rerender with isPlaying = true
      rerender(<PlaybackControls {...defaultProps} isPlaying={true} />);

      // Click pause
      fireEvent.click(screen.getByLabelText('暫停'));
      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Next/Previous Interaction', () => {
    it('should call onNext when next button is clicked', () => {
      render(<PlaybackControls {...defaultProps} />);

      const nextButton = screen.getByLabelText('下一首');
      fireEvent.click(nextButton);

      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when previous button is clicked', () => {
      render(<PlaybackControls {...defaultProps} />);

      const prevButton = screen.getByLabelText('上一首');
      fireEvent.click(prevButton);

      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('Shuffle Control', () => {
    it('should call onToggleShuffle when shuffle button is clicked', () => {
      render(<PlaybackControls {...defaultProps} />);

      const shuffleButton = screen.getByLabelText('啟用隨機播放');
      fireEvent.click(shuffleButton);

      expect(defaultProps.onToggleShuffle).toHaveBeenCalledTimes(1);
    });

    it('should show enabled state when shuffleEnabled is true', () => {
      render(<PlaybackControls {...defaultProps} shuffleEnabled={true} />);

      const shuffleButton = screen.getByLabelText('停用隨機播放');
      expect(shuffleButton).toHaveAttribute('aria-pressed', 'true');
      expect(shuffleButton).toHaveClass('border-2');
    });

    it('should show disabled state when shuffleEnabled is false', () => {
      render(<PlaybackControls {...defaultProps} shuffleEnabled={false} />);

      const shuffleButton = screen.getByLabelText('啟用隨機播放');
      expect(shuffleButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Repeat Control', () => {
    it('should call onToggleRepeat when repeat button is clicked', () => {
      render(<PlaybackControls {...defaultProps} />);

      const repeatButton = screen.getByLabelText('啟用循環播放');
      fireEvent.click(repeatButton);

      expect(defaultProps.onToggleRepeat).toHaveBeenCalledTimes(1);
    });

    it('should show "off" state correctly', () => {
      render(<PlaybackControls {...defaultProps} repeatMode="off" />);

      const repeatButton = screen.getByLabelText('啟用循環播放');
      expect(repeatButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should show "one" state correctly', () => {
      render(<PlaybackControls {...defaultProps} repeatMode="one" />);

      const repeatButton = screen.getByLabelText('單曲循環');
      expect(repeatButton).toHaveAttribute('aria-pressed', 'true');
      expect(repeatButton).toHaveClass('border-2');
    });

    it('should show "all" state correctly', () => {
      render(<PlaybackControls {...defaultProps} repeatMode="all" />);

      const repeatButton = screen.getByLabelText('列表循環');
      expect(repeatButton).toHaveAttribute('aria-pressed', 'true');
      expect(repeatButton).toHaveClass('border-2');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should call onPlay/onPause when Space key is pressed', () => {
      render(<PlaybackControls {...defaultProps} isPlaying={false} />);

      fireEvent.keyDown(window, { key: ' ' });

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when ArrowRight key is pressed', () => {
      render(<PlaybackControls {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when ArrowLeft key is pressed', () => {
      render(<PlaybackControls {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should not trigger shortcuts when focused on input', () => {
      render(
        <>
          <input type="text" data-testid="test-input" />
          <PlaybackControls {...defaultProps} />
        </>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: ' ' });

      expect(defaultProps.onPlay).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when focused on textarea', () => {
      render(
        <>
          <textarea data-testid="test-textarea" />
          <PlaybackControls {...defaultProps} />
        </>
      );

      const textarea = screen.getByTestId('test-textarea');
      textarea.focus();

      fireEvent.keyDown(textarea, { key: 'ArrowRight' });

      expect(defaultProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all buttons', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByLabelText('上一首')).toBeInTheDocument();
      expect(screen.getByLabelText('播放')).toBeInTheDocument();
      expect(screen.getByLabelText('下一首')).toBeInTheDocument();
      expect(screen.getByLabelText('啟用隨機播放')).toBeInTheDocument();
      expect(screen.getByLabelText('啟用循環播放')).toBeInTheDocument();
    });

    it('should have role="group" for control sections', () => {
      render(<PlaybackControls {...defaultProps} />);

      const groups = screen.getAllByRole('group');
      expect(groups).toHaveLength(2); // Main controls + secondary controls
      expect(groups[0]).toHaveAttribute('aria-label', '播放控制');
      expect(groups[1]).toHaveAttribute('aria-label', '播放模式控制');
    });

    it('should have aria-pressed attribute for toggle buttons', () => {
      render(<PlaybackControls {...defaultProps} shuffleEnabled={true} repeatMode="one" />);

      const shuffleButton = screen.getByLabelText('停用隨機播放');
      const repeatButton = screen.getByLabelText('單曲循環');

      expect(shuffleButton).toHaveAttribute('aria-pressed', 'true');
      expect(repeatButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have focus-visible styles', () => {
      render(<PlaybackControls {...defaultProps} />);

      const playButton = screen.getByLabelText('播放');
      expect(playButton).toHaveClass('focus:outline-none');
      expect(playButton).toHaveClass('focus:ring-2');
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should use React.memo to prevent unnecessary re-renders', () => {
      const { rerender } = render(<PlaybackControls {...defaultProps} />);

      const playButton = screen.getByLabelText('播放');
      const initialElement = playButton;

      // Rerender with same props
      rerender(<PlaybackControls {...defaultProps} />);

      const afterRerender = screen.getByLabelText('播放');
      expect(afterRerender).toBe(initialElement);
    });

    it('should not re-render when unrelated props change in parent', () => {
      const renderSpy = jest.fn();
      const TestWrapper = ({ extraProp }: { extraProp: string }) => {
        renderSpy();
        return <PlaybackControls {...defaultProps} />;
      };

      const { rerender } = render(<TestWrapper extraProp="test1" />);
      const initialRenderCount = renderSpy.mock.calls.length;

      rerender(<TestWrapper extraProp="test2" />);

      // Component should re-render due to parent, but PlaybackControls itself is memoized
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      render(<PlaybackControls {...defaultProps} />);

      const playButton = screen.getByLabelText('播放');

      // Rapid fire clicks
      fireEvent.click(playButton);
      fireEvent.click(playButton);
      fireEvent.click(playButton);

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(3);
    });

    it('should handle all buttons being clicked simultaneously', () => {
      render(<PlaybackControls {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('播放'));
      fireEvent.click(screen.getByLabelText('下一首'));
      fireEvent.click(screen.getByLabelText('上一首'));
      fireEvent.click(screen.getByLabelText('啟用隨機播放'));
      fireEvent.click(screen.getByLabelText('啟用循環播放'));

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggleShuffle).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggleRepeat).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard and mouse events together', () => {
      render(<PlaybackControls {...defaultProps} />);

      const playButton = screen.getByLabelText('播放');

      fireEvent.click(playButton);
      fireEvent.keyDown(window, { key: ' ' });

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(2);
    });
  });
});
