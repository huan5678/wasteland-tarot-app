/**
 * KarmaLog Component
 * Displays Karma gain history with pagination
 *
 * Features:
 * - List of Karma logs with action type, amount, time
 * - Pagination support ("Load More" button)
 * - Terminal-style formatting
 * - Chinese translation for action types
 */

'use client';

import React from 'react';
import { useKarmaStore } from '@/stores/karmaStore';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// ============================================================================
// Action Type Translation Map
// ============================================================================
import { Button } from "@/components/ui/button";
const ACTION_TYPE_LABELS: Record<string, string> = {
  daily_login: '每日登入',
  complete_reading: '完成占卜',
  share_reading: '分享解讀',
  complete_task: '完成任務',
  milestone: '達成里程碑',
  achievement: '解鎖成就',
  social_interaction: '社交互動',
  system_reward: '系統獎勵'
};

function getActionTypeLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] || actionType;
}

// ============================================================================
// KarmaLog Component
// ============================================================================

export function KarmaLog() {
  const { logs, isLoading, error, currentPage, totalPages, fetchLogs } = useKarmaStore();

  // Loading state
  if (isLoading && logs.length === 0) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-6 rounded-lg">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) =>
          <div key={i} className="flex justify-between items-center border-b border-pip-boy-green/20 pb-3">
              <div className="h-4 bg-pip-boy-green/20 rounded w-1/3"></div>
              <div className="h-4 bg-pip-boy-green/20 rounded w-1/4"></div>
            </div>
          )}
        </div>
      </div>);

  }

  // Error state
  if (error) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-red-500 p-6 rounded-lg">
        <div className="text-red-500 font-mono">
          <div className="text-lg font-bold mb-2">[ ERROR ]</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>);

  }

  // No logs state
  if (logs.length === 0 && !isLoading) {
    return (
      <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green/50 p-6 rounded-lg">
        <div className="text-pip-boy-green/50 font-mono text-center">
          <div className="text-lg">[ NO LOGS ]</div>
          <div className="text-sm mt-2">尚無 Karma 獲得記錄</div>
        </div>
      </div>);

  }

  // Format relative time
  const formatRelativeTime = (isoDateString: string): string => {
    try {
      const date = new Date(isoDateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    } catch {
      return isoDateString;
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoading) {
      fetchLogs(currentPage + 1);
    }
  };

  return (
    <div className="bg-black/75 backdrop-blur-sm border-2 border-pip-boy-green p-6 rounded-lg">
      {/* Header */}
      <div className="border-b border-pip-boy-green/30 pb-3 mb-4">
        <h2 className="text-pip-boy-green font-mono text-xl font-bold tracking-wide">
          [ KARMA LOG ]
        </h2>
      </div>

      {/* Logs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {logs.map((log) =>
        <div
          key={log.id}
          className="flex justify-between items-start border-b border-pip-boy-green/20 pb-3 hover:bg-pip-boy-green/5 transition-colors px-2 -mx-2 rounded">

            {/* Left side: Action info */}
            <div className="flex-1">
              <div className="text-pip-boy-green font-mono text-sm font-bold">
                {getActionTypeLabel(log.action_type)}
              </div>
              {log.description &&
            <div className="text-pip-boy-green/70 font-mono text-xs mt-1">
                  {log.description}
                </div>
            }
              <div className="text-pip-boy-green/50 font-mono text-xs mt-1">
                {formatRelativeTime(log.created_at)}
              </div>
            </div>

            {/* Right side: Karma amount */}
            <div
            className="text-pip-boy-green font-mono text-lg font-bold ml-4"
            style={{
              textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
            }}>

              +{log.karma_amount}
            </div>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {currentPage < totalPages &&
      <div className="mt-4 text-center">
          <Button size="icon" variant="outline"
        onClick={handleLoadMore}
        disabled={isLoading}
        className="px-6 py-2 font-mono font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

            {isLoading ? '載入中...' : `載入更多 (${currentPage}/${totalPages})`}
          </Button>
        </div>
      }

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 136, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 136, 0.7);
        }
      `}</style>
    </div>);

}