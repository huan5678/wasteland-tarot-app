/**
 * useAudioInitialization Hook 測試
 * 需求 6.1, 6.2: 音訊系統初始化測試
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAudioInitialization } from '../useAudioInitialization';
import { AudioEngine } from '@/lib/audio/AudioEngine';

// Mock AudioEngine
jest.mock('@/lib/audio/AudioEngine');

// Mock fetch for manifest
global.fetch = jest.fn();

// Mock AudioStore
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    setAudioEnabled: jest.fn(),
    isAudioEnabled: false,
  }),
}));

describe('useAudioInitialization', () => {
  let mockInitialize: jest.Mock;
  let mockPreloadSounds: jest.Mock;

  beforeEach(() => {
    mockInitialize = jest.fn().mockResolvedValue(undefined);
    mockPreloadSounds = jest.fn().mockResolvedValue(undefined);

    (AudioEngine.getInstance as jest.Mock).mockReturnValue({
      initialize: mockInitialize,
      preloadSounds: mockPreloadSounds,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        version: '1.0.0',
        sounds: [
          { id: 'button-click', type: 'sfx', url: '/sounds/sfx/button-click.mp3', priority: 'critical' },
          { id: 'card-flip', type: 'sfx', url: '/sounds/sfx/card-flip.mp3', priority: 'critical' },
        ],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('應該初始化音訊引擎', async () => {
    renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
  });

  it('應該載入音效 manifest', async () => {
    renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/sounds/manifest.json');
    });
  });

  it('應該預載 critical 優先級的音效', async () => {
    renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(mockPreloadSounds).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'button-click', priority: 'critical' }),
          expect.objectContaining({ id: 'card-flip', priority: 'critical' }),
        ])
      );
    });
  });

  it('應該在初始化完成後設定 isReady 為 true', async () => {
    const { result } = renderHook(() => useAudioInitialization());

    expect(result.current.isReady).toBe(false);

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });

  it('應該在初始化失敗時設定錯誤', async () => {
    mockInitialize.mockRejectedValue(new Error('Init failed'));

    const { result } = renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Init failed');
    });
  });

  it('應該在載入 manifest 失敗時設定錯誤', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('應該只初始化一次', async () => {
    const { rerender } = renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    rerender();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });
  });

  it('應該在使用者互動後啟用音訊', async () => {
    const mockSetAudioEnabled = jest.fn();

    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      setAudioEnabled: mockSetAudioEnabled,
      isAudioEnabled: false,
    });

    const { result } = renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // Simulate user interaction
    result.current.enableAudio();

    expect(mockSetAudioEnabled).toHaveBeenCalledWith(true);
  });

  it('應該處理 iOS Safari 音訊解鎖', async () => {
    // Mock iOS Safari
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    const { result } = renderHook(() => useAudioInitialization());

    await waitFor(() => {
      expect(result.current.needsUserInteraction).toBe(true);
    });
  });
});
