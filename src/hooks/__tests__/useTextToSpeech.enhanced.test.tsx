/**
 * TDD Test Suite for Enhanced Web Speech API Integration (Task 4.4)
 *
 * Tests for:
 * - Voice narration for completed interpretations
 * - Play/pause/resume controls
 * - Speed adjustment
 * - Segment re-reading
 * - Browser compatibility handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTextToSpeech } from '../useTextToSpeech';

describe('useTextToSpeech - Enhanced Features (Task 4.4)', () => {
  let mockSpeechSynthesis: any;
  let mockSpeechSynthesisUtterance: any;
  let mockUtterance: any;

  beforeEach(() => {
    // Mock SpeechSynthesisUtterance
    mockUtterance = {
      text: '',
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      onstart: null,
      onend: null,
      onerror: null,
      onpause: null,
      onresume: null,
    };

    mockSpeechSynthesisUtterance = jest.fn(() => mockUtterance);
    global.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance as any;

    // Mock SpeechSynthesis
    mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn(() => [
        { name: 'Microsoft David Desktop', lang: 'en-US', default: true, localService: true, voiceURI: 'David' },
        { name: 'Microsoft Zira Desktop', lang: 'en-US', default: false, localService: true, voiceURI: 'Zira' },
      ]),
      onvoiceschanged: null,
      pending: false,
      speaking: false,
      paused: false,
    };

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Play/Pause/Resume Controls', () => {
    it('should provide pause functionality during speech', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      // Start speaking
      act(() => {
        result.current.speak('Test narration text');
      });

      // Trigger onstart
      act(() => {
        mockUtterance.onstart?.();
      });

      expect(result.current.isPlaying).toBe(true);

      // Pause speech
      act(() => {
        result.current.pause();
      });

      expect(mockSpeechSynthesis.pause).toHaveBeenCalledTimes(1);
      expect(result.current.isPaused).toBe(true);
    });

    it('should provide resume functionality after pause', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      // Start speaking
      act(() => {
        result.current.speak('Test narration text');
      });

      // Pause
      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      // Resume
      act(() => {
        result.current.resume();
      });

      expect(mockSpeechSynthesis.resume).toHaveBeenCalledTimes(1);
      expect(result.current.isPaused).toBe(false);
    });

    it('should provide toggle pause functionality', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      // Start speaking
      act(() => {
        result.current.speak('Test narration text');
      });

      // Toggle pause (should pause)
      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      // Toggle pause again (should resume)
      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('Speed Adjustment', () => {
    it('should allow speed adjustment during playback', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      // Set speed before speaking
      act(() => {
        result.current.setSpeed(1.5);
      });

      expect(result.current.currentSpeed).toBe(1.5);

      // Start speaking
      act(() => {
        result.current.speak('Test narration text');
      });

      // Verify rate was applied
      expect(mockUtterance.rate).toBe(1.5); // Default rate (1.0) * speed multiplier (1.5)
    });

    it('should support common speed presets (0.5x, 1x, 1.5x, 2x)', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const speeds = [0.5, 1.0, 1.5, 2.0];

      for (const speed of speeds) {
        act(() => {
          result.current.setSpeed(speed);
        });

        expect(result.current.currentSpeed).toBe(speed);
      }
    });

    it('should reject invalid speed values', () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Try setting negative speed
      act(() => {
        result.current.setSpeed(-1);
      });

      expect(result.current.currentSpeed).toBe(1.0); // Should remain at default
      expect(consoleSpy).toHaveBeenCalled();

      // Try setting zero speed
      act(() => {
        result.current.setSpeed(0);
      });

      expect(result.current.currentSpeed).toBe(1.0); // Should remain at default

      consoleSpy.mockRestore();
    });
  });

  describe('Segment Re-reading', () => {
    it('should allow re-reading specific text segments', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const fullText = 'Segment 1. Segment 2. Segment 3.';
      const segment = 'Segment 2';

      // Speak full text
      act(() => {
        result.current.speak(fullText);
      });

      // Complete first speech
      act(() => {
        mockUtterance.onend?.();
      });

      // Re-read segment
      act(() => {
        result.current.speak(segment);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
      expect(mockUtterance.text).toBe(segment);
    });

    it('should support paragraph-by-paragraph reading', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const paragraphs = [
        'First paragraph about the cards.',
        'Second paragraph about the interpretation.',
        'Third paragraph about guidance.',
      ];

      for (const paragraph of paragraphs) {
        act(() => {
          result.current.speak(paragraph);
        });

        // Complete speech
        act(() => {
          mockUtterance.onend?.();
        });
      }

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(paragraphs.length);
    });
  });

  describe('Browser Compatibility', () => {
    it('should detect browser support for Web Speech API', () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      expect(result.current.isSupported).toBe(true);
    });

    it('should detect when Web Speech API is not supported', () => {
      // Remove speechSynthesis
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      expect(result.current.isSupported).toBe(false);
    });

    it('should throw error when trying to speak without browser support', async () => {
      // Remove speechSynthesis
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      await expect(
        act(async () => {
          await result.current.speak('Test text');
        })
      ).rejects.toThrow('Text-to-speech not supported or disabled');
    });

    it('should provide browser compatibility warning information', () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      // Should provide browser info
      expect(result.current.browserInfo).toBeDefined();
      expect(result.current.browserInfo.isSupported).toBe(true);
      expect(result.current.browserInfo.recommendedBrowsers).toEqual(['Chrome', 'Edge', 'Safari']);
    });
  });

  describe('Voice Narration for Completed Interpretations', () => {
    it('should narrate completed interpretation text', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const interpretationText = 'The Fool card suggests new beginnings and taking risks.';

      act(() => {
        result.current.speak(interpretationText, 'pip_boy');
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      expect(mockUtterance.text).toBe(interpretationText);
    });

    it('should use character-specific voice settings', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      act(() => {
        result.current.speak('Test text', 'pip_boy');
      });

      // pip_boy has rate: 1.0, pitch: 1.2
      expect(mockUtterance.rate).toBe(1.0);
      expect(mockUtterance.pitch).toBe(1.2);
    });

    it('should handle long interpretation texts', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      const longText = 'A'.repeat(5000); // Very long text

      act(() => {
        result.current.speak(longText);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
      expect(mockUtterance.text).toBe(longText);
    });
  });

  describe('Integration with StreamingInterpretation', () => {
    it('should only enable narration after interpretation is complete', async () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: false }));

      // Attempt to speak while disabled
      await expect(
        act(async () => {
          await result.current.speak('Test text');
        })
      ).rejects.toThrow('Text-to-speech not supported or disabled');
    });

    it('should provide current playback state for UI updates', () => {
      const { result } = renderHook(() => useTextToSpeech({ enabled: true }));

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.currentPosition).toBe(0);
    });
  });
});
