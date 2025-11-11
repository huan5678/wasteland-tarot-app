/**
 * FooterDrawer - Desktop Footer with Drawer functionality
 * 可展開/收合的 Footer（僅限 Desktop）
 *
 * Features:
 * - Desktop: Drawer 模式，可拖曳收合
 * - Mobile: 直接顯示原 Footer（維持現有行為）
 * - localStorage 記憶使用者偏好
 * - 無障礙支援 (ARIA + 鍵盤操作)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer';
import { Footer } from './Footer';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { PixelIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function FooterDrawer() {
  // 狀態管理 - 使用 localStorage 記憶使用者偏好
  const [isOpen, setIsOpen] = useState(() => {
    // SSR: 預設展開
    if (typeof window === 'undefined') return true;

    // Client: 讀取儲存的偏好
    const saved = localStorage.getItem('footer-drawer-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isDesktop = useIsDesktop();

  // 儲存狀態變更到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('footer-drawer-open', JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // 鍵盤快捷鍵支援
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: 收合 Drawer
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      // Ctrl+F: 展開 Footer（如果收合）
      if (e.key === 'f' && e.ctrlKey && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mobile: 直接顯示原有 Footer（維持現有行為）
  if (!isDesktop) {
    return <Footer />;
  }

  // Desktop: Drawer 模式
  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      modal={false}  // 非模態 - 不阻擋背景互動
    >
      {/* Trigger Bar - 收合時顯示在畫面底部 */}
      <AnimatePresence>
        {!isOpen && (
          <DrawerTrigger asChild>
            <motion.button
              className={cn(
                "fixed bottom-0 left-0 right-0 z-40",
                "h-12",
                "bg-wasteland-dark/95 backdrop-blur-sm",
                "border-t-2 border-pip-boy-green",
                "flex items-center justify-center gap-2",
                "text-pip-boy-green text-sm font-bold",
                "hover:bg-pip-boy-green/10",
                "hover:shadow-[0_-4px_12px_rgba(0,255,136,0.2)]",
                "transition-all duration-200",
                "cursor-pointer"
              )}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }}
              aria-label="展開頁尾資訊區塊"
              aria-expanded={isOpen}
              aria-controls="footer-drawer-content"
            >
              <motion.div
                animate={{ y: [-2, 0, -2] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                <PixelIcon
                  name="chevron-up"
                  sizePreset="xs"
                  decorative
                />
              </motion.div>
              <span>展開頁尾</span>
              <span className="text-xs text-pip-boy-green/50 ml-2">
                (Ctrl+F)
              </span>
            </motion.button>
          </DrawerTrigger>
        )}
      </AnimatePresence>

      {/* Drawer Content - 展開時顯示 Footer 內容 */}
      <DrawerContent
        id="footer-drawer-content"
        className={cn(
          "border-t-2 border-pip-boy-green",
          "bg-wasteland-dark",
          "text-pip-boy-green",
          "max-h-[60vh]",
          "overflow-y-auto",
          // 覆蓋 vaul 預設的 ::after 偽元素高度
          "[&::after]:!h-0"
        )}
        role="region"
        aria-label="頁尾資訊"
      >
        {/* 隱藏的標題 - 供螢幕閱讀器使用 */}
        <DrawerTitle className="sr-only">頁尾資訊</DrawerTitle>

        {/* Footer Content - 原有 Footer 元件 */}
        <Footer className="border-t-0" />
      </DrawerContent>
    </Drawer>
  );
}
