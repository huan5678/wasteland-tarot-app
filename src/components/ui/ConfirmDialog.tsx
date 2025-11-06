/**
 * @deprecated Consider migrating to PipBoyDialog for enhanced Pip-Boy styling.
 *
 * Migration Suggestion:
 * - Use PipBoyDialog components directly for more flexible confirmation dialogs
 * - Or keep this wrapper if you prefer the simplified API
 *
 * Note: This component is still functional and maintained, but PipBoyDialog
 * provides a more consistent Pip-Boy themed experience.
 * Last updated: 2025-10-30
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PixelIcon } from '@/components/ui/icons'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-wasteland-dark border-2 border-pip-boy-green">
        <DialogHeader>
          <DialogTitle className="text-pip-boy-green flex items-center gap-2">
            {variant === 'destructive' && (
              <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-pip-boy-green/70">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 border-2 border-pip-boy-green/50 text-pip-boy-green hover:bg-pip-boy-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              variant === 'destructive'
                ? 'border-red-400 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30'
            }`}
          >
            {isLoading ? (
              <>
                <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                處理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
