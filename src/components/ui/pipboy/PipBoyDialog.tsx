'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { PixelIcon } from '@/components/ui/icons'

/**
 * PipBoyDialog - Vault-Tec 品牌風格對話框
 *
 * 基於 Radix UI Dialog Primitive 實作，提供完整無障礙支援
 * 整合 ConfirmDialog 與 morphing-dialog 功能
 *
 * @example
 * ```tsx
 * <PipBoyDialog>
 *   <PipBoyDialogTrigger>開啟對話框</PipBoyDialogTrigger>
 *   <PipBoyDialogContent>
 *     <PipBoyDialogHeader>
 *       <PipBoyDialogTitle>標題</PipBoyDialogTitle>
 *       <PipBoyDialogDescription>描述文字</PipBoyDialogDescription>
 *     </PipBoyDialogHeader>
 *     <PipBoyDialogClose />
 *   </PipBoyDialogContent>
 * </PipBoyDialog>
 * ```
 */

const PipBoyDialog = DialogPrimitive.Root

const PipBoyDialogTrigger = DialogPrimitive.Trigger

const PipBoyDialogPortal = DialogPrimitive.Portal

const PipBoyDialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-4 top-4',
      'rounded-sm opacity-70',
      'ring-offset-background transition-opacity',
      'hover:opacity-100',
      'focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2',
      'disabled:pointer-events-none',
      'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
      className
    )}
    aria-label="關閉對話框"
    {...props}
  >
    {children || <PixelIcon name="close" sizePreset="sm" variant="primary" />}
  </DialogPrimitive.Close>
))
PipBoyDialogClose.displayName = 'PipBoyDialogClose'

const PipBoyDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
PipBoyDialogOverlay.displayName = 'PipBoyDialogOverlay'

const PipBoyDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <PipBoyDialogPortal>
    <PipBoyDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50',
        'grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
        'border-2 border-pip-boy-green bg-wasteland-dark p-6',
        'shadow-[0_0_20px_rgba(0,255,136,0.3)]',
        'duration-300',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'sm:rounded-none',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </PipBoyDialogPortal>
))
PipBoyDialogContent.displayName = 'PipBoyDialogContent'

const PipBoyDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      'border-b-2 border-pip-boy-green/30 pb-4',
      className
    )}
    {...props}
  />
)
PipBoyDialogHeader.displayName = 'PipBoyDialogHeader'

const PipBoyDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      'border-t-2 border-pip-boy-green/30 pt-4',
      className
    )}
    {...props}
  />
)
PipBoyDialogFooter.displayName = 'PipBoyDialogFooter'

const PipBoyDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      'text-pip-boy-green',
      className
    )}
    style={{ fontFamily: 'var(--font-cubic), monospace' }}
    {...props}
  />
))
PipBoyDialogTitle.displayName = 'PipBoyDialogTitle'

const PipBoyDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-pip-boy-green/70', className)}
    {...props}
  />
))
PipBoyDialogDescription.displayName = 'PipBoyDialogDescription'

export {
  PipBoyDialog,
  PipBoyDialogPortal,
  PipBoyDialogOverlay,
  PipBoyDialogTrigger,
  PipBoyDialogClose,
  PipBoyDialogContent,
  PipBoyDialogHeader,
  PipBoyDialogFooter,
  PipBoyDialogTitle,
  PipBoyDialogDescription,
}
