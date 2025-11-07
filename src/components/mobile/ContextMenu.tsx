/**
 * ContextMenu - Context Menu Component
 * Spec: mobile-native-app-layout
 * Phase 3: Advanced Interactions
 * 
 * Long-press activated context menu with portal rendering
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { animated, useSpring } from '@react-spring/web';
import { useLongPress } from '@use-gesture/react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  variant?: 'default' | 'danger' | 'success';
  onAction: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  longPressDelay?: number;
  className?: string;
}

export function ContextMenu({
  items,
  children,
  longPressDelay = 500,
  className = ''
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Menu animation
  const [springs, api] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    config: { tension: 300, friction: 25 }
  }));

  const openMenu = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Get touch/click position
    const touch = 'touches' in event ? event.touches[0] : event;
    const x = touch.clientX;
    const y = touch.clientY;

    // Position menu above finger (with viewport edge detection)
    const menuWidth = 200;
    const menuHeight = items.length * 48 + 16;

    let menuX = x - menuWidth / 2;
    let menuY = y - menuHeight - 20; // 20px above finger

    // Viewport boundary checks
    if (menuX + menuWidth > window.innerWidth) {
      menuX = window.innerWidth - menuWidth - 16;
    }
    if (menuX < 16) {
      menuX = 16;
    }
    if (menuY < 16) {
      menuY = y + 20; // Show below if not enough space above
    }

    setPosition({ x: menuX, y: menuY });
    setIsOpen(true);
    triggerHaptic('medium');

    // Animate in
    api.start({
      scale: 1,
      opacity: 1
    });
  }, [items.length, api, triggerHaptic]);

  const closeMenu = useCallback(() => {
    api.start({
      scale: 0.8,
      opacity: 0,
      onRest: () => setIsOpen(false)
    });
  }, [api]);

  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;

    triggerHaptic(item.variant === 'danger' ? 'heavy' : 'light');
    item.onAction();
    closeMenu();
  }, [closeMenu, triggerHaptic]);

  // Long press gesture
  const bind = useLongPress(
    (event) => {
      openMenu(event.event as React.TouchEvent | React.MouseEvent);
    },
    {
      threshold: longPressDelay,
      cancelOnMovement: 10
    }
  );

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Render menu in portal
  const menuPortal = mounted && isOpen ? createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={closeMenu}
      />

      {/* Context Menu */}
      <animated.div
        ref={menuRef}
        style={{
          ...springs,
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 50
        }}
        className={cn(
          'bg-black border-2 border-pip-boy-green/50 rounded-lg',
          'shadow-[0_0_20px_rgba(0,255,136,0.3)]',
          'min-w-[200px] p-2',
          'origin-center'
        )}
      >
        {items.map((item) => {
          const variantStyles = {
            default: 'text-pip-boy-green hover:bg-pip-boy-green/10',
            danger: 'text-red-400 hover:bg-red-400/10',
            success: 'text-green-400 hover:bg-green-400/10'
          };

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'rounded transition-all duration-200',
                'text-left font-pixel text-sm',
                item.disabled 
                  ? 'opacity-40 cursor-not-allowed'
                  : variantStyles[item.variant || 'default'],
                'active:scale-95'
              )}
            >
              {item.icon && (
                <PixelIcon name={item.icon} size={20} decorative />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </animated.div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <div {...bind()} className={cn('touch-manipulation', className)}>
        {children}
      </div>
      {menuPortal}
    </>
  );
}
