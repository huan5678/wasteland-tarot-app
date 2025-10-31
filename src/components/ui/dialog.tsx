/**
 * Dialog Component - Pip-Boy Style
 * 整合版本: 結合 pipboy-ui-vibe 結構 + PipBoyDialog 樣式與功能
 *
 * Features:
 * - Based on Radix UI Dialog Primitive
 * - OKLCH color system
 * - Pip-Boy green border & glow effects
 * - PixelIcon for close button
 * - Optional audio effects
 * - Full accessibility support
 * - React 19 ref-as-prop support
 *
 * @see https://github.com/huan5678/pipboy-ui-vibe
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

/**
 * DialogClose - Close button component
 */
interface DialogCloseProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLButtonElement>;
}

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  DialogCloseProps
>(({ className, children, ref, ...props }, forwardedRef) => (
  <DialogPrimitive.Close
    ref={ref || forwardedRef}
    className={cn(
      'absolute right-4 top-4',
      'rounded-sm opacity-70',
      'ring-offset-background transition-opacity',
      'hover:opacity-100',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'disabled:pointer-events-none',
      'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
      className
    )}
    aria-label="關閉對話框"
    {...props}
  >
    {children || <PixelIcon name="close" sizePreset="sm" variant="primary" />}
  </DialogPrimitive.Close>
));
DialogClose.displayName = 'DialogClose';

/**
 * DialogOverlay - Backdrop overlay
 */
interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, ref, ...props }, forwardedRef) => (
  <DialogPrimitive.Overlay
    ref={ref || forwardedRef}
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent - Main dialog content container
 */
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Disable audio effects
   * @default false
   */
  disableAudio?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, disableAudio = false, ref, ...props }, forwardedRef) => {
  const { playSound } = useAudioEffect();

  React.useEffect(() => {
    // Play dialog open sound
    if (!disableAudio) {
      playSound('dialog-open');
    }

    return () => {
      // Play dialog close sound on unmount
      if (!disableAudio) {
        playSound('dialog-close');
      }
    };
  }, [disableAudio, playSound]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref || forwardedRef}
        className={cn(
          'fixed left-[50%] top-[50%] z-50',
          'grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
          'border-2 border-primary bg-card text-card-foreground p-6',
          'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
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
        <DialogClose />
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogHeader - Header section with title and description
 */
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

const DialogHeader = ({ className, ref, ...props }: DialogHeaderProps) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      'border-b-2 border-border/30 pb-4',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

/**
 * DialogFooter - Footer section with actions
 */
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

const DialogFooter = ({ className, ref, ...props }: DialogFooterProps) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      'border-t-2 border-border/30 pt-4',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

/**
 * DialogTitle - Dialog title
 */
interface DialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLHeadingElement>;
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, ref, ...props }, forwardedRef) => (
  <DialogPrimitive.Title
    ref={ref || forwardedRef}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight uppercase',
      'text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription - Dialog description
 */
interface DialogDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLParagraphElement>;
}

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  DialogDescriptionProps
>(({ className, ref, ...props }, forwardedRef) => (
  <DialogPrimitive.Description
    ref={ref || forwardedRef}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
