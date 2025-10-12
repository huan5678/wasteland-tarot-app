'use client'

import React, { useState } from 'react'
import { usePreferences } from '@/hooks/usePreferences'
import { Card } from '@/components/ui/card'
import { PixelIcon } from '@/components/ui/icons'
// Old lucide imports:


export default function SettingsPage() {
  const {
    preferences,
    loading,
    resetPreferences,
    applyRecommendedSettings
  } = usePreferences()

  const [activeTab, setActiveTab] = useState<'visual' | 'accessibility'>('visual')

  if (loading && !preferences) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pip-boy-green" />
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-wasteland-tan/70">無法載入偏好設定</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PixelIcon name="settings" size={32} className="text-pip-boy-green" decorative />
          <h1 className="text-3xl font-bold">設定</h1>
        </div>
        <p className="text-wasteland-tan/70">
          自訂你的廢土塔羅體驗
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={applyRecommendedSettings}
          className="
            p-4 rounded-lg
            bg-pip-boy-green/10 hover:bg-pip-boy-green/20
            border-2 border-pip-boy-green/40
            transition-colors
            flex items-center gap-3
          "
        >
          <PixelIcon name="sparkles" size={24} className="text-pip-boy-green" decorative />
          <div className="text-left">
            <p className="font-semibold text-sm">套用推薦設定</p>
            <p className="text-xs text-wasteland-tan/60">基於你的使用習慣</p>
          </div>
        </button>

        <button
          onClick={resetPreferences}
          className="
            p-4 rounded-lg
            bg-wasteland-dark/40 hover:bg-wasteland-dark/60
            border-2 border-pip-boy-green/20
            transition-colors
            flex items-center gap-3
          "
        >
          <PixelIcon name="reload" size={24} className="text-wasteland-tan" decorative />
          <div className="text-left">
            <p className="font-semibold text-sm">重設預設值</p>
            <p className="text-xs text-wasteland-tan/60">恢復原廠設定</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-pip-boy-green/20">
        <button
          onClick={() => setActiveTab('visual')}
          className={`
            px-4 py-2 text-sm
            border-b-2 transition-colors
            ${activeTab === 'visual'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="palette" size={16} className="inline mr-2" decorative />
          視覺設定
        </button>

        <button
          onClick={() => setActiveTab('accessibility')}
          className={`
            px-4 py-2 text-sm
            border-b-2 transition-colors
            ${activeTab === 'accessibility'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="eye" size={16} className="inline mr-2" decorative />
          無障礙
        </button>
      </div>

      {/* Settings Content */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          {/* Theme */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="palette" size={24} decorative />
              主題
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  主題風格
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => updateVisualSettings({ theme: e.target.value })}
                  className="
                    w-full px-3 py-2 rounded
                    bg-wasteland-dark border border-pip-boy-green/40
                    text-pip-boy-green
                    focus:outline-none focus:border-pip-boy-green
                  "
                >
                  <option value="dark_vault">Dark Vault (預設)</option>
                  <option value="wasteland">Wasteland</option>
                  <option value="vault_tec">Vault-Tec</option>
                  <option value="mystical">Mystical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Pip-Boy 顏色
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['green', 'amber', 'blue', 'white'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateVisualSettings({ pip_boy_color: color })}
                      className={`
                        p-3 rounded border-2 transition-all
                        ${preferences.pip_boy_color === color
                          ? 'border-pip-boy-green scale-105'
                          : 'border-pip-boy-green/20 hover:border-pip-boy-green/40'
                        }
                      `}
                    >
                      <div
                        className={`w-full h-8 rounded ${
                          color === 'green' ? 'bg-pip-boy-green' :
                          color === 'amber' ? 'bg-amber-500' :
                          color === 'blue' ? 'bg-blue-500' :
                          'bg-white'
                        }`}
                      />
                      <p className="text-xs mt-2 capitalize">{color}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Effects */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">特效設定</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <span className="text-sm">終端機特效</span>
                <input
                  type="checkbox"
                  checked={preferences.terminal_effects}
                  onChange={(e) => updateVisualSettings({ terminal_effects: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <span className="text-sm">音效</span>
                <input
                  type="checkbox"
                  checked={preferences.sound_effects}
                  onChange={(e) => updateVisualSettings({ sound_effects: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <span className="text-sm">背景音樂</span>
                <input
                  type="checkbox"
                  checked={preferences.background_music}
                  onChange={(e) => updateVisualSettings({ background_music: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="eye" size={24} decorative />
              無障礙設定
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">高對比模式</p>
                  <p className="text-xs text-wasteland-tan/60">增強視覺對比度</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.high_contrast_mode}
                  onChange={(e) => updateAccessibilitySettings({ high_contrast_mode: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">大字體模式</p>
                  <p className="text-xs text-wasteland-tan/60">放大文字大小</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.large_text_mode}
                  onChange={(e) => updateAccessibilitySettings({ large_text_mode: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">減少動畫</p>
                  <p className="text-xs text-wasteland-tan/60">降低動態效果</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.reduced_motion}
                  onChange={(e) => updateAccessibilitySettings({ reduced_motion: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">螢幕閱讀器優化</p>
                  <p className="text-xs text-wasteland-tan/60">改善螢幕閱讀器相容性</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.screen_reader_mode}
                  onChange={(e) => updateAccessibilitySettings({ screen_reader_mode: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Card>

          <Card className="p-6 bg-pip-boy-green/5 border-pip-boy-green/40">
            <p className="text-sm text-wasteland-tan/80">
              💡 提示：啟用無障礙設定後，介面會自動調整以提供更好的使用體驗。
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
