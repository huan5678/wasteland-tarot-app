/**
 * useKeyboardShortcuts - 全域鍵盤快捷鍵 Hook
 * Task 26: 實作鍵盤快捷鍵系統
 * Requirements 8.1, 8.2
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useMusicPlayer } from './useMusicPlayer';
import { useAudioStore } from '@/lib/audio/audioStore';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * 快捷鍵動作
 */
export type ShortcutAction =
  | 'toggle-play'      // 播放/暫停
  | 'next'             // 下一首
  | 'previous'         // 上一首
  | 'toggle-mute'      // 靜音
  | 'toggle-shuffle'   // 隨機播放
  | 'cycle-repeat'     // 循環重複模式
  | 'open-playlist'    // 開啟播放清單
  | 'close-all'        // 關閉所有彈出視窗
  | 'show-help';       // 顯示快捷鍵提示

/**
 * 快捷鍵映射
 */
export interface ShortcutMapping {
  key: string;
  action: ShortcutAction;
  description: string;
  preventDefault?: boolean;
}

/**
 * Hook 選項
 */
export interface UseKeyboardShortcutsOptions {
  /** 是否啟用快捷鍵 */
  enabled?: boolean;
  /** 自訂快捷鍵映射 */
  customMappings?: ShortcutMapping[];
  /** 當快捷鍵觸發時的回調 */
  onShortcutTriggered?: (action: ShortcutAction) => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 預設快捷鍵映射
 * Requirements 8.1: 定義快捷鍵映射
 */
const DEFAULT_SHORTCUTS: ShortcutMapping[] = [
  {
    key: ' ',
    action: 'toggle-play',
    description: '播放/暫停',
    preventDefault: true,
  },
  {
    key: 'ArrowRight',
    action: 'next',
    description: '下一首',
    preventDefault: true,
  },
  {
    key: 'ArrowLeft',
    action: 'previous',
    description: '上一首',
    preventDefault: true,
  },
  {
    key: 'm',
    action: 'toggle-mute',
    description: '靜音',
    preventDefault: false,
  },
  {
    key: 'M',
    action: 'toggle-mute',
    description: '靜音',
    preventDefault: false,
  },
  {
    key: 's',
    action: 'toggle-shuffle',
    description: '隨機播放',
    preventDefault: false,
  },
  {
    key: 'S',
    action: 'toggle-shuffle',
    description: '隨機播放',
    preventDefault: false,
  },
  {
    key: 'r',
    action: 'cycle-repeat',
    description: '循環重複模式',
    preventDefault: false,
  },
  {
    key: 'R',
    action: 'cycle-repeat',
    description: '循環重複模式',
    preventDefault: false,
  },
  {
    key: 'p',
    action: 'open-playlist',
    description: '開啟播放清單',
    preventDefault: false,
  },
  {
    key: 'P',
    action: 'open-playlist',
    description: '開啟播放清單',
    preventDefault: false,
  },
  {
    key: 'Escape',
    action: 'close-all',
    description: '關閉所有彈出視窗',
    preventDefault: true,
  },
  {
    key: '?',
    action: 'show-help',
    description: '顯示快捷鍵提示',
    preventDefault: false,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 檢查元素是否為輸入框
 * Requirements 8.1: 快捷鍵衝突處理
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isEditable =
    element.getAttribute('contenteditable') === 'true';

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable
  );
}

/**
 * 檢查是否應該忽略快捷鍵
 */
function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  // 如果焦點在輸入框上，停用快捷鍵
  if (isInputElement(event.target as Element)) {
    return true;
  }

  // 如果按下了修飾鍵（Ctrl, Alt, Meta），停用快捷鍵
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return true;
  }

  return false;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useKeyboardShortcuts - 全域鍵盤快捷鍵 Hook
 *
 * Features:
 * - 全域鍵盤快捷鍵（從任何頁面都可使用）
 * - 快捷鍵衝突處理（輸入框 focus 時停用）
 * - 快捷鍵提示 UI（按下 ? 時顯示）
 * - 支援自訂快捷鍵映射
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showHelp, setShowHelp } = useKeyboardShortcuts({
 *     enabled: true,
 *     onShortcutTriggered: (action) => console.log(`Triggered: ${action}`)
 *   });
 *
 *   return showHelp ? <ShortcutHelp onClose={() => setShowHelp(false)} /> : null;
 * }
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enabled = true,
    customMappings,
    onShortcutTriggered,
  } = options;

  // ========== State ==========
  const [showHelp, setShowHelp] = useState(false);

  // ========== Hooks ==========
  const {
    isPlaying,
    pause,
    resume,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    openSheet,
    closeSheet,
    closeDrawer,
    isSheetOpen,
    isDrawerOpen,
  } = useMusicPlayer();

  const { toggleMute } = useAudioStore();

  // ========== Shortcut Mappings ==========
  const shortcuts = customMappings || DEFAULT_SHORTCUTS;

  // ========== Action Handlers ==========

  /**
   * 執行快捷鍵動作
   */
  const executeAction = useCallback(
    (action: ShortcutAction) => {
      logger.info(`[useKeyboardShortcuts] Executing action: ${action}`);

      switch (action) {
        case 'toggle-play':
          if (isPlaying) {
            pause();
          } else {
            resume();
          }
          break;

        case 'next':
          next();
          break;

        case 'previous':
          previous();
          break;

        case 'toggle-mute':
          toggleMute('music');
          break;

        case 'toggle-shuffle':
          toggleShuffle();
          break;

        case 'cycle-repeat':
          cycleRepeatMode();
          break;

        case 'open-playlist':
          openSheet();
          break;

        case 'close-all':
          if (isSheetOpen) {
            closeSheet();
          }
          if (isDrawerOpen) {
            closeDrawer();
          }
          if (showHelp) {
            setShowHelp(false);
          }
          break;

        case 'show-help':
          setShowHelp((prev) => !prev);
          break;

        default:
          logger.warn(`[useKeyboardShortcuts] Unknown action: ${action}`);
      }

      // 觸發回調
      if (onShortcutTriggered) {
        onShortcutTriggered(action);
      }
    },
    [
      isPlaying,
      pause,
      resume,
      next,
      previous,
      toggleMute,
      toggleShuffle,
      cycleRepeatMode,
      openSheet,
      closeSheet,
      closeDrawer,
      isSheetOpen,
      isDrawerOpen,
      showHelp,
      onShortcutTriggered,
    ]
  );

  // ========== Keyboard Event Handler ==========

  /**
   * 處理鍵盤事件
   * Requirements 8.1: 監聽 keydown 事件
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 如果停用，直接返回
      if (!enabled) return;

      // 檢查是否應該忽略快捷鍵
      if (shouldIgnoreShortcut(event)) return;

      // 查找匹配的快捷鍵
      const shortcut = shortcuts.find((s) => s.key === event.key);

      if (shortcut) {
        // 阻止預設行為（如果需要）
        if (shortcut.preventDefault) {
          event.preventDefault();
        }

        // 執行動作
        executeAction(shortcut.action);
      }
    },
    [enabled, shortcuts, executeAction]
  );

  // ========== Effect: Register Keyboard Listener ==========

  useEffect(() => {
    if (!enabled) return;

    logger.info('[useKeyboardShortcuts] Registering keyboard listener');

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      logger.info('[useKeyboardShortcuts] Unregistering keyboard listener');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // ========== Return ==========

  return {
    /** 是否顯示快捷鍵提示 */
    showHelp,
    /** 設定是否顯示快捷鍵提示 */
    setShowHelp,
    /** 快捷鍵映射列表 */
    shortcuts,
    /** 手動執行快捷鍵動作 */
    executeAction,
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  ShortcutMapping,
  UseKeyboardShortcutsOptions,
};
