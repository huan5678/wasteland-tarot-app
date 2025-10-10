/**
 * AutoSaveIndicator - Visual feedback for auto-save status
 */

'use client'

import { useSessionStore } from '@/lib/sessionStore'
import { Save, Cloud, CloudOff, AlertCircle, Check } from 'lucide-react'

export function AutoSaveIndicator() {
  const { autoSaveStatus, lastSavedAt, isOnline } = useSessionStore()

  const getStatusInfo = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return {
          icon: Save,
          text: '儲存中...',
          className: 'text-yellow-400 animate-pulse',
        }
      case 'saved':
        return {
          icon: Check,
          text: '已儲存',
          className: 'text-green-400',
        }
      case 'error':
        return {
          icon: AlertCircle,
          text: '儲存失敗',
          className: 'text-red-400',
        }
      case 'offline':
        return {
          icon: CloudOff,
          text: '離線模式',
          className: 'text-orange-400',
        }
      default:
        return {
          icon: Cloud,
          text: '自動儲存',
          className: 'text-pip-boy-green/70',
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

  const { icon: Icon, text, className } = getStatusInfo()

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Icon className="w-4 h-4" />
        <span>{text}</span>
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
