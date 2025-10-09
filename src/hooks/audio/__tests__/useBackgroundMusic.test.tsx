/**
 * useBackgroundMusic Hook 測試
 * 需求 3.1, 3.3: 背景音樂 Hook 測試
 */

import { renderHook } from '@testing-library/react';
import { useBackgroundMusic } from '../useBackgroundMusic';
import { MusicManager } from '@/lib/audio/MusicManager';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock MusicManager
jest.mock('@/lib/audio/MusicManager');

// Mock AudioStore
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    volumes: { music: 0.5 },
    muted: { music: false },
    isAudioEnabled: true,
  }),
}));

describe('useBackgroundMusic', () => {
  let mockSwitchScene: jest.Mock;
  let mockStop: jest.Mock;
  let mockSetVolume: jest.Mock;

  beforeEach(() => {
    mockSwitchScene = jest.fn();
    mockStop = jest.fn();
    mockSetVolume = jest.fn();

    (MusicManager as jest.Mock).mockImplementation(() => ({
      switchScene: mockSwitchScene,
      stop: mockStop,
      setVolume: mockSetVolume,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('應該在首頁載入時播放 home 場景音樂', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    renderHook(() => useBackgroundMusic());

    expect(mockSwitchScene).toHaveBeenCalledWith('/');
  });

  it('應該在路由變更時切換場景音樂', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/reading');

    renderHook(() => useBackgroundMusic());

    expect(mockSwitchScene).toHaveBeenCalledWith('/reading');
  });

  it('應該在靜音時停止播放', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      volumes: { music: 0.5 },
      muted: { music: true },
      isAudioEnabled: true,
    });

    renderHook(() => useBackgroundMusic());

    expect(mockStop).toHaveBeenCalled();
  });

  it('應該在音訊停用時停止播放', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      volumes: { music: 0.5 },
      muted: { music: false },
      isAudioEnabled: false,
    });

    renderHook(() => useBackgroundMusic());

    expect(mockStop).toHaveBeenCalled();
  });

  it('應該在音量變更時更新 MusicManager', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    renderHook(() => useBackgroundMusic());

    expect(mockSetVolume).toHaveBeenCalledWith(0.5);
  });

  it('應該在不同場景間切換', () => {
    const { usePathname } = require('next/navigation');

    usePathname.mockReturnValue('/');
    const { rerender } = renderHook(() => useBackgroundMusic());

    expect(mockSwitchScene).toHaveBeenCalledWith('/');

    usePathname.mockReturnValue('/reading');
    rerender();

    expect(mockSwitchScene).toHaveBeenCalledWith('/reading');
  });

  it('應該在組件卸載時停止音樂', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');

    const { unmount } = renderHook(() => useBackgroundMusic());

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
