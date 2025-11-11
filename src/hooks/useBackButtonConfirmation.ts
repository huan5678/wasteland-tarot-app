import { useEffect } from 'react';

export interface UseBackButtonConfirmationOptions {
  /**
   * Whether to enable the back button confirmation
   */
  enabled: boolean;

  /**
   * Custom confirmation message
   * @default "確定要離開嗎？未完成的解讀將不會被儲存"
   */
  message?: string;

  /**
   * Callback when confirmation is triggered
   */
  onConfirm?: () => void;
}

/**
 * Hook to show confirmation dialog when user tries to leave the page
 * using browser back button or by closing the tab
 *
 * @example
 * ```tsx
 * useBackButtonConfirmation({
 *   enabled: isReadingInProgress && !isReadingComplete,
 *   message: '確定要離開嗎？未完成的解讀將不會被儲存',
 * });
 * ```
 */
export function useBackButtonConfirmation({
  enabled,
  message = '確定要離開嗎？未完成的解讀將不會被儲存',
  onConfirm,
}: UseBackButtonConfirmationOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Trigger callback if provided
      onConfirm?.();

      // Prevent default to show confirmation dialog
      event.preventDefault();

      // Set returnValue to show custom message
      // Note: Modern browsers ignore custom messages and show a generic one
      event.returnValue = message;

      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, message, onConfirm]);
}
