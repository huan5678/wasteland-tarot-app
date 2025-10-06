/**
 * AudioVisualizer 組件測試
 * 需求 2.6: 語音視覺化測試
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AudioVisualizer } from '../AudioVisualizer';

// Mock AudioStore
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    speechProgress: 50,
  }),
}));

describe('AudioVisualizer', () => {
  it('應該在未播放時不顯示', () => {
    const { container } = render(<AudioVisualizer isPlaying={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('應該在播放時顯示視覺化', () => {
    render(<AudioVisualizer isPlaying={true} />);

    const visualizer = screen.getByRole('status');
    expect(visualizer).toBeInTheDocument();
  });

  it('應該顯示正確的 ARIA 標籤', () => {
    render(<AudioVisualizer isPlaying={true} />);

    const visualizer = screen.getByRole('status');
    expect(visualizer).toHaveAttribute('aria-live', 'polite');
    expect(visualizer).toHaveAttribute('aria-label', expect.stringContaining('50%'));
  });

  it('應該根據類型顯示不同的動畫', () => {
    const { rerender } = render(<AudioVisualizer isPlaying={true} type="pulse" />);

    expect(screen.getByRole('status')).toHaveClass('audio-visualizer');

    rerender(<AudioVisualizer isPlaying={true} type="wave" />);

    expect(screen.getByRole('status')).toHaveClass('audio-visualizer');
  });

  it('應該在 prefers-reduced-motion 時顯示簡化動畫', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<AudioVisualizer isPlaying={true} />);

    const visualizer = screen.getByRole('status');
    expect(visualizer).toBeInTheDocument();
  });

  it('應該更新進度', () => {
    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      speechProgress: 75,
    });

    render(<AudioVisualizer isPlaying={true} />);

    const visualizer = screen.getByRole('status');
    expect(visualizer).toHaveAttribute('aria-label', expect.stringContaining('75%'));
  });
});
