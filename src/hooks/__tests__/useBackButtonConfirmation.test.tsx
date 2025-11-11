import { renderHook } from '@testing-library/react';
import { useBackButtonConfirmation } from '../useBackButtonConfirmation';

describe('useBackButtonConfirmation', () => {
  let beforeUnloadListener: ((event: BeforeUnloadEvent) => void) | null = null;

  beforeEach(() => {
    beforeUnloadListener = null;
    jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'beforeunload') {
        beforeUnloadListener = listener as (event: BeforeUnloadEvent) => void;
      }
    });
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add beforeunload listener when enabled', () => {
    renderHook(() => useBackButtonConfirmation({ enabled: true }));

    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should not add listener when disabled', () => {
    renderHook(() => useBackButtonConfirmation({ enabled: false }));

    expect(window.addEventListener).not.toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should prevent default when confirmation triggered', () => {
    renderHook(() =>
      useBackButtonConfirmation({
        enabled: true,
        message: '確定要離開嗎？未完成的解讀將不會被儲存',
      })
    );

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    event.preventDefault = jest.fn();

    if (beforeUnloadListener) {
      beforeUnloadListener(event);
    }

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should set returnValue with confirmation message', () => {
    const message = '確定要離開嗎？未完成的解讀將不會被儲存';

    renderHook(() =>
      useBackButtonConfirmation({
        enabled: true,
        message,
      })
    );

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: '',
    });

    if (beforeUnloadListener) {
      beforeUnloadListener(event);
    }

    expect(event.returnValue).toBe(message);
  });

  it('should remove listener on cleanup', () => {
    const { unmount } = renderHook(() => useBackButtonConfirmation({ enabled: true }));

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should update listener when enabled state changes', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useBackButtonConfirmation({ enabled }),
      { initialProps: { enabled: true } }
    );

    expect(window.addEventListener).toHaveBeenCalledTimes(1);

    // Disable
    rerender({ enabled: false });

    expect(window.removeEventListener).toHaveBeenCalled();

    // Re-enable
    rerender({ enabled: true });

    expect(window.addEventListener).toHaveBeenCalledTimes(2);
  });

  it('should use default message if none provided', () => {
    renderHook(() => useBackButtonConfirmation({ enabled: true }));

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: '',
    });

    if (beforeUnloadListener) {
      beforeUnloadListener(event);
    }

    expect(event.returnValue).toBeTruthy();
  });

  it('should not prevent default when disabled', () => {
    renderHook(() => useBackButtonConfirmation({ enabled: false }));

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    event.preventDefault = jest.fn();

    if (beforeUnloadListener) {
      beforeUnloadListener(event);
    }

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle onConfirm callback', () => {
    const onConfirm = jest.fn();

    renderHook(() =>
      useBackButtonConfirmation({
        enabled: true,
        onConfirm,
      })
    );

    const event = new Event('beforeunload') as BeforeUnloadEvent;

    if (beforeUnloadListener) {
      beforeUnloadListener(event);
    }

    expect(onConfirm).toHaveBeenCalled();
  });
});
