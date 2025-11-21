'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { useAuthStore } from '@/lib/authStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { useAchievementStore, AchievementStatus } from '@/lib/stores/achievementStore';
import { PixelIcon } from '@/components/ui/icons';
import { ProfileService } from '@/services/profile.service';
import { AnalyticsService } from '@/services/analytics.service';
import { ReadingService } from '@/services/readings.service';
import { CardService } from '@/services/cards.service';
import { useFactions } from '@/hooks/useCharacterVoices';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { TitleSelector } from '@/components/profile/TitleSelector';
import { useTitleStore } from '@/lib/stores/titleStore';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';import { Button } from "@/components/ui/button";

interface UserProfile {
  username: string;
  email: string;
  joinDate: string;
  karmaLevel: string;
  totalReadings: number;
  favoriteCard: string;
  favoriteCardName: string; // 新增：最常抽到的卡片名稱
  monthlyReadings: number; // 新增：本月占卜次數
  favoritedCount: number; // 新增：收藏數量
  faction: string;
  pipBoyModel: string;
  notificationPreferences: {
    dailyReadings: boolean;
    weeklyInsights: boolean;
    systemUpdates: boolean;
  };
}

export default function ProfilePage() {
  // 統一認證檢查（自動處理初始化、重導向、日誌）
  const { isReady, user } = useRequireAuth();
  const logout = useAuthStore((s) => s.logout);
  const isOAuthUser = useAuthStore((s) => s.isOAuthUser);
  const oauthProvider = useAuthStore((s) => s.oauthProvider);
  const profilePicture = useAuthStore((s) => s.profilePicture);
  const updateAvatarUrl = useAuthStore((s) => s.updateAvatarUrl);

  // 音效系統狀態
  const sfxVolume = useAudioStore((s) => s.volumes.sfx);
  const sfxMuted = useAudioStore((s) => s.muted.sfx);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  // 成就系統狀態
  const { summary, userProgress, fetchSummary, fetchUserProgress } = useAchievementStore();

  // 稱號系統狀態
  const currentTitle = useTitleStore((s) => s.currentTitle);

  // ✅ 使用 API 載入陣營資料
  const { factions, isLoading: isLoadingFactions } = useFactions();

  // URL 參數支援
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ✅ 輔助函式：根據 faction key 取得顯示名稱
  const getFactionLabel = (factionKey: string): string => {
    if (!factions || factions.length === 0) return factionKey;
    const faction = factions.find((f) => f.key === factionKey);
    return faction?.name || factionKey;
  };

  useEffect(() => {
    const loadProfile = async () => {
      // 簡潔的檢查
      if (!isReady) return;

      console.log('[Profile] 📊 開始載入 Profile 資料...');
      setIsLoading(true);

      try {
        // 載入 analytics 數據
        let favoriteCardName = '無';
        let monthlyReadings = 0;
        let favoritedCount = 0;

        try {
          const analytics = await AnalyticsService.getUserAnalytics();
          const mostDrawnCards = analytics.user_analytics.most_drawn_cards || [];
          favoritedCount = (analytics.user_analytics.favorited_cards || []).length;

          // 取得最常抽到的卡片名稱
          if (mostDrawnCards.length > 0) {
            try {
              const mostDrawnCardId = mostDrawnCards[0];
              const card = await CardService.getById(mostDrawnCardId);
              favoriteCardName = card.name;
            } catch (err) {
              console.warn('Failed to load favorite card:', err);
            }
          }

          // 計算本月占卜次數
          try {
            const response = await ReadingService.getUserReadings(user.id);
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            monthlyReadings = response.readings.filter((reading) => {
              const readingDate = new Date(reading.created_at);
              return readingDate.getMonth() === thisMonth && readingDate.getFullYear() === thisYear;
            }).length;
          } catch (err) {
            console.warn('Failed to calculate monthly readings:', err);
          }
        } catch (err) {
          console.warn('Failed to load analytics:', err);
        }

        // Construct profile from user data and analytics
        const userProfile: UserProfile = {
          username: user.name || 'Vault Dweller', // User model 只有 name，沒有 username
          email: user.email || 'dweller@vault-tec.com',
          joinDate: user.created_at || new Date().toISOString(),
          karmaLevel: user.experience_level || '新手流浪者',
          totalReadings: user.total_readings || 0,
          favoriteCard: user.favorite_card_suit || '未知',
          favoriteCardName, // 最常抽到的卡片名稱
          monthlyReadings, // 本月占卜次數
          favoritedCount, // 收藏數量
          faction: user.faction_alignment || 'independent',
          pipBoyModel: '3000 Mark IV',
          notificationPreferences: {
            dailyReadings: true,
            weeklyInsights: false,
            systemUpdates: true
          }
        };

        setProfile(userProfile);
        setEditForm(userProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to basic user data
        const fallbackProfile: UserProfile = {
          username: user.name || 'Vault Dweller', // User model 只有 name，沒有 username
          email: user.email || '',
          joinDate: user.created_at || new Date().toISOString(),
          karmaLevel: user.experience_level || '新手居民',
          totalReadings: user.total_readings || 0,
          favoriteCard: user.favorite_card_suit || '未知',
          favoriteCardName: '無',
          monthlyReadings: 0,
          favoritedCount: 0,
          faction: user.faction_alignment || 'independent',
          pipBoyModel: '3000 Mark IV',
          notificationPreferences: {
            dailyReadings: true,
            weeklyInsights: false,
            systemUpdates: true
          }
        };
        setProfile(fallbackProfile);
        setEditForm(fallbackProfile);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
      // 載入成就資料
      fetchSummary();
      fetchUserProgress();
    }
  }, [isReady, user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profile || {});
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // 調用後端 API 更新 profile
      const response = await ProfileService.updateProfile({
        faction_alignment: editForm.faction
        // 未來可擴展其他欄位
        // display_name: editForm.username,
        // bio: editForm.bio,
        // wasteland_location: editForm.location,
      });

      // 更新成功後更新本地狀態
      const updatedProfile = { ...profile, ...editForm };
      setProfile(updatedProfile);
      setEditForm(updatedProfile);
      setIsEditing(false);

      console.log('Profile updated successfully:', response.message);
      toast.success('檔案更新成功', {
        description: '你的個人資料已成功儲存',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('儲存失敗', {
        description: error instanceof Error ? error.message : '請稍後再試',
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: keyof UserProfile['notificationPreferences']) => {
    setEditForm((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [field]: !prev.notificationPreferences?.[field]
      }
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInService = () => {
    if (!profile?.joinDate) return 0;
    const joinDate = new Date(profile.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
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
            className="px-6 py-3 bg-pip-boy-green text-wasteland-dark font-bold hover:bg-pip-boy-green/80 transition-colors">

登入 Pip-Boy
          </Link>
        </div>
      </div>);

  }

  // 統一載入畫面
  if (!isReady || isLoading || !profile) {
    return <AuthLoading isVerifying={!isReady} />;
  }

  return (
    <div className="min-h-screen bg-transparent p-4">
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
            {!isEditing &&
            <Button size="default" variant="outline"
            onClick={handleEdit}
            className="px-4 py-2 border transition-colors">

                <PixelIcon name="edit" size={16} className="mr-2 inline" aria-label="編輯檔案" />編輯檔案
              </Button>
            }
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              {/* Avatar Upload Component */}
              <AvatarUpload
                currentAvatarUrl={user?.avatar_url || (isOAuthUser ? profilePicture : undefined)}
                onUploadSuccess={(newAvatarUrl) => {
                  console.log('頭像上傳成功，新 URL:', newAvatarUrl);
                  // 更新 authStore 中的 user.avatar_url
                  updateAvatarUrl(newAvatarUrl);
                }} />


              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-pip-boy-green">
                  {user?.name || profile.username}
                </h2>
                <p className="text-pip-boy-green/70 text-sm">
                  Vault Dweller
                </p>

                {/* OAuth Badge */}
                {isOAuthUser &&
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 border border-pip-boy-green/50 bg-pip-boy-green/10 rounded-full">
                    <svg className="w-4 h-4 text-pip-boy-green" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    </svg>
                    <span className="text-pip-boy-green text-xs">已連結 Google 帳號</span>
                  </div>
                }
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
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm">

                  <PixelIcon name="magic" size={16} className="mr-2 inline" decorative />新占卜
                </Link>
                <Link
                  href="/cards"
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm">

                  <PixelIcon name="library" size={16} className="mr-2 inline" decorative />卡牌圖書館
                </Link>
                <Link
                  href="/readings"
                  className="block text-center py-2 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm">

                  <PixelIcon name="scroll" size={16} className="mr-2 inline" decorative />占卜歷史
                </Link>
              </div>
            </div>

            {/* Sound Effects Control */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-pip-boy-green font-bold">音效系統</h3>
                <Button size="icon" variant="outline"
                onClick={() => toggleMute('sfx')}
                className="p-1.5 border transition-colors"
                aria-label={sfxMuted ? '取消靜音' : '靜音'}>

                  <PixelIcon
                    name={sfxMuted ? "volume-off" : "volume-up"}
                    size={16}
                    aria-label={sfxMuted ? '已靜音' : '音效開啟'} />

                </Button>
              </div>

              <div className="space-y-3">
                {/* Volume Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-pip-boy-green/70 text-xs">音效音量</label>
                    <span className="text-pip-boy-green text-xs font-mono">
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
                    {[...Array(10)].map((_, i) =>
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-sm transition-all duration-200 ${
                      i < Math.round(sfxVolume * 10) && !sfxMuted ?
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
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4">
                <PixelIcon name="clipboard" size={24} className="mr-2 inline" decorative />個人資訊
              </h3>

              {isEditing ?
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Login Method - New Field */}
                    <div className="md:col-span-2">
                      <p className="text-pip-boy-green/70 text-sm">登入方式</p>
                      <p className="text-pip-boy-green">
                        {isOAuthUser ?
                      <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            </svg>
                            Google OAuth
                          </span> :

                      'Email + Password'
                      }
                      </p>
                    </div>

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
                </div>
              }
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
                    disabled={!isEditing} />

                  每日占卜推薦
                </label>

                <label className="flex items-center text-pip-boy-green text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.notificationPreferences?.weeklyInsights || false}
                    onChange={() => handleNotificationChange('weeklyInsights')}
                    className="mr-3 accent-pip-boy-green"
                    disabled={!isEditing} />

                  每週塔羅洞察
                </label>

                <label className="flex items-center text-pip-boy-green text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.notificationPreferences?.systemUpdates || false}
                    onChange={() => handleNotificationChange('systemUpdates')}
                    className="mr-3 accent-pip-boy-green"
                    disabled={!isEditing} />

                  系統和安全更新
                </label>
              </div>
            </div>

            {/* Achievements Overview */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-pip-boy-green">
                  <PixelIcon name="trophy" size={24} className="mr-2 inline" decorative />成就系統
                </h3>
                <Link
                  href="/achievements"
                  className="text-pip-boy-green/70 hover:text-pip-boy-green text-sm transition-colors">

                  查看全部 <PixelIcon name="chevron-right" size={16} className="inline" decorative />
                </Link>
              </div>

              {summary ?
              <>
                  {/* Achievement Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 border border-pip-boy-green/20 bg-pip-boy-green/5">
                      <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                        {summary.unlocked_count}
                      </div>
                      <div className="text-pip-boy-green/70 text-xs">已解鎖</div>
                    </div>

                    <div className="text-center p-3 border border-pip-boy-green/20 bg-pip-boy-green/5">
                      <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                        {summary.total_achievements}
                      </div>
                      <div className="text-pip-boy-green/70 text-xs">總成就</div>
                    </div>

                    <div className="text-center p-3 border border-pip-boy-green/20 bg-pip-boy-green/5">
                      <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                        {Math.round(summary.completion_percentage)}%
                      </div>
                      <div className="text-pip-boy-green/70 text-xs">完成度</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-pip-boy-green/70 mb-1">
                      <span>總進度</span>
                      <span>{summary.unlocked_count} / {summary.total_achievements}</span>
                    </div>
                    <div className="h-2 bg-black border border-pip-boy-green/30 rounded-sm overflow-hidden">
                      <div
                      className="h-full bg-pip-boy-green transition-all duration-500 shadow-[0_0_8px_rgba(0,255,136,0.6)]"
                      style={{ width: `${summary.completion_percentage}%` }} />

                    </div>
                  </div>

                  {/* Recent Unlocked Achievements */}
                  {(() => {
                  const recentlyUnlocked = userProgress.
                  filter((p) => p.status === AchievementStatus.UNLOCKED || p.status === AchievementStatus.CLAIMED).
                  filter((p) => p.unlocked_at).
                  sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()).
                  slice(0, 3);

                  return recentlyUnlocked.length > 0 ?
                  <div>
                        <div className="text-pip-boy-green/70 text-xs mb-2">最近解鎖</div>
                        <div className="space-y-2">
                          {recentlyUnlocked.map((progress) =>
                      <div
                        key={progress.id}
                        className="flex items-center gap-3 p-2 border border-pip-boy-green/20 bg-pip-boy-green/5 hover:bg-pip-boy-green/10 transition-colors">

                              <div className="flex-shrink-0">
                                <PixelIcon
                            name={progress.achievement.icon_name || 'trophy'}
                            sizePreset="md"
                            variant="primary"
                            decorative />

                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-pip-boy-green text-sm font-semibold truncate">
                                  {progress.achievement.name}
                                </div>
                                <div className="text-pip-boy-green/60 text-xs">
                                  {progress.unlocked_at && new Date(progress.unlocked_at).toLocaleDateString('zh-TW')}
                                </div>
                              </div>
                              {progress.status === AchievementStatus.UNLOCKED &&
                        <div className="flex-shrink-0">
                                  <span className="text-xs text-pip-boy-green border border-pip-boy-green/50 px-2 py-1 rounded-sm">
                                    待領取
                                  </span>
                                </div>
                        }
                            </div>
                      )}
                        </div>
                      </div> :

                  <div className="text-center py-6 text-pip-boy-green/50 text-sm">
                        <PixelIcon name="trophy" sizePreset="lg" variant="muted" decorative />
                        <p className="mt-2">尚未解鎖任何成就</p>
                        <p className="text-xs mt-1">探索廢土來獲得成就吧！</p>
                      </div>;

                })()}
                </> :

              <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-pip-boy-green/70 text-sm">載入成就資料中...</p>
                </div>
              }
            </div>

            {/* Statistics */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <h3 className="text-xl font-bold text-pip-boy-green mb-4">
                <PixelIcon name="chart-bar" size={24} className="mr-2 inline" decorative />占卜統計
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green numeric tabular-nums">
                    {profile.totalReadings}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">總占卜次數</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green numeric tabular-nums">{profile.monthlyReadings}</div>
                  <div className="text-pip-boy-green/70 text-xs">本月</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-pip-boy-green numeric tabular-nums">{profile.favoritedCount}</div>
                  <div className="text-pip-boy-green/70 text-xs">收藏</div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-bold text-pip-boy-green">
                    {profile.favoriteCardName}
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
                  <Button size="default" variant="outline"
                  onClick={logout}
                  className="px-4 py-2 border transition-colors">

                    <PixelIcon name="logout" size={16} className="mr-2 inline" aria-label="登出" />登出
                  </Button>
                </div>

                <div>
                  <p className="text-red-400/80 text-sm mb-2">
                    永久刪除你的 Vault 居民帳戶和所有占卜資料
                  </p>
                  <Button size="default" variant="link"
                  className="px-4 py-2 transition-colors"
                  onClick={() => alert('Account deletion not implemented in this demo')}>

                    <PixelIcon name="trash" size={16} className="mr-2 inline" aria-label="刪除帳戶" />刪除帳戶
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}