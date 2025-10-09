/**
 * useTextToSpeech Hook 測試
 * 需求 2.1, 2.2, 2.3: TTS Hook 測試
 */

import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from '../useTextToSpeech';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';

// Mock SpeechEngine
jest.mock('@/lib/audio/SpeechEngine');

// Mock AudioStore
jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    volumes: { sfx: 0.7, music: 0.5, voice: 0.8 },
    muted: { sfx: false, music: false, voice: false },
    selectedVoice: 'pip_boy',
    setSpeechProgress: jest.fn(),
    isAudioEnabled: true,
  }),
}));

describe('useTextToSpeech', () => {
  let mockSpeak: jest.Mock;
  let mockPause: jest.Mock;
  let mockResume: jest.Mock;
  let mockStop: jest.Mock;
  let mockIsSupported: jest.Mock;

  beforeEach(() => {
    mockSpeak = jest.fn();
    mockPause = jest.fn();
    mockResume = jest.fn();
    mockStop = jest.fn();
    mockIsSupported = jest.fn().mockReturnValue(true);

    (SpeechEngine.getInstance as jest.Mock).mockReturnValue({
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      stop: mockStop,
      isSupported: mockIsSupported,
    });
  });

  it('應該初始化為未播放狀態', () => {
    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('應該在呼叫 speak 時播放語音', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    expect(mockSpeak).toHaveBeenCalledWith('測試文字', expect.any(Object));
  });

  it('應該使用選定的角色語音', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    expect(mockSpeak).toHaveBeenCalledWith(
      '測試文字',
      expect.objectContaining({ voice: 'pip_boy' })
    );
  });

  it('應該使用正確的音量', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    expect(mockSpeak).toHaveBeenCalledWith(
      '測試文字',
      expect.objectContaining({ volume: 0.8 })
    );
  });

  it('應該在靜音時不播放', () => {
    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      volumes: { sfx: 0.7, music: 0.5, voice: 0.8 },
      muted: { sfx: false, music: false, voice: true },
      selectedVoice: 'pip_boy',
      setSpeechProgress: jest.fn(),
      isAudioEnabled: true,
    });

    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('應該能夠暫停播放', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    act(() => {
      result.current.pause();
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('應該能夠繼續播放', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.resume();
    });

    expect(mockResume).toHaveBeenCalled();
  });

  it('應該能夠停止播放', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    act(() => {
      result.current.stop();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('應該在不支援時返回 isSupported: false', () => {
    mockIsSupported.mockReturnValue(false);

    const { result } = renderHook(() => useTextToSpeech());

    expect(result.current.isSupported).toBe(false);
  });

  it('應該更新語音進度', () => {
    const mockSetSpeechProgress = jest.fn();

    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      volumes: { voice: 0.8 },
      muted: { voice: false },
      selectedVoice: 'pip_boy',
      setSpeechProgress: mockSetSpeechProgress,
      isAudioEnabled: true,
    });

    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('測試文字');
    });

    // Simulate progress callback
    const speakCall = mockSpeak.mock.calls[0];
    const options = speakCall[1];
    if (options.onProgress) {
      options.onProgress(5);
    }

    expect(mockSetSpeechProgress).toHaveBeenCalledWith(5);
  });
});
