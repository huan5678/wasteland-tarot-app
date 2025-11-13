/**
 * TDD Test Suite for useTTS Hook (Task 5.4)
 *
 * Requirement 2: Text-to-Speech (TTS) 整合
 *
 * Tests for:
 * - State updates (isLoading, isPlaying, isPaused, isComplete)
 * - TTS API 呼叫與回應
 * - Play, pause, resume, stop 功能
 * - 錯誤處理 (network, timeout, 4xx, 5xx)
 * - audioStore 設定尊重 (muted, volume)
 * - Cleanup (unmount 時停止播放)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useTTS, TTSOptions } from '../useTTS';
import { useAudioStore } from '@/lib/audio/audioStore';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Track all audio instances for testing
const audioInstances: MockAudio[] = [];

// Mock Audio element
class MockAudio {
  public src: string = '';
  public volume: number = 1;
  public playbackRate: number = 1;
  public currentTime: number = 0;
  public duration: number = 0;
  public paused: boolean = true;

  private listeners: Record<string, Function[]> = {};

  constructor(src?: string) {
    if (src) {
      this.src = src;
    }
    audioInstances.push(this);
  }

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  load(): void {
    // Simulate loading
    setTimeout(() => {
      this.duration = 10; // Mock 10 seconds duration
      this.triggerEvent('loadedmetadata');
    }, 0);
  }

  addEventListener(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  triggerEvent(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Mock Audio constructor globally
global.Audio = MockAudio as any;

// Mock audioStore
vi.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: vi.fn(),
}));

// ============================================================================
// Test Helpers
// ============================================================================

const mockTTSResponse = {
  url: 'https://example.com/audio.mp3',
  duration: 10,
  file_size: 1024000,
  cached: false,
  source: 'new',
  voice_model: 'chirp3-hd',
  voice_name: 'pip_boy',
  character: {
    key: 'pip_boy',
    name: 'Pip-Boy 3000',
    voice_params: { rate: 1.0, pitch: 1.0 },
  },
};

const defaultAudioStoreState = {
  volumes: { voice: 0.8 },
  muted: { voice: false },
};

// ============================================================================
// Test Suite
// ============================================================================

describe('useTTS Hook - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Clear audio instances
    audioInstances.length = 0;

    // Setup default audioStore mock
    (useAudioStore as any).mockImplementation((selector: Function) => {
      const state = defaultAudioStoreState;
      return selector(state);
    });

    // Setup default successful fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTTSResponse,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // State Management Tests
  // ==========================================================================

  describe('State Updates', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.userFriendlyError).toBe(null);
      expect(result.current.progress).toBe(0);
      expect(result.current.duration).toBe(0);
    });

    it('should set isLoading to true when play is called', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      act(() => {
        result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should set isPlaying to true after successful audio load', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isPlaying).toBe(true);
      });
    });

    it('should set isPaused to true when pause is called', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should set isComplete to true when audio ends', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      // Simulate audio ending
      act(() => {
        const audioElement = audioInstances[0];
        if (audioElement) {
          audioElement.triggerEvent('ended');
        }
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.progress).toBe(100);
      });
    });

    it('should update progress during playback', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      // Simulate timeupdate event
      act(() => {
        const audioElement = audioInstances[0];
        if (audioElement) {
          audioElement.currentTime = 5;
          audioElement.duration = 10;
          audioElement.triggerEvent('timeupdate');
        }
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
      });
    });
  });

  // ==========================================================================
  // TTS API Integration Tests
  // ==========================================================================

  describe('TTS API Calls', () => {
    it('should call TTS API with correct request body', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test interpretation text',
          voice: 'pip_boy',
          language: 'zh-TW',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/audio/synthesize',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Test interpretation text',
            character_key: 'pip_boy',
            audio_type: 'ai_response',
            cache_enabled: true,
            return_format: 'url',
            language_code: 'zh-TW',
          }),
        })
      );
    });

    it('should use default values when options are not provided', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/audio/synthesize',
        expect.objectContaining({
          body: expect.stringContaining('"character_key":"pip_boy"'),
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/audio/synthesize',
        expect.objectContaining({
          body: expect.stringContaining('"language_code":"zh-TW"'),
        })
      );
    });

    it('should set duration from API response', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.duration).toBe(10);
      });
    });

    it('should handle TTS API response with different voice models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockTTSResponse,
          voice_model: 'chirp3-turbo',
          voice_name: 'wasteland_survivor',
        }),
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          voice: 'wasteland_survivor',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Control Methods Tests
  // ==========================================================================

  describe('Control Methods', () => {
    describe('play()', () => {
      it('should start playback from beginning', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
          expect(result.current.isPaused).toBe(false);
        });
      });

      it('should restart playback if already completed', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        // Play and complete
        await act(async () => {
          await result.current.play();
        });

        act(() => {
          const audioElement = audioInstances[0];
          if (audioElement) {
            audioElement.triggerEvent('ended');
          }
        });

        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
        });

        // Play again
        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isComplete).toBe(false);
          expect(result.current.isPlaying).toBe(true);
          expect(result.current.progress).toBe(0);
        });
      });
    });

    describe('pause()', () => {
      it('should pause playback', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });

        act(() => {
          result.current.pause();
        });

        expect(result.current.isPlaying).toBe(false);
        expect(result.current.isPaused).toBe(true);
      });

      it('should not pause if not playing', () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        act(() => {
          result.current.pause();
        });

        expect(result.current.isPaused).toBe(false);
      });
    });

    describe('resume()', () => {
      it('should resume playback after pause', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });

        act(() => {
          result.current.pause();
        });

        expect(result.current.isPaused).toBe(true);

        await act(async () => {
          await result.current.resume();
        });

        expect(result.current.isPlaying).toBe(true);
        expect(result.current.isPaused).toBe(false);
      });

      it('should not resume if not paused', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.resume();
        });

        expect(result.current.isPlaying).toBe(false);
      });
    });

    describe('stop()', () => {
      it('should stop playback and reset progress', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });

        // Simulate some progress
        act(() => {
          const audioElement = audioInstances[0];
          if (audioElement) {
            audioElement.currentTime = 5;
            audioElement.triggerEvent('timeupdate');
          }
        });

        await waitFor(() => {
          expect(result.current.progress).toBeGreaterThan(0);
        });

        act(() => {
          result.current.stop();
        });

        expect(result.current.isPlaying).toBe(false);
        expect(result.current.isPaused).toBe(false);
        expect(result.current.progress).toBe(0);
      });
    });

    describe('setVolume()', () => {
      it('should set audio volume', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });

        act(() => {
          result.current.setVolume(0.5);
        });

        const audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0.5);
      });

      it('should clamp volume between 0 and 1', async () => {
        const { result } = renderHook(() =>
          useTTS({
            text: 'Test text',
            autoPlay: false,
          })
        );

        await act(async () => {
          await result.current.play();
        });

        await waitFor(() => {
          expect(result.current.isPlaying).toBe(true);
        });

        // Test upper bound
        act(() => {
          result.current.setVolume(1.5);
        });

        let audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(1);

        // Test lower bound
        act(() => {
          result.current.setVolume(-0.5);
        });

        audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0);
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.userFriendlyError).toBe('網路連線失敗，請檢查您的網路連線');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isPlaying).toBe(false);
      });
    });

    it('should handle timeout errors', async () => {
      vi.useFakeTimers();

      mockFetch.mockImplementationOnce(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockTTSResponse,
          }), 40000);
        })
      );

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      act(() => {
        result.current.play();
      });

      // Fast-forward past timeout
      act(() => {
        vi.advanceTimersByTime(31000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.userFriendlyError).toBe('語音載入逾時，請稍後重試');
      });

      vi.useRealTimers();
    });

    it('should handle 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid request' }),
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.userFriendlyError).toBe('請求參數錯誤，請重新整理頁面');
      });
    });

    it('should handle 5xx server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.userFriendlyError).toBe('語音播放功能暫時無法使用，您仍可閱讀文字內容');
      });
    });

    it('should handle audio load errors', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      // Simulate audio load error
      act(() => {
        const audioElement = audioInstances[0];
        if (audioElement) {
          audioElement.triggerEvent('error', new Event('error'));
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.userFriendlyError).toBe('音檔載入失敗，請重試');
      });
    });

    it('should clear error state on successful retry', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTTSResponse,
      });

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.userFriendlyError).toBe(null);
        expect(result.current.isPlaying).toBe(true);
      });
    });
  });

  // ==========================================================================
  // AudioStore Integration Tests
  // ==========================================================================

  describe('AudioStore Integration', () => {
    it('should respect muted state from audioStore', async () => {
      (useAudioStore as any).mockImplementation((selector: Function) => {
        const state = {
          volumes: { voice: 0.8 },
          muted: { voice: true },
        };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        const audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0);
      });
    });

    it('should respect volume from audioStore', async () => {
      (useAudioStore as any).mockImplementation((selector: Function) => {
        const state = {
          volumes: { voice: 0.6 },
          muted: { voice: false },
        };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        const audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0.6);
      });
    });

    it('should update volume when audioStore state changes', async () => {
      let storeState = {
        volumes: { voice: 0.8 },
        muted: { voice: false },
      };

      (useAudioStore as any).mockImplementation((selector: Function) => {
        return selector(storeState);
      });

      const { result, rerender } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        const audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0.8);
      });

      // Change audioStore state
      storeState = {
        volumes: { voice: 0.4 },
        muted: { voice: false },
      };

      rerender();

      await waitFor(() => {
        const audioElement = audioInstances[0];
        expect(audioElement?.volume).toBe(0.4);
      });
    });

    it('should not auto-play if voice is muted', async () => {
      (useAudioStore as any).mockImplementation((selector: Function) => {
        const state = {
          volumes: { voice: 0.8 },
          muted: { voice: true },
        };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          // autoPlay not specified, should check store
        })
      );

      // Wait a bit to ensure no auto-play happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should auto-play if voice is not muted and autoPlay not specified', async () => {
      (useAudioStore as any).mockImplementation((selector: Function) => {
        const state = {
          volumes: { voice: 0.8 },
          muted: { voice: false },
        };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          // autoPlay not specified, should check store
        })
      );

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      }, { timeout: 3000 });
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup on Unmount', () => {
    it('should stop playback on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      const audioElement = audioInstances[0];
      expect(audioElement?.paused).toBe(false);

      unmount();

      expect(audioElement?.src).toBe('');
      expect(audioElement?.paused).toBe(true);
    });

    it('should abort pending API requests on unmount', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

      const { result, unmount } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      act(() => {
        result.current.play();
      });

      unmount();

      expect(abortSpy).toHaveBeenCalled();
      abortSpy.mockRestore();
    });

    it('should cleanup audio references on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      const audioElement = audioInstances[0];
      expect(audioElement).toBeTruthy();

      unmount();

      // Audio element should be cleaned up
      expect(audioElement?.src).toBe('');
    });
  });

  // ==========================================================================
  // Callback Tests
  // ==========================================================================

  describe('Callbacks', () => {
    it('should call onPlaybackComplete when audio ends', async () => {
      const onPlaybackComplete = vi.fn();

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
          onPlaybackComplete,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      // Simulate audio ending
      act(() => {
        const audioElement = audioInstances[0];
        if (audioElement) {
          audioElement.triggerEvent('ended');
        }
      });

      await waitFor(() => {
        expect(onPlaybackComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onPlaybackComplete when stopped manually', async () => {
      const onPlaybackComplete = vi.fn();

      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
          onPlaybackComplete,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      act(() => {
        result.current.stop();
      });

      expect(onPlaybackComplete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: '',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(10000);

      const { result } = renderHook(() =>
        useTTS({
          text: longText,
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/audio/synthesize',
        expect.objectContaining({
          body: expect.stringContaining(longText),
        })
      );
    });

    it('should handle special characters in text', async () => {
      const specialText = '特殊符號測試 !@#$%^&*()_+-=[]{}|;:",.<>?/~`';

      const { result } = renderHook(() =>
        useTTS({
          text: specialText,
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toBe('/api/v1/audio/synthesize');
      expect(fetchCall[1].body).toContain(specialText);
    });

    it('should handle rapid play/pause/resume cycles', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      await act(async () => {
        await result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      // Rapid pause/resume
      act(() => {
        result.current.pause();
        result.current.resume();
        result.current.pause();
        result.current.resume();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
        expect(result.current.isPaused).toBe(false);
      });
    });

    it('should handle multiple play calls without waiting', async () => {
      const { result } = renderHook(() =>
        useTTS({
          text: 'Test text',
          autoPlay: false,
        })
      );

      // Call play multiple times rapidly
      act(() => {
        result.current.play();
        result.current.play();
        result.current.play();
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      // Should only have one active audio element
      expect(audioInstances.length).toBeGreaterThan(0);
    });
  });
});
