/**
 * AudioControls 組件測試
 * 需求 4.2, 4.5: 音量控制 UI 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioControls } from '../AudioControls';

// Mock AudioStore
const mockSetVolume = jest.fn();
const mockSetMute = jest.fn();

jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: () => ({
    volumes: { sfx: 0.7, music: 0.5, voice: 0.8 },
    muted: { sfx: false, music: false, voice: false },
    setVolume: mockSetVolume,
    setMute: mockSetMute,
  }),
}));

describe('AudioControls', () => {
  beforeEach(() => {
    mockSetVolume.mockClear();
    mockSetMute.mockClear();
  });

  it('應該渲染音量滑桿', () => {
    render(<AudioControls type="sfx" label="音效" />);

    const slider = screen.getByRole('slider', { name: /音效 volume/i });
    expect(slider).toBeInTheDocument();
  });

  it('應該顯示當前音量', () => {
    render(<AudioControls type="sfx" label="音效" />);

    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('應該在拖曳滑桿時呼叫 setVolume', () => {
    render(<AudioControls type="sfx" label="音效" />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.5' } });

    expect(mockSetVolume).toHaveBeenCalledWith('sfx', 0.5);
  });

  it('應該在點擊靜音按鈕時切換靜音', () => {
    render(<AudioControls type="sfx" label="音效" />);

    const muteButton = screen.getByRole('button', { name: /Mute 音效/i });
    fireEvent.click(muteButton);

    expect(mockSetMute).toHaveBeenCalledWith('sfx', true);
  });

  it('應該在靜音時停用滑桿', () => {
    // Override mock for this test
    jest.spyOn(require('@/lib/audio/audioStore'), 'useAudioStore').mockReturnValue({
      volumes: { sfx: 0.7, music: 0.5, voice: 0.8 },
      muted: { sfx: true, music: false, voice: false },
      setVolume: mockSetVolume,
      setMute: mockSetMute,
    });

    render(<AudioControls type="sfx" label="音效" />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });
});
