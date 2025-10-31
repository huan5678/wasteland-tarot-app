'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
import { PixelIcon } from '@/components/ui/icons'

/**
 * PipBoySelect - Pip-Boy 終端機風格下拉選單
 *
 * 基於 Radix UI Select Primitive，提供完整鍵盤導航與無障礙支援
 *
 * @example
 * ```tsx
 * <PipBoySelect>
 *   <PipBoySelectTrigger>
 *     <PipBoySelectValue placeholder="選擇選項" />
 *   </PipBoySelectTrigger>
 *   <PipBoySelectContent>
 *     <PipBoySelectItem value="option1">選項 1</PipBoySelectItem>
 *     <PipBoySelectItem value="option2">選項 2</PipBoySelectItem>
 *   </PipBoySelectContent>
 * </PipBoySelect>
 * ```
 */

const PipBoySelect = SelectPrimitive.Root

const PipBoySelectGroup = SelectPrimitive.Group

const PipBoySelectValue = SelectPrimitive.Value

const PipBoySelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between px-3 py-2',
      'border-2 border-pip-boy-green/50',
      'bg-wasteland-dark/50',
      'text-pip-boy-green placeholder:text-pip-boy-green/40',
      'ring-offset-background',
      'focus:outline-none focus:border-pip-boy-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]',
      'disabled:cursor-not-allowed disabled:opacity-40',
      'font-[family-name:var(--font-cubic),monospace]',
      '[&>span]:line-clamp-1',
      className
    )}
    style={{ fontFamily: 'var(--font-cubic), monospace' }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <PixelIcon name="arrow-down" sizePreset="xs" decorative />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
PipBoySelectTrigger.displayName = 'PipBoySelectTrigger'

const PipBoySelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <PixelIcon name="arrow-up" sizePreset="xs" decorative />
  </SelectPrimitive.ScrollUpButton>
))
PipBoySelectScrollUpButton.displayName = 'PipBoySelectScrollUpButton'

const PipBoySelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <PixelIcon name="arrow-down" sizePreset="xs" decorative />
  </SelectPrimitive.ScrollDownButton>
))
PipBoySelectScrollDownButton.displayName = 'PipBoySelectScrollDownButton'

const PipBoySelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'border-2 border-pip-boy-green',
        'bg-wasteland-dark',
        'text-pip-boy-green',
        'shadow-[0_0_20px_rgba(0,255,136,0.3)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <PipBoySelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <PipBoySelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
PipBoySelectContent.displayName = 'PipBoySelectContent'

const PipBoySelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pl-8 pr-2 text-sm font-semibold',
      'text-pip-boy-green',
      className
    )}
    {...props}
  />
))
PipBoySelectLabel.displayName = 'PipBoySelectLabel'

const PipBoySelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center py-1.5 pl-8 pr-2',
      'outline-none',
      'focus:bg-pip-boy-green/20 focus:text-pip-boy-green',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      'font-[family-name:var(--font-cubic),monospace]',
      className
    )}
    style={{ fontFamily: 'var(--font-cubic), monospace' }}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <PixelIcon name="check" sizePreset="xs" decorative />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
PipBoySelectItem.displayName = 'PipBoySelectItem'

const PipBoySelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-pip-boy-green/30', className)}
    {...props}
  />
))
PipBoySelectSeparator.displayName = 'PipBoySelectSeparator'

export {
  PipBoySelect,
  PipBoySelectGroup,
  PipBoySelectValue,
  PipBoySelectTrigger,
  PipBoySelectContent,
  PipBoySelectLabel,
  PipBoySelectItem,
  PipBoySelectSeparator,
  PipBoySelectScrollUpButton,
  PipBoySelectScrollDownButton,
}
