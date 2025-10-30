'use client'

import React from 'react'
import Image from 'next/image'
import { PixelIcon } from '@/components/ui/icons'

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null // 用戶上傳的頭像（優先）
  profilePictureUrl?: string | null // OAuth 頭像（次要）
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function UserAvatar({
  name,
  avatarUrl,
  profilePictureUrl,
  size = 'md',
  showName = true,
  className = ''
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  // 優先使用用戶上傳的頭像，其次使用 OAuth 頭像
  const imageUrl = avatarUrl || profilePictureUrl
  const hasImage = imageUrl && !imageError

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Avatar 圓形區域 */}
      <div className={`
        relative ${sizeClasses[size]} rounded-full
        border-2 border-pip-boy-green
        overflow-hidden
        bg-wasteland-dark
        shadow-[0_0_10px_rgba(0,255,136,0.5)]
      `}>
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={`${name} 的頭像`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PixelIcon
              name="user-circle"
              sizePreset={iconSizes[size]}
              variant="primary"
              decorative
            />
          </div>
        )}
      </div>

      {/* 用戶名稱（可選） */}
      {showName && (
        <span className="text-sm font-bold text-pip-boy-green truncate max-w-[120px]">
          {name}
        </span>
      )}
    </div>
  )
}
