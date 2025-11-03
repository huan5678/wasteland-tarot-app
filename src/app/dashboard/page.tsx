'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { readingsAPI, cardsAPI, analyticsAPI } from '@/lib/api';
import { PixelIcon } from '@/components/ui/icons';
import { IncompleteSessionsList } from '@/components/session/IncompleteSessionsList';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAchievementStore, AchievementStatus } from '@/lib/stores/achievementStore';
import ActivityProgressCard from '@/components/activity/ActivityProgressCard';import { Button } from "@/components/ui/button";

interface Reading {
  id: string;
  date: string;
  question: string;
  cards: any[];
  spread_type: string;
  spread_template?: {
    id: string;
    name: string;
    display_name: string;
    spread_type: string;
  };
  interpretation: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const { isActive, activeTime, progress } = useActivityTracker();
  const { userProgress, fetchUserProgress } = useAchievementStore();
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [stats, setStats] = useState({
    totalReadings: 0,
    karmaLevel: '中立漆泊者',
    favoriteCard: null as any,
    favoriteCardDrawCount: 0,
    daysInVault: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 方案 3：重新驗證登入狀態（防止 OAuth callback 競態條件）
  useEffect(() => {
    console.log('[Dashboard] 🔍 驗證登入狀態...', {
      isInitialized,
      hasUser: !!user,
      userId: user?.id
    });

    // 如果尚未初始化，先初始化
    if (!isInitialized) {
      console.log('[Dashboard] ⏳ 尚未初始化，開始初始化...');
      initialize();
      return;
    }

    // 初始化完成後，檢查是否有使用者
    if (isInitialized && !user) {
      // 🔍 監控日誌：追蹤路由導向
      console.log('[Dashboard] 🔀 Auth check redirect', {
        timestamp: new Date().toISOString(),
        from: '/dashboard',
        to: '/auth/login',
        reason: 'User not authenticated',
        isInitialized
      });
      router.push('/auth/login');
      return;
    }

    console.log('[Dashboard] ✅ 登入狀態有效，使用者:', user?.email);
  }, [user, isInitialized, initialize, router]);

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      // 確保認證狀態已初始化且用戶存在
      if (!isInitialized || !user?.id) {
        console.log('[Dashboard] ⏳ 等待認證初始化...', {
          isInitialized,
          hasUser: !!user?.id
        });
        return;
      }

      console.log('[Dashboard] 📊 開始載入 Dashboard 資料...', {
        userId: user.id,
        userEmail: user.email,
        isOAuthUser: user.isOAuthUser
      });

      setIsLoading(true);

      try {
        // Get user's readings (使用正確的 API 回應格式)
        // NOTE: Temporarily handling 503 errors gracefully until completed_readings table is created
        let transformedReadings: Reading[] = [];
        let totalReadings = 0;

        try {
          const response = await readingsAPI.getUserReadings(user.id);

          // Transform API data to match component interface
          transformedReadings = response.readings.map((reading) => ({
            id: reading.id,
            date: reading.created_at,
            question: reading.question,
            cards: reading.cards_drawn || [], // Ensure cards is always an array
            spread_type: reading.spread_type,
            spread_template: reading.spread_template, // Preserve spread_template data
            interpretation: reading.interpretation || ''
          }));

          totalReadings = response.total_count;
        } catch (apiError: any) {
          // Gracefully handle 503 (service unavailable) - table doesn't exist yet
          if (apiError?.status === 503 || apiError?.status === 500) {
            console.info('Readings table not available yet - showing empty state');
            transformedReadings = [];
            totalReadings = 0;
          } else {
            throw apiError; // Re-throw other errors
          }
        }

        setRecentReadings(transformedReadings.slice(0, 5)); // Show only recent 5

        // Calculate stats from real data
        const daysInVault = user.created_at ?
        Math.floor((Date.now() - Date.parse(user.created_at)) / (1000 * 60 * 60 * 24)) :
        0;

        // Determine karma level based on readings count
        let karmaLevel = '新手流浪者';
        if (totalReadings >= 50) karmaLevel = '傳奇廢土智者';else
        if (totalReadings >= 20) karmaLevel = '經驗豐富占卜師';else
        if (totalReadings >= 10) karmaLevel = '好業力漂泊者';else
        if (totalReadings >= 5) karmaLevel = '中立漂泊者';

        // Get user's most drawn card from analytics
        let favoriteCard = null;
        let cardDrawCount = 0;
        try {
          const analytics = await analyticsAPI.getUserAnalytics();
          const mostDrawnCards = analytics.user_analytics.most_drawn_cards || [];

          if (mostDrawnCards.length > 0) {
            // Get the most frequently drawn card (first in the array)
            const mostDrawnCardId = mostDrawnCards[0];
            favoriteCard = await cardsAPI.getById(mostDrawnCardId);

            // Count how many times this card appears in all user's readings
            cardDrawCount = transformedReadings.reduce((count, reading) => {
              const cardsInReading = reading.cards_drawn || reading.cards || [];
              return count + cardsInReading.filter((c: any) => c.id === mostDrawnCardId || c === mostDrawnCardId).length;
            }, 0);
          }
        } catch (error) {
          console.error('Failed to load favorite card from analytics:', error);
        }

        setStats({
          totalReadings,
          karmaLevel,
          favoriteCard,
          favoriteCardDrawCount: cardDrawCount,
          daysInVault
        });

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set default empty state
        setRecentReadings([]);
        setStats({
          totalReadings: 0,
          karmaLevel: '新手流浪者',
          favoriteCard: null,
          daysInVault: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, isInitialized]);

  // 載入成就資料
  useEffect(() => {
    if (isInitialized && user) {
      fetchUserProgress();
    }
  }, [user, isInitialized, fetchUserProgress]);

  // 計算最近解鎖的成就（最多3個）
  const recentAchievements = useMemo(() => {
    return userProgress.
    filter((p) => p.status === 'UNLOCKED' || p.status === 'CLAIMED').
    filter((p) => p.unlocked_at).
    sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()).
    slice(0, 3);
  }, [userProgress]);

  // 顯示載入畫面（初始化中或資料載入中）
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">
            {!isInitialized ? '驗證認證狀態...' : '初始化 Pip-Boy 介面...'}
          </p>
        </div>
      </div>);

  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-4">
            <h1 className="text-2xl font-bold text-pip-boy-green">
              控制台 - {user?.name || 'Vault Dweller'}
            </h1>
            <p className="text-pip-boy-green/70 text-sm">
              Pip-Boy 個人資料管理系統
            </p>
          </div>

          {/* Activity Progress Card - Token 延長系統 */}
          <div className="mb-6">
            <ActivityProgressCard
              isActive={isActive}
              activeTime={activeTime}
              progress={progress} />

          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-2xl font-bold text-pip-boy-green">{stats.totalReadings}</div>
              <div className="text-pip-boy-green/70 text-xs">占卜總數</div>
            </div>

            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-sm font-bold text-pip-boy-green">{stats.karmaLevel}</div>
              <div className="text-pip-boy-green/70 text-xs">業力狀態</div>
            </div>

            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-2xl font-bold text-pip-boy-green">{stats.daysInVault}</div>
              <div className="text-pip-boy-green/70 text-xs">服務天數</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-8">
          <Button size="default" variant="outline"
          onClick={() => window.location.href = '/readings/new'}
          className="p-6 transition-all duration-200 group cursor-pointer">


            <div className="text-center">
              <PixelIcon name="spade" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">新占卜</h3>
              <p className="text-pip-boy-green/70 text-sm">
                開始一場全新的塔羅占卜會議
              </p>
            </div>
          </Button>

          <Button size="default" variant="outline"
          onClick={() => window.location.href = '/cards'}
          className="p-6 transition-all duration-200 group cursor-pointer">


            <div className="text-center">
              <PixelIcon name="library" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">卡牌圖書館</h3>
              <p className="text-pip-boy-green/70 text-sm">
                瀏覽所有可用的塔羅牌
              </p>
            </div>
          </Button>

          <Button size="default" variant="outline"
          onClick={() => window.location.href = '/profile'}
          className="p-6 transition-all duration-200 group cursor-pointer">


            <div className="text-center">
              <PixelIcon name="user-circle" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">個人檔案</h3>
              <p className="text-pip-boy-green/70 text-sm">
                管理你的 Vault Dweller 設定
              </p>
            </div>
          </Button>
        </div>

        {/* Recent Readings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="scroll-text" size={20} className="mr-2" decorative />最近占卜
            </h2>

            <div className="space-y-4">
              {recentReadings.length > 0 ?
              recentReadings.map((reading) =>
              <Button size="default" variant="outline"
              key={reading.id}
              onClick={() => router.push(`/readings/${reading.id}`)}
              className="w-full p-4 transition-all duration-200 cursor-pointer">

                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-pip-boy-green">
                        {reading.spread_template?.display_name || '占卜'}
                      </h3>
                      <span className="text-xs text-pip-boy-green/70">
                        {formatDate(reading.date)}
                      </span>
                    </div>

                    <p className="text-pip-boy-green/80 text-sm mb-3 italic">
                      "{reading.question}"
                    </p>

                    <div className="flex gap-2 mb-3">
                      {(reading.cards || []).slice(0, 3).map((card, index) =>
                  <div key={index} className="w-8 h-12 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex items-center justify-center">
                          <PixelIcon name="spade" size={16} decorative />
                        </div>
                  )}
                    </div>

                    <p className="text-pip-boy-green/70 text-xs line-clamp-2">
                      {reading.interpretation}
                    </p>
                  </Button>
              ) :

              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 text-center">
                  <PixelIcon name="spade" size={32} className="mb-3 mx-auto text-pip-boy-green opacity-50" decorative />
                  <p className="text-pip-boy-green/70 text-sm">
                    尚無占卜記錄。開始你的第一次占卜會議！
                  </p>
                  <Button size="xs" variant="outline"
                onClick={() => window.location.href = '/readings/new'}
                className="inline-block mt-3 px-4 py-2 border transition-colors cursor-pointer">


                    新占卜
                  </Button>
                </div>
              }
            </div>

            {recentReadings.length > 0 &&
            <Button size="sm" variant="link"
            onClick={() => window.location.href = '/readings'}
            className="inline-block mt-4 transition-colors cursor-pointer">


                → 查看所有占卜
              </Button>
            }
          </div>

          {/* Favorite Card & System Status */}
          <div>
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="star" size={20} className="mr-2" decorative />Dweller 狀態
            </h2>

            {/* Favorite Card - Temporarily simplified to fix React errors */}
            {stats.favoriteCard &&
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mb-6">
                <h3 className="text-sm font-bold text-pip-boy-green mb-3">最常抽到的牌</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 border-2 border-pip-boy-green/50 bg-pip-boy-green/10 rounded flex items-center justify-center">
                    <PixelIcon name="spade" size={24} decorative />
                  </div>
                  <div>
                    <p className="text-pip-boy-green text-sm font-bold">
                      {stats.favoriteCard.name}
                    </p>
                    <p className="text-pip-boy-green/70 text-xs">
                      已抽取 {stats.favoriteCardDrawCount} 次
                    </p>
                  </div>
                </div>
              </div>
            }

            {/* Recent Achievements */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-pip-boy-green flex items-center">
                  <PixelIcon name="trophy" size={16} className="mr-2" decorative />
                  最近獲得成就
                </h3>
                <Button size="xs" variant="link"
                onClick={() => router.push('/achievements')}
                className="transition-colors">

                  查看全部
                </Button>
              </div>

              {recentAchievements.length > 0 ?
              <div className="space-y-2">
                  {recentAchievements.map((progress) =>
                <Button size="icon" variant="outline"
                key={progress.id}
                onClick={() => router.push('/achievements')}
                className="w-full flex items-center gap-3 p-2 border transition-colors">

                      <div className="flex-shrink-0">
                        <PixelIcon
                      name={progress.achievement.icon_name || 'trophy'}
                      sizePreset="md"
                      variant="primary"
                      decorative />

                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-pip-boy-green text-xs font-semibold truncate">
                          {progress.achievement.name}
                        </div>
                        <div className="text-pip-boy-green/60 text-[10px]">
                          {progress.unlocked_at && new Date(progress.unlocked_at).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                      {progress.status === 'UNLOCKED' &&
                  <div className="flex-shrink-0">
                          <span className="text-[10px] text-pip-boy-green border border-pip-boy-green/50 px-2 py-0.5 rounded-sm">
                            待領取
                          </span>
                        </div>
                  }
                    </Button>
                )}
                </div> :

              <div className="text-center py-6 text-pip-boy-green/50 text-xs">
                  <PixelIcon name="trophy" sizePreset="lg" variant="muted" decorative />
                  <p className="mt-2">尚未解鎖任何成就</p>
                  <p className="text-[10px] mt-1">探索廢土來獲得成就吧！</p>
                </div>
              }
            </div>
          </div>
        </div>

        {/* Incomplete Sessions */}
        <div className="mb-8">
          <IncompleteSessionsList />
        </div>
      </div>
    </div>);

}