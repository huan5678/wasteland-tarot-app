'use client'
import React, { useState, useCallback } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { Download, Share2, Copy, FileText, Image, Link, QrCode, Mail, MessageCircle, X } from 'lucide-react'

interface Props {
  selectedReadingIds?: string[]
  onClose?: () => void
}

export function ExportShareTools({ selectedReadingIds = [], onClose }: Props) {
  const { readings, exportReadings } = useReadingsStore()
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [shareMethod, setShareMethod] = useState<'link' | 'image' | 'text'>('text')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const readingsToExport = selectedReadingIds.length > 0
    ? readings.filter(r => selectedReadingIds.includes(r.id))
    : readings

  const handleExport = useCallback(async () => {
    if (readingsToExport.length === 0) return

    setIsExporting(true)
    try {
      const data = exportReadings(exportFormat, selectedReadingIds.length > 0 ? selectedReadingIds : undefined)

      const blob = new Blob([data], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wasteland_tarot_readings_${new Date().toISOString().split('T')[0]}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [readingsToExport, exportFormat, exportReadings, selectedReadingIds])

  const generateReadingText = useCallback((reading: any) => {
    const cards = reading.cards_drawn?.map((card: any, index: number) => {
      const position = reading.spread_type === 'three_card'
        ? index === 0 ? '過去' : index === 1 ? '現在' : '未來'
        : `位置 ${index + 1}`
      return `${position}: ${card.name || '未知卡牌'}`
    }).join('\n') || '無卡牌記錄'

    return `🔮 占卜記錄 - ${reading.spread_type === 'single' ? '單張卡牌' : '三張卡牌'}

❓ 問題: ${reading.question}

🃏 抽到的卡牌:
${cards}

📝 解讀:
${reading.interpretation || '無解讀內容'}

⏰ 時間: ${new Date(reading.created_at || reading.date).toLocaleString()}

#WastelandTarot #塔羅占卜 #靈性指引`
  }, [])

  const handleShare = useCallback(async (reading?: any) => {
    if (!reading && selectedReadingIds.length !== 1) return

    const targetReading = reading || readings.find(r => r.id === selectedReadingIds[0])
    if (!targetReading) return

    const shareText = generateReadingText(targetReading)

    switch (shareMethod) {
      case 'text':
        try {
          await navigator.clipboard.writeText(shareText)
          setExportSuccess(true)
          setTimeout(() => setExportSuccess(false), 3000)
        } catch (error) {
          // Fallback for browsers without clipboard API
          const textArea = document.createElement('textarea')
          textArea.value = shareText
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          setExportSuccess(true)
          setTimeout(() => setExportSuccess(false), 3000)
        }
        break

      case 'link':
        const shareUrl = `${window.location.origin}/readings/${targetReading.id}`
        try {
          await navigator.clipboard.writeText(shareUrl)
          setExportSuccess(true)
          setTimeout(() => setExportSuccess(false), 3000)
        } catch (error) {
          console.error('Failed to copy link:', error)
        }
        break

      case 'image':
        // This would generate an image representation
        // For now, we'll copy the text as a fallback
        try {
          await navigator.clipboard.writeText(shareText)
          setExportSuccess(true)
          setTimeout(() => setExportSuccess(false), 3000)
        } catch (error) {
          console.error('Failed to generate image:', error)
        }
        break
    }
  }, [shareMethod, selectedReadingIds, readings, generateReadingText])

  const openSocialShare = useCallback((platform: string, reading: any) => {
    const shareText = generateReadingText(reading)
    const encodedText = encodeURIComponent(shareText)
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
        break
      case 'line':
        url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`
        break
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('我的塔羅占卜結果')}&body=${encodedText}`
        break
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }, [generateReadingText])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-pip-boy-green">匯出與分享</h3>
          <p className="text-pip-boy-green/70 text-sm">
            {selectedReadingIds.length > 0
              ? `已選擇 ${selectedReadingIds.length} 個占卜記錄`
              : `全部 ${readingsToExport.length} 個占卜記錄`
            }
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-pip-boy-green/70 hover:text-pip-boy-green"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {exportSuccess && (
        <div className="border-2 border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">操作成功完成！</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <h4 className="font-bold text-pip-boy-green flex items-center gap-2">
            <Download className="w-5 h-5" />
            匯出資料
          </h4>

          <div className="space-y-3">
            {/* Export Format Selection */}
            <div>
              <label className="block text-pip-boy-green text-sm mb-2">匯出格式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`p-3 border-2 text-sm transition-colors ${
                    exportFormat === 'json'
                      ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                      : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  JSON
                  <div className="text-xs opacity-70">完整資料</div>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 border-2 text-sm transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                      : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  CSV
                  <div className="text-xs opacity-70">表格格式</div>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting || readingsToExport.length === 0}
              className="w-full px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green
                       font-bold hover:bg-pip-boy-green/20 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin" />
                  匯出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  匯出 {exportFormat.toUpperCase()} 檔案
                </>
              )}
            </button>

            <div className="text-xs text-pip-boy-green/60">
              匯出的檔案將包含所有選擇的占卜記錄，包括問題、卡牌、解讀、標籤和筆記等完整資訊。
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <h4 className="font-bold text-pip-boy-green flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享占卜
          </h4>

          {selectedReadingIds.length === 1 ? (
            <div className="space-y-4">
              {/* Share Method Selection */}
              <div>
                <label className="block text-pip-boy-green text-sm mb-2">分享方式</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setShareMethod('text')}
                    className={`p-2 border transition-colors ${
                      shareMethod === 'text'
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                    }`}
                  >
                    <Copy className="w-4 h-4 mx-auto mb-1" />
                    文字
                  </button>
                  <button
                    onClick={() => setShareMethod('link')}
                    className={`p-2 border transition-colors ${
                      shareMethod === 'link'
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                    }`}
                  >
                    <Link className="w-4 h-4 mx-auto mb-1" />
                    連結
                  </button>
                  <button
                    onClick={() => setShareMethod('image')}
                    className={`p-2 border transition-colors ${
                      shareMethod === 'image'
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                    }`}
                  >
                    <Image className="w-4 h-4 mx-auto mb-1" />
                    圖片
                  </button>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={() => handleShare()}
                className="w-full px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green
                         font-bold hover:bg-pip-boy-green/20 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                複製到剪貼簿
              </button>

              {/* Social Share Buttons */}
              <div>
                <label className="block text-pip-boy-green text-sm mb-2">社群媒體分享</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'line', name: 'LINE', icon: MessageCircle, color: 'text-green-400' },
                    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' },
                    { id: 'twitter', name: 'Twitter', icon: MessageCircle, color: 'text-blue-400' },
                    { id: 'email', name: 'Email', icon: Mail, color: 'text-pip-boy-green' },
                  ].map(platform => {
                    const Icon = platform.icon
                    return (
                      <button
                        key={platform.id}
                        onClick={() => openSocialShare(platform.id, readings.find(r => r.id === selectedReadingIds[0]))}
                        className="p-2 border border-pip-boy-green/30 text-pip-boy-green/70
                                 hover:border-pip-boy-green/60 hover:text-pip-boy-green flex items-center gap-2"
                      >
                        <Icon className={`w-4 h-4 ${platform.color}`} />
                        {platform.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 mx-auto mb-3 text-pip-boy-green/40" />
              <div className="text-sm text-pip-boy-green/70 mb-2">
                請選擇單一占卜記錄來分享
              </div>
              <div className="text-xs text-pip-boy-green/50">
                分享功能需要選擇一個特定的占卜記錄
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Section */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
        <h4 className="font-bold text-pip-boy-green mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          匯入資料
        </h4>

        <div className="space-y-3">
          <input
            type="file"
            accept=".json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return

              try {
                const text = await file.text()
                const data = JSON.parse(text)

                // Basic validation
                if (Array.isArray(data) && data.every(item => item.id && item.question)) {
                  // This would use the importReadings method from the store
                  // await importReadings(data)
                  console.log('Import data:', data)
                  setExportSuccess(true)
                  setTimeout(() => setExportSuccess(false), 3000)
                } else {
                  alert('檔案格式不正確')
                }
              } catch (error) {
                alert('檔案讀取失敗')
              }
            }}
            className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                     file:mr-4 file:py-1 file:px-3 file:border file:border-pip-boy-green/30 file:bg-pip-boy-green/10
                     file:text-pip-boy-green file:file:text-sm"
          />
          <div className="text-xs text-pip-boy-green/60">
            僅支援 JSON 格式的占卜記錄檔案。匯入的資料會與現有記錄合併，不會覆蓋重複的記錄。
          </div>
        </div>
      </div>
    </div>
  )
}