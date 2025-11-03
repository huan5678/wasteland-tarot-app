'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface SettingsTabProps {
  user: any;
  profile: any;
  isEditing: boolean;
  editForm: any;
  isSaving: boolean;
  isLoadingFactions: boolean;
  factions: any[];
  sfxVolume: number;
  sfxMuted: boolean;
  handleInputChange: (field: string, value: any) => void;
  handleNotificationChange: (field: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
  setVolume: (type: string, value: number) => void;
  toggleMute: (type: string) => void;
  formatDate: (dateString: string) => string;
  getFactionLabel: (factionKey: string) => string;
}

// 通知偏好配置
const NOTIFICATION_PREFERENCES = [
{
  key: 'dailyReadings',
  label: '每日占卜推薦'
},
{
  key: 'weeklyInsights',
  label: '每週塔羅洞察'
},
{
  key: 'systemUpdates',
  label: '系統和安全更新'
}] as
const;

// 音量視覺指示器數量
const VOLUME_INDICATOR_COUNT = 10;

export function SettingsTab({
  user,
  profile,
  isEditing,
  editForm,
  isSaving,
  isLoadingFactions,
  factions,
  sfxVolume,
  sfxMuted,
  handleInputChange,
  handleNotificationChange,
  handleSave,
  handleCancel,
  setVolume,
  toggleMute,
  formatDate,
  getFactionLabel
}: SettingsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <h3 className="text-xl font-bold text-pip-boy-green mb-4">
          <PixelIcon name="clipboard" size={24} className="mr-2 inline" decorative />個人資訊
        </h3>

        {isEditing ?
        <div className="space-y-4">
            <div>
              <label className="block text-pip-boy-green text-sm mb-2">
                名稱
              </label>
              <input
              type="text"
              value={editForm.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
              maxLength={50} />

              <p className="text-pip-boy-green/50 text-xs mt-1">
                可編輯 (1-50 字元)
              </p>
            </div>

            <div>
              <label className="block text-pip-boy-green text-sm mb-2">
                Email 信箱
              </label>
              <input
              type="email"
              value={editForm.email || ''}
              disabled
              className="w-full px-3 py-2 bg-black/50 border border-pip-boy-green/50 text-pip-boy-green/70 cursor-not-allowed" />

              <p className="text-pip-boy-green/50 text-xs mt-1">
                Email 無法變更
              </p>
            </div>

            <div>
              <label className="block text-pip-boy-green text-sm mb-2">
                陣營歸屬
              </label>
              <select
              value={editForm.faction || ''}
              onChange={(e) => handleInputChange('faction', e.target.value)}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
              disabled={isLoadingFactions}>

                {isLoadingFactions ?
              <option value="">載入陣營資料中...</option> :

              factions.map((faction) =>
              <option key={faction.id} value={faction.key}>
                      {faction.name}
                    </option>
              )
              }
              </select>
            </div>

            <div className="flex gap-4">
              <Button size="icon" variant="link"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2 font-bold disabled:opacity-50 transition-colors">

                {isSaving ? '儲存中...' : <><PixelIcon name="save" size={16} className="mr-2 inline" decorative />儲存變更</>}
              </Button>
              <Button size="default" variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 py-2 border disabled:opacity-50 transition-colors">

                取消
              </Button>
            </div>
          </div> :

        <div className="space-y-4">
            <div>
              <p className="text-pip-boy-green/70 text-sm">名稱</p>
              <p className="text-pip-boy-green">{user?.name || profile.username}</p>
            </div>
            <div>
              <p className="text-pip-boy-green/70 text-sm">Email 信箱</p>
              <p className="text-pip-boy-green">{user?.email || profile.email}</p>
            </div>
            <div>
              <p className="text-pip-boy-green/70 text-sm">加入日期</p>
              <p className="text-pip-boy-green">{formatDate(profile.joinDate)}</p>
            </div>
            <div>
              <p className="text-pip-boy-green/70 text-sm">陣營歸屬</p>
              <p className="text-pip-boy-green">{getFactionLabel(profile.faction)}</p>
            </div>
            <div>
              <p className="text-pip-boy-green/70 text-sm">Pip-Boy 型號</p>
              <p className="text-pip-boy-green">{profile.pipBoyModel}</p>
            </div>
          </div>
        }
      </div>

      {/* Preferences */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <h3 className="text-xl font-bold text-pip-boy-green mb-4">
          <PixelIcon name="notification" size={24} className="mr-2 inline" decorative />通知偏好設定
        </h3>

        <div className="space-y-3">
          {NOTIFICATION_PREFERENCES.map((pref) =>
          <label key={pref.key} className="flex items-center text-pip-boy-green text-sm">
              <input
              type="checkbox"
              checked={editForm.notificationPreferences?.[pref.key] || false}
              onChange={() => handleNotificationChange(pref.key)}
              className="mr-3 accent-pip-boy-green"
              disabled={!isEditing} />

              {pref.label}
            </label>
          )}
        </div>
      </div>

      {/* Sound Effects Control - Full Width */}
      <div className="lg:col-span-2 border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-pip-boy-green">
            <PixelIcon name="volume-up" size={24} className="mr-2 inline" decorative />音效系統
          </h3>
          <Button size="icon" variant="outline"
          onClick={() => toggleMute('sfx')}
          className="px-4 py-2 border transition-colors"
          aria-label={sfxMuted ? '取消靜音' : '靜音'}>

            <PixelIcon
              name={sfxMuted ? "volume-off" : "volume-up"}
              size={16}
              className="mr-2 inline"
              aria-label={sfxMuted ? '已靜音' : '音效開啟'} />

            {sfxMuted ? '已靜音' : '音效開啟'}
          </Button>
        </div>

        <div className="space-y-3">
          {/* Volume Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-pip-boy-green/70 text-sm">音效音量</label>
              <span className="text-pip-boy-green text-sm font-mono">
                {sfxMuted ? '靜音' : `${Math.round(sfxVolume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume * 100}
              onChange={(e) => setVolume('sfx', Number(e.target.value) / 100)}
              disabled={sfxMuted}
              className="w-full h-2 bg-black border border-pip-boy-green/30 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pip-boy-green [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-pip-boy-green-dark [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,136,0.6)]
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-pip-boy-green [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-pip-boy-green-dark [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(0,255,136,0.6)]"


              aria-label="音效音量" />

          </div>

          {/* Info Text */}
          <p className="text-pip-boy-green/50 text-xs leading-relaxed">
            控制卡牌翻轉、按鈕點擊等互動音效的音量。音量設定會自動儲存。
          </p>

          {/* Visual Indicator */}
          <div className="flex items-center gap-2 pt-2 border-t border-pip-boy-green/20">
            <div className="flex-1 flex gap-1">
              {Array.from({ length: VOLUME_INDICATOR_COUNT }).map((_, i) =>
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-sm transition-all duration-200 ${
                i < Math.round(sfxVolume * VOLUME_INDICATOR_COUNT) && !sfxMuted ?
                'bg-pip-boy-green shadow-[0_0_4px_rgba(0,255,136,0.6)]' :
                'bg-pip-boy-green/20'}`
                } />

              )}
            </div>
            <span className="text-pip-boy-green/50 text-xs font-mono min-w-[32px] text-right">
              {sfxMuted ? 'OFF' : 'ON'}
            </span>
          </div>
        </div>
      </div>
    </div>);

}