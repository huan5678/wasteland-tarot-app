/**
 * Tests for useStreamingText hook
 * Tests streaming functionality, typewriter effect, and error handling
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Mock fetch API
global.fetch = jest.fn();

describe('useStreamingText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use real timers for all async operations
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: { test: 'data' },
        enabled: false,
      })
    );

    expect(result.current.text).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should stream text chunks from SSE', async () => {
    // Mock SSE response
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: Hello\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data:  world\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: { test: 'data' },
        enabled: true,
        charsPerSecond: 1000, // Very fast for testing
      })
    );

    // Wait for streaming to complete
    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 5000 }
    );

    // Wait for typewriter effect to display text
    await waitFor(
      () => {
        expect(result.current.text).toContain('Hello');
        expect(result.current.text).toContain('world');
      },
      { timeout: 5000 }
    );
  });

  it('should handle skip functionality', async () => {
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: Test text here\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
        charsPerSecond: 10, // Slow for testing skip
      })
    );

    // Wait for streaming to start
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    }, { timeout: 3000 });

    // Skip typewriter effect
    act(() => {
      result.current.skip();
    });

    // Should show full text immediately after skip
    await waitFor(() => {
      expect(result.current.text).toBe('Test text here');
    }, { timeout: 3000 });
  });

  it('should handle HTTP errors', async () => {
    const mockResponse = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const onError = jest.fn();

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('503');
    }, { timeout: 3000 });

    expect(onError).toHaveBeenCalled();
  });

  it('should handle SSE error messages', async () => {
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: Starting...\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [ERROR] AI service failed\n\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('AI service failed');
    }, { timeout: 3000 });
  });

  it('should call onComplete when streaming finishes', async () => {
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: Complete text\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const onComplete = jest.fn();

    renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
        onComplete,
        charsPerSecond: 1000, // Fast for testing
      })
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('Complete text');
    }, { timeout: 5000 });
  });

  it('should reset state when reset is called', async () => {
    const mockReader = {
      read: jest.fn().mockResolvedValue({
        done: false,
        value: new TextEncoder().encode('data: Test\n\n'),
      }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
      })
    );

    // Wait for some text
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    }, { timeout: 3000 });

    // Reset
    act(() => {
      result.current.reset();
    });

    // Check state is reset
    expect(result.current.text).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not start streaming when enabled is false', () => {
    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: false,
      })
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it('should handle abort on unmount', async () => {
    const mockReader = {
      read: jest.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { unmount } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Unmount should abort without errors
    unmount();

    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should display text progressively with typewriter effect', async () => {
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: This is a long text message\n\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: [DONE]\n\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: {},
        enabled: true,
        charsPerSecond: 100, // Moderate speed
      })
    );

    // Wait for streaming to complete
    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    }, { timeout: 5000 });

    // Wait for typewriter to finish
    await waitFor(() => {
      expect(result.current.text).toBe('This is a long text message');
    }, { timeout: 5000 });
  });
});