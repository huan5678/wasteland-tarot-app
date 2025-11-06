/**
 * PipBoy Tabs Component
 * Fallout/Wasteland 風格的 Tab 元件
 * 
 * 基於 /readings/[id] 頁面的 Tab 設計
 * 特色:
 * - 底部邊框高亮效果
 * - 動畫過渡
 * - Pip-Boy 綠色主題
 * - 支援圖示
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';

// ========== Context ==========
interface PipBoyTabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const PipBoyTabsContext = React.createContext<PipBoyTabsContextValue | undefined>(undefined);

const usePipBoyTabs = () => {
  const context = React.useContext(PipBoyTabsContext);
  if (!context) {
    throw new Error('PipBoyTab components must be used within PipBoyTabs');
  }
  return context;
};

// ========== Root Component ==========
interface PipBoyTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function PipBoyTabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className
}: PipBoyTabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : internalValue;
  
  const setActiveTab = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  return (
    <PipBoyTabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </PipBoyTabsContext.Provider>
  );
}

// ========== TabsList Component ==========
interface PipBoyTabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function PipBoyTabsList({ children, className }: PipBoyTabsListProps) {
  return (
    <div className={cn(
      'border-b-2 border-pip-boy-green/30 mb-6',
      className
    )}>
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-pip-boy-green/30">
        {children}
      </div>
    </div>
  );
}

// ========== TabsTrigger Component ==========
interface PipBoyTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: string;
  color?: string;
  className?: string;
  disabled?: boolean;
}

export function PipBoyTabsTrigger({
  value,
  children,
  icon,
  color = 'text-pip-boy-green',
  className,
  disabled = false
}: PipBoyTabsTriggerProps) {
  const { activeTab, setActiveTab } = usePipBoyTabs();
  const isActive = activeTab === value;

  return (
    <motion.button
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all duration-200 whitespace-nowrap',
        isActive
          ? `${color} border-current bg-pip-boy-green/5`
          : 'text-pip-boy-green/60 border-transparent hover:text-pip-boy-green/80 hover:bg-pip-boy-green/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { y: -1 } : undefined}
      aria-selected={isActive}
      role="tab"
      aria-disabled={disabled}
    >
      {icon && <PixelIcon name={icon} sizePreset="xs" decorative />}
      <span>{children}</span>
    </motion.button>
  );
}

// ========== TabsContent Component ==========
interface PipBoyTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  animationKey?: string;
}

export function PipBoyTabsContent({
  value,
  children,
  className,
  animationKey
}: PipBoyTabsContentProps) {
  const { activeTab } = usePipBoyTabs();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey || value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn('min-h-[60vh]', className)}
        role="tabpanel"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ========== Utility: Tab Config Type ==========
export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
}
