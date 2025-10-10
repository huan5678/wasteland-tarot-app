/**
 * ShortcutHelp - 鍵盤快捷鍵提示 UI
 * Task 26: 快捷鍵提示 UI（按下 ? 時顯示）
 * Requirements 8.1, 8.2
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ShortcutMapping } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ShortcutHelpProps {
  /** 是否顯示 */
  open: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 快捷鍵映射列表 */
  shortcuts: ShortcutMapping[];
  /** 自訂樣式類別 */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ShortcutHelp - 快捷鍵提示彈窗
 *
 * Features:
 * - Pip-Boy 綠色主題
 * - 終端機風格字體
 * - 按 Escape 關閉
 * - 點擊背景遮罩關閉
 * - 動畫效果
 *
 * @example
 * ```tsx
 * <ShortcutHelp
 *   open={showHelp}
 *   onClose={() => setShowHelp(false)}
 *   shortcuts={shortcuts}
 * />
 * ```
 */
export function ShortcutHelp({
  open,
  onClose,
  shortcuts,
  className,
}: ShortcutHelpProps) {
  // ========== Event Handlers ==========

  /**
   * 處理背景點擊
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * 處理 Escape 鍵
   */
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // ========== Render ==========

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-help-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            className={cn(
              // Base Layout
              'relative w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto',
              // Pip-Boy Theme
              'bg-black border-2 border-pip-boy-green',
              'text-pip-boy-green',
              'p-6 rounded-lg',
              // CRT Scanline Effect
              'before:absolute before:inset-0 before:pointer-events-none before:z-10',
              'before:bg-[linear-gradient(transparent_50%,rgba(0,255,136,0.03)_50%)]',
              'before:bg-[length:100%_4px]',
              // Glow Effect
              'shadow-[0_0_30px_rgba(0,255,136,0.5)]',
              // Custom Styles
              className
            )}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b-2 border-pip-boy-green pb-4">
              <h2
                id="shortcut-help-title"
                className="text-xl font-bold text-pip-boy-green"
              >
                鍵盤快捷鍵
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded transition-colors hover:bg-pip-boy-green/10 focus:outline-none focus:ring-2 focus:ring-pip-boy-green"
                aria-label="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shortcuts List */}
            <div className="space-y-3">
              {shortcuts
                .filter((shortcut) => shortcut.action !== 'show-help')
                .map((shortcut, index) => (
                  <div
                    key={`${shortcut.key}-${index}`}
                    className="flex items-center justify-between p-3 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded"
                  >
                    {/* Description */}
                    <span className="text-sm text-pip-boy-green/80">
                      {shortcut.description}
                    </span>

                    {/* Key Badge */}
                    <kbd
                      className={cn(
                        'px-3 py-1 rounded',
                        'bg-pip-boy-green text-black',
                        'font-bold text-xs uppercase',
                        'shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                      )}
                    >
                      {shortcut.key === ' '
                        ? 'Space'
                        : shortcut.key === 'Escape'
                        ? 'Esc'
                        : shortcut.key === 'ArrowLeft'
                        ? '←'
                        : shortcut.key === 'ArrowRight'
                        ? '→'
                        : shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t-2 border-pip-boy-green text-center text-xs text-pip-boy-green/50">
              按 <kbd className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded">?</kbd> 或{' '}
              <kbd className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded">Esc</kbd> 關閉此視窗
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

ShortcutHelp.displayName = 'ShortcutHelp';
