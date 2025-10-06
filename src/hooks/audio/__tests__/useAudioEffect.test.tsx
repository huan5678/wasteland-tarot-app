/**
 * useAudioEffect Hook 測試
 * 需求 1.1: 音效播放 Hook 測試
 */

import { renderHook, act } from '@testing-library/react';
import { useAudioEffect } from '../useAudioEffect';
import { AudioEngine } from '@/lib/audio/AudioEngine';

// Mock AudioEngine
jest.mock('@/lib/audio/AudioEngine');

// Mock AudioStore
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    volumes: { sfx: 0.7, music: 0.5, voice: 0.8 },
    muted: { sfx: false, music: false, voice: false },
    isAudioEnabled: true,
  }),
}));

describe('useAudioEffect', () => {
  let mockPlay: jest.Mock;

  beforeEach(() => {
    mockPlay = jest.fn();
    (AudioEngine.getInstance as jest.Mock).mockReturnValue({
      play: mockPlay,
      stop: jest.fn(),
      stopAll: jest.fn(),
    });
  });

  it('應該播放音效', () => {
    const { result } = renderHook(() => useAudioEffect());

    act(() => {
      result.current.playSound('button-click');
    });

    expect(mockPlay).toHaveBeenCalledWith('button-click', {
      volume: 0.7,
    });
  });

  it('應該使用自訂音量', () => {
    const { result } = renderHook(() => useAudioEffect());

    act(() => {
      result.current.playSound('button-click', { volume: 0.5 });
    });

    expect(mockPlay).toHaveBeenCalledWith('button-click', {
      volume: 0.5,
    });
  });
});
