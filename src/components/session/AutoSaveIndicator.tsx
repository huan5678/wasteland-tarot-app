/**
 * AutoSaveIndicator - Visual feedback for auto-save status
 * Phase 6: Enhanced with animations and color variants
 */

'use client'

import { useSessionStore } from '@/lib/sessionStore'
import { PixelIcon } from '@/components/ui/icons'
import type { IconName, IconAnimation, IconColorVariant } from '@/components/ui/icons'

export function AutoSaveIndicator() {
  const { autoSaveStatus, lastSavedAt, isOnline } = useSessionStore()

  const getStatusInfo = (): {
    iconName: IconName;
    text: string;
    variant: IconColorVariant;
    animation?: IconAnimation;
  } => {
    switch (autoSaveStatus) {
      case 'saving':
        return {
          iconName: 'save',
          text: '儲存中...',
          variant: 'warning',
          animation: 'pulse',
        }
      case 'saved':
        return {
          iconName: 'check',
          text: '已儲存',
          variant: 'success',
        }
      case 'error':
        return {
          iconName: 'alert',
          text: '儲存失敗',
          variant: 'error',
          animation: 'wiggle',
        }
      case 'offline':
        return {
          iconName: 'cloud-off',
          text: '離線模式',
          variant: 'secondary',
        }
      default:
        return {
          iconName: 'cloud',
          text: '自動儲存',
          variant: 'muted',
        }
    }
  }

  const formatLastSaved = () => {
    if (!lastSavedAt) return ''

    const now = new Date()
    const diff = now.getTime() - lastSavedAt.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes > 0) {
      return `${minutes} 分鐘前`
    } else if (seconds > 0) {
      return `${seconds} 秒前`
    } else {
      return '剛剛'
    }
  }

  const { iconName, text, variant, animation } = getStatusInfo()

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        <PixelIcon
          name={iconName}
          sizePreset="xs"
          variant={variant}
          animation={animation}
          decorative
        />
        <span className={variant !== 'muted' ? `text-${variant}` : 'text-pip-boy-green/70'}>
          {text}
        </span>
      </div>

      {lastSavedAt && autoSaveStatus === 'saved' && (
        <span className="text-pip-boy-green/50 text-xs">
          {formatLastSaved()}
        </span>
      )}

      {!isOnline && (
        <span className="px-2 py-0.5 bg-orange-400/20 border border-orange-400/50 text-orange-400 text-xs rounded">
          離線
        </span>
      )}
    </div>
  )
}
