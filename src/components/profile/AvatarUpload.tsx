'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { PixelIcon } from '@/components/ui/icons'
import { profileAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/authStore'
import styles from './AvatarUpload.module.css'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onUploadSuccess?: (newAvatarUrl: string) => void
}

// 檔案驗證常數
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function AvatarUpload({ currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const user = useAuthStore(s => s.user)

  // 狀態管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  /**
   * 驗證檔案
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 檢查檔案類型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: '檔案類型不符。僅支援 JPEG、PNG、WebP、GIF 格式。'
      }
    }

    // 檢查檔案大小
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `檔案過大。最大允許 ${MAX_FILE_SIZE / 1024 / 1024} MB。`
      }
    }

    return { valid: true }
  }

  /**
   * 處理檔案選擇
   */
  const handleFileSelect = (file: File) => {
    setError(null)
    setSuccess(null)

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setSelectedFile(file)

    // 創建預覽
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  /**
   * 檔案輸入變更事件
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  /**
   * 拖放事件處理
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  /**
   * 將裁切區域轉為 Blob
   */
  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('無法建立 canvas context')
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = crop.width
      canvas.height = crop.height

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      )

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas 轉換失敗'))
            }
          },
          'image/jpeg',
          0.95
        )
      })
    },
    []
  )

  /**
   * 確認裁切並上傳
   */
  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current || !selectedFile) {
      setError('請選擇裁切區域')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // 取得裁切後的圖片 blob
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)

      // 轉換為 File 物件
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      // 呼叫 API 上傳
      const response = await profileAPI.uploadAvatar(croppedFile)

      setSuccess(response.message || '頭像上傳成功！')
      setShowCropModal(false)
      setSelectedFile(null)
      setPreviewUrl(null)

      // 通知父元件
      if (onUploadSuccess) {
        onUploadSuccess(response.avatar_url)
      }

      // 3 秒後清除成功訊息
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('頭像上傳失敗:', err)
      setError(err?.message || '上傳失敗，請稍後再試')
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * 取消裁切
   */
  const handleCropCancel = () => {
    setShowCropModal(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 點擊頭像觸發檔案選擇
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // 決定顯示的頭像 URL
  const displayAvatarUrl = currentAvatarUrl || user?.avatar_url

  return (
    <>
      {/* 頭像顯示區域 */}
      <div className="text-center mb-6">
        <div
          className={`relative w-24 h-24 border-2 border-pip-boy-green rounded-full mx-auto mb-4 bg-pip-boy-green/10 overflow-hidden cursor-pointer group transition-all ${
            isDragging ? 'ring-4 ring-pip-boy-green/50 scale-105' : ''
          }`}
          onClick={handleAvatarClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt="使用者頭像"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PixelIcon name="user-circle" sizePreset="xl" variant="muted" decorative />
            </div>
          )}

          {/* Hover 提示 */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center">
              <PixelIcon name="camera" sizePreset="md" variant="primary" decorative />
              <p className="text-pip-boy-green text-xs mt-1">點擊上傳</p>
            </div>
          </div>
        </div>

        {/* 隱藏的檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* 驗證結果訊息 */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-2">
            <PixelIcon name="alert-triangle" variant="error" sizePreset="xs" aria-label="錯誤" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-center gap-2 text-pip-boy-green text-sm mt-2">
            <PixelIcon name="check-circle" variant="success" sizePreset="xs" aria-label="成功" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* 裁切 Modal */}
      {showCropModal && previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-wasteland-dark border-2 border-pip-boy-green max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-pip-boy-green/10 border-b-2 border-pip-boy-green p-4">
              <h3 className="text-xl font-bold text-pip-boy-green">裁切頭像</h3>
              <p className="text-pip-boy-green/70 text-sm mt-1">
                拖動調整裁切區域（1:1 正方形）
              </p>
            </div>

            {/* Crop Area */}
            <div className="p-6 flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                className={styles.reactCrop}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="預覽"
                  className="max-w-full max-h-[60vh] object-contain"
                  onLoad={() => {
                    // 圖片載入後設定初始裁切
                    if (imgRef.current) {
                      const { width, height } = imgRef.current
                      const size = Math.min(width, height)
                      const x = (width - size) / 2
                      const y = (height - size) / 2

                      setCrop({
                        unit: 'px',
                        width: size,
                        height: size,
                        x,
                        y,
                      })
                    }
                  }}
                />
              </ReactCrop>
            </div>

            {/* Modal Actions */}
            <div className="border-t-2 border-pip-boy-green p-4 flex gap-4">
              <button
                onClick={handleCropConfirm}
                disabled={isUploading}
                className="flex-1 bg-pip-boy-green text-black font-bold px-6 py-2 hover:bg-pip-boy-green/80 transition-colors shadow-[0_0_10px_#00ff88] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <PixelIcon name="loader" animation="spin" sizePreset="sm" decorative />
                    上傳中...
                  </span>
                ) : (
                  '確認裁切'
                )}
              </button>
              <button
                onClick={handleCropCancel}
                disabled={isUploading}
                className="flex-1 border-2 border-pip-boy-green text-pip-boy-green font-bold px-6 py-2 hover:bg-pip-boy-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
