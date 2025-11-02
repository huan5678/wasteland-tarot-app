/**
 * DailyTaskList Component
 * Displays list of daily tasks with progress tracking
 */

'use client';

import React from 'react';
import { useTasksStore } from '@/stores/tasksStore';
import { TaskItem } from './TaskItem';
import { PixelIcon } from '@/components/ui/icons';

export function DailyTaskList() {
  const { dailyTasks, isLoading, error, claimDailyTaskReward, isClaimingDaily } = useTasksStore();

  // Loading state
  if (isLoading && !dailyTasks) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <PixelIcon
            name="loader"
            sizePreset="lg"
            variant="primary"
            animation="spin"
            decorative
          />
          <p className="text-sm text-pip-boy-green/70">載入每日任務中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <PixelIcon
            name="alert-triangle"
            sizePreset="lg"
            variant="error"
            animation="wiggle"
            aria-label="錯誤"
          />
          <p className="text-sm text-pip-boy-green/70 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  // No data
  if (!dailyTasks) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-pip-boy-green/70">無每日任務資料</p>
      </div>
    );
  }

  const { tasks, completed_count, total_count } = dailyTasks;

  return (
    <div className="space-y-4">
      {/* Header with completion count */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <PixelIcon name="calendar" sizePreset="sm" variant="primary" decorative />
          <h3 className="text-sm font-semibold text-pip-boy-green uppercase">
            每日任務
          </h3>
        </div>
        <div className="text-sm text-pip-boy-green/70">
          已完成：
          <span className="font-bold text-pip-boy-green ml-1">
            {completed_count}/{total_count}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            type="daily"
            onClaimReward={claimDailyTaskReward}
            isClaiming={isClaimingDaily[task.id] || false}
          />
        ))}
      </div>

      {/* Completion Message */}
      {completed_count === total_count && (
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 flex items-center gap-3">
          <PixelIcon
            name="check-circle"
            sizePreset="md"
            variant="success"
            decorative
          />
          <div>
            <p className="text-sm font-semibold text-pip-boy-green">
              所有每日任務已完成！
            </p>
            <p className="text-xs text-pip-boy-green/70 mt-1">
              明天會有新的任務等待你
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
