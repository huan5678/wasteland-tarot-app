'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'

interface UserProfile {
  username: string
  email: string
  vault_number: string
  joinDate: string
  karmaLevel: string
  totalReadings: number
  favoriteCard: string
  faction: string
  pipBoyModel: string
  notificationPreferences: {
    dailyReadings: boolean
    weeklyInsights: boolean
    systemUpdates: boolean
  }
}

export default function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isOAuthUser = useAuthStore(s => s.isOAuthUser)
  const oauthProvider = useAuthStore(s => s.oauthProvider)
  const profilePicture = useAuthStore(s => s.profilePicture)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)

      // Simulate API loading delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock profile data
      const mockProfile: UserProfile = {
        username: user?.username || 'VaultDweller111',
        email: 'dweller@vault-tec.com',
        vault_number: user?.vault_number || '111',
        joinDate: '2023-10-01T00:00:00Z',
        karmaLevel: '善業流浪者',
        totalReadings: 24,
        favoriteCard: '愚者',
        faction: 'Minutemen',
        pipBoyModel: '3000 Mark IV',
        notificationPreferences: {
          dailyReadings: true,
          weeklyInsights: false,
          systemUpdates: true
        }
      }

      setProfile(mockProfile)
      setEditForm(mockProfile)
      setIsLoading(false)
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm(profile || {})
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)

    // Simulate API save delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Update profile with form data
    const updatedProfile = { ...profile, ...editForm }
    setProfile(updatedProfile)
    setIsEditing(false)
    setIsSaving(false)

    // TODO: Send to backend API
    console.log('Profile updated:', updatedProfile)
  }

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: keyof UserProfile['notificationPreferences']) => {
    setEditForm(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [field]: !prev.notificationPreferences?.[field]
      }
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysInService = () => {
    if (!profile?.joinDate) return 0
    const joinDate = new Date(profile.joinDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - joinDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-wasteland-dark flex items-center justify-center p-4">
        <div className="text-center">
          <PixelIcon name="lock" size={64} className="mb-4 mx-auto text-pip-boy-green" decorative />
          <h1 className="text-2xl font-bold text-pip-boy-green mb-4">
            存取被拒
          </h1>
          <p className="text-pip-boy-green/70 mb-6">
            你必須登入才能查看個人檔案
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-pip-boy-green text-wasteland-dark font-bold hover:bg-pip-boy-green/80 transition-colors"
          >
登入 Pip-Boy
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-wasteland-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入居民檔案中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-pip-boy-green">
                Vault 居民檔案
              </h1>
              <p className="text-pip-boy-green/70 text-sm">
                個人資料管理系統 - ID: {profile.username}
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 border border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/10 transition-colors"
              >
                <PixelIcon name="edit" size={16} className="mr-2 inline" aria-label="編輯檔案" />編輯檔案
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <div className="text-center mb-6">
                {/* Profile Picture - Show OAuth avatar if available */}
                <div className="w-24 h-24 border-2 border-pip-boy-green rounded-full flex items-center justify-center mx-auto mb-4 bg-pip-boy-green/10 overflow-hidden">
                  {isOAuthUser && profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PixelIcon name="user" size={64} className="text-pip-boy-green" decorative />
                  )}
                </div>

                <h2 className="text-xl font-bold text-pip-boy-green">
                  {user?.name || profile.username}
                </h2>
                <p className="text-pip-boy-green/70 text-sm">
                  Vault {profile.vault_number} 居民
                </p>

                {/* OAuth Badge */}
                {isOAuthUser && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 border border-pip-boy-green/50 bg-pip-boy-green/10 rounded-full">
                    <svg className="w-4 h-4 text-pip-boy-green" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    </svg>
                    <span className="text-pip-boy-green text-xs">已連結 Google 帳號</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                    {getDaysInService()}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">服務天數</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-pip-boy-green">
                    {profile.karmaLevel}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">業力狀態</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                    {profile.totalReadings}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">總占卜次數</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mt-6">
              <h3 className="text-pip-boy-green font-bold mb-3">快速動作</h3>
              <div className="space-y-2">
                <Link
                  href="/readings/new"
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm"
                >
                  <PixelIcon name="card-stack" size={16} className="mr-2 inline" decorative />新占卜
                </Link>
                <Link
                  href="/cards"
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm"
                >
                  <PixelIcon name="books" size={16} className="mr-2 inline" decorative />卡牌圖書館
                </Link>
                <Link
                  href="/readings"
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm"
                >
                  <PixelIcon name="scroll" size={16} className="mr-2 inline" decorative />占卜歷史
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4">
                <PixelIcon name="clipboard" size={24} className="mr-2 inline" decorative />個人資訊
              </h3>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Login Method Display */}
                  <div>
                    <label className="block text-pip-boy-green text-sm mb-2">
                      登入方式
                    </label>
                    <div className="w-full px-3 py-2 bg-black/50 border border-pip-boy-green/50 text-pip-boy-green">
                      {isOAuthUser ? `Google OAuth (${oauthProvider})` : 'Email + Password'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-pip-boy-green text-sm mb-2">
                      名稱
                    </label>
                    <input
                      type="text"
                      value={editForm.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
                      maxLength={50}
                    />
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
                      className="w-full px-3 py-2 bg-black/50 border border-pip-boy-green/50 text-pip-boy-green/70 cursor-not-allowed"
                    />
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
                    >
                      <option value="None">Independent</option>
                      <option value="Minutemen">Minutemen</option>
                      <option value="Brotherhood of Steel">Brotherhood of Steel</option>
                      <option value="Railroad">Railroad</option>
                      <option value="Institute">Institute</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-2 bg-pip-boy-green text-wasteland-dark font-bold hover:bg-pip-boy-green/80 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? '儲存中...' : <><PixelIcon name="save" size={16} className="mr-2 inline" decorative />儲存變更</>}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 py-2 border border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/10 disabled:opacity-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Login Method - New Field */}
                    <div className="md:col-span-2">
                      <p className="text-pip-boy-green/70 text-sm">登入方式</p>
                      <p className="text-pip-boy-green">
                        {isOAuthUser ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            </svg>
                            Google OAuth
                          </span>
                        ) : (
                          'Email + Password'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-pip-boy-green/70 text-sm">名稱</p>
                      <p className="text-pip-boy-green">{user?.name || profile.username}</p>
                    </div>
                    <div>
                      <p className="text-pip-boy-green/70 text-sm">Vault 指派</p>
                      <p className="text-pip-boy-green">Vault {profile.vault_number}</p>
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
                      <p className="text-pip-boy-green">{profile.faction}</p>
                    </div>
                    <div>
                      <p className="text-pip-boy-green/70 text-sm">Pip-Boy 型號</p>
                      <p className="text-pip-boy-green">{profile.pipBoyModel}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4">
                <PixelIcon name="settings" size={24} className="mr-2 inline" decorative />通知偏好設定
              </h3>

              <div className="space-y-3">
                <label className="flex items-center text-pip-boy-green text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.notificationPreferences?.dailyReadings || false}
                    onChange={() => handleNotificationChange('dailyReadings')}
                    className="mr-3 accent-pip-boy-green"
                    disabled={!isEditing}
                  />
                  每日占卜推薦
                </label>

                <label className="flex items-center text-pip-boy-green text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.notificationPreferences?.weeklyInsights || false}
                    onChange={() => handleNotificationChange('weeklyInsights')}
                    className="mr-3 accent-pip-boy-green"
                    disabled={!isEditing}
                  />
                  每週塔羅洞察
                </label>

                <label className="flex items-center text-pip-boy-green text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.notificationPreferences?.systemUpdates || false}
                    onChange={() => handleNotificationChange('systemUpdates')}
                    className="mr-3 accent-pip-boy-green"
                    disabled={!isEditing}
                  />
                  系統和安全更新
                </label>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4">
                <PixelIcon name="chart-bar" size={24} className="mr-2 inline" decorative />占卜統計
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green">
                    {profile.totalReadings}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">總占卜次數</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green">12</div>
                  <div className="text-pip-boy-green/70 text-xs">本月</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green">7</div>
                  <div className="text-pip-boy-green/70 text-xs">收藏</div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-bold text-pip-boy-green">
                    {profile.favoriteCard}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">最常抽到</div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-2 border-red-400/30 bg-red-900/10 p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">
                <PixelIcon name="alert-triangle" size={24} className="mr-2 inline" decorative />危險區域
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-red-400/80 text-sm mb-2">
                    登出所有 Pip-Boy 會話
                  </p>
                  <button
                    onClick={logout}
                    className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <PixelIcon name="logout" size={16} className="mr-2 inline" aria-label="登出" />登出
                  </button>
                </div>

                <div>
                  <p className="text-red-400/80 text-sm mb-2">
                    永久刪除你的 Vault 居民帳戶和所有占卜資料
                  </p>
                  <button
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    onClick={() => alert('Account deletion not implemented in this demo')}
                  >
                    <PixelIcon name="trash" size={16} className="mr-2 inline" aria-label="刪除帳戶" />刪除帳戶
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}