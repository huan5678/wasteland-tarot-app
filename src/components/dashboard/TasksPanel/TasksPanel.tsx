/**
 * TasksPanel Component
 * Main panel for daily/weekly tasks with tab switching and countdown timer
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PipBoyCard, PipBoyCardHeader, PipBoyCardTitle, PipBoyCardContent } from '@/components/ui/pipboy';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyTabs, PipBoyTabsList, PipBoyTabsTrigger, PipBoyTabsContent } from '@/components/ui/pipboy-tabs';
import { DailyTaskList } from './DailyTaskList';
import { WeeklyTaskList } from './WeeklyTaskList';
import { useTasksStore } from '@/stores/tasksStore';

export function TasksPanel() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const { dailyTasks, weeklyTasks, fetchDailyTasks, fetchWeeklyTasks } = useTasksStore();

  const [countdown, setCountdown] = useState<string>('');

  // Fetch tasks on mount
  useEffect(() => {
    fetchDailyTasks();
    fetchWeeklyTasks();
  }, [fetchDailyTasks, fetchWeeklyTasks]);

  // Calculate countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const taipei = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));

      let targetTime: Date;
      if (activeTab === 'daily') {
        // Next day at 00:00 UTC+8
        targetTime = new Date(taipei);
        targetTime.setDate(targetTime.getDate() + 1);
        targetTime.setHours(0, 0, 0, 0);
      } else {
        // Next Monday at 00:00 UTC+8
        targetTime = new Date(taipei);
        const daysUntilMonday = (8 - targetTime.getDay()) % 7 || 7;
        targetTime.setDate(targetTime.getDate() + daysUntilMonday);
        targetTime.setHours(0, 0, 0, 0);
      }

      const diff = targetTime.getTime() - taipei.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <PipBoyCard variant="elevated" className="h-full flex flex-col">
      <PipBoyCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelIcon name="list-check" sizePreset="sm" variant="primary" decorative />
            <PipBoyCardTitle>任務中心</PipBoyCardTitle>
          </div>

          {/* Reset Countdown */}
          <div className="flex items-center gap-2 bg-black/60 border border-pip-boy-green/40 px-3 py-1">
            <PixelIcon name="time" sizePreset="xs" variant="primary" decorative />
            <span className="text-xs font-mono text-pip-boy-green">
              重置倒數：{countdown}
            </span>
          </div>
        </div>

      </PipBoyCardHeader>

      <PipBoyCardContent className="flex-1 overflow-y-auto">
        <PipBoyTabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')}
        >
          <PipBoyTabsList className="mb-4">
            <PipBoyTabsTrigger value="daily" icon="calendar" className="flex-1">
              <span className="flex items-center gap-2">
                每日任務
                {dailyTasks && (
                  <span className="text-xs bg-black/60 px-2 py-0.5 rounded">
                    {dailyTasks.completed_count}/{dailyTasks.total_count}
                  </span>
                )}
              </span>
            </PipBoyTabsTrigger>
            
            <PipBoyTabsTrigger value="weekly" icon="calendar-week" className="flex-1">
              <span className="flex items-center gap-2">
                每週任務
                {weeklyTasks && (
                  <span className="text-xs bg-black/60 px-2 py-0.5 rounded">
                    {weeklyTasks.completed_count}/{weeklyTasks.total_count}
                  </span>
                )}
              </span>
            </PipBoyTabsTrigger>
          </PipBoyTabsList>

          <PipBoyTabsContent value="daily" className="min-h-0">
            <DailyTaskList />
          </PipBoyTabsContent>

          <PipBoyTabsContent value="weekly" className="min-h-0">
            <WeeklyTaskList />
          </PipBoyTabsContent>
        </PipBoyTabs>
      </PipBoyCardContent>
    </PipBoyCard>
  );
}
