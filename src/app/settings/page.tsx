'use client'

import React, { useState } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { AuthLoading } from '@/components/auth/AuthLoading'
import { usePreferences } from '@/hooks/usePreferences'
import { Card } from '@/components/ui/card'
import { PixelIcon } from '@/components/ui/icons'
import { AuthMethodsManagement } from '@/components/auth/AuthMethodsManagement'

type TabType = 'reading' | 'interpretation' | 'notifications' | 'privacy' | 'security'

export default function SettingsPage() {
  // 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth()

  const {
    preferences,
    loading,
    updateReadingSettings,
    updateInterpretationSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    resetPreferences,
    applyRecommendedSettings
  } = usePreferences()

  const [activeTab, setActiveTab] = useState<TabType>('reading')

  console.log('[SettingsPage] Render - loading:', loading, 'preferences:', preferences)

  // 統一載入畫面
  if (!isReady || (loading && !preferences)) {
    return <AuthLoading isVerifying={!isReady} />
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
          <PixelIcon name="settings" sizePreset="lg" className="text-pip-boy-green" decorative />
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
          <PixelIcon name="sparkles" sizePreset="md" className="text-pip-boy-green" decorative />
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
          <PixelIcon name="reload" sizePreset="md" className="text-wasteland-tan" decorative />
          <div className="text-left">
            <p className="font-semibold text-sm">重設預設值</p>
            <p className="text-xs text-wasteland-tan/60">恢復原廠設定</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-pip-boy-green/20 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reading')}
          className={`
            px-4 py-2 text-sm whitespace-nowrap
            border-b-2 transition-colors
            ${activeTab === 'reading'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="book-open" sizePreset="xs" className="inline mr-2" decorative />
          閱讀設定
        </button>

        <button
          onClick={() => setActiveTab('interpretation')}
          className={`
            px-4 py-2 text-sm whitespace-nowrap
            border-b-2 transition-colors
            ${activeTab === 'interpretation'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="message-2" sizePreset="xs" className="inline mr-2" decorative />
          解讀設定
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`
            px-4 py-2 text-sm whitespace-nowrap
            border-b-2 transition-colors
            ${activeTab === 'notifications'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="notification" sizePreset="xs" className="inline mr-2" decorative />
          通知設定
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`
            px-4 py-2 text-sm whitespace-nowrap
            border-b-2 transition-colors
            ${activeTab === 'privacy'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="lock" sizePreset="xs" className="inline mr-2" decorative />
          隱私設定
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`
            px-4 py-2 text-sm whitespace-nowrap
            border-b-2 transition-colors
            ${activeTab === 'security'
              ? 'border-pip-boy-green text-pip-boy-green'
              : 'border-transparent text-wasteland-tan/60 hover:text-wasteland-tan'
            }
          `}
        >
          <PixelIcon name="shield" sizePreset="xs" className="inline mr-2" decorative />
          帳號與安全
        </button>
      </div>

      {/* Settings Content */}
      {activeTab === 'reading' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="book-open" sizePreset="md" decorative />
              閱讀偏好設定
            </h3>

            <div className="space-y-4">
              {/* Auto Save Readings */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">自動儲存閱讀</p>
                  <p className="text-xs text-wasteland-tan/60">每次閱讀後自動儲存到歷史記錄</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.auto_save_readings}
                  onChange={(e) => updateReadingSettings({ auto_save_readings: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Share Readings Publicly */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">公開分享閱讀</p>
                  <p className="text-xs text-wasteland-tan/60">允許其他使用者查看你的閱讀</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.share_readings_publicly}
                  onChange={(e) => updateReadingSettings({ auto_save_readings: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Favorite Spread Types */}
              <div className="p-3 rounded border border-pip-boy-green/20">
                <p className="text-sm font-medium mb-2">偏好的牌陣類型</p>
                <p className="text-xs text-wasteland-tan/60 mb-3">
                  已選擇 {preferences.favorite_spread_types?.length || 0} 種牌陣
                </p>
                <div className="text-xs text-pip-boy-green/80">
                  {preferences.favorite_spread_types?.join('、') || '無'}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-pip-boy-green/5 border-pip-boy-green/40">
            <p className="text-sm text-wasteland-tan/80">
              <PixelIcon name="info" sizePreset="sm" className="inline mr-2 text-pip-boy-green" decorative />
              提示：閱讀設定會影響你的塔羅閱讀體驗和儲存方式
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'interpretation' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="message-2" sizePreset="md" decorative />
              解讀偏好設定
            </h3>

            <div className="space-y-4">
              {/* Character Voice */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  預設角色聲音
                </label>
                <select
                  value={preferences.default_character_voice}
                  onChange={(e) => updateInterpretationSettings({ preferred_character_voice: e.target.value })}
                  className="
                    w-full px-3 py-2 rounded
                    bg-wasteland-dark border border-pip-boy-green/40
                    text-pip-boy-green
                    focus:outline-none focus:border-pip-boy-green
                  "
                >
                  <option value="pip_boy">Pip-Boy (電腦合成)</option>
                  <option value="mr_handy">Mr. Handy (機器人助手)</option>
                  <option value="overseer">Overseer (監督官)</option>
                  <option value="mysterious_stranger">Mysterious Stranger (神秘訪客)</option>
                </select>
              </div>

              {/* Interpretation Depth */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  解讀深度
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['simple', 'medium', 'deep'].map(depth => (
                    <button
                      key={depth}
                      onClick={() => updateInterpretationSettings({ depth })}
                      className={`
                        p-3 rounded border-2 transition-all text-sm
                        ${depth === 'medium' // 預設選中 medium
                          ? 'border-pip-boy-green bg-pip-boy-green/10'
                          : 'border-pip-boy-green/20 hover:border-pip-boy-green/40'
                        }
                      `}
                    >
                      {depth === 'simple' && '簡單'}
                      {depth === 'medium' && '中等'}
                      {depth === 'deep' && '深入'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interpretation Style */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  解讀風格
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'balanced', label: '平衡' },
                    { value: 'mystical', label: '神秘' },
                    { value: 'practical', label: '實用' },
                    { value: 'psychological', label: '心理' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateInterpretationSettings({ style: value })}
                      className={`
                        p-3 rounded border-2 transition-all text-sm
                        ${value === 'balanced' // 預設選中 balanced
                          ? 'border-pip-boy-green bg-pip-boy-green/10'
                          : 'border-pip-boy-green/20 hover:border-pip-boy-green/40'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-pip-boy-green/5 border-pip-boy-green/40">
            <p className="text-sm text-wasteland-tan/80">
              <PixelIcon name="info" sizePreset="sm" className="inline mr-2 text-pip-boy-green" decorative />
              提示：解讀設定會影響 AI 生成的解讀內容風格和深度
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="notification" sizePreset="md" decorative />
              通知偏好設定
            </h3>

            <div className="space-y-3">
              {/* Email Notifications */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Email 通知</p>
                  <p className="text-xs text-wasteland-tan/60">接收重要更新和活動通知</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => updateNotificationSettings({ enable_email_notifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Daily Reading Reminder */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">每日閱讀提醒</p>
                  <p className="text-xs text-wasteland-tan/60">提醒你進行每日塔羅閱讀</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.daily_reading_reminder}
                  onChange={(e) => updateNotificationSettings({ enable_reading_reminders: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Friend Activity Notifications */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">好友動態通知</p>
                  <p className="text-xs text-wasteland-tan/60">當好友分享閱讀時通知你</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.friend_activity_notifications}
                  onChange={(e) => updateNotificationSettings({ enable_email_notifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Community Updates */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">社群更新</p>
                  <p className="text-xs text-wasteland-tan/60">接收社群活動和更新資訊</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.community_updates}
                  onChange={(e) => updateNotificationSettings({ enable_email_notifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Reminder Time */}
              {preferences.daily_reading_reminder && (
                <div className="p-3 rounded border border-pip-boy-green/20">
                  <label className="block text-sm font-medium mb-2">
                    提醒時間
                  </label>
                  <input
                    type="time"
                    value={preferences.reading_reminder_time || '09:00'}
                    onChange={(e) => updateNotificationSettings({ reminder_time: e.target.value })}
                    className="
                      w-full px-3 py-2 rounded
                      bg-wasteland-dark border border-pip-boy-green/40
                      text-pip-boy-green
                      focus:outline-none focus:border-pip-boy-green
                    "
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-pip-boy-green/5 border-pip-boy-green/40">
            <p className="text-sm text-wasteland-tan/80">
              <PixelIcon name="info" sizePreset="sm" className="inline mr-2 text-pip-boy-green" decorative />
              提示：你可以隨時在這裡管理通知偏好
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PixelIcon name="lock" sizePreset="md" decorative />
              隱私設定
            </h3>

            <div className="space-y-3">
              {/* Public Profile */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">公開個人資料</p>
                  <p className="text-xs text-wasteland-tan/60">允許其他使用者查看你的個人資料</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.public_profile}
                  onChange={(e) => updatePrivacySettings({ profile_visibility: e.target.checked ? 'public' : 'private' })}
                  className="w-5 h-5"
                />
              </label>

              {/* Allow Friend Requests */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">允許好友請求</p>
                  <p className="text-xs text-wasteland-tan/60">其他使用者可以向你發送好友請求</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.allow_friend_requests}
                  onChange={(e) => updatePrivacySettings({ allow_reading_sharing: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Share Reading History */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">分享閱讀歷史</p>
                  <p className="text-xs text-wasteland-tan/60">允許好友查看你的閱讀歷史</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.share_reading_history}
                  onChange={(e) => updatePrivacySettings({ allow_reading_sharing: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              {/* Data Collection Consent */}
              <label className="flex items-center justify-between p-3 rounded hover:bg-pip-boy-green/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">匿名數據分析</p>
                  <p className="text-xs text-wasteland-tan/60">幫助我們改善服務（完全匿名）</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.data_collection_consent}
                  onChange={(e) => updatePrivacySettings({ anonymous_analytics: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Card>

          <Card className="p-6 bg-radiation-orange/10 border-radiation-orange/40">
            <p className="text-sm text-wasteland-tan/80">
              <PixelIcon name="alert" sizePreset="sm" className="inline mr-2 text-radiation-orange" decorative />
              警告：關閉所有隱私設定可能會限制某些社交功能
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* 認證方式管理（主要功能） */}
          <AuthMethodsManagement />

          {/* 關於多重認證方式資訊卡片 */}
          <Card className="p-6 bg-pip-boy-green/5 border-pip-boy-green/40">
            <div className="flex items-start gap-3">
              <PixelIcon name="info" sizePreset="md" className="text-pip-boy-green mt-0.5 flex-shrink-0" decorative />
              <div className="text-sm text-wasteland-tan/80">
                <p className="font-semibold mb-1">關於多重認證方式</p>
                <p className="text-xs">
                  你可以為帳號設定多種登入方式以提升安全性和便利性：
                </p>
                <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Passkey</strong>：使用生物辨識（指紋、Face ID）或安全金鑰，無法被釣魚攻擊</li>
                  <li><strong>Google OAuth</strong>：使用 Google 帳號快速登入，無需記憶密碼</li>
                  <li><strong>Email + 密碼</strong>：傳統登入方式，適合沒有生物辨識裝置的情境</li>
                </ul>
                <p className="text-xs mt-2 text-radiation-orange">
                  <PixelIcon name="alert" sizePreset="xs" className="inline mr-1" decorative />
                  至少需要保留一種認證方式才能登入帳號
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
