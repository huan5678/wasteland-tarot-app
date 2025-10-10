/**
 * useFocusTrap - 焦點陷阱 Hook
 * Task 28: 實作焦點管理邏輯
 * Requirements 8.3
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Hook 選項
 */
export interface UseFocusTrapOptions {
  /** 是否啟用焦點陷阱 */
  enabled?: boolean;
  /** 當焦點陷阱啟用時，是否自動聚焦到第一個可互動元素 */
  autoFocus?: boolean;
  /** 當焦點陷阱停用時，是否恢復焦點到觸發元素 */
  restoreFocus?: boolean;
  /** 自訂可聚焦元素選擇器 */
  focusableSelector?: string;
  /** 當按下 Escape 時的回調 */
  onEscape?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 預設可聚焦元素選擇器
 * 包含所有標準可互動元素
 */
const DEFAULT_FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])',
].join(', ');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得元素內所有可聚焦的元素
 */
function getFocusableElements(
  container: HTMLElement | null,
  selector: string
): HTMLElement[] {
  if (!container) return [];

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(selector)
  );

  // 過濾掉不可見或被禁用的元素
  return elements.filter((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      el.offsetParent !== null
    );
  });
}

/**
 * 檢查元素是否在容器內
 */
function isElementInContainer(
  element: Element | null,
  container: HTMLElement | null
): boolean {
  if (!element || !container) return false;
  return container.contains(element);
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useFocusTrap - 焦點陷阱 Hook
 *
 * Features:
 * - 限制焦點在容器內（Drawer/Sheet）
 * - 自動聚焦到第一個可互動元素
 * - 當關閉時恢復焦點到觸發元素
 * - 支援 Tab 鍵循環焦點
 * - 支援 Escape 鍵關閉
 *
 * @example
 * ```tsx
 * function MyModal({ open, onClose }) {
 *   const containerRef = useFocusTrap({
 *     enabled: open,
 *     autoFocus: true,
 *     restoreFocus: true,
 *     onEscape: onClose,
 *   });
 *
 *   return (
 *     <div ref={containerRef}>
 *       <button>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
    onEscape,
  } = options;

  // ========== Refs ==========
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  // ========== Focus Management ==========

  /**
   * 聚焦到第一個可互動元素
   */
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(
      containerRef.current,
      focusableSelector
    );

    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      firstElement.focus();
      logger.info('[useFocusTrap] Focused first element', {
        element: firstElement.tagName,
      });
    } else {
      logger.warn('[useFocusTrap] No focusable elements found');
    }
  }, [focusableSelector]);

  /**
   * 恢復焦點到觸發元素
   */
  const restorePreviousFocus = useCallback(() => {
    if (previousActiveElementRef.current instanceof HTMLElement) {
      previousActiveElementRef.current.focus();
      logger.info('[useFocusTrap] Restored focus to previous element', {
        element: previousActiveElementRef.current.tagName,
      });
    }
  }, []);

  // ========== Event Handlers ==========

  /**
   * 處理 Tab 鍵導航
   * 當焦點移出容器時，循環回到容器內的第一個或最後一個元素
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      // 處理 Escape 鍵
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        logger.info('[useFocusTrap] Escape key pressed');
        onEscape();
        return;
      }

      // 處理 Tab 鍵
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(
          containerRef.current,
          focusableSelector
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // 如果當前焦點不在容器內，聚焦到第一個元素
        if (!isElementInContainer(activeElement, containerRef.current)) {
          event.preventDefault();
          firstElement.focus();
          logger.info('[useFocusTrap] Focus moved back to container');
          return;
        }

        // Shift + Tab（向前）
        if (event.shiftKey) {
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            logger.info('[useFocusTrap] Cycled to last element (Shift+Tab)');
          }
        }
        // Tab（向後）
        else {
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
            logger.info('[useFocusTrap] Cycled to first element (Tab)');
          }
        }
      }
    },
    [focusableSelector, onEscape]
  );

  // ========== Effects ==========

  /**
   * 當焦點陷阱啟用時，儲存當前焦點並聚焦到第一個元素
   */
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    logger.info('[useFocusTrap] Focus trap enabled');

    // 儲存當前焦點元素
    previousActiveElementRef.current = document.activeElement;

    // 自動聚焦到第一個元素
    if (autoFocus) {
      // 使用 requestAnimationFrame 確保 DOM 已經渲染
      requestAnimationFrame(() => {
        focusFirstElement();
      });
    }

    // 監聽鍵盤事件
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      logger.info('[useFocusTrap] Focus trap disabled');
      document.removeEventListener('keydown', handleKeyDown);

      // 恢復焦點到觸發元素
      if (restoreFocus) {
        restorePreviousFocus();
      }
    };
  }, [
    enabled,
    autoFocus,
    restoreFocus,
    focusFirstElement,
    restorePreviousFocus,
    handleKeyDown,
  ]);

  // ========== Return ==========

  return containerRef;
}

// ============================================================================
// Export Types
// ============================================================================

export type { UseFocusTrapOptions };
