'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AuthLoading } from '@/components/auth/AuthLoading';
import { useAuthStore } from '@/lib/authStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { useAchievementStore } from '@/lib/stores/achievementStore';
import { PixelIcon } from '@/components/ui/icons';
import { profileAPI, analyticsAPI, readingsAPI, cardsAPI } from '@/lib/api/services';
import { useFactions } from '@/hooks/useCharacterVoices';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { TitleSelector } from '@/components/profile/TitleSelector';
import { useTitleStore } from '@/lib/stores/titleStore';
import { toast } from 'sonner';
import { PipBoyTabs, PipBoyTabsList, PipBoyTabsTrigger, PipBoyTabsContent } from '@/components/ui/pipboy-tabs';
import { OverviewTab } from '@/components/profile/tabs/OverviewTab';
import { AchievementsTab } from '@/components/profile/tabs/AchievementsTab';
import { SettingsTab } from '@/components/profile/tabs/SettingsTab';
import { AccountTab } from '@/components/profile/tabs/AccountTab';
import { Button } from "@/components/ui/button";
import { PullToRefresh } from '@/components/mobile';
import { useIsMobile } from '@/hooks/useMediaQuery';

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

// Tab 配置
const PROFILE_TABS = [
{ value: 'overview', label: '總覽', icon: 'home' },
{ value: 'achievements', label: '成就', icon: 'trophy' },
{ value: 'settings', label: '設定', icon: 'settings' },
{ value: 'account', label: '帳戶', icon: 'user' }] as
const;

export function ProfilePageContent() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOAuthUser = useAuthStore((s) => s.isOAuthUser);
  const oauthProvider = useAuthStore((s) => s.oauthProvider);
  const profilePicture = useAuthStore((s) => s.profilePicture);
  const updateAvatarUrl = useAuthStore((s) => s.updateAvatarUrl);
  const isMobile = useIsMobile();

  // 音效系統狀態
  const sfxVolume = useAudioStore((s) => s.volumes.sfx);
  const sfxMuted = useAudioStore((s) => s.muted.sfx);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  // 成就系統狀態
  const { summary, userProgress, fetchSummary, fetchUserProgress } = useAchievementStore();

  // ✅ 使用 API 載入陣營資料
  const { factions, isLoading: isLoadingFactions } = useFactions();

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
      // 確保認證狀態已初始化且用戶存在
      if (!useAuthStore.getState().isInitialized || !user?.id) {
        console.log('[Profile] ⏳ 等待認證初始化...');
        return;
      }

      console.log('[Profile] 📊 開始載入 Profile 資料...');
      console.log('[Profile] 👤 User 資料:', {
        id: user.id,
        name: user.name,
        email: user.email,
        total_readings: user.total_readings,
        experience_level: user.experience_level,
        faction_alignment: user.faction_alignment
      });
      setIsLoading(true);

      try {
        // ✅ 使用新的統計 API（後端計算所有數據）
        let favoriteCardName = '無';
        let monthlyReadings = 0;
        let favoritedCount = 0;
        let totalReadingsCount = 0;

        try {
          // 載入 analytics 數據（收藏卡片資料）
          const analytics = await analyticsAPI.getUserAnalytics();
          console.log('[Profile] 📈 Analytics 資料:', analytics);
          const mostDrawnCards = analytics.user_analytics.most_drawn_cards || [];
          favoritedCount = (analytics.user_analytics.favorited_cards || []).length;

          // 取得最常抽到的卡片名稱
          if (mostDrawnCards.length > 0) {
            try {
              const mostDrawnCardId = mostDrawnCards[0];
              const card = await cardsAPI.getById(mostDrawnCardId);
              favoriteCardName = card.name;
            } catch (err) {
              console.warn('Failed to load favorite card:', err);
            }
          }

          // ✅ 使用後端統計 API（總數與本月由後端計算）
          try {
            const stats = await readingsAPI.getPersonalStats();
            console.log('[Profile] 📊 Reading 統計資料 (後端):', stats);

            totalReadingsCount = stats.total_readings;
            monthlyReadings = stats.readings_this_month;

            console.log('[Profile] ✅ 總占卜次數:', totalReadingsCount);
            console.log('[Profile] ✅ 本月占卜次數:', monthlyReadings);
          } catch (err) {
            console.warn('Failed to load reading stats:', err);
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
          totalReadings: totalReadingsCount, // ✅ 使用實際 API 計算的數量
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

        console.log('[Profile] ✅ 最終 Profile 資料:', userProfile);
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
      console.log('[Profile] 🏆 開始載入成就資料...');
      fetchSummary().then((result) => {
        console.log('[Profile] 🏆 成就摘要載入完成:', result);
      }).catch((err) => {
        console.error('[Profile] ❌ 成就摘要載入失敗:', err);
      });
      fetchUserProgress().then((result) => {
        console.log('[Profile] 🏆 用戶成就進度載入完成，數量:', result?.length || 0);
      }).catch((err) => {
        console.error('[Profile] ❌ 用戶成就進度載入失敗:', err);
      });
    }
  }, [user]);

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
      const response = await profileAPI.updateProfile({
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

  // Pull-to-refresh handler for mobile
  const handleRefresh = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Reload all profile data
      const [analytics, stats] = await Promise.all([
        analyticsAPI.getUserAnalytics().catch(() => null),
        readingsAPI.getPersonalStats().catch(() => null)
      ]);

      let favoriteCardName = '無';
      let favoritedCount = 0;
      
      if (analytics) {
        const mostDrawnCards = analytics.user_analytics.most_drawn_cards || [];
        favoritedCount = (analytics.user_analytics.favorited_cards || []).length;
        
        if (mostDrawnCards.length > 0) {
          try {
            const card = await cardsAPI.getById(mostDrawnCards[0]);
            favoriteCardName = card.name;
          } catch {}
        }
      }

      const totalReadingsCount = stats?.total_readings || 0;
      const monthlyReadings = stats?.readings_this_month || 0;

      const updatedProfile: UserProfile = {
        ...profile!,
        totalReadings: totalReadingsCount,
        monthlyReadings,
        favoriteCardName,
        favoritedCount
      };

      setProfile(updatedProfile);

      // Refresh achievements
      await Promise.all([
        fetchSummary(),
        fetchUserProgress()
      ]);
    } catch (error) {
      console.error('[Profile] Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入居民檔案中...</p>
        </div>
      </div>);

  }

  const profileContent = (
    <div className="min-h-screen bg-transparent p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-pip-boy-green">
              Vault 居民檔案
            </h1>
            <p className="text-pip-boy-green/70 text-sm">
              個人資料管理系統 - ID: {profile.username}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <PipBoyTabs defaultValue="overview" className="w-full">
          <PipBoyTabsList>
            {PROFILE_TABS.map((tab) => (
              <PipBoyTabsTrigger
                key={tab.value}
                value={tab.value}
                icon={tab.icon}
              >
                {tab.label}
              </PipBoyTabsTrigger>
            ))}
          </PipBoyTabsList>

          {/* Tab 1: Overview */}
          <PipBoyTabsContent value="overview" className="space-y-6">
            <OverviewTab
              user={user}
              profile={profile}
              isOAuthUser={isOAuthUser}
              profilePicture={profilePicture}
              updateAvatarUrl={updateAvatarUrl}
              getDaysInService={getDaysInService} />

          </PipBoyTabsContent>

          {/* Tab 2: Achievements */}
          <PipBoyTabsContent value="achievements" className="space-y-6">
            <AchievementsTab
              summary={summary}
              userProgress={userProgress}
            />
          </PipBoyTabsContent>

          {/* Tab 3: Settings */}
          <PipBoyTabsContent value="settings" className="space-y-6">
            <SettingsTab
              user={user}
              profile={profile}
              isEditing={isEditing}
              editForm={editForm}
              isSaving={isSaving}
              isLoadingFactions={isLoadingFactions}
              factions={factions}
              sfxVolume={sfxVolume}
              sfxMuted={sfxMuted}
              handleInputChange={handleInputChange}
              handleNotificationChange={handleNotificationChange}
              handleSave={handleSave}
              handleCancel={handleCancel}
              setVolume={setVolume}
              toggleMute={toggleMute}
              formatDate={formatDate}
              getFactionLabel={getFactionLabel}
            />
          </PipBoyTabsContent>

          {/* Tab 4: Account */}
          <PipBoyTabsContent value="account" className="space-y-6">
            <AccountTab
              user={user}
              profile={profile}
              isOAuthUser={isOAuthUser}
              logout={logout}
            />
          </PipBoyTabsContent>
        </PipBoyTabs>
      </div>
    </div>
  );

  // Wrap with PullToRefresh on mobile
  return isMobile ? (
    <PullToRefresh onRefresh={handleRefresh}>
      {profileContent}
    </PullToRefresh>
  ) : profileContent;
}