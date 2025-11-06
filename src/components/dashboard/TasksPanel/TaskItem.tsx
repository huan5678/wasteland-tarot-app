/**
 * TaskItem Component
 * Individual task item with progress bar and reward claiming
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import type { Task } from '@/stores/tasksStore';

export interface TaskItemProps {
  task: Task;
  type: 'daily' | 'weekly';
  onClaimReward: (taskId: string) => Promise<boolean>;
  isClaiming?: boolean;
}

/**
 * TaskItem Component
 *
 * Displays a single task with:
 * - Task name and description
 * - Progress bar
 * - Reward amount
 * - Claim button (if completed) or progress indicator
 *
 * @example
 * ```tsx
 * <TaskItem
 *   task={task}
 *   type="daily"
 *   onClaimReward={handleClaim}
 *   isClaiming={false}
 * />
 * ```
 */
export function TaskItem({ task, type, onClaimReward, isClaiming = false }: TaskItemProps) {
  const handleClaim = async () => {
    const success = await onClaimReward(task.id);
    if (!success) {
      // Error handling is done in the store
      console.error('Failed to claim reward');
    }
  };

  // Calculate progress percentage
  const progressPercentage = task.progress_percentage;
  const canClaim = task.is_completed && !task.is_claimed;

  return (
    <div
      className={`
        border-2 border-pip-boy-green/50 bg-black/60 p-4
        transition-all duration-200
        ${canClaim ? 'border-pip-boy-green shadow-[0_0_15px_rgba(51,255,51,0.3)]' : ''}
      `}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-pip-boy-green uppercase">
            {task.name}
          </h4>
          <p className="text-xs text-pip-boy-green/60 mt-1">
            {task.description}
          </p>
        </div>

        {/* Reward Badge */}
        <div className="ml-4 flex items-center gap-1 bg-black/80 border border-pip-boy-green/40 px-2 py-1">
          <PixelIcon name="star" sizePreset="xs" variant="primary" decorative />
          <span className="text-xs font-bold text-pip-boy-green">
            +{task.karma_reward}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-3 bg-black/80 border border-pip-boy-green/40 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pip-boy-green-dark to-pip-boy-green transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
          {progressPercentage > 0 && (
            <div
              className="absolute inset-0 bg-pip-boy-green/20 animate-pulse-glow"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-pip-boy-green/60">
            {task.current_value} / {task.target_value}
          </span>
          <span className="text-xs font-semibold text-pip-boy-green">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center justify-end">
        {task.is_claimed ? (
          // Already claimed
          <div className="flex items-center gap-2 text-pip-boy-green">
            <PixelIcon name="check-circle" sizePreset="sm" variant="success" decorative />
            <span className="text-sm font-semibold uppercase">已完成</span>
          </div>
        ) : canClaim ? (
          // Can claim reward
          <Button
            variant={isClaiming ? "outline" : "default"}
            size="sm"
            onClick={handleClaim}
            disabled={isClaiming}
            className="min-w-[120px]"
          >
            {isClaiming ? (
              <span className="flex items-center gap-2">
                <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                領取中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PixelIcon name="gift" sizePreset="xs" decorative />
                領取獎勵
              </span>
            )}
          </Button>
        ) : (
          // Not completed yet
          <div className="flex items-center gap-2 text-pip-boy-green/60">
            <PixelIcon name="progress" sizePreset="sm" variant="muted" decorative />
            <span className="text-sm uppercase">進行中</span>
          </div>
        )}
      </div>
    </div>
  );
}
