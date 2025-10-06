/**
 * SpeechControls 組件測試
 * 需求 2.1, 2.4, 2.5, 2.6: TTS 控制組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpeechControls } from '../SpeechControls';

// Mock useTextToSpeech
const mockSpeak = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockStop = jest.fn();

jest.mock('@/hooks/audio/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: mockSpeak,
    pause: mockPause,
    resume: mockResume,
    stop: mockStop,
    isSpeaking: false,
    isPaused: false,
    isSupported: true,
  }),
}));

describe('SpeechControls', () => {
  beforeEach(() => {
    mockSpeak.mockClear();
    mockPause.mockClear();
    mockResume.mockClear();
    mockStop.mockClear();
  });

  it('應該在不支援時顯示錯誤訊息', () => {
    jest.spyOn(require('@/hooks/audio/useTextToSpeech'), 'useTextToSpeech').mockReturnValue({
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      stop: mockStop,
      isSpeaking: false,
      isPaused: false,
      isSupported: false,
    });

    render(<SpeechControls text="測試" />);

    expect(screen.getByText(/不支援語音播放功能/i)).toBeInTheDocument();
  });

  it('應該顯示播放按鈕', () => {
    render(<SpeechControls text="測試文字" />);

    const playButton = screen.getByRole('button', { name: /播放語音/i });
    expect(playButton).toBeInTheDocument();
  });

  it('應該在點擊播放時呼叫 speak', () => {
    render(<SpeechControls text="測試文字" />);

    const playButton = screen.getByRole('button', { name: /播放語音/i });
    fireEvent.click(playButton);

    expect(mockSpeak).toHaveBeenCalledWith('測試文字');
  });

  it('應該在播放時顯示暫停和停止按鈕', () => {
    jest.spyOn(require('@/hooks/audio/useTextToSpeech'), 'useTextToSpeech').mockReturnValue({
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      stop: mockStop,
      isSpeaking: true,
      isPaused: false,
      isSupported: true,
    });

    render(<SpeechControls text="測試" />);

    expect(screen.getByRole('button', { name: /暫停播放/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /停止播放/i })).toBeInTheDocument();
  });

  it('應該在暫停時顯示繼續按鈕', () => {
    jest.spyOn(require('@/hooks/audio/useTextToSpeech'), 'useTextToSpeech').mockReturnValue({
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      stop: mockStop,
      isSpeaking: true,
      isPaused: true,
      isSupported: true,
    });

    render(<SpeechControls text="測試" />);

    expect(screen.getByRole('button', { name: /繼續播放/i })).toBeInTheDocument();
  });

  it('應該在點擊停止時呼叫 stop', () => {
    jest.spyOn(require('@/hooks/audio/useTextToSpeech'), 'useTextToSpeech').mockReturnValue({
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      stop: mockStop,
      isSpeaking: true,
      isPaused: false,
      isSupported: true,
    });

    render(<SpeechControls text="測試" />);

    const stopButton = screen.getByRole('button', { name: /停止播放/i });
    fireEvent.click(stopButton);

    expect(mockStop).toHaveBeenCalled();
  });
});
