/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useTouchInteraction } from './useTouchInteraction';

describe('useTouchInteraction - Core Functionality', () => {
  it('should export a hook function', () => {
    expect(typeof useTouchInteraction).toBe('function');
  });

  it('should return ref and isTouching state', () => {
    const { result } = renderHook(() => useTouchInteraction({}));

    expect(result.current).toHaveProperty('ref');
    expect(result.current).toHaveProperty('isTouching');
    expect(result.current.ref).toHaveProperty('current');
    expect(typeof result.current.isTouching).toBe('boolean');
  });

  it('should initialize with isTouching as false', () => {
    const { result } = renderHook(() => useTouchInteraction({}));

    expect(result.current.isTouching).toBe(false);
  });

  it('should accept touch interaction options', () => {
    const options = {
      onTap: jest.fn(),
      onDoubleTap: jest.fn(),
      onLongPress: jest.fn(),
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      swipeThreshold: 50,
      longPressDuration: 500,
    };

    const { result } = renderHook(() => useTouchInteraction(options));

    // Should not throw and return valid object
    expect(result.current).toBeDefined();
    expect(result.current.ref).toBeDefined();
  });

  it('should handle undefined options gracefully', () => {
    const { result } = renderHook(() => useTouchInteraction());

    expect(result.current).toBeDefined();
    expect(result.current.isTouching).toBe(false);
  });

  it('should update when options change', () => {
    const { result, rerender } = renderHook(
      ({ onTap }) => useTouchInteraction({ onTap }),
      { initialProps: { onTap: jest.fn() } }
    );

    const firstRender = result.current;

    rerender({ onTap: jest.fn() });

    // Hook should still work after rerender
    expect(result.current).toBeDefined();
    expect(result.current.ref).toBeDefined();
  });
});
