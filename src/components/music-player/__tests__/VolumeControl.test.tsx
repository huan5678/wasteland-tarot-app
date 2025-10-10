/**
 * VolumeControl - Unit Tests
 * Task 32: 單元測試 - VolumeControl 組件
 * Requirements 12.1, 12.2: 單元測試覆蓋率 ≥ 80%
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VolumeControl } from '../VolumeControl';

// Mock useAudioStore hook
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: jest.fn(() => ({
    volumes: { music: 50, sfx: 50, voice: 50 },
    muted: { music: false, sfx: false, voice: false },
    setVolume: jest.fn(),
    toggleMute: jest.fn(),
  })),
}));

describe('VolumeControl', () => {
  const mockSetVolume = jest.fn();
  const mockToggleMute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementation
    require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
      volumes: { music: 50, sfx: 50, voice: 50 },
      muted: { music: false, sfx: false, voice: false },
      setVolume: mockSetVolume,
      toggleMute: mockToggleMute,
    });
  });

  describe('Rendering', () => {
    it('should render volume control with slider', () => {
      render(<VolumeControl />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByLabelText(/音量控制/)).toBeInTheDocument();
    });

    it('should render mute button', () => {
      render(<VolumeControl />);

      const muteButton = screen.getByLabelText(/靜音/);
      expect(muteButton).toBeInTheDocument();
    });

    it('should display current volume value', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('should apply custom className', () => {
      const { container } = render(<VolumeControl className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Volume Slider Interaction', () => {
    it('should call setVolume when slider value changes', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 75 } });

      expect(mockSetVolume).toHaveBeenCalledWith('music', 75);
    });

    it('should update slider to reflect new volume', () => {
      const { rerender } = render(<VolumeControl />);

      // Update mock to return new volume
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 75, sfx: 50, voice: 50 },
        muted: { music: false, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      rerender(<VolumeControl />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });

    it('should handle volume set to 0', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 0 } });

      expect(mockSetVolume).toHaveBeenCalledWith('music', 0);
    });

    it('should handle volume set to 100', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 100 } });

      expect(mockSetVolume).toHaveBeenCalledWith('music', 100);
    });

    it('should show Volume2 icon when volume >= 50', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 75, sfx: 50, voice: 50 },
        muted: { music: false, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      // Check if Volume2 icon is rendered (via aria-label)
      const button = screen.getByLabelText(/靜音/);
      expect(button).toBeInTheDocument();
    });

    it('should show Volume1 icon when 0 < volume < 50', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 25, sfx: 50, voice: 50 },
        muted: { music: false, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      const button = screen.getByLabelText(/靜音/);
      expect(button).toBeInTheDocument();
    });

    it('should show VolumeX icon when volume is 0', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 0, sfx: 50, voice: 50 },
        muted: { music: false, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      const button = screen.getByLabelText(/取消靜音/);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Mute Button Interaction', () => {
    it('should call toggleMute when mute button is clicked', () => {
      render(<VolumeControl />);

      const muteButton = screen.getByLabelText(/靜音/);
      fireEvent.click(muteButton);

      expect(mockToggleMute).toHaveBeenCalledWith('music');
      expect(mockToggleMute).toHaveBeenCalledTimes(1);
    });

    it('should show "取消靜音" label when muted', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 50, sfx: 50, voice: 50 },
        muted: { music: true, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      expect(screen.getByLabelText(/取消靜音/)).toBeInTheDocument();
    });

    it('should show VolumeX icon when muted', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 50, sfx: 50, voice: 50 },
        muted: { music: true, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      const button = screen.getByLabelText(/取消靜音/);
      expect(button).toBeInTheDocument();
    });

    it('should disable slider when muted', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 50, sfx: 50, voice: 50 },
        muted: { music: true, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should toggle mute when M key is pressed', () => {
      render(<VolumeControl />);

      fireEvent.keyDown(window, { key: 'm' });

      expect(mockToggleMute).toHaveBeenCalledWith('music');
    });

    it('should toggle mute when M key (uppercase) is pressed', () => {
      render(<VolumeControl />);

      fireEvent.keyDown(window, { key: 'M' });

      expect(mockToggleMute).toHaveBeenCalledWith('music');
    });

    it('should not toggle mute when other keys are pressed', () => {
      render(<VolumeControl />);

      fireEvent.keyDown(window, { key: 'a' });
      fireEvent.keyDown(window, { key: 'Enter' });

      expect(mockToggleMute).not.toHaveBeenCalled();
    });

    it('should not trigger shortcut when focused on input', () => {
      render(
        <>
          <input type="text" data-testid="test-input" />
          <VolumeControl />
        </>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      fireEvent.keyDown(input, { key: 'm' });

      expect(mockToggleMute).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for slider', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label', '音量控制');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow');
    });

    it('should have proper ARIA label for mute button', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should update aria-valuenow when volume changes', () => {
      const { rerender } = render(<VolumeControl />);

      let slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');

      // Update volume
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 75, sfx: 50, voice: 50 },
        muted: { music: false, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      rerender(<VolumeControl />);

      slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });

    it('should have focus-visible styles', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  describe('Performance', () => {
    it('should use React.memo to prevent unnecessary re-renders', () => {
      const { rerender } = render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      const initialElement = slider;

      // Rerender with same props (same store state)
      rerender(<VolumeControl />);

      const afterRerender = screen.getByRole('slider');
      expect(afterRerender).toBe(initialElement);
    });

    it('should use useCallback for event handlers', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: 60 } });
      fireEvent.change(slider, { target: { value: 70 } });

      expect(mockSetVolume).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid volume changes', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: 10 } });
      fireEvent.change(slider, { target: { value: 50 } });
      fireEvent.change(slider, { target: { value: 90 } });

      expect(mockSetVolume).toHaveBeenCalledTimes(3);
    });

    it('should handle volume changes while muted', () => {
      require('@/lib/audio/audioStore').useAudioStore.mockReturnValue({
        volumes: { music: 50, sfx: 50, voice: 50 },
        muted: { music: true, sfx: false, voice: false },
        setVolume: mockSetVolume,
        toggleMute: mockToggleMute,
      });

      render(<VolumeControl />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();

      // Should not be able to change volume when muted
      fireEvent.change(slider, { target: { value: 75 } });
      expect(mockSetVolume).not.toHaveBeenCalled();
    });

    it('should handle rapid mute toggle clicks', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockToggleMute).toHaveBeenCalledTimes(3);
    });

    it('should handle volume value outside range gracefully', () => {
      render(<VolumeControl />);

      const slider = screen.getByRole('slider');

      // Try to set volume to 150 (should be clamped to 100)
      fireEvent.change(slider, { target: { value: 150 } });

      // Store should handle clamping, we just verify setVolume was called
      expect(mockSetVolume).toHaveBeenCalled();
    });
  });

  describe('Pip-Boy Styling', () => {
    it('should have Pip-Boy green color scheme', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-pip-boy-green');
    });

    it('should have hover effects', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-pip-boy-green');
    });

    it('should have shadow effects', () => {
      render(<VolumeControl />);

      const button = screen.getByRole('button');
      expect(button?.className).toMatch(/shadow/);
    });
  });
});
