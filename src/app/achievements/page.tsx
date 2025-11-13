import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '廢土成就 | 廢土塔羅 - 探索廢土，解鎖成就，獲得獎勵',
  description: '追蹤你在廢土塔羅中的成就進度，解鎖閱讀、社交、賓果、探索四大類成就。完成挑戰獲得業力點數、專屬稱號與視覺徽章獎勵。',
};

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useAchievementStore, AchievementCategory, UserAchievementProgress } from '@/lib/stores/achievementStore';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { PixelIcon } from '@/components/ui/icons';
import {
  AchievementCategoryFilter,
  AchievementGrid,
  AchievementDetailModal } from
'@/components/achievements';

/**
 * 成就系統主頁面
 *
 * 功能:
 * - JWT 認證保護
 * - 成就類別篩選
 * - 成就進度展示
 * - 成就獎勵領取
 * - 統計總覽
 *
 * 設計風格: Fallout/Wasteland
 */import { Button } from "@/components/ui/button";
export default function AchievementsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const {
    userProgress,
    summary,
    currentFilter,
    isLoading,
    error,
    isClaiming,
    fetchUserProgress,
    fetchSummary,
    setFilter,
    claimReward,
    clearError
  } = useAchievementStore();

  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievementProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 認證檢查
  useEffect(() => {
    if (isInitialized && !user) {
      // 🔍 監控日誌：追蹤路由導向
      console.log('[AchievementsPage] 🔀 Auth check redirect', {
        timestamp: new Date().toISOString(),
        from: '/achievements',
        to: '/auth/login',
        reason: 'User not authenticated',
        isInitialized
      });
      router.push('/auth/login');
    }
  }, [isInitialized, user, router]);

  // 載入成就資料
  useEffect(() => {
    if (user) {
      fetchUserProgress();
      fetchSummary();
    }
  }, [user, fetchUserProgress, fetchSummary]);

  // 處理類別篩選變更
  const handleFilterChange = (category: AchievementCategory | null) => {
    setFilter(category);
  };

  // 處理領取獎勵
  const handleClaimReward = async (code: string) => {
    const result = await claimReward(code);
    if (result) {
      setShowSuccessMessage(result.message);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  };

  // 處理卡片點擊
  const handleCardClick = (achievement: UserAchievementProgress) => {
    setSelectedAchievement(achievement);
    setIsModalOpen(true);
  };

  // 處理 Modal 關閉
  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAchievement(null), 300); // 延遲清除以確保動畫完成
  };

  // 搜尋過濾
  const filteredAchievements = useMemo(() => {
    if (!searchQuery.trim()) return userProgress;

    const query = searchQuery.toLowerCase().trim();
    return userProgress.filter((progress) => {
      const { achievement } = progress;
      return (
        achievement.name.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query) ||
        achievement.code.toLowerCase().includes(query));

    });
  }, [userProgress, searchQuery]);

  // 等待認證初始化
  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pip-boy-green mx-auto mb-4" />
          <p className="text-pip-boy-green">載入中...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-pip-boy-green tracking-wider mb-2">
              廢土成就
            </h1>
            <p className="text-terminal-green">
              探索廢土，完成挑戰，解鎖成就，獲得獎勵
            </p>
          </div>
        </header>

        {/* 統計總覽 */}
        {summary &&
        <div className="py-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* 總成就數 */}
            <div className="card-wasteland p-4 text-center border-2 border-pip-boy-green/30">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="apps" sizePreset="md" variant="primary" decorative />
              </div>
              <div className="text-2xl font-bold text-pip-boy-green">
                {summary.total_achievements}
              </div>
              <div className="text-xs text-wasteland-lighter mt-1">總成就</div>
            </div>

            {/* 已解鎖 */}
            <div className="card-wasteland p-4 text-center border-2 border-pip-boy-green/30">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="unlock" sizePreset="md" variant="success" decorative />
              </div>
              <div className="text-2xl font-bold text-pip-boy-green-bright">
                {summary.unlocked_count}
              </div>
              <div className="text-xs text-wasteland-lighter mt-1">已解鎖</div>
            </div>

            {/* 已領取 */}
            <div className="card-wasteland p-4 text-center border-2 border-pip-boy-green/30">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="check-circle" sizePreset="md" variant="info" decorative />
              </div>
              <div className="text-2xl font-bold text-vault-blue-light">
                {summary.claimed_count}
              </div>
              <div className="text-xs text-wasteland-lighter mt-1">已領取</div>
            </div>

            {/* 完成度 */}
            <div className="card-wasteland p-4 text-center border-2 border-pip-boy-green/30">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="chart" sizePreset="md" variant="warning" decorative />
              </div>
              <div className="text-2xl font-bold text-warning-yellow">
                {summary.completion_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-wasteland-lighter mt-1">完成度</div>
            </div>
          </motion.div>
        </div>
        }

        {/* 搜尋欄 */}
        <div className="py-6">
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto">

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PixelIcon name="search" sizePreset="sm" variant="muted" decorative />
            </div>
            <input
                type="text"
                placeholder="搜尋成就名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                w-full pl-10 pr-4 py-3
                bg-wasteland-dark border-2 border-metal-gray-light
                text-white placeholder:text-wasteland-lighter
                rounded-md
                focus:outline-none focus:border-pip-boy-green
                transition-colors
              " />








            {searchQuery && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="清除搜尋"
              >
                <PixelIcon name="close" sizePreset="xs" variant="muted" />
              </Button>
            )}
          </div>
          {searchQuery &&
            <p className="mt-2 text-sm text-wasteland-lighter">
              找到 {filteredAchievements.length} 個結果
            </p>
            }
        </motion.div>
      </div>

        {/* 類別篩選 */}
        <div className="py-6">
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}>

          <AchievementCategoryFilter
              currentFilter={currentFilter}
              onFilterChange={handleFilterChange} />

        </motion.div>
      </div>

        {/* 成就網格 */}
        <div className="py-6">
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}>

          {isLoading ?
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <PixelIcon
                  name="loader"
                  sizePreset="xl"
                  variant="primary"
                  animation="spin"
                  decorative />

                <p className="text-pip-boy-green mt-4">載入成就資料中...</p>
              </div>
            </div> :
            error ?
            <div className="card-wasteland p-8 text-center">
              <PixelIcon
                name="alert-triangle"
                sizePreset="xl"
                variant="error"
                animation="wiggle"
                className="mx-auto mb-4"
                decorative />

              <h3 className="text-lg font-semibold text-radiation-orange mb-2">
                載入失敗
              </h3>
              <p className="text-wasteland-lighter mb-4">{error}</p>
              <Button size="default" variant="outline"
              onClick={() => {
                clearError();
                fetchUserProgress();
              }}
              className="inline-flex items-center px-4 py-2 border rounded transition-colors">

                <PixelIcon name="refresh-cw" sizePreset="xs" decorative />
                <span className="ml-2">重試</span>
              </Button>
            </div> :

            <AchievementGrid
              achievements={filteredAchievements}
              onClaim={handleClaimReward}
              onCardClick={handleCardClick}
              isClaiming={isClaiming} />

            }
        </motion.div>
        </div>

        {/* 成功訊息提示 */}
        {showSuccessMessage &&
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">

            <div className="card-wasteland p-4 shadow-[0_0_20px_rgba(0,255,136,0.5)] border-pip-boy-green">
              <div className="flex items-center gap-3">
                <PixelIcon name="check-circle" sizePreset="md" variant="success" decorative />
                <p className="text-pip-boy-green font-semibold">
                  {showSuccessMessage}
                </p>
              </div>
            </div>
          </motion.div>
        }

        {/* 成就詳細資訊 Modal */}
        <AchievementDetailModal
          achievement={selectedAchievement}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onClaim={handleClaimReward}
          isClaiming={isClaiming} />

      </div>
    </div>);

}